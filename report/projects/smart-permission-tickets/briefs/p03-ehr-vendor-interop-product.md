---
id: p03
role: Interoperability Product Leader
org_type: EHR vendor
org_size: mid
archetype: ehr_vendor
stance: conditional
use_cases:
  - payer_claims
  - public_health
spec_topics:
  - category_authorization
  - scoping
  - trust_establishment
concerns:
  - adoption_barriers
  - scope_governance
frameworks_referenced:
  - TEFCA
  - Carequality
  - SMART
  - FHIR
key_terms:
  - marketplace_scaling
  - combinatorial_approval_matrix
  - category_membership_control
  - binary_accept_reject
---

## P3: Interoperability Product Leader (Mid-size EHR Vendor)

### Background

Leads interoperability product at a mid-size EHR vendor whose platform serves many independent practice clients. All third-party FHIR access is provisioned through a marketplace model where client sites individually approve system apps for access — a binary accept/reject decision with no per-scope granularity.

### Key Positions

- **The current access model is all-or-nothing, and clients are not requesting finer controls.** Practices either authorize a system app in the marketplace or they don't. If a client objects to any aspect of what an app could access, the only recourse is to deny the app entirely. This makes the granular-scoping pitch for Permission Tickets initially uncompelling — there is no client-side demand pulling toward it.

- **Category-based authorization is the most resonant framing of Permission Tickets.** The idea of grouping apps into categories (e.g., payers, public health agencies) and letting practices approve an entire category — rather than individual apps one by one — landed as a concrete product opportunity. It could increase integration uptake by collapsing the combinatorial approval burden: "I can still provide the list of all apps that fall in that category and all API activity is audited anyway so this could increase uptake and improve interoperability."

- **Practice control over category membership is a hard requirement.** The category model breaks if a practice approves a category and an unwanted participant is later added without the practice's knowledge. "What if I have a category for payers and suddenly a payer that the practice doesn't want to share data with gets added and the practice finds out later" — that scenario would seriously damage the platform's relationship with the client. Any category model must include notification, opt-out, or re-approval mechanisms, and those mechanisms would need to live in the platform layer, not the spec itself.

- **The technical lift for ticket validation is manageable.** Adding ticket verification to the existing authorization server is additive work that builds on current infrastructure, not a significant rework. The token endpoint flow already handles client assertions; ticket validation layers on naturally.

- **Permission Tickets parallel the network trust decisions practices already make.** Drew an immediate comparison to TEFCA and Carequality, where practices make a framework-level participation decision rather than approving each counterparty individually. Recognized that tickets would add per-request scoping (specific patient, resource types, time window) on top of that framework-level trust — granularity that network exchange alone does not currently deliver.

### Distinctive Angle

Permission Tickets solve a marketplace scaling problem, not just an authorization design problem. A vendor managing many system apps across many practice clients faces a combinatorial approval matrix: every app requires a separate decision at every site. Category-based authorization, backed by tickets, collapses that matrix. Practices still make deliberate trust decisions, but at the category level — one decision covers a class of requesters, and the ticket governs the scope of each individual request. The adoption incentive here is not regulatory compliance or consent granularity; it is increased integration uptake through reduced approval friction. The enthusiasm was not for what tickets constrain but for how many integrations they could unlock.

### Tensions Surfaced

- **Reduced friction vs. retained control.** Category-based approval makes onboarding easier, but the moment category membership changes without practice awareness, the trust model breaks. The spec can define ticket format and validation, but category management UX — notifications, opt-out windows, locked membership lists — lives in the platform layer and will determine whether practices accept the model.
- **No current demand vs. latent need.** Clients are not asking for granular scoping today, but that may reflect the limitations of the current binary model rather than genuine indifference. If categories made scoped access available without operational burden, demand might surface — but there is no way to validate this without building the capability first.
- **Platform-managed vs. externally-issued categories.** The category model is most comfortable when the platform itself defines and maintains category membership. Deferring category definition to an external ticket issuer introduces a trust dependency the platform does not currently have and may resist, since it means an outside party can effectively change who has access to practice data.
