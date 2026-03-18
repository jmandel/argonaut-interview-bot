# Background Briefing: EHR Vendor & Health System Authorization Infrastructure and External Data Access

## The EHR Vendor Landscape

**Market share (as of early 2025, per KLAS Research):**
- **Epic Systems**: 41.3% of hospital installations; 54.9% by hospital beds. Added a net 176 acute care hospitals in 2024 alone -- its largest-ever annual gain. Dominates large academic medical centers and integrated delivery networks.
- **Oracle Health (formerly Cerner)**: 22.9% of hospitals; 22.1% by beds. Lost a net 74 hospitals in 2024. Customers express "cautious optimism" about Oracle's cloud migration plans but uncertainty remains.
- **MEDITECH**: 11.9% of hospitals; 12.7% by beds. Strong in community hospitals and smaller systems. Lost a net 57 hospitals in 2024.
- Other players (athenahealth, Veradigm/Allscripts) are more prominent in ambulatory/outpatient settings.

The concentration matters: Epic and Oracle together cover over 60% of inpatient beds. Any authorization infrastructure conversation is, in practice, largely about how these two vendors expose APIs.

## What Authorization Infrastructure Actually Looks Like Today

**The OAuth2 / SMART on FHIR Layer:**
ONC's 21st Century Cures Act Final Rule requires all certified EHR technology to support FHIR R4 APIs and the SMART App Launch framework. In practice, this means:

- Each EHR vendor operates an OAuth 2.0 authorization server, but implementations vary significantly. OAuth 2.0 is intentionally a flexible *framework*, not a strict protocol -- one organization uses client secrets, another requires JWT assertions, a third has proprietary additions. This creates real integration chaos when you need dozens of healthcare organizations to exchange data reliably.
- **Epic** requires SMART App Launch workflows with strict audit matching (the token request must include a FHIR base URL that exactly matches). Epic's former "App Orchard" has been replaced by **Showroom** (launched 2024) with three tiers: Connection Hub ($500/year for basic listings), Toolbox, and Workshop for deep co-development. Production access requires formal approval, customer sponsorship, and ongoing compliance monitoring -- even though Epic markets "open APIs."
- **Oracle Health** uses a Well-Known SMART Configuration for endpoint discovery. Its Millennium FHIR Authorization Framework has its own specific patterns.
- Each Epic customer (each hospital) must individually approve and configure third-party access, regardless of the app developer's technical capabilities. This is a per-site process.

**Per-site approval is the bottleneck.** A simple FHIR read-only integration can take 2-4 months. A comprehensive bidirectional integration (FHIR + HL7 v2) typically takes 6-14 months including marketplace listing, development, testing, and per-site go-live.

**Scope and consent problems:**
- SMART on FHIR v2 introduced granular scopes (e.g., restricting to specific resource types or search parameters), but in practice many apps still request overly broad access like `patient/*.read`, exposing far more data than necessary.
- Health systems rarely have a unified Enterprise Master Patient Index (EMPI) spanning hospitals, clinics, and payer systems. This means identity mismatches are a persistent authorization risk.
- Fragmented consent management: There is no standard way to express or enforce patient-level consent preferences across systems. Each organization has its own consent workflows, often paper-based.

## The "Release of Information" (ROI) Operation They Already Run

Before APIs, hospitals handled external data requests through Release of Information departments -- and most still do, in parallel with API-based access. This is a massive, labor-intensive operation:

- **Datavant** (which merged with Ciox Health in 2021) supports 75% of the top U.S. hospitals with ROI services. About 4,000 hospitals/clinics use their digital ROI platform, processing approximately 5 million patient requests per year digitally.
- **MRO** is the other major ROI vendor, focused on complex audits and regulatory-driven releases.
- Providers in value-based care contracts face a painful choice: either give health plans on-demand API access to their data, or staff up their ROI departments to handle the additional request volume. This is a real operational cost tradeoff.

## Information Blocking: The Regulatory Pressure

**What it is:** The 21st Century Cures Act (Section 4004) prohibits "information blocking" -- practices by healthcare providers, health IT developers, or health information exchanges that are likely to interfere with, prevent, or materially discourage access, exchange, or use of electronic health information (EHI).

**Who it applies to:** Three categories of "actors" -- (1) healthcare providers, (2) health IT developers of certified health IT, and (3) health information exchanges and networks.

