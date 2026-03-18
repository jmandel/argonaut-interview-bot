## 1. Community-Based Organizations (CBOs) and Social Care Coordination

### How Social Care Referrals Work Today

Today's social care referral ecosystem operates across a spectrum from fully manual to platform-mediated. At the manual end, a hospital social worker or care manager identifies a patient with a social need (food insecurity, housing instability, transportation) through an SDOH screening tool, then sends a referral to a CBO via fax, phone call, email, or web form. At the platform-mediated end, referral platforms like **Unite Us**, **findhelp** (formerly Aunt Bertha), **NowPow**, and **WellSky** (formerly Healthify) offer digital closed-loop referral systems. These platforms provide SDOH screening, a searchable resource directory, electronic referral transmission, and outcome tracking in one interface.

The core platform functionalities are: screening for social risks, a resource directory, referral management, care coordination, privacy protection, systems integration, and reporting/analytics.

### What Happens When a Hospital Refers a Patient to a CBO

When a hospital refers a patient, the CBO typically receives basic patient demographics, the nature of the identified need, and sometimes screening results. The information shared is often minimal -- name, contact info, and the type of need (e.g., "food insecurity"). Platforms collect sensitive information during the needs-identification process and share it with CBOs, raising consent questions. Some platforms have **granular consent policies** allowing patients to consent or withhold consent per need category (e.g., allowing a provider to see food insecurity data but not housing insecurity data).

In practice, the referral often arrives by fax or email with a PDF attachment, and the CBO staff member manually enters the information into their own tracking system (if they have one -- many use spreadsheets or paper).

### The "Closed-Loop Referral" Problem

A closed-loop referral tracks each referral from initiation to outcome, confirming that the patient actually received services. The "problem" is that most referrals today are **open-loop**: a hospital sends a referral and never learns whether the patient showed up, was served, or what the outcome was. The closed-loop ideal requires the CBO to report back -- but CBOs often lack the technology, staffing, or motivation to do so.

Key barriers documented by the HIMSS Electronic Health Record Association include:
- EHR systems are only beginning to adopt USCDI v3 (required January 2026), and USCDI v4 introduces the social care communication standards
- Technical integration between EHR systems and CBO platforms remains immature
- Non-technical barriers (trust, governance, workflow misalignment) are equally significant

### Why CBO Staff Lack Credentials

CBO staff are fundamentally different from clinical workers in the credentialing ecosystem:
- They typically have **no NPI** (National Provider Identifier) because they are not healthcare providers
- They are not employed by HIPAA covered entities
- The workforce is heavily **volunteer-dependent**, with limited technological literacy and sometimes unreliable internet access
- **Turnover is extreme**: approximately 95% of community-based providers reported moderate to severe staffing shortages in 2023; 77% reported turning away new referrals; 72% experienced difficulty adhering to quality standards
- Staff who leave take institutional knowledge and platform logins with them, creating continuity gaps

This means CBOs cannot be provisioned into clinical identity systems the way a physician or nurse can. There is no credentialing infrastructure that naturally covers them.

### The Gravity Project and SDOH FHIR Work

The **Gravity Project** is an HL7 FHIR Accelerator established in 2019 with 2,500+ participants. It develops consensus-driven data standards for collecting, using, and exchanging SDOH data. It has three workstreams: **Terminology** (standardized codes for social needs), **Technical** (FHIR-based data exchange), and **Pilots** (real-world testing).

The technical output is the **SDOH Clinical Care HL7 Implementation Guide**, which defines how to represent screening, diagnosis, goal-setting, and intervention activities using FHIR resources. It maps to four clinical activities: screening (using Observation/QuestionnaireResponse), diagnosis (using Condition), goal setting (using Goal), and interventions (using ServiceRequest/Task/Procedure).

The practical limitation: these standards exist but adoption is slow. EHR vendors are still implementing USCDI v3, and the SDOH-specific data classes in USCDI v4 will take years to propagate through production systems.

### CBO Workarounds for Information Exchange

Real-world workarounds documented in the literature and practice:
- **Fax and phone**: Still the dominant method. CBOs fax outcome reports back to referring hospitals, or phone in updates to care managers
- **PDF and email**: When electronic systems fail to integrate, organizations fall back to exchanging PDFs
- **Shared logins**: When a CBO needs to check patient information in a hospital system, staff sometimes use a shared credential belonging to the hospital social worker or care manager who made the referral. This is a HIPAA violation but is widespread
- **Manual data entry**: CBO staff re-enter information from referral documents into their own tracking systems (often spreadsheets)
- **Partnership-specific patient identifiers**: Some organizations create ad hoc linking identifiers embedded in the health system's EHR to track patients across organizations
- **Paper-based records**: Some CBOs maintain entirely paper-based systems, which creates risks of records being lost and prevents timely access

