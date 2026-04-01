---
id: p17
role: "Principal Enterprise Architect, Consumer IAM"
org_type: "provider organization"
org_size: large
archetype: provider_org
stance: conditional
use_cases:
  - patient_access
spec_topics:
  - trust_establishment
  - scoping
  - org_identity
  - issuer_model
concerns:
  - over_provisioning
  - adoption_barriers
  - scope_governance
frameworks_referenced:
  - TEFCA
  - CMS-0057
key_terms:
  - agentic_identity
  - two_track_trust
  - scope_aware_gateway
  - real_time_trust_validation
---

## P17: Principal Enterprise Architect, Consumer IAM (Large Provider Organization)

### Background

Designs and models enterprise identity and access management capabilities for consumer-facing systems at a large provider organization. Responsibilities span consumer identity proofing, access governance, and emerging work on agentic identity. Currently leading the organization's architectural response to TEFCA participation and CMS pledge requirements — both of which force a shift from a historically closed membership model to accepting requests from individuals with no prior relationship in their systems.

### Key Positions

- **Identity proofing at IAL2 is a hard requirement, not a policy preference.** Any external requester — whether arriving through a trust network or independently — must present identity assurance at IAL2 or above from a recognized credential service provider. This is non-negotiable in the architecture and applies uniformly regardless of the channel through which the request arrives.

- **Trust operates on two distinct tracks, and each needs different machinery.** When identity proofing comes through a verified network like TEFCA, trust is implicit — the network's participation requirements serve as the trust framework. For non-network participants, the organization must build its own trust model, evaluating and onboarding external issuers before they can engage the gateway. Gateways block unrecognized parties by default.

- **Trust can be established at request time, not only through pre-negotiation.** The architecture supports real-time trust validation: when a token arrives, the system introspects to evaluate and validate the signature and issuer before honoring any request. This means trust-first-then-honor without necessarily requiring months of advance coordination — but the sequence is strict. No request proceeds until trust is confirmed.

- **Over-provisioning is a fundamental security failure, and current network frameworks don't share that concern.** The architecture is built to manage and mitigate over-provisioning, but TEFCA and CMS pledge requirements don't always define scope with the same granularity. This creates a live conflict: the organization is required to participate in frameworks that may effectively demand broader access than its own scope controls would permit. The resolution is still in negotiation, described as seeking "a reasonable compromise."

- **Agentic identity changes the trust and scope calculus.** The organization is in early design phases for handling autonomous agents as requesters. While specifics are premature, the recognition is clear: non-human requesters require rethinking trust models in ways the current architecture doesn't yet address. The existing human-centric IAM patterns won't transfer directly.

### Distinctive Angle

The scope conflict between an organization's own IAM architecture and the network frameworks it is compelled to join is usually discussed abstractly. Here it is a concrete, unresolved architectural problem: a provider organization has built scope-aware gateways and anti-over-provisioning controls, and those controls are now in tension with TEFCA and CMS pledge requirements that don't define scope at the same granularity. Permission Tickets could provide a resolution mechanism — carrying explicit, narrow scoping constraints that the gateway can enforce even when the broader framework doesn't require them — but only if the spec supports data holders applying their own policies as an additional constraint layer rather than treating the ticket's requested scope as an entitlement.

### Tensions Surfaced

- **Scope-aware architecture vs. scope-agnostic frameworks.** The organization's IAM controls are designed to prevent over-provisioning, but TEFCA and CMS pledges may require honoring requests that are broader than what those controls would independently allow. Compliance and security are pulling in opposite directions, with no clean resolution yet.
- **Two-track trust adds operational complexity.** Implicit trust through verified networks is straightforward; building and maintaining a parallel trust model for non-network participants requires ongoing evaluation, onboarding, and governance — with no standardized process to rely on. Permission Tickets could reduce the burden of the second track if the issuer trust model is well-defined, but they also introduce a new artifact to validate.
- **Agentic identity outpaces current frameworks.** The existing trust and scope models assume human requesters. Autonomous agents are arriving before the frameworks, standards, or organizational policies are ready to govern them — creating a gap between what the architecture needs to support and what the specification ecosystem provides.
