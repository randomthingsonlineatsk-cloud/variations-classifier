"""Japan pack (MHLW/PMDA, PMD Act), edition 2026.1.

Japan has no list of change categories by change type. The approval form decides: items written
as approved matters need a partial change approval; items the form marks as minor change items
are notified within 30 days; items not in the form are managed in the quality system. Article 47
of the Enforcement Regulations excludes some changes from the minor route whatever the form says.
"""
from lib import load, save, O, Q, C

DIR = 'src/packs/jp/2026.1'

SOURCES = {
    'pmd': {'title': 'Act on Securing Quality, Efficacy and Safety of Products Including Pharmaceuticals and Medical Devices (PMD Act), Article 14 (partial change approval and minor change notification)',
            'version': 'As amended', 'date': 'current', 'url': 'https://www.japaneselawtranslation.go.jp/en/laws/view/3213', 'status': 'final'},
    'reg47': {'title': 'Enforcement Regulations of the PMD Act, Article 47 (scope of minor changes)', 'version': 'As amended', 'date': 'current',
              'url': 'https://www.pmda.go.jp/files/000215552.pdf', 'status': 'final'},
    'mod24': {'title': 'MHLW notice of 27 September 2024 (PSEHB/PED 0927-4): trial of a change procedure for moderate change items, with Q&A',
              'version': 'Trial', 'date': '2024-09-27', 'url': 'https://www.japal.org/dom/notice/2024093049.html', 'status': 'final'},
    'ar25': {'title': 'MHLW notice of 13 February 2025 (PSEHB/PED 0213-5): trial of an annual report procedure', 'version': 'Trial', 'date': '2025-02-13',
             'url': 'https://www.mhlw.go.jp/web/t_doc?dataId=00tc8941&dataType=1&pageNo=1', 'status': 'final'},
    'pacmp': {'title': 'PMD Act post-approval change management protocol (change plan) system, and MHLW Q&A of 3 October 2025',
              'version': 'In force since 2021', 'date': 'Q&A 2025-10-03', 'url': 'https://www.pmda.go.jp/files/000278426.pdf', 'status': 'final'},
    'rapid': {'title': 'Rapid review of partial change applications for manufacturing site changes (summary in JGA News 165, 2022)', 'version': 'Secondary summary', 'date': '2022',
              'url': 'https://www.jga.gr.jp/assets/uploads/2022/JGA-NEWS165-1%20%284%29.pdf', 'status': 'secondary'},
    'survey': {'title': 'MHLW study group on change management procedures (4th meeting, 13 October 2023): review time survey', 'version': 'Meeting document', 'date': '2023-10-13',
               'url': 'https://www.mhlw.go.jp/content/11121000/001155992.pdf', 'status': 'secondary'},
    'pmdaTarget': {'title': 'PMDA performance targets for new drug review (total review time, 80th percentile)', 'version': 'Mid-term plan', 'date': 'current',
                   'url': 'https://www.pmda.go.jp/english/', 'status': 'goal'},
    'pi': {'title': 'PMD Act Article 52-2 (notification of package insert information) and MHLW revision instructions for precautions', 'version': 'As amended', 'date': 'current',
           'url': 'https://www.pmda.go.jp/english/', 'status': 'final'},
    'q12': {'title': 'ICH Q12 (adopted in Japan)', 'version': 'Step 5', 'date': '2021', 'url': 'https://www.pmda.go.jp/english/int-activities/int-harmony/ich/0014.html', 'status': 'final'},
    'q8': {'title': 'ICH Q8(R2) Pharmaceutical development (adopted in Japan)', 'version': 'R2', 'date': 'adopted', 'url': 'https://www.pmda.go.jp/english/int-activities/int-harmony/ich/0014.html', 'status': 'final'},
}

