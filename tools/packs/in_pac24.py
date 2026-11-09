"""India, biological products: answers from CDSCO PAC/2024 (version 1.2) row by row.

Each entry is the 'bio = yes' branch of an India tree. Row references are to the quality
change tables (DS rows 1-32, DP rows 33-63), the PACMP rows (section 5), the safety and
efficacy table, section 8 (labelling) and Appendix 1 (Level IV examples).
Supplement = Level I (L1), Notifiable = Level II (L2), Annual = Level III (L3), Level IV = REC.
Run p8_in_pac24.py after p4_existing.py to write these into both India editions.
"""
from lib import O, Q, C

P = 'pac24'
CONDS_NOTE = 'If any one condition in the row is not met, the change stays at the higher level.'


def NA(at, what):
    """A row printed as 'Notifiable change; Annual notification if conditions ... met'."""
    return Q('pacConds',
             O('L3', P, at, f'{what}: annual notification (Level III), because every condition for the lower level is met.', note=CONDS_NOTE),
             O('L2', P, at, f'{what}: notifiable change (Level II).'))


def SN(at, what):
    """A row printed as 'Supplement; Notifiable change if conditions ... met'."""
    return Q('pacConds',
             O('L2', P, at, f'{what}: notifiable change (Level II), because every condition for the lower level is met.', note=CONDS_NOTE),
             O('L1', P, at, f'{what}: supplement (Level I).'))


def NO_ROW(why):
    return O('CDSCO', P, 'No matching row', why + ' Classify it with the level definitions in PAC/2024 (potential to affect quality, safety or efficacy) and confirm with CDSCO.',
             note='PAC/2024 has no row for this change.')


SMALL_ONLY = 'This change is specific to chemical (small-molecule) products, and PAC/2024 has no row for it.'

