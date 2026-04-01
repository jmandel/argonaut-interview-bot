---
id: p11
role: "App developer building point-of-care clinical decision support"
org_type: "Health IT startup"
org_size: small
archetype: app_developer
stance: supportive
use_cases:
  - patient_access
  - cds_hooks
  - care_coordination
  - write_access
spec_topics:
  - scoping
  - consent_representation
  - token_lifetime
  - purpose_of_use
concerns:
  - adoption_barriers
  - over_provisioning
frameworks_referenced:
  - FHIR
  - Carequality
key_terms:
  - care_journey_scoping
  - read_plus_trigger
  - summary_of_summaries
  - patient_controlled_duration
---

## P11: App Developer, Clinical Decision Support (Point-of-Care Startup)

### Background

Builds an app that operates inside the clinical encounter — recording and transcribing patient-provider conversations, summarizing them, and feeding into downstream EHR workflows such as prior authorization, imaging orders, and lab follow-ups with other providers. The app currently reaches external systems through provider app backends (e.g., patient portal consent flows) and network channels including QHINs, HIEs, and vendor interoperability modules like Carequality.

### Key Positions

- **Patient-facing login friction is the primary problem Permission Tickets would solve.** The app's entry point is the encounter itself, so reducing the per-portal login burden matters most at the moment the patient is in the room. Portable authorization would "fundamentally change the way patient records are aggregated and sent to different EMRs and healthcare operators" by removing the requirement for patients to authenticate through each provider's portal individually.

- **Authorization scope should be driven by the context of the care journey, not by broad resource categories.** Advocates a "less is more" principle: the ticket should carry enough context about *why* data is being requested that the data holder can return what is clinically relevant without over-sharing. Illustrated with a concrete example — a hip surgery discharge decision requires knowing whether the patient lives in an apartment without an elevator (SDOH/demographic data), but does not require the patient's full history. Each care continuity model would define its own scoping needs.

- **Authorization duration should be patient-controlled, set during consent capture.** Rather than imposing a fixed expiration on the token, the patient should choose how long the authorization remains valid. This addresses the reality that follow-up workflows — prior auth, imaging scheduling, treatment plan assembly — stretch over days or weeks after the initial encounter.

- **Write-back to systems of record is premature for v1 and should be deferred.** Currently the app operates as read-plus-trigger (pulling records and initiating downstream actions) rather than writing back into EHRs. Future write-back is a goal but requires clinical oversight standards and regulatory clarity around Software as a Medical Device (SAMD). "I'm still not convinced about the idea of writing back to a system of record, without a clinician in the loop."

- **Workflow breakdowns occur downstream, not just at login.** The friction points are not limited to portal authentication — prior authorization denials that never reach the patient, and the difficulty of assembling cross-provider treatment plans ("summary of summaries"), are where care continuity actually stalls.

### Distinctive Angle

The care-journey scoping principle reframes how Permission Tickets should carry context. Rather than defining access in terms of FHIR resource types or broad data categories, the ticket should express the clinical situation driving the request — a hip surgery discharge, a treatment plan across providers — so the data holder can respond with contextually appropriate data. This pushes spec design toward purpose-and-situation-aware scoping rather than resource-level granularity, and it implies that scoping templates may need to vary by care model rather than converging on a single hierarchy.

### Tensions Surfaced

- **Broad-enough-to-be-useful vs. specific-enough-to-be-accepted.** A portable authorization needs to cover the full arc of downstream workflows (prior auth, imaging, labs across providers), but data holders will demand specificity about what is being accessed and why — especially once write-back enters the picture. Keeping v1 to read-plus-trigger is a pragmatic way to sidestep this tension temporarily.
- **Patient-controlled duration vs. security expectations.** Letting patients set how long their authorization lasts respects autonomy and accommodates multi-week care workflows, but creates open-ended access windows that data holders may resist as a risk surface.
- **CDS layer sits between patient consent and clinical oversight.** The app operates with patient authorization but feeds into clinician-supervised workflows. Permission Tickets would need to accommodate this hybrid — the patient authorizes access, but the resulting actions (prior auth initiation, treatment plan construction) happen under clinical responsibility, not purely patient-directed use.