CATS = [
    ('NA', 0, 'Not used', 'Not used in Japan', 'other', 'Route not used', 'Japan does not use this tool; see the result for what applies instead.', 'q12', 'ICH Q12', 'letter'),
    ('NONE', 0, 'No filing', 'Not an approved matter: managed in the quality system', 'do', 'Managed in the quality system',
     'The item is not in the approval form, so no filing is needed; manage it under GMP and the quality system.', 'pmd', 'Article 14', 'letter'),
    ('MCN', 1, 'MCN', 'Minor change notification', 'do-and-tell', 'Do, then notify within 30 days',
     'Make the change, then notify within 30 days. PMDA reviews the notification afterwards, with the next partial change application.', 'pmd', 'Article 14 (minor change notification)', 'ar'),
    ('JPAR', 1, 'Annual report', 'Annual report item (2025 trial)', 'do-and-tell', 'Do, then report yearly',
     'For items the approval designates as annual report items: make the change and report it once a year through a PMDA consultation.', 'ar25', 'Trial notice', 'ar'),
    ('NOTIFY', 2, 'Notify', 'Notification to the authorities (no approval)', 'tell-and-do', 'Notify',
     'Notify the revised document or fact (for example the package insert, the RMP or a succession); no approval step.', 'pi', 'Article 52-2', 'cbe0'),
    ('PACMPN', 2, 'PACMP notice', 'Notification under an approved change plan (PACMP step 2)', 'tell-and-wait', 'Notify, wait 40 working days',
     'Notify the change made under the confirmed plan; it becomes an approved matter 40 working days after acceptance (20 in special cases) unless PMDA raises questions.', 'pacmp', 'Q&A Q7', 'cbe0'),
    ('MOD', 3, 'Moderate', 'Moderate change: rapid review (2024 trial)', 'wait-for-approval', 'Short review, then do',
     'For items designated as moderate change items: a form of partial change application with a short review; implement after approval.', 'mod24', 'Trial notice, Q1', 'cbe30'),
    ('PCAR', 3, 'PCA (rapid)', 'Partial change application, rapid review (site changes)', 'wait-for-approval', 'Wait for approval (about 3 months)',
     'A partial change application for a site change with an unchanged method, reviewed on a rapid track (standard processing time about 3 months).', 'rapid', 'Rapid partial change', 'cbe30'),
    ('PCA', 4, 'PCA', 'Partial change approval application', 'wait-for-approval', 'Wait for approval',
     'Apply for partial change approval and implement only after approval.', 'pmd', 'Article 14 (partial change approval)', 'pas'),
    ('PLAN', 4, 'Change plan', 'Change plan confirmation application (PACMP step 1)', 'wait-for-approval', 'Wait for confirmation',
     'Apply for confirmation of the change plan; once confirmed, changes made under it are notified (step 2).', 'pacmp', 'PACMP step 1', 'pas'),
    ('NEW', 5, 'New approval', 'New marketing approval application', 'wait-for-approval', 'New application',
     'The change cannot be made by partial change: apply for a new approval (including a replacement application for a new brand name).', 'pmd', 'Article 14', 'ext'),
]


def cats():
    return [{'id': i, 'rank': r, 'short': s, 'label': l, 'implement': im, 'badge': b, 'rule': ru, 'src': src, 'at': at, 'tone': t}
            for (i, r, s, l, im, b, ru, src, at, t) in CATS]


def G(title, pca='PCA'):
    """The approval form decides."""
    return C('jpItem',
             pca=O(pca, 'rapid' if pca == 'PCAR' else 'pmd', 'Rapid partial change' if pca == 'PCAR' else 'Article 14',
                   (f'{title} is written as an approved matter, so it needs a partial change approval' + (' on the rapid track for site changes (about 3 months).' if pca == 'PCAR' else '.'))),
             minor=O('MCN', 'pmd', 'Article 14', f'{title} is marked as a minor change item in the approval form, so it is notified within 30 days after the change.'),
             moderate=O('MOD', 'mod24', 'Trial notice, Q1', f'{title} is designated as a moderate change item, so it goes through the rapid moderate change review.'),
             annual=O('JPAR', 'ar25', 'Trial notice', f'{title} is designated as an annual report item, so it is reported in the yearly report.'),
             absent=O('NONE', 'pmd', 'Article 14', f'{title} is not in the approval form, so no filing is needed; manage it in the quality system.'))


def X(title, item):
    """Article 47 excludes the change from the minor route."""
    return C('jpItem',
             pca=O('PCA', 'reg47', f'Article 47({item})', f'{title} is excluded from minor changes by Article 47({item}), so it needs a partial change approval.'),
             minor=O('PCA', 'reg47', f'Article 47({item})', f'Even though the item is marked as minor, Article 47({item}) excludes this kind of change from the minor route: partial change approval.'),
             moderate=O('MOD', 'mod24', 'Trial notice, Q1', f'{title} is designated as a moderate change item, so it goes through the rapid moderate change review.'),
             annual=O('JPAR', 'ar25', 'Trial notice', f'{title} is designated as an annual report item, so it is reported in the yearly report.'),
             absent=O('NONE', 'pmd', 'Article 14', f'{title} is not in the approval form, so no filing is needed.'))


