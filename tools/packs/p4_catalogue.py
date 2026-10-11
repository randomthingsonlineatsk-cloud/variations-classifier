"""Phase 4 catalogue: 47 more changes (120 in all), their questions and evidence."""
from lib import load, save

NEW = [
    # site
    ('ds-cep', 'site', 'cmc', 'small', 'Add or replace a drug substance source supported by a CEP or drug master file',
     'A new or alternative manufacturer of the drug substance whose data sit in a Ph. Eur. certificate of suitability (CEP), a drug master file (DMF, ASMF) or a WHO APIMF.',
     'API supplier source vendor CEP DMF ASMF APIMF alternate second source', ['ds-mfr', 'ds-spec', 'ds-imp', 'ds-batch', 'ds-stab', 'qos']),
    ('batch-release-site', 'site', 'cmc', 'all', 'Add or change the site responsible for batch release or batch control testing',
     'The site that certifies or tests batches before they are released to a market, for example an importer with a qualified person or a local release laboratory.',
     'QP release importer batch certification control testing laboratory', ['dp-mfr', 'dp-meth', 'qos']),
    ('site-delete', 'site', 'admin', 'all', 'Delete a manufacturing, testing or packaging site',
     'A site is no longer used and is removed from the dossier; another approved site does the same work.',
     'remove withdraw site deletion delist manufacturer', ['dp-mfr']),
    # process
    ('ds-scale', 'process', 'cmc', 'small', 'Change the drug substance batch size',
     'Scale up or scale down manufacture of the drug substance with the same process.',
     'API batch size scale up down synthesis', ['ds-proc', 'ds-batch', 'qos']),
    ('ipc-tighten', 'process', 'cmc', 'all', 'Tighten an in-process control limit',
     'An in-process acceptance limit becomes narrower, within the approved range.',
     'IPC in-process limit narrower tighten', ['dp-ctrl']),
    ('ipc-relax', 'process', 'cmc', 'all', 'Widen an in-process control limit or delete an in-process test',
     'An in-process limit becomes wider, or an in-process test is removed.',
     'IPC in-process widen relax delete remove test', ['dp-ctrl', 'dp-proc', 'dp-batch', 'qos']),
    ('hold-time', 'process', 'cmc', 'all', 'Extend a hold time for an intermediate or bulk product',
     'A longer approved holding period between manufacturing steps, supported by hold-time data.',
     'hold time holding bulk intermediate storage period', ['dp-proc', 'dp-ctrl', 'dp-stab']),
    ('design-space-within', 'process', 'cmc', 'all', 'Move a process parameter within an approved design space',
     'ICH Q8: working within an approved design space is not regarded as a change. The move is managed in the quality system.',
     'design space QbD ICH Q8 parameter range operating', []),
    ('design-space-new', 'process', 'cmc', 'all', 'Introduce a new design space or expand an approved one',
     'A new multivariate range for a unit operation or an analytical procedure, or an extension of an approved one.',
     'design space QbD ICH Q8 MODR new expand', ['dp-dev', 'dp-proc', 'dp-ctrl', 'qos']),
    ('rtrt', 'process', 'cmc', 'all', 'Introduce real-time release testing in place of end-product testing',
     'Release decisions based on in-process data (for example NIR or a process model) instead of testing the finished batch.',
     'RTRT PAT real time release NIR model', ['dp-dev', 'dp-ctrl', 'dp-spec', 'dp-meth', 'dp-methval', 'qos']),
    ('continuous-mfg', 'process', 'cmc', 'small', 'Switch from batch to continuous manufacturing (ICH Q13)',
     'The drug product moves from a batch process to a continuous process with new control strategy and equipment.',
     'continuous manufacturing ICH Q13 CM line', ['dp-dev', 'dp-proc', 'dp-ctrl', 'dp-val', 'dp-batch', 'dp-stab', 'facilities', 'qos']),
    # composition
    ('excipient-supplier', 'composition', 'cmc', 'all', 'Change the supplier of an excipient (same grade and specification)',
     'A new supplier of the same excipient grade, meeting the same specification.',
     'excipient vendor supplier source grade', ['dp-exc']),
    ('coating-weight', 'composition', 'cmc', 'small', 'Change the coating weight of tablets or the weight of the capsule shell',
     'More or less film coat, or a heavier or lighter capsule shell, with no other composition change.',
     'film coat coating weight capsule shell', ['dp-comp', 'dp-formula', 'dp-dev', 'dp-spec', 'dp-stab']),
    ('score-line', 'composition', 'cmc', 'small', 'Add or delete a score line on tablets',
     'A break line is added or removed. A functional score line lets patients split the tablet into equal doses.',
     'score line break mark split tablet', ['dp-comp', 'dp-dev', 'dp-spec', 'dp-batch']),
    ('tablet-shape', 'composition', 'cmc', 'small', 'Change the shape or dimensions of tablets or capsules (same composition and mass)',
     'A new tablet shape or size with the same composition and mean mass.',
     'shape dimensions size tooling punch', ['dp-comp', 'dp-dev', 'dp-spec']),
    ('tse-excipient', 'composition', 'cmc', 'all', 'Replace an excipient of animal origin with one of vegetable or synthetic origin',
     'For example animal-derived magnesium stearate or gelatin replaced by a non-animal grade, removing a TSE risk.',
     'TSE BSE animal origin vegetable synthetic gelatin stearate', ['dp-exc', 'advent']),
    ('dosage-form-new', 'composition', 'efficacy', 'all', 'Add a new pharmaceutical form (for example an oral solution next to tablets)',
     'A new dosage form of the same active substance under the same product name.',
     'new dosage form pharmaceutical form line extension', ['dp-comp', 'dp-dev', 'dp-proc', 'dp-spec', 'dp-stab', 'be', 'clin-ov']),
    # specifications
    ('nitrosamine-control', 'spec', 'cmc', 'small', 'Add a test and limit for a nitrosamine impurity',
     'A new specification test for an N-nitrosamine, for example after a risk assessment found a risk.',
     'nitrosamine NDSRI NDMA impurity mutagenic limit', ['ds-spec', 'dp-spec', 'dp-meth', 'dp-methval', 'dp-batch', 'dp-just']),
    ('excipient-spec', 'spec', 'cmc', 'all', 'Change an excipient specification',
     'Tighten, add, delete or widen a test or limit in an excipient specification.',
     'excipient specification limit test', ['dp-exc']),
    ('skip-testing', 'spec', 'cmc', 'all', 'Introduce periodic (skip-lot) testing for a specification test',
     'A test is done on selected batches only, justified by data, instead of on every batch.',
     'skip lot periodic testing reduced testing frequency', ['dp-spec', 'dp-just', 'dp-batch']),
    ('method-minor', 'spec', 'cmc', 'all', 'Make a minor adjustment to an approved analytical procedure',
     'Parameters within allowed adjustments, such as column length or temperature; same technique and principle.',
     'method adjustment column temperature flow minor analytical', ['dp-meth', 'dp-methval']),
    ('micro-rapid', 'spec', 'cmc', 'all', 'Replace a compendial microbiological test with a rapid microbiological method',
     'An alternative, validated rapid method (for example ATP bioluminescence) replaces the compendial test.',
     'rapid microbiological method RMM sterility bioburden alternative', ['dp-meth', 'dp-methval', 'dp-spec']),
    # container
    ('cc-supplier', 'container', 'cmc', 'all', 'Add or change the supplier of a primary packaging component (same material and specification)',
     'A new manufacturer of the same bottle, stopper or blister foil, meeting the same specification.',
     'packaging supplier vendor component bottle stopper foil', ['dp-cc']),
    ('cc-device', 'container', 'cmc', 'all', 'Add or change a measuring or administration device supplied with the product',
     'A co-packaged spoon, oral syringe, cup or pen needle that is not part of the primary container.',
     'measuring device spoon syringe cup co-packaged device', ['dp-cc', 'dp-dev']),
    ('cc-noncontact', 'container', 'cmc', 'all', 'Change a primary packaging part that does not touch the product',
     'For example a code ring, a flip-off seal or a needle shield.',
     'non-contact flip-off seal code ring needle shield', ['dp-cc']),
    # stability
    ('ds-retest', 'stability', 'cmc', 'all', 'Extend the drug substance re-test period',
     'A longer re-test period (or shelf life) for the drug substance, supported by stability data.',
     'retest period API drug substance shelf life extension', ['ds-stab', 'qos']),
    ('in-use-shelf-life', 'stability', 'labeling', 'all', 'Change the shelf life after first opening, dilution or reconstitution',
     'The in-use period on the label changes, for example from 28 days to 56 days after opening.',
     'in-use after opening reconstitution dilution period', ['dp-stabsum', 'dp-stab']),
    ('ds-storage', 'stability', 'cmc', 'all', 'Change the storage conditions of the drug substance',
     'The drug substance gets different storage conditions, for example a lower temperature.',
     'API storage temperature drug substance', ['ds-stab']),
    # labelling
    ('lab-new-route', 'labeling', 'efficacy', 'all', 'Add a new route of administration',
     'For example subcutaneous use for a product approved for intravenous use.',
     'route administration subcutaneous intramuscular new route', ['dp-dev', 'clin-ov', 'clin-sum', 'csr']),
    ('lab-brand-name', 'labeling', 'admin', 'all', "Change the product's brand (invented) name",
     'The product keeps everything else but gets a new trade name.',
     'brand name trade name invented name rename', []),
    ('lab-rmp', 'labeling', 'labeling', 'all', 'Update the risk management plan or additional risk-minimisation measures',
     'Changes to the RMP, or to educational material and other additional measures.',
     'RMP risk management plan REMS educational material', []),
    ('lab-psusa', 'labeling', 'labeling', 'all', 'Implement safety wording agreed after a periodic safety report or signal assessment',
     'Wording the authority has already agreed, for example after a PSUR or PSUSA, or a signal recommendation.',
     'PSUR PSUSA PRAC signal agreed wording class labelling', ['clin-ov']),
    ('lab-delete-indication', 'labeling', 'labeling', 'all', 'Delete an indication',
     'An approved indication is removed from the product information.',
     'delete remove indication withdraw', []),
    # protocols and lifecycle (ICH Q12)
    ('ec-define', 'protocol', 'cmc', 'all', 'Define established conditions for an approved product (ICH Q12)',
     'Propose which elements of the dossier are established conditions and how changes to them will be reported.',
     'established conditions EC ICH Q12 PLCM lifecycle', ['plcm', 'qos']),
    ('plcm-update', 'protocol', 'cmc', 'all', 'Update the product lifecycle management (PLCM) document',
     'Change the PLCM: for example lower the reporting category of an established condition, or add a commitment.',
     'PLCM product lifecycle management ICH Q12', ['plcm']),
    ('non-ec-change', 'protocol', 'cmc', 'all', 'Change something that is not an established condition',
     'Under ICH Q12, changes to elements that are not established conditions are managed in the quality system without reporting.',
     'not established condition supportive information PQS ICH Q12', []),
    ('pacmp-change', 'protocol', 'cmc', 'all', 'Change or delete an approved comparability protocol (PACMP)',
     'Revise the studies or acceptance criteria of an approved protocol, or delete it.',
     'PACMP comparability protocol change delete revise', ['qos']),
    # biologics
    ('bio-scale', 'biologics', 'cmc', 'bio', 'Scale up cell culture or fermentation of a biological drug substance',
     'A larger bioreactor, more bioreactors or a longer run for the same process.',
     'bioreactor scale up upstream cell culture fermentation', ['ds-proc', 'ds-crit', 'ds-val', 'ds-dev', 'ds-batch', 'ds-stab']),
    ('bio-media', 'biologics', 'cmc', 'bio', 'Change a raw material or cell culture medium component',
     'For example a new medium supplier, a chemically defined medium, or removing serum.',
     'media raw material serum supplement feed upstream', ['ds-mat', 'ds-dev', 'ds-batch', 'advent']),
    ('bio-resin', 'biologics', 'cmc', 'bio', 'Change the lifetime or supplier of a chromatography resin',
     'Extend the number of cycles a resin may be used, or move to a resin from another supplier.',
     'resin lifetime cycles chromatography supplier downstream', ['ds-proc', 'ds-val', 'ds-dev']),
    ('bio-potency', 'biologics', 'cmc', 'bio', 'Change the potency assay of a biological product',
     'Replace or change the bioassay used to measure biological activity.',
     'potency bioassay cell-based binding assay biological activity', ['ds-meth', 'ds-methval', 'dp-meth', 'dp-methval', 'ds-ref']),
    ('bio-formulation', 'biologics', 'cmc', 'bio', 'Change the formulation of a biological product',
     'A new buffer, excipient or concentration for the biological drug product.',
     'formulation buffer excipient concentration biologic', ['dp-comp', 'dp-dev', 'dp-spec', 'dp-batch', 'dp-stab', 'ds-dev']),
    ('bio-adventitious', 'biologics', 'cmc', 'bio', 'Update the adventitious agents safety evaluation',
     'New or replacement viral clearance or TSE studies in section 3.2.A.2.',
     'adventitious agents viral safety TSE clearance studies 3.2.A.2', ['advent']),
    # administrative
    ('admin-manufacturer-name', 'admin', 'admin', 'all', 'Change the name or address of a manufacturer (no move)',
     'The site stays where it is; only its name or postal address changes.',
     'manufacturer name address rename postal', ['dp-mfr']),
    ('admin-local-rep', 'admin', 'admin', 'all', 'Change the local representative, agent or pharmacovigilance contact',
     'For example a new local representative in a country, a new authorised agent or a new safety contact person.',
     'local representative agent QPPV contact person importer', []),
    ('admin-inn', 'admin', 'admin', 'all', 'Change the name of the active substance (for example a new INN)',
     'The substance itself is unchanged; its name changes.',
     'INN name active substance rename', []),
    ('admin-delete-presentation', 'admin', 'admin', 'all', 'Delete a strength or pack size',
     'A strength or pack size is withdrawn; others remain.',
     'delete strength pack size withdraw presentation', []),
]

