"""WHO prequalification pack (variations to prequalified multisource FPPs), edition 2026.1."""
import copy
from lib import load, save, O, Q, C, A

DIR = 'src/packs/who/2026.1'

SOURCES = {
    'trs981': {'title': 'WHO guidelines on variations to a prequalified product (WHO Technical Report Series No. 981, Annex 3)', 'version': 'TRS 981', 'date': '2013',
               'url': 'https://www.who.int/publications/m/item/annex-3-trs-981', 'status': 'final'},
    'faq22': {'title': 'WHO PQT: Frequently asked questions on variations, revision 03', 'version': 'Rev. 03', 'date': '2022-12-15',
              'url': 'https://extranet.who.int/prequal/sites/default/files/document_files/FAQ_Variations-revision_15Dec2022.pdf', 'status': 'final'},
    'tl16': {'title': 'WHO PQT: Variations approval mechanism and timeline table', 'version': 'October 2016', 'date': 'published timelines prevail over the guideline',
             'url': 'https://extranet.who.int/prequal/sites/default/files/document_files/127%20Variations%20table_Oct2016.pdf', 'status': 'goal'},
}

CATS = [
    ('OUT', 0, 'Outside pack', 'Outside this pack (vaccines and biotherapeutics)', 'other', 'Separate WHO guidance',
     'Vaccines and biotherapeutic products follow separate WHO PQ variation guidance, which this pack does not model.', 'trs981', 'Scope', 'letter'),
    ('NA', 0, 'Not used', 'Not used in WHO PQ', 'other', 'Route not used', 'WHO PQ has no such procedure; see the result.', 'faq22', 'Q8', 'letter'),
    ('OTHER', 0, 'Other procedure', 'Separate procedure (not a variation)', 'other', 'Different procedure', 'Use the procedure named in the result.', 'trs981', 'Scope', 'letter'),
    ('NONE', 0, 'No variation', 'No variation: GMP change control', 'do', 'Managed under GMP', 'No variation: manage the change under GMP change control and keep the data for inspection.', 'faq22', 'Appendix III', 'letter'),
    ('AN', 1, 'AN', 'Annual notification', 'do-and-tell', 'Do, then notify within 12 months',
     'Implement, then notify WHO within 12 months (grouped annual notifications are recommended). Keep the data available.', 'trs981', 'Section 2 (AN)', 'ar'),
    ('IN', 2, 'IN', 'Immediate notification', 'do-and-tell', 'Do and notify at once',
     'Implement and notify immediately; the change is accepted unless WHO objects within the review period.', 'trs981', 'Section 2 (IN)', 'cbe0'),
    ('VMIN', 3, 'Vmin', 'Minor variation', 'tell-and-wait', 'Tell, wait, then do',
     'Submit, then implement if WHO has not started correspondence within 60 days of acknowledging receipt.', 'tl16', 'Vmin', 'cbe30'),
    ('VMAJ', 4, 'Vmaj', 'Major variation', 'wait-for-approval', 'Wait for the acceptance letter',
     'Implement only after WHO issues a letter of acceptance.', 'trs981', 'Section 2 (Vmaj)', 'pas'),
    ('NEWAPP', 5, 'New application', 'New application (Appendix 1 changes)', 'wait-for-approval', 'New application',
     'Changes listed in Appendix 1 of the guideline (such as a new strength, dosage form or route) need a new application.', 'trs981', 'Appendix 1', 'ext'),
]


def cats():
    return [{'id': i, 'rank': r, 'short': s, 'label': l, 'implement': im, 'badge': b, 'rule': ru, 'src': src, 'at': at, 'tone': t}
            for (i, r, s, l, im, b, ru, src, at, t) in CATS]


COND = {}


def cond(item, *texts):
    keys = []
    for n, t in enumerate(texts, 1):
        k = f'WHO-{item}:{n}'
        COND[k] = {'text': t}
        keys.append(k)
    return keys


C30A = cond('30a', 'The product is an immediate-release oral form or a non-sterile liquid.', 'Changes to the method are only those the new size needs, with similar equipment.',
            'Validation is done or a validation protocol and commitment are in place.', 'Release and shelf-life specifications are unchanged.')
