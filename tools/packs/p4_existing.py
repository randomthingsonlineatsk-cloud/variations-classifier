"""Phase 4: entries for the 47 new changes in the US, EU 2026 and India packs, plus pack
metadata the new engine code reads (category tones, filing groups, new sources)."""
import copy
from lib import load, save, O, Q, C, A, remap

US = 'src/packs/us/2026.1'
EU = 'src/packs/eu/2026.1'
EU13 = 'src/packs/eu/2013.1'
IN = 'src/packs/in/2026.1'
IND = 'src/packs/in/2026.1-draft'

TONES = {
    'us': {'NONE': 'letter', 'LETTER': 'letter', 'AR': 'ar', 'CBE0': 'cbe0', 'CBE30': 'cbe30', 'PAS': 'pas', 'NEW': 'ext'},
    'eu': {'NONE': 'letter', 'OTHER': 'letter', 'IA': 'ar', 'IAIN': 'cbe0', 'IB': 'cbe30', 'II': 'pas', 'EXT': 'ext'},
    'in': {'REC': 'letter', 'L3': 'ar', 'L3SL': 'cbe0', 'ADMIN': 'cbe0', 'CDSCO': 'cbe30', 'L2': 'cbe30', 'L1': 'pas', 'NEWDRUG': 'ext'},
}
FILING = {
    'us': {'shared': ['AR', 'LETTER'], 'apart': ['NONE']},
    'eu': {'shared': ['IA', 'IAIN'], 'apart': ['NONE', 'OTHER']},
    'in': {'shared': ['L3'], 'apart': ['REC']},
}

