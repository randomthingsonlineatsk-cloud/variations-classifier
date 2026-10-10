# Variations Classifier

A browser-based practice tool for classifying post-approval changes to medicines. Describe a change to an approved product, answer the questions the rules ask, and get:

- the reporting category, with a **reason trail** and the **rule behind every step** (regulation or guidance, section, version and date);
- **what-if** toggles that show which answers would change the category, and the routes to a lower one;
- the **filing plan**: related changes grouped in the most restrictive category, the documents and CTD sections each filing updates, the dates (earliest use, user-fee goal dates, annual report due date, the 505(o)(4) response clock) and a cover letter draft;
- a **change package** (`change-package.json`, US or EU) that the [eCTD Dossier Builder](https://github.com/randomthingsonlineatsk-cloud/ectd-dossier-builder) imports to start a sequence of the right type.

Live site: https://randomthingsonlineatsk-cloud.github.io/variations-classifier/

**Training only.** Every product, company and person is fictional, and application numbers are invented. Real regulation, guidance, category and form names are used so the practice is realistic; nothing here imitates an agency portal or form, and results are not regulatory advice.

## What is in this release (Phases 1 and 2: United States and European Union)

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

**Both regions at once.** A case can cover the US and the EU: shared questions are answered once and the answers sit side by side, with a filing plan per region. The Compare page lists every category each change can reach in each region.

Where the app simplifies a rule, the result says so; the Sources page lists every simplification.

**Change catalogue.** 73 region-neutral changes in ten groups (sites, process, composition, specifications and methods, container closure, stability, labeling and safety, protocols, biologics, administrative), each with a decision tree in the US pack, plain-language help and the supporting documents with their CTD sections.

**Products.** Seven fictional products with US and EU registration profiles: six shared with the eCTD Dossier Builder (Ostrevia tablets, Talmisartan generic tablets, Talvera XR capsules, Nelvaprox injection, Arventa and Selvanta antibodies) and Brezovent, a metered-dose inhaler. A product can also be added from an eCTD Dossier Builder project file.

**Learning.** Nine lessons with checks (six US, three EU), sixteen scored missions at three levels (guided, standard, expert), an 80-question quiz bank with flashcards, a glossary and a progress page.

**Data.** Everything stays in the browser (IndexedDB). Cases, attempts and products carry a user ID and a class ID; export and import the whole project as a `.vcproj.json` file.

## Planned phases

| Phase | Content |
|---|---|
| 3 | India pack (rules in force, with the February 2026 draft as a what-if); core data sheet to regional labeling; change control intake; global rollout planner; drills |
| 4 | ICH Q12 tools (established conditions, PACMP builder, PLCM document), Q5E checklist; Canada, Switzerland, Japan and WHO PQ packs; certificate; classroom on the shared Cloudflare Worker |

## How it works

- `src/data/catalogue.json`, `questions.json`, `evidence.json`: the region-neutral catalogue, the shared question bank and the supporting documents.
- `src/packs/<region>/<edition>/`: a content pack. `pack.json` holds the sources (with versions and dates), the categories, clocks, Module 1 documents, eCTD submission types and the change log; `entries.json` holds one decision tree per change.
- `src/engine/`: the classifier (tree walker, ranges for unanswered questions, what-if), filings and dates, the hand-off file, missions and storage. No UI code.
- `tests/`: engine tests and a pack integrity test (every tree reaches an outcome, every outcome cites a known source).

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
