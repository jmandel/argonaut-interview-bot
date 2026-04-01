---
id: p02
role: Healthcare Data Specialist, Applied AI Team
org_type: Mid-size EHR Vendor
org_size: mid
archetype: ehr_vendor
stance: conditional
use_cases:
  - patient_access
  - payer_claims
spec_topics:
  - scoping
concerns:
  - adoption_barriers
  - workforce_gap
frameworks_referenced: []
key_terms:
  - ai_agent_integration_point
  - piggyback_on_ai_investment
  - compliance_vs_value_framing
  - integrated_payer_provider_model
  - three_layers_of_friction
  - mindset_gap
---

## P2: Healthcare Data Specialist, Applied AI Team (Mid-size EHR Vendor)

### Background

Recently moved from the payer data division to a newly formed AI team at the same mid-size EHR vendor. The team is building AI agents for the company's EHR products. Brings deep experience with payer-side data operations — reporting, specifications, SQL-level work with claims and quality data — and now sits at the intersection of that payer knowledge and EHR product development, though still getting oriented to the EHR platform's internals.

### Key Positions

- **Permission Tickets should be positioned as a competitive differentiator, not merely a compliance obligation.** The EHR vendor should lean into portable authorization as a signal that the product is forward-thinking on patient data flow. The argument isn't just "we must comply with info blocking rules" but "making data flow to patients actually improves the provider's performance on quality measures and risk adjustment under value-based contracts." This reframes patient data access from a cost center into a value driver for the provider customers the EHR serves.

- **Speed and full automation are the priority over granularity or trust mechanics.** When presented with tradeoffs between tight scoping, trust verification, and seamless automation, chose automation decisively. If AI agents inside the EHR will process Permission Tickets, the value proposition depends on a signed ticket arriving, being validated, and triggering data release without human intervention. Any design that requires manual review or portal-based approval steps would undercut the core benefit.

- **Vertically integrated payer-provider organizations demonstrate what good data flow looks like — Permission Tickets should replicate that dynamic for non-integrated entities.** Medicare Advantage plans that also own provider groups get data flowing readily because the same organization has a vested interest in closing HCC risk gaps and improving quality scores. When payer and provider are separate entities, friction multiplies. Permission Tickets could create a structured, automated path that approximates the aligned-incentive data sharing that integrated organizations already achieve.

- **Three layers of friction block payer-provider data exchange today.** Smaller provider groups lack the budget, developer talent, and software to move data out of the EHR safely. EHR software itself has limitations in what it can expose. And the organizational relationship between payer and provider determines whether anyone is motivated to push through the first two barriers. Technical specs alone won't fix the third layer.

- **Internal adoption requires the business case, not just the technical mechanism.** The immediate AI agent roadmap is focused on provider-operational functions: claims documentation, billing, HCC documentation validation. Patient data access is not a priority for the initial build. Moving it up requires both the regulatory stick (info blocking enforcement) and a compelling demonstration that patient engagement through data access feeds back into metrics providers already track — quality scores, risk adjustment performance, disease management participation.

- **The mindset gap is as significant as the technical gap.** The people making build decisions do not yet see the link between patient data engagement and provider performance. The concept of a patient receiving longitudinal lab trends in an app and acting on them — getting a follow-up blood test, enrolling in a disease management program — "is not in the minds of the developers right now." Changing that mental model is a prerequisite for any Permission Ticket implementation getting on the roadmap.

### Distinctive Angle

AI agents already being built inside the EHR could serve as the natural integration point for Permission Tickets. Rather than retrofitting the EHR's existing authorization infrastructure as a standalone project, a purpose-built agent could handle ticket validation, scoped data retrieval, and automated fulfillment as part of its core function. This positions Permission Ticket adoption not as a separate interoperability initiative requiring its own business case, but as a capability layered into AI tooling that is already funded and being built for other reasons. The practical implication for spec design: if the ticket format and validation workflow are simple enough for an AI agent to process programmatically, adoption could piggyback on the current wave of EHR-embedded AI investment rather than competing with it for roadmap space.

### Tensions Surfaced

- **Compliance framing vs. value framing.** Info blocking enforcement provides the regulatory stick, but leading with compliance makes Permission Tickets feel like a mandate to satisfy rather than a capability to invest in. The value-based care argument is more compelling internally but requires outcome evidence that doesn't yet exist in an accessible form. The ask to the standards community: produce data showing patients with data access are more engaged and have better outcomes, so an internal champion can make the business case.
- **Provider-operational priorities vs. patient-facing data flow.** The AI team's roadmap is built around what providers need operationally today. Patient data access is acknowledged as important but cannot compete for resources against features with direct, immediate provider revenue impact. The same person who would champion Permission Tickets cannot currently get them onto the roadmap.
- **Technical readiness vs. organizational readiness.** The technical implementation is not the hard problem. The hard problem is getting decision-makers to understand why patient data engagement matters to the metrics they already care about. A technically elegant spec will not overcome an organization that doesn't see the value.
