# Cross-Participant Digest

This document summarizes positions and themes that appeared across multiple interviews. Use it to identify what is **common ground** (and therefore not "distinctive" to any one participant) vs. what is unique to a particular vantage point.

## Widely Shared Positions (do NOT treat as distinctive)

- **Portal login friction is the core patient-facing problem.** Nearly every participant acknowledged that per-site authentication is a major barrier, whether they're building apps, managing systems, or accessing their own records.
- **Trust establishment is a prerequisite.** Everyone agrees that data holders need to trust the ticket issuer before honoring tickets. No one advocates blind acceptance.
- **Data holders should retain the ability to down-scope.** Multiple EHR vendors and provider orgs stated that local policy must be able to constrain what a ticket requests — the ticket sets a ceiling, not a floor.
- **Start practical, iterate toward granularity.** Several participants across roles advocated starting with broad resource-level scoping and tightening over time, rather than waiting for perfect segmentation.
- **Sensitive data (behavioral health, SUD, sexual health) needs special handling.** Raised by EHR vendors, provider orgs, patients, and the consent management participant alike.
- **Permission Tickets are technically feasible on existing SMART infrastructure.** Multiple EHR vendors said the auth server lift is manageable / additive.

## Recurring Themes (common but with variation worth noting)

- **Org identity as a missing input** — raised by P01 (large EHR vendor) and touched on by the mid-size EHR vendor product leader and payer participants, but with different emphasis.
- **TEFCA/network trust frameworks as context** — many participants referenced TEFCA, but from very different angles (limitation of treatment-only purpose, underspecification, scope management tension).
- **Write-back needs** — raised by the consultant, one patient app developer (notifications), and the CDS app developer, but from different use-case angles.
- **Workforce/knowledge gap** — the payer engineer and the mid-size EHR AI team member both raised adoption being blocked by people not understanding FHIR, but from different organizational vantage points.
- **Patient demand as adoption driver** — the patient access advocate and the mid-size EHR AI team member both raised this, framed differently.
- **Category/framework-level trust vs. per-app approval** — the Veradigm product leader, the data aggregation startup founder, and the provider org integration lead all touched on this.

## Positions That Are Unique or Rare

When writing a participant's "Distinctive Angle," look for positions that appear in at most 1-2 interviews:

- Data-holder-issued tickets (not just externally issued) — primarily P01
- Object capability security / "membrane" model — only the system architect (P09 equivalent)
- AI agents managing authorization complexity for patients — only the system architect
- Consent management vendor perspective on form standardization economics and EHR segmentation limits — only the consent management participant
- CDS Hooks token exchange as a use case for Permission Tickets — only the MEDITECH participant
- UDAP Certifications and Endorsements alignment concern — only the MEDITECH participant
- Caregiver perspective on re-proving legal authority at every provider — only the caregiver representative
- App developers becoming trusted issuers — primarily the aggregation startup CTO
- "Costco membership card" / QR+PIN for Medicare population — only the payer engineer
- Credit card network analogy (Visa/Mastercard framework-level trust) — primarily the data aggregation platform builder
- "Bootstrap from one portal to unlock others" — primarily the mobile health platform developer
- Business rules engine consuming purpose-of-use from tickets — primarily the Veradigm product manager (clinician)
- Patient-directed app access should be treated differently from other use contexts — primarily the Oracle Health participant
- Consent vocabulary should be patient-meaningful, not 1:1 FHIR resource mapping — primarily the CMS API designer
