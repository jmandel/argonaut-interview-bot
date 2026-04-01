---
id: p18
role: Data Integration Lead
org_type: Academic Medical Center
org_size: large
archetype: provider_org
stance: conditional
use_cases: []
spec_topics:
  - trust_establishment
  - issuer_model
  - scoping
  - category_authorization
  - ds4p
concerns:
  - data_segmentation_limits
  - adoption_barriers
  - over_provisioning
frameworks_referenced:
  - SMART
  - OAuth2
  - FHIR
  - 42CFR
key_terms:
  - per_issuer_trust
  - policy_overlay
  - request_ceiling
  - non_delegable_filtering
  - edsp_process
---

## P18: Data Integration Lead (Large Academic Medical Center)

### Background

Works on a data integration team at a large academic medical center, connecting third-party and internal applications to the EHR. Every integration passes through a multi-stakeholder governance process involving API owners, HIM/Privacy, and Security — giving this participant a grounded view of what institutional adoption of any new authorization mechanism actually requires.

### Key Positions

- **Permission Tickets should shift the unit of trust from per-application to per-issuer.** Today, each integration goes through a formal Enterprise Data Service Provisioning (EDSP) process requiring BAA execution (and IRB for research), with 3-6 weeks for approval and additional weeks to months for testing and go-live. Pre-approving issuers — rather than reviewing individual tickets — would let the same governance rigor apply once per issuer relationship, with individual transactions flowing automatically afterward.

- **Each issuer relationship needs a high-level policy overlay that does not create per-transaction friction.** The organization would restrict what resource types and scopes a trusted issuer's tickets can authorize, but these constraints should be broad category-level boundaries (e.g., allowing clinical documents and labs but not behavioral health records), not gates on individual requests.

- **Sensitive data filtering is non-delegable.** The organization would not trust an external ticket's self-proclaimed data filters. Sensitivity rules — including 42 CFR Part 2 and behavioral health protections — are embedded in the EHR's user security model and would be enforced locally regardless of what a ticket requests. "Our organization is unlikely to trust a 3rd party query's self-proclaimed data filters."

- **Issuer onboarding requires sign-off from distinct internal stakeholders with different concerns.** Security validates the OAUTH2/SMART technical mechanism; HIM/Privacy reviews and approves scope boundaries. Both must be satisfied before an issuer is accepted — mirroring the existing multi-team EDSP review but applied at the issuer level.

### Distinctive Angle

Permission Tickets do not need to displace existing governance structures at provider organizations — they need to give those structures a different, more scalable unit of review. The same teams (Security, HIM/Privacy, API owners) apply the same rigor they use today, but to the issuer relationship instead of each individual application. Spec design that makes issuer-level properties — identity, scope boundaries, technical profile — easy to evaluate in a one-time review, and hard to silently change afterward, would align with how large provider organizations already operate. The corollary is that sensitive data enforcement stays entirely outside the ticket's authority: the ticket defines a request ceiling, and local policy determines what is actually returned.

### Tensions Surfaced

- **Local control vs. operational benefit.** The appeal of Permission Tickets is reducing per-integration burden, but the organization would still maintain a policy overlay and enforce its own sensitivity rules. The more local controls accumulate, the smaller the efficiency gain — though the shift from per-app to per-issuer review is itself a substantial reduction.
- **High-level policy vs. meaningful constraint.** Wanting the overlay to be "high level" and "not impede interactions" while still setting real boundaries creates a design challenge: constraints broad enough to avoid friction may provide little protection, while constraints narrow enough to be protective may recreate per-request gatekeeping.
