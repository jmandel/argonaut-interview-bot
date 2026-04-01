# Operator Guide: Interview Abstraction Process

This document describes how to run the stakeholder interview abstraction process on a new batch of interviews. It is written for an AI agent (Claude Code or similar) operating on the codebase.

## Prerequisites

- Access to raw interview transcripts (typically in a SQLite database at `data.db` with `messages`, `participants`, and `sessions` tables)
- The existing `briefs/methodology.md` — defines the brief structure and writing rules
- The existing `briefs/tag-taxonomy.json` — defines the controlled vocabulary for frontmatter
- Existing briefs in `briefs/` as exemplars for style and quality

## Process Overview

1. **Export and read all transcripts** to understand the full dataset
2. **Write the cross-participant digest** (`briefs/digest.md`) identifying common ground vs. distinctive positions
3. **Write one brief by hand** as a quality exemplar
4. **Launch parallel subagents** to write remaining briefs, each receiving the methodology, digest, exemplar, and their specific transcript
5. **Review and fix** any quality issues (especially fourth-wall violations)
6. **Add frontmatter tags** to each brief using the taxonomy
7. **Rebuild the static site** with `bun run build`

## Step-by-Step Instructions

### Step 1: Survey the Data

Query the database for all completed participants with sufficient content:

```sql
SELECT p.name, p.archetype, p.custom_role, p.status,
       COUNT(CASE WHEN m.role='user' THEN 1 END) as user_turns,
       SUM(CASE WHEN m.role='user' THEN LENGTH(m.content) END) as user_chars
FROM participants p
JOIN messages m ON m.participant_id = p.id
WHERE p.status = 'completed'
GROUP BY p.id
HAVING user_turns >= 3
ORDER BY user_chars DESC;
```

Export each participant's transcript to a temp file for processing. Include both interviewer and participant messages in chronological order.

### Step 2: Read All Transcripts

Read every transcript to build a mental model of:
- What positions are widely shared (will become "common ground" in the digest)
- What positions are unique or rare (will become "distinctive angles")
- What themes recur with variation worth noting

### Step 3: Write the Cross-Participant Digest

Create `briefs/digest.md` with three sections:
- **Widely Shared Positions** — things nearly every participant said; these should NOT be treated as distinctive in any individual brief
- **Recurring Themes** — positions that appeared in 2-4 interviews with meaningful variation
- **Positions That Are Unique or Rare** — appeared in at most 1-2 interviews; candidates for "Distinctive Angle" sections

The digest is a working document for calibrating the briefs. It should NOT reference participant names — use role descriptions.

### Step 4: Write One Exemplar Brief

Pick the richest/most substantive interview and write its brief manually. This establishes the quality bar and demonstrates all methodology rules. Save it with the correct filename and frontmatter.

### Step 5: Launch Parallel Subagents for Remaining Briefs

For each remaining participant, launch a subagent with:
1. `briefs/methodology.md` — the full writing methodology
2. `briefs/digest.md` — so the agent knows what's common vs. distinctive
3. The exemplar brief — as a style/quality reference
4. The specific participant's transcript file

Each subagent prompt should include:
- The participant's assigned P-number and output filename
- A brief contextual note about the participant's role and key themes (to focus the agent)
- A reminder about key methodology rules (especially: never reference the interview set, digest, or other participants)
- For dictated interviews: explicit instruction to silently clean up speech-to-text errors

### Step 6: Quality Review

After all briefs are written, review for:

**Fourth-wall violations** (search for these patterns and fix):
- References to "the interview set," "the digest," "other participants"
- "This is the only participant who..." or "no other participant..."
- "The most distinctive contribution is..." (the section heading already signals distinctiveness)
- Any meta-commentary about the distillation process

**Content quality**:
- Key positions should lead with the position, not the topic
- Quotes should be used sparingly and only when vivid/precise
- Background should be 1-3 sentences, not a bio
- Tensions should identify genuine tradeoffs, not restate positions

### Step 7: Add Frontmatter Tags

For each brief, add YAML frontmatter using the controlled vocabulary from `briefs/tag-taxonomy.json`:

```yaml
---
id: pNN
role: (from the ## heading)
org_type: (from the ## heading parenthetical)
org_size: small | mid | large | government | individual
archetype: (from taxonomy)
stance: supportive | conditional | skeptical | philosophical
use_cases: [list from taxonomy — only substantive engagement]
spec_topics: [list from taxonomy — only substantive engagement]
concerns: [list from taxonomy — only substantive engagement]
frameworks_referenced: [list from taxonomy — only substantive engagement]
key_terms: [free-form snake_case — distinctive concepts this participant introduced]
---
```

The "only substantive engagement" rule is important: tag a topic only if the brief has real positions on it, not passing mentions.

This can be done via subagents in parallel — each reads the taxonomy and their brief, then adds frontmatter.

### Step 8: Rebuild the Site

```bash
cd report
bun run build
```

This regenerates `src/data.ts` from the brief files and builds the static site to `dist/`.

## Extending the Taxonomy

If new interviews surface topics not covered by the current taxonomy:
1. Add new values to the appropriate axis in `briefs/tag-taxonomy.json`
2. Add a description for each new value
3. The `key_terms` axis is always free-form — no taxonomy update needed

## File Naming Convention

```
briefs/pNN-short-mnemonic.md
```

- `NN` is a zero-padded number assigned in a logical grouping order (by archetype, then by richness within archetype)
- The mnemonic is a short human-readable slug — not the participant's name
- Examples: `p01-ehr-vendor-fhir-design.md`, `p13-payer-engineer.md`, `p20-caregiver-representative.md`

## De-identification Rules

- Remove participant names; use role descriptors
- Generalize organizations ("large EHR vendor" not the company name)
- References to public standards/regulations (TEFCA, CMS-0057, etc.) can remain
- If a participant names a public figure in a historical context, that can remain
- Remove names of colleagues, team members, or other participants
- The assignment table mapping P-numbers to real names should NOT be included in any published output