BIO = {
    # Sites and facilities
    'ds-site-move': Q('existingSite', NA('DS 2(b)', 'A new or replacement drug substance facility or suite within an existing site'),
                      O('L1', P, 'DS 2(a)', 'A new or replacement drug substance facility at a new site, or a new manufacturer, is a supplement (Level I).')),
    'ds-intermediate-site': Q('existingSite', NA('DS 2(b)', 'A new or replacement facility for an intermediate within an existing site'),
                              O('L1', P, 'DS 2(a)', 'A new facility at a new site for a starting material, intermediate or drug substance is a supplement (Level I).')),
    'dp-site-move': Q('existingSite', SN('DP 38(b)', 'Replacing the formulation or filling suite'),
                      SN('DP 38(a)', 'Replacing or adding a drug product manufacturing facility at a new site')),
    'fill-line-add': Q('existingSite', O('L2', P, 'DP 38(c)', 'Adding an equivalent formulation or filling suite is a notifiable change (Level II).'),
                       SN('DP 38(a)', 'Adding a drug product manufacturing facility at a new site')),
    'primary-pack-site': Q('existingSite', SN('DP 38(b)', 'Filling into the primary container is part of drug product manufacture; replacing the filling suite'),
                           SN('DP 38(a)', 'Filling into the primary container is part of drug product manufacture; a facility at a new site')),
    'secondary-pack-site': O('L3', P, 'DP 38(d)', 'Replacing or adding a secondary packaging, storage or distribution facility is an annual notification (Level III).'),
    'labeling-site': O('L3', P, 'DP 38(d)', 'Labelling is a secondary packaging operation; a new secondary packaging facility is an annual notification (Level III).'),
    'site-delete': O('L3', P, 'DS 2(i), DP 38(f)', 'Deleting a facility, manufacturer or site is an annual notification (Level III).'),
    'batch-release-site': O('L3', P, 'DP 50(c), 50(d)', 'Transferring drug product QC testing to a different site, or adding a laboratory, is an annual notification (Level III).'),
    'testing-site': NA('DS 20(a), DP 50(a)', 'Transferring QC testing of a non-pharmacopoeial assay to a new site or company'),
    'component-sterilization-site': NA('DP 58(a)', 'A new source of sterilised components is treated as a new container closure supplier'),
    'ink-imprint-site': NO_ROW(SMALL_ONLY),

    # Drug substance process
    'ds-route-new': O('L1', P, 'DS 4(a), 5(a)', 'For a biological product a new route means a new cell culture or purification process, which is a critical change: supplement (Level I).', note='Closest row.'),
    'ds-process-change': C('pacImpact',
                           critical=O('L1', P, 'DS 4(a), 5(a)', 'A critical change to cell culture or purification (for example one that affects viral clearance or the impurity profile) is a supplement (Level I).'),
                           moderate=NA('DS 4(b), 5(b)', 'A change with moderate potential impact (for example a different type of chromatography)'),
                           noncritical=O('L3', P, 'DS 4(c), 5(c)', 'A non-critical change (for example harvest pooling, an added identical bioreactor or an equivalent in-line filter) is an annual notification (Level III).')),
    'ds-starting-material': NO_ROW('Redefining starting materials is a chemical-synthesis concept; for a biological product the cell bank system is the start of the process.'),
    'ds-scale': O('L2', P, 'DS 6(a), 6(b)', 'A scale change at the fermentation or purification stage is a notifiable change (Level II).'),
    'hold-time': O('L2', P, 'DS 7', 'Changing the parameters of an approved holding step, or adding one, is a notifiable change (Level II).', note='A drug product hold time is extended under DP 61(a).'),
    'continuous-mfg': O('L1', P, 'DS 4(a), 5(a)', 'Moving to continuous processing is a critical change to the process: supplement (Level I).', note='Closest row.'),
    'design-space-new': O('L1', P, 'DS 17(a), 17(b); DP 37(a), 37(b)', 'Establishing a new design space or expanding an approved one is a supplement (Level I).'),
    'rtrt': O('L1', P, 'DS 19(a), DP 51(a)', 'Changing from end-product testing to upstream controls (real-time release, PAT) is a supplement (Level I).'),
    'ds-cep': O('L1', P, 'DS 2(a)', 'A new drug substance manufacturer is a supplement (Level I). Certificates of suitability do not cover biological substances.'),

    # Drug product process
    'dp-process-change': Q('pacCritical', O('L2', P, 'DP 40(a)', 'A critical drug product manufacturing process change is a notifiable change (Level II).'),
                           O('L3', P, 'DP 40(b)', 'A non-critical process change is an annual notification (Level III).')),
    'dp-scale': Q('pacScaleUp', O('L2', P, 'DP 40(d)', 'A scale-up at the formulation or filling stage is a notifiable change (Level II).'),
                  O('L3', P, 'DP 40(e)', 'A scale within the approved scales, or a scale-down, is an annual notification (Level III).')),
    'dp-equipment-same': O('L3', P, 'DS 13(d)', 'Replacing equipment with identical or equivalent product-contact equipment is an annual notification (Level III).', note='Identical non-product-contact equipment is Level IV (Appendix 1).'),
    'dp-reprocessing': O('L2', P, 'DP 40(c)', 'A reprocessing procedure adds a process step, which is a notifiable change (Level II).', note='Closest row.'),
    'dp-order-addition': Q('pacCritical', O('L2', P, 'DP 40(a)', 'A critical process change is a notifiable change (Level II).'),
                           O('L3', P, 'DP 40(b)', 'A non-critical process change is an annual notification (Level III).')),
    'sterile-filter': O('L2', P, 'DP 40(a)', 'Sterilising filtration is a critical step, so a change to it is a notifiable change (Level II).'),
    'sterilization-method': O('L2', P, 'DP 40(a)', 'A change to the sterilisation method is a critical process change: notifiable change (Level II).', note='Replacing the sterility test with parametric release is a supplement (DP 48(a)).'),
    'depyrogenation': O('L2', P, 'DP 40(a)', 'Depyrogenation of components is a critical step for a sterile product: notifiable change (Level II).', note='Closest row.'),
    'inprocess-filtration-remove': Q('pacCritical', O('L2', P, 'DP 40(a)', 'Removing a filtration step that is critical is a notifiable change (Level II).'),
                                     O('L3', P, 'DP 40(b)', 'Removing a non-critical filtration is an annual notification (Level III).')),
    'control-increase': Q('pacQualityIssue', O('L2', P, 'DS 15(f), DP 42(f)', 'An in-process test added or replaced because of a quality or safety issue is a notifiable change (Level II).'),
                          O('L3', P, 'DS 15(b), DP 42(c)', 'Adding or replacing an in-process test is an annual notification (Level III).')),
    'ipc-tighten': Q('appliesToDS', NA('DS 15(a)', 'Narrowing a drug substance in-process limit'),
                     O('L3', P, 'DP 42(e)', 'Tightening a drug product in-process acceptance criterion is an annual notification (Level III).')),
    'ipc-relax': NA('DS 15(d), DP 42(d)', 'Widening an in-process limit'),

    # Excipients and composition
    'excipient-supplier': Q('pacNonCriticalExcipient', O('REC', P, 'Appendix 1', 'A new supplier of a non-critical excipient is a Level IV change: record it under GMP.'),
                            NA('DP 46(f)', 'A new supplier of a non-plasma excipient')),
    'excipient-spec': C('excipientSpecKind',
                        tighten=O('L3', P, 'DP 44(e)', 'Tightening an excipient acceptance criterion is an annual notification (Level III).'),
                        add=NA('DP 44(c)', 'Adding an excipient release test'),
                        delete=NA('DP 44(a)', 'Deleting an excipient release test'),
                        relax=NA('DP 44(d)', 'Relaxing an excipient acceptance criterion')),
    'tse-excipient': O('L2', P, 'DP 46(b)', 'Changing an excipient source from one with a TSE risk to a vegetable or synthetic one is a notifiable change (Level II).'),
    'new-strength': SN('DP 33(b)', 'A new strength or a change in the concentration of the active'),
    'coating-weight': NO_ROW(SMALL_ONLY),
    'score-line': NO_ROW(SMALL_ONLY),
    'tablet-shape': NO_ROW(SMALL_ONLY),
    'dp-ink': NO_ROW(SMALL_ONLY),
    'dp-emboss': NO_ROW(SMALL_ONLY),
    'colour-flavour-delete': NO_ROW(SMALL_ONLY),
    'be-study-change': NO_ROW('Biological products show comparability rather than bioequivalence; the row for the underlying change decides the level.'),

    # Specifications and methods
    'spec-tighten': O('L3', P, 'DS 21(d), DP 48(f)', 'Tightening an acceptance criterion is an annual notification (Level III).'),
    'spec-relax': Q('appliesToDS', O('L2', P, 'DS 21(c)', 'Relaxing a drug substance acceptance criterion is a notifiable change (Level II).'),
                    NA('DP 48(e)', 'Relaxing a drug product acceptance criterion')),
    'spec-delete-test': NA('DS 21(a), DP 48(b)', 'Deleting a release or shelf-life test'),
    'spec-add-test': NA('DS 21(b), DP 48(c)', 'Replacing or adding a release or shelf-life test'),
    'spec-compendial': O('L3', P, 'DS 18(c), DP 47(c)', 'Updating a specification to an updated pharmacopoeial monograph is an annual notification (Level III).', note='Level IV if done within six months of the update.'),
    'nitrosamine-control': NA('DS 21(b), DP 48(c)', 'Adding a test and limit'),
    'skip-testing': NA('DS 21(a), DP 48(b)', 'Testing less often is treated as deleting a routine release test'),
    'method-minor': O('L3', P, 'DS 22(c), DP 49(c)', 'A minor change to an approved analytical procedure is an annual notification (Level III).'),
    'method-change': Q('minorMethodChange', O('L3', P, 'DS 22(c), DP 49(c)', 'A minor change to an approved analytical procedure is an annual notification (Level III).'),
                       NA('DS 22(b), DP 49(b)', 'Replacing an analytical procedure')),
    'method-new-regulatory': NA('DS 22(b), DP 49(b)', 'Adding an analytical procedure'),
    'method-alternative': C('altAction', add=NA('DS 22(b), DP 49(b)', 'Adding an alternative analytical procedure'),
                            delete=NA('DS 22(a), DP 49(a)', 'Deleting an analytical procedure')),
    'method-components': NA('DP 60(a)', 'Replacing or adding a procedure for container closure components'),
    'method-raw-material': NO_ROW('Raw materials for chemical synthesis are not part of a biological process; DS 14 covers biologically derived materials and reagents.'),
    'micro-rapid': NA('DP 49(b)', 'Replacing a pharmacopoeial procedure with a rapid microbiological method'),
    'reference-standard': Q('refStdProtocol', O('L3', P, 'DS 23(d), DP 52(d)', 'Qualifying a new lot of the reference standard is an annual notification (Level III).', note='For vaccines and toxins, see DS 24 and DP 53.'),
                            O('L2', P, 'DS 23(a), DP 52(a)', 'Qualifying a new reference standard is a notifiable change (Level II).')),

    # Container closure and devices
    'cc-supplier': NA('DS 28(a), DP 58(a)', 'Replacing or adding a container closure supplier'),
    'cc-polymer': NA('DP 57(a)', 'Modifying the container closure system'),
    'cc-sterile': Q('containerTypeChange', O('L2', P, 'DP 33(c)', 'A new container type is a new presentation: notifiable change (Level II).'),
                    NA('DP 57(a)', 'Modifying the container closure system')),
    'cc-dose-device': Q('deviceSignificant', O('L1', P, 'Safety and efficacy, row 3(e)', 'A new device for administration is a supplement (Level I).'),
                        NA('DP 57(a)', 'Modifying the container closure system')),
    'cc-device': Q('deviceSignificant', O('L1', P, 'Safety and efficacy, row 3(e)', 'A new device for administration is a supplement (Level I).'),
                   NA('DP 57(a)', 'Modifying the container closure system')),
    'cc-closure-liquid': NA('DP 57(a)', 'Modifying the container closure system'),
    'cc-size-shape': NA('DP 57(a)', 'Modifying the container closure system'),
    'cc-count': C('pacCountKind',
                  pack=O('L2', P, 'DP 33(c)', 'A new pack count is a new presentation: notifiable change (Level II).'),
                  fill=Q('pacConds', O('L3', P, 'DP 33(d)', 'A fill volume change at the same concentration is an annual notification (Level III) when conditions 1, 4 and 5 are met; notifiable (Level II) when only 1 and 4 are met.', note=CONDS_NOTE),
                         O('L1', P, 'DP 33(d)', 'A fill volume change at the same concentration is a supplement (Level I) unless the conditions for a lower level are met.'))),
    'cc-secondary-protective': NA('DP 57(a)', 'Removing protective packaging modifies the container closure system'),
    'cc-cap-colour': O('REC', P, 'Appendix 1', 'Changing the colour of the stopper cap of an injectable is a Level IV change: record it under GMP.'),
    'cc-noncontact': O('L3', P, 'DP 57(a)', 'A change to a non-contact component is an annual notification (Level III).', note='Tertiary packaging that does not affect stability is Level IV (Appendix 1).'),
    'cc-closure-solid': NO_ROW(SMALL_ONLY),
    'cc-desiccant': NO_ROW(SMALL_ONLY),
    'cc-blister': NO_ROW(SMALL_ONLY),

    # Stability and storage
    'shelf-life-extend': Q('pacConds', O('L3SL', P, 'DS 30(a), DP 61(a)', 'A shelf-life extension is an annual-level change when conditions 1 to 5 are met, but shelf-life changes need approval before use.', note=CONDS_NOTE),
                           O('L2', P, 'DS 30(a), DP 61(a)', 'A shelf-life extension is a notifiable change (Level II).')),
    'ds-retest': Q('pacConds', O('L3SL', P, 'DS 30(a)', 'A drug substance shelf-life extension is an annual-level change when conditions 1 to 5 are met, but shelf-life changes need approval before use.', note=CONDS_NOTE),
                   O('L2', P, 'DS 30(a)', 'A drug substance shelf-life extension is a notifiable change (Level II).')),
    'shelf-life-reduce': NA('DS 30(b), DP 61(b)', 'Reducing the shelf life'),
    'ds-storage': NA('DS 31(c)', 'Adding or changing a drug substance storage condition'),
    'storage-conditions': NA('DP 62(c)', 'Adding or changing a drug product storage condition'),
    'stability-protocol': Q('stabilityTimepointsOnly', O('L3', P, 'DS 32(b)-(e), DP 63(b)-(e)', 'Adding time points or tests, or deleting time points, is an annual notification (Level III).'),
                            NA('DS 32(a), DP 63(a)', 'A major change to the post-approval stability protocol')),

    # Labelling and efficacy
    'lab-clinical-section': O('L2', P, 'Section 8', 'Labelling changes need approval before they are implemented; a change that alters a claim is a supplement (safety and efficacy, row 1(c)).', pi=True, note='The app shows the common case.'),
    'lab-delete-claim': O('L2', P, 'Safety and efficacy, row 1(b)', 'Deleting an indication or claim is a notifiable change (Level II).', pi=True),
    'lab-505o4': O('L2', P, 'Section 8', 'Safety labelling needs approval before it is implemented; mark urgent changes "Urgent Product Labelling Information Changes" so CDSCO processes them quickly.', pi=True),
    'lab-rld-update': O('L2', P, 'Section 8', 'Aligning with the reference product\'s updated labelling is a labelling change that needs approval before it is implemented.', pi=True, note='Biological products have a reference product, not a reference listed drug.'),
    'lab-layout': Q('editorialOnly', O('REC', P, 'Appendix 1', 'A minor layout change or typo correction that does not alter label content is Level IV.'),
                    O('L2', P, 'Section 8', 'A label change that alters content needs approval before it is implemented.', pi=True)),
    'lab-rmp': O('L2', P, 'Safety and efficacy, row 3(f)', 'A change to risk management is a notifiable change (Level II).'),

    # Lifecycle tools
    'cp-submit': O('L2', P, 'Section 5(a)', 'Introducing a post-approval change management protocol is a notifiable change (Level II).'),
    'cp-use': O('L3', P, 'Section 5', 'A change made under an approved protocol is reported at the lower level the protocol set; the app shows the usual case.', note='Use the level in your approved protocol.'),
    'pacmp-change': C('pacmpAction',
                      delete=O('L3', P, 'Section 5(b)', 'Deleting an approved change management protocol is an annual notification (Level III).'),
                      minor=O('L2', P, 'Section 5(c)', 'A minor change to an approved protocol is a notifiable change (Level II).'),
                      major=O('L2', P, 'Section 5(a)', 'A major change is in effect a new protocol: notifiable change (Level II).', note='Closest row.')),
    'ec-define': NO_ROW('PAC/2024 does not use ICH Q12 established conditions or a PLCM document.'),
    'plcm-update': NO_ROW('PAC/2024 does not use ICH Q12 established conditions or a PLCM document.'),
    'non-ec-change': NO_ROW('PAC/2024 does not use ICH Q12 established conditions, so the row for the change itself decides the level.'),
}

