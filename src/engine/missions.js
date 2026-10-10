// Missions: the expected answers come from the engine, run on the mission's hidden facts.
import data from '../data/missions.json' with { type: 'json' };
import { rankOf, CHANGE, categoryOf } from './packs.js';
import { classify, isFromProduct } from './classify.js';
import { filingsFor, impactFor, timelineFor, answersFor, addDays, packForCase } from './filing.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from './model.js';

export const MISSIONS = data.missions;
export const missionById = (id) => MISSIONS.find((m) => m.id === Number(id));
export const LEVELS = [
  { id: 'guided', label: 'Guided', help: 'Question help and rule citations shown as you go.' },
  { id: 'standard', label: 'Standard', help: 'Question help shown; citations after you submit.' },
  { id: 'expert', label: 'Expert', help: 'No help text and no citations until you submit.' },
];
const productOf = (m) => BUILTIN_PRODUCTS.find((p) => p.id === m.product);

export function missionCase(m, user, difficulty = 'standard') {
  const product = productOf(m);
  const k = newCase({ product, user, regions: [m.region], name: `Mission ${m.id}: ${m.title}`, missionId: m.id, difficulty, submitDate: m.submitDate });
  for (const c of m.changes) addChange(k, c.changeId, c.note);
  k.related = m.related ?? (m.changes.length > 1);
  if (m.notificationDate) k.options.notificationDate = m.notificationDate;
  if (m.alsoProducts) k.alsoProducts = [...m.alsoProducts];
  if (m.clockStop) k.options.clockStop = m.clockStop;
  k.mission = { ctd: [], date: '', submitted: null };
  return k;
}

export function missionTruth(m) {
  const product = productOf(m);
  const k = missionCase(m, null);
  const pack = packForCase(k, m.region);
  k.related = m.related ?? false;
  k.changes.forEach((c, i) => { c.answers = { ...m.changes[i].facts }; });
  const { filings, pending } = filingsFor(pack, product, k);
  if (pending.length) throw new Error(`Mission ${m.id}: facts do not settle every change`);
  const perChange = k.changes.map((c) => classify(pack, c.changeId, answersFor(product, c)));
  const main = filings[0];
  const tl = timelineFor(pack, product, main, { submitDate: m.submitDate, notificationDate: m.notificationDate, clockStop: m.clockStop ?? 0 });
  const date = m.timeline === 'due505' ? addDays(m.notificationDate, pack.clocks['505o4'].days) : m.timeline === 'notify' ? tl.events.find((e) => e.kind === 'due')?.date : tl.earliestUse;
  return { pack, product, perChange, filings, main, ctd: impactFor(pack, main).map((e) => e.code), date, dateLabel: m.timeline === 'due505' ? 'Response due' : m.timeline === 'notify' ? 'Latest date to notify' : main.category === 'PAS' ? 'FDA goal date' : 'Earliest date of use' };
}

const jaccard = (a, b) => {
  const A = new Set(a); const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  return uni ? inter / uni : 1;
};

// 100 points: categories 40, reasons 20, CTD sections 20, date 20.
export function scoreMission(m, kase) {
  const t = missionTruth(m);
  const { pack, product } = t;
  const feedback = [];
  const S = (id) => categoryOf(pack, id)?.short ?? id;
  // Categories, with half credit for over-filing and none for under-filing.
  let catPts = 0;
  kase.changes.forEach((c, i) => {
    const want = t.perChange[i].category;
    const got = classify(pack, c.changeId, answersFor(product, c));
    const title = CHANGE[c.changeId].title;
    if (got.status !== 'done') { feedback.push({ ok: false, text: `${title}: not classified yet (some questions are unanswered).` }); return; }
    if (got.category === want) { catPts += 1; feedback.push({ ok: true, text: `${title}: ${S(want)} is right.` }); }
    else if (rankOf(pack, got.category) > rankOf(pack, want)) { catPts += 0.5; feedback.push({ ok: false, text: `${title}: you chose ${S(got.category)}, the rules give ${S(want)}. Over-filing is safe but costs time and money.` }); }
    else feedback.push({ ok: false, text: `${title}: you chose ${S(got.category)}, the rules give ${S(want)}. Under-filing risks distributing product without the approval or notice the rules require.` });
  });
  let categories = (catPts / kase.changes.length) * 40;
  if (kase.changes.length > 1) {
    const mine = filingsFor(pack, product, kase).filings.map((f) => S(f.category)).sort().join(',');
    const want = t.filings.map((f) => S(f.category)).sort().join(',');
    const plan = mine === want;
    feedback.push({ ok: plan, text: plan ? `Filing plan right: ${want.replace(/,/g, ' + ')}.` : `Filing plan: the rules give ${want.replace(/,/g, ' + ')}; yours gives ${mine.replace(/,/g, ' + ') || 'nothing yet'}.` });
    categories = categories * 0.7 + (plan ? 12 : 0);
  }
  // Reasons: the learner's answers on the questions that decide the true outcome.
  let asked = 0; let right = 0;
  kase.changes.forEach((c, i) => {
    for (const s of t.perChange[i].outcome.path) {
      if (s.assumed || isFromProduct(pack, s.q)) continue;
      asked += 1;
      if (c.answers?.[s.q] === s.a) right += 1;
    }
  });
  const reasons = asked ? (right / asked) * 20 : 20;
  if (asked) feedback.push({ ok: right === asked, text: `Key facts read from the brief: ${right} of ${asked}.` });
  // CTD sections.
  const picked = kase.mission?.ctd ?? [];
  const ctdScore = jaccard(picked, t.ctd) * 20;
  const missed = t.ctd.filter((x) => !picked.includes(x));
  const extra = picked.filter((x) => !t.ctd.includes(x));
  feedback.push({ ok: !missed.length && !extra.length, text: `CTD sections: ${missed.length ? `missed ${missed.join(', ')}` : 'none missed'}${extra.length ? `; not needed ${extra.join(', ')}` : ''}.` });
  // Date.
  const dateOk = kase.mission?.date === t.date;
  feedback.push({ ok: dateOk, text: dateOk ? `${t.dateLabel}: ${t.date}, right.` : `${t.dateLabel}: ${t.date}${kase.mission?.date ? ` (you gave ${kase.mission.date})` : ''}.` });
  const score = Math.round(categories + reasons + ctdScore + (dateOk ? 20 : 0));
  return { score, parts: { categories: Math.round(categories), reasons: Math.round(reasons), ctd: Math.round(ctdScore), date: dateOk ? 20 : 0 }, feedback, truth: t };
}