C31A = cond('31a', 'The product is not sterile and not modified release.', 'The manufacturing principle is unchanged and specifications are unchanged.', 'The change does not come from stability problems or manufacturing failures.')
C8E = cond('8e', 'Same route of synthesis, specifications and impurity profile.', 'The site has acceptable GMP status (inspected by WHO or a stringent authority, or evidence acceptable to PQT).',
           'Stability and validation commitments are given.')
C5B = cond('5b', 'A valid Ph. Eur. CEP covers the new manufacturer.', 'The FPP manufacturer\'s specification for the API covers all CEP tests plus any extra tests needed.', 'No change to the API particle size or polymorph requirements.')

U_NOTE = 'Not listed in the guideline: an unclassified change is major by default, unless justified as an unclassified minor variation (suffix u) or agreed with PQT in advance (FAQ Q8).'


def U(what):
    return Q('whoMinorU',
             O('VMIN', 'faq22', 'Q8', f'{what} is not listed; filed as an unclassified minor variation (u) with a justification PQT accepts.', note=U_NOTE),
             O('VMAJ', 'faq22', 'Q8', f'{what} is not listed, so it is a major variation by default.', note=U_NOTE))


def F(cat, at, why, src='trs981', **kw):
    return O(cat, src, at, why, **kw)