QUESTIONS = {
    'pacConds': {'text': 'Does the change meet every condition PAC/2024 lists for the lower category in that row?',
                 'help': 'The tables print a higher category with a lower one "if conditions ... met". If any one condition is not met, the higher category applies.'},
    'pacImpact': {'text': 'How much could the process change affect the product?', 'type': 'choice',
                  'options': [{'value': 'critical', 'label': 'Critical (for example viral clearance or the impurity profile)'},
                              {'value': 'moderate', 'label': 'Moderate (for example a different type of chromatography)'},
                              {'value': 'noncritical', 'label': 'Non-critical (for example an added identical bioreactor)'}]},
    'pacCritical': {'text': 'Does the change affect a critical process step or parameter?'},
    'pacScaleUp': {'text': 'Is it a scale-up beyond the approved scales (not a scale within them or a scale-down)?'},
    'pacQualityIssue': {'text': 'Is the in-process test added or replaced because of a quality or safety issue?'},
    'pacNonCriticalExcipient': {'text': 'Is it a non-critical excipient?', 'help': 'PAC/2024 Appendix 1 lists a supplier change for non-critical excipients as Level IV.'},
    'pacCountKind': {'text': 'What changes?', 'type': 'choice',
                     'options': [{'value': 'pack', 'label': 'The number of units in the pack'},
                                 {'value': 'fill', 'label': 'The fill volume or labelled amount per container'}]},
}
