---
id: p09
role: CTO & Co-founder
org_type: Patient Data Aggregation Startup
org_size: small
archetype: app_developer
stance: supportive
use_cases:
  - patient_access
spec_topics:
  - trust_establishment
  - issuer_model
  - scoping
  - org_identity
  - subject_resolution
concerns:
  - adoption_barriers
  - spec_proliferation
  - issuer_viability
frameworks_referenced:
  - TEFCA
  - SMART
  - FHIR
  - OAuth2
key_terms:
  - app_developer_as_issuer
  - relationship_simplification
  - redundant_login_dropoff
  - functional_issuer_requirements
  - tefca_underspecification_precedent
---

## P9: CTO & Co-founder (Patient Data Aggregation Startup)

### Background

Leads engineering and business at a startup that connects patients to their health data across multiple providers. Maintains live integrations with four CSPs and QHINs for TEFCA-based patient access, giving direct operational experience of where federated standardization delivers and where underspecification creates per-partner engineering cost.

### Key Positions

- **App developers should be eligible to become trusted ticket issuers, subject to the same governance bar as any other issuer type.** The startup already contracts with CSPs and QHINs; becoming an issuer could consolidate relationship complexity rather than adding another intermediary. The conflict-of-interest concern — an app defining scope for its own data access — is real but belongs at the governance layer: audit, standards compliance, and framework participation should determine issuer eligibility, not organizational category. Other apps in the ecosystem are already moving toward becoming networks themselves, suggesting the market is pushing in this direction regardless.

- **Trust and governance are the central questions, not token mechanics.** The first practical reaction to Permission Tickets is "who is the trusted service, and what makes it trusted?" Issuers would need to participate in governance activities or implement highly audited standards. If the spec cannot answer the trust question concretely, the concept stalls at the threshold — practitioners will not engage with protocol details until the institutional layer is credible.

- **TEFCA underspecification is a cautionary precedent for Permission Ticket design.** Four TEFCA relationships (spanning two identity verification services and two health information networks) each behave slightly differently despite nominal standardization. The sharpest pain point: OIDC token scalar values are not fully specified — the gender element is designed as a union type but the members are not enumerated. This kind of ambiguity creates real engineering cost at scale. The SMART IGs, by contrast, are "amongst the best specifications in the ecosystem" and provide a stronger foundation — the quality concern is not the SMART layer but adjacent specs and governance definitions that may replicate TEFCA's gaps.

- **Redundant login after identity verification is the primary user-facing drop-off point.** Users who verify identity through a CSP lose momentum when a QHIN requires an additional portal login (e.g., a major EHR vendor's patient portal). Even in the best case — Medicare.gov via TEFCA — success rates reach only about 80% of straight OAuth portal performance. That 80% ceiling means 1 in 5 users lost even under optimal conditions; additional login steps make it worse. Eliminating this redundant authentication would be "transformational."

- **The current per-site OAuth model offers little worth preserving.** When pressed on what would be hard to lose in a Permission Ticket world, nothing came to mind. The direct relationship with each data holder's authorization server provides no advantage that outweighs the friction cost of maintaining it.

### Distinctive Angle

App developers — not just identity verification services or health information networks — should be eligible to serve as trusted issuers. The governance argument is straightforward: if the same audit, standards, and framework-participation requirements apply to all issuer types, organizational category should be irrelevant to eligibility. This has a concrete spec design implication: the trust framework must define issuer requirements functionally rather than by organizational type, or it will foreclose a consolidation path the market is already exploring. An app developer that qualifies as an issuer reduces the number of intermediary relationships in the chain rather than adding another layer — turning what looks like role expansion into relationship simplification.

### Tensions Surfaced

- **Issuer self-interest vs. governance adequacy.** An app that both issues tickets and consumes the resulting data access has an inherent conflict of interest. The participant argues governance solves this, but the governance framework would need to be credible enough that data holders actually trust it — and no such framework exists yet for this specific role.
- **Standardization depth vs. adoption speed.** TEFCA's underspecification problems argue for tighter definitions in the Permission Ticket spec, but tighter specs take longer to finalize. High confidence in SMART IG quality suggests the tradeoff is navigable, but only if the spec team maintains the same precision on new constructs (ticket scoping, issuer metadata, identity claims) that it achieved on existing ones.
- **Relationship consolidation vs. dependency concentration.** Becoming an issuer would reduce intermediary relationships, but it concentrates more ecosystem responsibility in the app developer — a role data holders may resist granting without significant precedent or regulatory backing.
