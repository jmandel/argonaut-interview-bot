---
id: p21
role: Product Lead
org_type: Consent Management Service Vendor
org_size: small
archetype: consent_vendor
stance: conditional
use_cases:
  - patient_access
  - care_coordination
spec_topics:
  - scoping
  - consent_representation
  - purpose_of_use
  - token_lifetime
  - ds4p
  - format_alignment
concerns:
  - data_segmentation_limits
  - adoption_barriers
  - partial_record_acceptance
  - consent_not_verifiable
frameworks_referenced:
  - FHIR
key_terms:
  - enforcement_ceiling
  - forms_agnosticism_reversal
  - consent_captured_but_inert
  - form_standardization_economics
---

## P21: Product Lead (Consent Management Service Vendor)

### Background

Leads a consent management startup that launched a computable consent service in 2023, born out of a consulting practice focused on data-informed care coordination. The service captures patient consent decisions from digital forms as structured, machine-readable data (JSON) and is designed to integrate with EHR workflows via FHIR APIs. The sole production deployment is a white-labeled version operated by a state Medicaid agency for managing patient consent around sensitive health data — providing direct experience with public-sector procurement constraints, provider adoption friction, and the gap between what computable consent can express and what clinical systems can enforce.

### Key Positions

- **Form standardization is an economic prerequisite for scalable computable consent, not a governance nice-to-have.** The service was originally designed to be forms-agnostic — digitize whatever consent form each provider uses. In practice, the cost of digitizing every nuanced variation across providers is prohibitive. Standardization of consent forms (along the lines of state-level data exchange framework consent forms) requires government backing, but without it, no consent management platform can achieve the unit economics needed to operate at scale.

- **EHR systems cannot reliably segment data at a clinical level — and a major vendor has confirmed this.** Granular consent decisions (e.g., "share my records but not my behavioral health notes") depend on the disclosing EHR's ability to filter its output accordingly. Confidence in this capability is very low, and experts from a major EHR vendor have confirmed the limitation as a platform-level gap, not a site-configuration problem. This means any consent or authorization mechanism — including Permission Tickets — faces an enforcement ceiling set by the data holder's technical capabilities.

- **Start Permission Tickets with what EHRs can actually enforce and push granularity later.** Given the segmentation gap, a first version should constrain itself to broad categories, date ranges, and resource types rather than clinical-level filtering. Building a granular spec that the infrastructure cannot honor creates false expectations and erodes trust in the mechanism.

- **The actionable consent parameters today are organizational and temporal, not clinical.** Working toward FHIR API integration, the practical starting points are: allowable disclosers, requesters, and recipients; allowable purpose of use; allowable disclosure timeframes (from one-time to standing, with specific windows); and patient-initiated revocation. These are parameters EHR systems can plausibly enforce now without solving the clinical segmentation problem.

- **Consent today is captured but inert.** Consent documents — whether digital or paper — are typically stored in EHRs as unsearchable static artifacts. They are not operationalized beyond a single disclosure event. This has pushed HIEs toward binary opt-in/opt-out models, stripping patients of meaningful agency over how their data is shared. The computable consent service exists specifically to break this pattern by making consent decisions structured, auditable, and API-accessible.

- **Provider resistance to partial records is a downstream adoption risk.** Even if consent is granular and a ticket carries those constraints faithfully, receiving providers may reject or distrust incomplete clinical pictures. This resistance has not been deeply explored yet, but it represents a real barrier to granular consent enforcement regardless of the technical mechanism used.

### Distinctive Angle

The forms-agnosticism reversal reveals a structural constraint that spec designers should take seriously: the consent capture layer cannot absorb unlimited variation, so some degree of form or vocabulary standardization must exist upstream of Permission Tickets. A ticket is a common output format, but it does not solve the input problem — if every provider's consent form encodes decisions differently, the cost of translating each into a standard ticket structure replicates the same scaling problem. Meanwhile, the EHR segmentation ceiling — independently confirmed by a major vendor — means that the enforcement layer cannot yet match even the expressiveness of today's consent forms. Permission Tickets sit between these two constraints: standardization pressure from below (consent capture economics) and enforcement limits from above (EHR segmentation capabilities). The practical envelope for a first-generation ticket is narrower than it might appear from the spec side — organizational identity, purpose, time bounds, and revocation are enforceable; clinical-level data filtering is not.

### Tensions Surfaced

- **Granularity of consent vs. enforceability of consent.** Patients can express granular preferences, and the consent service can capture them computably, but EHR systems cannot reliably act on them. This creates a gap where the consent artifact promises more than the infrastructure delivers.
- **Forms-agnosticism vs. economic viability.** Accepting any provider's existing consent form is appealing for adoption but unsustainable for the vendor. Standardization solves the economics but requires government intervention that moves slowly and unevenly across states.
- **Partial records vs. clinical utility.** Honoring granular consent means some data gets withheld, but receiving providers may resist working with incomplete records — creating tension between patient agency and provider workflow expectations.
