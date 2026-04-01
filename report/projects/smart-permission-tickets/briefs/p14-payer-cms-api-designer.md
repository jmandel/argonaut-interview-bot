---
id: p14
role: API Designer
org_type: Federal Payer Agency
org_size: government
archetype: payer
stance: conditional
use_cases:
  - patient_access
  - payer_claims
spec_topics:
  - scoping
  - consent_representation
  - trust_establishment
  - ds4p
concerns:
  - data_segmentation_limits
  - consent_not_verifiable
  - scope_governance
frameworks_referenced:
  - FHIR
  - TEFCA
key_terms:
  - patient_meaningful_vocabulary
  - all_or_nothing_consent
  - semantic_consent_layer
---

## P14: API Designer (Federal Payer Agency)

### Background

Designs and implements FHIR-based APIs for a federal payer agency, including patient-facing, provider-facing, and bulk data access APIs, as well as the shared FHIR server that powers them. This puts them at the intersection of large-scale payer data distribution, regulatory mandate implementation, and the practical realities of how consent is (and isn't) represented in networked exchange.

### Key Positions

- **The all-or-nothing consent model in current exchange workflows is the central problem Permission Tickets should solve.** In IAS workflows and payer-to-payer/provider exchange, patients cannot assert consent at any level between zero and full access. Permission Tickets are valuable primarily because they let a verifiable, granular consent artifact travel with a request, rather than forcing responding systems to trust that requested scopes reflect the patient's actual wishes.

- **The consent vocabulary must be patient-meaningful, not a 1:1 mapping to FHIR resource types.** A successful v1 needs to convey consent for sharing "types of data" in terms patients understand — categories like "lab results" or "medications" rather than technical FHIR resource names like Observation or MedicationRequest. The vocabulary must also be interpretable consistently by different responding systems. This raises the design bar: it requires a shared semantic layer that multiple implementers agree on, rather than simply reusing existing FHIR resource names as a convenient shortcut. "The ability to convey consent for sharing 'types of data' even if it doesn't conform 1:1 to a FHIR resource, in a way that can be understood and applied consistently by different responders, could be considered success for v1."

- **"What" and "who" are the scoping dimensions that matter most; time-bounded access is secondary.** A patient might want to block sexual health information from all recipients while sharing mental health data with a therapy application but not a diabetes application. The sensitivity of data is not about the data type in isolation — it depends on the combination of data category, recipient, and purpose.

- **Resource-level scoping is a sufficient MVP because it forms the building blocks for finer segmentation.** Starting with the ability to scope by resource type (or groups of resources) is practical and "good enough" to ship. Sub-segmentation by sensitivity category (e.g., separating sexual health from other data within a resource type) can layer on afterward. The resource-level foundation doesn't preclude future granularity — it enables it.

- **Absent a verifiable consent artifact, networked exchange produces both operational friction and implementation fragmentation.** Without authoritative proof of patient intent traveling with a request, responding systems in TEFCA and similar frameworks impose defensive constraints (such as limited refresh durations) and interpret consent ambiguously, leading to disparate implementations across the network.

### Distinctive Angle

Consent expression needs its own vocabulary layer — one designed around how patients think about their health information, not around how FHIR models it technically. A patient understands "my lab results" or "my medications"; they do not understand "Observation" or "MedicationRequest." If the Permission Ticket scoping model simply inherits FHIR resource types as its consent vocabulary, it will be technically convenient but semantically opaque to the people whose preferences it is meant to represent. Designing a shared, patient-facing vocabulary that diverse responding systems can interpret consistently is a harder problem than resource-level scoping — but it is the right target for what "success" looks like, even in a v1.

### Tensions Surfaced

- **Patient-meaningful vocabulary vs. implementer convenience.** FHIR resource types are the obvious, low-friction choice for scoping because they map directly to what servers already understand. But a consent model built on resource types is legible only to engineers, not patients. Building a shared interpretive layer between patient-facing categories and FHIR resources adds design and coordination cost.
- **Verifiable consent vs. current trust assumptions.** Today's networked exchange operates on the assumption that the requesting system faithfully represents patient intent. Permission Tickets would replace that assumption with cryptographic proof, but this shifts burden onto the ticket-issuance infrastructure to faithfully capture patient preferences — the trust problem moves rather than disappears.
- **MVP pragmatism vs. the actual consent granularity patients need.** Resource-level scoping is practical to ship, but the motivating examples (sharing mental health data with a therapy app but not a diabetes app) require sub-resource sensitivity tagging that most systems cannot enforce today. The MVP buys time but does not solve the cases that make the strongest argument for the system.
