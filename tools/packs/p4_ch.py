"""Switzerland pack (Swissmedic), edition 2026.1.

From 1 February 2026 Annex 7 of the TPLRO (the list of variations) is harmonised as far as
possible with the EU list, so this pack starts from the EU 2026.1 trees and conditions, swaps the
sources, adapts EU-only wording and procedures, and uses Swissmedic's time limits.
"""
import copy
import re
from lib import load, save, O, Q, C, A, remap

DIR = 'src/packs/ch/2026.1'

SOURCES = {
    'annex7': {'title': 'Therapeutic Products Licensing Requirements Ordinance (TPLRO, SR 812.212.22), Annex 7: list of variations (revised, harmonised with the EU list)',
               'version': 'Revised list', 'date': 'in force 1 February 2026',
               'url': 'https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/authorisations/information/nachfuehrung-anhang-7-amzv-revidierte-liste.html', 'status': 'final'},
    'tpo': {'title': 'Therapeutic Products Ordinance (TPO), Articles 21 to 24 (variations and extensions)', 'version': 'Consolidated', 'date': 'current',
            'url': 'https://www.swissmedic.ch/swissmedic/en/home/legal/legal-basis/rechtsgrundlagen-fuer-heilmittel-in-der-schweiz.html', 'status': 'final'},
    'smqa': {'title': 'Swissmedic: Questions and answers on variations and extensions HMP', 'version': 'Web edition', 'date': '01.10.2026',
             'url': 'https://www.swissmedic.ch/swissmedic/en/home/services/documents/fragenundantworten_aeundzulassungserweiterungen.html', 'status': 'final'},
    'tl': {'title': 'Swissmedic guidance document: Time limits for authorisation applications (ZL000_00_014)', 'version': 'Version 10.0', 'date': 'valid from 01.09.2025',
           'url': 'https://www.swissmedic.ch/dam/swissmedic/en/dokumente/zulassung/zl_hmv_iv/zl000_00_014d_wlfristenzulassungsgesuche.pdf.download.pdf/zl000_00_014e_wltimelimitsforauthorizationapplications.pdf', 'status': 'final'},
    'transfer': {'title': 'Swissmedic guidance document: Transferring an authorisation', 'version': 'Current', 'date': 'read 2026-10-11',
                 'url': 'https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/authorisations.html', 'status': 'final'},
    'q8': {'title': 'ICH Q8(R2) Pharmaceutical development (applied by Swissmedic)', 'version': 'R2', 'date': 'current', 'url': 'https://www.swissmedic.ch/', 'status': 'final'},
    'q12': {'title': 'ICH Q12 (applied by Swissmedic)', 'version': 'Step 5', 'date': 'current', 'url': 'https://www.swissmedic.ch/', 'status': 'final'},
}
SRC = {'gl25': 'annex7', 'reg': 'tpo', 'emaqa': 'smqa', 'emagroup': 'smqa', 'emaproc': 'tl', 'pacmp': 'smqa', 'transfer': 'transfer', 'q8': 'q8', 'q12': 'q12', 'dir': 'smqa'}

CATS = [
    ('NONE', 0, 'No variation', 'No variation needed', 'do', 'Managed in the quality system', 'No submission: the change is managed under the quality system.', 'smqa', 'Q&A', 'letter'),
    ('OTHER', 0, 'Other procedure', 'Separate procedure (not a variation)', 'other', 'Different procedure', 'Use the procedure named in the result.', 'tpo', 'Articles 21 to 24', 'letter'),
    ('IA', 1, 'IA', 'Type IA', 'do-and-tell', 'Do and tell within 12 months',
     'Implement, then notify within 12 months (Type IA changes can be collected over a year). Swissmedic accepts tacitly if it does not object within 30 days.', 'tpo', 'Article 21', 'ar'),
    ('IAIN', 2, 'IA-IN', 'Type IA-IN', 'do-and-tell', 'Do and tell within one month',
     'Implement, then notify no later than one month after implementation (in the EU: immediately). Swissmedic accepts tacitly if it does not object within 30 days.', 'smqa', 'Q1.3', 'cbe0'),
    ('IB', 3, 'IB', 'Type IB', 'tell-and-wait', 'Tell, wait about 70 days, then do',
     'Notify before implementing; the variation is accepted if Swissmedic does not object within 70 days (10 days formal control and 60 days evaluation).', 'tl', 'Annex 6.4', 'cbe30'),
    ('II', 4, 'II', 'Type II', 'wait-for-approval', 'Wait for approval',
     'Implement only after Swissmedic approves; time limits up to 270 days of Swissmedic time plus the applicant\'s response time.', 'tpo', 'Article 23', 'pas'),
    ('EXT', 5, 'Extension', 'Extension of the authorisation', 'wait-for-approval', 'New application',
     'An extension (Article 24 TPO) is assessed like a new application.', 'tpo', 'Article 24', 'ext'),
]


