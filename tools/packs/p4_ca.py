"""Canada pack (Health Canada Post-NOC changes), edition 2026.1."""
import copy
from lib import load, save, O, Q, C, A

DIR = 'src/packs/ca/2026.1'

SOURCES = {
    'fw': {'title': 'Post-Notice of Compliance (NOC) Changes: Framework Document (pharmaceutical drugs for human use)', 'version': 'Revised', 'date': '2020-03-30',
           'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes/framework-2019/document.html', 'status': 'final'},
    'qual': {'title': 'Post-Notice of Compliance (NOC) Changes: Quality Document, Appendix 1 (human pharmaceuticals)', 'version': 'Revision implemented 2019-07-31', 'date': 'page modified 2025-01-22',
             'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes/quality-document.html', 'status': 'final'},
    'fwbio': {'title': 'Guidance on post-notice of compliance changes: Framework for biologic and Schedule C drugs for human use', 'version': 'Revised', 'date': '2026-05-15',
              'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes/framework-biologic-schedule-c-drugs-human-use.html', 'status': 'final'},
    'qbio': {'title': 'Guidance on post-notice of compliance changes: Quality for biologics', 'version': 'Revised', 'date': '2026-05-15',
             'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes/quality-biologics.html', 'status': 'final'},
    'se': {'title': 'Post-NOC Changes: Safety and Efficacy Document (pharmaceutical, biologic and radiopharmaceutical drugs)', 'version': 'Revised', 'date': '2020-04-01',
           'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes/safety-efficacy-2019/document.html', 'status': 'final'},
    'perf': {'title': 'Performance standards for the Fees in Respect of Drugs and Medical Devices Order (review 1 targets)', 'version': 'Current', 'date': 'read 2026-10-11',
             'url': 'https://www.canada.ca/en/health-canada/services/publications/drugs-health-products/performance-fees-drugs-medical-devices.html', 'status': 'goal'},
    'q12': {'title': 'Health Canada: implementation of ICH Q12 and Q14 (notice on the post-NOC changes page)', 'version': 'Notice', 'date': '2026',
            'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/post-notice-compliance-changes.html', 'status': 'final'},
    'q8': {'title': 'ICH Q8(R2) Pharmaceutical Development, adopted by Health Canada', 'version': 'R2', 'date': 'adopted',
           'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/international-conference-harmonisation/quality.html', 'status': 'final'},
    'mds': {'title': 'Guidance on management of drug submissions and applications', 'version': 'Current', 'date': 'read 2026-10-11',
            'url': 'https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/management-drug-submissions-applications/review.html', 'status': 'final'},
}

CATS = [
    ('NA', 0, 'Not available', 'Not available in Canada yet', 'other', 'Route not available',
     'This route is not available in Canada yet; classify the underlying change in its own entry.', 'q12', 'ICH Q12 notice', 'letter'),
    ('REC', 0, 'Level IV', 'Level IV: record of change', 'do', 'Record under GMP',
     'Implement without prior review; keep the record under GMP and annotate the documents in the next Level I or II filing.', 'fw', '2.1.5', 'letter'),
    ('L3', 1, 'Level III', 'Level III: notice of change (annual notification)', 'do-and-tell', 'Do, then notify',
     'Implement without prior review, then file the Level III form: pharmaceuticals at implementation (recommended) or in the annual notification; biologics within 12 months. Data within 30 days if asked.', 'fw', '2.1.4', 'ar'),
    ('L3IN', 2, 'Level III-IN', 'Level III: immediate notification', 'do-and-tell', 'Notify around implementation',
     'Notify Health Canada from 21 days before to 14 days after implementing; data within 30 days if asked.', 'fwbio', 'Level III immediate notification', 'cbe0'),
    ('ADMIN', 2, 'Admin', 'Administrative submission', 'tell-and-wait', 'Administrative processing',
     'File an administrative submission (no scientific review) and implement when Health Canada has processed it.', 'mds', 'Administrative submissions', 'cbe0'),
    ('NC', 3, 'Level II NC', 'Level II: notifiable change (biologics)', 'wait-for-approval', 'Wait for a no objection letter',
     'File a notifiable change; implement only after Health Canada issues a No Objection Letter. Review target 90 days.', 'fwbio', 'Level II notifiable change', 'cbe30'),
    ('L2S', 3, 'Level II-S', 'Level II: supplement (safety)', 'wait-for-approval', 'Wait for approval',
     'File a Level II supplement (safety) for risk-management labelling changes and implement once it is accepted.', 'fw', '2.1.2', 'cbe30'),
    ('L1', 4, 'Level I', 'Level I: supplement (SNDS or SANDS)', 'wait-for-approval', 'Wait for a NOC',
     'File a supplement (SNDS, or SANDS for a generic) and implement only after the Notice of Compliance.', 'fw', '2.1.1', 'pas'),
]


def cats():
    return [{'id': i, 'rank': r, 'short': s, 'label': l, 'implement': im, 'badge': b, 'rule': ru, 'src': src, 'at': at, 'tone': t}
            for (i, r, s, l, im, b, ru, src, at, t) in CATS]


COND = {}


def cond(item, *texts):
    keys = []
    for n, t in enumerate(texts, 1):
        k = f'HC-{item}:{n}'
        COND[k] = {'text': t}
        keys.append(k)
    return keys


# Shared condition sets (the app's shorthand of the Appendix 1 conditions).
DS_SITE = cond('A1.2', 'The drug substance is a discrete chemical entity.', 'There is no Level I change to the route of synthesis or to the specification.',
               'Evidence of GMP compliance is available for the new site, and it is listed on the establishment licence where needed.', 'The impurity profile and physical properties are unchanged.')
DS_PROC = cond('A1.4', 'Same physical state, and the same polymorph and particle size where solubility matters.', 'Same route of synthesis; no new impurity above 0.10% and no higher levels.',
               'Sterilisation of the drug substance is not affected.', 'The drug substance is a discrete chemical entity.', 'No Level I change to the specification.')