### Write-Back Access and Why It Is Controversial

Write-back access means allowing CBOs to document service delivery outcomes directly into the patient's EHR or into a shared platform that feeds back to the EHR. This is important because without it, the referring clinician has no structured way to learn what happened after the referral.

It is controversial for several reasons:
- **Data quality concerns**: Non-clinical staff documenting in clinical systems raises questions about accuracy and liability
- **HIPAA ambiguity**: CBOs are typically not covered entities, creating regulatory uncertainty about how data flows back. Most healthcare providers remain uncertain and cautious about sharing PHI with social service agencies, even though the HIPAA Privacy Rule actually permits sharing for care coordination without written authorization -- a provision that is "largely unknown" and underutilized
- **Consent and trust**: Platforms collect sensitive information about social needs, and write-back means that information becomes part of a medical record, potentially visible to other providers. Patients may not understand or consent to this
- **Technical barriers**: Case managers often document SDOH factors in their own templates that are unavailable within the PCP's EHR workflow. Structured SDOH fields in EHRs are rare; data documented by CBOs often ends up in free-text notes rather than computable fields

---

## 2. Caregivers and Authorized Representatives

### How Caregivers Currently Access Health Records

Caregivers use several pathways, in roughly descending order of frequency:
1. **Sharing the patient's portal login** -- the most common but technically unauthorized approach. Many families simply share a MyChart password because the alternative is too burdensome
2. **Formal proxy portal access** -- the intended mechanism, described below
3. **Paper copies** -- requesting printed records at the provider's office
4. **Showing up in person** -- accompanying the patient to appointments, which gives informal access to verbal information
5. **Phone calls** -- calling the provider's office and attempting to get information, often blocked by front-desk HIPAA caution
6. **HIPAA authorization forms** -- signed documents allowing specific disclosures, but these often cause delays when patients cannot easily visit the provider's office to sign

### The Proxy Access Setup Process (Epic MyChart as the Dominant Example)

The typical process at a hospital using Epic MyChart:

1. **The caregiver must have their own MyChart account** first
2. **The patient initiates the invitation** from within their own MyChart account (if capable), or the caregiver submits a proxy access request form
3. **Identity verification**: Some systems use Lexis-Nexis identity verification; others require the caregiver to present a **government-issued photo ID** in person
4. **In-person submission is commonly required**: Forms often must be submitted at the hospital or clinic, sometimes with a copy of photo ID
5. **For incapacitated adults**: The process is more burdensome -- at Johns Hopkins, for example, the form must be submitted in person with legal documentation (court order or other legal document) and verification from **two medical physicians** confirming incapacity
6. **Access levels**: Only 19% of hospitals (13 of 69 in one study) offered controls enabling patients to restrict what types of information proxies could see. Most portals are all-or-nothing
7. **Common failure mode**: Many patient portals do not actually support true proxy access with separate login credentials and specific access levels. Families are left sharing the patient's password

### How Proxy/Caregiver Law Varies Across US States

The legal landscape is fragmented across several distinct instruments:

**Healthcare Proxy / Healthcare Power of Attorney**: A voluntary document where a competent person appoints someone to make healthcare decisions if they lose capacity. The exact definition of "incapacity" that triggers the proxy's authority **varies by state**. In some states, the proxy does not automatically have access to medical records unless the document specifically grants it.

**Durable Power of Attorney**: Grants authority over financial decisions; a separate instrument from healthcare POA, though some states allow combined documents.

**Guardianship/Conservatorship**: Court-appointed authority over an incapacitated person. This is involuntary -- it **removes** the ward's decision-making authority. It is the most powerful but most burdensome instrument, requiring court proceedings, legal fees, and ongoing reporting.

**Default Surrogate Consent Statutes**: As of December 2022, **46 states** have enacted these statutes. **Massachusetts, Minnesota, Missouri, and Rhode Island still do not have them.** These statutes establish a priority hierarchy (typically: spouse/domestic partner, then adult child, then parent, then sibling, then other relatives) for who can make healthcare decisions when someone lacks capacity and has no advance directive. The scope of surrogate authority varies dramatically: some states grant broad authority; others limit surrogates to specific decisions (e.g., Vermont limits default surrogates to DNR/COLST orders only). For mental health treatment, 8 states grant broad surrogate authority, 25 states prohibit surrogates from consenting to specific therapies, and 13 states are silent.

