"""China pack (NMPA), edition 2026.1.

China classes post-approval changes by risk into approval (supplementary application to CDE),
filing (before implementation: the provincial MPA for domestic drugs, CDE for imported drugs)
and report (in the annual report). The holder classifies each change with the technical
guidelines for chemical drugs (2021) and biological products (2021). A domestic site change
goes through the production licence first.
"""
from lib import save, load, O, Q, C

DIR = 'src/packs/cn/2026.1'

SOURCES = {
    'dal': {'title': 'Drug Administration Law of the People\'s Republic of China (2019), Article 79 (changes classified by risk)', 'version': '2019 revision',
            'date': 'in force since 1 December 2019', 'url': 'https://english.nmpa.gov.cn/', 'status': 'final'},
    'impl': {'title': 'Regulations for the Implementation of the Drug Administration Law (State Council Order No. 828), Article 27 (holders assess changes, then apply, file or report)',
             'version': '2026 revision', 'date': 'published 27 January 2026, in force since 15 May 2026', 'url': 'https://www.mee.gov.cn/zcwj/gwywj/202601/t20260128_1142757.shtml', 'status': 'final'},
    'reg': {'title': 'Provisions for Drug Registration (SAMR Order No. 27), Articles 77 to 80 (approval, filing and report changes) and review time limits', 'version': '2020',
            'date': 'in force since 1 July 2020', 'url': 'https://english.nmpa.gov.cn/', 'status': 'final'},
    'pac': {'title': 'NMPA: Provisions for Post-approval Changes of Drugs (Interim), NMPA Announcement 2021 No. 8', 'version': 'Interim',
            'date': 'in force since 12 January 2021', 'url': 'https://www.zyqjg.com/article-7590-1.html', 'status': 'final'},
    'chem': {'title': 'CDE: Technical Guideline for Pharmaceutical Changes to Marketed Chemical Drugs (Interim)', 'version': 'Interim',
             'date': 'February 2021 (Q&A on drug substance changes, June 2024)', 'url': 'https://news.qq.com/rain/a/20220505A0DBQL00', 'status': 'final'},
    'bio': {'title': 'CDE: Technical Guideline for Pharmaceutical Changes to Marketed Biological Products (Interim), CDE Announcement 2021 No. 31', 'version': 'Interim',
            'date': '25 June 2021', 'url': 'https://vaccine.vip/technical-guiding-principles-for-research-on-pharmaceutical-changes-of-listed-biological-products-trial-implementation/', 'status': 'final'},
    'accept': {'title': 'CDE: Acceptance Review Guide for Chemical Drug Changes (2026), CDE Announcement 2026 No. 34', 'version': '2026',
               'date': 'May 2026', 'url': 'https://www.unionclin.com/News/536.html', 'status': 'secondary'},
    'annual': {'title': 'NMPA: Provisions for Drug Annual Reports', 'version': '2022', 'date': 'annual report due by 30 April for the previous year',
               'url': 'https://english.nmpa.gov.cn/', 'status': 'final'},
    'label': {'title': 'Provisions for Drug Package Inserts and Labels (SFDA Order No. 24)', 'version': '2006', 'date': 'in force since 1 June 2006',
              'url': 'https://english.nmpa.gov.cn/', 'status': 'final'},
    'q12': {'title': 'ICH Q12 and the 2025 CDE draft guideline on post-approval change management protocols for chemical drugs (draft only)', 'version': 'Draft',
            'date': '2025 (consultation)', 'url': 'https://www.sdu-zbpharm.com/news/news/2025-06-10/1936.html', 'status': 'draft'},
}

CATS = [
    ('NA', 0, 'Not used', 'Not used in China yet', 'other', 'Route not used',
     'China has no post-approval change management protocol or established conditions route in force; see the result.', 'q12', 'Draft guideline', 'letter'),
    ('OTHER', 0, 'Other procedure', 'Another procedure (not a change filing)', 'other', 'Other procedure',
     'The change goes through another procedure named in the result.', 'reg', 'Provisions for Drug Registration', 'letter'),
    ('NONE', 0, 'No filing', 'Not a registration change: managed in the quality system', 'do', 'Managed in the quality system',
     'Nothing in the registration changes, so no filing is needed; manage it under GMP and change control.', 'pac', 'Article 4', 'letter'),
    ('REPORT', 1, 'Report', 'Report change (minor): annual report', 'do-and-tell', 'Do, then report in the annual report',
     'A minor change: make it under change control and report it in the annual report.', 'reg', 'Article 80', 'ar'),
    ('FILE', 2, 'Filing', 'Filing change (moderate): file before implementing', 'tell-and-do', 'File, then do',
     'A moderate change: file it before implementing (with the provincial MPA for a domestic drug, with CDE for an imported drug). The filing is published within 5 working days and reviewed within 30.',
     'reg', 'Article 79', 'cbe0'),
    ('LICENCE', 3, 'Licence change', 'Production licence change, then registration update (domestic site change)', 'wait-for-approval', 'Licence change first',
     'A domestic site change goes to the provincial MPA as a production licence change with inspection and technical review; the registration record is updated afterwards.',
     'pac', 'Article 14', 'cbe30'),
    ('SUPP', 4, 'Supplementary', 'Approval change (major): supplementary application', 'wait-for-approval', 'Wait for approval',
     'A major change: submit a supplementary application to CDE and implement only after approval, within 6 months of it.', 'reg', 'Article 78', 'pas'),
    ('NEW', 5, 'New registration', 'New registration application', 'wait-for-approval', 'New application',
     'The change makes a new product (for example a new dosage form or route): apply for a new registration.', 'reg', 'Provisions for Drug Registration', 'ext'),
]


