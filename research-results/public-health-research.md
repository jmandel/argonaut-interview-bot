## Background Notes: Public Health Data Access for Disease Surveillance and Case Investigation

### 1. How Reportable Disease Case Investigation Actually Works

The workflow follows a well-defined pipeline:

**Initial report.** A healthcare provider diagnoses or a laboratory confirms a reportable condition. The provider or lab submits a report to the jurisdictional public health agency (PHA) -- historically via fax, phone, or mail; increasingly via electronic laboratory reporting (ELR) or electronic case reporting (eCR). Each state maintains its own list of reportable conditions (typically 80-120 conditions), and reporting timeframes range from "immediately" (e.g., anthrax, measles) to "within 5 business days."

**Triage and deduplication.** The report lands in the state or local health department's surveillance system -- most commonly the [NEDSS Base System (NBS)](https://www.cdc.gov/nbs/php/about/index.html), used by 25 health departments, or a NEDSS-compatible system (all 50 states use NEDSS-compatible systems for case notification to CDC). Staff must deduplicate reports (one patient may generate multiple lab reports), confirm the report meets case criteria, and assign the case to an epidemiologist or disease investigator in the appropriate local jurisdiction.

**Case investigation.** The assigned investigator contacts the patient (typically by phone), collects demographic and clinical details, identifies contacts/exposures, and determines appropriate public health interventions (isolation, treatment verification, contact notification). This is where the heaviest data-access needs arise -- investigators frequently need to go back to the reporting provider or facility for additional clinical information not included in the initial report.

**Follow-up and case closure.** The investigator monitors treatment completion, conducts contact follow-up, and eventually classifies and closes the case. For TB, this can take 6-12 months. For STIs, closure may take days to weeks. The final case classification (confirmed, probable, suspect) and a standardized case notification are sent to CDC's [National Notifiable Diseases Surveillance System (NNDSS)](https://www.cdc.gov/nndss/what-is-case-surveillance/conducting.html).

### 2. Data Access Methods Actually Used Today

Public health agencies use a patchwork of methods to obtain clinical data:

