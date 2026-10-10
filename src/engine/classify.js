// The classifier: walks a pack's decision tree with the learner's answers and returns the
// category, the reason trail and the rule behind every step. Unanswered questions are
// explored on every branch, so a partly answered case returns a range.
import { QUESTIONS, CHANGE, categoryOf, rankOf, answerLabel, optionsFor } from './packs.js';

const yn = (b) => (b ? 'yes' : 'no');

// Answers that come from the product profile.
export function productAnswers(product) {
  const f = product?.facts ?? {};
  return {
    bio: yn(f.bio), anda: yn(product?.appType === 'anda'), sterile: yn(f.sterile), aseptic: yn(f.sterile && f.aseptic),
    mr: yn(f.mr), solidOral: yn(f.solidOral), doseControl: yn(f.doseControl),
  };
}
export const FROM_PRODUCT = new Set(Object.entries(QUESTIONS).filter(([, q]) => q.fromProduct).map(([id]) => id));

const NDA_ONLY = new Set(['g04', 'supacir', 'g14']);

function resolveOutcome(pack, node, answers) {
  const bio = answers.bio === 'yes';
  const out = { cat: node.cat, why: node.why, src: node.src, at: node.at, notes: node.note ? [node.note] : [] };
  if (bio && node.bioSrc) { out.src = node.bioSrc; out.at = node.bioAt; }
  else if (bio && NDA_ONLY.has(node.src)) out.notes.push('This entry comes from FDA guidance written for NDAs and ANDAs. For a BLA, check the 2021 guidance for certain biological products, which may set a different category.');
  const cat = categoryOf(pack, node.cat);
  out.category = cat;
  if (cat) out.rule = { text: cat.rule, src: bio && cat.bioSrc ? cat.bioSrc : cat.src, at: bio && cat.bioAt ? cat.bioAt : cat.at };
  return out;
}

const valid = (node, a) => a != null && a !== 'unknown' && Object.prototype.hasOwnProperty.call(node.on, a);

export function classify(pack, changeId, answers = {}) {
  const entry = pack?.entries?.[changeId];
  if (!entry) return { status: 'missing', changeId, outcomes: [], missing: [] };
  const outcomes = [];
  const missing = [];
  const walk = (node, path) => {
    if (node.cat) { outcomes.push({ ...resolveOutcome(pack, node, answers), path }); return; }
    const a = answers[node.ask];
    if (valid(node, a)) { walk(node.on[a], [...path, { q: node.ask, a }]); return; }
    if (!missing.includes(node.ask)) missing.push(node.ask);
    for (const [k, child] of Object.entries(node.on)) walk(child, [...path, { q: node.ask, a: k, assumed: true }]);
  };
  walk(entry.tree, []);
  const cats = [...new Set(outcomes.map((o) => o.cat))].sort((x, y) => rankOf(pack, x) - rankOf(pack, y));
  const definite = outcomes.length === 1;
  const base = { changeId, change: CHANGE[changeId], clock: entry.clock ?? null, outcomes, missing, cats };
  if (definite) return { ...base, status: 'done', category: cats[0], outcome: outcomes[0], steps: steps(outcomes[0].path, answers) };
  // Several leaves but one category: still a definite category, the reasons differ.
  if (cats.length === 1) return { ...base, status: 'done', category: cats[0], outcome: outcomes[0], steps: steps(commonPath(outcomes), answers), partial: true };
  return { ...base, status: 'range', min: cats[0], max: cats[cats.length - 1], steps: steps(commonPath(outcomes), answers) };
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
function steps(path, answers) {
  return path.filter((s) => !s.assumed).map((s) => ({
    q: s.q, a: s.a, text: QUESTIONS[s.q]?.text ?? s.q, answer: answerLabel(s.q, s.a), help: QUESTIONS[s.q]?.help ?? '',
    fromProduct: FROM_PRODUCT.has(s.q),
  }));
}

// The next question the learner has to answer, following the answered path.
export function nextQuestion(pack, changeId, answers) {
  let node = pack?.entries?.[changeId]?.tree;
  while (node && !node.cat) {
    const a = answers[node.ask];
    if (!valid(node, a)) return node.ask;
    node = node.on[a];
  }
  return null;
}

// Every question that can appear in the tree for this change, in walk order.
export function questionsIn(pack, changeId) {
  const out = [];
  const walk = (n) => { if (!n || n.cat) return; if (!out.includes(n.ask)) out.push(n.ask); Object.values(n.on).forEach(walk); };
  walk(pack?.entries?.[changeId]?.tree);
  return out;
}

// What-if: flip each answer on the path and report the ones that change the category.
export function whatIfs(pack, changeId, answers) {
  const base = classify(pack, changeId, answers);
  if (base.status !== 'done') return [];
  const out = [];
  for (const s of base.outcome.path) {
    for (const o of optionsFor(s.q)) {
      if (o.value === s.a) continue;
      const r = classify(pack, changeId, { ...answers, [s.q]: o.value });
      const cat = r.status === 'done' ? r.category : null;
      out.push({
        q: s.q, text: QUESTIONS[s.q]?.text ?? s.q, from: s.a, to: o.value, toLabel: answerLabel(s.q, o.value),
        fromProduct: FROM_PRODUCT.has(s.q), result: r, category: cat,
        range: r.status === 'range' ? [r.min, r.max] : null,
        changes: cat ? cat !== base.category : true,
        lower: cat ? rankOf(pack, cat) < rankOf(pack, base.category) : false,
      });
    }
  }
  return out;
}

// Routes to a lower category that the rules themselves offer.
export function lowerRoutes(pack, changeId, answers) {
  const base = classify(pack, changeId, answers);
  if (base.status !== 'done') return [];
  const routes = whatIfs(pack, changeId, answers).filter((w) => w.lower && !w.fromProduct)
    .map((w) => ({ kind: 'answer', text: `If "${w.text}" were "${w.toLabel}", the change would be ${categoryOf(pack, w.category).label}.`, category: w.category }));
  const change = CHANGE[changeId];
  if (change?.kind === 'cmc' && ['PAS', 'CBE30'].includes(base.category) && !['cp-submit', 'cp-use'].includes(changeId) && pack.entries['cp-use']) {
    routes.push({ kind: 'protocol', text: 'Submit a comparability protocol first (itself a prior approval supplement). Once approved, this change and later ones like it can be filed in the lower category the protocol sets.', category: null });
  }
  return routes;
}

// Overall result for several changes: the most restrictive category wins when they are filed together.
export function mostRestrictive(pack, cats) {
  return [...cats].sort((a, b) => rankOf(pack, b) - rankOf(pack, a))[0] ?? null;
}
