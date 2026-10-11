// The classifier: walks a pack's decision tree with the learner's answers and returns the
// category, the reason trail and the rule behind every step. Unanswered questions are
// explored on every branch, so a partly answered case returns a range.
//
// Node kinds: { ask, on } asks one question; { allOf: [conditionIds], pass, fail } is an annex
// condition checklist (all met → pass, any not met → fail); { cat, src, at, why } is an outcome.
import { QUESTIONS, CHANGE, categoryOf, rankOf, answerLabel, optionsFor, questionText, isCondition } from './packs.js';

const yn = (b) => (b ? 'yes' : 'no');

// Answers that come from the product profile.
export function productAnswers(product) {
  const f = product?.facts ?? {};
  const irOral = !!f.solidOral && !f.mr;
  return {
    bio: yn(f.bio), anda: yn(product?.appType === 'anda'), sterile: yn(f.sterile), aseptic: yn(f.sterile && f.aseptic),
    mr: yn(f.mr), solidOral: yn(f.solidOral), doseControl: yn(f.doseControl),
    notSterile: yn(!f.sterile), notBio: yn(!f.bio), irOral: yn(irOral), irFct: yn(irOral && /film-coated/i.test(product?.dosageForm ?? '')),
    centralised: yn((product?.eu?.route ?? 'centralised') === 'centralised'),
  };
}
export const FROM_PRODUCT = new Set(Object.entries(QUESTIONS).filter(([, q]) => q.fromProduct).map(([id]) => id));

// A condition can be answered from the product profile (for example "the product is not sterile").
export const autoKey = (pack, qid) => pack?.conditions?.[qid]?.auto ?? null;
export function answerOf(pack, qid, answers) {
  const a = answers[qid];
  if (a != null && a !== 'unknown') return a;
  const auto = autoKey(pack, qid);
  return auto && answers[auto] != null ? answers[auto] : a;
}
export const isFromProduct = (pack, qid) => FROM_PRODUCT.has(qid) || !!autoKey(pack, qid);

const NDA_ONLY = new Set(['g04', 'supacir', 'g14']);

function resolveOutcome(pack, node, answers) {
  const bio = answers.bio === 'yes';
  const out = { cat: node.cat, why: node.why, src: node.src, at: node.at, pi: !!node.pi, notes: node.note ? [node.note] : [] };
  if (bio && node.bioSrc) { out.src = node.bioSrc; out.at = node.bioAt; }
  else if (bio && NDA_ONLY.has(node.src)) out.notes.push('This entry comes from FDA guidance written for NDAs and ANDAs. For a BLA, check the 2021 guidance for certain biological products, which may set a different category.');
  const cat = categoryOf(pack, node.cat);
  out.category = cat;
  if (cat) out.rule = { text: cat.rule, src: bio && cat.bioSrc ? cat.bioSrc : cat.src, at: bio && cat.bioAt ? cat.bioAt : cat.at };
  return out;
}

const valid = (node, a) => a != null && a !== 'unknown' && Object.prototype.hasOwnProperty.call(node.on, a);
const yesNo = (a) => a === 'yes' || a === 'no';

