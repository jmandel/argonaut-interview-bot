## SMART Permission Tickets -- Comprehensive Specification Extract

### 1. What Permission Tickets Are

A Permission Ticket is an issuer-signed, sender-constrained JWT that acts as a portable authorization grant. It allows a client application to present proof of authorization at any eligible Data Holder (FHIR server) without requiring the issuer to know where the subject has received care. No user login is required at the Data Holder.

**JWT Structure.** Every Permission Ticket is a signed JWT. The JWT header includes `alg` (ES256 recommended, RS256 also supported) and `kid` (key ID for key rotation). The payload contains:

Top-level claims (the "security envelope"):
- `iss` (required, string): Issuer URL -- the Trusted Issuer who minted the ticket
- `sub` (required, string): Issuer-defined subject of the authorization grant. This is issuer-local and opaque -- it identifies the authorization grant, not the client. Examples from the spec: "grant-uc1-patient-access", "grant-uc3-pubhealth-case999"
- `aud` (required, string or string[]): Audience -- the eligible Data Holder URL(s) or a trust framework identifier (e.g., "https://tefca.hhs.gov" or "https://hospital-a.com")
- `exp` (required, integer): Expiration timestamp (Unix seconds)
- `iat` (optional, integer): Issued-at timestamp
- `jti` (optional, string): Unique ticket identifier. Required when `revocation` is present.
- `ticket_type` (required, URI string): Identifies the ticket's schema and processing rules. Each use case has a canonical ticket_type URI.
- `cnf` (optional, object): Confirmation claim per RFC 7800. Contains `jkt` -- the JWK Thumbprint (RFC 7638) of the authorized client's public key.
- `revocation` (optional, object): Contains `url` (CRL URL) and `rid` (revocation identifier, opaque, max 24 chars).

Structured authorization claims:
- `authorization` (required, object): Contains three sub-objects:
  - `subject` (required): Identifies whose data the ticket authorizes. Always includes `type` (one of "match", "identifier", "reference") and then mode-specific fields.
  - `access` (required): Defines what access is authorized. Contains `scopes` (SMART scope strings), and optionally `periods`, `jurisdictions`, `organizations`.
  - `requester` (optional): The requesting agent on whose behalf the access is sought. A FHIR resource fragment (Practitioner, PractitionerRole, RelatedPerson, or Organization) with name, identifiers, telecom, etc.

Business-specific claims:
- `details` (optional, object): Schema is defined by the `ticket_type` URI. Contains ticket-type-specific fields like `condition` (a SNOMED Coding), `case`, `study`, `referral`, `claim`, `reason`, `request`, `basis`, `verifiedAt`, `jurisdiction`, `concern`, `service`. Absent when the ticket type has no business-specific fields beyond the common authorization claims.

The FHIR Shorthand logical model (PermissionTicket.fsh) formalizes all of these as a StructureDefinition. Key cardinalities: `iss`, `sub`, `exp`, `ticket_type` are 1..1; `aud` is 1..*; `cnf`, `revocation`, `details` are 0..1; `authorization` is 1..1; within authorization, `subject` and `access` are 1..1, `requester` is 0..1.

### 2. How the Protocol Works

**Transport mechanism.** Permission Tickets ride inside the existing SMART Backend Services token request. The spec profiles RFC 7523 (JWT Bearer for OAuth 2.0 client authentication). The client_assertion JWT serves two roles simultaneously: (a) it authenticates the client (standard SMART Backend Services), and (b) it acts as the cryptographic presentation envelope for one or more Permission Tickets.

**Step-by-step flow:**

Step 1 -- Context Established and Ticket Minting:
A trigger event occurs (referral, case report, patient authorization, consent). The Trusted Issuer verifies the context and identity. The issuer mints a Permission Ticket JWT, signs it with the issuer's private key (published at `{iss}/.well-known/jwks.json`), and delivers it to the client application. The issuance protocol between client and issuer is out of scope for this spec.

