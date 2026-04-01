---
id: p13
role: Senior FHIR Engineer
org_type: Medicaid managed care plan
org_size: large
archetype: payer
stance: conditional
use_cases:
  - payer_claims
  - patient_access
spec_topics:
  - deployment_model
  - scoping
  - subject_resolution
concerns:
  - adoption_barriers
  - workforce_gap
  - vendor_lock_in
  - provider_resistance
frameworks_referenced:
  - FHIR
  - CMS-0057
  - X12
  - HL7v2
  - CDA
key_terms:
  - costco_membership_card
  - rfi_loop_elimination
  - open_source_container
  - one_person_fhir_shop
  - vendor_toll_road
---

## P13: Senior FHIR Engineer (Medicaid Managed Care Plan, CA)

### Background

Sole FHIR implementer at a large publicly funded Medicaid managed care plan, responsible for bridging legacy pipelines (X12, HL7 v2, CDA) to FHIR while meeting CMS-0057 deadlines. The rest of the engineering team is fully allocated to legacy formats — C# developers managing CDA, v2, and complex ETL processes — leaving one person to configure the clinical data repository, write FHIR connectors, and manage the vendor relationships that fill the remaining gaps.

### Key Positions

- **The RFI loop is the highest-friction point in payer-provider exchange, and Permission Tickets could eliminate it.** Today, prior authorization and claims adjudication follow a portal-heavy workflow: providers submit service packages tied to CPT codes, which are either accepted, rejected, or flagged for a Request for Additional Information. The RFI phase involves repeated back-and-forth exchanges of unstructured documents — PDFs, text files, images — until enough clinical evidence accumulates to satisfy medical necessity. Rejections enter an appeals path that restarts the same manual cycle. A scoped FHIR request tied to a specific claim and member could replace that entire loop with a direct, structured pull from the provider's system.

- **Adoption requires either a federal mandate or an implementation so frictionless that organizational resistance becomes irrelevant.** The industry's pace of change makes voluntary adoption unlikely. Staff see automation as a threat to their jobs and "will likely fight it tooth and nail." Beyond cultural resistance, the workforce to evaluate and deploy a new standard does not exist in most payer organizations. The spec has to be made "so easy that it is invisible" or it will not move from paper to production.

- **The only viable distribution model is an open-source, pre-configured container.** From a one-person FHIR shop inside a government-funded plan, any new standard that requires vendor negotiation, procurement cycles, or custom integration will stall indefinitely. "If a vendor tries to gatekeep this technology, it just creates more delays and administrative hurdles." A standardized container that organizations can deploy freely is the only path that scales without compounding the burden on already-thin engineering teams.

- **Vendor lock-in and low-quality offshore solutions are twin risks for publicly funded plans.** Government-funded environments face strict taxpayer accountability, making the build-vs-buy decision both high-stakes and slow. Cheap solutions from unfamiliar vendors may look viable on paper but fail in production. If vendors layer proprietary costs onto what should be an open standard, adoption stalls in procurement. The spec needs to foreclose the vendor toll-road scenario by design — but a reference implementation also has to be production-grade, not just freely available.

- **The Medicare population needs a radically simplified access mechanism — something like a membership card with a QR code and PIN.** Many Medicare members are older adults who opt out of accessing their health data entirely because portal login is too difficult. Plan staff spend significant time troubleshooting logins and verifying basic information rather than focusing on health outcomes. A physical credential that works like a "Costco membership card" — present it anywhere and your data is immediately available — would shift the accessibility equation for a population that current digital identity models leave behind.

- **The workforce knowledge gap is the structural barrier beneath every other adoption challenge.** "No one truly understands FHIR yet." The team's database specialists can surface data effectively, but the FHIR layer — configuration, integration, architecture — depends entirely on one engineer. Legacy developers are fully consumed by existing pipelines. This is not a staffing complaint but a structural mismatch between where federal mandates assume the industry is and where payer organizations actually stand.

### Distinctive Angle

Payer organizations subject to CMS-0057 are building FHIR infrastructure under conditions that most spec designers do not encounter: skeleton engineering teams, legacy-saturated development capacity, vendor dependency, and public-sector procurement constraints. A new authorization standard that requires custom integration work or vendor contracting will not reach these organizations in time to matter. The prescription — an open-source containerized reference implementation that bypasses vendor and procurement bottlenecks — reframes the adoption question from "is the spec technically sound?" to "can a single engineer at a government-funded plan deploy this without a procurement cycle?" That deployment-model constraint should shape how Permission Tickets are packaged and distributed, not just how they are specified. Separately, the "Costco membership card" concept — a physical QR-and-PIN credential for Medicare members — pushes Permission Tickets beyond B2B authorization into a patient-facing accessibility tool for populations where portal-based digital identity has already failed.

### Tensions Surfaced

- **Mandate timing vs. implementation capacity.** Federal mandates drive adoption, but the engineering capacity to implement them is razor-thin. Adding Permission Tickets to a compliance roadmap that a single engineer is already managing alone risks crowding out the CMS-0057 work that creates the FHIR foundation tickets depend on.
- **Open-source imperative vs. production-quality assurance.** Wants freely deployable, vendor-independent implementation — but also warns that cheap or unfamiliar solutions fail in production. The reference implementation needs to be both free and production-grade, which requires sustained investment the open-source model does not automatically provide.
- **Automation as threat vs. automation as mission.** Staff resistance to automation is a real organizational force, yet the plan's mission — putting member health first — requires exactly the efficiency gains automation provides. Permission Tickets would intensify this tension by making the RFI workflow automatable in ways that visibly displace manual review roles.
- **Public accountability vs. procurement friction.** Being publicly funded means vendor lock-in is unacceptable (taxpayer accountability) and that adopting anything new is slow (government procurement). These constraints push in opposite directions — toward open-source adoption but away from rapid deployment of anything unfamiliar.
