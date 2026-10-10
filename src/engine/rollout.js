// Global rollout: when each market can take the change, which markets hold it back, and
// what would shorten the rollout.
import { regionOf, rankOf } from './packs.js';
import { filingsFor, timelineFor, packForCase } from './filing.js';
import { lowerRoutes } from './classify.js';
import { answersFor } from './filing.js';

export function rolloutPlan(kase, product) {
  const markets = kase.regions.map((r) => {
    const pack = packForCase(kase, r);
    const { filings, pending } = filingsFor(pack, product, kase);
    const lines = filings.map((f) => ({ f, tl: timelineFor(pack, product, f, { submitDate: kase.submitDate, clockStop: kase.options?.clockStop, notificationDate: kase.options?.notificationDate, priority: kase.options?.priority, inspection: kase.options?.inspection }) }));
    const known = lines.map((l) => l.tl.earliestUse).filter(Boolean).sort();
    const unknown = lines.some((l) => !l.tl.earliestUse && !['NONE', 'REC', 'OTHER'].includes(l.f.category)) || pending.length > 0;
    const ready = unknown ? null : known.pop() ?? kase.submitDate;
    const heaviest = filings.slice().sort((a, b) => rankOf(pack, b.category) - rankOf(pack, a.category))[0];
    const shorten = [];
    for (const c of kase.changes) for (const r2 of lowerRoutes(pack, c.changeId, answersFor(product, c))) if (!shorten.includes(r2.text)) shorten.push(r2.text);
    return { region: r, label: regionOf(r).label, pack, ready, unknown, heaviest, lines, shorten };
  });
  const dated = markets.filter((m) => m.ready);
  const allReady = markets.every((m) => m.ready) ? dated.map((m) => m.ready).sort().pop() : null;
  const holdBack = allReady ? markets.filter((m) => m.ready === allReady).map((m) => m.region) : markets.filter((m) => !m.ready).map((m) => m.region);
  const first = dated.map((m) => m.ready).sort()[0] ?? null;
  const overlapDays = allReady && first ? Math.round((Date.parse(allReady) - Date.parse(first)) / 86400000) : null;
  return { markets, allReady, holdBack, first, overlapDays };
}