Step 2 -- Client Constructs and Sends Token Request:
The client generates a client_assertion JWT with these claims:
- `iss` and `sub`: Both set to the Client ID URL (e.g., "https://app.client.id")
- `aud`: The Data Holder's token endpoint URL (e.g., "https://network.org/token")
- `jti`: Unique assertion ID
- `iat`, `exp`: Timestamps
- `permission_tickets`: An array of one or more signed JWT strings (the Permission Tickets)
- `permission_ticket_profile` (optional for single-ticket, required for multi-ticket): The composition profile URI

The client signs this assertion with its own private key and sends it to the Data Holder's token endpoint:

```
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJ... (the signed client assertion containing tickets)
&scope=patient/Observation.rs
```

The client assertion header may include a `trust_chain` (for OpenID Federation dynamic trust), allowing the Data Holder to verify the client without pre-registration.

Step 3 -- Data Holder Validation (Two Layers):

Layer 1 -- Client Authentication (standard SMART Backend Services):
- Verify the client_assertion signature using the client's registered/federated public key
- Ensure the client is registered and active

Layer 2 -- Ticket Validation:
- Extract the `permission_tickets` array from the assertion
- If multiple tickets, read `permission_ticket_profile` from the assertion and select composition rules. Otherwise, select processing rules based on the ticket's `ticket_type`.
- For each ticket:
  - Verify Signature: Use the issuer's (`iss`) published public key from their JWKS endpoint
  - Verify Trust: Confirm the `iss` is in the Data Holder's trusted issuer list
  - Verify Type: `ticket_type` must be present and recognized
  - Verify Binding: If `cnf` is present, compute the JWK Thumbprint of the key that signed the client_assertion and compare it to the ticket's `cnf.jkt`. Reject on mismatch.
  - Verify Audience: The Data Holder's base URL must match one of the enumerated `aud` values, or the Data Holder must be a verified participant in the referenced trust framework.
  - Verify Expiration: Reject if expired
  - If `revocation` is present: verify `jti` is also present; fetch/check the CRL at `revocation.url`; reject if `revocation.rid` appears in the CRL (respecting timestamp suffixes). Fail-closed if CRL cannot be retrieved and no valid cache exists.
  - Resolve Subject: Match the `authorization.subject` using the declared `type` mode

Step 4 -- Access Calculation and Token Issuance:
Granted access = intersection of:
1. Requested scopes (from the `scope` parameter in the token request)
2. Ticket access constraints (from `authorization.access`)
3. Client registration (scopes the client is permitted to request)

If the intersection yields no valid access, return `invalid_scope` error. Otherwise, issue an access token. If access constraints (periods, jurisdictions, organizations) cannot be fully enforced at token issuance, the authorization server carries the normalized constraint set forward in the access token or via token introspection so the resource server can enforce them.

Step 5 -- Resource Access:
The client uses the issued access token to make FHIR API calls (e.g., `GET /Patient/123/Immunization`). The resource server enforces any remaining constraints.

**Client registration models.** The spec is designed so client identity does not need to be universally understood. Three compatible models: OpenID Federation 1.0 (trust_chain in client_assertion header), UDAP (signed metadata via trusted CA), and manual/pre-registration.

### 3. Use Cases

The spec defines seven single-ticket use case profiles, each with its own `ticket_type` URI, required/optional fields, and business semantics.

**UC1: Network-Mediated Patient Access**
ticket_type: `https://smarthealthit.org/permission-ticket-type/network-patient-access-v1`

Scenario: A patient uses a high-assurance Digital ID wallet (e.g., Clear) to authorize an app to fetch their data from multiple hospitals across a network. The issuer is the identity/wallet provider. The ticket audience is typically a trust framework (e.g., "https://network.org") so it works at any participating Data Holder.

Subject: type="match" with demographic traits (Patient resource fragment: name, birthDate, optionally identifiers, telecom, address). The Data Holder performs demographic matching to find the patient.
Requester: None (the patient/app is implicitly the requester).
Details: None.
Access: `scopes` required (e.g., ["patient/Immunization.rs", "patient/AllergyIntolerance.rs"]).
cnf: Required -- issuer has a direct relationship with the client app.