QUESTIONS = {
    'centralised': {'text': 'Is the product authorised through the EU centralised procedure?', 'fromProduct': 'centralised'},
    'dsSameRoute': {'text': 'Does the new source use the same route of synthesis and meet the same drug substance specification, including impurity limits?',
                    'help': 'A different route or new impurities make the change a change to the drug substance process, which is classified more strictly.'},
    'cepCovers': {'text': 'Is the new source covered by a valid Ph. Eur. certificate of suitability (CEP)?',
                  'help': 'A CEP lets authorities rely on the EDQM assessment. Without one, the data come from a master file or the dossier.'},
    'releaseTesting': {'text': 'What will the new site do?', 'type': 'choice', 'options': [
        {'value': 'none', 'label': 'Batch release only (no testing)'},
        {'value': 'chem', 'label': 'Release and physicochemical or microbiological testing'},
        {'value': 'bio', 'label': 'Release and biological, immunological or immunochemical testing'}]},
    'scaleOnly': {'text': 'Is it only a change of scale, with equipment of the same design and operating principle and no change to the process or specifications?'},
    'ipcCritical': {'text': 'Does the in-process control cover a critical attribute, or could the change significantly affect quality?',
                    'help': 'Critical attributes include assay, impurities, dissolution and sterility-related controls.'},
    'holdData': {'text': 'Is the longer hold time supported by data on batches held for the full proposed time, under an approved protocol?'},
    'dsScope': {'text': 'What does the design space change cover?', 'type': 'choice', 'options': [
        {'value': 'unitop', 'label': 'A new design space for a unit operation of the process'},
        {'value': 'method', 'label': 'A new design space for an analytical procedure, excipient or intermediate'},
        {'value': 'extend', 'label': 'A change to, or extension of, an approved design space'}]},
    'isEC': {'text': 'In the approved dossier, is the element you are changing an established condition?',
             'help': 'ICH Q12: only established conditions need a regulatory submission when they change. If no established conditions were agreed, treat the whole quality dossier as binding and classify the change in its own entry.'},
    'plcmCategory': {'text': 'Which reporting category does the approved PLCM document set for changing this established condition?', 'type': 'choice', 'options': [
        {'value': 'prior', 'label': 'Prior approval'},
        {'value': 'moderate', 'label': 'Notification, moderate (wait before implementing)'},
        {'value': 'low', 'label': 'Notification, low (implement, then tell)'}],
        'help': 'ICH Q12 chapter 3 and Annex I: the PLCM lists each established condition with its reporting category.'},
    'presentationKind': {'text': 'What is deleted?', 'type': 'choice', 'options': [
        {'value': 'strength', 'label': 'A strength'}, {'value': 'pack', 'label': 'A pack size'}]},
    'isReleaseSite': {'text': 'Is it the manufacturer responsible for batch release?'},
    'caProtocolLevel': {'text': 'Which reporting level did the approved PACMP set for this change?', 'type': 'choice', 'options': [
        {'value': 'NC', 'label': 'Level II notifiable change'},
        {'value': 'L3IN', 'label': 'Level III immediate notification'},
        {'value': 'L3', 'label': 'Level III annual notification'}]},
    'jpProtocolNotice': {'text': 'Is the change made fully as described in the approved PACMP, with all acceptance criteria met?'},
    'whoMinorU': {'text': 'Will you justify the change as an unclassified minor variation (suffix u), or have you agreed a lower category with PQT in advance?',
                  'help': 'WHO PQ FAQ Q8: changes not listed in the guideline are major by default.'},
    'plcmMajor': {'text': 'Does the update raise risk, for example add or change established conditions or lower a reporting category?',
                  'help': 'Lowering a reporting category or redefining established conditions needs assessment like a major change.'},
    'pacmpAction': {'text': 'What happens to the protocol?', 'type': 'choice', 'options': [
        {'value': 'delete', 'label': 'It is deleted'},
        {'value': 'minor', 'label': 'A minor change that does not change its strategy'},
        {'value': 'major', 'label': 'A major change, for example new studies, acceptance criteria or scope'}]},
    'potencyNewPrinciple': {'text': 'Does the new potency assay use a different principle, for example a cell-based assay replacing a binding assay?'},
    'adventRisk': {'text': 'What do the new studies change?', 'type': 'choice', 'options': [
        {'value': 'first', 'label': 'Steps are tested for the first time for one or more agents'},
        {'value': 'higher', 'label': 'Obsolete studies are replaced and the risk is now higher'},
        {'value': 'same', 'label': 'Obsolete studies are replaced and the risk is the same or lower'}]},
    'deviceSignificant': {'text': 'Could the device change significantly affect the dose delivered, quality, safety or efficacy?'},
    'scoredEqualDose': {'text': 'Is the tablet scored so that it can be divided into equal doses?'},
    'scoreAction': {'text': 'Is the score line added or deleted?', 'type': 'choice', 'options': [
        {'value': 'add', 'label': 'Added'}, {'value': 'delete', 'label': 'Deleted'}]},
    'inUseKind': {'text': 'What is the change to the in-use period?', 'type': 'choice', 'options': [
        {'value': 'reduce', 'label': 'It becomes shorter'},
        {'value': 'extendReal', 'label': 'It becomes longer, based on real-time data'},
        {'value': 'extendModel', 'label': 'It becomes longer, based on extrapolation or modelling'}]},
    'restrictive': {'text': 'Are the new storage conditions more restrictive (for example a lower temperature)?'},
    'excipientSpecKind': {'text': 'What changes in the excipient specification?', 'type': 'choice', 'options': [
        {'value': 'tighten', 'label': 'A limit is tightened'},
        {'value': 'add', 'label': 'A test is added'},
        {'value': 'delete', 'label': 'A non-significant test is deleted'},
        {'value': 'relax', 'label': 'A limit is widened or a significant test deleted'}]},
    'rmpKind': {'text': 'What kind of update is it?', 'type': 'choice', 'options': [
        {'value': 'agreed', 'label': 'It implements an outcome already assessed, with the exact agreed wording'},
        {'value': 'minor', 'label': 'A minor update (for example due dates or a template update)'},
        {'value': 'new', 'label': 'It needs new data and a significant assessment'}]},
    'bioScaleOnly': {'text': 'Is it a scale change with no change to the process (for example adding identical bioreactors or duplicating a line)?'},
    'animalOrigin': {'text': 'Does the change introduce a material of human or animal origin that needs a viral safety or TSE assessment?'},
    'resinChange': {'text': 'What changes for the resin?', 'type': 'choice', 'options': [
        {'value': 'lifetime', 'label': 'More cycles, under an approved resin lifetime protocol'},
        {'value': 'supplier', 'label': 'A different resin or supplier'}]},
    'jpItem': {'text': 'How is the item you are changing described in the Japanese approval form?', 'type': 'choice', 'options': [
        {'value': 'pca', 'label': 'As an approved matter (not marked as a minor change item)'},
        {'value': 'minor', 'label': 'As a minor change item'},
        {'value': 'moderate', 'label': 'As a moderate change item (2024 trial)'},
        {'value': 'annual', 'label': 'As an annual report item (2025 trial)'},
        {'value': 'absent', 'label': 'It is not in the approval form'}],
        'help': 'In Japan the approval form (approved matters) is legally binding. The applicant proposes, and PMDA agrees, which entries are minor change items. Items not in the form are managed in the quality system.'},
    'pqInspected': {'text': 'Was the new site inspected and found compliant by WHO or a stringent regulatory authority within the last three years?',
                    'help': 'WHO PQ: a site without such an inspection makes a site addition a major variation.'},
}

EVIDENCE = {
    'plcm': {'label': 'Product lifecycle management (PLCM) document and established conditions', 'ctd': '3.2.R', 'op': 'new'},
}


def run():
    cat = load('src', 'data', 'catalogue.json')
    have = {c['id'] for c in cat['changes']}
    for (cid, group, kind, scope, title, help_, kw, ev) in NEW:
        if cid in have:
            continue
        cat['changes'].append({'id': cid, 'group': group, 'kind': kind, 'scope': scope, 'title': title, 'help': help_, 'keywords': kw, 'evidence': ev})
    save(cat, 'src', 'data', 'catalogue.json')
    q = load('src', 'data', 'questions.json')
    for k, v in QUESTIONS.items():
        q[k] = v
    save(q, 'src', 'data', 'questions.json')
    e = load('src', 'data', 'evidence.json')
    for k, v in EVIDENCE.items():
        e[k] = v
    save(e, 'src', 'data', 'evidence.json')
    print('catalogue:', len(cat['changes']), 'changes')


if __name__ == '__main__':
    run()
