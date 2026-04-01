---
id: p22
role: Healthcare Data Exchange Consultant
org_type: consulting
org_size: individual
archetype: consultant
stance: supportive
use_cases:
  - patient_access
  - care_coordination
  - write_access
spec_topics:
  - trust_establishment
  - scoping
  - purpose_of_use
concerns:
  - adoption_barriers
frameworks_referenced:
  - TEFCA
  - Carequality
  - FHIR
  - IHE
  - OAuth2
key_terms:
  - small_vendor_onramp
  - treatment_purpose_bypass
  - write_back_gap
  - kill_the_clipboard
---

## P22: Healthcare Data Exchange Consultant (National Network Exchange)

### Background

Consultant specializing in national-level healthcare data exchange across FHIR, IHE, HL7, X12, and CDA. Works extensively with both large and small EHR vendors on cross-organizational connectivity, with direct visibility into the barriers that prevent smaller technology vendors from participating in national exchange networks.

### Key Positions

- **Smaller EHR vendors are the critical adoption on-ramp for Permission Tickets.** Many smaller EHR vendors have implemented baseline FHIR capabilities but have sat on the sidelines of national network exchange for five to six years because the cost of building out trust infrastructure, participant agreements, and per-site configurations is prohibitive. Permission Tickets could give these vendors a defined, bounded target to implement rather than an open-ended integration challenge — offloading trust establishment to the ticket issuer rather than requiring each small vendor to solve it independently.

- **TEFCA's treatment-purpose limitation is a structural barrier that Permission Tickets can bypass.** The current TEFCA trust framework is heavily oriented around treatment use cases, which creates real barriers for participants whose workflows don't fit that category — individuals exercising access rights, non-clinical organizations, and non-treatment use cases. A Permission Ticket grounded in individual authorization sidesteps the treatment-purpose constraint entirely, because the authorization flows from the person granting permission rather than from a treatment-purpose justification.

- **Write-back is a critical unmet need, especially for referral workflows.** The inability to update a remote system is a major gap in current exchange infrastructure. Referral workflows illustrate the problem clearly: there is no standardized way to write response data back to the originating system. Today the options are limited to IHE 360X, a raw Direct Secure Message, or fax — none of which close the loop cleanly. If Permission Tickets can support scoped write access (e.g., updating a Task or ServiceRequest tied to a specific referral), that would address a gap the current infrastructure has failed to solve.

- **Individual Access Services volume is about to expose how bad the authorization problem really is.** IAS use cases are expanding rapidly, and the site-by-site authorization model will increasingly break down as patients attempt to pull records across multiple systems. Early programs like "Kill the Clipboard" are showing positive outcomes, but adoption remains limited to a handful of EHR technologies. The scale of the problem is not yet fully visible.

### Distinctive Angle

Permission Tickets reframe the national exchange adoption problem for small EHR vendors. These vendors have the FHIR foundation but lack the resources to build out full trust-framework participation. Accepting a signed ticket — verifying a JWT, checking a trusted issuer list, resolving a patient — is a dramatically smaller lift than joining TEFCA or Carequality as a full participant. This positions Permission Tickets not just as an authorization mechanism but as an on-ramp to national-scale exchange for the long tail of EHR vendors that current frameworks have failed to reach.

### Tensions Surfaced

- **TEFCA treatment-purpose scope vs. real-world use-case diversity.** TEFCA's treatment orientation excludes legitimate exchange scenarios. Permission Tickets offer a workaround, but this raises a question about whether they complement TEFCA or create a parallel trust path that bypasses it — and how TEFCA governance would respond.
- **Read vs. write parity.** The exchange ecosystem has optimized heavily for read access while write-back remains fragmented across incompatible mechanisms. Permission Tickets could address this, but scoped write access introduces higher-stakes trust decisions than read access — a data holder accepting a write may need stronger assurances than one returning query results.
- **Small vendor capability vs. adoption ambition.** The argument that Permission Tickets lower the bar for small vendors assumes those vendors have sufficient FHIR and OAuth infrastructure to verify tickets. If even that baseline is beyond their current investment, the on-ramp may still be too steep.