From the example JWT (uc1-ticket.jwt): issuer="https://trusted-issuer.org", subject matched by name "John Smith" DOB "1980-01-01", scopes limited to Immunization and AllergyIntolerance read, audience="https://network.org" (trust framework), cnf.jkt bound to a specific client key.

**UC2: Authorized Representative (Proxy)**
ticket_type: `https://smarthealthit.org/permission-ticket-type/authorized-representative-v1`

Scenario: An adult daughter accesses her elderly mother's records. The relationship is verified by the Trusted Issuer (not the hospital). This is proxy access where the representative relationship is externally attested.

Subject: type="identifier" with a business identifier (MPI ID). In the example: system="https://national-mpi.net", value="pt-555".
Requester: RelatedPerson with name ("Jane Doe"), telecom (email), and relationship coding (HL7 v3 RoleCode "DAU" = Daughter).
Details: `basis` = "patient-designated" (the legal/policy basis for the representation), `verifiedAt` = ISO timestamp of when the relationship was verified, `jurisdiction` = optional array of states (e.g., [{state: "IL"}]).
Access: `scopes` = ["patient/*.rs"] (broad read access).
cnf: Required.

**UC3: Public Health Investigation**
ticket_type: `https://smarthealthit.org/permission-ticket-type/public-health-investigation-v1`

Scenario: A hospital creates a Case Report for a notifiable condition. The Public Health Agency (PHA) uses a permission ticket (possibly derived from or accompanying the case report) to query the hospital for follow-up data.

Subject: type="reference" with a local resource ID (e.g., resourceType="Patient", id="local-patient-123"). The Data Holder resolves this directly.
Requester: Organization with name ("State Dept of Health"), identifier (URI), and type coding (HL7 organization-type "govt").
Details: `condition` = SNOMED Coding (e.g., 56717001 "Tuberculosis"), `case` = Reference by identifier to the PHA's case (e.g., system="https://doh.wa.gov/cases", value="CASE-2024-999").
Access: `scopes` = ["patient/*.rs"], `periods` = [{start: "2025-01-01", end: "2026-01-01"}] (time-bounded).
cnf: Optional (B2B; aud + client auth sufficient).

Note: In the example, issuer and audience are both "https://hospital-a.com" -- the hospital issued the ticket to itself (triggered by the case report), allowing the PHA's client to redeem it at that same hospital.

**UC4: Social Care (CBO) Referral**
ticket_type: `https://smarthealthit.org/permission-ticket-type/social-care-referral-v1`

Scenario: A food bank volunteer (no NPI, no user account at the hospital) needs to update a referral status. The referring EHR issues a ticket that grants limited write access to the specific referral resources.