- **Electronic Laboratory Reporting (ELR):** Automated transmission of lab results from laboratories to PHAs. This is the most mature electronic pathway and covers the initial trigger well, but lab reports frequently arrive incomplete -- [up to half of lab reports submitted for public health case investigations lack patient addresses or ZIP codes](https://pmc.ncbi.nlm.nih.gov/articles/PMC8017563/).

- **Electronic Case Reporting (eCR/eICR):** Automated generation of case reports from EHRs triggered by matching clinical codes. Adoption has jumped from 53% of hospitals in 2021 to [84% in 2024](https://www.ncbi.nlm.nih.gov/books/NBK616186/), driven by CMS Promoting Interoperability requirements. However, no state requires automated case reporting and only three require electronic reporting of any kind. The eICR is explicitly an "initial" report -- it contains enough to trigger an investigation but not enough to complete one.

- **Fax and phone:** Still extremely common. [Health departments across the country rely on manual processes, like phone calls and fax machines, to get access to crucial data](https://www.governing.com/policy/too-many-public-health-data-systems-are-stuck-in-the-past). When an investigator needs follow-up clinical information (treatment records, additional lab results, imaging), the standard workflow is literally picking up the phone, calling the provider's office, and requesting records by fax.

- **Direct EHR access:** Some public health departments have negotiated read-only access to specific health system EHRs. For example, the [Tennessee Department of Health used remote desktop access to EHRs to review data on affected patients](https://www.cdc.gov/field-epi-manual/php/chapters/data-collection-management.html). But this is ad-hoc, not scalable, and requires separate credentials and training for each EHR system.

- **Immunization Information Systems (IIS):** All states operate immunization registries. These are among the more mature data exchange systems and allow bidirectional lookup.

- **Electronic Death Registration Systems (EDRS):** Used for mortality surveillance; relatively well-established.

- **Syndromic surveillance:** 78% of U.S. hospital emergency departments provide data to CDC's National Syndromic Surveillance Program within 24 hours, providing near-real-time situational awareness of ED visit patterns.

### 3. Electronic Case Reporting (eCR) and Follow-Up Data Gaps

The [eCR system](https://ecr.aimsplatform.org/) works through a specific pipeline: a clinical code in the EHR (e.g., a positive COVID test) triggers generation of an electronic initial case report (eICR). The report is routed through the [APHL AIMS platform](https://ecr.aimsplatform.org/) to the Reportable Conditions Knowledge Management System (RCKMS), which checks state-specific reportability rules and forwards reportable cases to the appropriate PHA.

**What the eICR contains:** Demographics, encounter information, diagnoses, problem list entries, lab results from the triggering encounter, medications, vital signs, and some social history (including travel history, which is notably hard to get from traditional reporting). The [data elements are defined by CSTE](https://build.fhir.org/ig/HL7/case-reporting/eicr_data_elements.html) and drawn from certified EHR capabilities.

**What the eICR does NOT contain (and investigators still need):**
- Complete treatment records and outcomes beyond the triggering encounter
- [Sexual partner information, partner treatment status](https://journals.uic.edu/ojs/index.php/ojphi/article/view/8359) (critical for STI investigation)
- Date of last HIV test (not a standard coded element in most EHR problem lists)
- Pregnancy status as a coded data element
- Specific site of infection and symptomatic status as coded concepts
- Contact information updates (patients move, change phones)
- Information from subsequent visits and follow-up care

The eICR is explicitly "initial" -- it starts the investigation but does not eliminate the need for follow-up data gathering, which still typically happens via phone and fax.

### 4. Specific Follow-Up Data Investigators Typically Need

After receiving the initial report, disease investigators commonly need:
- **Additional lab results:** Confirmatory tests, susceptibility/sensitivity testing, genotyping (e.g., for TB drug resistance, gonorrhea antibiotic resistance)
- **Treatment records:** Was the patient actually treated? With what drug, dose, duration? Did they complete treatment?
- **Demographics and contact info:** Correct address, phone number, emergency contacts (lab reports often lack these)
- **Clinical notes:** Provider notes about exposure history, symptoms, travel
- **Pregnancy status:** Critical for conditions like syphilis (congenital syphilis risk), hepatitis B, Zika
- **Coinfection status:** HIV status for STI cases, hepatitis coinfections
- **Partner/contact information:** For STI and TB investigations
- **Hospitalization and outcome data:** Was the patient admitted? Did they survive?

### 5. Real Bottlenecks and Delays -- and Their Impact on Outcomes

**Phone tag as a workflow.** Investigators routinely spend hours on the phone trying to reach providers, playing phone tag with clinic front desks, waiting for callbacks, and then waiting again for faxed records. This is not an edge case; it is the daily reality for most communicable disease investigators in the U.S.

**Incomplete initial reports.** When lab reports arrive without patient addresses (up to 50% of the time), investigators cannot even determine which jurisdiction the case belongs to, let alone contact the patient.

**Provider-side barriers.** Clinicians are busy. Returning calls from health departments is not their top priority. Some providers are unfamiliar with reporting requirements or are unclear about what HIPAA permits them to share (even though there is an explicit public health exception).

**System incompatibility.** When a patient is seen at Hospital A (which uses Epic) and then at Clinic B (which uses Cerner/Oracle Health), and the health department uses NBS, there is no automated way to pull together a complete clinical picture. Each system requires separate queries.

**Jurisdictional fragmentation.** A patient diagnosed in one county may live in another county in a different state. Transferring cases between jurisdictions requires manual coordination -- phone calls, emails, sometimes faxed case files.

**Impact on outcomes:** These delays are not abstract. For congenital syphilis, delayed identification means a pregnant woman does not receive treatment in time -- [congenital syphilis morbidity is 700% higher than a decade ago](https://www.cdc.gov/nchhstp/director-letters/release-2024-sti-data.html), and many cases are linked to missed opportunities where the mother had contact with the healthcare system but syphilis status was not communicated to public health in time. For TB, treatment monitoring gaps lead to incomplete treatment and drug resistance. For outbreak response (foodborne illness, measles), every day of delay in identifying and contacting cases means additional exposures.

### 6. Legal Authority of Public Health Agencies

**Mandatory reporting laws.** Every state has laws requiring healthcare providers and laboratories to report specified conditions to the public health authority. These are state laws, not federal -- so the list of reportable conditions, reporting timeframes, and reporting methods vary by jurisdiction.

**HIPAA public health exception.** The [HIPAA Privacy Rule at 45 CFR 164.512(b)](https://www.hhs.gov/hipaa/for-professionals/special-topics/public-health/index.html) explicitly permits covered entities to disclose protected health information (PHI) without patient authorization to a public health authority authorized by law to collect such information for disease prevention and control. This includes reporting diseases, injuries, vital events, conducting public health surveillance, investigations, and interventions. Additionally, [164.512(a)](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html) permits disclosures "required by law," which covers mandatory reporting statutes. The "minimum necessary" standard applies, but covered entities do not need to make a minimum necessary determination when the disclosure is required by another law (like mandatory reporting).

**Practical gap.** Despite having clear legal authority, PHAs often face practical resistance. Providers may not understand the HIPAA exception. Hospital legal/compliance departments may be overly cautious. Some states have specific public health statutes that explicitly grant the health department authority to [inspect and obtain copies of medical records](https://www.floridahealth.gov/diseases-and-conditions/disease-reporting-and-management/disease-reporting-and-surveillance/surveillance-and-investigation-guidance/_documents/hipaa-letter-for-practioners.pdf) for reportable disease investigation (Florida, for example).

**CDC has no general authority to compel reporting.** [Authority resides with state and local governments; CDC relies almost entirely on voluntary reporting from states](https://www.cdc.gov/data-modernization/php/policy-standards/index.html).

### 7. Jurisdictional Variation in Data Access

The U.S. public health system is profoundly decentralized:

- **~3,000 local health departments** with varying IT capabilities, staffing, and budgets
- **57 state and territorial health departments** each with their own surveillance systems, reporting rules, and data-sharing agreements
- **Federal agencies (CDC, CMS)** that depend on voluntary state reporting and have no general authority to mandate data submission

[A Pew Charitable Trusts / CSTE / Mathematica assessment of all 50 states (December 2024)](https://www.pew.org/en/research-and-analysis/reports/2024/12/state-public-health-data-reporting-policies-and-practices-vary-widely) found that state policies and practices vary widely. No state requires automated reporting of case reports. Only three require electronic (as opposed to paper) reporting. Many jurisdictions specify that automated electronic methods *may* be used but do not require them.

A [large proportion of local health departments lack the IT capability for bidirectional data sharing with their state health authority](https://pmc.ncbi.nlm.nih.gov/articles/PMC3925408/), and [41.2% of hospitals reported that the most prevalent barrier to electronic public health reporting was that public health agencies lacked the capacity to electronically receive data](https://pmc.ncbi.nlm.nih.gov/articles/PMC7313984/).

### 8. CDC Data Modernization Initiative (DMI)

The [DMI](https://www.cdc.gov/data-modernization/php/about/dmi.html), funded by Congress since before COVID-19 and accelerated by the American Rescue Plan ($500 million), aims to move from "siloed and brittle public health data systems to connected, resilient, adaptable, and sustainable 'response-ready' systems."

Key goals:
- Replace point-to-point data pipelines with shared, cloud-based infrastructure
- Enable real-time, bidirectional data exchange between clinical care and public health
- Modernize CDC's own internal data systems (many are decades old)
- Support forecasting and early-warning capabilities

Progress:
- 90% of CDC labs now electronically share data with external partners
- 78% of hospital EDs provide syndromic surveillance data within 24 hours
- The Public Health Data Strategy (PHDS, 2023) provides a strategic framework
- Emerging standards like FHIR-based data exchange (MedMorph, SMART on FHIR apps like the Health Data Exchange App) aim to enable query-based access to EHR data for public health

The initiative faces headwinds: [sustained and predictable funding is uncertain](https://www.route-fifty.com/digital-government/2024/12/report-electronic-case-reporting-helped-states-during-pandemic-they-need-use-it-more/401620/), political support varies, and the sheer number of independent health departments that must adopt new systems makes rollout slow.

### 9. Real-World Examples of Data Access Gaps Affecting Public Health Response

**COVID-19.** The pandemic exposed every weakness in the system. A [GAO report (GAO-22-106175)](https://www.gao.gov/products/gao-22-106175) documented how the lack of interoperable IT systems forced health officials to manually input data into multiple systems, and some state health departments could not directly exchange information with CDC, extending the time CDC needed to make response decisions. States described having to [fax documents, make copies, and physically transport documents](https://pmc.ncbi.nlm.nih.gov/articles/PMC8017563/). Up to half of lab reports lacked patient addresses. Race and ethnicity data were missing from large portions of case reports, preventing effective equity analysis during the crisis.

**Congenital syphilis.** [Nearly 4,000 cases reported in 2024, up 700% from a decade ago](https://www.cdc.gov/nchhstp/director-letters/release-2024-sti-data.html). Many cases represent missed opportunities -- the mother had contact with healthcare during pregnancy, but syphilis screening results were not communicated to public health in time for intervention. Partner services for syphilis require intensive case investigation (identifying and treating sexual partners), and [staffing and data access are major barriers](https://www.naccho.org/blog/articles/naccho-calls-for-increased-support-of-local-public-health-workforce-as-new-cdc-data-shows-syphilis-cases-in-newborns-continue-to-rise).

**STI surveillance more broadly.** The [STI Surveillance Network (SSuN)](https://www.cdc.gov/sti/php/projects/ssun.html) attempts enhanced data collection on reported gonorrhea and syphilis cases, but research has found that [eICR reports for STIs systematically lack critical data elements](https://journals.uic.edu/ojs/index.php/ojphi/article/view/8359) like partner information, site of infection, and symptomatic status -- information that is essential for public health action but not well-represented in structured EHR data.

**TB.** Contact investigations for TB can involve hundreds of potential contacts at multiple locations. [Manually organizing and comparing large amounts of location and date data to identify overlaps is extremely tedious and error-prone](https://www.cdc.gov/tb/php/genotyping/analytic-tools.html). TB surveillance also suffers from underreporting by private-sector clinicians who treat TB infrequently, and fragmented data systems make longitudinal treatment monitoring (which spans 6-12 months) difficult.

---

### Summary of Key Tensions for Interview Context

1. **Legal authority is clear; practical access is not.** PHAs have explicit legal authority to obtain clinical data, but exercising that authority in practice means phone calls, faxes, and negotiating with provider offices.

2. **The initial report starts the clock; the follow-up data determines outcomes.** eCR and ELR are improving the initial trigger, but the bulk of investigator time is spent chasing down follow-up information through manual channels.

3. **Technology exists but adoption is fragmented.** FHIR, eCR, ELR, and cloud-based surveillance systems exist, but the 3,000+ local health departments and thousands of healthcare facilities adopt them at vastly different rates with no federal mandate.

4. **The human cost is measurable.** Delays in data access directly translate to missed treatment windows (congenital syphilis), continued transmission (TB, measles), and inability to target interventions equitably (COVID-19 race/ethnicity data gaps).

Sources:
- [CDC NNDSS Case Surveillance](https://www.cdc.gov/nndss/what-is-case-surveillance/conducting.html)
- [CDC NBS](https://www.cdc.gov/nbs/php/about/index.html)
- [eCR AIMS Platform](https://ecr.aimsplatform.org/)
- [eICR Data Elements (HL7 FHIR IG)](https://build.fhir.org/ig/HL7/case-reporting/eicr_data_elements.html)
- [HHS HIPAA Public Health Exception](https://www.hhs.gov/hipaa/for-professionals/special-topics/public-health/index.html)
- [HHS HIPAA Privacy Rule Summary](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)
- [CDC Data Modernization Initiative](https://www.cdc.gov/data-modernization/php/about/dmi.html)
- [Pew: State Public Health Data Reporting Policies Vary Widely (Dec 2024)](https://www.pew.org/en/research-and-analysis/reports/2024/12/state-public-health-data-reporting-policies-and-practices-vary-widely)
- [Pew: Closing Gaps in Data-Sharing (June 2024)](https://www.pew.org/en/research-and-analysis/articles/2024/06/20/closing-gaps-in-data-sharing-is-critical-for-public-health)
- [GAO: Public Health Emergencies Data Management Challenges](https://www.gao.gov/products/gao-22-106175)
- [PMC: Challenges of Data Usage for US COVID-19 Response](https://pmc.ncbi.nlm.nih.gov/articles/PMC8017563/)
- [PMC: Barriers to Hospital Electronic Public Health Reporting](https://pmc.ncbi.nlm.nih.gov/articles/PMC7313984/)
- [PMC: Data Sharing in a Decentralized Public Health System](https://pmc.ncbi.nlm.nih.gov/articles/PMC11009847/)
- [PMC: Factors Related to Public Health Data Sharing](https://pmc.ncbi.nlm.nih.gov/articles/PMC3925408/)
- [Governing: Too Many Public Health Data Systems Stuck in the Past](https://www.governing.com/policy/too-many-public-health-data-systems-are-stuck-in-the-past)
- [CDC Field Epi Manual: Data Collection and Management](https://www.cdc.gov/field-epi-manual/php/chapters/data-collection-management.html)
- [CDC: 2024 National STI Data](https://www.cdc.gov/nchhstp/director-letters/release-2024-sti-data.html)
- [OJPHI: eCR of STIs - Missing Information](https://journals.uic.edu/ojs/index.php/ojphi/article/view/8359)
- [Electronic Public Health Reporting Among Hospitals, 2024](https://www.ncbi.nlm.nih.gov/books/NBK616186/)
- [Route Fifty: eCR Helped States During Pandemic](https://www.route-fifty.com/digital-government/2024/12/report-electronic-case-reporting-helped-states-during-pandemic-they-need-use-it-more/401620/)
- [NACCHO: Congenital Syphilis and Local PH Workforce](https://www.naccho.org/blog/articles/naccho-calls-for-increased-support-of-local-public-health-workforce-as-new-cdc-data-shows-syphilis-cases-in-newborns-continue-to-rise)
- [CDC: Public Health Data Authority](https://www.cdc.gov/data-modernization/php/policy-standards/index.html)
- [CDC: Data Modernization Milestones](https://www.cdc.gov/surveillance/data-modernization/milestones.html)
- [PMC: NBS Electronic Data Exchange and Workflow Decision Support](https://pmc.ncbi.nlm.nih.gov/articles/PMC5462203/)