def entry(cid):
    m = {
        'dp-site-move': Q('pqInspected', F('VMIN', '28c', 'A new site for manufacturing operations, inspected by WHO or a stringent authority in the last three years, is a minor variation.', src='faq22'),
                          F('VMAJ', 'Appendix I, item 3', 'A new site not satisfactorily inspected by WHO or a stringent authority makes the change major.', src='faq22')),
        'ds-site-move': Q('dsSameRoute', A(C8E, F('IN', '8e.1', 'A new API site with the same route, specifications and impurity profile is an immediate notification.'), F('VMAJ', '8e.2', 'A condition is not met: major variation.')),
                          F('VMAJ', '8e.2', 'A new API site with a different route needs full assessment: major variation.')),
        'ds-intermediate-site': F('IN', '8c.2', 'A new site for an API intermediate is an immediate notification when the conditions are met.', note='Under the APIMF procedure the APIMF holder files an amendment instead (8c.1).'),
        'primary-pack-site': F('IN', '28b', 'A new primary packaging site for a solid or semi-solid FPP is an immediate notification.'),
        'secondary-pack-site': F('IN', '28a', 'A new secondary packaging site is an immediate notification.'),
        'labeling-site': F('IN', '28a', 'Labelling is a secondary packaging operation: immediate notification.'),
        'testing-site': F('AN', '29', 'A new or replacement site for batch control testing is an annual notification.'),
        'ink-imprint-site': Q('pqInspected', F('VMIN', '28c', 'A new site for a manufacturing operation, recently inspected, is a minor variation.'), F('VMAJ', 'Appendix I, item 3', 'A new site without a recent satisfactory inspection is major.', src='faq22')),
        'component-sterilization-site': U('A new component sterilisation site'),
        'fill-line-add': U('A new filling line'),
        'dp-equipment-same': F('NONE', 'Appendix III', 'Equipment of the same design and operating principle is managed under GMP change control.', src='faq22', note='Simplified.'),
        'dp-process-change': Q('majorImpact', U('A major process change'), A(C31A, F('AN', '31a', 'A minor process change meeting the conditions is an annual notification.'), F('VMIN', '31b', 'A condition is not met: minor variation.'))),
        'dp-scale': Q('scaleWithin10', A(C30A, F('IN', '30a', 'A batch size change up to ten times, meeting the conditions, is an immediate notification.'), F('VMIN', '30c', 'A condition is not met: minor variation.')),
                      F('VMIN', '30c', 'Other batch size changes are minor variations.')),
        'ds-route-new': F('VMAJ', '10d', 'A new route of synthesis is a major variation.'),
        'ds-process-change': Q('majorImpact', F('VMAJ', '10d', 'An API process change that may affect quality is a major variation.'), F('VMIN', '10c', 'Other API process changes are minor variations.', note='Some low-risk changes are AN or IN (10a, 10b).')),
        'ds-starting-material': F('VMAJ', '10d', 'Redefining the starting material changes the API process description: major variation.', note='Simplified.'),
        'dp-reprocessing': U('A reprocessing procedure'),
        'dp-ink': F('IN', '26a', 'A change in imprints or markings is an immediate notification.'),
        'dp-emboss': F('IN', '26a', 'A change in embossing or other markings is an immediate notification.'),
        'dp-order-addition': A(C31A, F('AN', '31a', 'A minor process change meeting the conditions is an annual notification.'), F('VMIN', '31b', 'A condition is not met: minor variation.')),
        'sterile-filter': U('A change to the sterilising filtration'),
        'sterilization-method': F('VMAJ', '31', 'A change in the sterilisation method is a major change.', note=U_NOTE),
        'depyrogenation': U('A change to depyrogenation'),
        'inprocess-filtration-remove': U('Removing an in-process filtration'),
        'control-increase': F('AN', '32c', 'Adding in-process tests and limits is an annual notification.'),
        'excipient-change': Q('comparabilityNeeded', F('VMAJ', '25a.2 / 25b.2', 'A composition change that needs a bioequivalence study is a major variation.'),
                              C('excipientKind', **{'minor-quant': F('VMIN', '25b.1', 'A change in excipient amounts for an immediate-release solid oral form, within Appendix 2 limits, is a minor variation.'),
                                                   'comparable': F('VMIN', '25a.1', 'Replacing one excipient with a comparable one is a minor variation.'),
                                                   'other': F('VMAJ', '25b.2', 'Other composition changes are major variations.')})),
        'colour-flavour-delete': F('IN', '23b', 'Deleting or replacing a colouring or flavouring is an immediate notification (a reduction alone is an annual notification, 23a).'),
        'new-strength': F('NEWAPP', 'Appendix 1', 'A new strength needs a new application.', pi=True),
        'spec-tighten': F('AN', '37c', 'Tightening an FPP acceptance criterion is an annual notification.'),
        'spec-relax': F('IN', '37d', 'Relaxing an FPP acceptance criterion is an immediate notification when the conditions are met.', note='For API criteria, relaxation can be IN, Vmin or Vmaj (15f).'),
        'spec-delete-test': Q('significantQuality', U('Deleting a significant test'), F('AN', '37a', 'Deleting a non-significant FPP test parameter is an annual notification.')),
        'spec-add-test': F('AN', '37b', 'Adding an FPP test parameter is an annual notification.'),
        'spec-compendial': F('AN', '36b', 'Updating to a revised pharmacopoeial monograph is an annual notification.'),
        'method-change': Q('minorMethodChange', F('AN', '38c.1', 'A minor change to an FPP procedure is an annual notification.'), F('VMIN', '38c.2', 'Other changes to an FPP procedure are minor variations.')),
        'method-new-regulatory': F('AN', '38b', 'Adding an FPP analytical procedure is an annual notification.'),
        'method-alternative': F('AN', '38b', 'Adding an alternative procedure is an annual notification.'),
        'method-components': F('AN', '44b', 'A change to a packaging test procedure is an annual notification.', note='For excipient procedures it is a minor variation (34d).'),
        'method-raw-material': F('AN', '13c', 'A minor change to a procedure for API materials is an annual notification.'),
        'cc-polymer': Q('sterile', F('VMAJ', '39b', 'A new primary packaging type for a sterile product is a major variation.'), F('VMIN', '39a', 'A new primary packaging type for a non-sterile product, with equal protection, is a minor variation.')),
        'cc-sterile': F('VMAJ', '39b', 'A primary packaging change for a sterile product is a major variation.'),
        'cc-dose-device': F('VMAJ', '39b', 'A change to functional packaging that controls the dose is a major variation.'),
        'cc-closure-solid': F('IN', '42a', 'A packaging material change for a solid FPP, same packaging type, is an immediate notification.'),
        'cc-closure-liquid': F('VMIN', '42b', 'A packaging material change for other FPPs is a minor variation.'),
        'cc-size-shape': Q('sterile', F('VMIN', '41b', 'A container shape or size change for a sterile FPP is a minor variation.'), F('AN', '41a', 'A container shape or size change for a non-sterile FPP is an annual notification.')),
        'cc-count': F('IN', '40a', 'A change in the number of units per pack, consistent with the posology, is an immediate notification.', pi=True),
        'cc-desiccant': F('IN', '42a', 'A packaging material change for a solid FPP is an immediate notification.', note='Simplified: desiccants are treated as part of the packaging material.'),
        'cc-blister': F('IN', '42a', 'A blister-to-blister material change for a solid FPP is an immediate notification.'),
        'cc-secondary-protective': U('Removing protective secondary packaging'),
        'cc-cap-colour': F('IN', '45', 'A change to a primary packaging part not in contact with the product is an immediate notification.'),
        'shelf-life-extend': F('VMIN', '47b', 'A shelf-life extension, with long-term data on at least two pilot or production batches, is a minor variation.', pi=True),
        'shelf-life-reduce': F('IN', '47a', 'A shelf-life reduction is an immediate notification.', pi=True),
        'stability-protocol': U('A change to the stability protocol'),
        'storage-conditions': F('VMIN', '49', 'A change in labelled storage conditions is a minor variation.', pi=True),
        'reference-standard': F('NONE', 'Appendix III', 'Replacing an in-house working standard, qualified against the primary standard, is managed under GMP.', src='faq22', note='Simplified.'),
        'lab-new-indication': F('VMAJ', 'Product information', 'A new indication needs assessment: major variation.', src='faq22', pi=True, note=U_NOTE),
        'lab-population': F('VMAJ', 'Product information', 'A change in population or dosing needs assessment: major variation.', src='faq22', pi=True, note=U_NOTE),
        'lab-clinical-section': U('A product information update with new clinical data'),
        'lab-safety-add': U('A safety update to the product information'),
        'lab-dosing-safety': U('A dosing instruction for safer use'),
        'lab-delete-claim': U('Removing unsupported claims'),
        'lab-505o4': U('A product information change requested by an authority'),
        'lab-rld-update': U('Following the reference product information'),
        'lab-editorial': U('An editorial product information change'),
        'lab-layout': U('A change in label layout'),
        'cp-submit': F('NA', 'Q8', 'WHO PQ has no PACMP procedure. Unlisted changes can be agreed with PQT by email consultation, with a recommendation within 30 days.', src='faq22'),
        'cp-use': F('NA', 'Q8', 'No PACMP route: classify the change in its own entry.', src='faq22'),
        'be-study-change': F('VMAJ', '25', 'A change that needs a new bioequivalence study is a major variation.'),
        'admin-ownership': F('OTHER', 'Scope', 'A transfer to a new applicant is handled by PQT as a separate procedure, not a variation.', note='Simplified.'),
        'admin-name-address': F('IN', '1', 'A change in the name or address of the FPP supplier is an immediate notification.', pi=True),
        # new in phase 4
        'ds-cep': Q('cepCovers', A(C5B, F('IN', '5b.1', 'A new or updated CEP from a new manufacturer, meeting the conditions, is an immediate notification.'), F('VMIN', '5b.2', 'A condition is not met: minor variation.')),
                    Q('dsSameRoute', F('IN', '8d.1', 'A new API manufacturer under the APIMF procedure (or already prequalified) is an immediate notification when the conditions are met.', note='Otherwise a minor variation (8d.2).'),
                      F('VMAJ', '8e.2', 'A new API manufacturer with a different route needs full assessment: major variation.'))),
        'batch-release-site': F('AN', '29', 'WHO PQ has no batch release site as such; a new batch control testing site is an annual notification.'),
        'site-delete': F('IN', '4c', 'Deleting a site for FPP production, packaging or testing is an immediate notification.', note='Deleting an API starting material site is an annual notification (4a).'),
        'ds-scale': Q('scaleWithin10', F('AN', '12a', 'An API batch size change up to ten times is an annual notification.'), F('VMIN', '12d', 'An increase of more than ten times is a minor variation.')),
        'ipc-tighten': F('AN', '32a', 'Tightening FPP in-process limits is an annual notification.'),
        'ipc-relax': Q('ipcCritical', F('VMAJ', '11f (by analogy)', 'Relaxing a critical in-process limit is treated as major.', note=U_NOTE), U('Widening a non-critical in-process limit')),
        'hold-time': U('A longer hold time'),
        'design-space-within': F('NONE', 'Appendix III', 'Working within an approved design space is not a change.', src='faq22', note='By analogy with ICH Q8; the guideline does not mention design space.'),
        'design-space-new': U('A new design space'),
        'rtrt': U('Real-time release testing'),
        'continuous-mfg': F('VMAJ', '31', 'Converting to continuous manufacturing is a major change.', note=U_NOTE),
        'excipient-supplier': F('NONE', 'Appendix III', 'A new supplier of the same excipient grade and specification is managed under GMP.', src='faq22', note='Simplified.'),
        'coating-weight': Q('mr', F('VMAJ', '24b', 'A coating weight change for a modified-release form is a major variation.'), F('AN', '24a', 'A coating or shell weight change for an immediate-release form is an annual notification.')),
        'score-line': C('scoreAction', add=F('VMIN', '26c.1', 'Adding a score line, meeting the conditions, is a minor variation.', pi=True, note='Otherwise major (26c.2).'),
                        delete=F('IN', '26b', 'Deleting a score line is an immediate notification.', pi=True)),
        'tablet-shape': Q('mr', F('VMIN', '27b', 'A shape change for a modified-release or scored tablet is a minor variation.', pi=True),
                          Q('scoredEqualDose', F('VMIN', '27b', 'A shape change for a scored tablet is a minor variation.', pi=True), F('IN', '27a', 'A shape or dimension change for an immediate-release form is an immediate notification.', pi=True))),
        'tse-excipient': F('AN', '33', 'Moving an excipient from a TSE-risk material to a vegetable or synthetic one is an annual notification.'),
        'dosage-form-new': F('NEWAPP', 'Appendix 1', 'A new dosage form needs a new application.', pi=True),
        'nitrosamine-control': F('IN', 'Section 10.1', 'Adding nitrosamine controls should be submitted as an immediate notification, with a declaration on nitrosamine risk.', src='faq22'),
        'excipient-spec': C('excipientSpecKind', tighten=F('AN', '34c', 'Tightening an excipient limit is an annual notification.'), add=F('AN', '34b', 'Adding an excipient test is an annual notification.'),
                            delete=F('AN', '34a', 'Deleting a non-significant in-house excipient test is an annual notification.'), relax=U('Widening an excipient limit')),
        'skip-testing': F('AN', 'Appendix II, item 3', 'Skip testing (for example of microbial limits) is accepted as an unclassified annual notification (37u-AN) when the conditions are met.', src='faq22',
                          note='Reducing how often incoming materials are tested is a GMP matter with no variation (Appendix III).'),
        'method-minor': F('AN', '38c.1', 'A minor change to an FPP procedure is an annual notification.'),
        'micro-rapid': F('VMIN', '38c.2', 'Replacing a procedure with an alternative method is a minor variation.'),
        'cc-supplier': F('NONE', 'Appendix III', 'A new supplier of the same component, same material and specification, is managed under GMP.', src='faq22', note='Simplified.'),
        'cc-device': F('IN', '46a', 'Adding or replacing an administration or measuring device that is not part of the primary packaging is an immediate notification.', pi=True),
        'cc-noncontact': F('IN', '45', 'A change to primary packaging parts not in contact with the product is an immediate notification.'),
        'ds-retest': F('VMIN', '20c', 'Extending the API re-test period is a minor variation.'),
        'in-use-shelf-life': C('inUseKind', reduce=F('IN', '48a', 'Reducing the in-use period is an immediate notification.', pi=True),
                               extendReal=F('VMIN', '48b', 'Extending the in-use period is a minor variation.', pi=True), extendModel=F('VMIN', '48b', 'Extending the in-use period is a minor variation.', pi=True)),
        'ds-storage': F('VMIN', '21b', 'A change in API labelled storage conditions is a minor variation.'),
        'lab-new-route': F('NEWAPP', 'Appendix 1', 'A new route of administration needs a new application.', pi=True),
        'lab-brand-name': U('A new trade name'),
        'lab-rmp': F('NA', 'Scope', 'The WHO PQ variation guideline has no risk management plan procedure.', src='faq22'),
        'lab-psusa': U('Implementing agreed safety wording'),
        'lab-delete-indication': U('Deleting an indication'),
        'ec-define': F('NA', 'Q8', 'WHO PQ has no established conditions procedure.', src='faq22'),
        'plcm-update': F('NA', 'Q8', 'WHO PQ has no PLCM document.', src='faq22'),
        'non-ec-change': F('NA', 'Q8', 'WHO PQ has not adopted established conditions: classify the change in its own entry.', src='faq22'),
        'pacmp-change': F('NA', 'Q8', 'WHO PQ has no PACMP procedure.', src='faq22'),
        'admin-manufacturer-name': F('IN', '3', 'A change in the name or address of the FPP manufacturer is an immediate notification.', note='For a non-supplier API manufacturer it is item 2, also IN.'),
        'admin-local-rep': F('NA', 'Scope', 'WHO PQ has no local representative; national registration of the prequalified product is handled country by country.', src='faq22'),
        'admin-inn': U('A change in the name of the active substance'),
        'admin-delete-presentation': C('presentationKind', strength=U('Withdrawing a strength'), pack=F('IN', '40a', 'A change in the number of units per pack is an immediate notification.', note='Simplified: deletion of a pack size.')),
    }
    return m.get(cid)