def F(cat, src, at, why, **kw):
    return O(cat, src, at, why, **kw)


def entry(cid):
    PCA_EFF = lambda why: F('PCA', 'pmd', 'Article 14 (partial change approval)', why, pi=True)
    NOTIFY_PI = lambda why, **kw: F('NOTIFY', 'pi', 'Article 52-2', why, pi=True, **kw)
    m = {
        'dp-site-move': G('The manufacturing site', 'PCAR'),
        'ds-site-move': G('The drug substance manufacturing site', 'PCAR'),
        'ds-intermediate-site': G('The intermediate manufacturing site'),
        'primary-pack-site': G('The packaging site'),
        'secondary-pack-site': G('The packaging site'),
        'labeling-site': G('The labelling site'),
        'testing-site': G('The testing site'),
        'ink-imprint-site': G('The site'),
        'component-sterilization-site': G('The component sterilisation arrangement'),
        'fill-line-add': X('A filling line change that may affect sterility assurance', 1),
        'dp-equipment-same': G('The equipment'),
        'dp-process-change': Q('majorImpact', X('A process change that affects the nature, properties or safety of the product', 1), G('The process parameter')),
        'dp-scale': G('The batch size'),
        'ds-route-new': F('PCA', 'reg47', 'Article 47(1)', 'A new route of synthesis affects the drug substance: partial change approval.'),
        'ds-process-change': Q('majorImpact', X('A drug substance process change that affects quality', 1), G('The process parameter')),
        'ds-starting-material': X('Redefining the starting material', 1),
        'dp-reprocessing': X('Adding a reprocessing procedure', 1),
        'dp-ink': G('The ink'),
        'dp-emboss': G('The marking'),
        'dp-order-addition': G('The order of addition'),
        'sterile-filter': X('A change to the sterilising filtration', 1),
        'sterilization-method': X('A change to the sterilisation method', 1),
        'depyrogenation': X('A change to depyrogenation', 1),
        'inprocess-filtration-remove': X('Removing an in-process filtration', 1),
        'control-increase': G('The in-process control'),
        'excipient-change': X('A composition change', 5),
        'colour-flavour-delete': X('A composition change', 5),
        'new-strength': F('NEW', 'pmd', 'Article 14', 'A new strength changes the quantity of the active ingredient, which cannot be done by partial change: new approval.', pi=True),
        'spec-tighten': X('A change to the specification', 2),
        'spec-relax': X('A change to the specification', 2),
        'spec-delete-test': X('Deleting a specification item', 2),
        'spec-add-test': G('The added test'),
        'spec-compendial': G('The test', ),
        'method-change': G('The test method'),
        'method-new-regulatory': G('The test method'),
        'method-alternative': G('The alternative test method'),
        'method-components': G('The test method'),
        'method-raw-material': G('The test method'),
        'cc-polymer': G('The container material'),
        'cc-sterile': X('A container change for a sterile product that may affect quality', 5),
        'cc-dose-device': X('A change to packaging that controls the dose', 5),
        'cc-closure-solid': G('The closure'),
        'cc-closure-liquid': G('The closure'),
        'cc-size-shape': G('The container size or shape'),
        'cc-count': G('The pack size'),
        'cc-desiccant': G('The desiccant'),
        'cc-blister': G('The blister'),
        'cc-secondary-protective': G('The secondary packaging'),
        'cc-cap-colour': G('The cap colour'),
        'shelf-life-extend': G('The shelf life'),
        'shelf-life-reduce': G('The shelf life'),
        'stability-protocol': G('The stability protocol'),
        'storage-conditions': X('A change in storage method that may affect quality', 5),
        'reference-standard': G('The reference standard'),
        'lab-new-indication': PCA_EFF('A new indication changes efficacy and indications, excluded from minor changes by Article 47(4): partial change approval.'),
        'lab-population': PCA_EFF('A change in dosage and administration is excluded from minor changes by Article 47(4): partial change approval.'),
        'lab-clinical-section': NOTIFY_PI('Updating clinical sections of the package insert is notified to PMDA before distribution.'),
        'lab-safety-add': NOTIFY_PI('Precaution revisions are made in the package insert and notified to PMDA; MHLW often instructs them.'),
        'lab-dosing-safety': NOTIFY_PI('An instruction for safer use in the precautions is notified with the revised package insert.', note='If it changes the approved dosage, it needs a partial change approval.'),
        'lab-delete-claim': NOTIFY_PI('Removing unsupported text from the package insert is notified.', note='Removing an approved indication needs a partial change approval.'),
        'lab-505o4': NOTIFY_PI('When MHLW instructs a revision of the precautions, the holder revises the package insert and notifies it.'),
        'lab-rld-update': NOTIFY_PI('A generic follows revisions of the originator\'s precautions by notifying its revised package insert.'),
        'lab-editorial': NOTIFY_PI('An editorial revision of the package insert is notified.'),
        'lab-layout': F('NONE', 'pmd', 'Article 14', 'Label layout is not an approved matter: no filing.', note='Labelling must still meet the PMD Act labelling rules.'),
        'cp-submit': F('PLAN', 'pacmp', 'PACMP step 1', 'A change plan (PACMP) is submitted for confirmation; the general target is 12 months.'),
        'cp-use': Q('jpProtocolNotice', F('PACMPN', 'pacmp', 'Q&A Q7', 'A change made under the confirmed plan is notified and becomes an approved matter 40 working days after acceptance (20 in special cases).'),
                    F('PCA', 'pmd', 'Article 14', 'The change does not follow the confirmed plan, so it goes through the normal route.', note='Classify the change itself in its own entry.')),
        'be-study-change': F('PCA', 'reg47', 'Article 47(5)', 'A change needing a new bioequivalence study may affect efficacy: partial change approval.'),
        'bio-mcb': X('A new master cell bank', 1),
        'bio-wcb': G('The working cell bank'),
        'bio-purification': Q('bioResinMinor', G('The purification parameter'), X('A new purification step, resin or column', 1)),
        'bio-viral': X('A change to virus removal or inactivation', 3),
        'admin-ownership': F('NOTIFY', 'pmd', 'Article 14-8 (succession)', 'A transfer of the approval is a succession, notified by the new holder.', note='Simplified.'),
        'admin-name-address': F('NOTIFY', 'pmd', 'Licence change notification', 'A change in the holder\'s name or address is notified as a change to the marketing licence.', note='Simplified.'),
        # new in phase 4
        'ds-cep': Q('dsSameRoute', G('The new drug substance manufacturer (registered in the Japanese master file)', 'PCAR'), F('PCA', 'reg47', 'Article 47(1)', 'A source with a different route affects the drug substance: partial change approval.')),
        'batch-release-site': G('The testing site'),
        'site-delete': F('MCN', 'pmd', 'Article 14', 'Deleting a site from the approval form is a minor change notification.', note='Simplified.'),
        'ds-scale': G('The batch size'),
        'ipc-tighten': G('The in-process limit'),
        'ipc-relax': X('Widening an in-process limit that may affect quality', 5),
        'hold-time': G('The hold time'),
        'design-space-within': F('NONE', 'q8', 'Design space', 'Working within an approved design space is not a change.'),
        'design-space-new': F('PCA', 'pmd', 'Article 14', 'A new or expanded design space is written into the approval: partial change approval.'),
        'rtrt': F('PCA', 'reg47', 'Article 47(2)', 'Real-time release changes the specification and test methods: partial change approval.'),
        'continuous-mfg': F('PCA', 'reg47', 'Article 47(1)', 'Converting to continuous manufacturing changes the manufacturing method: partial change approval.'),
        'excipient-supplier': F('NONE', 'pmd', 'Article 14', 'Excipient suppliers are not approved matters: qualify the supplier under GMP.'),
        'coating-weight': X('A composition change', 5),
        'score-line': X('A change to the appearance and use of the tablet', 5),
        'tablet-shape': X('A change to the product description in the specification', 2),
        'tse-excipient': G('The origin of the excipient'),
        'dosage-form-new': F('NEW', 'pmd', 'Article 14', 'A new dosage form needs a new approval.', pi=True),
        'nitrosamine-control': G('The added test', ),
        'excipient-spec': G('The excipient specification'),
        'skip-testing': X('Reduced testing of a specification item', 2),
        'method-minor': G('The test method'),
        'micro-rapid': G('The microbiological test method'),
        'cc-supplier': F('NONE', 'pmd', 'Article 14', 'Packaging suppliers are not approved matters: qualify the supplier under GMP.'),
        'cc-device': G('The device'),
        'cc-noncontact': G('The packaging part'),
        'ds-retest': G('The re-test period'),
        'in-use-shelf-life': G('The in-use period'),
        'ds-storage': G('The storage condition'),
        'lab-new-route': F('NEW', 'pmd', 'Article 14', 'A new route of administration needs a new approval.', pi=True),
        'lab-brand-name': F('NEW', 'pmd', 'Article 14', 'A brand name cannot be changed by partial change: file a replacement new application.', pi=True),
        'lab-rmp': F('NOTIFY', 'pi', 'RMP submission', 'An updated RMP is submitted to PMDA; there is no approval step.', note='Simplified.'),
        'lab-psusa': NOTIFY_PI('Agreed safety wording is implemented by revising the package insert and notifying it.'),
        'lab-delete-indication': PCA_EFF('Deleting an indication is excluded from minor changes by Article 47(4): partial change approval.'),
        'ec-define': F('PCA', 'pmd', 'Article 14', 'In Japan the approval form already plays the role of established conditions; adding detail to it is a partial change.', note='Simplified.'),
        'plcm-update': F('NA', 'q12', 'ICH Q12', 'Japan does not use a separate PLCM document: the approval form and change plans play that role.'),
        'non-ec-change': Q('isEC', C('plcmCategory',
                                     prior=F('PCA', 'pmd', 'Article 14', 'An approved matter needing prior approval: partial change approval.'),
                                     moderate=F('MOD', 'mod24', 'Trial notice, Q1', 'A designated moderate change item: rapid moderate change review.'),
                                     low=F('MCN', 'pmd', 'Article 14', 'A minor change item: notify within 30 days.')),
                           F('NONE', 'pmd', 'Article 14', 'An element outside the approval form is managed in the quality system.')),
        'pacmp-change': C('pacmpAction', delete=F('NOTIFY', 'pacmp', 'Change plan', 'Withdrawing a confirmed change plan is notified.', note='Simplified.'),
                          minor=F('PLAN', 'pacmp', 'Change plan', 'Changing a confirmed plan needs a new confirmation.', note='Simplified.'),
                          major=F('PLAN', 'pacmp', 'Change plan', 'Changing a confirmed plan needs a new confirmation.')),
        'bio-scale': Q('bioScaleOnly', G('The scale'), X('A scale-up with process changes', 1)),
        'bio-media': Q('animalOrigin', X('Introducing a material of human or animal origin', 5), G('The raw material')),
        'bio-resin': C('resinChange', lifetime=G('The resin lifetime'), supplier=X('A different resin', 1)),
        'bio-potency': Q('potencyNewPrinciple', X('A new potency assay principle', 2), G('The potency test method')),
        'bio-formulation': X('A formulation change', 5),
        'bio-adventitious': C('adventRisk', first=X('New viral clearance claims', 3), higher=X('A higher-risk viral safety evaluation', 3), same=G('The viral safety data')),
        'admin-manufacturer-name': F('MCN', 'pmd', 'Article 14', 'A change in a manufacturer\'s name in the approval form is a minor change notification.'),
        'admin-local-rep': F('NOTIFY', 'pmd', 'Licence change notification', 'A change of the designated marketing authorisation holder for a foreign manufacturer, or of the safety manager, is notified.', note='Simplified.'),
        'admin-inn': F('MCN', 'pmd', 'Article 14', 'A new non-proprietary name (JAN) in the approval form is a minor change notification.', pi=True, note='Simplified.'),
        'admin-delete-presentation': C('presentationKind', strength=F('NOTIFY', 'pmd', 'Approval withdrawal', 'A strength is withdrawn by notifying the withdrawal of its approval.', note='Each strength has its own approval in Japan.'),
                                       pack=F('NONE', 'pmd', 'Article 14', 'Pack sizes are not approved matters: no filing.')),
    }
    return m.get(cid)


