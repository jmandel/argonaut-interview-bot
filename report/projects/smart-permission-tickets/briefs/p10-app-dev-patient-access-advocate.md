---
id: p10
role: Chief Data Interoperability Officer
org_type: Native corporation, federal contracts
org_size: mid
archetype: consultant
stance: supportive
use_cases:
  - patient_access
  - caregiver_proxy
spec_topics:
  - trust_establishment
  - consent_representation
concerns:
  - adoption_barriers
frameworks_referenced:
  - FHIR
  - HIPAA
key_terms:
  - birth_to_death_identity
  - patient_demand_as_market_force
  - authorization_ceremony_burden
---

## P10: Chief Data Interoperability Officer (Native corporation, federal contracts)

### Background

Thirty years in healthcare data with a focus on patient access. Works as Chief Data Interoperability Officer for a Native corporation selling primarily into the federal government, with direct experience on ONC programs and FHIR standards work. Holds MSIS, CDMP, PMP, and FACHDM credentials.

### Key Positions

- **Per-site authorization ceremonies are the core failure mode, and the consequences are measured in patient harm.** "People are dying because we aren't doing this today." The fragmentation burden falls hardest on families managing children with special needs — many providers, no coordinated care plans, and a data aggregation process so onerous that "it boggles the mind that any care gets delivered that doesn't cause harm." A patient app that requires separate authorization ceremonies at every data holder is "antiquated."

- **The technology for portable authorization already exists; the blockers are trust and education.** The technical problem of aggregating patient data across organizations is essentially solved — it's just not standardized. The real gaps are establishing public trust in the mechanism and educating patients that managing health data is a critical, lifelong responsibility, starting with families of young children. The industry has done "a poor job" of this education to date.

- **Patient demand is the market force that will drive data holder adoption — regulation alone is insufficient.** If patient advocates and early adopters create demand, data holders will follow for market reasons. The conversation needs to shift from "what does HIPAA say" to "what enables the best care possible." That reframing — from compliance obligation to care quality — is what builds the trust necessary to move the industry. Regulation without "economic muscle" has not been enough.

- **CMS partnership is critical — voluntary standards processes alone will not move at the pace the problem demands.** There is a trap in relying too heavily on voluntary adoption. Moving the industry requires both sticks and carrots, and having CMS as a partner and early adopter would be essential to creating momentum. CMS should function not just as a downstream regulator but as a participant that legitimizes the approach.

- **A birth-to-death health data identity is the right end state.** Envisions an account created at birth, managed by parents until the child reaches majority, then transferred — enabling continuous maintenance of a longitudinal health record for life. This should be framed as a right and a convenience, not a mandate: "something that we do because it's our right and it will improve care, not just for ourselves but for others."

### Distinctive Angle

The birth-to-death identity model reframes Permission Tickets from a point solution for app connectivity into infrastructure for a lifelong patient data relationship. Under this model, the ticket mechanism isn't just about unlocking records from current providers — it's the authorization layer for a record that accumulates across decades, through pediatric-to-adult transitions, provider changes, and evolving care needs. This has concrete design implications: the system must handle parent-to-child authority handoffs at majority, support delegation across a patient's full lifespan, and remain usable enough that maintaining it feels like exercising a right rather than carrying a burden.

The theory of change also runs in an unusual direction. Rather than designing the spec and working outward to adoption, the sequence starts from patient awareness and works inward — if patients demand portable access, data holders will build it, and standards formalize what the market is already producing. CMS sits at the hinge: not a regulator who enforces after the fact, but an early adopter whose participation creates the initial credibility that patient demand can build on.

### Tensions Surfaced

- **Voluntary standards vs. the pace harm demands.** The standards process is valued but considered too slow given the patient safety cost of delay. This creates pressure toward regulatory mandates and CMS partnerships that could bypass the careful consensus-building the standards community relies on.
- **Right vs. convenience.** The longitudinal health data identity is framed as both a right and something that must be convenient. But rights-based framing can push toward mandates and completeness, while convenience-based framing risks making participation feel optional. The birth-to-death vision requires both to hold simultaneously.
- **Patient-driven adoption vs. patient capacity.** The theory of change depends on patients understanding and demanding portable access, but the populations who need it most — families managing complex care for children with special needs — are the least likely to have bandwidth for health data advocacy. Education alone may not bridge that gap.
