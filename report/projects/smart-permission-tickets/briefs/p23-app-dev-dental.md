---
id: p23
role: CTO & Co-founder
org_type: Dental Patient App
org_size: small
archetype: app_developer
stance: conditional
use_cases:
  - patient_access
spec_topics:
  - trust_establishment
concerns:
  - adoption_barriers
frameworks_referenced: []
key_terms:
  - identity_service_investigation
---

## P23: CTO & Co-founder (Dental Patient App)

### Background

Leads a small company that builds apps connecting dental patients to providers for records access and practice communication. Currently investigating commercial identity services as a path toward cross-practice patient matching and authentication.

### Key Positions

- **Cross-practice records access is the core problem.** The app exists to connect dental patients to providers so they can view records and communicate with practices — making multi-site connectivity a direct business need, not a hypothetical.

- **Commercial identity platforms (Clear, Id.me) are the current frame of reference for solving portable identity.** When presented with the Permission Tickets concept, the immediate association was to identity verification services already being explored in the market, suggesting that the dental app space may be approaching the authorization problem through identity-first rather than authorization-first pathways.

### Distinctive Angle

The dental care space represents a domain where cross-provider records access is a daily operational need rather than an occasional patient request — patients often see multiple specialists, change providers, or need records transferred. That this participant is actively investigating commercial identity services to solve the connectivity problem indicates a market gap that Permission Tickets could address, but the framing as an identity problem (rather than an authorization problem) suggests the spec's value proposition may need translation for developers who are not already embedded in the SMART/FHIR ecosystem.

### Tensions Surfaced

- **Identity verification vs. authorization.** The participant's instinct was to reach for identity platforms (Clear, Id.me) rather than authorization mechanisms, surfacing a potential conceptual gap: developers outside the SMART ecosystem may conflate proving *who someone is* with proving *what they're allowed to access*. Permission Tickets would need to be positioned clearly relative to the identity layer these developers are already exploring.