def run():
    catalogue = load('src', 'data', 'catalogue.json')
    entries = {}
    missing = []
    for ch in catalogue['changes']:
        e = entry(ch['id'])
        if e is None:
            missing.append(ch['id'])
            continue
        entries[ch['id']] = {'tree': e}
    if missing:
        raise SystemExit(f'Japan: no entry for {missing}')
    pack = {
        'id': 'jp', 'region': 'JP', 'label': 'Japan: MHLW and PMDA (PMD Act)', 'edition': '2026.1',
        'appliesFrom': '2025-02-13', 'appliesTo': None, 'status': 'in force',
        'summary': 'The approval form decides: approved matters need a partial change approval, minor change items a notification within 30 days, and items outside the form no filing. Article 47 keeps some changes out of the minor route. Includes the 2024 moderate change and 2025 annual report trials and the change plan (PACMP) system.',
        'sources': SOURCES, 'categories': cats(), 'conditions': {},
        'multipleChanges': {'rule': 'Related changes to one approval are made in one partial change application; minor change items can be notified together. The filing takes the highest category.', 'src': 'pmd', 'at': 'Article 14'},
        'filing': {'shared': ['MCN', 'JPAR', 'NOTIFY'], 'apart': ['NONE', 'NA']},
        'clocks': {
            'MCN': {'daysAfter': 30, 'label': 'Notify within 30 days after the change', 'src': 'pmd'},
            'JPAR': {'months': 12, 'label': 'Report once a year from the reference date', 'src': 'ar25'},
            'NOTIFY': {'label': 'Notify the revised document (for a package insert, before distributing it)', 'src': 'pi'},
            'PACMPN': {'workingDays': 40, 'label': 'Becomes an approved matter 40 working days after acceptance (20 in special cases)', 'src': 'pacmp'},
            'MOD': {'workingDays': 30, 'approx': True, 'label': 'Short review: the 2023 proposal aimed at about 30 working days after acceptance (trial; not a fixed rule)', 'src': 'survey'},
            'PCAR': {'months': 3, 'label': 'Rapid partial change: standard processing time about 3 months', 'src': 'rapid'},
            'PCA': {'monthsByKind': {'cmc': 6, 'efficacy': 12, 'labeling': 12, 'admin': 6}, 'monthsBio': 12, 'monthsPriority': 9,
                    'label': 'Quality changes: median about 6 months (chemical) or 12 months (biologics) in the 2023 survey, not a target. Indications and dosage: 12-month standard target (9 if priority)', 'src': 'survey'},
            'PLAN': {'months': 12, 'label': 'Change plan confirmation: 12-month target', 'src': 'pacmp'},
            'NEW': {'months': 12, 'monthsPriority': 9, 'label': 'New approval: 12-month standard target (9 if priority)', 'src': 'pmdaTarget'},
        },
        'm1': {
            'pca': [{'code': 'jp:cover', 'label': 'Cover letter'}, {'code': 'jp:1.2', 'label': 'Copy of the partial change approval application form (new and old comparison)'},
                    {'code': 'jp:1.12', 'label': 'List of attached documents'}, {'code': 'jp:1.13.1', 'label': 'Documents for the approved product (current approval form)'}],
            'new': [{'code': 'jp:cover', 'label': 'Cover letter'}, {'code': 'jp:1.2', 'label': 'Copy of the application form'}, {'code': 'jp:1.6', 'label': 'Information on use in foreign countries'}],
            'plan': [{'code': 'jp:cover', 'label': 'Cover letter'}, {'code': 'jp:1.2', 'label': 'Copy of the change plan confirmation application'}, {'code': 'jp:1.13.4', 'label': 'The change plan (PACMP)'}],
            'pi': [{'code': 'jp:1.8', 'label': 'Draft package insert'}],
            'notice': [{'code': 'jp:1.2', 'label': 'Notification form (filed electronically, not as an eCTD sequence)'}],
        },
        'm1map': {'PCA': ['pca'], 'PCAR': ['pca'], 'MOD': ['pca'], 'PLAN': ['plan'], 'NEW': ['new'], 'MCN': ['notice'], 'JPAR': ['notice'], 'NOTIFY': ['notice'], 'PACMPN': ['notice']},
        'ectd': {'PCA': {'submissionType': 'jp_partial-change', 'subType': 'jp_ctd'}, 'PCAR': {'submissionType': 'jp_partial-change', 'subType': 'jp_ctd'},
                 'MOD': {'submissionType': 'jp_partial-change', 'subType': 'jp_ctd'}, 'PLAN': {'submissionType': 'jp_change-plan', 'subType': 'jp_ctd'},
                 'NEW': {'submissionType': 'jp_original', 'subType': 'jp_ctd'}, 'MCN': None, 'JPAR': None, 'NOTIFY': None, 'PACMPN': None, 'NONE': None, 'NA': None},
        'changeLog': [{'edition': '2026.1', 'date': '2026-10-11', 'text': 'First Japan edition: approval-form logic with Article 47 exclusions, the 2024 moderate change and 2025 annual report trials, and change plans (PACMP).'}],
    }
    save(pack, DIR, 'pack.json')
    save(entries, DIR, 'entries.json')
    print('Japan:', len(entries), 'entries')


if __name__ == '__main__':
    run()
