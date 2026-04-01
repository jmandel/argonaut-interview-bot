---
id: p07
role: Data Aggregation Platform Builder
org_type: Health IT vendor (patient-facing interoperability platform)
org_size: small
archetype: app_developer
stance: supportive
use_cases:
  - patient_access
spec_topics:
  - trust_establishment
  - scoping
  - org_identity
  - category_authorization
  - subject_resolution
concerns:
  - adoption_barriers
  - vendor_lock_in
frameworks_referenced:
  - SMART
  - FHIR
  - OAuth2
key_terms:
  - credit_card_network_trust
  - virtual_card_scoping
  - portal_funnel_problem
  - verify_once_use_everywhere
  - platform_level_identity
---

## P7: Data Aggregation Platform Builder (Patient App Developer)

### Background

Builds interoperability platforms that aggregate patient data from providers, payers, and other ecosystem participants, with over four years of experience in the FHIR community. Has personally gone through the full exercise of connecting all of his own clinical and insurance data, de-identifying it, feeding it to an autonomous AI healthcare agent, and generating actionable insights — giving him firsthand experience with both the technical integration work and the patient-facing friction.

### Key Positions

- **The problem starts before any OAuth flow — most patients never create portal accounts in the first place.** Portal utilization is low because accessing health records isn't a recurring need for most people; credentials for infrequently used services don't stick. This means the entire SMART authorization model has a funnel problem that no amount of technical improvement to the OAuth handshake can fix. Even compelling new use cases like AI-powered health agents don't change this if they still route through portal credential creation as the first step.

- **Authorization should live at the platform level, not per-app.** The patient should verify their identity once through something like Apple Wallet and carry that verification portably. Any health app the patient chooses should be able to leverage that trust anchor without reinventing the identity step. The verification should happen once, in one place, and propagate to whatever app the patient uses.

- **App trust should propagate through a network framework, not site-by-site negotiation.** The current model where each health system individually approves each third-party app is equivalent to requiring every merchant to individually approve every credit card before listing it. Visa and Mastercard don't work that way — framework-level approval propagates across all participating merchants. Health apps need the same structure: approved once through a trusted framework, accepted everywhere that participates.

- **Patients need granular, self-configured controls over what flows through their health ID.** The model is virtual credit card numbers: a patient generates a scoped authorization with configurable limits — what data types, what spending cap equivalent, what geographic or organizational restrictions — and the ticket enforces those constraints. The control surface should be in one place, not re-specified at every data holder.

- **Within-vendor fragmentation is as painful as cross-vendor fragmentation.** Having multiple accounts at different health systems running the same EHR platform (e.g., separate portal logins for a primary care network and a health plan both on the same vendor) compounds the credential problem. Even if a single vendor consolidated its own accounts, the broader multi-vendor problem remains — but solving the single-vendor case first would address the largest share of patient pain.

- **Even with deep technical skills, complete data aggregation is currently impossible.** Connected clinical providers and insurance via FHIR, but still encountered a niche EHR with no developer sandbox, physical colonoscopy notes mailed on paper with no electronic equivalent, and multiple portal accounts requiring separate credentials. Had to manually create PDFs to fill the gaps. Once the data reached an AI agent the results were powerful — but the aggregation step is prohibitive for anyone without significant technical investment.

### Distinctive Angle

The entire framing is organized around consumer financial infrastructure as a design template for health data authorization. The credit card network is not just an analogy — it is a concrete architectural proposal: a framework-level trust layer (like Visa/Mastercard) that handles app approval, a portable credential (like a card number) that the patient carries, and configurable scoping (like virtual card limits) that the patient controls from a single interface. This consumer-product lens shifts the design conversation away from protocol mechanics and toward whether the resulting system feels as natural as tapping a credit card or scanning a driver's license at TSA. It also surfaces a specific funnel insight: optimizing the authorization handshake is moot if the patient never creates the account that initiates it. Any spec design that assumes an existing portal relationship as the starting point will miss the largest segment of patients.

### Tensions Surfaced

- **Platform-level identity vs. per-app authorization.** Wants identity verification to happen once at the OS/wallet level and propagate to all apps — but the spec may need to define authorization relationships per-app (since different apps have different purposes and scope needs). Reconciling "verify once" with "scope per use case" requires the platform to support both a stable identity layer and per-app policy configuration.
- **Network trust vs. data holder autonomy.** The Visa/Mastercard model assumes merchants accept all cards on the network. Health systems may insist on retaining per-app approval authority, which would undermine the "approved once, accepted everywhere" value proposition. The spec needs to decide how much data holder discretion is compatible with framework-level trust.
- **Consumer simplicity vs. healthcare complexity.** Financial analogies work well for the interaction pattern but may understate the complexity of health data scoping. A credit card limit is a single number; health data access involves resource types, date ranges, sensitivity categories, and purpose of use. Whether patients can meaningfully configure these controls — or whether the simplicity breaks down under the weight of healthcare-specific requirements — is unresolved.
