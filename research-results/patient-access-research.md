## 1. Patients Accessing Their Own Health Records

### The Patient Portal Experience Today

**MyChart dominance and the N-portal problem.** Epic's MyChart is the de facto standard, but patients who see providers across multiple health systems end up with separate portal accounts at each one. As of 2024, **59% of individuals nationally had multiple online medical records or portals**, up from 50% in 2023 ([ASTP Health IT Data Brief, 2024](https://healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024/)). This is the "N-portal problem": a patient seeing a PCP at one system, a specialist at another, and getting labs at a third has three separate logins, three separate data silos. Epic offers a "Link My Accounts" feature and "Share Everywhere" for temporary sharing, but these require manual action per system and don't solve the underlying fragmentation ([MyChart Sharing Your Medical Record](https://www.mychart.org/Sharing-Your-Medical-Record)).

**Adoption rates.** Overall, 65% of individuals were offered and accessed their online medical records in 2024. Among those with MyChart specifically, studies show roughly 61% activation rates, with 54% logging at least one session. But adoption is sharply unequal: nonusers cite lack of awareness (59%) and registration difficulties (32%). Portal engagement is significantly lower among patients 65+, Black patients, and non-English speakers ([AJMC Portal Engagement Study](https://www.ajmc.com/view/insights-into-patient-portal-engagement-leveraging-observational-electronic-health-data); [JMIR MyChart Study](https://www.jmir.org/2025/1/e66353)).

### Drop-off Rates for Health App Connections

**Third-party aggregator app usage is extremely low.** Only **7% of individuals used a portal-organizing app** (like Apple Health Records or CommonHealth) to combine medical information from different portals in 2024, though this is up from just 2% in 2022 ([ASTP Data Brief](https://healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024/)). App-based portal access overall rose from 38% (2020) to 57% (2024), but that is mostly patients using their provider's own app, not third-party aggregators.

The fundamental drop-off pattern: the user has to (1) discover the app, (2) find their provider's FHIR endpoint, (3) authenticate through the provider's OAuth flow (which redirects to the portal login), (4) understand and approve scope consent screens, and (5) complete the connection. Each step loses users. The 7% adoption figure tells the story.

### SMART on FHIR Patient Access UX

In a **standalone patient launch**, the flow works like this: the patient opens a third-party app, selects their healthcare provider from a list, gets redirected to the provider's authorization server (typically the portal login page), authenticates, reviews and approves the requested data scopes, and is redirected back to the app with an authorization code that gets exchanged for an access token ([SMART App Launch v2.2.0](https://build.fhir.org/ig/HL7/smart-app-launch/app-launch.html)).

The user experience pain points are concrete:
- The patient must know which health system to connect to (provider discovery)
- They must have active portal credentials at that system
- The OAuth consent screen is often confusing or overly broad
- They must repeat this process for every provider they see
- Token expiration means periodic re-authentication

### 21st Century Cures Act / ONC Patient Access Rule

The Cures Act Final Rule did several concrete things:
- **Banned information blocking** by providers, health IT developers, and health information exchanges/networks, with up to **$1 million per violation** penalties for IT developers/networks ([OIG Information Blocking](https://oig.hhs.gov/reports/featured/information-blocking/))
- **Required APIs** (specifically FHIR-based) for patient access to their electronic health information (EHI) without special effort
- **Mandated open notes** (clinician notes visible to patients)
- Defined eight exceptions to information blocking (e.g., preventing harm, privacy, security)

**Enforcement has been slow but is accelerating.** From 2021 to late 2025, despite roughly 1,300-1,600 complaints filed through OIG's portal, there were no public enforcement actions. In October 2025, HHS-OIG and ASTP jointly issued an enforcement alert. In early 2026, ASTP announced it was issuing notices of investigation against health IT developers. The first CMPs are expected imminently ([Holland & Knight Analysis](https://www.hklaw.com/en/insights/publications/2026/02/the-wait-is-over-information-blocking-enforcement-is-officially-here); [HHS Crackdown Analysis](https://www.healthcarelawinsights.com/2026/03/hhs-crackdown-on-information-blocking-new-era-of-enforcement-fines-and-compliance-risks-for-healthcare-entities/)).

A December 2025 proposed rule (HTI-5) further tightens information blocking exceptions to close "technical or contractual loopholes."

### The "All-or-Nothing" Scope Problem

Traditional SMART on FHIR scopes are resource-type-level: `patient/Observation.read` grants access to ALL observations (labs, vitals, social history, mental health screenings). A patient who wants to share lab results but not their PHQ-9 depression screening score cannot express that distinction.

**SMART v2 (App Launch v2.0.0+) introduced granular scopes** using search parameter filters -- e.g., `patient/Observation.rs?category=laboratory` requests only lab observations. US Core v7 defines specific sub-resource category scopes for Conditions and Observations ([SMART App Launch Scopes v2.2.0](https://build.fhir.org/ig/HL7/smart-app-launch/scopes-and-launch-context.html); [US Core Scopes](https://build.fhir.org/ig/HL7/US-Core/scopes.html)). However, implementation is uneven -- many EHR authorization servers do not yet present granular scope choices to patients in a comprehensible way, and the consent UI design challenge (presenting clinical categories to non-clinical users) remains unsolved.

### CARIN Alliance Position

CARIN Alliance is the main multi-stakeholder advocacy body for consumer-directed exchange. Key positions and activities:
- Submitted formal response to the CMS/ASTP RFI in June 2025, advocating for expanded patient access
- In **October 2025, published the nation's first unified digital identity credential trust framework policy** in partnership with DirectTrust and Kantara Initiative, integrating NIST 800-53, NIST 800-63, and RFC 3647 into a single interoperable policy ([DirectTrust Announcement](https://directtrust.org/blog/news/carin-alliance-announces-nations-first-interoperable-digital-identity-credential-trust-framework-policy-developed-in-partnership-with-directtrust-and-kantara-initiative))
- Plans to donate this policy to HL7 FHIR at Scale Taskforce (FAST) Digital Identity workgroup
- CARIN-CFA Accreditation recognized by CMS as an evaluation pathway for the Medicare App Library

### Health Data Aggregation Apps

**Apple Health Records:** Available on iPhone, uses FHIR to pull clinical data (labs, immunizations, vitals, conditions, allergies, medications) directly from participating EHRs. Supported by hundreds of institutions. Encrypted on-device storage. Limitation: Apple-only, read-only, no write-back, limited to institutions that have opted in to Apple's Health Records program ([Apple Health Integration](https://www.smiledigitalhealth.com/whitepaper/apple-health-integration)).

**CommonHealth:** Android equivalent, supported by approximately 230 US healthcare providers, also FHIR-based. Developed by The Commons Project (same organization behind SMART Health Cards).

**Other aggregators:** OneRecord, various payer apps using CMS Blue Button 2.0 API. Overall market: 84% of hospitals can transmit data to third parties electronically (2024), but consumer demand remains low at 7% adoption for aggregator apps.

---

## 2. Identity Verification / Credentialing Services in Healthcare

### Identity Proofing Services Operating Today

**ID.me:** 154 million users with the ID.me digital identity wallet; 78 million verified to NIST IAL2/AAL2 standards. Certified by Kantara Initiative as NIST 800-63-3 IAL2-conformant. Used for VA healthcare access, EPCS (Electronic Prescribing of Controlled Substances), and patient portal identity proofing. Verification method: scans government ID, applies machine vision/AI for document authenticity, then facial recognition matching selfie to ID photo ([ID.me Healthcare](https://www.id.me/business/patient-proofing); [ID.me Wallet Expansion](https://www.biometricupdate.com/202510/id-me-expands-reach-of-digital-identity-wallet-for-healthcare-management)).

**CLEAR (CLEAR1):** Meets HIPAA, IAL2, and AAL2 requirements. Used for patient check-in, password recovery, and EHR access at healthcare facilities. Provides real-time identity verification ([CLEAR Healthcare](https://identity.clearme.com/healthcare)).

**Login.gov:** Federal government identity service, used alongside ID.me for VA and other federal health services.

### NIST IAL (Identity Assurance Levels)

NIST SP 800-63 defines three levels ([NIST SP 800-63A](https://pages.nist.gov/800-63-3/sp800-63a.html)):

- **IAL1:** Self-asserted identity. No proofing required. Sufficient for low-risk applications.
- **IAL2:** Remote or in-person identity proofing with reliable evidence. Requires validation of government-issued ID, verification that the applicant is the true owner. Can include biometrics. **This is the standard for healthcare EHR access, EPCS, and TEFCA participation.**
- **IAL3:** In-person, supervised document verification with biometric capture. Required for highest-risk scenarios (e.g., DEA registration for controlled substances in some contexts).

NIST SP 800-63-4 (revision 4) is in development, updating requirements with modern remote proofing techniques.

### SMART Health Cards / SMART Health Links

**SMART Health Cards (SHCs):** Verifiable credentials containing FHIR data, cryptographically signed by the issuer (lab, pharmacy, public health department). Encoded as compact JWS (JSON Web Signature) payable in a QR code. Originally deployed at scale for COVID-19 vaccination records. Based on W3C Verifiable Credentials and HL7 FHIR ([SMART Health Cards Specification](https://spec.smarthealth.cards/)).

**SMART Health Links (SHLs):** Extension for data too large or too dynamic for a single QR code. Encrypted data stored in the cloud, accessible via a URL embedded in a QR code. Supports password protection and expiration dates. Enables sharing of insurance cards, medication lists, advance directives, and other documents that change over time ([SMART Health Cards and Links IG](https://build.fhir.org/ig/HL7/smart-health-cards-and-links/cards-specification.html)).

The ecosystem is governed by the Vaccination Credential Initiative (VCI), with CommonTrust Network maintaining a verifier registry.

### Digital Identity Wallets in Healthcare

The concept: a patient's smartphone holds cryptographically signed credentials (insurance, identity proof, vaccination records, medication summary, allergy records) in a digital wallet. A provider scans a QR code and receives verified information instantly, without querying a central database.

Current state: ID.me's wallet has 154 million users. The EU is mandating EUDI Wallets by end of 2026 with healthcare as a required acceptance sector. In the US, the approach is more fragmented -- SMART Health Cards/Links provide the credential format, but there is no mandated universal wallet ([Carahsoft Digital Wallets](https://www.carahsoft.com/blog/1kosmos-digital-wallets-the-bridge-between-patient-and-provider-blog-2025)).

### The Gap Between "Identity Verification" and "Authorization Encoding"

This is a critical conceptual gap. Today's identity proofing services answer: "Is this person who they claim to be?" (IAL2 verification). But they do **not** answer: "What is this person authorized to do or access?" 

A patient can prove they are Jane Smith with IAL2 confidence, but there is no standardized, portable, machine-readable artifact that encodes: "Jane Smith has authorized App X to access her laboratory results from Provider Y for the next 90 days." That authorization currently lives as:
- An OAuth token (short-lived, not portable across providers)
- A paper HIPAA authorization form (not machine-readable)
- An entry in a provider's internal consent management system (not portable)

The identity-integrity gap also manifests technically: when signed healthcare data (like a prescription encoded as JSON) is re-serialized by a receiving system, field reordering or whitespace changes can break cryptographic signature verification, even though no clinical meaning changed ([Closing the Identity-Integrity Gap](https://medium.com/@vincentexplore/formidable-esign-closing-the-identity-integrity-gap-in-digital-signing-in-healthcare-7810405e6fed)).

### UDAP (Unified Data Access Profiles)

UDAP extends OAuth 2.0 and OpenID Connect with X.509 certificate-based trust for FHIR transactions ([UDAP.org](https://www.udap.org/); [HL7 UDAP Security IG](https://hl7.org/fhir/us/udap-security/index.html)):
- **Dynamic client registration:** Apps can register with FHIR servers they've never interacted with, using trusted digital certificates, eliminating per-server manual registration
- **JWT-based client authentication:** Replaces client secrets with signed JWTs
- **Tiered OAuth:** Enables trust delegation across organizational boundaries
- **Community trust anchors:** X.509 certificate chains establish that participants belong to a recognized trust community

UDAP is being incorporated into ONC certification requirements. It supports both consumer-facing apps (authorization code flow) and B2B apps (client credentials flow). DirectTrust offers UDAP accreditation for app operators, identity providers, and FHIR servers.

### OpenID Federation

OpenID Connect Federation 1.0 enables dynamic, automated trust establishment between identity systems using signed metadata and discoverable trust chains, without requiring pre-arranged bilateral agreements ([OpenID Federation 1.0 Spec](https://openid.net/specs/openid-federation-1_0.html)).

Healthcare relevance: a "HIPAA Secure Exchange Certified" trust mark could enable organizations to verify each other's compliance status before data exchange. The OpenWallet Foundation is incubating TypeScript implementations of OpenID Federation alongside OpenID4VC (Verifiable Credentials). However, adoption in US healthcare is still nascent -- UDAP is further along in practical deployment.

---

## 3. Privacy / Compliance / Governance Perspective

### HIPAA Authorization (45 CFR 164.508)

A valid HIPAA authorization must contain these **core elements** ([45 CFR 164.508](https://www.law.cornell.edu/cfr/text/45/164.508)):
1. Description of the information to be disclosed, in a **specific and meaningful** fashion
2. Name or identification of the person(s) authorized to make the disclosure
3. Name or identification of the person(s) authorized to receive the disclosure
4. Description of **each purpose** of the requested use or disclosure
5. An **expiration date** or expiration event
6. Signature of the individual and date

**Required statements:** right to revoke in writing; whether signing is a condition of treatment/payment/enrollment; notice that disclosed information may be subject to redisclosure and may no longer be HIPAA-protected.

**Must be in plain language.** Compound authorizations (bundling unrelated purposes) are restricted. The authorization cannot be combined with other documents except in limited circumstances (research, psychotherapy notes).

Key tension for digital portability: the regulation assumes a paper-form mental model. There is no standard machine-readable encoding of a 164.508 authorization. An OAuth scope string like `patient/Observation.rs?category=laboratory` doesn't map cleanly to the required elements (it lacks expiration dates, purpose descriptions, redisclosure warnings, revocation instructions).

### State Privacy Laws and Sensitive Conditions

State laws frequently impose **stricter consent requirements** than HIPAA for specific data categories. Under HIPAA preemption rules, the more protective state law controls ([HIPAA Journal - State Law Preemption](https://www.hipaajournal.com/when-does-state-privacy-law-supersede-hipaa/)).

**42 CFR Part 2 (Substance Use Disorder records):** Historically required separate, specific written consent for any disclosure of SUD treatment records, even for treatment purposes. The **February 2024 final rule** significantly reformed this: a single consent can now cover all future uses for treatment, payment, and healthcare operations; and HIPAA-covered entities receiving Part 2 records under consent can redisclose per HIPAA rules. Compliance deadline: **February 16, 2026** ([HHS Part 2 Final Rule Fact Sheet](https://www.hhs.gov/hipaa/for-professionals/regulatory-initiatives/fact-sheet-42-cfr-part-2-final-rule/index.html)). OCR is now authorized to enforce Part 2 alongside HIPAA ([HIPAA Journal - OCR Part 2 Enforcement](https://www.hipaajournal.com/ocr-authorized-administer-enforce-part-2-regulations/)).

**HIV/AIDS:** New York Public Health Law Article 27-F requires specific written consent for HIV-related information disclosure. Many states have similar statutes. These cannot be satisfied by a generic HIPAA authorization or an OAuth consent screen.

**Mental health:** Varies dramatically by state. Some states treat mental health records identically to other health information; others (like Connecticut, Texas) require specific patient consent for any disclosure. Psychotherapy notes have additional HIPAA protections (164.508(a)(2)).

**Reproductive health:** Post-Dobbs, multiple states enacted new protections. Virginia's amended Consumer Protection Act prohibits reproductive health data disclosures without explicit consent. California's CPRA includes reproductive health in its "sensitive data" category.

**The interoperability challenge:** FHIR-based exchange must handle data segmentation -- tagging sensitive resources with confidentiality codes (e.g., using the HL7 Confidentiality code system: R=restricted, V=very restricted) and filtering them based on consent. There is active standards work: **DS4P (Data Segmentation for Privacy)** and **IHE's Privacy Consent on FHIR (PCF)** profile provide mechanisms for labeling and redacting sensitive data at the FHIR resource level, but implementation is immature. A 2025 study specifically examined "FHIR Granular Sensitive Data Segmentation" approaches ([PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11839247/)).

### The "Good Faith" Defense for Data Holders

HIPAA provides several good faith protections for covered entities:

1. **Reliance on authorization:** A covered entity that discloses PHI pursuant to a valid authorization is protected, including when an individual later revokes the authorization -- protection extends to actions taken **in reliance on the authorization before revocation** (164.508(b)(5)(i)).

2. **Credible representation:** A covered entity is presumed to have acted in good faith if its belief is based on "actual knowledge or in reliance on a credible representation by a person with apparent knowledge or authority" ([HHS Summary of Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)).

3. **Breach notification exception:** Unintentional acquisition/access/use by a workforce member made **in good faith within the scope of authority** that doesn't result in further unauthorized disclosure is not a reportable breach.

For a permission ticket system: if a data holder receives a cryptographically verifiable authorization artifact that meets 164.508 requirements, and discloses data in reliance on it, the good faith defense provides significant legal protection -- even if the authorization was obtained fraudulently or the patient later claims they didn't understand the scope.

### OCR Enforcement Trends

**Volume:** 22 enforcement actions in 2024; 21 in 2025. In 2026, enforcement is expanding ([HIPAA Journal Violation Fines](https://www.hipaajournal.com/hipaa-violation-fines/)).

**Two major initiatives:**
1. **Right of Access Initiative:** 54 enforcement actions to date, targeting providers who fail to provide records within 30 days. Settlements range from $10,000 to $350,000.
2. **Security Risk Analysis Initiative:** 13 of 20 recent matters cited inadequate risk analysis. In 2026, this is expanding to include risk management ([Shook Hardy OCR Enforcement Trends](https://www.shb.com/intelligence/newsletters/pds/hansen-march-2025-ocr-enforcement)).

**Penalty structure:** Four tiers, ranging from $141 per violation (Tier 1, no knowledge) up to $2,134,831 per violation (Tier 4, willful neglect not corrected). Calendar year cap of $2,134,831 per identical provision ([HIPAA Journal Penalties 2026](https://www.hipaajournal.com/what-are-the-penalties-for-hipaa-violations-7096/)).

**Information blocking enforcement (OIG, separate from OCR):** Up to $1 million per violation for health IT developers and networks. After years of inaction despite approximately 1,600 complaints, HHS announced an enforcement "crackdown" in late 2025, with the first investigation notices issued against health IT developers in early 2026 ([OIG Information Blocking](https://oig.hhs.gov/reports/featured/information-blocking/); [McDermott Law Analysis](https://www.mcdermottlaw.com/insights/hhs-announces-information-blocking-enforcement-crackdown/)).

**TEFCA context:** Eight Qualified Health Information Networks (QHINs) are operational as of mid-2025. Individual Access Services (IAS) within TEFCA allows patients to use TEFCA-connected apps as alternatives to provider portals. FHIR-based QHIN-to-QHIN exchange is being piloted in 2025, with broader implementation planned for 2026 ([ASTP TEFCA](https://www.healthit.gov/topic/interoperability/policy/trusted-exchange-framework-and-common-agreement-tefca)).

---

Sources:
- [ASTP Data Brief: Patient Portals and Health Apps 2024](https://healthit.gov/data/data-briefs/individuals-access-and-use-patient-portals-and-smartphone-health-apps-2024/)
- [AJMC Portal Engagement Study](https://www.ajmc.com/view/insights-into-patient-portal-engagement-leveraging-observational-electronic-health-data)
- [JMIR MyChart Community Hospital Study](https://www.jmir.org/2025/1/e66353)
- [MyChart Sharing Your Medical Record](https://www.mychart.org/Sharing-Your-Medical-Record)
- [SMART App Launch v2.2.0 Specification](https://build.fhir.org/ig/HL7/smart-app-launch/app-launch.html)
- [SMART App Launch Scopes and Context](https://build.fhir.org/ig/HL7/smart-app-launch/scopes-and-launch-context.html)
- [US Core Scopes v9.0.0](https://build.fhir.org/ig/HL7/US-Core/scopes.html)
- [ONC Cures Act Final Rule](https://healthit.gov/regulations/cures-act-final-rule/)
- [Holland & Knight: Information Blocking Enforcement](https://www.hklaw.com/en/insights/publications/2026/02/the-wait-is-over-information-blocking-enforcement-is-officially-here)
- [HHS Crackdown on Information Blocking](https://www.healthcarelawinsights.com/2026/03/hhs-crackdown-on-information-blocking-new-era-of-enforcement-fines-and-compliance-risks-for-healthcare-entities/)
- [OIG Information Blocking](https://oig.hhs.gov/reports/featured/information-blocking/)
- [McDermott Law: HHS Information Blocking Crackdown](https://www.mcdermottlaw.com/insights/hhs-announces-information-blocking-enforcement-crackdown/)
- [CARIN Alliance](https://www.carinalliance.com/)
- [CARIN/DirectTrust/Kantara Digital Identity Credential Policy](https://directtrust.org/blog/news/carin-alliance-announces-nations-first-interoperable-digital-identity-credential-trust-framework-policy-developed-in-partnership-with-directtrust-and-kantara-initiative)
- [Apple Health Integration Guide](https://www.smiledigitalhealth.com/whitepaper/apple-health-integration)
- [SMART Health Cards Specification](https://spec.smarthealth.cards/)
- [SMART Health Cards and Links IG](https://build.fhir.org/ig/HL7/smart-health-cards-and-links/cards-specification.html)
- [ID.me Healthcare Identity Proofing](https://www.id.me/business/patient-proofing)
- [ID.me Wallet Expansion](https://www.biometricupdate.com/202510/id-me-expands-reach-of-digital-identity-wallet-for-healthcare-management)
- [CLEAR Healthcare Identity](https://identity.clearme.com/healthcare)
- [NIST SP 800-63A](https://pages.nist.gov/800-63-3/sp800-63a.html)
- [UDAP.org](https://www.udap.org/)
- [HL7 UDAP Security IG v2.0.0](https://hl7.org/fhir/us/udap-security/index.html)
- [OpenID Federation 1.0](https://openid.net/specs/openid-federation-1_0.html)
- [45 CFR 164.508](https://www.law.cornell.edu/cfr/text/45/164.508)
- [HHS 42 CFR Part 2 Final Rule Fact Sheet](https://www.hhs.gov/hipaa/for-professionals/regulatory-initiatives/fact-sheet-42-cfr-part-2-final-rule/index.html)
- [HHS Summary of HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)
- [HIPAA Journal: Violation Fines 2026](https://www.hipaajournal.com/hipaa-violation-fines/)
- [HIPAA Journal: Penalties 2026](https://www.hipaajournal.com/what-are-the-penalties-for-hipaa-violations-7096/)
- [Shook Hardy: OCR Enforcement Trends](https://www.shb.com/intelligence/newsletters/pds/hansen-march-2025-ocr-enforcement)
- [HIPAA Journal: State Law Preemption](https://www.hipaajournal.com/when-does-state-privacy-law-supersede-hipaa/)
- [ASTP TEFCA](https://www.healthit.gov/topic/interoperability/policy/trusted-exchange-framework-and-common-agreement-tefca)
- [Carahsoft: Digital Wallets in Healthcare](https://www.carahsoft.com/blog/1kosmos-digital-wallets-the-bridge-between-patient-and-provider-blog-2025)
- [PMC: FHIR Granular Sensitive Data Segmentation](https://pmc.ncbi.nlm.nih.gov/articles/PMC11839247/)
- [Closing the Identity-Integrity Gap](https://medium.com/@vincentexplore/formidable-esign-closing-the-identity-integrity-gap-in-digital-signing-in-healthcare-7810405e6fed)