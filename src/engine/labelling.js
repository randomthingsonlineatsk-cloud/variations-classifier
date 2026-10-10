// Core data sheet (CCDS) rollout: one company-level labelling change carried into each
// region's label, with its classification, sections, status and lag.
import data from '../data/labelling.json' with { type: 'json' };
import { CHANGE } from './packs.js';
import { classify } from './classify.js';
import { answersFor, filingsFor, timelineFor, packForCase, addDays } from './filing.js';
import { newCase, addChange } from './model.js';

export const KINDS = data.kinds;
export const STATUSES = data.statuses;
export const kindOf = (id) => KINDS.find((k) => k.id === id);

export function newCcdsCase({ product, user, kind, text, version, ccdsDate, regions }) {
  const kd = kindOf(kind);
  const k = newCase({ product, user, regions, name: `${product.brandName}: CCDS ${version}, ${kd.label.toLowerCase()}`, submitDate: ccdsDate });
  const c = addChange(k, kd.change, text);
  if (kd.serious) c.answers.seriousWarning = 'yes';
  k.ccds = { version, kind, text, date: ccdsDate, wording: Object.fromEntries(regions.map((r) => [r, ''])), status: Object.fromEntries(regions.map((r) => [r, { step: 0, dates: {} }])) };
  return k;
}

// Per region: label sections, the classification, the company target and the lag.
export function rolloutRows(kase, product, today) {
  const kd = kindOf(kase.ccds.kind);
  return kase.regions.map((r) => {
    const pack = packForCase(kase, r);
    const ch = kase.changes[0];
    const res = classify(pack, ch.changeId, answersFor(product, ch));
    const filing = res.status === 'done' ? filingsFor(pack, product, { ...kase, changes: [ch] }).filings[0] : null;
    const tl = filing ? timelineFor(pack, product, filing, { submitDate: kase.ccds.status[r]?.dates?.Submitted || kase.ccds.date, notificationDate: kase.options?.notificationDate }) : null;
    const st = kase.ccds.status[r] ?? { step: 0, dates: {} };
    const target = addDays(kase.ccds.date, kd.safety ? data.targetDays.safety : data.targetDays.other);
    const implemented = st.dates?.Implemented;
    const lagDays = implemented ? null : Math.max(0, Math.round((Date.parse(today) - Date.parse(kase.ccds.date)) / 86400000));
    return { region: r, pack, section: kd.sections[r], result: res, filing, timeline: tl, status: STATUSES[st.step], step: st.step, target, late: !implemented && today > target && st.step < 2, lagDays };
  });
}

export const changeTitle = (kase) => CHANGE[kase.changes[0]?.changeId]?.title ?? '';