def cats():
    return [{'id': i, 'rank': r, 'short': s, 'label': l, 'implement': im, 'badge': b, 'rule': ru, 'src': src, 'at': at, 'tone': t}
            for (i, r, s, l, im, b, ru, src, at, t) in CATS]


SIMPLE = 'Simplified.'


def R(src, at, why, **kw):
    return O('REPORT', src, at, why, **kw)


def F(src, at, why, **kw):
    return O('FILE', src, at, why, **kw)


def S(src, at, why, **kw):
    return O('SUPP', src, at, why, **kw)


def site(what, bio_ok='The new site is already approved for a similar product under the same quality system, with a replicated line: a moderate change.'):
    """A drug product (or drug substance) site change."""
    domestic = O('LICENCE', 'pac', 'Articles 12 to 14', f'{what} for a domestic drug: apply to the provincial MPA to change the production licence; after inspection and technical review the registration record is updated.',
                 note='If the formulation, process or standards also change, classify those changes too.')
    imported_chem = Q('sterile', S('pac', 'Article 15', f'{what} abroad for a sterile imported drug: supplementary application.', note=SIMPLE),
                      F('pac', 'Article 15', f'{what} abroad for an imported drug: filing with CDE, with the study data the chemical guideline asks for (1 to 3 batches, 3 to 6 months of stability).', note=SIMPLE))
    chem = Q('cnImported', imported_chem, domestic)
    biol = Q('cnSameQaLine', F('bio', 'Site and equipment', bio_ok, note='For a domestic drug the production licence change comes first.'),
             S('bio', 'Site and equipment', f'{what} for a biological product is a major change: supplementary application.', note='For a domestic drug the production licence change comes first (Article 16).'))
    return Q('bio', biol, chem)


def excipient(chem_title):
    return C('cnExcipient',
             minor=R('chem', 'Excipients', f'{chem_title} within the minor limits (for oral solids, each excipient and the total within 5 percent, unit weight unchanged): minor change.'),
             moderate=F('chem', 'Excipients', f'{chem_title} beyond the minor limits but within the moderate ones (total within 10 percent, unit weight within 10 percent), or a change of excipient grade: moderate change.'),
             major=S('chem', 'Excipients', f'{chem_title} beyond the moderate limits, a narrow therapeutic index or BCS class IV drug beyond the minor limits, or a change in excipient type: major change.'))