OUT = O('OUT', 'trs981', 'Scope', 'This pack covers multisource finished pharmaceutical products. Vaccines and biotherapeutics follow separate WHO PQ variation guidance.')


def run():
    catalogue = load('src', 'data', 'catalogue.json')
    entries = {}
    missing = []
    for ch in catalogue['changes']:
        cid, scope = ch['id'], ch['scope']
        if scope == 'bio':
            entries[cid] = {'tree': dict(OUT)}
            continue
        e = entry(cid)
        if e is None:
            missing.append(cid)
            continue
        entries[cid] = {'tree': Q('bio', dict(OUT), e) if scope != 'small' else e}
    if missing:
        raise SystemExit(f'WHO: no entry for {missing}')
    pack = {
        'id': 'who', 'region': 'WHO', 'label': 'WHO prequalification: multisource finished pharmaceutical products', 'edition': '2026.1',
        'appliesFrom': '2016-10-01', 'appliesTo': None, 'status': 'in force',
        'summary': 'Variations to WHO-prequalified multisource FPPs: annual notification, immediate notification, minor and major variations under TRS 981 Annex 3, with the PQT FAQ (2022) and the published timeline table, which prevails over the guideline.',
        'sources': SOURCES, 'categories': cats(), 'conditions': COND,
        'multipleChanges': {'rule': 'Changes can be grouped only if consequential, if they affect several FPPs of one applicant, or if all are annual notifications. A group is filed in one form and takes the highest category.', 'src': 'faq22', 'at': 'Q4'},
        'filing': {'shared': ['AN'], 'apart': ['NONE', 'NA', 'OUT', 'OTHER']},
        'clocks': {
            'AN': {'months': 12, 'ackDays': 45, 'label': 'Notify within 12 months of implementation; WHO acknowledges within 45 days', 'src': 'tl16'},
            'IN': {'ackDays': 7, 'reviewDays': 45, 'label': 'Acknowledgement within 7 days; accepted unless WHO objects within 45 days of acknowledgement (the 2013 guideline said 30)', 'src': 'tl16'},
            'VMIN': {'ackDays': 7, 'reviewDays': 60, 'label': 'Implement if WHO has not started correspondence within 60 days of acknowledgement', 'src': 'tl16'},
            'VMAJ': {'ackDays': 7, 'reviewDays': 90, 'label': 'Initial review within 90 days of acknowledgement; implement after the acceptance letter', 'src': 'tl16'},
            'NEWAPP': {'label': 'Assessed as a new application; timing not modelled', 'src': 'trs981'},
        },
        'm1': {
            'variation': [{'code': 'who:1.0', 'label': 'Cover letter'}, {'code': 'who:1.2', 'label': 'Variation application form with the summary of changes and implementation dates'},
                          {'code': 'who:QIS', 'label': 'Quality information summary, revised (tracked and clean), if affected'}],
            'annual': [{'code': 'who:1.0', 'label': 'Cover letter'}, {'code': 'who:1.2', 'label': 'Variation application form listing the annual notifications and their dates'}],
            'pi': [{'code': 'who:1.3', 'label': 'Product information (SmPC, patient leaflet, labels), tracked and clean'}],
        },
        'm1map': {'AN': ['annual'], 'IN': ['variation'], 'VMIN': ['variation'], 'VMAJ': ['variation'], 'NEWAPP': ['variation']},
        'ectd': {},
        'changeLog': [{'edition': '2026.1', 'date': '2026-10-11', 'text': 'First WHO PQ edition: TRS 981 Annex 3 categories, FAQ revision 03 and the 2016 timeline table.'}],
    }
    save(pack, DIR, 'pack.json')
    save(entries, DIR, 'entries.json')
    print('WHO:', len(entries), 'entries,', len(COND), 'conditions')


if __name__ == '__main__':
    run()