**Penalties (real and escalating):**
- For health IT developers and health information networks: civil monetary penalties up to **$1 million per violation**, with potential stacking.
- For healthcare providers: disincentives including reduced Medicare reimbursements, negative MIPS (Merit-based Incentive Payment System) adjustments, and exclusion from Medicare Shared Savings Programs. Provider disincentives became effective July 31, 2024 (hospitals/clinicians) and January 1, 2025 (shared savings programs).
- **This is no longer theoretical.** In September 2025, HHS Secretary Robert F. Kennedy Jr. directed HHS resources toward active enforcement. On February 11, 2026, ASTP/ONC began issuing **letters of nonconformity** to certain EHR developers based on potential information blocking and API-related noncompliance.
- Nearly **1,600 complaints** have been submitted to the Information Blocking Complaint Portal as of February 2026.

**The eight exceptions** (45 CFR Part 171) -- these are the defenses organizations can invoke:
1. **Preventing Harm** -- reasonable and necessary to prevent harm to a patient or another person
2. **Privacy** -- protecting individual privacy under state or federal privacy laws
3. **Security** -- protecting the security of EHI
4. **Infeasibility** -- technically infeasible to fulfill a request
5. **Health IT Performance** -- maintaining reasonable system performance
6. **Content and Manner** -- fulfilling requests in alternative ways when the preferred manner isn't available
7. **Fees** -- charging reasonable fees (including a reasonable profit margin)
8. **Licensing** -- licensing interoperability elements on reasonable and non-discriminatory terms

Health systems live in fear of the gray zones. A privacy officer who slows down a data release out of genuine HIPAA concern could be accused of information blocking. A vendor that rate-limits API calls to protect system stability could face a complaint. The exceptions provide some cover, but the conditions attached to each are detailed and fact-specific.

## The Competitive and Business Reality Behind "Information Blocking"

Research (PMC, KLAS) reveals the uncomfortable truth:

- **55% of Health Information Exchanges** reported that EHR vendors at least sometimes engage in information blocking. 30% reported the same for health systems.
- The most common vendor behavior: **setting unreasonably high prices** for data access/connectivity (reported by 42% of HIEs as routine).
- The most common health system behavior: **outright refusing to share information** (reported by 14% of HIEs as routine).
- **Market competition correlates with more information blocking** -- vendors in more competitive markets engage in more blocking behavior, suggesting it is used to maintain or gain market share.
- Health systems use data as a **competitive moat**: by selectively sharing patient information (and sometimes citing HIPAA as the excuse), they create barriers that make it harder for patients to seek care elsewhere.
- EHR vendors create **lock-in** through walled-garden data exchange -- exchanging data freely within their own ecosystem but charging high prices for cross-vendor connectivity.

## How They Handle Specific Requester Types Today

**Payers:** Health plans need clinical data for risk adjustment, quality measures, and prior authorization. Providers can either grant on-demand API access or handle requests through their ROI department. TEFCA now supports payment as an exchange purpose, which is changing the dynamics.

**Public health agencies:** Through TEFCA, public health authorities can access electronic case reporting (eCR), immunization records, syndromic surveillance data, and lab reports. Public health is a mandatory response category under TEFCA -- organizations must respond to treatment and individual access requests.

**Caregivers/Personal representatives:** Under HIPAA, a patient's personal representative (as defined by state law) has the right to access patient health information. But in practice, managing proxy access through patient portals is fraught -- clinicians and administrators struggle with which state law applies, what level of portal access to grant, and how to handle competing interests (e.g., an estranged family member vs. the patient's wishes). In rural settings this is especially sensitive when caregivers and patients are neighbors.

**Community-Based Organizations (CBOs):** These are typically not covered entities or business associates under HIPAA, which creates a structural gap. There is no standard mechanism for a CBO (e.g., a food bank, housing authority, or social services agency) to request or receive clinical data, even when they are actively coordinating the patient's care. TEFCA's "government benefits determination" exchange purpose is beginning to create a pathway, but it is early.

## TEFCA: The Emerging National Framework

**Current state:** As of late 2025, TEFCA has 14,214 participating organizations (QHINs, Participants, Subparticipants) representing over 79,000 unique connections. More than 607 million documents have been shared since go-live in December 2023. There are 11 designated QHINs, including Oracle Health (designated November 2025).