def cats():
    return [{'id': i, 'rank': r, 'short': s, 'label': l, 'implement': im, 'badge': b, 'rule': ru, 'src': src, 'at': at, 'tone': t}
            for (i, r, s, l, im, b, ru, src, at, t) in CATS]


SWAPS = [
    (r'EU/EEA authority or an authority with a GMP', 'Swissmedic, a cantonal inspectorate or an authority with a GMP'),
    (r'in the EU/EEA or in a country with a suitable GMP agreement', 'in Switzerland or in a country with a mutual recognition agreement'),
    (r'in the EU/EEA with a valid manufacturing authorisation, and one release site stays in the EU/EEA', 'in Switzerland with a Swissmedic establishment licence, and one release site stays in Switzerland'),
    (r'with a release site able to certify in the EU/EEA, where relevant', 'with a release site in Switzerland, where relevant'),
    (r'EU food additive and flavouring rules', 'the Swiss food additive and flavouring rules'),
    (r'Union list of critical medicines \(or a similar national list\)', 'Swiss list of critical medicines'),
    (r'EMA has finished its check', 'Swissmedic has accepted'),
    (r'EU/EEA', 'Switzerland'),
]


def swap_text(t):
    for a, b in SWAPS:
        t = re.sub(a, b, t)
    return t


def outcome(o):
    o = dict(o)
    if o['src'] == 'transfer':
        o['at'] = 'Transfer'
    o['src'] = SRC.get(o['src'], o['src'])
    o['why'] = swap_text(o['why'].replace('Article 3 of Regulation (EC) No 1234/2008', 'the default for other variations')
                         .replace('EMA', 'Swissmedic'))
    o['at'] = o['at'].replace('EMA Q&A', 'Swissmedic Q&A')
    if o.get('note'):
        o['note'] = swap_text(o['note'].replace('EMA', 'Swissmedic'))
    return o


OVERRIDES = {
    'lab-layout': O('IB', 'annex7', 'z (other variation)', 'Switzerland has no Article 61(3) notification: a packaging text change that does not touch the information for professionals is filed as an other variation, which defaults to Type IB.',
                    pi=True, note='Simplified. Packaging texts must exist in the required national languages.'),
    'admin-local-rep': O('OTHER', 'tpo', 'Holder in Switzerland', 'Switzerland has no local representative: the authorisation holder itself must be established in Switzerland. A new pharmacovigilance contact is reported by the holder, not as a variation.',
                         note='Simplified.'),
    'lab-brand-name': O('IB', 'annex7', 'E.1(b)', 'A new product name is Type IB (all Swiss authorisations are national).', pi=True),
    'admin-ownership': O('OTHER', 'transfer', 'Transfer', 'A transfer to another holder is a separate procedure under Swissmedic\'s guidance on transferring an authorisation.'),
    'lab-505o4': O('IB', 'annex7', 'C.3(b)', 'Safety wording requested by Swissmedic needs at least minor assessment of the national texts: Type IB.', pi=True,
                   note='Simplified: exact wording already agreed can be Type IA-IN (C.3(a)). Safety-related variations cannot be part of a multiple application.'),
}