DS_SCALE = cond('A1.5', 'No Level I change to the specification.', 'Sterilisation of the drug substance is not affected.', 'The drug substance is a discrete chemical entity.')
DP_SITE = cond('A1.23', 'The new site holds an establishment licence or is listed on one, with evidence of GMP compliance.', 'The manufacturing process and controls are the same, with equipment of the same class and operating principle.',
               'The process is validated at the new site (or a validation protocol is in place).', 'No Level I change to the specification.', 'The product is not sterile, or the new site already makes similar sterile products.')
DP_SCALE = cond('A1.24', 'Equipment of the same class and operating principle.', 'The process is validated at the new scale.', 'No Level I change to the specification.',
                'For a modified-release product, dissolution profiles are comparable.')
DP_PROC = cond('A1.25', 'Same type of process and the same operating principle.', 'No change to the specification apart from tightening.', 'The process is validated.',
               'Release characteristics and sterility assurance are not affected.')
IR_COMP = cond('A1.16', 'Excipients stay qualitatively the same (except colours or flavours not used for taste-masking).', 'Quantitative changes stay within the Appendix 6 ranges.',
               'Release rate and other performance characteristics are unaffected.', 'Excipients do not affect absorption or solubility.')
MARK = cond('A1.18', 'Performance characteristics such as release rate are not affected.', 'Safety and efficacy are not affected (strength identification is kept).')
SHAPE = cond('A1.20', 'No change to the qualitative and quantitative composition or to the mean mass.', 'Release characteristics are not affected.', 'It is not a scored tablet.')
CEP = cond('A1.2c', 'A valid CEP covers the new source and its specification is met.', 'No Level I change to the drug substance specification.', 'The impurity profile and physical properties are unchanged.')
CC_NS = cond('A1.33', 'The product is not sterile.', 'The new system gives the same or better protection.', 'Functional packaging (dose delivery) is not affected.')
BIO_DS = cond('Q-bio.2a', 'The new facility is in an existing approved site or under the same QA/QC oversight.', 'Same process, equipment class and controls.', 'Process validation done.',
              'Comparability shown for the batches made.', 'No change to the specification.')
BIO_DP = cond('Q-bio.43', 'Same filling process, equipment class and controls.', 'The new facility is under the same QA/QC oversight or already makes similar products.', 'Process validation and media fills done.')


def L(cat, src, at, why, **kw):
    return O(cat, src, at, why, **kw)