US_SOURCES = {
    'q8': {'title': 'ICH Q8(R2) Pharmaceutical Development (FDA guidance)', 'version': 'Revision 2', 'date': 'November 2009',
           'url': 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q8r2-pharmaceutical-development', 'status': 'final'},
    'q13': {'title': 'ICH Q13 Continuous Manufacturing of Drug Substances and Drug Products (FDA guidance)', 'version': 'Final', 'date': 'March 2023',
            'url': 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q13-continuous-manufacturing-drug-substances-and-drug-products', 'status': 'final'},
    'cfr211': {'title': '21 CFR 211.84 Testing and approval or rejection of components', 'version': 'eCFR, current', 'date': 'read 2026-10-11',
               'url': 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-C/part-211/subpart-E/section-211.84', 'status': 'final'},
    'fdca505': {'title': 'FD&C Act section 505(b) and 21 CFR 314.50 (new drug applications)', 'version': 'Current', 'date': 'read 2026-10-11',
                'url': 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-D/section-314.50', 'status': 'final'},
    'grems': {'title': 'Guidance: REMS: FDA\'s Application of Statutory Factors / Format and content; REMS modifications and revisions', 'version': 'Final', 'date': '2019 to 2020',
              'url': 'https://www.fda.gov/drugs/drug-safety-and-availability/risk-evaluation-and-mitigation-strategies-rems', 'status': 'final'},
    'cfr314150': {'title': '21 CFR 314.150(c) Withdrawal of approval at the applicant\'s request', 'version': 'eCFR, current', 'date': 'read 2026-10-11',
                  'url': 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-D/section-314.150', 'status': 'final'},
    'cfr31450': {'title': '21 CFR 314.50(a)(5) US agent for a foreign applicant', 'version': 'eCFR, current', 'date': 'read 2026-10-11',
                 'url': 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-D/section-314.50', 'status': 'final'},
    'gscore': {'title': 'Guidance: Tablet Scoring: Nomenclature, Labeling, and Data for Evaluation', 'version': 'Final', 'date': 'March 2013',
               'url': 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/tablet-scoring-nomenclature-labeling-and-data-evaluation', 'status': 'final'},
}
US_NEW_CATS = [
    {'id': 'NONE', 'rank': 0, 'short': 'No report', 'label': 'No report: managed in the quality system', 'implement': 'do', 'badge': 'Managed under CGMP',
     'rule': 'No submission: the change is managed and documented under CGMP and the quality system.', 'src': 'gq12', 'at': 'Chapter 3'},
    {'id': 'NEW', 'rank': 5, 'short': 'New application', 'label': 'New application', 'implement': 'wait-for-approval', 'badge': 'New application',
     'rule': 'File a new application (an NDA, or an ANDA for a generic) and market the new product only after approval.', 'src': 'fdca505', 'at': '505(b)'},
]

EU_SOURCES = {
    'q8': {'title': 'ICH Q8(R2) Pharmaceutical development (EMA/CHMP/167068/2004)', 'version': 'Step 5', 'date': 'June 2017 (current)',
           'url': 'https://www.ema.europa.eu/en/ich-q8-r2-pharmaceutical-development-scientific-guideline', 'status': 'final'},
    'q12': {'title': 'ICH Q12 Technical and regulatory considerations for pharmaceutical product lifecycle management (EMA/CHMP/ICH/804273/2017)', 'version': 'Step 5', 'date': 'March 2020',
            'url': 'https://www.ema.europa.eu/en/ich-q12-technical-regulatory-considerations-pharmaceutical-product-lifecycle-management-scientific-guideline', 'status': 'final'},
}
EU_CONDITIONS = {
    'Q.I.a.3:1': ('Any change to the manufacturing method is only what scale-up or downscaling needs (for example equipment size).', None),
    'Q.I.a.3:2': ('Results of at least two batches at the proposed size meet the specification.', None),
    'Q.I.a.3:3': ('The active substance is not a biological substance.', 'notBio'),
    'Q.I.a.3:4': ('The change does not adversely affect the reproducibility of the process.', None),
    'Q.I.a.3:5': ('The change is fully described in the open part of the ASMF, if there is one.', None),
    'Q.I.a.3:6': ('Active substance and intermediate specifications stay the same, and the impurity control strategy remains appropriate.', None),
    'Q.I.a.3:7': ('The active substance is not sterile.', None),
    'Q.I.a.3:8': ('The change does not come from unexpected events during manufacture or from stability concerns.', None),
    'Q.I.d.1:1': ('The change does not come from unexpected events during manufacture or from stability concerns.', None),
    'Q.I.d.1:2': ('Studies follow the approved protocol, real-time data are submitted, all batches meet the specification and no unexpected trends appear.', None),
    'Q.I.d.1:3': ('The physical state of the active substance is unchanged.', None),
    'Q.II.a.1:1': ('Release and end-of-shelf-life specifications are unchanged apart from appearance.', None),
    'Q.II.a.2:1': ('Dissolution of the new product is comparable to the old one (disintegration for herbal products).', None),
    'Q.II.a.2:2': ('Release and end-of-shelf-life specifications are unchanged apart from shape or dimensions.', None),
    'Q.II.a.2:3': ('Qualitative and quantitative composition and mean mass are unchanged.', None),
    'Q.II.a.2:4': ('It is not a scored tablet intended to divide into equal doses.', None),
    'Q.II.a.4:1': ('Dissolution of two batches is comparable to the old product (disintegration for herbal products).', None),
    'Q.II.a.4:2': ('The coating or shell is not critical for release or other attributes.', None),
    'Q.II.a.4:3': ('The finished product specification changes only for weight and dimensions.', None),
    'Q.II.a.4:4': ('Stability studies have started on at least two pilot or industrial batches, with at least three months of data.', None),
    'Q.II.b.2:1': ('The batch release manufacturer is in the EU/EEA with a valid manufacturing authorisation, and one release site stays in the EU/EEA.', None),
    'Q.II.b.2:3': ('The analytical procedure is not biological, immunological or immunochemical.', None),
    'Q.II.b.5:3': ('Any change is within the range of the currently approved limits.', None),
    'Q.II.b.5:4': ('The analytical procedure stays the same, or changes only in minor ways.', None),
    'Q.II.b.5:6': ('The analytical procedure is not biological, immunological or immunochemical.', None),
    'Q.II.b.5:8': ('Studies in line with the relevant guidelines show the updated procedure is at least equivalent to the former one.', None),
    'Q.II.c.1:1': ('The change does not come from an earlier commitment to review acceptance criteria.', None),
    'Q.II.c.1:2': ('The change does not come from unexpected events during manufacture or from stability concerns.', None),
    'Q.II.c.1:3': ('The change is not part of a control strategy revision aimed at reducing redundant testing.', None),
    'Q.II.c.1:4': ('The analytical procedure stays the same, or changes only in minor ways.', None),
    'Q.II.c.1:5': ('A new analytical procedure is not a novel non-standard technique or a standard technique used in a novel way.', None),
    'Q.II.c.1:6': ('The change does not concern a genotoxic impurity.', None),
    'Q.II.c.1:7': ('The attribute does not control a critical attribute of the excipient.', None),
    'Q.II.c.3:1': ('Excipient and finished product release and shelf-life specifications are unchanged.', None),
    'Q.II.e.7:1': ('No packaging component is deleted.', None),
    'Q.II.e.7:2': ('The composition and design specifications of the component stay the same.', None),
    'Q.II.e.7:3': ('Specifications and quality control procedures are at least equivalent.', None),
    'Q.II.e.7:4': ('Any sterilisation method and conditions stay the same.', None),
    'Q.II.g.3:1': ('The deletion does not come from unexpected events or out-of-specification results during implementation and does not affect approved dossier information.', None),
    'Q.III.1:1': ('The impact of the new source is evaluated: no change to critical quality attributes or composition, and release and shelf-life specifications are unchanged.', None),
    'Q.III.1:2': ('Active substance impurity specifications are unchanged (tightening is allowed).', None),
    'Q.III.1:3': ('Other relevant properties (for example polymorph, hydration state, particle size) are unchanged.', None),
    'Q.III.1:4': ('No material of human or animal origin needing viral safety data is used in the process.', None),
    'Q.III.1:5': ('The active substance is tested before use if the CEP has no re-test period and the dossier lacks supporting data.', None),
    'Q.III.1:6': ('The substance is not sterile.', None),
    'Q.III.1:9': ('For a non-sterile active substance used in a sterile product, no water is used in the last synthesis steps, or the water guideline is met.', None),
    'Q.IV.1:1': ('No significant impact on delivery, quality, safety, efficacy or usability.', None),
    'Q.IV.1:2': ('Compatibility studies are finished.', None),
    'Q.IV.1:3': ('No substantial amendment of the product information is needed.', None),
    'Q.IV.1:5': ('There is no impact on the risk management plan.', None),
    'E.1:1': ('EMA has finished its check of the new name, with a positive result.', None),
    'E.2:1': ('The substance, excipient, device part or component itself is unchanged.', None),
    'E.4:2': ('The physical location of the site and all manufacturing operations stay the same.', None),
    'E.5:1': ('At least one authorised site with the same function remains (with a release site able to certify in the EU/EEA, where relevant).', None),
    'E.5:2': ('The deletion is not due to critical manufacturing deficiencies.', None),
}

DRAFT_NOTE = 'Assumption: the draft gives definitions but no examples, so the level is inferred from the FDA guidance, which uses the same three tests. Final rules or guidance may differ.'
LEVEL_TEXT = {
    'L1': 'Level I (major): prior approval.',
    'L2': 'Level II (moderate): prior approval.',
    'L3': 'Level III (minor): implement, then report in the annual submission in the first quarter.',
    'REC': 'Level IV: no submission, record under GMP.',
}
CASE_BY_CASE = O('CDSCO', 'cdsco', 'Case by case', 'India has no codified classification of post-approval quality changes for chemical drugs in force in 2026; CDSCO decides case by case on a post-approval change application through SUGAM.',
                 note='Switch on the draft rules (G.S.R. 97(E)) to see the levels they propose.')
DRAFT_QUALITY_ONLY = O('CDSCO', 'cdsco', 'Case by case', 'The draft covers quality changes only; labelling and administrative changes stay case by case.',
                       note='Switch on the draft rules (G.S.R. 97(E)) to see the levels they propose.')
NOT_MODELLED = O('CDSCO', 'pac24', 'Not modelled', 'The biologics guidance covers this area in tables the app does not model yet; ask CDSCO or read PAC/2024 for the level.', note='Coverage gap in this edition.')
NEWCLAIM = O('NEWDRUG', 'ndct', 'Rule 2(w)(ii)', 'A new claim (indication, dosage, dosage form or route) makes the product a new drug again, so it needs a new permission (Form CT-18 to import, CT-21 to manufacture).', pi=True)


def us_entries(old):
    g = 'g04'
    E = {}
    E['ds-cep'] = Q('dsSameRoute',
                    Q('siteCgmp',
                      O('CBE30', g, 'VI.C.1.a', 'An alternative source using the same synthesis, at a site with satisfactory CGMP status, is handled like a move of drug substance manufacture to another site: a CBE-30.',
                        note='FDA reviews the drug master file with the supplement. Where the DMF has not been reviewed before, many holders file a prior approval supplement.'),
                      O('PAS', g, 'VI.B.2', 'The new source does not have a satisfactory CGMP inspection for this operation.')),
                    O('PAS', g, 'VII.B.4', 'A source with a different synthesis or new impurities is a change in the synthesis of the drug substance that may affect its impurity profile or properties: prior approval.'))
    E['batch-release-site'] = copy.deepcopy(old['testing-site']['tree'])
    E['batch-release-site'] = remap(E['batch-release-site'], lambda o: {**o, 'note': 'The US has no separate batch release site (there is no qualified person). FDA treats a laboratory doing release testing as a testing site.'})
    E['site-delete'] = O('AR', g, 'VI.D', 'Removing a site from the application, with an approved site doing the same work, has minimal potential to affect quality and is reported in the annual report.',
                         note='Not named in the 2004 guidance; this follows FDA practice for minor site changes.')
    E['ds-scale'] = Q('scaleOnly',
                      O('AR', g, 'VII.D.1', 'A change in scale with equipment of the same design and operating principle, and no other process change, is a minor change.'),
                      O('CBE30', g, 'VII.C.1.b', 'A scale change that also changes the drug substance process is a moderate change.', note='Simplified: if the change may affect the impurity profile or physical properties, it is major (VII.B.4).'))
    E['ipc-tighten'] = Q('bio',
                         O('CBE30', 'gbio21', 'Appendix, specifications', 'For a biologic, tightening a limit because the process improved is a CBE-30.', note='The app applies the specification entry to in-process limits by analogy.'),
                         O('AR', g, 'VIII.D.3', 'Tightening an acceptance criterion, including an in-process one, is a minor change.'))
    E['ipc-relax'] = Q('bio',
                       O('PAS', 'gbio21', 'Appendix, specifications', 'Widening limits or deleting a test for a biologic needs prior approval.', note='The app applies the specification entry to in-process controls by analogy.'),
                       O('PAS', g, 'VIII.B.1 and B.2', 'Relaxing an acceptance criterion or deleting any part of a specification (in-process controls included) is a major change.'))
    E['hold-time'] = Q('bio',
                       Q('holdData',
                         O('CBE30', 'gbio21', 'Appendix, manufacturing process', 'For a biologic, a longer hold time supported by validated data is a CBE-30.', note='Simplified: the app reads the hold-time cases in the 2021 guidance as moderate when data cover the full time.'),
                         O('PAS', 'gbio21', 'Appendix, manufacturing process', 'A longer hold time without data covering it may affect product quality: prior approval.')),
                       Q('sterile',
                         Q('bulkHold50',
                           O('CBE30', g, 'VII.C.1.d', 'Bulk solution storage time rises by more than 50% beyond validated limits.'),
                           O('AR', g, 'VII.D.6', 'Bulk solution storage time rises by no more than 50%.')),
                         O('AR', g, 'VII.D', 'A longer hold time for a non-sterile intermediate, supported by data, has minimal potential to affect quality.', note='Not named in the 2004 guidance for non-sterile products; supported under CGMP and reported in the annual report.')))
    E['design-space-within'] = O('NONE', 'q8', 'Glossary, design space', 'Working within the approved design space is not considered a change, so nothing is reported.')
    E['design-space-new'] = O('PAS', 'q8', 'Glossary, design space', 'A design space is proposed by the applicant and approved by FDA. A new or expanded design space for an approved product is submitted in a prior approval supplement.')
    E['rtrt'] = O('PAS', g, 'VIII.B.2 and B.3', 'Real-time release testing deletes end-product tests and establishes new regulatory procedures (models, PAT): prior approval.')
    E['continuous-mfg'] = O('PAS', 'q13', 'Section 6 (regulatory considerations)', 'Converting a batch process to continuous manufacturing changes the process, equipment and control strategy: prior approval.',
                            note='FDA encourages early meetings before converting; a comparability protocol can lower the category of later changes.')
    E['excipient-supplier'] = O('NONE', 'cfr211', '211.84', 'Applications do not usually name excipient suppliers. A new supplier of the same grade that meets the approved specification is qualified under CGMP, with no report.',
                                note='If the application names the supplier, or the excipient controls release or is novel, classify it as a composition or process change.')
    ex = old['excipient-change']['tree']['on']['no']
    E['coating-weight'] = Q('mr', O('PAS', g, 'VII.B.1', 'For a modified-release product the coating may control release, so a coating weight change is major.'), copy.deepcopy(ex))
    E['score-line'] = O('PAS', 'gscore', 'Section IV', 'Adding or removing a score line changes how the product can be used and is described in labeling: prior approval.',
                        note='Simplified: the app treats both directions as prior approval. Generic scoring must match the reference listed drug.')
    E['tablet-shape'] = Q('mr', O('PAS', g, 'VII.B.1', 'A shape change for a modified-release product may affect release.'),
                          O('CBE30', g, 'VII.C.1', 'A change in tablet shape or size with the same composition and mass is treated as a moderate change; dissolution and labeling (the description) change.',
                            note='Simplified: FDA practice varies; the app uses CBE-30 because the product description in labeling changes.'))
    E['tse-excipient'] = O('AR', 'g14', 'Appendix A, components and composition', 'Moving an inactive ingredient from an animal source to a vegetable or synthetic source with the same specification has minimal potential to affect quality.',
                           note='Simplified: the app reads this from the 2014 annual report guidance examples for component sources.')
    E['dosage-form-new'] = Q('bio', O('PAS', 'cfr601', '601.12(b)', 'For a licensed biologic, a new dosage form is a prior approval supplement.', pi=True),
                             O('NEW', 'fdca505', '505(b)', 'A new dosage form is a new drug product: it needs a new application (an NDA, or an ANDA for a generic), not a supplement.', pi=True))
    E['nitrosamine-control'] = O('CBE0', g, 'VIII.C.2.a', 'Adding a test and acceptance criterion that gives greater assurance is a CBE supplement.',
                                 note='FDA guidance on control of nitrosamine impurities (Revision 2, 2024) asks for nitrosamine changes to be reported in the appropriate supplement; check it for limits.')
    E['excipient-spec'] = C('excipientSpecKind',
                            tighten=O('AR', g, 'VIII.D.3', 'Tightening an acceptance criterion is a minor change.'),
                            add=O('CBE0', g, 'VIII.C.2.a', 'Adding a test that gives greater assurance is a CBE supplement.'),
                            delete=O('PAS', g, 'VIII.B.2', 'Deleting any part of a specification is a major change.'),
                            relax=O('PAS', g, 'VIII.B.1', 'Relaxing an acceptance criterion is a major change.'))
    E['skip-testing'] = O('PAS', g, 'VIII.B.2', 'Testing only some batches removes the test from routine release, which FDA treats like deleting part of a specification: prior approval.',
                          note='Simplified. A comparability protocol can set a lower category.')
    E['method-minor'] = Q('bio',
                          O('AR', 'gbio21', 'Appendix, analytical procedures', 'Minor modifications to a procedure are annual report changes.'),
                          O('AR', 'g14', 'Appendix A, specifications', 'An adjustment within the limits the method allows (for example the system suitability ranges of USP <621>) gives the same assurance and is reported in the annual report.',
                            note='Simplified: changes outside allowed adjustments are CBE-30 (VIII.C.1.a).'))
    E['micro-rapid'] = Q('sameOrBetter',
                         Q('sterile',
                           O('PAS', g, 'VIII.B.4', 'FDA expects prior approval for an alternative sterility test, unless an approved comparability protocol covers it.'),
                           O('CBE30', g, 'VIII.C.1.a', 'Replacing a microbiological procedure with a validated method that gives the same or greater assurance is a CBE-30.')),
                         O('PAS', g, 'VIII.B.4', 'The new procedure does not give the same or greater assurance.'))
    E['cc-supplier'] = Q('sterile',
                         O('CBE30', g, 'IX.C.1', 'For a sterile product a new component supplier may affect sterility assurance and container integrity: a moderate change.', note='Simplified.'),
                         O('AR', 'g14', 'Appendix A, container closure', 'A new supplier of the same container closure component, same material and specification, is reported in the annual report.'))
    E['cc-device'] = Q('deviceSignificant',
                       O('PAS', g, 'IX.B.3', 'A change to packaging or a device that controls the dose delivered is a major change.'),
                       O('CBE30', g, 'IX.C.1', 'A change to a co-packaged measuring device that does not control the dose is treated as a moderate change.', note='Simplified: device constituents can also bring combination product requirements.'))
    E['cc-noncontact'] = O('AR', g, 'IX.D', 'A change to a component that does not touch the product and has no protective role has minimal potential to affect quality.', note='Compare the cap colour entry (IX.D.8).')
    st = old['shelf-life-extend']['tree']
    E['ds-retest'] = remap(copy.deepcopy(st), lambda o: {**o, 'note': 'The app applies the drug product expiration dating entries to the drug substance re-test period by analogy.'})
    E['in-use-shelf-life'] = C('inUseKind',
                               reduce=O('CBE0', 'cfr314', '314.70(c)(6)(iii)(C)', 'A shorter in-use period strengthens an instruction for safe use: a CBE supplement.', pi=True),
                               extendReal=O('PAS', g, 'X.B.7', 'A longer in-use period changes the labeled storage conditions: prior approval.', pi=True),
                               extendModel=O('PAS', g, 'X.B.7', 'A longer in-use period changes the labeled storage conditions: prior approval.', pi=True))
    E['ds-storage'] = Q('restrictive',
                        O('CBE30', g, 'XI.B.1', 'More restrictive storage is treated like a reduction in dating: a moderate change.', note='By analogy: the guidance has no drug substance storage entry.'),
                        O('PAS', g, 'X.B.7', 'Less restrictive storage conditions need data and assessment: prior approval.', note='By analogy with the drug product entry.'))
    E['lab-new-route'] = O('PAS', 'cfr314', '314.70(b)(2)(v)', 'A new route of administration is an efficacy supplement that needs prior approval.', pi=True,
                           note='If the new route needs a new dosage form, a new application may be needed instead.')
    E['lab-brand-name'] = O('PAS', g, 'X.B', 'A new proprietary name is reviewed by FDA before use: prior approval.', pi=True, note='FDA reviews proprietary names for safety and promotional concerns.')
    E['lab-rmp'] = C('rmpKind',
                     agreed=O('CBE0', 'grems', 'REMS revisions', 'A REMS revision (editorial changes, or updates already agreed with FDA) can be implemented when FDA receives it.'),
                     minor=O('CBE30', 'grems', 'REMS modifications', 'A minor REMS modification is submitted as a CBE-30.'),
                     new=O('PAS', 'grems', 'REMS modifications', 'A major REMS modification needs prior approval.'))
    E['lab-rmp'] = remap(E['lab-rmp'], lambda o: {**o, 'note': 'The US has REMS, not EU-style risk management plans; most products have no REMS.'})
    E['lab-psusa'] = O('CBE0', 'cfr314', '314.70(c)(6)(iii)(A)', 'Adding or strengthening safety wording is a CBE supplement.', pi=True,
                       note='The US has no PSUSA procedure. Wording that FDA itself requests follows section 505(o)(4) (see that entry).')
    E['lab-delete-indication'] = O('CBE0', 'cfr314', '314.70(c)(6)(iii)(D)', 'Deleting an indication that is not supported, or no longer pursued, from labeling is a CBE supplement.', pi=True,
                                   note='Simplified: deletions for other reasons may need prior approval; talk to the review division.')
    E['ec-define'] = O('PAS', 'gq12', 'Chapter 3', 'For an approved product, established conditions and their reporting categories are proposed in a prior approval supplement.')
    E['plcm-update'] = Q('plcmMajor',
                         O('PAS', 'gq12', 'Chapter 5 (PLCM)', 'Changing established conditions or lowering a reporting category needs prior approval.'),
                         O('AR', 'gq12', 'Chapter 5 (PLCM)', 'An administrative update of the PLCM (for example recording a completed commitment) goes with the next annual report.', note='Simplified.'))
    E['non-ec-change'] = Q('isEC',
                           C('plcmCategory',
                             prior=O('PAS', 'gq12', 'Chapter 3', 'The PLCM sets prior approval for this established condition.'),
                             moderate=O('CBE30', 'gq12', 'Chapter 3', 'The PLCM sets a moderate notification (CBE-30) for this established condition.'),
                             low=O('AR', 'gq12', 'Chapter 3', 'The PLCM sets a low notification (annual report) for this established condition.')),
                           O('NONE', 'gq12', 'Chapter 3', 'Changes to elements that are not established conditions are managed in the quality system and need no report.'))
    E['pacmp-change'] = C('pacmpAction',
                          delete=O('AR', 'gcp22', 'VII', 'Withdrawing an approved comparability protocol is reported in the annual report.', note='Simplified.'),
                          minor=O('CBE30', 'gcp22', 'VII', 'A minor modification of an approved protocol, not changing its strategy, is treated as a moderate change.', note='Simplified.'),
                          major=O('PAS', 'gcp22', 'VII', 'A major modification of an approved protocol needs prior approval.'))
    E['bio-scale'] = Q('bioScaleOnly',
                       O('CBE30', 'gbio21', 'Appendix, scale', 'Adding identical bioreactors or duplicating a train, with no process change, is a CBE-30.'),
                       O('PAS', 'gbio21', 'Appendix, scale', 'Scaling up with different equipment or changed parameters needs prior approval.'))
    E['bio-media'] = Q('animalOrigin',
                       O('PAS', 'gbio21', 'Appendix, raw materials', 'Introducing a material of human or animal origin raises adventitious agent risk: prior approval.'),
                       Q('majorImpact',
                         O('PAS', 'gbio21', 'Appendix, raw materials', 'A raw material change that may affect product quality needs prior approval.'),
                         O('CBE30', 'gbio21', 'Appendix, raw materials', 'A raw material change with low potential to affect quality is a CBE-30.', note='Simplified.')))
    E['bio-resin'] = C('resinChange',
                       lifetime=O('AR', 'gbio21', 'Appendix, purification', 'More resin cycles under an approved lifetime protocol is an annual report change.'),
                       supplier=O('PAS', 'gbio21', 'Appendix, purification', 'A different resin or supplier changes the purification step: prior approval.'))
    E['bio-potency'] = Q('potencyNewPrinciple',
                         O('PAS', 'gbio21', 'Appendix, analytical procedures', 'A potency assay on a new principle needs prior approval.'),
                         Q('bioMethodMajor',
                           O('PAS', 'gbio21', 'Appendix, analytical procedures', 'Changing the technique, acceptance criteria or performance of the potency assay needs prior approval.'),
                           O('AR', 'gbio21', 'Appendix, analytical procedures', 'Minor modifications to the assay are annual report changes.')))
    E['bio-formulation'] = O('PAS', 'gbio21', 'Appendix, formulation', 'A formulation change for a biologic needs prior approval.')
    E['bio-adventitious'] = C('adventRisk',
                              first=O('PAS', 'gbio21', 'Appendix, viral safety', 'New viral clearance claims for steps not tested before need prior approval.'),
                              higher=O('PAS', 'gbio21', 'Appendix, viral safety', 'Replacement studies showing a higher risk need prior approval.'),
                              same=O('CBE30', 'gbio21', 'Appendix, viral safety', 'Replacement studies with the same or lower risk are treated as a moderate change.', note='Simplified.'))
    E['admin-manufacturer-name'] = O('AR', 'g14', 'Appendix A, manufacturing sites', 'A change in the name or address of a site, with no move and no change to operations, is reported in the annual report.', note='FDA also needs the establishment registration updated.')
    E['admin-local-rep'] = O('LETTER', 'cfr31450', '314.50(a)(5)', 'A foreign applicant tells FDA of a new US agent by letter.', note='Pharmacovigilance contacts are not reported as a change to the application.')
    E['admin-inn'] = O('CBE0', 'cfr314', '314.70(c)(6)(iii)', 'Updating labeling for a new established name is filed as a CBE supplement.', pi=True, note='Simplified: such changes usually follow FDA or USP direction.')
    E['admin-delete-presentation'] = C('presentationKind',
                                       strength=O('LETTER', 'cfr314150', '314.150(c)', 'To stop marketing a strength for good, ask FDA by letter to withdraw approval of it.', note='A temporary stop is reported under section 506C or in the annual report instead.'),
                                       pack=O('AR', g, 'IX.D', 'Deleting a container size, with the remaining sizes covering the dosing, is a minor change.'))
    return {k: {'tree': v} for k, v in E.items()}


def eu_entries(old):
    gl = 'gl25'
    z = lambda code, why: O('IB', gl, code, why + ' A change that is not Type IA or Type II is a Type IB by default (Article 3 of Regulation (EC) No 1234/2008).')
    E = {}
    ds_old = old['ds-site-move']['tree']['on']['no']
    E['ds-cep'] = Q('cepCovers',
                    A(['Q.III.1:1', 'Q.III.1:2', 'Q.III.1:3', 'Q.III.1:4', 'Q.III.1:5', 'Q.III.1:6', 'Q.III.1:9'],
                      O('IAIN', gl, 'Q.III.1(a)1', 'A new CEP for the active substance, with every condition met, is Type IA-IN.'),
                      z('Q.III.z', 'A condition for Type IA-IN is not met.')),
                    copy.deepcopy(ds_old))
    E['batch-release-site'] = C('releaseTesting',
                                none=A(['Q.II.b.2:1', 'Q.II.b.2:2', 'Q.II.b.2:5'], O('IAIN', gl, 'Q.II.b.2(c)1', 'A new batch release site without batch control is Type IA-IN.'), z('Q.II.b.z', 'A condition for Type IA-IN is not met.')),
                                chem=A(['Q.II.b.2:1', 'Q.II.b.2:2', 'Q.II.b.2:3', 'Q.II.b.2:4', 'Q.II.b.2:5'], O('IAIN', gl, 'Q.II.b.2(c)2', 'A new release site that also does physicochemical or microbiological testing is Type IA-IN.'), z('Q.II.b.z', 'A condition for Type IA-IN is not met.')),
                                bio=O('IB', gl, 'Q.II.b.2(c)3', 'A new release site that also does biological testing is Type IB.'))
    E['site-delete'] = A(['E.5:1', 'E.5:2'], O('IA', gl, 'E.5', 'Deleting a site, with another site keeping the same function, is Type IA.'), z('E.z', 'A condition for Type IA is not met.'))
    E['ds-scale'] = A(['Q.I.a.3:1', 'Q.I.a.3:2', 'Q.I.a.3:3', 'Q.I.a.3:4', 'Q.I.a.3:5', 'Q.I.a.3:6', 'Q.I.a.3:7', 'Q.I.a.3:8'],
                      O('IA', gl, 'Q.I.a.3(a) or (b)', 'A scale change for the active substance that meets the conditions is Type IA.'), z('Q.I.a.z', 'A condition for Type IA is not met.'))
    E['ipc-tighten'] = A(['Q.II.b.5:1', 'Q.II.b.5:2', 'Q.II.b.5:3', 'Q.II.b.5:4'],
                         O('IA', gl, 'Q.II.b.5(a)', 'A minor change within the approved in-process limits is Type IA.'), z('Q.II.b.z', 'A condition for Type IA is not met.'))
    E['ipc-relax'] = Q('ipcCritical',
                       O('II', gl, 'Q.II.b.5(d) or (e)', 'Widening in-process limits, or deleting a control, with a possible significant effect on quality is Type II.'),
                       z('Q.II.b.z', 'Widening a non-critical in-process limit is not listed. (Deleting a non-significant or obsolete in-process test can be Type IA under Q.II.b.5(c).)'))
    E['hold-time'] = O('IB', gl, 'Q.II.b.3(e)', 'A change in the holding time or storage conditions of an intermediate or bulk product is Type IB.')
    E['design-space-within'] = O('NONE', 'q8', 'Glossary, design space', 'Working within the approved design space is not considered a change, so no variation is needed.')
    E['design-space-new'] = C('dsScope',
                              unitop=O('II', gl, 'Q.II.g.1(a)', 'A new design space for a unit operation is Type II.'),
                              method=O('IB', gl, 'Q.II.g.1(b)', 'A new design space for an analytical procedure, excipient or intermediate is Type IB.'),
                              extend=O('IB', gl, 'Q.II.g.1(c)', 'A change to, or extension of, an approved design space is Type IB.'))
    E['rtrt'] = O('II', gl, 'Q.II.d.3', 'Introducing real-time release testing is Type II.')
    E['continuous-mfg'] = O('II', gl, 'Q.II.b.3(b)', 'A switch to continuous manufacturing is a major change to the process that may significantly affect quality: Type II.')
    E['excipient-supplier'] = O('NONE', 'emaqa', 'Q&A', 'Excipient suppliers are not usually part of the authorisation; a new supplier of the same grade that meets the approved specification is qualified under GMP with no variation.',
                                note='A change of source for a TSE-risk excipient is a variation (Q.II.c.3), and so is any specification change.')
    E['coating-weight'] = Q('mr', O('II', gl, 'Q.II.a.4(c)', 'For a modified-release form where the coating is critical to release, a coating or shell weight change is Type II.', note='For gastro-resistant forms it is Type IB (Q.II.a.4(b)).'),
                            A(['Q.II.a.4:1', 'Q.II.a.4:2', 'Q.II.a.4:3', 'Q.II.a.4:4'], O('IA', gl, 'Q.II.a.4(a)', 'A coating or shell weight change for a solid oral form that meets the conditions is Type IA.'), z('Q.II.a.z', 'A condition for Type IA is not met.')))
    E['score-line'] = Q('scoredEqualDose',
                        O('IB', gl, 'Q.II.a.1(b)', 'A change in a score line meant to divide the tablet into equal doses is Type IB.', pi=True),
                        A(['Q.II.a.1:1', 'Q.II.a.1:2', 'Q.II.a.1:4'], O('IAIN', gl, 'Q.II.a.1(a)', 'A score line that is only a marking (not for equal doses) is treated as a change in markings: Type IA-IN.', pi=True), z('Q.II.a.z', 'A condition for Type IA-IN is not met.')))
    E['tablet-shape'] = Q('mr', O('IB', gl, 'Q.II.a.2(b)', 'A shape change for a gastro-resistant or modified-release form is Type IB.', pi=True),
                          A(['Q.II.a.2:1', 'Q.II.a.2:2', 'Q.II.a.2:3', 'Q.II.a.2:4'], O('IAIN', gl, 'Q.II.a.2(a)', 'A shape or size change for an immediate-release form that meets the conditions is Type IA-IN.', pi=True), z('Q.II.a.z', 'A condition for Type IA-IN is not met.')))
    E['tse-excipient'] = A(['Q.II.c.3:1'], O('IA', gl, 'Q.II.c.3(a)', 'Moving from a TSE-risk material to a vegetable or synthetic one is Type IA.'), z('Q.II.c.z', 'A condition for Type IA is not met.'))
    E['dosage-form-new'] = O('EXT', 'reg', 'Annex I, point 2(d)', 'A new pharmaceutical form is an extension of the marketing authorisation, not a variation.', pi=True)
    E['nitrosamine-control'] = z('Q.II.d.z', 'A test for a nitrosamine is a test for a mutagenic impurity, so condition 6 of Q.II.d.1(c) is not met.')
    E['excipient-spec'] = C('excipientSpecKind',
                            tighten=A(['Q.II.c.1:1', 'Q.II.c.1:2', 'Q.II.c.1:4'], O('IA', gl, 'Q.II.c.1(a)', 'A change within the approved acceptance criteria is Type IA.'), z('Q.II.c.z', 'A condition for Type IA is not met.')),
                            add=A(['Q.II.c.1:1', 'Q.II.c.1:2', 'Q.II.c.1:5', 'Q.II.c.1:6'], O('IA', gl, 'Q.II.c.1(b)', 'Adding an attribute with its procedure is Type IA.'), z('Q.II.c.z', 'A condition for Type IA is not met.')),
                            delete=A(['Q.II.c.1:1', 'Q.II.c.1:2', 'Q.II.c.1:3', 'Q.II.c.1:7'], O('IA', gl, 'Q.II.c.1(c)', 'Deleting a non-significant or obsolete attribute is Type IA.'), z('Q.II.c.z', 'A condition for Type IA is not met.')),
                            relax=O('II', gl, 'Q.II.c.1(d) or (e)', 'A change outside the approved criteria, or deleting a significant attribute, is Type II.'))
    E['skip-testing'] = O('IB', gl, 'Q.II.d.1(i)', 'Moving a test between routine and skip or periodic testing is Type IB, justified by historical data showing the process is under control.')
    E['method-minor'] = Q('bioProcedure', O('IB', gl, 'Q.II.d.2(d)', 'For a biological procedure, other changes are Type IB.'),
                          A(['Q.II.d.2:1', 'Q.II.d.2:2', 'Q.II.d.2:3'], O('IA', gl, 'Q.II.d.2(a)', 'A minor change to an approved procedure that meets the conditions is Type IA.'), O('IB', gl, 'Q.II.d.2(d)', 'A condition for Type IA is not met, so it is an other change: Type IB.')))
    E['micro-rapid'] = O('IB', gl, 'Q.II.d.2(d)', 'Replacing a compendial microbiological procedure with an alternative validated method is an other change to an analytical procedure: Type IB.',
                         note='For a sterility test the authority may ask for more and upgrade the change.')
    E['cc-supplier'] = A(['Q.II.e.7:1', 'Q.II.e.7:2', 'Q.II.e.7:3', 'Q.II.e.7:4'], O('IA', gl, 'Q.II.e.7(a)', 'A new manufacturer or supplier of a packaging component that meets the conditions is Type IA.'),
                         O('IB', gl, 'Q.II.e.7(b) or Q.II.e.z', 'A condition for Type IA is not met (for example a new sterilisation site or process, which is Type IB).'))
    E['cc-device'] = Q('deviceSignificant', O('II', gl, 'Q.IV.1(b)', 'A device change that may significantly affect delivery, quality, safety or efficacy is Type II.', pi=True),
                       A(['Q.IV.1:1', 'Q.IV.1:2', 'Q.IV.1:3', 'Q.IV.1:5'], O('IAIN', gl, 'Q.IV.1(a)', 'Adding or replacing a co-packaged device with the conditions met is Type IA-IN.', pi=True), z('Q.IV.z', 'A condition for Type IA-IN is not met.')))
    E['cc-noncontact'] = Q('piAffected',
                           A(['Q.II.e.3:1'], O('IAIN', gl, 'Q.II.e.3(a)', 'A non-contact packaging change that affects the product information is Type IA-IN.', pi=True), z('Q.II.e.z', 'A condition for Type IA-IN is not met.')),
                           A(['Q.II.e.3:1'], O('IA', gl, 'Q.II.e.3(b)', 'A non-contact packaging change that does not affect the product information is Type IA.'), z('Q.II.e.z', 'A condition for Type IA is not met.')))
    E['ds-retest'] = Q('realTimeData',
                       A(['Q.I.d.1:2'], O('IA', gl, 'Q.I.d.1(a)5', 'An extension with real-time data fully in line with the approved protocol is Type IA.'), O('IB', gl, 'Q.I.d.1(a)4', 'Real-time data not fully in line with the approved protocol: Type IB.')),
                       Q('extrapolationPerGuideline', O('IB', gl, 'Q.I.d.1(a)4', 'An extension by extrapolation in line with the stability guidelines is Type IB.'),
                         O('II', gl, 'Q.I.d.1(a)3', 'An extension by extrapolation or modelling not in line with the guidelines is Type II.')))
    E['in-use-shelf-life'] = C('inUseKind',
                               reduce=A(['Q.II.f.1:1', 'Q.II.f.1:6'], O('IAIN', gl, 'Q.II.f.1(a)2 or 3', 'A shorter in-use period is Type IA-IN.', pi=True), z('Q.II.f.z', 'A condition for Type IA-IN is not met.')),
                               extendReal=O('IB', gl, 'Q.II.f.1(b)2 or 3', 'A longer in-use period based on real-time data is Type IB.', pi=True),
                               extendModel=Q('extrapolationPerGuideline', O('IB', gl, 'Q.II.f.1(b)5', 'Extrapolation in line with the stability guidelines is Type IB.', pi=True),
                                             O('II', gl, 'Q.II.f.1(b)4', 'Extrapolation or modelling not in line with the guidelines is Type II.', pi=True)))
    E['ds-storage'] = Q('restrictive',
                        A(['Q.I.d.1:1', 'Q.I.d.1:3'], O('IA', gl, 'Q.I.d.1(b)1', 'More restrictive storage conditions for the active substance are Type IA.'), O('IB', gl, 'Q.I.d.1(b)2', 'A condition for Type IA is not met: Type IB.')),
                        O('IB', gl, 'Q.I.d.1(b)2', 'A change in the storage conditions of the active substance is Type IB.'))
    E['lab-new-route'] = O('EXT', 'reg', 'Annex I, point 2(e)', 'A new route of administration is an extension of the marketing authorisation.', pi=True)
    E['lab-brand-name'] = Q('centralised',
                            A(['E.1:1'], O('IAIN', gl, 'E.1(a)', 'For a centrally authorised product, a new invented name that EMA has checked is Type IA-IN.', pi=True), z('E.z', 'EMA has not finished a positive check of the name.')),
                            O('IB', gl, 'E.1(b)', 'For a nationally authorised product, a new invented name is Type IB.', pi=True))
    E['lab-rmp'] = C('rmpKind',
                     agreed=O('IAIN', gl, 'C.9(a)', 'Implementing an RMP change already assessed, with the exact agreed wording, is Type IA-IN.'),
                     minor=O('IB', gl, 'C.9(b)', 'An RMP change needing minor assessment (for example due dates or a template update) is Type IB.'),
                     new=O('II', gl, 'C.9(c)', 'An RMP change needing new data and significant assessment is Type II.'))
    E['lab-psusa'] = copy.deepcopy(old['lab-505o4']['tree'])
    E['lab-delete-indication'] = O('IB', gl, 'C.6(b)', 'Deleting an indication is Type IB.', pi=True)
    E['ec-define'] = O('II', gl, 'Q.II.g.6', 'In the EU, established conditions are agreed through a product lifecycle management (PLCM) document. Introducing one is Type II (Q.I.e.6 for the active substance).')
    E['plcm-update'] = Q('plcmMajor', O('II', gl, 'Q.II.g.8(a)', 'A major change to an approved PLCM document is Type II.'), O('IB', gl, 'Q.II.g.8(b)', 'A minor change to an approved PLCM document is Type IB.'))
    E['non-ec-change'] = Q('isEC',
                           C('plcmCategory',
                             prior=O('II', gl, 'Q.II.g.7(a)', 'The PLCM sets prior approval: Type II.'),
                             moderate=O('IB', gl, 'Q.II.g.7(d)', 'The PLCM sets a moderate notification: Type IB.'),
                             low=O('IA', gl, 'Q.II.g.7(b)', 'The PLCM sets a low notification: Type IA (or IA-IN where the PLCM says so, Q.II.g.7(c)).')),
                           O('NONE', 'q12', 'Chapter 3', 'Changes to elements that are not established conditions are managed in the quality system with no variation.'))
    E['pacmp-change'] = C('pacmpAction',
                          delete=A(['Q.II.g.3:1'], O('IA', gl, 'Q.II.g.3', 'Deleting an approved PACMP is Type IA.'), z('Q.II.g.z', 'A condition for Type IA is not met.')),
                          minor=O('IB', gl, 'Q.II.g.4(b)', 'A minor change that does not alter the strategy of the PACMP is Type IB.'),
                          major=O('II', gl, 'Q.II.g.4(a)', 'A major change to an approved PACMP is Type II.'))
    E['bio-scale'] = Q('bioScaleOnly', O('IB', gl, 'Q.I.a.3(d)', 'A scale change for a biological active substance without process change (for example duplicating a line) is Type IB.'),
                       O('II', gl, 'Q.I.a.3(c)', 'A batch size change for a biological active substance that needs a comparability assessment is Type II.'))
    E['bio-media'] = Q('animalOrigin', O('II', gl, 'Q.I.a.2(b)', 'Introducing a material of human or animal origin that needs a viral safety or TSE assessment is a major change: Type II.'),
                       Q('majorImpact', O('II', gl, 'Q.I.a.2(b)', 'A raw material change that may significantly affect quality is Type II.'), z('Q.I.a.z', 'A raw material change with no significant impact is not listed.')))
    pur = old['bio-purification']['tree']['on']['yes']
    E['bio-resin'] = C('resinChange', lifetime=copy.deepcopy(pur), supplier=O('II', gl, 'Q.I.a.2(b)', 'A different resin or supplier changes a purification step of a biological active substance: Type II.'))
    E['bio-potency'] = Q('potencyNewPrinciple', O('II', gl, 'Q.II.d.2(c)', 'Replacing a biological procedure such as a potency assay is Type II (Q.I.b.2 for the active substance).'),
                         Q('majorImpact', O('II', gl, 'Q.II.d.2(c)', 'A substantial change to a biological procedure is Type II.'), O('IB', gl, 'Q.II.d.2(d)', 'Other changes to the procedure are Type IB.')))
    E['bio-formulation'] = O('II', gl, 'Q.II.a.3(b)2', 'A formulation change for a biological product may significantly affect quality, safety or efficacy: Type II.')
    E['bio-adventitious'] = C('adventRisk',
                              first=O('II', gl, 'Q.II.h.1(a)', 'Studies on steps tested for the first time are Type II.'),
                              higher=O('II', gl, 'Q.II.h.1(b)1', 'Replacing studies with a higher-risk assessment is Type II.'),
                              same=O('IB', gl, 'Q.II.h.1(b)2 or 3', 'Replacing obsolete studies with the same or lower risk is Type IB.'))
    E['admin-manufacturer-name'] = Q('isReleaseSite',
                                     A(['E.4:2'], O('IAIN', gl, 'E.4(b)', 'A new name or address for the batch release manufacturer is Type IA-IN.', pi=True), z('E.z', 'A condition is not met.')),
                                     A(['E.4:2'], O('IA', gl, 'E.4(c)', 'A new name or address for another site is Type IA.'), z('E.z', 'A condition is not met.')))
    E['admin-local-rep'] = O('OTHER', 'dir', 'Article 61(3) of Directive 2001/83/EC', 'A new local representative changes the package leaflet only, which is notified under Article 61(3), not as a variation.', pi=True,
                             note='A new QPPV or pharmacovigilance contact is updated in the Article 57 database, with no variation.')
    E['admin-inn'] = A(['E.2:1'], O('IAIN', gl, 'E.2', 'A new name for the active substance, with the substance unchanged, is Type IA-IN.', pi=True), z('E.z', 'A condition is not met.'))
    E['admin-delete-presentation'] = C('presentationKind',
                                       strength=O('IB', gl, 'C.7(b)', 'Deleting a strength is Type IB.', pi=True),
                                       pack=O('IA', gl, 'Q.II.e.6(b)', 'Deleting a pack size, with the remaining sizes fitting the dosing, is Type IA.', pi=True, note='Check the sub-item letter in the guidelines.'))
    return {k: {'tree': v} for k, v in E.items()}


# India in force: biologics from PAC/2024 where the app models it; chemical drugs case by case.
def in_bio(cid):
    p = 'pac24'
    m = {
        'batch-release-site': O('L3', p, '3.2.P.3.1 (facilities)', 'A new testing or release facility with approved methods is an annual notification (Level III).', note='Simplified.'),
        'site-delete': O('L3', p, 'Facilities', 'Deleting a facility is an annual notification (Level III).'),
        'ipc-tighten': O('L3', p, '3.2.S.2.4 (controls)', 'Tightening an in-process limit within the approved range is an annual notification (Level III).'),
        'ipc-relax': O('L2', p, '3.2.S.2.4 (controls)', 'Widening an in-process limit or deleting a test is a notifiable change (Level II).'),
        'hold-time': O('L2', p, '3.2.S.2.2 (process)', 'A longer hold time is a notifiable change (Level II).', note='Simplified.'),
        'design-space-within': O('REC', p, 'Lifecycle tools', 'Working within an approved design space is not a change.', note='By analogy with ICH Q8; PAC/2024 does not name it.'),
        'excipient-supplier': O('REC', p, '3.2.P.4 (excipients)', 'A new supplier of the same excipient grade meeting the specification is a record of change (Level IV).', note='Simplified.'),
        'excipient-spec': O('L3', p, '3.2.P.4 (excipients)', 'An excipient specification change is an annual notification (Level III) when the guidance conditions are met.', note='Widening a limit is Level II.'),
        'method-minor': O('L3', p, '3.2.S.4.2 (procedures)', 'A minor change to an approved procedure is an annual notification (Level III).'),
        'cc-supplier': O('L3', p, '3.2.P.7 (container closure)', 'A new supplier of the same component is an annual notification (Level III).'),
        'cc-noncontact': O('L3', p, '3.2.P.7 (container closure)', 'A change to a non-contact component is an annual notification (Level III).'),
        'ds-retest': O('L3SL', p, 'General notes (shelf life)', 'A re-test or shelf-life extension is a minor change but needs approval before it is used.'),
        'in-use-shelf-life': O('L3SL', p, 'General notes (shelf life)', 'A shelf-life change needs a post-approval change application and approval before use.', pi=True),
        'ds-storage': O('L2', p, '3.2.S.7 (stability)', 'A change in drug substance storage conditions is a notifiable change (Level II).'),
        'lab-new-route': O('L1', p, 'Safety and efficacy changes', 'A new route of administration is a supplement (Level I).', pi=True),
        'dosage-form-new': O('L1', p, 'Safety and efficacy changes', 'A new dosage form is a supplement (Level I) and may need a new permission.', pi=True),
        'lab-brand-name': O('ADMIN', p, 'Administrative changes', 'A change in the brand name needs CDSCO approval; review takes about 30 days.', pi=True),
        'lab-psusa': O('L2', p, 'Safety and efficacy changes', 'Adding or strengthening safety text is a notifiable change (Level II).', pi=True),
        'lab-delete-indication': O('L2', p, 'Safety and efficacy changes', 'Deleting an indication is a notifiable change (Level II).', pi=True, note='Simplified.'),
        'bio-scale': Q('bioScaleOnly', O('L2', p, '3.2.S.2.2 (scale)', 'A scale change with no process change is a notifiable change (Level II).'),
                       O('L1', p, '3.2.S.2.2 (scale)', 'A scale-up with process changes is a supplement (Level I).')),
        'bio-media': Q('animalOrigin', O('L1', p, '3.2.S.2.3 (materials)', 'Introducing a material of human or animal origin is a supplement (Level I).'),
                       O('L2', p, '3.2.S.2.3 (materials)', 'Other raw material changes are a notifiable change (Level II).')),
        'bio-resin': C('resinChange', lifetime=O('L3', p, '3.2.S.2.2 (purification)', 'More resin cycles under an approved protocol is an annual notification (Level III).'),
                       supplier=O('L1', p, '3.2.S.2.2 (purification)', 'A different resin changes the purification process: supplement (Level I).')),
        'bio-potency': Q('potencyNewPrinciple', O('L1', p, '3.2.S.4.2 (procedures)', 'A new potency assay principle is a supplement (Level I).'),
                         O('L2', p, '3.2.S.4.2 (procedures)', 'Other changes to the potency assay are a notifiable change (Level II).')),
        'bio-formulation': O('L1', p, '3.2.P.1 (composition)', 'A formulation change is a supplement (Level I).'),
        'bio-adventitious': C('adventRisk', first=O('L1', p, '3.2.A.2 (adventitious agents)', 'New viral clearance studies are a supplement (Level I).'),
                              higher=O('L1', p, '3.2.A.2 (adventitious agents)', 'A higher-risk assessment is a supplement (Level I).'),
                              same=O('L2', p, '3.2.A.2 (adventitious agents)', 'Replacement studies with the same or lower risk are a notifiable change (Level II).')),
        'admin-manufacturer-name': O('ADMIN', p, 'Administrative changes', 'A change in a manufacturer\'s name needs CDSCO approval; review takes about 30 days.'),
        'admin-local-rep': O('ADMIN', p, 'Administrative changes', 'A new authorised agent needs CDSCO approval and an amended licence.', note='Simplified.'),
        'admin-inn': O('ADMIN', p, 'Administrative changes', 'A change in the name of the substance needs CDSCO approval.', pi=True),
        'admin-delete-presentation': O('L3', p, 'Administrative changes', 'Deleting a strength or pack size is an annual notification (Level III).', note='Simplified.'),
    }
    return m.get(cid)


US_TO_IN = {'PAS': 'L1', 'CBE30': 'L2', 'CBE0': 'L2', 'AR': 'L3', 'NONE': 'REC'}


def in_draft_from_us(cid, kind, us_tree):
    def f(o):
        if o['cat'] == 'NEW':
            return dict(NEWCLAIM)
        if o['cat'] == 'LETTER' or kind in ('labeling', 'efficacy', 'admin'):
            return dict(NEWCLAIM) if kind == 'efficacy' else dict(DRAFT_QUALITY_ONLY)
        lv = US_TO_IN[o['cat']]
        if cid in ('ds-retest', 'in-use-shelf-life') and lv == 'L3':
            lv = 'L3SL'
        why = (LEVEL_TEXT.get(lv) or 'Level III, but shelf-life changes need approval first.') + f" The draft defines the levels by substantial, moderate and minimal potential to affect quality; the app reads the potential from the matching FDA entry ({o['at']})."
        return O(lv, 'gsr97', 'Rules 77(x) and 82(ix) (draft)', why, note=DRAFT_NOTE, pi=o.get('pi', False))
    return remap(copy.deepcopy(us_tree), f)


def run():
    cat = load('src', 'data', 'catalogue.json')
    kinds = {c['id']: (c['kind'], c['scope']) for c in cat['changes']}
    import p4_catalogue
    new_ids = [n[0] for n in p4_catalogue.NEW]

    # US
    usp = load(US, 'pack.json'); use = load(US, 'entries.json')
    usp['sources'].update(US_SOURCES)
    have = {c['id'] for c in usp['categories']}
    for c in US_NEW_CATS:
        if c['id'] not in have:
            usp['categories'].append(c)
    usp['categories'].sort(key=lambda c: (c['rank'], c['id'] != 'NONE'))
    for c in usp['categories']:
        c['tone'] = TONES['us'][c['id']]
    usp['filing'] = FILING['us']
    usp['ectd']['NONE'] = None
    usp['ectd']['NEW'] = {'submissionType': 'original-application', 'subType': 'application'}
    usp['clocks']['NEW'] = {'months': 10, 'monthsPriority': 6, 'label': 'PDUFA goal for a standard NDA (10 months; 6 if priority) or GDUFA goal for a standard ANDA (10 months)', 'src': 'pdufa7'}
    usp['m1']['new'] = [{'code': '1.1', 'label': 'Form FDA 356h for a new application'}, {'code': '1.2', 'label': 'Cover letter'}]
    us_new = us_entries(use)
    use.update(us_new)
    save(usp, US, 'pack.json'); save(use, US, 'entries.json')

    # EU 2026 (and tones for the 2013 edition)
    eup = load(EU, 'pack.json'); eue = load(EU, 'entries.json')
    eup['sources'].update(EU_SOURCES)
    for k, (text, auto) in EU_CONDITIONS.items():
        eup['conditions'][k] = {'text': text, **({'auto': auto} if auto else {})}
    for c in eup['categories']:
        c['tone'] = TONES['eu'][c['id']]
    eup['filing'] = FILING['eu']
    eue.update(eu_entries(eue))
    save(eup, EU, 'pack.json'); save(eue, EU, 'entries.json')
    e13 = load(EU13, 'pack.json')
    for c in e13['categories']:
        c['tone'] = TONES['eu'][c['id']]
    e13['filing'] = FILING['eu']
    save(e13, EU13, 'pack.json')

    # India
    for ed, draft in ((IN, False), (IND, True)):
        p = load(ed, 'pack.json'); e = load(ed, 'entries.json')
        for c in p['categories']:
            c['tone'] = TONES['in'][c['id']]
        p['filing'] = FILING['in']
        for cid in new_ids:
            kind, scope = kinds[cid]
            bio = in_bio(cid) or (NOT_MODELLED if scope != 'small' else None)
            if draft:
                non = in_draft_from_us(cid, kind, us_new[cid]['tree'])
            else:
                non = dict(NEWCLAIM) if (kind == 'efficacy') else dict(CASE_BY_CASE)
            if scope == 'bio':
                tree = Q('bio', copy.deepcopy(bio), non)
            elif scope == 'small':
                tree = Q('bio', dict(NOT_MODELLED), non)
            else:
                tree = Q('bio', copy.deepcopy(bio), non)
            e[cid] = {'tree': tree}
        save(p, ed, 'pack.json'); save(e, ed, 'entries.json')
    print('US/EU/IN entries:', len(use), len(eue))


if __name__ == '__main__':
    run()
