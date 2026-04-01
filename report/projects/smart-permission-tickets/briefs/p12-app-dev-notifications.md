---
id: p12
role: app developer building data access, notification, and patient-mediated exchange tools
org_type: health IT vendor
org_size: mid
archetype: app_developer
stance: supportive
use_cases:
  - notifications
  - care_coordination
  - patient_access
spec_topics:
  - scoping
  - token_lifetime
  - trust_establishment
concerns:
  - adoption_barriers
  - scope_governance
  - over_provisioning
frameworks_referenced:
  - SMART
  - OAuth2
  - US_Core
key_terms:
  - long_lived_grant_short_lived_access
  - token_exchange_workaround
  - intra_facility_fragmentation
  - authorization_primitive_for_async_workflows
---

## P12: App Developer — Notifications & Patient-Mediated Exchange (Health IT Vendor)

### Background

Builds apps for data access, notifications, and patient-mediated data exchange between providers. Works across both intra-facility and cross-facility integration scenarios, dealing directly with the authorization plumbing required to maintain persistent notification channels and move patient data between clinical systems.

### Key Positions

- **Permission Tickets solve a real problem within single facilities, not just across them.** When a facility runs multiple EHRs, patients face separate authorization flows for each system — the fragmentation problem exists at the site level, not just the network level. A ticket honored across authorization servers within one facility would eliminate redundant auth cycles that currently cause patient drop-off.

- **Long-lived grants enabling short-lived access is the right model for notification workflows.** Referral workflows may require notification access lasting a year or more, but each time the grant is exercised, the actual data access token should be narrow and short-lived. The ticket represents a durable authorization that can be presented repeatedly, with each presentation yielding a tightly scoped, time-limited access token. Scope varies by clinical context — a physiotherapy referral should exclude mental health data.

- **Token exchange is the current workaround — and it's fragile.** To achieve long-lived notification access today, the best available approach layers token exchange on top of the auth flow: an account with no default access combined with an additional token that carries the actual authorization. This works but is non-standard, hard to replicate across sites, and exactly the kind of bespoke mechanism that a standardized ticket approach would replace.

- **Scoping decisions should be explicitly out of scope for the Permission Tickets spec.** The ecosystem hasn't converged on how to express clinical-context-appropriate data boundaries (e.g., what's relevant to a physiotherapy referral vs. a mental health referral). Rather than trying to solve that within Permission Tickets, the spec should lean on existing SMART scopes, US Core guidance, and other external specifications. Broader resource-level scopes are the practical starting point, with granular scoping added as the vocabulary matures.

- **Data holders must enforce scope constraints — apps should not be trusted to self-limit.** When tickets carry granular scope information, the data holder's authorization server should enforce those boundaries, not rely on the requesting app to filter on its own side. These exchanges typically occur between trusted parties (providers, patients) where the trust model should not depend on app-side enforcement.

- **Adoption difficulty tracks the vendor landscape, not organizational boundaries.** The hard problem isn't convincing one hospital to trust another — it's getting multiple vendors to honor the same ticket format. A single facility with two EHR vendors faces the same coordination challenge as two facilities on different platforms. Conversely, two facilities on the same vendor platform may find adoption straightforward.

### Distinctive Angle

Referral notification workflows need authorization that persists for months or longer but yields only momentary data access each time it fires — a "long-lived grant, short-lived access" pattern that current OAuth models handle poorly. The token-exchange workaround in use today (an empty account whose only purpose is to receive supplemental authorization tokens) reveals a structural gap: OAuth was designed for sessions, not for durable event-driven subscriptions. Permission Tickets could fill this gap by acting as a persistent, scoped grant that data holders verify on each notification trigger, issuing a narrow access token only for that interaction. This reframes tickets not as a session-replacement mechanism but as an authorization primitive for asynchronous, event-driven clinical workflows — and it surfaces a design requirement for the spec: the ticket lifecycle must accommodate grants that outlive any single access token by orders of magnitude.

### Tensions Surfaced

- **Intra-facility fragmentation vs. the assumed cross-facility framing.** Permission Tickets are typically motivated by cross-organization exchange, but the multi-EHR-within-one-facility scenario presents a use case where the patient is at a single site yet still faces redundant auth. The spec needs to work for both without assuming organizational boundaries map to authorization boundaries.
- **Durable grants vs. OAuth's session orientation.** The year-long notification grant doesn't fit the mental model of "user authorizes, app gets token, token expires." Permission Tickets need a lifecycle model that supports long-lived grants without requiring periodic re-authorization, while still allowing revocation.
- **Scoping ambition vs. vocabulary readiness.** Granular, clinically meaningful scopes (e.g., "data relevant to this referral type") are desirable and the data holder should enforce them, but the ecosystem lacks shared definitions for what those scopes mean. Moving forward with broad scopes is pragmatic but risks entrenching coarse-grained access patterns that are hard to tighten later.