**California** only enacted its default surrogate law in 2022, closing a loophole where hospitals had no legal framework for consulting next of kin.

### HIPAA "Personal Representative" vs. Other Forms of Authorization

Under the HIPAA Privacy Rule, a **personal representative** is someone authorized under state or other applicable law to act on behalf of an individual in making healthcare decisions. Key distinctions:

- A personal representative must be treated **as the individual themselves** for all HIPAA purposes -- they get full access rights to PHI, not just limited disclosures
- The scope derives from their authority under applicable law (e.g., a parent for a minor child, a guardian for an incapacitated adult, someone with activated healthcare POA)
- This is different from a **HIPAA authorization**, which is a signed document from the patient permitting disclosure of specific information to specific people. An authorization is narrower, time-limited, and revocable
- It is also different from the **"involved in care" provision** (45 CFR 164.510(b)), which allows providers to share information with family members involved in the patient's care even without formal authorization, using professional judgment -- but this is discretionary, not a right
- Failure to disclose to a recognized personal representative is itself a **HIPAA violation**, unless the provider reasonably believes the individual is subject to domestic violence, abuse, or neglect by that person

### Real Friction Points for Caregivers

Research identifies four major barrier themes:

1. **Identifying caregivers in the first place**: Health systems often have no structured way to record who a patient's caregiver is. There is no standard field in most EHRs for "primary family caregiver"
2. **Communication and information-sharing**: Caregivers report difficulty receiving timely responses from physicians, difficulty reaching specialists (especially in non-urban areas), and being excluded from care conversations due to HIPAA caution
3. **Care transitions**: Moving between care settings (hospital to rehab, rehab to home) forces caregivers to coordinate a new array of services and providers, serve as a communication conduit between settings, and learn new systems
4. **Authorization overhead per provider**: A caregiver may need to set up proxy access or submit HIPAA authorization forms separately at each hospital system, each specialist practice, each pharmacy -- there is no portability of caregiver authorization across organizations
5. **Provider over-caution about HIPAA**: Many providers refuse to share information with family members even when HIPAA permits it, out of misunderstanding or fear of liability

### The "Informal Caregiver" Problem

Informal caregivers -- unpaid family members, friends, or neighbors providing care -- constitute the vast majority of caregivers. They face compounding access barriers:

- They often have **no legal documentation** (no POA, no healthcare proxy, no guardianship order). The patient may have been competent when care started but gradually lost capacity without anyone establishing formal legal authority
- Without legal documentation, they cannot be recognized as HIPAA personal representatives
- The American Bar Association notes that "if people have the appropriate legal documents in place ahead of time, they can avoid guardianship in most cases" -- but many families do not plan ahead
- Obtaining guardianship after the fact is expensive (legal fees, court proceedings) and time-consuming
- Even a signed HIPAA authorization requires the patient to be competent at the time of signing, creating a Catch-22 for caregivers of people with progressive dementia
- Providers may share information using the "involved in care" provision and professional judgment, but this is discretionary and inconsistently applied
- Some CBOs had "limited technological capabilities due to reliance on volunteers with limited technological literacy and unreliable Wi-Fi" -- a parallel to informal caregivers who may themselves be elderly, not technologically fluent, and unable to navigate portal systems

### Scale: How Many Americans Are Caregivers

The **AARP/NAC Caregiving in the US 2025** report (released July 2025) provides the most current data:

- **63 million** Americans are family caregivers -- a **45% increase** (nearly 20 million more) over the past decade
- Roughly **1 in 4** American adults are caregivers
- **59 million** care for adults; **4 million** care for children under 18 with an illness or disability
- **3 in 5** caregivers are women; average age is 51
- **29%** are in the "sandwich generation" (caring for children and adults simultaneously); among caregivers under 50, that number is **47%**
- **44%** report providing high-intensity care
- **30%** have been caregiving for 5+ years
- **20%** report fair or poor health directly attributable to caregiving responsibilities (first time this was measured)

---