def pharma(cid, eu_old):
    q = 'qual'
    m = {
        'dp-site-move': A(DP_SITE, L('L3', q, 'A1 item 23', 'A new or replacement site for drug product manufacture meeting the conditions is Level III.'),
                          L('L1', q, 'A1 item 23', 'A condition for Level III is not met, so the site change is a supplement (Level I).')),
        'ds-site-move': A(DS_SITE, L('L3', q, 'A1 item 2', 'A new or replacement drug substance site meeting the conditions is Level III.'),
                          L('L1', q, 'A1 item 2', 'A condition for Level III is not met: supplement (Level I).')),
        'ds-intermediate-site': A(DS_SITE, L('L3', q, 'A1 item 2', 'A new site for an intermediate meeting the conditions is Level III.'), L('L1', q, 'A1 item 2', 'A condition for Level III is not met: supplement.')),
        'primary-pack-site': A(DP_SITE, L('L3', q, 'A1 item 23', 'A new primary packaging site meeting the conditions is Level III.'), L('L1', q, 'A1 item 23', 'A condition is not met: supplement.')),
        'secondary-pack-site': L('REC', 'fw', '2.1.5', 'A secondary packaging site has no expected effect on quality: Level IV record.', note='Simplified: the site must still hold or be on an establishment licence.'),
        'labeling-site': L('REC', 'fw', '2.1.5', 'A labelling site has no expected effect on quality: Level IV record.', note='Simplified.'),
        'testing-site': L('L3', q, 'A1 item 2', 'A change of testing site is an annual notification (Level III) with no conditions.'),
        'ink-imprint-site': L('L3', q, 'A1 item 23', 'A new site for a manufacturing step such as imprinting is Level III when the process is unchanged.', note='Simplified.'),
        'component-sterilization-site': Q('affectsSterility', L('L1', q, 'A1 item 23', 'A change that may affect sterility assurance is a supplement.'), L('L3', q, 'A1 item 23', 'A validated contract sterilisation site with the same process is Level III.')),
        'fill-line-add': Q('lineDuplicate', L('L3', q, 'A1 item 25', 'A duplicate of an approved line with the same validated process is Level III.', note='Simplified.'), L('L1', q, 'A1 item 25', 'A new or different filling line for a sterile product is a supplement.')),
        'dp-equipment-same': L('REC', 'fw', '2.1.5', 'Equipment of the same design and operating principle is a Level IV record.', note='Simplified: listed with the Level IV examples.'),
        'dp-process-change': A(DP_PROC, L('L3', q, 'A1 item 25', 'A process change meeting the conditions is Level III.'), L('L1', q, 'A1 item 25', 'A condition for Level III is not met: supplement.')),
        'dp-scale': A(DP_SCALE, L('L3', q, 'A1 item 24', 'A batch size change meeting the conditions is Level III.'), L('L1', q, 'A1 item 24', 'A condition for Level III is not met: supplement.')),
        'ds-route-new': L('L1', q, 'A1 item 4', 'A new route of synthesis is a supplement (Level I).'),
        'ds-process-change': A(DS_PROC, L('L3', q, 'A1 item 4', 'A drug substance process change meeting conditions 1 to 8 is Level III.'), L('L1', q, 'A1 item 4', 'A condition for Level III is not met: supplement.')),
        'ds-starting-material': L('L1', q, 'A1 item 4', 'Redefining the starting material changes what is controlled under GMP: supplement.', note='Simplified.'),
        'dp-reprocessing': L('L1', q, 'A1 item 25', 'Adding a reprocessing step is a supplement.', note='Simplified.'),
        'dp-ink': A(MARK, L('L3', q, 'A1 item 18', 'A change in markings or ink meeting the conditions is Level III.'), L('L1', q, 'A1 item 18', 'A condition is not met: supplement.')),
        'dp-emboss': A(MARK, L('L3', q, 'A1 item 18', 'A change in embossing or debossing meeting the conditions is Level III.'), L('L1', q, 'A1 item 18', 'A condition is not met: supplement.')),
        'dp-order-addition': L('REC', 'fw', '2.1.5', 'A minor change in the order of addition, validated, is a Level IV record.', note='Simplified.'),
        'sterile-filter': Q('filterMaterialPore', L('L3', q, 'A1 item 25', 'Same filter material and pore size, validated: Level III.'), L('L1', q, 'A1 item 25', 'A different filter material or pore size may affect sterility assurance: supplement.')),
        'sterilization-method': L('L1', q, 'A1 item 25', 'A change in the sterilisation method is a supplement.'),
        'depyrogenation': L('L3', q, 'A1 item 25', 'A validated change to a depyrogenation process is Level III.', note='Simplified.'),
        'inprocess-filtration-remove': L('L3', q, 'A1 item 26', 'Removing a non-sterilising in-process filtration, with data, is Level III.', note='Simplified.'),
        'control-increase': L('L3', q, 'A1 item 26', 'Adding in-process controls is Level III.'),
        'excipient-change': Q('mr', L('L1', q, 'A1 item 17', 'A composition change in a modified-release product is a supplement.'),
                              A(IR_COMP, L('L3', q, 'A1 item 16', 'A composition change in an immediate-release form within the conditions is Level III.'), L('L1', q, 'A1 item 16', 'A condition for Level III is not met: supplement.'))),
        'colour-flavour-delete': A(IR_COMP, L('L3', q, 'A1 item 16', 'Deleting or reducing a colour or flavour within the conditions is Level III.'), L('L1', q, 'A1 item 16', 'A condition is not met: supplement.')),
        'new-strength': L('L1', q, 'A1 item 14', 'A new strength is a supplement (Level I).', pi=True),
        'spec-tighten': L('L3', q, 'A1 items 8 and 31', 'Tightening an acceptance criterion is Level III.'),
        'spec-relax': Q('compendial', L('L3', q, 'A1 items 8 and 31', 'Relaxing a limit to match compendial or ICH criteria is Level III.'), L('L1', q, 'A1 items 8 and 31', 'Other relaxations are a supplement.')),
        'spec-delete-test': Q('significantQuality', L('L1', q, 'A1 items 8 and 31', 'Deleting a test that matters for quality is a supplement.'),
                              L('L3', q, 'A1 items 8 and 31', 'Deleting a redundant test (for example supported by at least 10 batches) not prompted by failures is Level III.')),
        'spec-add-test': L('L3', q, 'A1 items 8 and 31', 'Adding a test and limit is Level III.'),
        'spec-compendial': L('L3', q, 'A1 item 7', 'Updating a specification to an updated monograph is Level III.'),
        'method-change': Q('sameOrBetter', L('L3', q, 'A1 items 9 and 32', 'A replacement procedure that is validated and at least equivalent is Level III.'), L('L1', q, 'A1 items 9 and 32', 'A procedure that gives less assurance is a supplement.', note='Simplified.')),
        'method-new-regulatory': L('L3', q, 'A1 items 9 and 32', 'Adding an analytical procedure is Level III.'),
        'method-alternative': L('L3', q, 'A1 items 9 and 32', 'Adding or changing an alternative procedure is Level III.'),
        'method-components': L('L3', q, 'A1 item 32', 'A change to a test method for components or in-process materials is Level III.', note='Simplified.'),
        'method-raw-material': L('REC', 'fw', '2.1.5', 'A test method for raw materials used early in the synthesis is a Level IV record.', note='Simplified.'),
        'cc-polymer': A(CC_NS, L('L3', q, 'A1 item 33', 'A new primary container material for a non-sterile product with equal protection is Level III.'), L('L1', q, 'A1 item 33', 'A condition is not met: supplement.')),
        'cc-sterile': L('L1', q, 'A1 item 33', 'A change to the container closure system of a sterile product is a supplement.'),
        'cc-dose-device': L('L1', q, 'A1 item 33', 'A change to packaging that controls the dose is a supplement.'),
        'cc-closure-solid': A(CC_NS, L('L3', q, 'A1 item 33', 'A closure change for a solid oral product with equal protection is Level III.'), L('L1', q, 'A1 item 33', 'A condition is not met: supplement.')),
        'cc-closure-liquid': A(CC_NS, L('L3', q, 'A1 item 33', 'A closure change for a non-sterile liquid with equal protection is Level III.'), L('L1', q, 'A1 item 33', 'A condition is not met: supplement.')),
        'cc-size-shape': Q('sterile', L('L1', q, 'A1 item 33', 'A size or shape change for a sterile container is a supplement.', note='Simplified.'), L('L3', q, 'A1 item 33', 'A size or shape change for a non-sterile container is Level III.')),
        'cc-count': L('L3', q, 'A1 item 34', 'A change in package size or fill is Level III.', pi=True),
        'cc-desiccant': L('L3', q, 'A1 item 33', 'Adding, changing or removing a desiccant, with data, is Level III.'),
        'cc-blister': A(CC_NS, L('L3', q, 'A1 item 33', 'A blister change for a non-sterile solid with equal protection is Level III.'), L('L1', q, 'A1 item 33', 'A condition is not met: supplement.')),
        'cc-secondary-protective': Q('sameOrBetterProtection', L('L3', q, 'A1 item 33', 'Deleting secondary packaging that gives no needed protection is Level III.'), L('L1', q, 'A1 item 33', 'Removing protection the product needs is a supplement.')),
        'cc-cap-colour': L('REC', 'fw', '2.1.5', 'A cap colour change is a Level IV record.'),
        'shelf-life-extend': Q('approvedProtocolFullData', L('L3', q, 'A1 item 37', 'An extension based on real-time data under the approved protocol is Level III.'), L('L1', q, 'A1 item 37', 'An extension without full real-time data under the approved protocol is a supplement.')),
        'shelf-life-reduce': L('L3', q, 'A1 item 37', 'A shorter shelf life is Level III.', pi=True),
        'stability-protocol': L('L3', q, 'A1 item 13', 'A change to the post-approval stability protocol or commitment is Level III.'),
        'storage-conditions': Q('restrictive', L('L3', q, 'A1 item 38', 'More restrictive storage conditions are Level III.', pi=True), L('L1', q, 'A1 item 38', 'Less restrictive storage conditions are a supplement.', pi=True)),
        'reference-standard': L('L3', q, 'A1 item 9', 'A new in-house reference standard qualified against the approved one is Level III.', note='Simplified.'),
        'lab-new-indication': L('L1', 'se', 'Level I', 'A new indication is a Level I supplement (SNDS).', pi=True),
        'lab-population': L('L1', 'se', 'Level I', 'A change in population or dosing based on new clinical data is a Level I supplement.', pi=True),
        'lab-clinical-section': L('L1', 'se', 'Level I', 'Product monograph changes based on new clinical data are a Level I supplement.', pi=True, note='Simplified.'),
        'lab-safety-add': L('L2S', 'se', 'Level II supplement (safety)', 'Adding or strengthening risk-management text is a Level II supplement (safety).', pi=True),
        'lab-dosing-safety': L('L2S', 'se', 'Level II supplement (safety)', 'A dosing instruction for safer use is a Level II supplement (safety).', pi=True),
        'lab-delete-claim': L('L2S', 'se', 'Level II supplement (safety)', 'Removing unsupported claims is filed as a Level II supplement.', pi=True, note='Simplified.'),
        'lab-505o4': L('L2S', 'se', 'Level II supplement (safety)', 'Health Canada can require a label change (section 21.2 of the Food and Drugs Act); the change is filed as a Level II supplement (safety).', pi=True, note='The US 505(o)(4) process has no exact Canadian twin.'),
        'lab-rld-update': L('L2S', 'se', 'Level II supplement (safety)', 'A generic following safety changes in the Canadian reference product files a Level II supplement.', pi=True, note='Simplified: non-safety updates can be Level III.'),
        'lab-editorial': L('L3', 'se', 'Level III', 'Editorial labelling changes are Level III.', pi=True),
        'lab-layout': L('L3', 'se', 'Level III', 'A change in label layout that does not change content is Level III.', pi=True, note='Simplified.'),
        'cp-submit': L('NA', 'q12', 'ICH Q12 notice', 'Health Canada accepts PACMPs only for biologic and radiopharmaceutical products for now; implementation for pharmaceutical drugs is to be announced.'),
        'cp-use': L('NA', 'q12', 'ICH Q12 notice', 'No PACMP route yet for pharmaceutical drugs; classify the change in its own entry.'),
        'be-study-change': L('L1', q, 'A1 items 15 to 17', 'A change that needs a new comparative bioavailability study is a supplement.'),
        'admin-ownership': L('ADMIN', 'mds', 'Administrative submissions', 'A change of sponsor is an administrative submission (no scientific review).', pi=True),
        'admin-name-address': L('ADMIN', 'mds', 'Administrative submissions', 'A change in the sponsor\'s name or address is an administrative submission.', pi=True),
        # new in phase 4
        'ds-cep': Q('cepCovers', A(CEP, L('L3', q, 'A1 item 2', 'A CEP-supported source meeting the conditions is Level III.'), L('L1', q, 'A1 item 2', 'A condition is not met: supplement.')),
                    Q('dsSameRoute', A(DS_SITE, L('L3', q, 'A1 item 2', 'A master-file-supported source with the same route, meeting the conditions, is Level III.'), L('L1', q, 'A1 item 2', 'A condition is not met: supplement.')),
                      L('L1', q, 'A1 item 4', 'A source with a different route of synthesis is a supplement.'))),
        'batch-release-site': L('L3', q, 'A1 item 2', 'Canada has no batch release site as such; a new release testing site is Level III.', note='Release in Canada rests with the importer or distributor under GMP (Division 2).'),
        'site-delete': L('L3', q, 'A1 item 3', 'Deleting a manufacturing site or manufacturer is Level III.'),
        'ds-scale': A(DS_SCALE, L('L3', q, 'A1 item 5', 'A drug substance batch size change meeting the conditions is Level III.'), L('L1', q, 'A1 item 5', 'A condition is not met: supplement.')),
        'ipc-tighten': L('L3', q, 'A1 item 26', 'Tightening an in-process limit is Level III.'),
        'ipc-relax': Q('ipcCritical', L('L1', q, 'A1 item 26', 'Widening a critical in-process limit or deleting a significant test is a supplement.'), L('L3', q, 'A1 item 26', 'A non-critical in-process change is Level III.', note='Simplified.')),
        'hold-time': Q('holdData', L('L3', q, 'A1 item 25', 'A longer hold time supported by data is Level III.', note='Simplified.'), L('L1', q, 'A1 item 25', 'A longer hold time without supporting data is a supplement.')),
        'design-space-within': L('REC', 'q8', 'Design space', 'Working within an approved design space is not a change: record it in the quality system.'),
        'design-space-new': L('L1', 'q8', 'Design space', 'A new or expanded design space is assessed by Health Canada: supplement.'),
        'rtrt': L('L1', q, 'A1 items 8 and 31', 'Replacing end-product tests with real-time release (like parametric release) is a supplement.'),
        'continuous-mfg': L('L1', q, 'A1 item 25', 'Converting to continuous manufacturing is a supplement.'),
        'excipient-supplier': L('REC', 'fw', '2.1.5', 'A new supplier of the same excipient grade meeting the specification is a Level IV record.', note='Simplified.'),
        'coating-weight': Q('mr', L('L1', q, 'A1 item 17', 'A coating change for a modified-release product is a supplement.'),
                            A(IR_COMP, L('L3', q, 'A1 item 16', 'A film-coat or capsule shell change within the conditions is Level III.'), L('L1', q, 'A1 item 16', 'A condition is not met: supplement.'))),
        'score-line': Q('mr', L('L1', q, 'A1 item 19', 'A score line on a modified-release product is a supplement.'),
                        C('scoreAction', add=L('L3', q, 'A1 item 19.2', 'Adding a score line meeting the conditions is Level III.', pi=True, note='For a generic, a score line that differs from the Canadian reference product is a supplement (19.1).'),
                          delete=L('L3', q, 'A1 item 19.3', 'Deleting a score line meeting the conditions is Level III.', pi=True, note='For a generic, scoring must match the Canadian reference product.'))),
        'tablet-shape': A(SHAPE, L('L3', q, 'A1 item 20', 'A shape or dimension change meeting the conditions is Level III.', pi=True), L('L1', q, 'A1 item 20', 'A condition is not met: supplement.')),
        'tse-excipient': L('L3', q, 'A1 items 28 and 29', 'Moving an excipient away from a TSE-risk source is Level III.'),
        'dosage-form-new': L('L1', q, 'A1 item 14', 'A new dosage form is a supplement (Level I).', pi=True),
        'nitrosamine-control': L('L3', q, 'A1 item 31', 'Adding a test and limit is Level III.', note='Check Health Canada\'s nitrosamine guidance for the expected limits and timing.'),
        'excipient-spec': C('excipientSpecKind', tighten=L('L3', q, 'A1 excipient items', 'Tightening an excipient limit is Level III.'), add=L('L3', q, 'A1 excipient items', 'Adding an excipient test is Level III.'),
                            delete=L('L3', q, 'A1 excipient items', 'Deleting a non-significant excipient test is Level III.'), relax=L('L1', q, 'A1 excipient items', 'Widening an excipient limit is a supplement.', note='Simplified.')),
        'skip-testing': L('L1', q, 'A1 item 31', 'Reduced testing of a release test changes the specification: supplement.', note='Simplified.'),
        'method-minor': L('L3', q, 'A1 items 9 and 32', 'A minor change to an approved procedure is Level III.', note='Adjustments within the method\'s allowed ranges may be Level IV.'),
        'micro-rapid': Q('sterile', L('L1', q, 'A1 item 8', 'Replacing the sterility test with an alternative microbiological method is a supplement.'), L('L3', q, 'A1 item 32', 'A validated rapid method for a non-sterile product is Level III.')),
        'cc-supplier': L('L3', q, 'A1 item 33', 'A new supplier of the same component, same material and specification, is Level III.', note='Simplified.'),
        'cc-device': Q('deviceSignificant', L('L1', q, 'A1 item 33', 'A device change that affects dosing is a supplement.', pi=True), L('L3', q, 'A1 item 33', 'A change to a co-packaged measuring device that does not affect dosing is Level III.', pi=True)),
        'cc-noncontact': L('L3', q, 'A1 item 33', 'A change to a packaging part that does not touch the product is Level III.', note='Simplified.'),
        'ds-retest': L('L3', q, 'A1 item 11', 'A change in the drug substance re-test period is Level III (with data on at least two batches).'),
        'in-use-shelf-life': C('inUseKind', reduce=L('L3', q, 'A1 item 37', 'A shorter in-use period is Level III.', pi=True), extendReal=L('L3', q, 'A1 item 37', 'A longer in-use period based on real-time data is Level III.', pi=True),
                               extendModel=L('L1', q, 'A1 item 37', 'An extension based on extrapolation is a supplement.', pi=True)),
        'ds-storage': L('L3', q, 'A1 item 12', 'A change in drug substance storage conditions is Level III.'),
        'lab-new-route': L('L1', 'se', 'Level I', 'A new route of administration is a Level I supplement.', pi=True),
        'lab-brand-name': L('ADMIN', 'mds', 'Administrative submissions', 'A new brand name alone is an administrative submission (with a look-alike sound-alike assessment).', pi=True),
        'lab-rmp': C('rmpKind', agreed=L('L3', 'se', 'Level III', 'Implementing agreed RMP wording is filed as Level III.', note='Simplified: see Health Canada\'s RMP guidance.'),
                     minor=L('L3', 'se', 'Level III', 'A minor RMP update is filed as Level III.', note='Simplified.'),
                     new=L('L2S', 'se', 'Level II supplement (safety)', 'An RMP change based on new safety data is filed with a Level II supplement.', note='Simplified.')),
        'lab-psusa': L('L2S', 'se', 'Level II supplement (safety)', 'Adding or strengthening agreed safety wording is a Level II supplement (safety).', pi=True),
        'lab-delete-indication': L('L2S', 'se', 'Level II', 'Deleting an indication is filed as a Level II supplement.', pi=True, note='Simplified.'),
        'ec-define': L('NA', 'q12', 'ICH Q12 notice', 'Health Canada has not implemented established conditions yet (details to follow).'),
        'plcm-update': L('NA', 'q12', 'ICH Q12 notice', 'Without established conditions there is no PLCM document to update in Canada yet.'),
        'non-ec-change': L('NA', 'q12', 'ICH Q12 notice', 'Established conditions are not implemented in Canada yet, so every element of the dossier follows the normal levels: classify the change in its own entry.'),
        'pacmp-change': L('NA', 'q12', 'ICH Q12 notice', 'No PACMP route yet for pharmaceutical drugs.'),
        'admin-manufacturer-name': L('L3', q, 'A1 item 1', 'A change in a manufacturer\'s name, with no move, is Level III.', note='Simplified.'),
        'admin-local-rep': L('REC', 'fw', '2.1.5', 'A new importer or contact is not a post-NOC change; update the establishment licence and contact details.', note='Simplified.'),
        'admin-inn': L('L3', 'se', 'Level III', 'Updating the labelling for a new proper name is Level III.', pi=True, note='Simplified.'),
        'admin-delete-presentation': C('presentationKind', strength=L('ADMIN', 'mds', 'Administrative', 'Stopping the sale of a strength is a discontinuation, reported to Health Canada within 30 days (section C.01.014.7).', note='Not a post-NOC submission.'),
                                       pack=L('L3', q, 'A1 item 34', 'Deleting a pack size is Level III.')),
    }
    return m.get(cid)


