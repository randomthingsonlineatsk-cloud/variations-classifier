// Content packs and the region-neutral catalogue. The engine knows nothing about any one
// region: everything regional comes from a pack edition.
import catalogue from '../data/catalogue.json' with { type: 'json' };
import questions from '../data/questions.json' with { type: 'json' };
import evidence from '../data/evidence.json' with { type: 'json' };
import usPack from '../packs/us/2026.1/pack.json' with { type: 'json' };
import usEntries from '../packs/us/2026.1/entries.json' with { type: 'json' };

const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));

export const CATALOGUE = catalogue;
export const CHANGES = catalogue.changes;
export const CHANGE = Object.fromEntries(catalogue.changes.map((c) => [c.id, c]));
export const GROUP = Object.fromEntries(catalogue.groups.map((g) => [g.id, g]));
export const QUESTIONS = strip(questions);
export const EVIDENCE = strip(evidence);

// Every edition of every pack, newest last. A classification stores pack id + edition.
export const PACKS = {
  us: [{ ...usPack, entries: strip(usEntries) }],
};

export const REGIONS = [
  { id: 'us', label: 'United States', short: 'US', ready: true },
  { id: 'eu', label: 'European Union', short: 'EU', ready: false, phase: 2 },
  { id: 'in', label: 'India', short: 'India', ready: false, phase: 3 },
  { id: 'ca', label: 'Canada', short: 'Canada', ready: false, phase: 4 },
  { id: 'ch', label: 'Switzerland', short: 'Switzerland', ready: false, phase: 4 },
  { id: 'jp', label: 'Japan', short: 'Japan', ready: false, phase: 4 },
  { id: 'who', label: 'WHO prequalification', short: 'WHO PQ', ready: false, phase: 4 },
];

// The edition in force on a date (ISO yyyy-mm-dd), or the newest one.
export function packFor(id, { edition = null, date = null } = {}) {
  const eds = PACKS[id];
  if (!eds?.length) return null;
  if (edition) return eds.find((p) => p.edition === edition) ?? null;
  if (date) {
    const fit = eds.filter((p) => p.appliesFrom <= date && (!p.appliesTo || date < p.appliesTo));
    if (fit.length) return fit[fit.length - 1];
  }
  return eds[eds.length - 1];
}

export const categoryOf = (pack, id) => pack.categories.find((c) => c.id === id) ?? null;
export const rankOf = (pack, id) => categoryOf(pack, id)?.rank ?? -1;
export const sourceOf = (pack, id) => pack.sources[id] ?? { title: id };

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