Sources:
- [Spotlight on SDOH Data: Closed-Loop Referrals](https://blog.activatecare.com/sdoh-data-closed-loop-referrals)
- [Unite Us Closed-Loop Referrals](https://uniteus.com/products/closed-loop-referral-system/)
- [AMA Council Report on Closed-Loop Referrals](https://councilreports.ama-assn.org/councilreports/downloadreport?uri=/councilreports/csaph_2_A_25_closed_loop_referral.pdf)
- [EHRA Closed-Loop Referrals Barriers Report](https://www.ehra.org/sites/ehra.org/files/Closed-Loop%20Referrals%20for%20Health-Related%20Social%20Needs%20Barriers%20and%20Recommendations%20September%202024.pdf)
- [PMC: If You Build It, They May Not Come](https://pmc.ncbi.nlm.nih.gov/articles/PMC10796276/)
- [SIREN: Community Resource Referral Platforms Guide](https://sirenetwork.ucsf.edu/sites/default/files/wysiwyg/Community-Resource-Referral-Platforms-Guide.pdf)
- [Can AI Fix the Fractured I&R Ecosystem?](https://about.1degree.org/can-ai-fix-ir-ecosystem/)
- [Gravity Project Overview](https://thegravityproject.net/overview/)
- [HL7 SDOH Clinical Care FHIR IG](https://hl7.org/fhir/us/sdoh-clinicalcare/)
- [ONC: Structure and Exchange of SDOH Information](https://www.healthit.gov/isp/structure-and-exchange-social-determinants-health-information)
- [AJMC: Approaches for Overcoming Barriers to Cross-Sector Data Sharing](https://www.ajmc.com/view/approaches-for-overcoming-barriers-to-cross-sector-data-sharing)
- [Cross-Sector Data Sharing: HIPAA Considerations](https://connectingforbetterhealth.com/resources/cross-sector-data-sharing-hipaa-considerations-for-data-exchange-between-health-care-entities-and-community-based-organizations/)
- [Network for Public Health Law: Unknown HIPAA Provision](https://www.networkforphl.org/news-insights/the-largely-unknown-hipaa-privacy-rule-provision-that-speeds-access-to-social-services/)
- [Nonprofit HIPAA Compliance Rules](https://www.wagenmakerlaw.com/blog/some-not-all-nonprofits-are-subject-to-hipaa-requirements)
- [Social Current: 2025 Workforce Challenges](https://www.social-current.org/2025/02/navigating-workforce-challenges-2025-trends-and-solutions-for-the-social-sector/)
- [Medisolv: Connecting with CBOs](https://blog.medisolv.com/articles/connecting-with-cbos-learning-from-failure-and-success)
- [HealthIT.gov Playbook: Allow Portal Access for Caregivers](https://playbook.healthit.gov/playbook/pe/chapter-4/)
- [TechTarget: Understanding Proxy Access](https://www.techtarget.com/patientengagement/feature/Understanding-Proxy-Access-for-the-Patient-Portal-Privacy-Questions)
- [Hopkins Medicine: MyChart Proxy Access](https://www.hopkinsmedicine.org/patient-care/mychart/proxy-access)
- [PMC: Security and Privacy Risks of Adult Portal Accounts](https://pmc.ncbi.nlm.nih.gov/articles/PMC7199170/)
- [HHS: Personal Representatives](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/personal-representatives/index.html)
- [NCBI Bookshelf: HIPAA and Caregivers' Access to Information](https://www.ncbi.nlm.nih.gov/books/NBK396411/)
- [AARP: Caregiving in the US 2025](https://www.aarp.org/caregiving/basics/caregiving-in-us-survey-2025/)
- [AARP Press Release: 63 Million Family Caregivers](https://press.aarp.org/2025-07-24-New-Report-Reveals-Crisis-Point-for-Americas-63-million-Family-Caregivers)
- [ABA: Default Surrogate Consent Statutes](https://www.americanbar.org/groups/law_aging/publications/bifocal/vol_36/issue_1_october2014/default_surrogate_consent_statutes/)
- [ABA: Recent Updates to Default Surrogate Statutes](https://www.americanbar.org/groups/law_aging/publications/bifocal/vol44/bifocal-vol-44-issue3/recent-updates-to-default-surrogate-statutes/)
- [PMC: Challenges to Involving Family Caregivers in Primary Care](https://pmc.ncbi.nlm.nih.gov/articles/PMC8160020/)
- [NCBI Bookshelf: Family Caregivers' Interactions with Health Care](https://www.ncbi.nlm.nih.gov/books/NBK396396/)
- [Cornerstone Healthcare Training: HIPAA for Caregivers 2026](https://www.cornerstonehealthcaretraining.com/article/hipaa-for-caregivers)
- [PMC: Documentation of Caregivers as a Standard of Care](https://pmc.ncbi.nlm.nih.gov/articles/PMC8260920/)
- [Health Affairs: Implementing Community Resource Referral Technology](https://www.healthaffairs.org/doi/10.1377/hlthaff.2019.01588)