def biologic(cid):
    b = 'qbio'
    m = {
        'dp-site-move': A(BIO_DP, L('NC', b, 'Drug product facility', 'A drug product facility change meeting the conditions is a notifiable change.'), L('L1', b, 'Drug product facility', 'A condition is not met: supplement.')),
        'ds-site-move': A(BIO_DS, L('NC', b, 'Table 2a', 'A new or replacement drug substance facility meeting conditions 1 to 5 is a notifiable change.'), L('L1', b, 'Table 2a', 'A condition is not met: supplement.')),
        'testing-site': L('L3', b, 'Testing facilities', 'A new testing facility using approved procedures is an annual notification.', note='Simplified: bioassay transfers may need more.'),
        'secondary-pack-site': L('L3', b, 'Packaging facilities', 'A secondary packaging facility change is an annual notification.', note='Simplified.'),
        'labeling-site': L('L3', b, 'Packaging facilities', 'A labelling facility change is an annual notification.', note='Simplified.'),
        'fill-line-add': Q('lineDuplicate', L('NC', b, 'Drug product facility', 'A duplicate filling line with the same process is a notifiable change.'), L('L1', b, 'Drug product facility', 'A new or different filling line is a supplement.')),
        'component-sterilization-site': L('L3', b, 'Container closure', 'A validated sterilisation site for components is an annual notification.', note='Simplified.'),
        'dp-equipment-same': L('L3', b, 'Equipment', 'Equipment of the same design and principle is an annual notification.', note='Simplified.'),
        'dp-process-change': Q('majorImpact', L('L1', b, 'Manufacturing process', 'A major process change needs a supplement.'), L('NC', b, 'Manufacturing process', 'Other process changes are notifiable changes.', note='Simplified.')),
        'dp-scale': Q('bioMinorParam', L('NC', b, 'Table 6a', 'A scale change with proportional materials and the same bioreactor type is a notifiable change.'), L('L1', b, 'Table 6a', 'A scale change with process changes is a supplement.')),
        'excipient-change': L('L1', b, 'Table 38a', 'A formulation change is a supplement.'),
        'spec-tighten': L('L3', b, 'Table 25g', 'Tightening an acceptance criterion within the approved range is an annual notification.'),
        'spec-relax': L('NC', b, 'Table 25f', 'Relaxing an acceptance criterion is a notifiable change.'),
        'spec-delete-test': L('NC', b, 'Table 25a', 'Deleting a test is a notifiable change.'),
        'spec-add-test': L('L3', b, 'Specifications', 'Adding a test is an annual notification.', note='Simplified.'),
        'spec-compendial': L('L3', b, 'Specifications', 'A change to meet the pharmacopoeia is an annual notification.'),
        'method-change': Q('bioMethodMajor', L('NC', b, 'Table 25c and 25d', 'A procedure change affecting technique or performance is a notifiable change.'), L('L3', b, 'Table 25d', 'A minor change meeting conditions 3 to 7 is an annual notification.')),
        'method-new-regulatory': L('NC', b, 'Table 25c', 'A new regulatory procedure is a notifiable change.', note='Simplified.'),
        'method-alternative': L('L3', b, 'Table 25c', 'An alternative pharmacopoeial procedure is an annual notification.'),
        'method-components': L('L3', b, 'Analytical procedures', 'A change to a component test method is an annual notification.', note='Simplified.'),
        'cc-polymer': L('L1', b, 'Container closure', 'A change to the primary container of a biologic drug product is a supplement.', note='Simplified: for the drug substance container it is a notifiable change (Table 33).'),
        'cc-sterile': L('L1', b, 'Container closure', 'A change to the primary container of a sterile biologic is a supplement.', note='Simplified.'),
        'cc-size-shape': L('NC', b, 'Container closure', 'A container size or shape change is a notifiable change.', note='Simplified.'),
        'cc-count': L('L3', b, 'Packaging', 'A change in the number of units per pack is an annual notification.', pi=True),
        'cc-dose-device': L('L1', b, 'Container closure', 'A change to a dose-controlling device is a supplement.'),
        'cc-secondary-protective': L('NC', b, 'Container closure', 'Removing protective secondary packaging is a notifiable change.', note='Simplified.'),
        'cc-cap-colour': L('REC', 'fwbio', 'Level IV', 'A cap colour change has no reported impact: managed under the quality system.'),
        'shelf-life-extend': Q('approvedProtocolFullData', L('L3', b, 'Table 35a', 'An extension under the approved stability protocol (conditions 1 to 5) is an annual notification.'), L('NC', b, 'Table 35a', 'Other extensions are notifiable changes.')),
        'shelf-life-reduce': L('L3', b, 'Stability', 'A shorter shelf life is an annual notification.', note='Simplified.', pi=True),
        'stability-protocol': L('L3', b, 'Stability', 'A change to the stability protocol is an annual notification.', note='Simplified.'),
        'storage-conditions': L('NC', b, 'Stability', 'A change in storage conditions is a notifiable change.', pi=True, note='Simplified.'),
        'reference-standard': L('NC', b, 'Reference standards', 'A new in-house reference standard for a biologic is a notifiable change.', note='Qualified under an approved protocol it may be an annual notification.'),
        'sterile-filter': Q('filterMaterialPore', L('L3', b, 'Manufacturing process', 'Same filter material and pore size, validated, is an annual notification.'), L('NC', b, 'Manufacturing process', 'A different sterilising filter is a notifiable change.')),
        'sterilization-method': L('L1', b, 'Manufacturing process', 'A new sterilisation method is a supplement.'),
        'depyrogenation': L('NC', b, 'Manufacturing process', 'A change to depyrogenation is a notifiable change.', note='Simplified.'),
        'inprocess-filtration-remove': L('NC', b, 'Manufacturing process', 'Removing an in-process filtration is a notifiable change.', note='Simplified.'),
        'control-increase': L('L3', b, 'Table 18', 'Adding in-process controls is an annual notification.', note='Simplified.'),
        'bio-mcb': L('L1', b, 'Table 12b', 'A new master cell bank is a supplement; it is a notifiable change only when made from a pre-approved bank (condition 1).'),
        'bio-wcb': Q('wcbApprovedProtocol', L('L3', b, 'Table 12d', 'A new working cell bank from the approved master bank, at the approved passage level and under the approved protocol, is an annual notification.'),
                     L('NC', b, 'Table 12d', 'A working cell bank not meeting conditions 2 to 4 is a notifiable change.')),
        'bio-purification': Q('bioResinMinor', L('NC', b, 'Purification', 'A minor purification change is a notifiable change.'), L('L1', b, 'Purification', 'A new step, resin or column is a supplement.')),
        'bio-viral': L('L1', b, 'Viral clearance', 'A change to a virus removal or inactivation step is a supplement.'),
        'cp-submit': L('NC', 'fwbio', 'PACMP', 'From November 2026 Health Canada accepts PACMPs for biologic and radiopharmaceutical products; the app treats a stand-alone protocol as a notifiable change.',
                       note='Simplified: the framework describes how protocols are filed. Submissions are accepted after a 90-day coming-into-effect period that started on 13 August 2026.'),
        'cp-use': C('caProtocolLevel', NC=L('NC', 'fwbio', 'PACMP', 'The approved protocol set a notifiable change.'), L3IN=L('L3IN', 'fwbio', 'PACMP', 'The approved protocol set an immediate notification (only when conditions are met and the agreed data are available).'),
                    L3=L('L3', 'fwbio', 'PACMP', 'The approved protocol set an annual notification.')),
        'pacmp-change': C('pacmpAction', delete=L('L3', 'fwbio', 'PACMP', 'Withdrawing an approved protocol is an annual notification.', note='Simplified.'),
                          minor=L('NC', 'fwbio', 'PACMP', 'A minor protocol change is a notifiable change.', note='Simplified.'), major=L('NC', 'fwbio', 'PACMP', 'A major protocol change is filed like a new protocol.', note='Simplified.')),
        'bio-scale': Q('bioScaleOnly', L('NC', b, 'Table 6a', 'A scale change with proportional materials and the same bioreactor type is a notifiable change.'), L('L1', b, 'Table 6a', 'A scale-up with process changes is a supplement.')),
        'bio-media': Q('animalOrigin', L('L1', b, 'Raw materials', 'Introducing a material of human or animal origin is a supplement.'), L('NC', b, 'Raw materials', 'Other raw material changes are notifiable changes.', note='Simplified.')),
        'bio-resin': C('resinChange', lifetime=L('L3', b, 'Purification', 'More resin cycles under an approved protocol is an annual notification.'), supplier=L('L1', b, 'Purification', 'A different resin is a supplement.')),
        'bio-potency': Q('potencyNewPrinciple', L('L1', b, 'Analytical procedures', 'A potency assay on a new principle is a supplement.'),
                         Q('bioMethodMajor', L('NC', b, 'Analytical procedures', 'A change to the assay\'s technique or performance is a notifiable change.'), L('L3', b, 'Table 25d', 'A minor assay change is an annual notification.'))),
        'bio-formulation': L('L1', b, 'Table 38a', 'A formulation change is a supplement.'),
        'bio-adventitious': C('adventRisk', first=L('L1', b, 'Adventitious agents', 'New clearance claims are a supplement.'), higher=L('L1', b, 'Adventitious agents', 'A higher-risk assessment is a supplement.'),
                              same=L('NC', b, 'Adventitious agents', 'Replacement studies with the same or lower risk are a notifiable change.', note='Simplified.')),
        'ipc-relax': L('NC', b, 'Table 18', 'Relaxing an in-process limit is a notifiable change.'),
        'ipc-tighten': L('L3', b, 'Table 18d', 'Tightening an in-process limit within the approved range is an annual notification.'),
        'hold-time': Q('holdData', L('L3', b, 'Manufacturing process', 'A longer hold time validated with data is an annual notification.', note='Simplified.'), L('NC', b, 'Manufacturing process', 'A longer hold time is a notifiable change.')),
        'ds-retest': Q('approvedProtocolFullData', L('L3', b, 'Table 35a', 'An extension under the approved protocol is an annual notification.'), L('NC', b, 'Table 35a', 'Other extensions are notifiable changes.')),
        'in-use-shelf-life': C('inUseKind', reduce=L('L3', b, 'Stability', 'A shorter in-use period is an annual notification.', pi=True), extendReal=L('NC', b, 'Stability', 'A longer in-use period is a notifiable change.', pi=True),
                               extendModel=L('NC', b, 'Stability', 'A longer in-use period by extrapolation is a notifiable change.', pi=True)),
        'ds-storage': L('NC', b, 'Table 33 and stability', 'A change in drug substance storage is a notifiable change.', note='Simplified.'),
        'micro-rapid': L('NC', b, 'Analytical procedures', 'An alternative microbiological method is a notifiable change.', note='Simplified.'),
        'cc-supplier': L('L3', b, 'Container closure', 'A new supplier of the same component is an annual notification.', note='Simplified.'),
        'cc-noncontact': L('L3', b, 'Container closure', 'A non-contact component change is an annual notification.', note='Simplified.'),
        'excipient-spec': C('excipientSpecKind', tighten=L('L3', b, 'Excipients', 'Tightening is an annual notification.'), add=L('L3', b, 'Excipients', 'Adding a test is an annual notification.'),
                            delete=L('NC', b, 'Excipients', 'Deleting a test is a notifiable change.'), relax=L('NC', b, 'Excipients', 'Widening a limit is a notifiable change.')),
        'skip-testing': L('NC', b, 'Specifications', 'Reduced testing is a notifiable change.', note='Simplified.'),
        'method-minor': L('L3', b, 'Table 25d', 'A minor procedure change meeting conditions 3 to 7 is an annual notification.'),
        'design-space-new': L('L1', 'q8', 'Design space', 'A new or expanded design space is a supplement.'),
        'rtrt': L('L1', b, 'Specifications', 'Real-time release testing is a supplement.'),
        'batch-release-site': L('L3', b, 'Testing facilities', 'A new release testing site with approved procedures is an annual notification.', note='Simplified.'),
        'site-delete': L('L3', b, 'Facilities', 'Deleting a facility is an annual notification.'),
        'cc-device': Q('deviceSignificant', L('L1', b, 'Container closure', 'A device change that affects dosing is a supplement.', pi=True), L('L3', b, 'Container closure', 'Other device changes are annual notifications.', pi=True, note='Simplified.')),
    }
    return m.get(cid)


