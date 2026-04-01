---
id: p19
role: EHR Integration Architect
org_type: provider
org_size: large
archetype: provider_org
stance: conditional
use_cases:
  - care_coordination
spec_topics:
  - scoping
  - trust_establishment
  - format_alignment
concerns:
  - adoption_barriers
frameworks_referenced:
  - FHIR
  - HL7v2
key_terms:
  - bespoke_mini_project
  - machine_readable_authorization_artifact
  - non_api_exchange_patterns
---

## P19: EHR Integration Architect (Provider Organization)

### Background

Architects integrations between the organization's EHR and external third parties, with responsibility for both technical interface work and provider/patient workflow efficiency. Sits at the point where inbound data requests meet the reality of what the EHR can actually support.

### Key Positions

- **Most external data exchange is still file-based or HL7 v2, not API-driven.** API-based exchange is rare in practice. Any Permission Ticket design that assumes ubiquitous FHIR endpoints will not match the current state of provider-side infrastructure at many organizations.

- **Every new external data request triggers a bespoke mini-project.** The typical flow: an external party contacts a business owner, the informatics team scopes the request, and the interface team evaluates what the EHR can support — then all parties negotiate a workable solution. There is no self-service or standardized onboarding path.

- **Granular control over what data gets shared matters as much as reducing setup overhead.** The appeal of Permission Tickets is not just automating connection setup but gaining explicit, fine-grained authority over the scope of each data exchange — what gets shared and how much.

### Distinctive Angle

The value proposition of Permission Tickets may land differently at organizations where the integration stack is still file-based and V2-dominant. The immediate win is not "faster FHIR access" but a standardized way to specify and enforce data-sharing boundaries — replacing ad hoc, negotiation-heavy scoping with a machine-readable authorization artifact. Spec design should consider how ticket semantics might apply to non-API exchange patterns, or at minimum avoid assuming that adopters already have FHIR infrastructure in place.

### Tensions Surfaced

- **Wanting the solution before having the prerequisite infrastructure.** The participant sees value in both reduced setup and granular scoping but operates in an environment where the API-based exchange that Permission Tickets require is not yet the dominant pattern. The spec needs an adoption story for organizations still transitioning from file-based and V2 exchange.