def entry(cid):
    PI_SUPP = lambda why: S('reg', 'Article 78(2)', why, pi=True)
    PI_FILE = lambda why, **kw: F('reg', 'Article 79', why, pi=True, **kw)
    EFF = lambda what: Q('cnEfficacyContent', PI_SUPP(f'{what} touches efficacy content or could increase safety risk: supplementary application.'),
                         PI_FILE(f'{what}: a package insert change that does not touch efficacy content and does not increase risk is filed.', note=SIMPLE))
    m = {
        # Sites
        'dp-site-move': site('Moving drug product manufacture'),
        'ds-site-move': Q('bio', site('Moving drug substance manufacture'),
                          Q('cnImported', Q('sterile', S('chem', 'Site (drug substance)', 'Moving a sterile drug substance step abroad: supplementary application.', note=SIMPLE),
                                            F('chem', 'Site (drug substance)', 'Moving drug substance manufacture abroad: filing, with 3 batches tested and 3 months of stability; the drug substance record on the registration platform is updated.', note=SIMPLE)),
                            O('LICENCE', 'pac', 'Articles 12, 14 and 19', 'A domestic drug substance site change goes through the production licence; the drug substance record is then updated and the formulation holders are told.'))),
        'ds-intermediate-site': Q('sameSiteBuilding', R('chem', 'Site (drug substance)', 'Same address, same equipment and procedures, non-sterile step: test 1 batch and report the first batch\'s stability in the annual report.'),
                                  F('chem', 'Site (drug substance)', 'A different address: validate, compare quality and impurity profile, test 3 batches: moderate change.', note=SIMPLE)),
        'primary-pack-site': site('Moving primary packaging'),
        'secondary-pack-site': R('chem', 'Site (drug product)', 'A secondary packaging site: validate, test 1 batch and report in the annual report.', note='A new address on a domestic production licence needs a licence change.'),
        'labeling-site': R('chem', 'Site (drug product)', 'A labelling site: validate, test 1 batch and report in the annual report.', note='A new address on a domestic production licence needs a licence change.'),
        'ink-imprint-site': R('chem', 'Site (drug product)', 'A printing site for oral solids: validate, test 1 batch and report in the annual report.'),
        'testing-site': Q('bio', Q('bioProcedure', F('bio', 'Analytical methods', 'Moving a bioassay to another site is a moderate change (major if the assay uses animals).'),
                                   R('bio', 'Analytical methods', 'Moving physicochemical testing: report.', note=SIMPLE)),
                          R('pac', 'Article 17', 'The chemical guideline has no example for a testing site; holders usually classify it as a report change.', note=SIMPLE)),
        'component-sterilization-site': R('chem', 'Site (drug product)', 'A packaging material sterilisation site: validate, test 1 batch and report in the annual report.'),
        'fill-line-add': Q('bio', Q('cnSameQaLine', F('bio', 'Site and equipment', 'A replicated line at an approved site under the same quality system: moderate change.'),
                                    S('bio', 'Site and equipment', 'A new production line for a biological product is a major change.')),
                           Q('lineDuplicate', F('chem', 'Site (drug product)', 'A duplicate filling line with an unchanged process: moderate change with validation, including sterility assurance.', note=SIMPLE),
                             S('chem', 'Drug product process', 'A new line that changes the process or sterility assurance: major change.'))),
        # Process
        'dp-equipment-same': R('chem', 'Drug product process', 'Equipment of the same design and principle: minor change.'),
        'dp-process-change': Q('bio', Q('majorImpact', S('bio', 'Drug product process', 'Changing process steps (compounding, filling, lyophilisation) or loosening controls: major change.'),
                                        F('bio', 'Drug product process', 'A step change that does not affect critical quality: moderate change.')),
                               Q('fundamentalTech', S('chem', 'Drug product process', 'A fundamental change (for example wet to dry granulation, or oven to fluid-bed drying): major change.'),
                                 Q('affectsRelease', S('chem', 'Drug product process', 'A change that could affect release, absorption (for example inhalation) or another critical quality attribute: major change.'),
                                   Q('bioMinorParam', R('chem', 'Drug product process', 'A minor parameter change (for example mixing or drying time, tablet hardness with unchanged dissolution): minor change.'),
                                     F('chem', 'Drug product process', 'A process parameter or different-principle equipment change that does not affect critical quality attributes: moderate change.'))))),
        'dp-scale': Q('bio', Q('scaleOnly', F('bio', 'Scale', 'A scale change on equivalent equipment, only for batch size: moderate change.'),
                               S('bio', 'Scale', 'A scale change outside those conditions: major change.')),
                      Q('cnComplexForm', S('chem', 'Batch size', 'A batch size change for a special dosage form (complex modified release, enteric, transdermal, liposome, long-acting): major change.'),
                        Q('aseptic', F('chem', 'Batch size', 'A batch size change for an aseptically made product with longer sterility-relevant steps: moderate change.'),
                          Q('scaleWithin10', R('chem', 'Batch size', 'Within ten times the pivotal clinical or bioequivalence batch (oral solids and non-sterile semisolids): minor change.'),
                            F('chem', 'Batch size', 'More than ten times the pivotal batch: moderate change.'))))),
        'ds-route-new': S('chem', 'Drug substance process', 'A new route of synthesis: major change.'),
        'ds-process-change': Q('dsAfterFinalOrImpurity', S('chem', 'Drug substance process', 'A change from the final step onward, or one that could change the impurity profile or key physicochemical properties: major change.'),
                               Q('cnMinorDs', R('chem', 'Drug substance process', 'New or tighter in-process controls, a higher grade of reagent or solvent, or equipment before the final step: minor change.'),
                                 F('chem', 'Drug substance process', 'Reagents, solvents or conditions before the final step changed with the same impurity profile: moderate change.'))),
        'ds-starting-material': F('chem', 'Drug substance process', 'Extending the route so the old starting material becomes an intermediate: moderate change.'),
        'dp-reprocessing': S('chem', 'Drug substance process', 'Adding a reprocessing procedure to the registered process: major change.', note='Making an existing rework a fixed step is moderate.'),
        'dp-ink': Q('inkApproved', R('chem', 'Excipients', 'An ink of components already used in approved drugs: minor change.'),
                    F('chem', 'Excipients', 'Another ink is a moderate change.', note=SIMPLE)),
        'dp-emboss': Q('mr', S('chem', 'Drug product process', 'A marking change on a modified-release product: major change.'),
                       R('chem', 'Drug product process', 'A non-functional marking change on an oral solid: minor change.')),
        'dp-order-addition': Q('bio', F('bio', 'Drug product process', 'A change in the order of operations is a moderate change (not for vaccine liquid formulations).'),
                               R('chem', 'Drug product process', 'Changing the order of adding components (not the drug substance) to a solution: minor change.')),
        'sterile-filter': Q('filterMaterialPore', S('chem', 'Drug product process', 'Changing the sterilising filter pore size: major change.'),
                            F('chem', 'Drug product process', 'Filtration parameters beyond the approved range (same pore size), or one filter replaced by two in series: moderate change.')),
        'sterilization-method': S('chem', 'Drug product process', 'Changing the sterilisation method (filtration and terminal sterilisation, overkill and bioburden-based, dry heat and radiation): major change.'),
        'depyrogenation': Q('majorImpact', S('chem', 'Drug product process', 'A change that could affect sterility assurance: major change.', note=SIMPLE),
                            F('chem', 'Drug product process', 'A depyrogenation change with equivalent assurance: moderate change.', note=SIMPLE)),
        'inprocess-filtration-remove': Q('aseptic', S('chem', 'Drug product process', 'Removing a filtration in an aseptic process: major change.', note=SIMPLE),
                                         F('chem', 'Drug product process', 'Removing an intermediate filtration in a terminally sterilised product: moderate change.')),
        'control-increase': Q('pacQualityIssue', S('chem', 'Drug product process', 'A control added because of a process defect or stability problem is a major change.'),
                              R('chem', 'Drug product process', 'Adding an in-process control or tightening one: minor change.')),
        # Composition
        'excipient-change': Q('bio', S('bio', 'Formulation', 'Changing the excipient composition or concentration of a biological product: major change.'), excipient('An excipient amount change')),
        'colour-flavour-delete': R('chem', 'Excipients', 'Removing or reducing a colourant or flavour: minor change.'),
        'new-strength': S('chem', 'New strength', 'Every new strength is a major change: supplementary application, within the approved dosing range.', pi=True),
        'coating-weight': excipient('A coating or shell weight change'),
        'score-line': S('chem', 'Drug product process', 'Adding or deleting a functional score line: major change.', pi=True),
        'tablet-shape': Q('mr', S('chem', 'Drug product process', 'A shape or size change of a modified-release product: major change.'),
                          Q('cnShapeSignificant', F('chem', 'Drug product process', 'A significant shape change (for example round to an irregular shape) with unchanged dissolution: moderate change.'),
                            R('chem', 'Drug product process', 'A slight shape or size adjustment with unchanged dissolution: minor change.'))),
        'tse-excipient': Q('bio', F('bio', 'Raw materials', 'Replacing an animal-derived material with a non-animal one: moderate change.'),
                           F('chem', 'Excipients', 'Replacing an excipient of animal origin with the same excipient of another origin is a moderate change.', note=SIMPLE)),
        'dosage-form-new': O('NEW', 'reg', 'Provisions for Drug Registration', 'A new dosage form is a new registration (an improved new drug or a generic of that form).', pi=True),
        'excipient-supplier': Q('bio', Q('pacNonCriticalExcipient', R('bio', 'Formulation', 'A simple, stable excipient (for example an inorganic salt or sucrose) from a new supplier with status A: minor change.'),
                                         F('bio', 'Formulation', 'A new excipient supplier that is approved or registered with status A: moderate change.')),
                                R('chem', 'Excipients', 'A new supplier of the same grade with no lower quality: minor change.')),
        'bio-formulation': S('bio', 'Formulation', 'A change in excipient composition or concentration, or removing an excipient, is a major change.'),
        # Specifications and methods
        'spec-tighten': Q('bio', Q('cnForDs', F('bio', 'Specifications', 'Tightening a drug substance limit: moderate change.'), R('bio', 'Specifications', 'Tightening a drug product limit: minor change.')),
                          F('chem', 'Specifications', 'Tightening a limit within the approved range: moderate change.')),
        'spec-relax': S('chem', 'Specifications', 'Relaxing a limit is a major change.'),
        'spec-delete-test': Q('bio', Q('significantQuality', S('bio', 'Specifications', 'Deleting a test is a major change.'), R('bio', 'Specifications', 'Deleting a redundant test when the product is unchanged: minor change.')),
                              S('chem', 'Specifications', 'Deleting any item from the registered specification is a major change.')),
        'spec-add-test': Q('bio', Q('cnForDs', F('bio', 'Specifications', 'Adding a drug substance test with a limit: moderate change.'), R('bio', 'Specifications', 'Adding a drug product test: minor change.')),
                           F('chem', 'Specifications', 'Adding a test that is not needed for safety or because of a process change: moderate change.')),
        'spec-compendial': F('impl', 'Article 19', 'Updating the registration standard to a revised national standard (Chinese Pharmacopoeia): file or report as the guidelines say; usually a moderate change.', note=SIMPLE),
        'nitrosamine-control': F('chem', 'Specifications', 'Adding a test and limit is a moderate change.', note=SIMPLE),
        'excipient-spec': C('excipientSpecKind', tighten=R('chem', 'Excipients', 'Raising an excipient standard: minor change.'), add=R('chem', 'Excipients', 'Adding an excipient test raises the standard: minor change.'),
                            delete=S('chem', 'Excipients', 'Deleting an excipient test lowers control: major change.', note=SIMPLE), relax=S('chem', 'Excipients', 'Relaxing an excipient standard lowers control: major change.', note=SIMPLE)),
        'skip-testing': Q('bio', F('bio', 'Specifications', 'Moving routine testing into in-process control under approved conditions: moderate change.'),
                          S('chem', 'Specifications', 'Testing less than every batch removes an item from routine release: major change.', note=SIMPLE)),
        'method-change': Q('bio', Q('sameOrBetter', F('bio', 'Analytical methods', 'A method change with the same principle, or equal or better performance: moderate change.'), S('bio', 'Analytical methods', 'Replacing an analytical method: major change.')),
                           S('chem', 'Specifications', 'Changing a test method in the registered specification is a major change.')),
        'method-new-regulatory': Q('bio', Q('sameOrBetter', F('bio', 'Analytical methods', 'A new method with equal or better performance: moderate change.'), S('bio', 'Analytical methods', 'A new method principle: major change.')),
                                   S('chem', 'Specifications', 'A new method in the registered specification is a major change.')),
        'method-alternative': Q('bio', Q('sameOrBetter', F('bio', 'Analytical methods', 'An alternative method with equal or better performance: moderate change.'), S('bio', 'Analytical methods', 'Replacing an analytical method: major change.')),
                                S('chem', 'Specifications', 'Adding or deleting a method in the registered specification is a major change.', note=SIMPLE)),
        'method-components': F('chem', 'Drug product process', 'Changing an analytical method for in-process or component control without lowering control: moderate change.'),
        'method-raw-material': R('chem', 'Drug substance process', 'Changing the standard or grade of reagents or solvents without lowering quality: minor change.', note=SIMPLE),
        'method-minor': Q('bio', R('bio', 'Analytical methods', 'A minor method change with equal or better performance: minor change.'),
                          F('chem', 'Specifications', 'An adjustment within the approved method is filed when it changes the registered text.', note=SIMPLE)),
        'micro-rapid': Q('bio', Q('sameOrBetter', F('bio', 'Analytical methods', 'An equal-or-better method: moderate change.'), S('bio', 'Analytical methods', 'Replacing a method: major change.')),
                         S('chem', 'Specifications', 'Changing a test method in the registered specification is a major change.')),
        'reference-standard': Q('bio', Q('refStdProtocol', R('bio', 'Reference standards', 'A new reference lot confirmed under the approved protocol: minor change.'),
                                         F('bio', 'Reference standards', 'A new reference lot confirmed against an approved reference, or a new protocol: moderate change.')),
                                R('pac', 'Article 17', 'The chemical guideline has no example; a new working standard qualified against the primary standard is usually a report change.', note=SIMPLE)),
        # Container closure
        'cc-polymer': Q('bio', S('bio', 'Packaging', 'A change in direct-contact packaging material is a major change.'),
                        Q('sterile', S('chem', 'Packaging', 'A material or type change for an injection, inhalation or ophthalmic container: major change.'),
                          F('chem', 'Packaging', 'A material or type change for a liquid or semisolid container (not injection, inhalation or ophthalmic): moderate change.'))),
        'cc-sterile': Q('bio', Q('productContactChange', S('bio', 'Packaging', 'A change in direct-contact material, shape or size: major change.'),
                                 R('bio', 'Packaging', 'A new supplier of the same component, approved or with status A: minor change.')),
                        Q('productContactChange', S('chem', 'Packaging', 'A material or type change for an injection container: major change.'),
                          F('chem', 'Packaging', 'A new supplier, size or shape of an injection container: moderate change.'))),
        'cc-dose-device': S('chem', 'Packaging', 'A change in supplier, size or shape of a metered-dose device: major change.'),
        'cc-closure-solid': Q('containerTypeChange', F('chem', 'Packaging', 'Changing the type of packaging for a non-sterile solid (blister, bottle, bag): moderate change.'),
                              R('chem', 'Packaging', 'A supplier, size or shape change, or a material already used for the same route with equal or better performance: minor change.')),
        'cc-closure-liquid': F('chem', 'Packaging', 'A material or type change for a non-sterile liquid: moderate change.'),
        'cc-size-shape': Q('bio', Q('productContactChange', S('bio', 'Packaging', 'A shape or size change with different internal dimensions: major change.'), R('bio', 'Packaging', 'A shape or size change with equivalent internal dimensions and the same material: minor change.')),
                           Q('sterile', F('chem', 'Packaging', 'A size or shape change of an injection container: moderate change.'),
                             R('chem', 'Packaging', 'A size or shape change not otherwise listed: minor change.'))),
        'cc-count': Q('bio', R('bio', 'Packaging', 'A pack size change: minor change.'),
                      Q('unitOfUse', R('chem', 'Packaging', 'A count change for unit-dose packs (tablets per blister, vials per box): minor change.'),
                        F('chem', 'Packaging', 'A count change for multi-dose packs (tablets per bottle, grams per tube): moderate change.'))),
        'cc-desiccant': F('chem', 'Packaging', 'Adding, changing or removing a desiccant changes the protection: moderate change.', note=SIMPLE),
        'cc-blister': Q('containerTypeChange', F('chem', 'Packaging', 'A blister type change (for example alu-alu to alu-PVC): moderate change.'),
                        R('chem', 'Packaging', 'A blister supplier, size or shape change: minor change.')),
        'cc-secondary-protective': S('chem', 'Packaging', 'Removing secondary packaging that gives extra protection: major change.'),
        'cc-cap-colour': R('bio', 'Packaging', 'A non-contact packaging change that does not affect stability, transport or safety: minor change.'),
        'cc-supplier': Q('bio', R('bio', 'Packaging', 'A new supplier of a direct-contact item, approved or with status A: minor change.'),
                         Q('sterile', F('chem', 'Packaging', 'A new supplier of an injection container: moderate change.'),
                           R('chem', 'Packaging', 'A new supplier not otherwise listed: minor change.'))),
        'cc-device': Q('deviceSignificant', S('chem', 'Packaging', 'A device change that could change the dose delivered: major change.', note=SIMPLE),
                       F('chem', 'Packaging', 'A measuring or administration device supplied with the product: moderate change.', note=SIMPLE)),
        'cc-noncontact': R('bio', 'Packaging', 'A non-contact packaging part that does not affect stability, transport or safety: minor change.'),
        # Stability
        'shelf-life-extend': Q('bio', Q('approvedProtocolFullData', F('bio', 'Shelf life', 'Extending the shelf life on at least three commercial batches under the approved stability protocol: moderate change.'),
                                        S('bio', 'Shelf life', 'Extending the shelf life on other data: major change.')),
                               F('chem', 'Shelf life', 'Extending the shelf life within the long-term stability data already completed: moderate change.')),
        'shelf-life-reduce': Q('cnStabilityIssue', S('chem', 'Shelf life', 'Shortening the shelf life because of a manufacturing or stability problem is a major change.'),
                               F('chem', 'Shelf life', 'Shortening the shelf life for other reasons: moderate change.')),
        'stability-protocol': Q('bio', Q('stabilityTimepointsOnly', R('bio', 'Shelf life', 'A tighter stability protocol (for example more time points): minor change.'),
                                         F('bio', 'Shelf life', 'Another stability protocol change: moderate change.')),
                                F('pac', 'Article 17', 'The chemical guideline has no example; a protocol change is usually filed.', note=SIMPLE)),
        'storage-conditions': Q('bio', Q('restrictive', R('bio', 'Shelf life', 'Tightening the storage conditions within the approved range: minor change.'), S('bio', 'Shelf life', 'Relaxing the storage conditions: major change.')),
                                S('chem', 'Shelf life', 'Changing the storage conditions is a major change.', pi=True)),
        'ds-storage': Q('restrictive', F('chem', 'Shelf life', 'Tightening drug substance storage conditions: moderate change.', note=SIMPLE),
                        S('chem', 'Shelf life', 'Changing the storage conditions is a major change.')),
        'ds-retest': F('chem', 'Shelf life', 'Extending the drug substance re-test period within completed long-term data: moderate change.', note=SIMPLE),
        'in-use-shelf-life': F('bio', 'Shelf life', 'Changing the storage after reconstitution or dilution: moderate change.', pi=True),
        'hold-time': Q('bio', F('bio', 'Drug product process', 'A longer hold with supporting data: moderate change.', note=SIMPLE),
                       Q('bulkHold50', F('chem', 'Batch size', 'A bulk solution hold more than 50 percent longer (terminally sterilised): moderate change.'),
                         R('chem', 'Batch size', 'A bulk solution hold up to 50 percent longer with the same bioburden: minor change.'))),
        'ipc-tighten': R('chem', 'Drug product process', 'Tightening an in-process limit: minor change.'),
        'ipc-relax': Q('bio', F('bio', 'Drug product process', 'Relaxing a control range with supporting data: moderate change.'),
                       S('chem', 'Drug product process', 'Relaxing or deleting an approved control is a major change.')),
        # Drug substance source
        'ds-cep': Q('cnApprovedApi', F('chem', 'Drug substance supplier', 'Switching to a drug substance that is already approved (status A on the registration platform): moderate change.', note='If dissolution or key properties of the product differ, a bioequivalence study may be needed.'),
                    S('chem', 'Drug substance supplier', 'Switching to a drug substance that is not yet approved: major change.')),
        'batch-release-site': R('pac', 'Article 17', 'The holder releases batches under GMP; a new quality control laboratory is usually a report change.', note=SIMPLE),
        'site-delete': R('chem', 'Drug substance supplier', 'Removing a supplier or site: minor change.', note='A domestic production licence is updated if an address goes.'),
        'ds-scale': Q('scaleWithin10', R('chem', 'Batch size', 'Within ten times the approved drug substance batch: minor change.'), F('chem', 'Batch size', 'More than ten times the approved batch: moderate change.')),
        'design-space-within': O('NONE', 'pac', 'Article 4', 'Working within an approved design space is not a change.'),
        'design-space-new': S('bio', 'Drug product process', 'Establishing or expanding a design space is a major change.'),
        'rtrt': S('bio', 'Drug product process', 'Using a design space for parametric or real-time release is a major change.'),
        'continuous-mfg': S('chem', 'Drug product process', 'Converting to continuous manufacturing is a fundamental process change: major change.', note=SIMPLE),
        'be-study-change': S('chem', 'Drug substance supplier', 'A change that needs a bioequivalence study is a major change.'),
        # Biologics
        'bio-mcb': Q('cnFromApprovedMcb', F('bio', 'Cell banks', 'A new master cell bank from the original or an approved master bank, prepared the same way with the same or tighter specifications: moderate change.'),
                     S('bio', 'Cell banks', 'A master cell bank not derived from the original or an approved master bank, or a new expression vector: major change.')),
        'bio-wcb': Q('wcbApprovedProtocol', F('bio', 'Cell banks', 'A new working cell bank from an approved master bank within the approved passage limit: moderate change.'),
                     S('bio', 'Cell banks', 'A working cell bank outside those conditions: major change.', note=SIMPLE)),
        'bio-purification': Q('majorImpact', S('bio', 'Purification', 'A critical change (for example one that affects virus clearance or the impurity profile): major change.'),
                              Q('bioResinMinor', R('bio', 'Purification', 'A non-critical change that also meets the stricter conditions: minor change.'),
                                F('bio', 'Purification', 'A non-critical change with no new impurity and no effect on virus clearance: moderate change.'))),
        'bio-viral': Q('majorImpact', S('bio', 'Purification', 'A change that significantly affects virus clearance is a major change.'),
                       F('bio', 'Purification', 'Another change to a virus inactivation or removal step: moderate, with its own validation.')),
        'bio-scale': Q('bioScaleOnly', F('bio', 'Scale', 'A culture scale change on the same bioreactor type with linear scaling within approved ranges: moderate change.'),
                       S('bio', 'Scale', 'A scale change outside those conditions: major change.')),
        'bio-media': C('cnMedia', key=S('bio', 'Raw materials', 'Adding, removing or replacing a key medium component, or changing the source of an animal-derived material: major change.'),
                       keyNoImpact=F('bio', 'Raw materials', 'A key component change with no effect on key quality attributes, or replacing an animal-derived material with a non-animal one: moderate change.'),
                       nonkey=R('bio', 'Raw materials', 'A non-key component change: minor change.')),
        'bio-resin': C('resinChange', lifetime=F('bio', 'Purification', 'Extending the resin lifetime is a non-critical purification change: moderate change.', note=SIMPLE),
                       supplier=Q('majorImpact', S('bio', 'Purification', 'A different resin that could affect clearance or impurities: major change.'), F('bio', 'Purification', 'An equivalent resin from another supplier: moderate change.', note=SIMPLE))),
        'bio-potency': Q('potencyNewPrinciple', S('bio', 'Analytical methods', 'A potency assay with a new principle is a major change.'),
                         F('bio', 'Analytical methods', 'A potency method change with the same principle, equal or better: moderate change.')),
        'bio-adventitious': C('adventRisk', first=S('bio', 'Raw materials', 'New viral safety claims need the purification and clearance data reviewed: major change.', note=SIMPLE),
                              higher=S('bio', 'Raw materials', 'A higher-risk evaluation is a major change.', note=SIMPLE),
                              same=F('bio', 'Raw materials', 'Updated data with the same risk: moderate change.', note=SIMPLE)),
        # Labelling and efficacy
        'lab-new-indication': PI_SUPP('A new indication changes efficacy content of the package insert: supplementary application.'),
        'lab-population': PI_SUPP('Changing the population or dosage changes efficacy content: supplementary application.'),
        'lab-clinical-section': PI_SUPP('Clinical study results are efficacy content of the package insert: supplementary application.'),
        'lab-safety-add': PI_FILE('Adding or strengthening safety information does not increase risk, so it is filed.', note='A change that weakens safety information increases risk and needs approval.'),
        'lab-dosing-safety': EFF('An instruction about dosage and administration'),
        'lab-delete-claim': EFF('Deleting unsupported text'),
        'lab-505o4': PI_FILE('When NMPA announces a unified revision of package inserts, each holder files its revised insert by the date in the announcement.'),
        'lab-rld-update': EFF('Aligning a generic\'s package insert with the reference drug'),
        'lab-editorial': PI_FILE('An editorial change to the package insert or labels is filed.', note=SIMPLE),
        'lab-layout': PI_FILE('A change to the content or layout of package labels is a filing change (Article 79).'),
        'lab-new-route': O('NEW', 'reg', 'Provisions for Drug Registration', 'A new route of administration is a new registration.', pi=True),
        'lab-brand-name': S('reg', 'Article 78', 'A trade name change needs a supplementary application.', pi=True, note=SIMPLE),
        'lab-rmp': O('NONE', 'pac', 'Article 4', 'China has no separate filing for a risk management plan update; the plan is kept in the pharmacovigilance system and summarised in periodic safety reports.', note=SIMPLE),
        'lab-psusa': EFF('Safety wording after a periodic safety report or signal assessment'),
        'lab-delete-indication': PI_SUPP('Deleting an indication changes efficacy content: supplementary application.'),
        # Protocols and lifecycle tools
        'cp-submit': O('NA', 'q12', 'Draft guideline', 'China has no post-approval change management protocol route in force; CDE consulted on a draft guideline for chemical drugs in 2025.'),
        'cp-use': O('NA', 'q12', 'Draft guideline', 'There is no approved protocol route yet; classify the change itself in its own entry.'),
        'pacmp-change': O('NA', 'q12', 'Draft guideline', 'There is no approved protocol route yet.'),
        'ec-define': O('NA', 'q12', 'ICH Q12', 'Established conditions are not part of the Chinese change rules yet; the registration dossier and the holder\'s change list play that role.'),
        'plcm-update': O('NA', 'q12', 'ICH Q12', 'China does not use a PLCM document.'),
        'non-ec-change': O('NA', 'q12', 'ICH Q12', 'Without established conditions, the change is classified by the technical guidelines: see its own entry.'),
        # Administrative
        'admin-ownership': S('pac', 'Articles 8 and 9', 'Transferring the marketing authorisation is a supplementary application to CDE; for a domestic transfer, the new holder first gets a production licence.'),
        'admin-name-address': F('pac', 'Article 11', 'A change in the holder\'s name or registered address name: for a domestic holder, change the licence first, then file; for an imported drug, file with CDE.'),
        'admin-manufacturer-name': F('pac', 'Article 11', 'A change in the manufacturer\'s name or address name (no move) is filed, after the licence change for a domestic manufacturer.'),
        'admin-local-rep': F('reg', 'Article 79', 'Changing the domestic agent named by an overseas holder is filed with CDE.', note=SIMPLE),
        'admin-inn': F('reg', 'Article 79', 'Changing the common name to a new national name is filed.', pi=True, note=SIMPLE),
        'admin-delete-presentation': C('presentationKind',
                                       strength=O('OTHER', 'reg', 'Cancellation of the registration certificate', 'Each strength has its own approval number: apply to cancel that registration certificate.', note=SIMPLE),
                                       pack=R('chem', 'Packaging', 'Removing a pack size: minor change.', note=SIMPLE)),
    }
    return m.get(cid)