def run():
    catalogue = load('src', 'data', 'catalogue.json')
    eu = load('src', 'packs', 'eu', '2026.1', 'entries.json')
    entries = {}
    missing = []
    for ch in catalogue['changes']:
        cid, scope = ch['id'], ch['scope']
        ph = pharma(cid, eu)
        bi = biologic(cid)
        if scope == 'bio':
            node = bi
        elif scope == 'small':
            node = ph
        else:
            node = Q('bio', copy.deepcopy(bi), copy.deepcopy(ph)) if (bi and ph) else ph
        if node is None:
            missing.append(cid)
            continue
        entries[cid] = {'tree': node}
    if missing:
        raise SystemExit(f'Canada: no entry for {missing}')
    pack = {
        'id': 'ca', 'region': 'CA', 'label': 'Canada: Health Canada (Post-NOC changes)', 'edition': '2026.1',
        'appliesFrom': '2026-05-15', 'appliesTo': None, 'status': 'in force',
        'summary': 'Post-NOC quality, safety and efficacy changes: Level I supplement, Level II (notifiable change for biologics, supplement for safety labelling), Level III notice and Level IV record. Pharmaceuticals follow the 2019 Quality guidance; biologics the 2026 framework and quality guidance.',
        'sources': SOURCES, 'categories': cats(), 'conditions': COND,
        'multipleChanges': {'rule': 'Changes that are related may be filed together; a series of individually minor changes can together warrant a higher level (contact Health Canada). The filing takes the highest level.', 'src': 'qual', 'at': '2.1'},
        'filing': {'shared': ['L3'], 'apart': ['REC', 'NA']},
        'clocks': {
            'L1': {'daysByKind': {'cmc': 180, 'efficacy': 300, 'labeling': 120, 'admin': 180}, 'label': 'Review 1 performance standard: 180 days (quality only), 300 days (clinical), 120 days (labelling only)', 'src': 'perf'},
            'L2S': {'days': 120, 'label': 'Labelling-only review standard: 120 days', 'src': 'perf'},
            'NC': {'days': 90, 'label': 'Notifiable change review target: 90 days, then a No Objection Letter', 'src': 'perf'},
            'L3': {'months': 12, 'label': 'Pharmaceuticals: file at implementation (recommended) or in the annual notification. Biologics: within 12 months of implementation', 'src': 'fw'},
            'L3IN': {'daysBefore': 21, 'daysAfter': 14, 'label': 'Notify from 21 days before to 14 days after implementation', 'src': 'fwbio'},
            'ADMIN': {'label': 'Processed without scientific review; no fixed timing modelled', 'src': 'mds'},
        },
        'm1': {
            'supplement': [{'code': 'ca:1.0.1', 'label': 'Cover letter naming the submission type and each change'}, {'code': 'ca:1.0.2', 'label': 'Life cycle management table'},
                           {'code': 'ca:1.2.1', 'label': 'Drug submission application form (HC/SC 3011)'}, {'code': 'ca:1.2.2', 'label': 'Fee form'},
                           {'code': 'ca:1.2.5', 'label': 'Compliance and site information (establishment licences, GMP evidence)'}],
            'notice': [{'code': 'ca:1.0.1', 'label': 'Cover letter'}, {'code': 'ca:1.2.8', 'label': 'Post-NOC changes: notices of change (Level III) form'}],
            'admin': [{'code': 'ca:1.0.1', 'label': 'Cover letter'}, {'code': 'ca:1.2.1', 'label': 'Application form (administrative submission)'}, {'code': 'ca:1.2.9', 'label': 'Supporting administrative documents'}],
            'pi': [{'code': 'ca:1.3.1', 'label': 'Product monograph, clean and annotated'}, {'code': 'ca:1.3.2', 'label': 'Inner and outer labels'}],
            'cpid': [{'code': 'ca:1.3.6', 'label': 'Certified product information document (CPID), updated'}],
        },
        'm1map': {'L1': ['supplement'], 'L2S': ['supplement'], 'NC': ['supplement'], 'L3': ['notice'], 'L3IN': ['notice'], 'ADMIN': ['admin']},
        'ectd': {'L1': {'submissionType': 'snds', 'subType': 'initial'}, 'L2S': {'submissionType': 'snds', 'subType': 'initial'}, 'NC': {'submissionType': 'nc', 'subType': 'initial'},
                 'L3': {'submissionType': 'level-iii', 'subType': 'initial'}, 'L3IN': {'submissionType': 'level-iii', 'subType': 'initial'},
                 'ADMIN': {'submissionType': 'administrative', 'subType': 'initial'}, 'REC': None, 'NA': None},
        'changeLog': [{'edition': '2026.1', 'date': '2026-10-11', 'text': 'First Canada edition: 2019 Quality guidance for pharmaceuticals, May 2026 framework and quality guidance for biologics, Safety and Efficacy guidance for labelling.'}],
    }
    save(pack, DIR, 'pack.json')
    save(entries, DIR, 'entries.json')
    print('Canada:', len(entries), 'entries,', len(COND), 'conditions')


if __name__ == '__main__':
    run()
