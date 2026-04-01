---
id: p01
role: FHIR Platform Designer & Integration Lead
org_type: Large EHR Vendor
org_size: large
archetype: ehr_vendor
stance: conditional
use_cases:
  - payer_claims
  - public_health
spec_topics:
  - scoping
  - data_holder_issuance
  - org_identity
  - trust_establishment
  - issuer_model
  - purpose_of_use
concerns:
  - issuer_viability
  - over_provisioning
  - security_blast_radius
  - data_segmentation_limits
frameworks_referenced:
  - SMART
  - FHIR
  - OAuth2
  - TEFCA
key_terms:
  - scoping_layer_over_existing_access
  - blast_radius_reduction
  - org_identity_as_third_input
  - self_pay_compliance_gap
  - api_surface_update_cost
  - data_holder_portable_tickets
---

## P1: FHIR Platform Designer & Integration Lead (Large EHR Vendor)

### Background

Works on both FHIR API design and hands-on customer deployment — configuring, testing, and managing FHIR integrations across many health systems. This dual role (spec-level design + operational reality) gives them unusually grounded views on what's buildable versus what customers will actually operationalize.

### Key Positions

- **Permission Tickets must be use-case specific, not a universal authorization pattern.** Some use cases fit well; applying tickets as a general-purpose mechanism would be a mistake. The strongest fit is backend B2B flows where an already-authenticated client needs dynamic, per-request scoping — e.g., narrowing a payer's access to a specific patient or claim rather than granting broad resource-level access.

- **Data-holder-issued tickets are the most natural starting point, not third-party consent platforms.** The clearest model is public health: a provider sends a case report and issues a ticket authorizing the public health agency to query back for scoped follow-up data on that specific patient and condition. This eliminates the blast radius of a compromised PHA — they can't query all patients at all connected data holders, only cases where tickets were explicitly issued. Skeptical that an independent consent management platform can serve as issuer: "I struggle to see a business model where such a business could play this role in a financially viable way."

- **Data-holder-issued tickets can become portable.** The public health model extends naturally: a ticket issued by Hospital A during a case report could be presented by the PHA to Hospitals B and C in the same region to query for data on the same patient. Trust establishment for this is practical and local — driven by network membership (TEFCA), regional coordination, or the PHA itself maintaining a directory of connected organizations.

- **Organization identity is a critical gap that exists independent of Permission Tickets.** Current SMART flows have client ID (the app) and user identity, but not the organization on whose behalf the request is made. This third input is essential for building usable access controls — particularly for payer access where filtering obligations (e.g., self-pay data) depend on knowing *who* is asking and *in what capacity*. Permission Tickets might carry org identity in some flows, but it needs a standalone mechanism too because the need exists in ordinary SMART flows (e.g., standard (g)(10) exchange).

- **Payer FHIR access has an active, possibly unrecognized compliance problem.** Self-pay data filtering is technically supported but "difficult and non-obvious," and many organizations are proceeding without considering it. Suspects self-pay data is being shared with payers inappropriately today. Org identity as a standardized input would make it easier for customers to build correct access controls without bespoke per-site logic.

- **The authorization server changes are not the hard part.** Parsing and validating tickets is a manageable lift. The real engineering cost is downstream: updating a large API surface area to actually *use* the scoping and identity information the ticket provides when making access control decisions. Every API that currently makes access control decisions needs to be updated to factor in ticket-provided constraints.

### Distinctive Angle

Tickets are most valuable not for replacing existing authentication but for **adding a scoping layer on top of already-authenticated backend connections**. Current backend OAuth scopes limit data categories but not which patients — the ticket fills that gap. This reframes Permission Tickets from "new way to get access" to "new way to constrain access that's already granted," a fundamentally different adoption pitch to data holders who already have working B2B integrations.

### Tensions Surfaced

- **Org identity needs to work everywhere, not just in ticketed flows.** If it's only available via Permission Tickets, it won't solve the broader access-control problem (especially payer filtering). But designing two separate mechanisms — one in tickets, one standalone — adds complexity.
- **Local trust vs. scalable trust.** Expects early adoption to be locally coordinated (health systems + their regional exchange partners), which is pragmatic but raises questions about how this grows beyond pre-coordinated relationships.
- **Consent platform viability.** The spec may assume an independent issuer ecosystem that the market won't actually produce, pushing the design toward data-holder issuance by default.