QUESTIONS = {
    'cnImported': {'text': 'Is the product an imported drug (made outside China by an overseas holder)?', 'fromProduct': 'cnImported',
                   'help': 'Imported drugs file with CDE; domestic drugs file with the provincial medical products administration, and a domestic site change goes through the production licence.'},
    'cnSameQaLine': {'text': 'Is the new site already approved for a similar product, under the same quality system, with a replicated production line?'},
    'cnComplexForm': {'text': 'Is it a special dosage form (complex modified release, enteric, transdermal, liposome or long-acting)?'},
    'cnMinorDs': {'text': 'Is it only a new or tighter in-process control, a higher grade of reagent or solvent, or an equipment change before the final step?'},
    'cnExcipient': {'text': 'How large is the excipient change, by the limits in the NMPA chemical guideline?', 'type': 'choice',
                    'options': [{'value': 'minor', 'label': 'Within the minor limits (oral solids: total 5 percent or less, unit weight unchanged)'},
                                {'value': 'moderate', 'label': 'Beyond minor but within the moderate limits (total 10 percent or less), or a grade change'},
                                {'value': 'major', 'label': 'Beyond the moderate limits, a narrow therapeutic index or BCS class IV drug beyond minor, or a new excipient type'}]},
    'cnShapeSignificant': {'text': 'Is it a significant shape change (for example round to an irregular shape), not a slight adjustment?'},
    'cnForDs': {'text': 'Is the specification for the drug substance (not the drug product)?'},
    'cnStabilityIssue': {'text': 'Is the change caused by a manufacturing or stability problem?'},
    'cnApprovedApi': {'text': 'Is the new drug substance already approved (status A on the NMPA registration platform)?'},
    'cnFromApprovedMcb': {'text': 'Is the new master cell bank derived from the original or an approved master cell bank, prepared the same way, with the same or tighter specifications?'},
    'cnMedia': {'text': 'What changes in the medium or raw material?', 'type': 'choice',
                'options': [{'value': 'key', 'label': 'A key component is added, removed or replaced, or an animal-derived source changes'},
                            {'value': 'keyNoImpact', 'label': 'A key component changes with no effect on key quality attributes, or an animal-derived material is replaced by a non-animal one'},
                            {'value': 'nonkey', 'label': 'A non-key component changes'}]},
    'cnEfficacyContent': {'text': 'Does the package insert change touch efficacy content (indications, dosage and administration, clinical results) or could it increase safety risk?'},
}


