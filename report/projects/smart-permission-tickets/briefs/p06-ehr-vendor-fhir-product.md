---
id: p06
role: FHIR Product Manager & Clinician
org_type: EHR Vendor
org_size: mid
archetype: ehr_vendor
stance: conditional
use_cases:
  - patient_access
  - public_health
  - caregiver_proxy
  - care_coordination
spec_topics:
  - purpose_of_use
  - consent_representation
  - ds4p
  - trust_establishment
  - scoping
  - format_alignment
  - issuer_model
concerns:
  - consent_not_verifiable
  - data_segmentation_limits
  - adoption_barriers
  - spec_proliferation
frameworks_referenced:
  - FHIR
  - DS4P
  - SMART
key_terms:
  - business_rules_engine_input
  - purpose_driven_scoping
  - ticket_as_request_not_grant
---

## P6: FHIR Product Manager & Clinician (Mid-size EHR Vendor)

### Background

Leads FHIR solution implementations at a mid-size EHR vendor, with a clinical background that informs how she evaluates both technical correctness and clinical usability. Her team already operates an authorization service handling four distinct permission types, giving her a concrete operational baseline against which to evaluate Permission Tickets.

### Key Positions

- **System callers have no individual user — authorization is purpose-of-use plus business rules.** Her system treats system callers (HIEs, public health agencies) as entities without individual user identity. The caller declares a purpose of use, and the responding system applies pre-defined business rules to shape the response: an HIE requesting a clinical summary gets one response; a public health agency requesting immunization history gets another. Permission Tickets would need to carry purpose of use in a form her business rules engine can consume directly — functioning as an input to existing decision logic rather than replacing it.

- **Patient and system caller are the most natural permission types for external tickets; proxy requires caution.** Of the four permission types her authorization service handles (patient, patient proxy, product user, system caller), patient and system caller map most cleanly to externally issued tickets. Proxy gives her pause because the consent basis is ambiguous — did the patient grant it, a provider, or is it policy-driven? An external ticket asserting proxy authority would need to convey *how* that authority was established, not just that it exists.

- **Consent to share must be an explicit element in the ticket, not an assumption.** Today, consent is managed locally and varies by use case — some flows are policy-driven (public health), others require explicit patient consent. If an external ticket arrives asserting authorization, her system needs to trust that appropriate consent was actually obtained. The ticket must convey the consent basis, not just the access request.

- **DS4P segmentation rules are a non-negotiable constraint on ticket-authorized responses.** The ticket conveys an authorization request, but the data holder's existing consent and segmentation logic — including Data Segmentation for Privacy — remains the final gate on what gets returned. A ticket authorizing access to clinical data cannot override local rules about sensitive categories (substance use disorder, behavioral health, etc.). Permission Tickets must work *with* DS4P rather than around it.

- **Implementation priority hinges on architectural alignment, not mandate or customer demand.** When evaluating whether to implement Permission Ticket support, the deciding factor is whether tickets map onto the existing authorization service with manageable lift — not certification requirements, customer pull, or engineering cost reduction. If the spec requires rearchitecting what already works, it won't get prioritized.

- **The spec must align with existing standards rather than diverge.** DS4P is specifically called out, but the concern is broader: any Permission Ticket design that introduces patterns inconsistent with current ONC certification requirements or HL7 implementation guides will face resistance from vendors who have already invested in compliance with those frameworks.

### Distinctive Angle

Permission Tickets become operationally tractable when they function as structured inputs to an existing business rules engine rather than as standalone authorization grants. The authorization service already implements a pattern where system callers declare purpose of use and pre-defined business rules shape the response — no individual user identity involved, just purpose-driven scoping at the system level. This provides a concrete integration model for the spec: the ticket's purpose-of-use coding must align with how EHR business rules engines already categorize and route access decisions, so that the ticket changes how the request *arrives* without requiring changes to the decision logic that determines what gets *returned*.

### Tensions Surfaced

- **Ticket as request vs. ticket as grant.** The business rules model treats the ticket as an input to a local decision, not as an authorization the data holder must honor. If the spec positions tickets as grants that data holders merely validate, it conflicts with the operational reality where the responding system's rules — not the requester's assertion — determine the response content.
- **External trust vs. local consent authority.** Tickets arrive asserting that consent was obtained, but her system currently manages consent locally and enforces it during response generation. Accepting external consent assertions means trusting that the issuer's consent capture meets the same bar her system would apply — a trust relationship that goes beyond verifying a signature.
- **Alignment incentive vs. specification maturity.** The strongest adoption driver is low-friction alignment with existing infrastructure, but evaluating that alignment requires spec details that don't yet exist. This creates a chicken-and-egg problem: vendors who would implement if the lift is small can't assess the lift until the spec is further along, but the spec benefits from vendor input during development.