**How it works:** QHINs route queries between participating HIEs and their members. Exchange is permitted for six defined purposes: treatment, individual access services, payment, healthcare operations, public health, and government benefits determination. The governance framework is codified in 45 CFR Part 172 (effective January 15, 2025).

**The tension:** TEFCA creates a "must respond" obligation for treatment and individual access -- organizations cannot simply ignore incoming queries. The HTI-5 proposed rule (December 29, 2025) proposes narrowing some exceptions and eliminating the TEFCA manner exception, which would further tighten the screws.

## HIPAA Breach Liability in Practice

**What it actually means for hospitals:**

- 2024 was one of OCR's busiest enforcement years: 22 investigations resulted in civil monetary penalties or settlements.
- Real penalty examples: Children's Hospital Colorado paid $548,265 (December 2024); Gulf Coast Pain Consultants paid $1.19 million (December 2024); PIH Health paid $600,000 after a phishing attack exposed 189,763 individuals' records.
- The most commonly cited violation: **failure to conduct an adequate risk analysis** (appeared in 13 of OCR's recent enforcement matters). OCR's "Risk Analysis Initiative" (launched late 2024) is specifically targeting this.
- Breach notification window was reduced from 60 to 30 days.
- Ransomware settlements have ranged from $40k (14k records, psychiatric practice) to $950k (regional hospital system).

**The third-party app liability question:**
When a patient requests that their data be shared with a third-party app, and that app is not a business associate of the provider, the provider is **not liable** for subsequent use or disclosure by the app. Once data leaves the EHR to a non-BA app, it falls outside HIPAA. But: (a) the provider must have properly authenticated the request, (b) providers remain terrified of being the proximate cause of a breach even when legally shielded, and (c) a 2024 security assessment found that 48 FHIR apps with aggregated EHR data from 25,000+ providers contained pervasive server-side authentication vulnerabilities affecting 4 million patient/clinician records.

**The psychological dynamic:** Even when the legal liability is clear, hospital CISOs and privacy officers are risk-averse because the reputational damage of a breach is devastating regardless of legal fault. This creates a reflexive tendency to restrict access even when the law does not require it -- which then risks information blocking complaints.

## Key Tensions an Interviewer Should Understand

1. **Regulatory whipsaw:** Organizations face simultaneous pressure to share MORE data (information blocking rules, TEFCA mandates) and protect data MORE rigorously (HIPAA enforcement, state privacy laws, cybersecurity requirements). These obligations come from different parts of HHS and sometimes feel contradictory.

2. **Per-site friction vs. scalable access:** Even with standardized APIs, every hospital must individually approve and configure each third-party application. There is no "approve once, access everywhere" mechanism in the current infrastructure.

3. **Legitimate security concerns wrapped around business motivations:** When a health system cites "security" or "privacy" as the reason for restricting data access, it may be a genuine concern, a competitive tactic, or (most commonly) both simultaneously. The people involved often cannot cleanly separate these motivations themselves.

4. **The consent gap:** There is no standard, machine-readable way to express patient consent preferences that flows across systems. Each organization invents its own consent management, and interoperability of consent is essentially nonexistent.

5. **Volume and staffing:** The sheer volume of external data requests is overwhelming ROI departments, and the API-based alternative requires significant technical infrastructure and ongoing maintenance that smaller systems struggle to support.

Sources:
- [SMART on FHIR App Development Guide 2026](https://www.mindinventory.com/blog/smart-on-fhir-app-development/)
- [FHIR Healthcare Interoperability Guide 2025](https://www.sprypt.com/blog/fhir-guide)
- [Why Healthcare Needs SMART on FHIR - Medium](https://medium.com/@rajsankuratri_47468/why-healthcare-needs-smart-on-fhir-taming-oauth-2-0-for-interoperability-1c54361c263a)
- [Oracle FHIR Authorization Framework](https://docs.oracle.com/en/industries/health/millennium-platform-apis/fhir-authorization-framework/)
- [Holland & Knight - Information Blocking Enforcement Is Here](https://www.hklaw.com/en/insights/publications/2026/02/the-wait-is-over-information-blocking-enforcement-is-officially-here)
- [McDermott - HHS Information Blocking Enforcement Crackdown](https://www.mcdermottlaw.com/insights/hhs-announces-information-blocking-enforcement-crackdown/)
- [HealthIT.gov - Information Blocking](https://healthit.gov/information-blocking/)
- [Healthcare Law Insights - HHS Crackdown on Information Blocking](https://www.healthcarelawinsights.com/2026/03/hhs-crackdown-on-information-blocking-new-era-of-enforcement-fines-and-compliance-risks-for-healthcare-entities/)
- [Alston & Bird - Information Blocking Enforcement 2026](https://www.alston.com/en/insights/publications/2026/02/information-blocking-enforcement-2026)
- [HHS OIG - Information Blocking](https://oig.hhs.gov/reports/featured/information-blocking/)
- [Epic EHR Integration Reality Guide - Invene](https://www.invene.com/blog/epic-ehr-api-integration)
- [Epic EHR Integration Guide 2026 - TactionSoft](https://www.tactionsoft.com/blog/epic-ehr-integration-guide/)
- [Epic App Market Overview - TheAppSolutions](https://theappsolutions.com/blog/development/epic-app-orchard/)
- [Towards AI - Epic, Oracle, Cerner Blocking Healthcare AI](https://pub.towardsai.net/the-builders-notes-epic-oracle-and-cerner-are-blocking-healthcare-ai-here-s-the-proof-4cc17095f1dc)
- [PMC - Information Blocking Prevalent at Start of Cures Act](https://pmc.ncbi.nlm.nih.gov/articles/PMC7973451/)
- [PMC - Information Blocking Policy Strategies](https://pmc.ncbi.nlm.nih.gov/articles/PMC5339397/)
- [PMC - Information Blocking National Survey of Hospitals](https://pmc.ncbi.nlm.nih.gov/articles/PMC10198516/)
- [Definitive Healthcare - Most Common Hospital EHR Systems](https://www.definitivehc.com/blog/most-common-inpatient-ehr-systems)
- [CNBC - Epic Expands EHR Market Share Lead](https://www.cnbc.com/2025/04/30/epic-systems-expands-ehr-market-share-lead-over-oracle-health.html)
- [Fierce Healthcare - Epic Gaining More Ground](https://www.fiercehealthcare.com/health-tech/epic-gaining-more-ground-hospital-ehr-market-share-widens-its-lead-over-oracle-health)
- [TEFCA - ASTP](https://healthit.gov/policy/tefca/)
- [Sequoia Project - Designated QHINs](https://rce.sequoiaproject.org/designated-qhins/)
- [Oracle Health QHIN Designation](https://www.oracle.com/news/announcement/oracle-health-secures-tefca-qhin-designation-2025-11-20/)
- [Fierce Healthcare - HIPAA Liability with Third-Party Apps](https://www.fiercehealthcare.com/tech/hhs-guidance-clarifies-hipaa-liability-use-third-party-health-apps)
- [Vorlon - Third-Party API Risks in Healthcare 2025](https://vorlon.io/resources/why-third-party-api-risks-are-the-1-healthcare-security-concern-for-2025)
- [Censinet - FHIR APIs Building Secure Healthcare Systems](https://censinet.com/perspectives/fhir-apis-building-secure-healthcare-systems)
- [HIPAA Journal - HIPAA Violation Fines 2026](https://www.hipaajournal.com/hipaa-violation-fines/)
- [Ogletree - 2025 Enforcement Trends Risk Analysis](https://ogletree.com/insights-resources/blog-posts/2025-enforcement-trends-risk-analysis-failures-at-the-center-of-hhss-multimillion-dollar-hipaa-penalties/)
- [ChartRequest - Highest Cost HIPAA Violations](https://www.chartrequest.com/articles/highest-cost-hipaa-violations)
- [Datavant - Release of Information](https://www.datavant.com/solutions/release-of-information)
- [Datavant - Healthcare APIs and ROI](https://www.datavant.com/electronic-health-records/healthcare-apis-release-of-information)
- [HealthIT.gov - Information Blocking Exceptions PDF](https://www.healthit.gov/sites/default/files/2022-07/InformationBlockingExceptions.pdf)
- [HealthIT.gov - Individuals' Right to Access Health Information](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/access/index.html)
- [HHS.gov - HHS Crackdown on Health Data Blocking](https://www.hhs.gov/press-room/hhs-crackdown-health-data-blocking.html)
- [TEFCA Blog - Priorities and Plans 2025](https://www.healthit.gov/buzz-blog/health-information-exchange-2/tefca-priorities-and-plans-for-the-remainder-of-2025)