export function classify(pack, changeId, answers = {}) {
  const entry = pack?.entries?.[changeId];
  if (!entry) return { status: 'missing', changeId, change: CHANGE[changeId], outcomes: [], missing: [], cats: [] };
  const outcomes = [];
  const missing = [];
  const miss = (q) => { if (!missing.includes(q)) missing.push(q); };
  const walk = (node, path) => {
    if (node.cat) { outcomes.push({ ...resolveOutcome(pack, node, answers), path }); return; }
    if (node.allOf) {
      const given = node.allOf.map((q) => ({ q, a: answerOf(pack, q, answers) }));
      const failed = given.find((g) => g.a === 'no');
      if (failed) {
        // Record the answered conditions up to the first one not met.
        const upto = given.slice(0, given.indexOf(failed) + 1).filter((g) => yesNo(g.a));
        walk(node.fail, [...path, ...upto.map((g) => ({ q: g.q, a: g.a, cond: true }))]);
        return;
      }
      const open = given.filter((g) => !yesNo(g.a));
      if (!open.length) { walk(node.pass, [...path, ...given.map((g) => ({ q: g.q, a: g.a, cond: true }))]); return; }
      open.forEach((g) => miss(g.q));
      const known = given.filter((g) => yesNo(g.a)).map((g) => ({ q: g.q, a: g.a, cond: true }));
      walk(node.pass, [...path, ...known, ...open.map((g) => ({ q: g.q, a: 'yes', assumed: true, cond: true }))]);
      walk(node.fail, [...path, ...known, { q: open[0].q, a: 'no', assumed: true, cond: true }]);
      return;
    }
    const a = answerOf(pack, node.ask, answers);
    if (valid(node, a)) { walk(node.on[a], [...path, { q: node.ask, a }]); return; }
    miss(node.ask);
    for (const [k, child] of Object.entries(node.on)) walk(child, [...path, { q: node.ask, a: k, assumed: true }]);
  };
  walk(entry.tree, []);
  const cats = [...new Set(outcomes.map((o) => o.cat))].sort((x, y) => rankOf(pack, x) - rankOf(pack, y));
  const base = { changeId, change: CHANGE[changeId], clock: entry.clock ?? null, outcomes, missing, cats, pack: { id: pack.id, edition: pack.edition } };
  if (outcomes.length === 1) return { ...base, status: 'done', category: cats[0], outcome: outcomes[0], steps: steps(pack, outcomes[0].path) };
  if (cats.length === 1) return { ...base, status: 'done', category: cats[0], outcome: outcomes[0], steps: steps(pack, commonPath(outcomes)), partial: true };
  return { ...base, status: 'range', min: cats[0], max: cats[cats.length - 1], steps: steps(pack, commonPath(outcomes)) };
}

function commonPath(outcomes) {
  const first = outcomes[0]?.path ?? [];
  const out = [];
  for (let i = 0; i < first.length; i++) {
    if (first[i].assumed || !outcomes.every((o) => o.path[i] && o.path[i].q === first[i].q && o.path[i].a === first[i].a)) break;
    out.push(first[i]);
  }
  return out;
}

// One line per answered question on the path, for the reason trail.
function steps(pack, path) {
  return path.filter((s) => !s.assumed).map((s) => ({
    q: s.q, a: s.a, cond: !!s.cond || isCondition(s.q), text: questionText(pack, s.q),
    answer: s.cond ? (s.a === 'yes' ? 'Met' : 'Not met') : answerLabel(s.q, s.a),
    help: QUESTIONS[s.q]?.help ?? '', fromProduct: isFromProduct(pack, s.q),
  }));
}

// The questions on the answered path, plus the next one. Condition checklists come back as
// one group: { group: [conditionIds] }.
export function pathItems(pack, changeId, answers) {
  const out = [];
  let node = pack?.entries?.[changeId]?.tree;
  while (node && !node.cat) {
    if (node.allOf) {
      out.push({ group: node.allOf });
      const given = node.allOf.map((q) => answerOf(pack, q, answers));
      if (given.includes('no')) { node = node.fail; continue; }
      if (given.every(yesNo)) { node = node.pass; continue; }
      break;
    }
    out.push({ q: node.ask });
    const a = answerOf(pack, node.ask, answers);
    if (!valid(node, a)) break;
    node = node.on[a];
  }
  return out;
}

// The next question the learner has to answer, following the answered path.
export function nextQuestion(pack, changeId, answers) {
  const items = pathItems(pack, changeId, answers);
  for (const it of items) {
    if (it.group) { const open = it.group.find((q) => !yesNo(answerOf(pack, q, answers))); if (open && !it.group.some((q) => answerOf(pack, q, answers) === 'no')) return open; continue; }
    const node = it.q;
    const a = answerOf(pack, node, answers);
    if (a == null || a === 'unknown' || !optionsFor(node).some((o) => o.value === a)) return node;
  }
  return null;
}

