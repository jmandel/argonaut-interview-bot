---
id: p16
role: Patient & Portal User
org_type: patient
org_size: individual
archetype: patient
stance: conditional
use_cases:
  - patient_access
  - care_coordination
spec_topics:
  - trust_establishment
  - scoping
  - consent_representation
  - issuer_model
concerns:
  - adoption_barriers
  - partial_record_acceptance
  - data_segmentation_limits
frameworks_referenced: []
key_terms:
  - abandonment_threshold
  - incentive_aligned_trust
  - access_without_integration
  - 200_page_paper_dump
  - broad_default_narrow_carveout
---

## P16: Patient & Portal User (Multi-System Experience, Western Massachusetts)

### Background

A patient who has navigated both ends of the interoperability spectrum: currently managing health records across two Epic-based health systems where data flows relatively well, and previously dealing with three separate EHRs in Western Massachusetts — specialist, primary care, and lab each on different systems — where portal fragmentation was severe enough to drive complete abandonment of digital access.

### Key Positions

- **Portal fragmentation drives complete disengagement, not just inconvenience.** With three different EHRs in Western Massachusetts, the response was not to struggle through multiple logins but to stop using portals entirely. The threshold between "somewhat annoying" (two Epic systems today) and "not worth the effort" (three unrelated EHRs) is sharp. Permission Tickets need to reduce friction below the abandonment threshold, not merely improve it incrementally.

- **The real failure of paper-based portability is lack of clinical structure, not just lack of digitization.** When moving from Western Massachusetts, the only transfer option was requesting a paper copy from the specialist — roughly 200 pages of documentation with no summary page and no meaningful handoff for a new provider. The problem was not that records were on paper; it was that the output lacked any organization that would help a receiving provider make use of it. An electronic equivalent that dumped the same unstructured mass would fail for the same reason.

- **Trust should be evaluated by incentive alignment, not by organizational type or technical capability.** Trusts payers and primary care providers most because "their incentives are to take care of me." Organizations whose incentives involve selling or monetizing data provoke distrust regardless of their verification capabilities. This is a principle about business model — it implies that a consumer tech company with strong identity verification would still be less trusted than a health plan with weaker verification, because incentive structure matters more than technical rigor.

- **Data usability at the receiving end is the binding constraint, not data access.** Even with the current two-Epic setup where data does flow, expresses concern that exchanged information is "not always well integrated into the receiver." Permission Tickets may open a new access pathway, but if receiving providers cannot integrate the data in a clinically useful way, the result is "more information but not used." Access without integration produces noise, not value.

- **Audit transparency is desired but effectively absent today.** Wants to see who was granted access, what they actually accessed, and whether access stayed within the authorized scope. Has never checked whether the current portal even offers this capability and suspects it does not. The gap is not that the feature was evaluated and found lacking — practical transparency about record access does not exist as a patient-facing concept in current systems.

- **Scope control is situational, not categorical.** Would share everything in most clinical scenarios because "I'm not sure what is not relevant to them." The exception is behavioral health, where more granular control would matter. For most patients in routine care transitions, broad access with narrow carve-outs is more practical than asking patients to assemble a custom scope for each authorization.

### Distinctive Angle

The value of Permission Tickets is gated not by whether data can flow, but by whether it arrives in a form that is actionable for the recipient. The 200-page paper dump and the concern about poorly integrated electronic exchange are the same problem at different technological layers: raw data transfer without clinical structure is not meaningful portability. A ticket that successfully moves data from point A to point B has accomplished nothing if the data lands as an undifferentiated mass that no one reviews. This frames the spec design challenge as needing to address — or at least not ignore — the data usability layer downstream of authorization.

The incentive-based trust model offers a concrete filter for evaluating which entities are viable identity verifiers or ticket issuers in a patient-facing deployment. Rather than evaluating verifiers by brand recognition, regulatory status, or technical measures, the test is singular: is this organization's business fundamentally about my care, or about my data?

### Tensions Surfaced

- **Openness vs. sensitivity carve-outs.** Wants to share broadly for better care but recognizes that behavioral health is different. The default should be permissive, but the system needs a lightweight mechanism for patients to exclude specific categories — without requiring them to make granular decisions they are not equipped to make for most clinical content.
- **Trust in verification vs. trust in incentives.** Would want to know who is performing identity verification before trusting the system, but the evaluation criterion is not verification rigor — it is whether the verifier's business model is aligned with the patient's care. A verification service run by a provider or payer would be trusted; one run by a data-monetization company would not, even if technically equivalent. This complicates any design that assumes a neutral, market-driven identity verification layer.
- **Access expansion vs. integration readiness.** Permission Tickets would solve a real access problem, but the receiving side of healthcare may not be ready to make good use of what arrives. Expanding access without addressing integration risks devaluing the mechanism — providers who receive data they cannot use may stop requesting it.
