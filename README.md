# Variations Classifier

A browser-based practice tool for classifying post-approval changes to medicines. Describe a change to an approved product, answer the questions the rules ask, and get:

- the reporting category, with a **reason trail** and the **rule behind every step** (regulation or guidance, section, version and date);
- **what-if** toggles that show which answers would change the category, and the routes to a lower one;
- the **filing plan**: related changes grouped in the most restrictive category, the documents and CTD sections each filing updates, the dates (earliest use, user-fee goal dates, annual report due date, the 505(o)(4) response clock) and a cover letter draft;
- a **change package** (`change-package.json`) that the [eCTD Dossier Builder](https://github.com/randomthingsonlineatsk-cloud/ectd-dossier-builder) imports to start a sequence of the right type (US, EU, India, Canada, Switzerland and Japan);
- a **classification report** as a PDF, watermarked as training material.

Seven rule sets: the **United States, the European Union, India, Canada, Switzerland, Japan and WHO prequalification**, plus **ICH Q12 lifecycle tools** and an **ICH Q5E comparability** check.

Live site: https://randomthingsonlineatsk-cloud.github.io/variations-classifier/

**Training only.** Every product, company and person is fictional, and application numbers are invented. Real regulation, guidance, category and form names are used so the practice is realistic; nothing here imitates an agency portal or form, and results are not regulatory advice.

## What is in this release (Phases 1 to 4)

**US pack, edition 2026.1.** Prior approval supplement, CBE-30, CBE-0, annual report and letters, for NDAs, ANDAs and BLAs, built from:

| Source | Version |
|---|---|
| 21 CFR 314.70 (and 314.97 for ANDAs), 314.72, 314.81(b)(2) | eCFR, read 2026-10-11 |
| 21 CFR 601.12 (biologics) | eCFR, read 2026-10-11 |
| Guidance: Changes to an Approved NDA or ANDA | Revision 1, April 2004 |
| Guidance: CMC Postapproval Manufacturing Changes To Be Documented in Annual Reports | March 2014 |
| Guidance: CMC Changes to an Approved Application: Certain Biological Products | June 2021 |
| Guidance: Comparability Protocols for Postapproval Changes to the CMC Information | October 2022 |
| SUPAC-IR (components and composition) | November 1995 |
| Guidance: Safety Labeling Changes, Implementation of Section 505(o)(4) | July 2013 |
| ICH Q12 guidance and FDA implementation considerations | May 2021 |
| PDUFA VII and GDUFA III goals letters | Fiscal years 2023 to 2027 |

**EU pack, editions 2026.1 and 2013.1.** Type IA, IA-IN, IB, II, extensions, no-variation and other-procedure outcomes for centralised, MRP/DCP and national authorisations, built from:

| Source | Version |
|---|---|
| Regulation (EC) No 1234/2008 as amended by Delegated Regulation (EU) 2024/1701 | Amendment applies from 1 January 2025 |
| Commission guidelines on the categories of variations, C/2025/5045 | 22 September 2025, applies from 15 January 2026 |
| Commission guidelines 2013/C 223/01 (transition edition, about 50 common changes) | Applied until 14 January 2026 |
| EMA questions and answers on classification and on grouping; EMA post-authorisation procedural advice | Web editions read 11 October 2026 |
| Directive 2001/83/EC, Article 61(3); Regulation (EC) No 2141/96 (transfers) | Consolidated |

The annex conditions are shown as checklists (paraphrased; read the official text for exact wording), and conditions about the product (sterile, biological, dosage form) are answered from the product profile. A case uses the EU edition in force on its date, so cases dated before 15 January 2026 get the 2013 answer.

**EU procedures.** Grouping (the group follows its highest type, with warnings for groupings EMA generally does not accept), the Type IA annual update, worksharing and super-grouping across authorisations, Type IB 30-day and Type II 30/60/90-day clocks with clock stops, implementation after the opinion or the decision, and EU cover letters.

**India pack, edition 2026.1, with the 2026 draft as a what-if.** Biological products follow CDSCO's guidance PAC/2024 (version 1.2, implemented 16 May 2024): Level I supplement, Level II notifiable change, Level III annual notification in the first quarter (shelf-life changes still need approval), Level IV record. Chemical new drugs have no codified categories in force, so the answer is a case-by-case application through SUGAM; new claims make a product a new drug again (NDCT Rules, rule 2(w)), with a decision within 90 working days. A per-case switch applies the draft G.S.R. 97(E) of 2 February 2026 (Levels I to III); because the draft gives definitions but no examples, levels for chemical drugs are inferred from the matching FDA entry, which uses the same three tests, and the result says so. Not every PAC/2024 table is modelled yet; uncovered biologic changes say so.

**Canada pack, edition 2026.1.** Level I supplement (SNDS or SANDS), Level II supplement for safety labelling, Level II notifiable change (biologics only, after a No Objection Letter), Level III notice of change (pharmaceuticals at implementation, biologics within 12 months), Level III immediate notification (biologics, through a protocol), Level IV record and administrative submissions. Conditions from Appendix 1 are checklists; when one is not met the change moves up a level.

| Source | Version |
|---|---|
| Post-NOC Changes: Framework Document (pharmaceutical drugs) | Revised 2020-03-30 |
| Post-NOC Changes: Quality Document, Appendix 1 | Revision implemented 2019-07-31 |
| Guidance on post-NOC changes: Framework for biologic and Schedule C drugs; Quality for biologics | 2026-05-15 |
| Post-NOC Changes: Safety and Efficacy Document | 2020-04-01 |
| Performance standards (review 1 targets: 180, 300 and 120 days; notifiable change 90 days) | Read 2026-10-11 |
| Health Canada notice on ICH Q12 and Q14 (PACMPs for biologics from November 2026; no ECs yet) | 2026 |

**Switzerland pack, edition 2026.1.** Swissmedic's revised list of variations (Annex 7 TPLRO, in force 1 February 2026) is harmonised as far as possible with the EU list, so the pack starts from the EU 2026.1 trees and conditions, then swaps the sources, Swiss wording and procedures: Type IA-IN within one month, Type IB tacitly accepted after 70 days, Type II up to 270 days of Swissmedic time, multiple applications on the longest time limit, no EU worksharing, and no Article 61(3) route.

| Source | Version |
|---|---|
| TPLRO Annex 7, revised list of variations; TPO Articles 21 to 24 | In force 1 February 2026 |
| Swissmedic questions and answers on variations and extensions HMP | 01.10.2026 |
| Swissmedic guidance: Time limits for authorisation applications | Version 10.0, valid from 01.09.2025 |

**Japan pack, edition 2026.1.** Japan has no list of change types: the approval form decides. Approved matters need a partial change approval (site changes on a rapid track of about 3 months); minor change items are notified within 30 days; items outside the form need no filing. Article 47 of the Enforcement Regulations keeps specification, indication, dosage, pathogen inactivation and quality-affecting process changes out of the minor route whatever the form says. Includes the 2024 moderate change trial, the 2025 annual report trial, change plans (PACMP, effective 40 working days after acceptance) and new approvals for new strengths, forms, routes and brand names.

| Source | Version |
|---|---|
| PMD Act, Article 14; Enforcement Regulations, Article 47 | As amended |
| MHLW notice 0927-4 (moderate change items, trial) | 27 September 2024 |
| MHLW notice 0213-5 (annual report, trial) | 13 February 2025 |
| MHLW Q&A on change plans (PACMP) | 3 October 2025 |
| MHLW study group review-time survey (median 6 months chemical, 12 biologics; not a target) | 13 October 2023 |

**WHO prequalification pack, edition 2026.1.** Variations to prequalified multisource finished products: annual notification, immediate notification, minor variation (implement if WHO starts no correspondence within 60 days of acknowledgement), major variation (letter of acceptance) and new applications. Unlisted changes are major by default unless justified as an unclassified minor (suffix u) or agreed with PQT. Vaccines and biotherapeutics are outside this pack.

| Source | Version |
|---|---|
| WHO guidelines on variations to a prequalified product, TRS 981 Annex 3 | 2013 |
| PQT frequently asked questions on variations | Revision 03, 15 December 2022 |
| PQT variations approval mechanism and timeline table | October 2016 (prevails over the guideline) |

**Lifecycle tools (ICH Q12 and Q5E).** For one product: an established conditions register with a risk-based suggestion (prior approval, moderate or low notification, or not an EC) mapped to the US, EU, Swiss and Japanese categories, with a link that classifies a change to that element; a PACMP builder (changes covered, studies and acceptance criteria, step 1 classified in every region, the step 2 category per region); a PLCM document compiled from them (preview, print, HTML download); and an ICH Q5E comparability checklist for biologics (physicochemical, biological activity, purity, stability and process attributes) with a verdict: highly similar, justified differences, bridging studies likely, or incomplete.

**Certificate and reports.** A separate portfolio certificate for this app (every lesson check, every mission at 70 or more, a mixed quiz round, drills in four regions; distinction for 14 expert missions at 85 or more), with a verification code and a record of results, and a statement of progress at any time. Neither is an accreditation. Every case can be saved as a classification report PDF, watermarked as training material.

**Classroom mode.** Uses the classroom server of the eCTD Dossier Builder (one Cloudflare Worker and D1 database, `vc_` tables, routes under `/vc/v1`). Instructors create a class, set missions with a level and a due date, see each student's case and score, re-score it in their own browser, comment, download results as CSV and see a leaderboard; students join with a code. Without a server the app stays browser-only.

**Labelling rollout.** One company core data sheet (CCDS) change tracked into every regional label the product has (US prescribing information, EU SmPC and leaflet, Indian prescribing information, Canadian product monograph, Swiss information texts, Japanese package insert, WHO PQ SmPC): the label section, the classification in each region, a company target date, the lag and the status.

**Change requests.** A training change request (present and proposed state, reason, planned date) that suggests catalogue changes from its description, writes a regulatory impact statement for every market, records the sign-off with the pack editions used, and moves across a status board.

**Rollout planner.** For a case covering several markets: when each can use the change, the date every market can, which markets hold it back, how long old and new product overlap, and the lower routes that would shorten it.

**Drills.** Timed sets of ten classification cases per region, generated from the decision trees so each has one right answer.

**All regions at once.** A case can cover any of the seven regions the product is registered in: shared questions are answered once and the answers sit side by side, with a filing plan per region. The Compare page lists every category each change can reach in each region.

Where the app simplifies a rule, the result says so; the Sources page lists every simplification.

**Change catalogue.** 120 region-neutral changes in ten groups (sites, process, composition, specifications and methods, container closure, stability, labeling and safety, protocols and lifecycle tools, biologics, administrative), each with a decision tree in every pack, plain-language help and the supporting documents with their CTD sections.

**Products.** Eight fictional products with a registration profile for each region they are sold in: six shared with the eCTD Dossier Builder (Ostrevia tablets, Talmisartan generic tablets, Talvera XR capsules, Nelvaprox injection, Arventa and Selvanta antibodies), Brezovent, a metered-dose inhaler, and Malvaren, a WHO-prequalified dispersible antimalarial tablet. A product can also be added from an eCTD Dossier Builder project file.

**Learning.** Seventeen lessons with checks, twenty-eight scored missions at three levels (guided, standard, expert) across all seven regions, a 110-question quiz bank with flashcards, timed drills per region, a glossary and a progress page.

**Data.** Everything stays in the browser (IndexedDB). Cases, attempts and products carry a user ID and a class ID; export and import the whole project as a `.vcproj.json` file.

## Phases

| Phase | Content | Status |
|---|---|---|
| 1 | US pack, engine, filing plan, change package, missions and lessons | Done |
| 2 | EU pack (2025 and 2013 guidelines), condition checklists, grouping, worksharing, EU clocks, comparison | Done |
| 3 | India pack with the 2026 draft as a what-if, labelling rollout, change requests, rollout planner, drills | Done |
| 4 | Canada, Switzerland, Japan and WHO PQ packs; 120 changes; ICH Q12 and Q5E tools; certificate and report PDFs; classroom mode | Done |

## How it works

- `src/data/catalogue.json`, `questions.json`, `evidence.json`: the region-neutral catalogue, the shared question bank and the supporting documents.
- `src/packs/<region>/<edition>/`: a content pack. `pack.json` holds the sources (with versions and dates), the categories, clocks, Module 1 documents, eCTD submission types and the change log; `entries.json` holds one decision tree per change.
- `src/engine/`: the classifier (tree walker, ranges for unanswered questions, what-if), filings and dates, the hand-off file, missions and storage. No UI code.
- `tools/packs/`: the Python generators that write the Phase 4 packs and entries (`p4_*.py`), so every tree can be reviewed and rebuilt; `tools/content_p4.py` adds the Phase 4 lessons, missions, quiz and glossary.
- `tests/`: engine tests per phase and a pack integrity test (every tree reaches an outcome, every outcome cites a known source, every pack covers the catalogue).

## Run it locally

```
npm install
npm test
npm run dev
```

`npm run build` writes the static site to `dist/`; it uses relative paths, so it works from any GitHub Pages path.

## Accessibility

Every control works from the keyboard, form fields have labels, results are announced with live regions, colour is never the only signal (category pills carry their names), and every screen works at 360 px width.

## Licence

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Built by Khan Gulrez Shagufa Fazal Ahmed.
