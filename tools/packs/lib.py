"""Helpers for writing pack decision trees in Python.

O(...) is an outcome, Q(...) a yes/no question, C(...) a choice question and A(...) an
annex-condition checklist. The generators in this folder write src/packs/<region>/<edition>.
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def path(*p):
    return os.path.join(ROOT, *p)


def load(*p):
    with open(path(*p), encoding='utf-8') as f:
        return json.load(f)


def save(obj, *p):
    full = path(*p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def O(cat, src, at, why, note=None, pi=False, **extra):
    o = {'cat': cat, 'src': src, 'at': at, 'why': why}
    if note:
        o['note'] = note
    if pi:
        o['pi'] = True
    o.update(extra)
    return o


def Q(ask, yes, no):
    return {'ask': ask, 'on': {'yes': yes, 'no': no}}


def C(ask, **branches):
    return {'ask': ask, 'on': branches}


def A(conds, ok, fail):
    return {'allOf': list(conds), 'pass': ok, 'fail': fail}


def outcomes(node):
    if 'cat' in node:
        return [node]
    if 'allOf' in node:
        return outcomes(node['pass']) + outcomes(node['fail'])
    out = []
    for v in node['on'].values():
        out += outcomes(v)
    return out


def remap(node, fn):
    """Copy a tree, passing every outcome through fn(outcome) -> node."""
    if 'cat' in node:
        return fn(dict(node))
    if 'allOf' in node:
        return {'allOf': list(node['allOf']), 'pass': remap(node['pass'], fn), 'fail': remap(node['fail'], fn)}
    return {'ask': node['ask'], 'on': {k: remap(v, fn) for k, v in node['on'].items()}}


def rekey_conditions(node, fn):
    if 'cat' in node:
        return dict(node)
    if 'allOf' in node:
        return {'allOf': [fn(c) for c in node['allOf']], 'pass': rekey_conditions(node['pass'], fn), 'fail': rekey_conditions(node['fail'], fn)}
    return {'ask': node['ask'], 'on': {k: rekey_conditions(v, fn) for k, v in node['on'].items()}}