def run():
    eup = load('src', 'packs', 'eu', '2026.1', 'pack.json')
    eue = load('src', 'packs', 'eu', '2026.1', 'entries.json')
    entries = {}
    for cid, e in eue.items():
        if cid.startswith('_'):
            continue
        if cid in OVERRIDES:
            entries[cid] = {'tree': dict(OVERRIDES[cid])}
            continue
        tree = remap(copy.deepcopy(e['tree']), outcome)
        # Swiss authorisations are all national: drop the centralised branch.
        if tree.get('ask') == 'centralised':
            tree = tree['on']['no']
        entries[cid] = {'tree': tree}
    conds = {k: {**v, 'text': swap_text(v['text'])} for k, v in eup['conditions'].items() if not k.startswith('13:')}
    pack = {
        'id': 'ch', 'region': 'CH', 'label': 'Switzerland: Swissmedic', 'edition': '2026.1',
        'appliesFrom': '2026-02-01', 'appliesTo': None, 'status': 'in force',
        'summary': 'Variations under Articles 21 to 24 TPO, classified with the revised list in Annex 7 TPLRO (in force 1 February 2026), harmonised as far as possible with the EU list. Swiss time limits and procedures apply: Type IA-IN within one month, Type IB tacit acceptance after about 70 days, no EU worksharing.',
        'sources': SOURCES, 'categories': cats(), 'conditions': conds,
        'multipleChanges': {'rule': 'Several variations for one product can be filed as a multiple application, processed on the longest time limit and completed together. Safety-related variations cannot be part of a multiple application.', 'src': 'smqa', 'at': 'Q1.7, Q1.25, Q2.2'},
        'filing': {'shared': ['IA', 'IAIN'], 'apart': ['NONE', 'OTHER']},
        'clocks': {
            'IA': {'months': 12, 'reviewDays': 30, 'label': 'Notify within 12 months of implementation; tacit acceptance after 30 days', 'src': 'smqa'},
            'IAIN': {'daysAfter': 30, 'reviewDays': 30, 'label': 'Notify within one month of implementation; tacit acceptance after 30 days', 'src': 'smqa'},
            'IB': {'days': 70, 'label': 'Accepted if Swissmedic does not object within 70 days (10 formal control + 60 evaluation)', 'src': 'tl'},
            'II': {'days': 270, 'daysSafety': 60, 'label': 'Up to 270 days of Swissmedic time (30 formal control, 120 first evaluation, 70 second evaluation, 50 after the preliminary decision), plus the applicant\'s response time', 'src': 'tl'},
            'EXT': {'days': 330, 'label': 'Up to 330 days of Swissmedic time, plus the applicant\'s response time', 'src': 'tl'},
        },
        'm1': {
            'variation': [{'code': 'ch:1.0', 'label': 'Cover letter (generally not required for Type IA, IA-IN and IB)'}, {'code': 'ch:1.2.1', 'label': 'Form: Variations and extensions HMP (version valid from 1 February 2026)'},
                          {'code': 'ch:1.2.2', 'label': 'Additional forms (for example the manufacturer information form)'}],
            'extension': [{'code': 'ch:1.0', 'label': 'Cover letter'}, {'code': 'ch:1.2.1', 'label': 'Form: Variations and extensions HMP'}],
            'pi': [{'code': 'ch:1.3.1', 'label': 'Information for healthcare professionals (tracked and clean)'}, {'code': 'ch:1.3.2', 'label': 'Patient information'},
                   {'code': 'ch:1.3.3', 'label': 'Packaging texts'}],
            'foreign': [{'code': 'ch:1.7', 'label': 'Decisions of foreign authorities (where the same change was approved abroad)'}],
            'other': [{'code': 'ch:1.0', 'label': 'Letter for the procedure named in the result'}],
        },
        'm1map': {'IA': ['variation'], 'IAIN': ['variation'], 'IB': ['variation'], 'II': ['variation'], 'EXT': ['extension'], 'OTHER': ['other']},
        'ectd': {'IA': {'submissionType': 'var-type1a', 'subType': 'initial'}, 'IAIN': {'submissionType': 'var-type1ain', 'subType': 'initial'},
                 'IB': {'submissionType': 'var-type1b', 'subType': 'initial'}, 'II': {'submissionType': 'var-type2', 'subType': 'initial'},
                 'EXT': {'submissionType': 'extension', 'subType': 'initial'}, 'NONE': None, 'OTHER': None},
        'changeLog': [{'edition': '2026.1', 'date': '2026-10-11', 'text': 'First Switzerland edition, built from the EU 2026.1 trees with Swiss sources, wording and time limits.'}],
    }
    save(pack, DIR, 'pack.json')
    save(entries, DIR, 'entries.json')
    print('Switzerland:', len(entries), 'entries,', len(conds), 'conditions')


if __name__ == '__main__':
    run()
