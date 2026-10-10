// Change control intake: a training change request that becomes a classified case.
import { CHANGES, searchChanges, categoryOf, regionOf } from './packs.js';
import { filingsFor, timelineFor, packForCase } from './filing.js';

export const STEPS = ['Raised', 'Assessed', 'Filed', 'Approved', 'Implemented', 'Closed'];

export const emptyIntake = () => ({ title: '', reason: '', present: '', proposed: '', raisedBy: '', team: 'Manufacturing', plannedDate: '', step: 0, signOff: null, history: [] });

// Suggest catalogue changes from the free-text description.
export function suggestChanges(product, text, max = 6) {
  const words = (text || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  if (!words.length) return [];
  const scored = CHANGES.map((c) => {
    const hay = `${c.title} ${c.help} ${c.keywords}`.toLowerCase();
    return { c, score: words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.c);
}

// The regulatory impact statement: per region, the filings, categories and earliest use.
export function impactStatement(kase, product) {
  const lines = [];
  const regions = [];
  for (const r of kase.regions) {
    const pack = packForCase(kase, r);
    const { filings, pending } = filingsFor(pack, product, kase);
    const rows = filings.map((f) => {
      const tl = timelineFor(pack, product, f, { submitDate: kase.submitDate, clockStop: kase.options?.clockStop, notificationDate: kase.options?.notificationDate });
      return { category: f.category, label: categoryOf(pack, f.category).label, items: f.items.map((i) => i.def.title), earliestUse: tl.earliestUse };
    });
    const latest = rows.map((x) => x.earliestUse).filter(Boolean).sort().pop() ?? null;
    regions.push({ region: r, edition: pack.edition, rows, pending: pending.length, latest });
    lines.push(`${regionOf(r).label} (pack edition ${pack.edition}):`);
    for (const x of rows) lines.push(`  - ${x.label}: ${x.items.join('; ')}${x.earliestUse ? `; earliest use ${x.earliestUse}` : ''}`);
    if (pending.length) lines.push(`  - ${pending.length} change(s) not classified yet`);
  }
  return { regions, text: lines.join('\n') };
}

export { searchChanges };
