# Interview Brief Methodology

## Context

We conducted AI-mediated stakeholder discovery interviews about **SMART Permission Tickets** — a proposed portable authorization mechanism for healthcare data exchange. The interviews were conducted by an AI interviewer via a chat interface, with some participants typing and others using speech-to-text dictation.

The raw transcripts are conversational, sometimes stream-of-consciousness, and vary widely in density. Some participants gave long, winding answers; others gave terse responses that required the interviewer to probe. Dictated interviews contain speech recognition errors and false starts.

## Goal

Produce a set of **distilled interview briefs** — one per participant — that a reader with ~15 minutes could scan across all briefs and come away with the core insights, positions, and tensions from the entire interview set. These briefs are for internal use by the project team to inform spec design decisions.

## Source Material

- 23 completed interviews spanning multiple stakeholder archetypes
- Participants span: EHR vendors (2), patient app developers (4), payer engineer (1), patient/self representatives (2), consultant (1)
- The raw transcripts include both interviewer and participant dialogue

## De-identification

Lightly de-identify each participant:

- **Remove names.** Replace with a role-based descriptor (e.g., "Senior Payer Engineer" not the participant's name).
- **Generalize organizations.** Use descriptions like "large EHR vendor," "Medicaid managed care plan (CA)," "patient data aggregation startup." Do not name the company. Exception: references to well-known standards bodies, frameworks, or regulations (TEFCA, Carequality, CMS-0057, etc.) can remain since they are public/industry context, not identifying.
- **Preserve role specificity.** "Product leader for interoperability at a mid-size EHR vendor" is fine — it conveys the vantage point without identifying the person.
- **Named third parties.** If a participant names another person (e.g., a reference to a historical figure in healthcare IT), that can remain if it's public knowledge. Remove names of colleagues, team members, or other interview participants.

Each brief is assigned a stable number **P1–P10** for cross-referencing. Numbers are assigned in a fixed order (see file naming below).

## What to Cut

- **All interviewer dialogue.** The interviewer's questions and restatements are scaffolding — they don't belong in the brief. Exception: if the interviewer introduced a framing that the participant explicitly adopted or pushed back against, note the position, not the interviewer's words.
- **Pleasantries, meta-commentary, agreements to summaries.** ("That covers it well," "Thanks for joining," etc.)
- **Positions that are obvious or universal.** If every stakeholder would say "portability is good" or "security matters," don't waste space on it. Focus on what *this* participant said that others might not.
- **Redundancy.** If a participant said the same thing three different ways across the conversation, distill to the single strongest formulation.
- **Interviewer-led restatements the participant merely agreed with.** If the interviewer summarized and the participant said "yes," attribute the substance only if the participant clearly held that view based on their own earlier statements. Don't create positions the participant never articulated independently.

## What to Preserve

- **Positions unique to this participant's vantage point.** The thing only someone in their role/org would say.
- **Concrete examples from their work.** Anonymize as needed, but keep the specificity. "The RFI loop involves portal-based back-and-forth exchanging unstructured PDFs until medical necessity is satisfied" is much more useful than "the process is manual and slow."
- **Specific concerns, risks, or failure modes they raised.** Especially if they identified a way Permission Tickets could go wrong.
- **Where they pushed back, surprised, or diverged from what the interviewer expected.**
- **Tensions they surfaced** — either internal to their own position ("I want granular control but nobody can manage granular decisions") or between stakeholder groups.

## Quoting

Direct quotes are allowed and encouraged — but **use them sparingly and strategically.** A quote earns its place when:

- It captures a position with a vividness or precision that paraphrase would dilute ("people are dying because we aren't doing this today")
- It reveals an attitude or framing that matters beyond the literal content ("I struggle to see a business model where such a business could play this role")
- It's a memorable formulation that would be useful in presentations or spec rationale documents

Do not quote mundane statements, partial thoughts, or things that work better as paraphrase. When quoting from dictated interviews, silently fix obvious speech-to-text errors while preserving the participant's actual meaning and voice.

## Structure of Each Brief

Each brief uses this structure. Sections should be as long or short as the source material warrants — do not pad thin material or artificially compress rich material.

### Header

```markdown
## P[N]: [Role descriptor] ([Org type])
```

Example: `## P3: Senior FHIR Engineer (Medicaid managed care plan, CA)`

### Background

One to three sentences. Who they are, what they work on, what gives them a relevant vantage point. This is context for interpreting everything that follows — not a bio.

### Key Positions

The core of the brief. A set of bullet points (typically 3–6) capturing the participant's substantive positions on Permission Tickets and related topics. Each bullet should:

- **Lead with the position**, not the topic. "Permission Tickets should be use-case specific, not a universal pattern" — not "Discussed use-case specificity."
- **Include the reasoning or evidence** the participant offered, compressed. Why do they hold this view? What experience drives it?
- **Note practical implications** where relevant. What does this position mean for spec design, adoption strategy, or implementation?

### Distinctive Angle

The "if you only read one thing" section. State the insight and why it matters for spec design, adoption, or the broader ecosystem. The section heading already signals distinctiveness — the content should just deliver it.

**Do not reference the interview process.** Never mention "the interview set," "the digest," "other participants," "no other participant," or the distillation methodology. Do not write "this is the only participant who..." or "unlike other participants..." or "the most distinctive contribution is..." The brief should read as a standalone analytical document about this stakeholder's positions, not as commentary on how those positions compare to a corpus. If an insight is distinctive, the reader will recognize that from the content itself — you do not need to argue for its distinctiveness.

Similarly, the **Background** section should not reference the interview set ("the only caregiver in the set") or the process. Just describe who they are and what makes their vantage point relevant.

### Tensions Surfaced

Tensions the participant identified or embodied — either within their own position, between their needs and likely spec design, or between their stakeholder group and others. These are the most valuable raw material for spec design because they identify where tradeoffs need to be made.

## Speech-to-Text Cleanup

Several interviews were dictated and contain recognition errors, false starts, and repetitions. When distilling these:

- **Silently correct** obvious recognition errors ("Tuca base" → "TEFCA-based," "fire based" → "FHIR-based").
- **Reconstruct meaning** from garbled passages using surrounding context. If you can confidently infer what was meant, use the inferred meaning. If a passage is genuinely ambiguous, omit it rather than guess.
- **Do not flag** that the source was dictated or that cleanup was performed. The brief should read as clean prose regardless of the input medium.

## Conversation Order

Do **not** preserve the order of the conversation. Reorganize by thematic weight and logical flow. Group related positions together even if they came up at different points in the interview. Lead with the strongest/most distinctive material.

## File Naming and Output

Each brief is written to its own file in the `briefs/` directory:

```
briefs/
  methodology.md          (this file)
  digest.md               (cross-participant themes — what's common vs. distinctive)
  p01-ehr-vendor-fhir-design.md
  p02-ehr-vendor-ai-team.md
  p03-ehr-vendor-interop-product.md
  p04-ehr-vendor-interop-standards.md
  p05-ehr-vendor-api-dev.md
  p06-ehr-vendor-fhir-product.md
  p07-app-dev-data-aggregation.md
  p08-app-dev-mobile-health-platform.md
  p09-app-dev-startup-cto.md
  p10-app-dev-patient-access-advocate.md
  p11-app-dev-cds.md
  p12-app-dev-notifications.md
  p13-payer-engineer.md
  p14-payer-cms-api-designer.md
  p15-patient-rep-system-architect.md
  p16-patient-rep-portal-user.md
  p17-provider-org-iam-architect.md
  p18-provider-org-integration-lead.md
  p19-provider-org-ehr-architect.md
  p20-caregiver-representative.md
  p21-consent-management-vendor.md
  p22-consultant-national-exchange.md
```

The filenames use a short mnemonic after the number — not the participant's name. These are for human navigation, not de-identification (the files themselves are de-identified).

## Cross-Participant Digest

Before writing a brief, read `digest.md`. It lists positions that are common across multiple participants (and therefore not "distinctive" to any one person) and positions that are rare or unique. Use this to calibrate the "Distinctive Angle" section — if a position appears in the digest as widely shared, do not feature it as distinctive. If a position appears as rare/unique and matches your participant, highlight it.