def run():
    catalogue = load('src', 'data', 'catalogue.json')
    entries, missing = {}, []
    for ch in catalogue['changes']:
        e = entry(ch['id'])
        if e is None:
            missing.append(ch['id'])
            continue
        entries[ch['id']] = {'tree': e}
    if missing:
        raise SystemExit(f'China: no entry for {missing}')
    q = load('src', 'data', 'questions.json')
    q.update(QUESTIONS)
    save(q, 'src', 'data', 'questions.json')
    pack = {
        'id': 'cn', 'region': 'CN', 'label': 'China: NMPA (Drug Administration Law)', 'edition': '2026.1',
        'appliesFrom': '2026-05-15', 'appliesTo': None, 'status': 'in force',
        'summary': 'Changes are classed by risk: approval (a supplementary application to CDE), filing (before implementing) and report (in the annual report). The holder classifies each change with the NMPA technical guidelines for chemical drugs and biological products. A domestic site change goes through the production licence first.',
        'sources': SOURCES, 'categories': cats(), 'conditions': {},
        'multipleChanges': {'rule': 'Related changes can be submitted together; the submission follows the highest category, and a combined supplementary application has a longer review time limit (80 working days).', 'src': 'reg', 'at': 'Article 96'},
        'filing': {'shared': ['REPORT', 'FILE'], 'apart': ['NONE', 'NA', 'OTHER']},
        'clocks': {
            'REPORT': {'months': 12, 'label': 'Report in the annual report (due by 30 April for the previous year)', 'src': 'annual'},
            'FILE': {'label': 'File before implementing; the filing is published within 5 working days and the regulator reviews it within 30', 'src': 'pac'},
            'LICENCE': {'workingDays': 15, 'approx': True, 'label': 'production licence change by the provincial MPA (15 working days, plus inspection and technical review)', 'src': 'impl'},
            'SUPP': {'workingDays': 60, 'label': 'CDE review time limit of 60 working days (80 for a combined application, 200 with an inspection or clinical data review), then the approval decision; implement within 6 months of approval', 'src': 'reg'},
            'NEW': {'months': 12, 'approx': True, 'label': 'New registration: about a year of review', 'src': 'reg'},
        },
        'm1': {
            'supp': [{'code': 'cn:1.0', 'label': 'Cover letter'}, {'code': 'cn:1.2', 'label': 'Supplementary application form'},
                     {'code': 'cn:1.4', 'label': 'Change description, classification and risk assessment'}, {'code': 'cn:1.5', 'label': 'Copy of the registration certificate and earlier approvals'}],
            'file': [{'code': 'cn:1.0', 'label': 'Cover letter'}, {'code': 'cn:1.2', 'label': 'Filing form'}, {'code': 'cn:1.4', 'label': 'Change description, classification and risk assessment'}],
            'new': [{'code': 'cn:1.0', 'label': 'Cover letter'}, {'code': 'cn:1.2', 'label': 'Registration application form'}],
            'pi': [{'code': 'cn:1.3.1', 'label': 'Revised package insert (说明书), with a comparison of old and new text'}, {'code': 'cn:1.3.2', 'label': 'Revised labels (标签)'}],
            'licence': [{'code': 'cn:licence', 'label': 'Production licence change application to the provincial MPA (outside the dossier)'}],
        },
        'm1map': {'SUPP': ['supp'], 'FILE': ['file'], 'NEW': ['new'], 'LICENCE': ['licence']},
        'ectd': {k: None for k in ('SUPP', 'FILE', 'NEW', 'LICENCE', 'REPORT', 'NONE', 'NA', 'OTHER')},
        'changeLog': [{'edition': '2026.1', 'date': '2026-11-10', 'text': 'First China edition: approval, filing and report changes under the Provisions for Drug Registration and the 2021 Provisions for Post-approval Changes, with the NMPA chemical and biological technical guidelines; the 2026 Implementing Regulations (in force 15 May 2026).'}],
    }
    save(pack, DIR, 'pack.json')
    save(entries, DIR, 'entries.json')
    print('China:', len(entries), 'entries')


if __name__ == '__main__':
    run()
