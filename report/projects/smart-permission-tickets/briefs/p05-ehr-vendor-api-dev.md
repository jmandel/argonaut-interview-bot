---
id: p05
role: API & Structured Documents Dev Manager / FAST Security Co-Chair
org_type: EHR vendor
org_size: mid
archetype: ehr_vendor
stance: supportive
use_cases:
  - cds_hooks
  - payer_claims
  - patient_access
  - public_health
spec_topics:
  - format_alignment
  - client_binding
  - scoping
  - purpose_of_use
concerns:
  - spec_proliferation
  - scope_governance
  - security_blast_radius
frameworks_referenced:
  - UDAP
  - SMART
  - FHIR
  - CDS_Hooks
key_terms:
  - on_demand_scoping
  - constraint_over_category
  - cds_hooks_token_replacement
---

## P5: API & Structured Documents Dev Manager / FAST Security Co-Chair (Mid-Size EHR Vendor)

### Background

Manages the API and structured document development team at a mid-size EHR vendor, responsible for building and maintaining the authorization infrastructure that supports FHIR-based exchange. Also serves as co-chair of the FAST Security workgroup, giving a dual vantage point: hands-on implementation of authorization flows inside an EHR product, and active participation in the standards governance that shapes how those flows are specified.

### Key Positions

- **CDS Hooks token exchange is a concrete, immediate use case for Permission Tickets.** The current CDS Hooks model issues a generic token up front whether or not the service actually needs data access, and that token is broadly scoped. Permission Tickets could flip this to an on-demand model: the EHR sends a ticket with the hook invocation, and the CDS service exchanges it for a narrowly scoped access token only when it actually needs to pull data. This is a better fit for the interaction pattern — most hook invocations don't require data retrieval, and when they do, the access should be scoped to what that specific invocation requires.

- **Permission Tickets must align with UDAP Certifications and Endorsements, not diverge from them.** The UDAP Certifications and Endorsements specification already addresses conveying trusted assertions about an entity. If Permission Tickets solve a different problem but use a divergent format, that creates unnecessary implementation burden for vendors who must support both. At minimum, if the problem spaces differ, the formats should be kept similar enough that implementers can reuse infrastructure. More broadly, FAST and SMART alignment is "very critical" — the ecosystem cannot afford parallel, incompatible authorization stacks.

- **Client key binding is a hard requirement.** Tickets must be usable only by the system they were issued to. Cryptographic binding via JWK Thumbprint is a promising mechanism, though it needs further evaluation. Without binding, a stolen or intercepted ticket becomes a bearer credential with no technical constraint on who can use it.

- **Permission Tickets could bypass the governance deadlock on purpose-of-use granularity for payer access.** Today, purpose of use operates at the network level and is too broad to control what actually comes back from the FHIR server. Defining more specific purpose-of-use categories has stalled as a governance and consensus problem, not a technical one. Permission Tickets could sidestep this by encoding concrete, per-request constraints — specific resource types, encounters, date ranges — rather than requiring the ecosystem to agree on a taxonomy of access levels. Concrete constraints on individual requests are easier to reach agreement on than abstract categories.

- **Implementation priority is governed by three criteria: reusability across use cases, whether it addresses a real security gap, and whether it improves on a current solution that needs improvement.** Permission Tickets score on all three — they apply to CDS Hooks, patient access authorization, temporary or one-off client access, public health exchange, and payer access differentiation, while also tightening security and improving on mechanisms (like the CDS Hooks token) that are acknowledged to be too generic.

### Distinctive Angle

Permission Tickets have a natural fit as a replacement for the CDS Hooks token exchange pattern. The current model issues a broadly scoped token proactively, regardless of whether the CDS service will actually need data access. A ticket-based model would defer token issuance to the point of need and scope it to the specific hook invocation, reducing both the attack surface and the wasted authorization overhead. This reframes tickets not as a new access mechanism for cross-organizational exchange but as an improvement to an existing intra-workflow authorization pattern that ships with every EHR supporting CDS Hooks today. The same principle — tickets as an on-demand scoping layer over existing flows — extends to payer access, where per-request constraints encoded in tickets could break the governance stalemate on purpose-of-use granularity without requiring ecosystem-wide agreement on new categories.

### Tensions Surfaced

- **Standards convergence vs. independent innovation.** Permission Tickets need to solve real problems that UDAP Certifications and Endorsements do not, but diverging from UDAP's format and trust model creates implementation cost for vendors who must support both. The tension is between moving fast on a targeted solution and maintaining alignment across a fragmented standards landscape.
- **Governance consensus vs. technical capability.** The technical infrastructure to scope payer access more narrowly already exists, but the ecosystem cannot agree on the categories. Permission Tickets could route around this by encoding constraints directly, but that shifts the governance question from "what categories do we agree on?" to "what constraint vocabulary do we agree on?" — which may prove equally contentious at scale.
- **On-demand scoping vs. workflow latency.** The CDS Hooks use case benefits from deferring token issuance to point of need, but this adds a round-trip to the authorization server during what is currently a synchronous, latency-sensitive clinical workflow. The security and scoping benefits must be weighed against the performance implications for real-time CDS.
