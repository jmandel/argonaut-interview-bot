---
id: p20
role: "Family caregiver managing elderly parent's care across multiple providers"
org_type: "advocacy"
org_size: individual
archetype: caregiver
stance: conditional
use_cases:
  - caregiver_proxy
  - patient_access
  - care_coordination
spec_topics:
  - consent_representation
  - scoping
  - trust_establishment
concerns:
  - provider_resistance
  - workforce_gap
  - adoption_barriers
frameworks_referenced:
  - HIPAA
key_terms:
  - plain_language_credential
  - human_interpretation_problem
  - reprove_authority_cycle
  - full_vs_scoped_delegation
  - front_desk_gatekeeping
  - compounding_administrative_burden
---

## P20: Caregiver & Health Information Representative (Family caregiver managing elderly parent's care)

### Background

Serves as full health information representative for an elderly parent, managing medical records, billing, provider communication, and care coordination across 4-5 providers. Responsibilities include requesting and sharing records, seeking corrections, tracking lab results, verifying network status and coverage, and navigating prior authorization processes. This operational breadth — spanning clinical, administrative, and financial domains — provides a ground-level view of how authorization failures compound across a fragmented system.

### Key Positions

- **Re-proving legal authority at every provider is the central friction, not portal login.** The problem is not finding or authenticating into portals — it is that each provider requires independent proof of identity and legal authority (power of attorney, custom authorization forms, faxed copies of a driver's license) every time. Providers frequently cannot digitally capture or retrieve previously submitted documentation, so the cycle repeats on each contact. Estimates 2-3 days of effort per provider to establish access.

- **Providers sometimes refuse access regardless of valid legal documentation, and there is no effective recourse.** Has attempted to explain legal authority, information blocking rules, and the actual scope of privacy law to front-desk staff — with limited success. Staff turnover resets whatever understanding was previously established. In some cases, the only outcome is giving up: "There have been times when I just give up."

- **Permission Tickets must be legible to front-line staff, not just technically valid.** The people who gatekeep access are typically low-level administrative staff, not clinicians. They make quick judgment calls in busy, often crowded, multilingual environments. A credential that is technically correct but not plainly understandable will reproduce the same refusal pattern. Recommends brief explanatory text describing what the ticket allows, under what authority, and within what guardrails — in plain language.

- **Full-scope access is necessary for a primary representative, but the system should support scoped delegation to others.** As the sole active caregiver, needs the same range of action the patient would have: accessing records, asking questions, requesting corrections, authorizing inter-provider sharing. However, recognizes that other caregivers or providers involved in the patient's care should only see information relevant to their role — the system needs to support both full and partial delegation.

- **Privacy concerns center on real-world conditions, not abstract threat models.** Worries less about sophisticated technical attacks and more about who else could use the credential and whether staff in busy, crowded environments with varying language proficiency will handle information appropriately. Privacy breakdowns in this context are environmental and human, not primarily technological.

### Distinctive Angle

The authorization problem in healthcare is typically framed as a system-to-system integration challenge — apps connecting to EHRs, payers querying providers. From the caregiver vantage point, the bottleneck is a human one: a front-desk staff member deciding in real time whether to honor a legal document they may not understand, in a language they may not be fully comfortable with, under time pressure. Permission Tickets that solve only the technical verification problem will fail if they do not also solve the human interpretation problem at the point of contact. This means the credential itself — or a companion artifact — needs to function as a plain-language explainer that gives non-specialist staff confidence to act, not just a machine-readable token. The spec should consider what the ticket looks like to the person who actually decides whether to grant access, not only to the system that processes it. "The amount of time and energy it takes to access and share records is another layer of stress that caregivers experience in addition to the personal care needed each day, the financial toll of care, and the emotional toll of a loved one's suffering."

### Tensions Surfaced

- **Legal authority vs. operational recognition.** Having valid legal documentation (POA, driver's license) does not guarantee access. The gap is not legal but operational — staff either don't understand the documents, don't trust them, or lack a process to act on them. Permission Tickets inherit this problem unless they are designed to close the gap between legal validity and front-line acceptance.
- **Security vs. usability in low-resource environments.** The credential must be secure enough that only the authorized caregiver can use it, but it must function in environments where staff have limited training, high turnover, language barriers, and no time for complex verification procedures. Making it more secure risks making it less usable in exactly the settings where it needs to work.
- **Full delegation vs. scoped delegation.** As primary representative, needs unrestricted access. But acknowledges that other caregivers and providers should be constrained. The system must support a spectrum from full proxy to narrow role-based access, which adds design complexity.
- **Administrative burden as compounding harm.** Every hour spent re-proving authority, re-faxing documents, and re-educating staff is an hour taken from direct caregiving, financial management, and the caregiver's own wellbeing. The cost is not just inefficiency — it is human capacity lost from an already strained situation.
