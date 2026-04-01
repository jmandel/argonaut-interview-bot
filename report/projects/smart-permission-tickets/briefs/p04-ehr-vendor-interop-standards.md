---
id: p04
role: Interoperability Standards Lead
org_type: EHR Vendor
org_size: large
archetype: ehr_vendor
stance: conditional
use_cases:
  - patient_access
spec_topics:
  - consent_representation
  - scoping
  - purpose_of_use
  - format_alignment
  - issuer_model
  - ds4p
concerns:
  - spec_proliferation
  - adoption_barriers
  - scope_governance
frameworks_referenced:
  - FHIR
  - DS4P
key_terms:
  - unified_rules_expression_format
  - use_context_signal
  - policy_layer_interoperability
  - patient_directed_override
---

## P4: Interoperability Standards Lead (Large EHR Vendor)

### Background

Works on interoperability at a large EHR vendor, oriented toward standards and specification rather than day-to-day implementation. This vantage point spans the gap between how authorization rules are defined in industry specifications and how they get manually interpreted and configured at individual sites -- a gap that shapes their entire perspective on Permission Tickets.

### Key Positions

- **Permission Tickets, consents, authorizations, preferences, and ROI requests must all use the same FHIR-based rules expression format.** A data holder evaluates all of these rule types together alongside jurisdictional privacy rules when making access decisions. Each carries different legal, business, or clinical meaning, yet the rules they convey should use one consistent FHIR-based structure so that a single evaluation engine can consume them. If Permission Tickets introduce yet another format, they become one more artifact to manually reconcile.

- **The current state is manual interpretation and inconsistent configuration.** Without consistent industry standards for expressing access rules -- whether from HL7 Scalable Consent Management, Permission Tickets, or jurisdictional privacy frameworks -- each vendor independently interprets and configures access controls. These interpretations may not align across providers or other data-holding health IT systems. The interoperability gap is at the policy layer, not just the data layer.

- **Permission Ticket work must be coordinated with HL7 Scalable Consent Management and related efforts.** Any variations between how rules are expressed in tickets versus consents versus jurisdictional requirements should be intentional and well-understood, not the result of parallel efforts working in isolation.

- **Patient-directed app access is categorically distinct and should not be overridden by other data sharing rules.** When a Permission Ticket represents a patient's own preferences for an app they chose, the data holder should honor those preferences without applying other data sharing restrictions. "From a responder perspective there must be clear recognition that the rules are patient's preferences for an app, thus not subject to other data sharing restrictions." This requires a clear signal in the ticket so the data holder can distinguish patient-directed access from other use contexts.

- **Non-patient-directed use contexts require the ticket to be evaluated alongside existing rules.** When tickets are used in contexts other than patient-directed app access, the data holder needs to consider the ticket's rules together with other applicable constraints -- consents, authorizations, and jurisdictional requirements.

- **Patients need an independent place to manage preferences across apps and data holders.** There must be an independent party where patients can register their preferences for each app and share those with data holders in a way that allows authenticity validation. Because app preferences are one of several types of data sharing rules a patient may have, the individual needs a way to maintain a coherent view across all of them.

### Distinctive Angle

The access decision a data holder makes is never about a single artifact in isolation. Permission tickets, consents, authorizations, preferences, release-of-information requests, and jurisdictional privacy rules all feed into one decision -- and today, each is expressed differently, interpreted manually, and configured inconsistently across sites. A unified FHIR-based rules expression format that spans all of these artifact types would let data holders evaluate them programmatically rather than reconciling parallel systems. Permission Tickets designed outside that unified framework risk deepening the fragmentation they aim to solve. Within that framework, patient-directed app access occupies a privileged position: it reflects the patient's own preferences and should not be overridden by rules that govern other data sharing contexts. The spec implication is that tickets must carry a clear use-context signal so data holders can route patient-directed access to a different evaluation path than B2B or payer-driven requests.

### Tensions Surfaced

- **Unified format vs. spec velocity.** Coordinating Permission Tickets with HL7 Scalable Consent Management and jurisdictional rules expression means the ticket format cannot be designed independently or quickly. But waiting for full alignment across all these efforts could delay practical adoption indefinitely -- reproducing the very standardization gap the participant identifies as today's problem.
- **Patient-directed override vs. data-holder down-scoping.** The position that patient-directed tickets should not be overridden by other data sharing rules sits in tension with a general expectation that data holders retain the ability to constrain access. The resolution depends on whether "patient-directed" is treated as a special legal category or just another input to a general-purpose policy engine.
- **Centralized preference management vs. fragmented reality.** The vision of an independent party where patients manage all their preferences across apps and data holders requires infrastructure and governance that does not exist today. In the interim, patient preferences remain scattered across individual app authorizations and local site configurations.
