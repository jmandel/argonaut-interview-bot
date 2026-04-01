---
id: p08
role: "Mobile health platform developer leading clinical health records integrations"
org_type: "Major consumer technology company"
org_size: large
archetype: app_developer
stance: supportive
use_cases:
  - patient_access
spec_topics:
  - discoverability
  - token_lifetime
  - scoping
  - issuer_model
  - trust_establishment
  - data_holder_issuance
concerns:
  - adoption_barriers
  - security_blast_radius
frameworks_referenced:
  - SMART
  - FHIR
  - US_Core
key_terms:
  - bootstrap_from_one_portal
  - rolling_refresh_window
  - portal_login_drop_off
  - discovery_at_scale
---

## P8: Mobile Health Platform Developer (Major Consumer Technology Company)

### Background

Leads the team responsible for a clinical health records feature in a consumer health app on a major mobile platform. The feature uses SMART App Launch and US Core to let users connect to provider portals and download clinical data. The team maintains integrations with approximately 14,000 US institutions, giving them a large-scale operational view of per-portal authentication friction and its failure modes.

### Key Positions

- **Portal login is the dominant failure point in the current patient-directed flow.** The connection process has three points where users drop off: discovering their institution from ~14,000 options, authenticating at the portal, and maintaining the connection as refresh tokens expire. The portal login step produces the largest loss because users either lack credentials or cannot remember them. Consent-screen drop-off is invisible to the app since authentication happens inside a secure web view.

- **The most pragmatic ticket creation path is bootstrapping from a portal the user already connects to.** The ideal experience would be something as frictionless as platform-level single sign-on, but that is unrealistic in this context. A workable alternative: the user logs in to the one provider whose credentials they actually remember, and that institution issues a Permission Ticket usable at others. This meets users where they are — most can connect to at least one provider even if they cannot connect to all. A more ambitious path would be standalone identity-proofing, but the bootstrap model is deployable without new infrastructure.

- **Partial adoption is strictly additive.** The app would use ticket-based connections where available and fall back to individual portal login everywhere else, running both flows simultaneously. Mixed adoption is handled in the discovery layer so users never encounter a confusing rejection — they see the smoother flow where it works and the familiar login where it does not. No critical mass is needed before value accrues.

- **Machine-readable discoverability of issuer acceptance is a hard requirement.** With 14,000 institutions, it is not feasible to manually curate which ones accept tickets from which issuers. The determination must happen programmatically, behind the scenes, so the app can route users to the right flow without exposing them to dead ends. This likely means extending existing FHIR endpoint directories with issuer-acceptance metadata.

- **Token lifetime should follow the existing 3-month rolling window.** A regulatory expectation already exists for refresh tokens to remain valid for three months if used within that period. Permission Tickets should adopt the same model. Each forced re-authentication is a moment where users may not return — repeated disconnects erode willingness to manually reconnect.

- **SMART scopes should transfer directly into tickets.** The app already uses SMART scopes for granular access control; users do not grant all-or-nothing access today. The existing scoping model should carry forward rather than requiring a new authorization vocabulary.

### Distinctive Angle

The bootstrap model reframes ticket issuance as an extension of a step users already take rather than a new ceremony. For a platform managing 14,000 integrations where the dominant drop-off is at portal login, the strategic question is not how to replace portal login but how to make one successful login propagate. A user who authenticates at Provider A should be able to present a ticket derived from that authentication to Providers B through N. This implies the spec should explicitly support a flow where a data holder issues a ticket at the patient's direction, the patient's app holds the ticket, and other data holders accept it — turning one authentication event into broad access without requiring a separate identity-proofing service.

### Tensions Surfaced

- **Ticket creation as a new drop-off point.** If creating a Permission Ticket requires a verification step that is itself difficult or unfamiliar, it replaces one barrier with another. The bootstrap model mitigates this by anchoring in existing credentials, but the portal login that seeds the ticket is itself the step with the highest current drop-off.
- **Rolling refresh vs. security expectations.** Short-lived tokens feel safer, but the 3-month rolling window has regulatory grounding and matches user behavior patterns. Permission Tickets may face pressure toward shorter lifetimes given that they carry broader access than a single-institution refresh token — a stolen ticket could unlock data at multiple institutions rather than one.
- **Discovery at scale vs. early-phase simplicity.** Machine-readable discoverability is essential at 14,000 integrations, but building and maintaining issuer-acceptance directories adds infrastructure that may not exist during early adoption when only a handful of institutions participate. The gap between what the ecosystem can deliver at launch and what this scale of platform requires could delay adoption by the very consumer app that would benefit most.