Subject: type="reference" with a FHIR reference string (e.g., "Patient/123").
Requester: PractitionerRole with contained resources -- a Practitioner ("Alice Volunteer", email) and an Organization ("Downtown Food Bank") linked via internal references (#p1, #o1).
Details: `concern` = SNOMED Coding (733423003 "Food insecurity"), `referral` = Reference to the ServiceRequest with both a FHIR reference ("ServiceRequest/555") and a business identifier.
Access: `scopes` = ["patient/ServiceRequest.rsu", "patient/Task.rsu"] -- notably includes "u" (update) in addition to read/search. This is the only example with write access.
cnf: Optional (B2B).

**UC5: Payer Claims Adjudication**
ticket_type: `https://smarthealthit.org/permission-ticket-type/payer-claims-adjudication-v1`

Scenario: A payer requests clinical documents to support adjudication of a specific claim. The provider issues the ticket.

Subject: type="reference" (e.g., "Patient/456").
Requester: Organization with NPI identifier (system="http://hl7.org/fhir/sid/us-npi", value="9876543210") and name ("Blue Payer Inc").
Details: `service` = SNOMED Coding (80146002 "Appendectomy"), `claim` = Reference by identifier (system="http://payer.com/claims", value="CLAIM-2024-XYZ").
Access: `scopes` = ["patient/DocumentReference.rs", "patient/Procedure.rs"] -- limited to document references and procedures relevant to the claim.
cnf: Optional (B2B).

**UC6: Research Study**
ticket_type: `https://smarthealthit.org/permission-ticket-type/research-study-v1`

Scenario: A patient consents to a research study. A consent platform (not the hospital) mints a ticket proving the consent exists. The researcher's app presents this ticket to the hospital to access the patient's data for the study, without needing to be a "user" at the hospital.

Subject: type="identifier" with an MRN (e.g., value="MRN-123").
Requester: Organization (research institute) with name and identifier.
Details: `condition` = SNOMED Coding (363358000 "Malignant tumor of lung"), `study` = Reference by identifier (system="https://clinicaltrials.gov", value="NCT-12345").
Access: `scopes` = ["patient/*.rs"], `periods` = [{start: "2020-01-01", end: "2025-01-01"}] -- limited to a 5-year clinical window.
cnf: Required (issuer has direct relationship with client).

Note the issuer is "https://consent-platform.org" and audience is "https://hospital.com" -- demonstrating a third-party consent platform issuing tickets redeemable at a specific hospital.

**UC7: Provider-to-Provider Consult**
ticket_type: `https://smarthealthit.org/permission-ticket-type/provider-consult-v1`

Scenario: A specialist requests data from the referring provider's EHR. The referring EHR issues a ticket.

Subject: type="reference" (e.g., "Patient/999").
Requester: Practitioner with NPI identifier (1112223333) and name ("A. Heart").
Details: `reason` = SNOMED Coding (49436004 "Atrial fibrillation"), `request` = Reference to a ServiceRequest with both a FHIR reference and business identifier.
Access: `scopes` = ["patient/*.rs"] (broad read).
cnf: Optional (B2B; "strictly better than status quo even without key binding").

### 4. Trust Establishment

**Issuer trust.** Data Holders maintain a list of trusted issuers. When validating a ticket, the Data Holder checks that the `iss` value is in its trusted issuer list. If not, the ticket is rejected with "Ticket issuer not trusted: {iss}".

**Issuer key publication.** Issuers publish their public signing keys at `{iss}/.well-known/jwks.json`. Data Holders use these to verify ticket signatures and should cache them with appropriate TTL.

**Audience validation (two modes):**
- Enumerated Recipients: `aud` is a specific URL or array of URLs. The Data Holder's base URL must exactly match one of the values.
- Trust Framework: `aud` is a trust framework identifier (e.g., "https://tefca.hhs.gov"). The Data Holder must be a verified participant in that framework. Verification mechanisms are trust-framework-specific (e.g., the Data Holder's Entity ID appears in the framework's federation).

**Client authentication models.** The spec explicitly supports three, all compatible with the architecture:
- OpenID Federation 1.0: Client includes a `trust_chain` in the header of its client_assertion. The Data Holder verifies via a common Trust Anchor -- no pre-registration needed.
- UDAP: Clients present signed metadata using certificates from a trusted CA.
- Manual Registration: Direct key exchange out of band.

The spec emphasizes that client identity does not need to be universally understood. The Permission Ticket carries the authorization context; the client only needs to prove it holds the key (optionally) bound to the ticket. Client-to-issuer trust and the issuance protocol are explicitly out of scope.

**Governance.** The spec does not define trust framework governance or membership validation procedures. It references trust frameworks as an abstraction but leaves the specifics to implementations and frameworks like TEFCA.

### 5. Key Technical Details

**Subject Resolution Modes:**
- `match`: Data Holder performs demographic matching. The ticket's `authorization.subject.traits` contains a Patient resource fragment with name, birthDate, identifiers, telecom, address. Fields `id`, `reference`, and `identifier` (the top-level one) are prohibited. Zero or more-than-one matches result in rejection.
- `identifier`: Data Holder looks up by business identifier (MRN, MPI ID). The ticket's `authorization.subject.identifier` array contains system/value pairs. Fields `traits`, `id`, `reference` are prohibited.
- `reference`: Data Holder resolves a local resource reference directly. Uses `authorization.subject.reference` (e.g., "Patient/123") or `authorization.subject.id` (e.g., "local-patient-123"). Fields `traits` and `identifier` are prohibited.

Each mode enforces strict field constraints -- populating prohibited fields for the declared type results in rejection ("Subject type inconsistent with populated fields").

**Key Binding (cnf):**
When `cnf.jkt` is present, the Data Holder computes the JWK Thumbprint (RFC 7638) of the public key used to verify the client_assertion signature and compares it to `cnf.jkt`. Mismatch means rejection. This cryptographically ensures the ticket can only be redeemed by the intended client. When `cnf` is absent, the Data Holder relies on `aud` validation and standard client authentication for the trust boundary. `cnf` requirements vary by ticket type: Required for UC1, UC2, UC6 (issuer has direct client relationship). Optional for UC3, UC4, UC5, UC7 (B2B flows where the issuer may not know the recipient's client key at minting time).

**Revocation:**
Tickets may include a `revocation` claim with `url` (CRL URL) and `rid` (opaque revocation identifier). When present, `jti` must also be present. The CRL is a JSON file with fields: `kid` (signing key ID), `method` ("rid"), `ctr` (monotonic counter), `rids` (array of revoked rid values, optionally with `.timestamp` suffix). The timestamp suffix allows revoking only tickets issued before a certain time. Issuers generate `rid` using a one-way transformation: `rid = base64url(hmac-sha-256(issuer_secret || kid, ticket_jti)[0:8])`. Data Holders must fail-closed if the CRL cannot be retrieved and no valid cache exists. Issuers may use multiple CRL URLs to group tickets by category, preventing cross-type correlation.

**Ticket Composition (Multi-Ticket):**
Multi-ticket composition is informative/optional in this version. A client may present multiple tickets in the `permission_tickets` array and must include `permission_ticket_profile` in the client_assertion. Two example composition profiles are described:
- Identity + Designated Representative: Ticket 1 (from Identity Provider, e.g., Clear) provides verified requester identity. Ticket 2 (from Trusted Issuer) provides subject, access, and a `requesterReference` in its `details` that links to the requester's identifier in Ticket 1. The Data Holder validates both independently, then confirms the cross-reference.
- Base + Sensitive Category: A network-level ticket provides baseline access; a specialized-authority ticket extends access to sensitive categories.

**Access Constraint Algebra:**
Different dimensions combine conjunctively (AND): returned data must satisfy every present constraint dimension. Multiple values within the same dimension combine disjunctively (OR). An absent dimension means no restriction. Example: jurisdictions [{state: "CA"}, {state: "NY"}] AND organizations [{npi: "123"}] means data from (CA or NY) and from NPI 123.

**Expiration Recommendations:**
- Interactive/real-time: 1-4 hours
- Batch processing: 24 hours
- Standing authorization: up to 1 year (with revocation)

**Long-lived access:** Two approaches: (1) refresh via issuer (periodic re-issuance), or (2) long-lived tickets with revocation support. Approach 2 is suited for cases where re-issuance is high-friction (e.g., in-person identity verification).

**Reusability:** Tickets are reusable until expiration or revocation. Data Holders are not required to enforce single-use semantics.

**Signing:** ES256 (ECDSA P-256 + SHA-256) is recommended. RS256 also supported. Header must include `alg` and `kid`.

**Error Responses:** The spec defines a comprehensive error table. All ticket validation failures return OAuth 2.0 error responses. Key error codes: `invalid_request` for missing tickets or missing profile; `invalid_grant` for signature failures, trust failures, binding mismatches, audience mismatches, expired tickets, revoked tickets, unresolvable subjects, unsupported constraints; `invalid_scope` for empty scope intersection.

### 6. What the Spec Does NOT Cover

The spec explicitly declares these as out of scope or deferred:

- How a ticket issuer verifies real-world facts before minting a ticket (e.g., how does the issuer confirm the patient's identity, the representative relationship, or the consent?)
- Trust framework governance or membership validation procedures (how does a Data Holder verify it is a member of "https://tefca.hhs.gov"?)
- User-facing consent or authorization UX (no UI flows are defined)
- Ticket issuance protocols between clients and issuers (how does the client request and receive a ticket from the issuer?)
- A universal schema for all possible use cases (each ticket_type defines its own `details` schema)
- Multi-ticket composition is informative only in this version -- outside minimum conformance requirements unless a profile explicitly requires it
- Client ID format and registration details (determined by chosen registration model)
- How Data Holders enforce constraints at the resource server level when they cannot be fully enforced at token issuance (the spec says the constraint set must be carried forward, but does not define the mechanism)
- The relationship between the ticket's `sub` claim and any real-world entity -- it is issuer-local and opaque

### 7. Decoded Example Tickets

All examples use ES256 signing with kid="nvOGRCsTz2QIQLsbl0ZQ_ux0tfyh5iave-jvNsANWv8".

**Example Client Assertion (example-client-assertion.jwt):**
- iss/sub: "https://app.client.id" (client identifies itself)
- aud: "https://network.org/token" (the Data Holder's token endpoint)
- jti: "assertion-jti-123"
- iat: 1772827301, exp: 1772827601 (5-minute validity)
- permission_ticket_profile: "https://smarthealthit.org/permission-ticket-profile/network-patient-access-v1"
- permission_tickets: array containing one embedded ticket JWT (a UC1-type ticket with subject type="reference", resourceType="Patient", id="123", scopes=["patient/*.rs"])
- The header includes a `trust_chain` array with three placeholder entity statements (demonstrating OpenID Federation support)

**UC1 ticket (uc1-ticket.jwt) -- Network-Mediated Patient Access:**
- iss: "https://trusted-issuer.org", aud: "https://network.org" (trust framework audience)
- sub: "grant-uc1-patient-access"
- ticket_type: network-patient-access-v1
- cnf.jkt present (key-bound)
- Subject: type="match", traits = Patient with name "John Smith", birthDate "1980-01-01"
- Access: scopes = ["patient/Immunization.rs", "patient/AllergyIntolerance.rs"]
- No requester, no details

**UC2 ticket (uc2-ticket.jwt) -- Authorized Representative:**
- iss: "https://trusted-issuer.org", aud: "https://network.org"
- sub: "grant-uc2-representative"
- ticket_type: authorized-representative-v1
- cnf.jkt present
- Subject: type="identifier", Patient with identifier system="https://national-mpi.net", value="pt-555"
- Requester: RelatedPerson "Jane Doe", email "jane.doe@example.com", relationship=DAU (Daughter)
- Access: scopes = ["patient/*.rs"]
- Details: basis="patient-designated", verifiedAt="2026-03-06T15:04:05Z", jurisdiction=[{state: "IL"}]

**UC3 ticket (uc3-ticket.jwt) -- Public Health Investigation:**
- iss: "https://hospital-a.com", aud: "https://hospital-a.com" (same -- hospital issued to itself)
- sub: "grant-uc3-pubhealth-case999"
- ticket_type: public-health-investigation-v1
- No cnf (B2B, optional)
- Subject: type="reference", Patient id="local-patient-123"
- Requester: Organization "State Dept of Health", identifier="https://doh.state.gov", type=govt
- Access: scopes=["patient/*.rs"], periods=[{start:"2025-01-01", end:"2026-01-01"}]
- Details: condition=56717001 Tuberculosis, case=CASE-2024-999 from doh.wa.gov

**UC4 ticket (uc4-ticket.jwt) -- Social Care Referral:**
- iss: "https://referring-ehr.org", aud: "https://referring-ehr.org"
- sub: "grant-uc4-referral-555"
- ticket_type: social-care-referral-v1
- No cnf
- Subject: type="reference", reference="Patient/123"
- Requester: PractitionerRole with contained Practitioner "Alice Volunteer" (alice@foodbank.org) and Organization "Downtown Food Bank"
- Access: scopes=["patient/ServiceRequest.rsu", "patient/Task.rsu"] (includes update permission)
- Details: concern=733423003 Food insecurity, referral=ServiceRequest/555 (REF-555)

**UC5 ticket (uc5-ticket.jwt) -- Payer Claims Adjudication:**
- iss: "https://provider.com", aud: "https://provider.com"
- sub: "grant-uc5-claim-xyz"
- ticket_type: payer-claims-adjudication-v1
- No cnf
- Subject: type="reference", reference="Patient/456"
- Requester: Organization "Blue Payer Inc" with NPI 9876543210
- Access: scopes=["patient/DocumentReference.rs", "patient/Procedure.rs"]
- Details: service=80146002 Appendectomy, claim=CLAIM-2024-XYZ

**UC6 ticket (uc6-ticket.jwt) -- Research Study:**
- iss: "https://consent-platform.org", aud: "https://hospital.com" (third-party issuer, specific hospital audience)
- sub: "grant-uc6-study-proto22"
- ticket_type: research-study-v1
- cnf.jkt present
- Subject: type="identifier", Patient identifier value="MRN-123" (no system specified)
- Requester: Organization "Oncology Research Institute"
- Access: scopes=["patient/*.rs"], periods=[{start:"2020-01-01", end:"2025-01-01"}]
- Details: condition=363358000 Malignant tumor of lung, study=NCT-12345 from clinicaltrials.gov

**UC7 ticket (uc7-ticket.jwt) -- Provider-to-Provider Consult:**
- iss: "https://referring-ehr.org", aud: "https://referring-ehr.org"
- sub: "grant-uc7-consult-req111"
- ticket_type: provider-consult-v1
- No cnf
- Subject: type="reference", reference="Patient/999"
- Requester: Practitioner "A. Heart" with NPI 1112223333
- Access: scopes=["patient/*.rs"]
- Details: reason=49436004 Atrial fibrillation, request=ServiceRequest/ref-req-111

**Patterns across the examples:**
- UC1 and UC2 use trust-framework audiences ("https://network.org") -- portable across a network
- UC3, UC4, UC5, UC7 use single-organization audiences where iss==aud -- the issuer is also the Data Holder
- UC6 has a third-party issuer (consent platform) with a specific hospital audience
- Only UC1, UC2, and UC6 include cnf (key binding) -- all cases where the issuer has a direct relationship with the client
- UC3 and UC6 use time-bounded periods constraints
- UC4 is the only example with write/update permissions (the "u" in "rsu")
- Subject resolution varies: UC1 uses demographic matching, UC2 and UC6 use identifier lookup, UC3 uses id-based reference, UC4/UC5/UC7 use FHIR reference strings

### Canonical ticket_type URIs (complete list):

| Use Case | ticket_type URI |
|----------|----------------|
| UC1 | https://smarthealthit.org/permission-ticket-type/network-patient-access-v1 |
| UC2 | https://smarthealthit.org/permission-ticket-type/authorized-representative-v1 |
| UC3 | https://smarthealthit.org/permission-ticket-type/public-health-investigation-v1 |
| UC4 | https://smarthealthit.org/permission-ticket-type/social-care-referral-v1 |
| UC5 | https://smarthealthit.org/permission-ticket-type/payer-claims-adjudication-v1 |
| UC6 | https://smarthealthit.org/permission-ticket-type/research-study-v1 |
| UC7 | https://smarthealthit.org/permission-ticket-type/provider-consult-v1 |

### Canonical profile URIs (same pattern, replacing "ticket-type" with "ticket-profile"):

Each has a corresponding profile URI at `https://smarthealthit.org/permission-ticket-profile/{name}-v1`. For single-ticket flows, the profile is 1:1 with the ticket_type and `permission_ticket_profile` may be omitted from the client assertion.