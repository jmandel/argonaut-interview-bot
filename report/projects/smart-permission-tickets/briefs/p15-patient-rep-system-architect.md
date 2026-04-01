---
id: p15
role: "Retired System Architect, Federal Health Record Systems (Patient Representative)"
org_type: individual
org_size: individual
archetype: patient
stance: philosophical
use_cases:
  - patient_access
spec_topics:
  - trust_establishment
  - issuer_model
  - scoping
  - consent_representation
  - client_binding
concerns:
  - over_provisioning
  - consent_not_verifiable
  - security_blast_radius
  - adoption_barriers
  - spec_proliferation
frameworks_referenced:
  - OCAP
key_terms:
  - castle_and_drawbridge
  - membrane_architecture
  - humpty_dumpty_syndrome
  - object_capability_security
  - ai_permission_agent
  - semantic_unity
  - post_release_controls
---

## P15: Retired System Architect, Federal Health Record Systems (Patient Representative)

### Background

One of the lead software architects of two national-scale federal health record systems (VA and DoD), responsible for security system design and for defending those designs to national security reviewers. Designed from a semantic and decentralized perspective, building on a unified data model. Now a patient navigating records through a large integrated delivery network's portal, bringing both deep architectural experience and firsthand frustration with the systems that succeeded the ones he built.

### Key Positions

- **The "castle and drawbridge" perimeter security model is architecturally wrong, not just inconvenient.** The current system treats hospitals as security perimeters — trusted on the inside, untrusted on the outside — with authorization mechanisms (including Permission Tickets) focused on getting through the gate. But the model provides no governance over what happens to data after it leaves. Permission Tickets, as currently framed, reinforce this by treating the data holder as the natural center of authorization. The result is an ever-expanding attack surface with no post-release controls.

- **Security should be a property of the information object itself, not the institution holding it.** Advocates a "membrane" architecture where each information object carries its own access rules, exposes data selectively with built-in auditability, and "phones home" to report how it is being used — regardless of where the data physically resides. This draws directly on Mark Miller's Object Capability Security (OCAP) paradigm: the capability *is* the access, scoped and attenuable (you can hand someone a more restricted version but never more), inseparable from the data it governs.

- **Patients have zero visibility into who accesses their data, what they have authorized, or what secondary uses are in progress.** Cannot recall what information policies have been agreed to. Knows data aggregators are accessing information but has no audit trail and no way to inspect flows. "No one can read all of the fine print, remember it, and assume that the provider is actually following the rules." The trust model is entirely one-directional — the patient trusts the castle and every castle it connects to, creating an n-squared complexity problem with no transparency.

- **Granular patient control is essential but must be managed by a trusted AI agent, not by the patient directly.** Wants to share physical therapy notes in contexts where more sensitive information should stay private. But recognizes that nobody can read, remember, or verify compliance with fine print across every authorization. The resolution: an AI agent that manages granular permissions at the machine level, tracks authorization flows and changes, monitors for leaks, and could even perform penetration testing to detect whether information has escaped its authorized boundaries. "The patient doesn't need to see the granularity that an agent could easily understand, look at attack and exposure surfaces."

- **The fragmentation problem — "Humpty Dumpty syndrome" — consumes most of the ecosystem's energy.** Health information has been shattered into fragments across systems, and the industry spends the bulk of its engineering effort trying to reassemble the pieces rather than questioning whether the fragmentation was the right architecture. The original federal systems achieved semantic density with a unified model — a single language, 19 commands, 22 functions, one data type — that current approaches have lost through ever-expanding enumeration and "integration crunch" thinking. Permission Tickets risk becoming another reassembly patch rather than addressing the underlying design failure.

- **Permission Tickets may address a specific practical problem but are not the right long-term direction.** Does not reject them outright, but views them as incremental fixes to a fundamentally flawed architecture. The more consequential question is whether AI, large language models, and natural language capabilities create an opening to rethink the foundation — moving toward patient-centric, semantically unified information spaces rather than layering more mechanisms onto the current fragmented model.

### Distinctive Angle

The OCAP/membrane model reframes the entire authorization question. Instead of asking "who should be allowed through the gate," it asks "what should the data itself permit, wherever it goes?" Access rules are not policies enforced at organizational boundaries — they are inherent properties of the information object that travel with it, constrain every holder, and report back on usage. Paired with an AI agent that manages the complexity on the patient's behalf — tracking authorizations, monitoring flows, and actively probing for unauthorized exposure — this points toward an architecture where security scales with data movement rather than collapsing once data leaves the originating institution. For spec designers, the challenge is whether Permission Tickets can be designed to carry post-release constraints and auditability, moving toward object-level governance, rather than functioning solely as one-time keys to the drawbridge.

### Tensions Surfaced

- **Granularity vs. cognitive load.** Wants fine-grained, per-context sharing decisions but acknowledges no human can manage that complexity. Resolves this through AI delegation, but that introduces a new trust dependency: the patient must trust the agent, and the agent must be trustworthy in a domain where errors have serious consequences. Building such an agent also requires exactly the kind of auditable, machine-readable authorization infrastructure that Permission Tickets could provide.
- **Pragmatic incrementalism vs. architectural rethinking.** Acknowledges that Permission Tickets could solve a specific near-term problem, but worries that each patch reduces the pressure to address the deeper architectural failure. The tension is familiar in standards work: ship what's buildable now, or hold out for the right foundation.
- **Semantic unity vs. fragmentation.** Designed in an era where the entire system shared a single semantic model. Views the current ecosystem's proliferation of codes, standards, and integration layers as the root cause of the problems Permission Tickets are trying to solve — but recognizes that arguing for semantic reunification is "a tough sell" to people immersed in the current paradigm.
- **Castle-model data holders aren't going away.** The critique of hospital-centric security is structurally sound, but hospitals hold the data and will continue to. Any object-capability or membrane approach must either work within that reality or propose a credible transition path — which remains unspecified. The Kaiser/Google Form incident — a health class instructor collecting medical record numbers via an unencrypted Google form, with the organization dismissing the concern when reported — illustrates that even large, well-resourced health systems may not treat data governance failures seriously when they originate from inside the perimeter.
