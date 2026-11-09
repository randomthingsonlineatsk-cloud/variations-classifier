"""Write the PAC/2024 row-by-row answers (in_pac24.BIO) into the biologics branch of both
India editions, add the questions they use, and log the change. Run after p4_existing.py.
"""
import copy
from lib import load, save
from in_pac24 import BIO, QUESTIONS

EDITIONS = (('src', 'packs', 'in', '2026.1'), ('src', 'packs', 'in', '2026.1-draft'))
LOG = {'date': '2026-11-09', 'text': 'Biologics: every change now has its PAC/2024 (v1.2) row, with the lower category when the row conditions are met; changes that only exist for chemical drugs say that PAC/2024 has no row. Corrected drug product process changes (DP 40: notifiable, not supplement) and in-process limits (DS 15).'}


def leaves(node):
    if 'cat' in node:
        yield node
    elif 'allOf' in node:
        yield from leaves(node['pass']); yield from leaves(node['fail'])
    else:
        for v in node['on'].values():
            yield from leaves(v)


def run():
    q = load('src', 'data', 'questions.json')
    q.update(QUESTIONS)
    save(q, 'src', 'data', 'questions.json')
    for ed in EDITIONS:
        e = load(*ed, 'entries.json'); p = load(*ed, 'pack.json')
        for cid, branch in BIO.items():
            if cid not in e:
                raise SystemExit(f'{cid} is not in {ed[-1]}')
            t = e[cid]['tree']
            assert t.get('ask') == 'bio', cid
            t['on']['yes'] = copy.deepcopy(branch)
        left = [cid for cid, v in e.items() if not cid.startswith('_') and any(o.get('at') == 'Not modelled' for o in leaves(v['tree']))]
        if left:
            raise SystemExit(f'still not modelled in {ed[-1]}: {left}')
        p['changeLog'] = [c for c in p['changeLog'] if c['date'] != LOG['date'] or c['text'] != LOG['text']]
        p['changeLog'].append({'edition': p['edition'], **LOG})
        save(e, *ed, 'entries.json'); save(p, *ed, 'pack.json')
    print('India PAC/2024 rows:', len(BIO))


if __name__ == '__main__':
    run()