// Every question that can appear in the tree for this change, in walk order.
export function questionsIn(pack, changeId) {
  const out = [];
  const walk = (n) => {
    if (!n || n.cat) return;
    if (n.allOf) { n.allOf.forEach((q) => { if (!out.includes(q)) out.push(q); }); walk(n.pass); walk(n.fail); return; }
    if (!out.includes(n.ask)) out.push(n.ask);
    Object.values(n.on).forEach(walk);
  };
  walk(pack?.entries?.[changeId]?.tree);
  return out;
}

// Every category a change can reach in a pack, lowest first.
export function reachable(pack, changeId) {
  const out = new Set();
  const walk = (n) => { if (!n) return; if (n.cat) { out.add(n.cat); return; } if (n.allOf) { walk(n.pass); walk(n.fail); return; } Object.values(n.on).forEach(walk); };
  walk(pack?.entries?.[changeId]?.tree);
  return [...out].sort((a, b) => rankOf(pack, a) - rankOf(pack, b));
}

// What-if: flip each answer on the path and report the ones that change the category.
export function whatIfs(pack, changeId, answers) {
  const base = classify(pack, changeId, answers);
  if (base.status !== 'done') return [];
  const out = [];
  for (const s of base.outcome.path) {
    if (s.assumed) continue;
    const opts = s.cond ? [{ value: 'yes', label: 'Met' }, { value: 'no', label: 'Not met' }] : optionsFor(s.q);
    for (const o of opts) {
      if (o.value === s.a) continue;
      const r = classify(pack, changeId, { ...answers, [s.q]: o.value });
      const cat = r.status === 'done' ? r.category : null;
      out.push({
        q: s.q, cond: !!s.cond, text: questionText(pack, s.q), from: s.a, to: o.value, toLabel: s.cond ? o.label : answerLabel(s.q, o.value),
        fromProduct: isFromProduct(pack, s.q), result: r, category: cat,
        range: r.status === 'range' ? [r.min, r.max] : null,
        changes: cat ? cat !== base.category : true,
        lower: cat ? rankOf(pack, cat) < rankOf(pack, base.category) : false,
      });
    }
  }
  return out;
}

const PROTOCOL_ROUTE = {
  us: 'Submit a comparability protocol first (itself a prior approval supplement). Once approved, this change and later ones like it can be filed in the lower category the protocol sets.',
  eu: 'Submit a PACMP first (Type II, Q.II.g.2). Once approved, the change can be implemented in the lower category the protocol sets (Q.II.g.5).',
  ch: 'Submit a PACMP first (Type II, Q.II.g.2 of the Swiss list). Once approved, the change can be implemented in the lower category the protocol sets (Q.II.g.5).',
  jp: 'Apply for confirmation of a change plan (PACMP step 1). Once confirmed, the change is notified and takes effect 40 working days after acceptance (step 2).',
  ca: 'From November 2026 Health Canada accepts PACMPs for biologics. An approved protocol can lower the change to a notifiable change or a Level III notice.',
};

// Routes to a lower category that the rules themselves offer.
export function lowerRoutes(pack, changeId, answers) {
  const base = classify(pack, changeId, answers);
  if (base.status !== 'done') return [];
  const routes = whatIfs(pack, changeId, answers).filter((w) => w.lower && !w.fromProduct)
    .map((w) => ({ kind: 'answer', text: w.cond ? `If the condition "${w.text}" were met, the change would be ${categoryOf(pack, w.category).label}.` : `If "${w.text}" were "${w.toLabel}", the change would be ${categoryOf(pack, w.category).label}.`, category: w.category }));
  const change = CHANGE[changeId];
  const high = (categoryOf(pack, base.category)?.rank ?? 0) >= 3;
  const text = PROTOCOL_ROUTE[pack.id];
  const protocolOk = pack.id !== 'ca' || answers.bio === 'yes';
  if (text && protocolOk && change?.kind === 'cmc' && high && !['cp-submit', 'cp-use', 'pacmp-change'].includes(changeId)) routes.push({ kind: 'protocol', text, category: null });
  return routes;
}

// Overall result for several changes: the most restrictive category wins when they are filed together.
export function mostRestrictive(pack, cats) {
  return [...cats].sort((a, b) => rankOf(pack, b) - rankOf(pack, a))[0] ?? null;
}
