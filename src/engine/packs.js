// Content packs and the region-neutral catalogue. The engine knows nothing about any one
// region: everything regional comes from a pack edition.
import catalogue from '../data/catalogue.json' with { type: 'json' };
import questions from '../data/questions.json' with { type: 'json' };
import evidence from '../data/evidence.json' with { type: 'json' };
import usPack from '../packs/us/2026.1/pack.json' with { type: 'json' };
import usEntries from '../packs/us/2026.1/entries.json' with { type: 'json' };
import eu13Pack from '../packs/eu/2013.1/pack.json' with { type: 'json' };
import eu13Entries from '../packs/eu/2013.1/entries.json' with { type: 'json' };
import eu26Pack from '../packs/eu/2026.1/pack.json' with { type: 'json' };
import eu26Entries from '../packs/eu/2026.1/entries.json' with { type: 'json' };
import inPack from '../packs/in/2026.1/pack.json' with { type: 'json' };
import inEntries from '../packs/in/2026.1/entries.json' with { type: 'json' };
import inDraftPack from '../packs/in/2026.1-draft/pack.json' with { type: 'json' };
import inDraftEntries from '../packs/in/2026.1-draft/entries.json' with { type: 'json' };
import caPack from '../packs/ca/2026.1/pack.json' with { type: 'json' };
import caEntries from '../packs/ca/2026.1/entries.json' with { type: 'json' };
import chPack from '../packs/ch/2026.1/pack.json' with { type: 'json' };
import chEntries from '../packs/ch/2026.1/entries.json' with { type: 'json' };
import jpPack from '../packs/jp/2026.1/pack.json' with { type: 'json' };
import jpEntries from '../packs/jp/2026.1/entries.json' with { type: 'json' };
import whoPack from '../packs/who/2026.1/pack.json' with { type: 'json' };
import whoEntries from '../packs/who/2026.1/entries.json' with { type: 'json' };

const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));

export const CATALOGUE = catalogue;
export const CHANGES = catalogue.changes;
export const CHANGE = Object.fromEntries(catalogue.changes.map((c) => [c.id, c]));
export const GROUP = Object.fromEntries(catalogue.groups.map((g) => [g.id, g]));
export const QUESTIONS = strip(questions);
export const EVIDENCE = strip(evidence);

// Every edition of every pack, newest last. A classification stores pack id + edition.
export const PACKS = {
  us: [{ ...usPack, entries: strip(usEntries), conditions: {} }],
  eu: [{ ...eu13Pack, entries: strip(eu13Entries) }, { ...eu26Pack, entries: strip(eu26Entries) }],
  in: [{ ...inPack, entries: strip(inEntries) }, { ...inDraftPack, entries: strip(inDraftEntries) }],
  ca: [{ ...caPack, entries: strip(caEntries) }],
  ch: [{ ...chPack, entries: strip(chEntries) }],
  jp: [{ ...jpPack, entries: strip(jpEntries) }],
  who: [{ ...whoPack, entries: strip(whoEntries) }],
};

export const REGIONS = [
  { id: 'us', label: 'United States', short: 'US', ready: true },
  { id: 'eu', label: 'European Union', short: 'EU', ready: true },
  { id: 'in', label: 'India', short: 'India', ready: true },
  { id: 'ca', label: 'Canada', short: 'Canada', ready: true },
  { id: 'ch', label: 'Switzerland', short: 'Switzerland', ready: true },
  { id: 'jp', label: 'Japan', short: 'Japan', ready: true },
  { id: 'who', label: 'WHO prequalification', short: 'WHO PQ', ready: true },
];

// The edition in force on a date (ISO yyyy-mm-dd), or the newest one.
export function packFor(id, { edition = null, date = null, draft = false } = {}) {
  const all = PACKS[id];
  if (edition) return all?.find((p) => p.edition === edition) ?? null;
  const eds = all?.filter((p) => !!p.draft === !!draft);
  if (!eds?.length) return null;
  if (edition) return eds.find((p) => p.edition === edition) ?? null;
  if (date) {
    const fit = eds.filter((p) => p.appliesFrom <= date && (!p.appliesTo || date < p.appliesTo));
    if (fit.length) return fit[fit.length - 1];
  }
  return eds[eds.length - 1];
}

export const categoryOf = (pack, id) => pack.categories.find((c) => c.id === id) ?? null;
export const toneOf = (pack, id) => categoryOf(pack, id)?.tone ?? 'letter';
// Categories that need no filing (quality system, record, other procedure, not available).
export const noFiling = (pack, id) => (pack.filing?.apart ?? []).includes(id);
export const rankOf = (pack, id) => categoryOf(pack, id)?.rank ?? -1;
export const sourceOf = (pack, id) => pack.sources[id] ?? { title: id };

export const regionOf = (id) => REGIONS.find((r) => r.id === id);
export const READY = REGIONS.filter((r) => r.ready).map((r) => r.id);

// Condition ids (from a pack's annex conditions) look like "Q.II.b.1:2" or "13:B.II.b.1:2".
export const isCondition = (qid) => /:\d+$/.test(qid);
export const conditionCode = (qid) => qid.replace(/^13:/, '').replace(/^(HC|WHO)-/, '$1 ').replace(/:(\d+)$/, ' condition $1');
export function questionText(pack, qid) {
  if (QUESTIONS[qid]) return QUESTIONS[qid].text;
  const c = pack?.conditions?.[qid];
  return c ? c.text : qid;
}
export const questionHelp = (pack, qid) => QUESTIONS[qid]?.help ?? '';

// Options for a question: yes/no unless it is a choice question.
export function optionsFor(qid) {
  const q = QUESTIONS[qid];
  if (q?.type === 'choice') return q.options.map((o) => ({ value: o.value, label: o.label }));
  return [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
}
export const answerLabel = (qid, value) => {
  if (value == null || value === 'unknown') return 'Not known';
  const o = optionsFor(qid).find((x) => x.value === value);
  return o ? o.label : String(value);
};

// Changes that apply to a product (biologics-only changes hidden for small molecules and so on).
export function changesFor(product) {
  const f = product?.facts ?? {};
  return CHANGES.filter((c) => c.scope === 'all'
    || (c.scope === 'bio' && f.bio)
    || (c.scope === 'small' && !f.bio)
    || (c.scope === 'sterile' && f.sterile));
}

export function searchChanges(list, text) {
  const t = text.trim().toLowerCase();
  if (!t) return list;
  const words = t.split(/\s+/);
  return list.filter((c) => {
    const hay = `${c.title} ${c.help} ${c.keywords}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// Regions a product has a profile for (the US and EU profiles are part of every built-in product).
export function regionsFor(product) {
  return READY.filter((r) => ['us', 'eu', 'in'].includes(r) || !!product?.[r]);
}
