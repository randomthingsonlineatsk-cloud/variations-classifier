// ICH Q12 and Q5E tools: established conditions (ECs), post-approval change management
// protocols (PACMPs), the product lifecycle management (PLCM) document, and a comparability
// checklist for biological products. Region rules come from the packs.
import { packFor, categoryOf, regionOf, READY } from './packs.js';
import { classify, productAnswers } from './classify.js';
import { uid } from './model.js';

// ICH Q12 reporting categories, from highest to lowest risk, plus "not an EC".
export const Q12_CATEGORIES = [
  { id: 'prior', label: 'Prior approval', help: 'High risk: the change needs approval before it is implemented.' },
  { id: 'moderate', label: 'Notification, moderate', help: 'Medium risk: notify and wait a set period (or for acknowledgement) before implementing.' },
  { id: 'low', label: 'Notification, low', help: 'Low risk: implement, then tell the authority (for example in an annual report).' },
  { id: 'none', label: 'Not an established condition', help: 'Supportive information: managed in the quality system with no regulatory submission.' },
];
export const q12Label = (id) => Q12_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const EC_TYPES = [
  { id: 'process', label: 'Process parameter' },
  { id: 'material', label: 'Material attribute' },
  { id: 'spec', label: 'Specification (test and criterion)' },
  { id: 'method', label: 'Analytical procedure' },
  { id: 'site', label: 'Manufacturing or testing site' },
  { id: 'container', label: 'Container closure' },
  { id: 'other', label: 'Other' },
];
export const IMPACTS = [
  { id: 'high', label: 'High', help: 'Directly and significantly affects a critical quality attribute (for example a critical process parameter).' },
  { id: 'medium', label: 'Medium', help: 'Can affect a critical quality attribute, but the risk is reduced by controls or knowledge.' },
  { id: 'low', label: 'Low', help: 'Low potential to affect a critical quality attribute.' },
  { id: 'none', label: 'None', help: 'No effect on critical quality attributes found in development (for example a non-critical parameter).' },
];

// ICH Q12 chapter 3: elements with no impact on quality are not ECs; for ECs the reporting
// category follows the risk of the change. Sites, specifications and procedures are normally ECs.
export function suggestEC({ type, impact }) {
  const always = ['spec', 'site'].includes(type);
  if (impact === 'none' && !always) return { ec: false, category: 'none', why: 'No impact on critical quality attributes: supportive information, not an established condition (ICH Q12, chapter 3).' };
  const category = impact === 'high' ? 'prior' : impact === 'medium' ? 'moderate' : 'low';
  const why = {
    prior: 'High potential impact on quality: an established condition with prior approval (ICH Q12, chapter 3).',
    moderate: 'Medium potential impact: an established condition with a moderate notification.',
    low: 'Low potential impact: an established condition with a low notification.',
  }[category];
  return { ec: true, category, why: always && impact === 'none' ? `${why} Specifications and sites are normally established conditions even when the risk is low.` : why };
}

// How each region reports a change to an EC in each Q12 category.
const REGION_MAP = {
  us: { prior: 'PAS', moderate: 'CBE30', low: 'AR', none: 'NONE' },
  eu: { prior: 'II', moderate: 'IB', low: 'IA', none: 'NONE' },
  ch: { prior: 'II', moderate: 'IB', low: 'IA', none: 'NONE' },
  jp: { prior: 'PCA', moderate: 'MOD', low: 'MCN', none: 'NONE' },
};
export const REGION_NOTE = {
  us: 'FDA implements ECs through ICH Q12 and its 2021 implementation guidance; low notifications are usually annual report items (CBE-0 is also possible).',
  eu: 'ECs are agreed through a PLCM document (Q.II.g.6); changes then follow Q.II.g.7.',
  ch: 'Swissmedic follows the EU structure (Q.II.g.6 and Q.II.g.7 of the Swiss list).',
  jp: 'The approval form plays the role of ECs. The moderate change route is a 2024 trial for designated items.',
  ca: 'Health Canada has not implemented established conditions yet (PACMPs for biologics only, from November 2026).',
  in: 'India has no established conditions procedure; changes follow the levels or case-by-case review.',
  who: 'WHO PQ has no established conditions procedure.',
};
export function regionCategory(region, q12cat) {
  const id = REGION_MAP[region]?.[q12cat] ?? null;
  if (!id) return null;
  const pack = packFor(region);
  return categoryOf(pack, id) ? { pack, id } : null;
}

// ---------- documents ----------
export function newPlcm({ product, user }) {
  return {
    id: uid('plcm'), kind: 'plcm', productId: product.id, userId: user?.userId ?? null, classId: user?.classId ?? null,
    title: `${product.brandName}: product lifecycle management document`, version: '0.1', approach: 'parameter',
    controlStrategy: '', ecs: [], pacmps: [], commitments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}
export const newEc = () => ({ id: uid('ec'), type: 'process', element: '', value: '', impact: 'medium', ec: true, category: 'moderate', justification: '', overridden: false });
export const newPacmp = (product) => ({
  id: uid('pacmp'), title: '', changeIds: [], description: '', rationale: '', risk: '', studies: [{ test: '', criteria: '' }],
  step2: Object.fromEntries(['us', 'eu', 'ch', 'jp', 'ca'].map((r) => [r, ''])), scope: product?.facts?.bio ? 'Drug substance and drug product' : 'Drug product',
});
export const newCommitment = () => ({ id: uid('cm'), text: '', due: '' });

// Step 1 (submitting the protocol) per region, classified with the pack's cp-submit entry.
export function pacmpStep1(product) {
  return READY.map((r) => {
    const pack = packFor(r);
    const res = classify(pack, 'cp-submit', productAnswers(product));
    return { region: r, label: regionOf(r).label, pack, result: res };
  });
}
// Categories a protocol can set for step 2, per region.
export const STEP2_OPTIONS = {
  us: ['CBE30', 'CBE0', 'AR'],
  eu: ['IB', 'IAIN', 'IA'],
  ch: ['IB', 'IAIN', 'IA'],
  jp: ['PACMPN'],
  ca: ['NC', 'L3IN', 'L3'],
};

// The PLCM document as plain text sections (ICH Q12 chapter 5).
export function plcmSections(doc, product) {
  const ecRows = doc.ecs.filter((e) => e.ec);
  const supportive = doc.ecs.filter((e) => !e.ec);
  return [
    { h: '1. Product and scope', body: [`${product.brandName} (${product.inn}), ${product.dosageForm}. Holder: ${product.holder.name}. Approach to ECs: ${doc.approach === 'performance' ? 'performance-based (enhanced knowledge)' : doc.approach === 'enhanced' ? 'enhanced, parameter-based' : 'parameter-based'}. Version ${doc.version}. Training document; fictional product.`] },
    { h: '2. Summary of the product control strategy', body: [doc.controlStrategy || '(not written yet)'] },
    { h: '3. Established conditions and reporting categories', table: { head: ['Element', 'Type', 'Approved value or range', 'Reporting category (ICH Q12)', 'US', 'EU', 'Japan', 'Justification'],
      rows: ecRows.map((e) => [e.element, EC_TYPES.find((t) => t.id === e.type)?.label ?? e.type, e.value, q12Label(e.category),
        ...['us', 'eu', 'jp'].map((r) => { const rc = regionCategory(r, e.category); return rc ? categoryOf(rc.pack, rc.id).short : 'n/a'; }), e.justification]) } },
    { h: '4. Supportive information (not established conditions)', body: supportive.length ? supportive.map((e) => `${e.element}${e.value ? ` (${e.value})` : ''}: ${e.justification || 'no impact on critical quality attributes'}`) : ['None listed.'] },
    { h: '5. Post-approval change management protocols', body: doc.pacmps.length ? doc.pacmps.map((p) => `${p.title || 'Untitled protocol'}: ${p.description || ''} Step 2 categories: ${Object.entries(p.step2).filter(([, v]) => v).map(([r, v]) => `${regionOf(r).short} ${categoryOf(packFor(r), v)?.short ?? v}`).join(', ') || 'not set'}.`) : ['None.'] },
    { h: '6. Post-approval CMC commitments', body: doc.commitments.length ? doc.commitments.map((c) => `${c.text}${c.due ? ` (due ${c.due})` : ''}`) : ['None.'] },
  ];
}

export function plcmHtml(doc, product) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const parts = plcmSections(doc, product).map((s) => {
    const body = s.body ? s.body.map((b) => `<p>${esc(b)}</p>`).join('') : '';
    const table = s.table ? `<table><thead><tr>${s.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${s.table.head.length}">None yet.</td></tr>`}</tbody></table>` : '';
    return `<h2>${esc(s.h)}</h2>${body}${table}`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#1d2433}h1{font-size:1.5rem}h2{font-size:1.1rem;margin-top:1.5rem}table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{border:1px solid #c8cdd6;padding:.3rem .4rem;text-align:left;vertical-align:top}.wm{color:#a33;font-weight:700}</style></head><body><p class="wm">TRAINING DOCUMENT. Fictional product. Not for submission.</p><h1>${esc(doc.title)}</h1>${parts}<p style="margin-top:2rem;font-size:.8rem">Made with the Variations Classifier, built by Khan Gulrez Shagufa Fazal Ahmed. Structure follows ICH Q12 chapter 5 (PLCM document).</p></body></html>`;
}

// ---------- ICH Q5E comparability ----------
export const Q5E_GROUPS = [
  { id: 'structure', label: 'Physicochemical properties', ref: 'Q5E 2.2.2; Q6B 2.1.2', attrs: ['Primary structure (amino acid sequence, peptide map)', 'Higher-order structure', 'Charge variants', 'Glycosylation profile', 'Size variants (aggregates and fragments)'] },
  { id: 'activity', label: 'Biological activity', ref: 'Q5E 2.2.2; Q6B 2.1.3', attrs: ['Potency (bioassay)', 'Binding to target'] },
  { id: 'immuno', label: 'Immunochemical properties', ref: 'Q6B 2.1.4', attrs: ['Identity by immunoassay'] },
  { id: 'purity', label: 'Purity, impurities and contaminants', ref: 'Q5E 2.2.2 and 2.2.3; Q6B 2.1.5 and 2.1.6', attrs: ['Product-related impurities', 'Host cell proteins', 'Host cell DNA', 'Process reagents (for example leached Protein A)', 'Adventitious agents and bioburden'] },
  { id: 'quantity', label: 'Quantity', ref: 'Q6B 2.1.7', attrs: ['Protein content'] },
  { id: 'stability', label: 'Stability', ref: 'Q5E 2.2.4', attrs: ['Real-time stability trend', 'Accelerated and stress degradation profiles'] },
  { id: 'process', label: 'Manufacturing process', ref: 'Q5E 2.3', attrs: ['In-process controls and process capability', 'Clearance of process-related impurities', 'Process validation at the changed step'] },
];
export const Q5E_RESULTS = [
  { id: '', label: 'Not assessed' },
  { id: 'same', label: 'Comparable (within the pre-change range)' },
  { id: 'diff-ok', label: 'Different, justified as no adverse impact' },
  { id: 'diff-risk', label: 'Different, possible impact on safety or efficacy' },
];

export function newQ5e({ product, user, kaseId = null }) {
  return {
    id: uid('q5e'), kind: 'q5e', productId: product.id, caseId: kaseId, userId: user?.userId ?? null, classId: user?.classId ?? null,
    title: `${product.brandName}: comparability exercise`, change: '', step: '', risk: '', preBatches: 3, postBatches: 3,
    rows: Q5E_GROUPS.flatMap((g) => g.attrs.map((a) => ({ id: uid('r'), group: g.id, attr: a, method: '', criteria: '', result: '', note: '' }))),
    nonclinical: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// The conclusion follows ICH Q5E 1.4 and 2.5: quality data alone when the products are highly
// similar and differences have no adverse impact; otherwise nonclinical or clinical bridging.
export function q5eVerdict(doc) {
  const assessed = doc.rows.filter((r) => r.result);
  const risk = doc.rows.filter((r) => r.result === 'diff-risk');
  const justified = doc.rows.filter((r) => r.result === 'diff-ok');
  const key = ['activity', 'structure', 'purity'];
  const missingKey = key.filter((g) => !doc.rows.some((r) => r.group === g && r.result));
  const notes = [];
  if (Number(doc.postBatches) < 3) notes.push('ICH Q5E does not fix a number of batches; fewer than three post-change batches is usually hard to justify.');
  if (!doc.rows.some((r) => r.group === 'stability' && r.result)) notes.push('Stability comparison is missing: Q5E expects real-time data and often accelerated or stress studies to reveal subtle differences.');
  if (missingKey.length) return { level: 'incomplete', label: 'Incomplete', text: `Assess at least one attribute in each of: ${missingKey.map((g) => Q5E_GROUPS.find((x) => x.id === g).label.toLowerCase()).join(', ')}.`, notes, counts: { assessed: assessed.length, risk: risk.length, justified: justified.length } };
  if (risk.length) return { level: 'bridging', label: 'Bridging studies likely', text: `${risk.length} attribute(s) differ with a possible impact on safety or efficacy. ICH Q5E 2.5: nonclinical or clinical studies may be needed to show the change has no adverse impact.`, notes, counts: { assessed: assessed.length, risk: risk.length, justified: justified.length } };
  if (justified.length) return { level: 'justified', label: 'Comparable with justified differences', text: `${justified.length} difference(s) are justified as having no adverse impact. Document the justification with process and product knowledge (Q5E 1.4).`, notes, counts: { assessed: assessed.length, risk: 0, justified: justified.length } };
  return { level: 'comparable', label: 'Highly similar', text: 'Every assessed attribute is within the pre-change range. Quality data can be enough to show comparability (Q5E 1.4).', notes, counts: { assessed: assessed.length, risk: 0, justified: 0 } };
}

export function q5eText(doc, product) {
  const v = q5eVerdict(doc);
  const lines = [`${doc.title}`, `Product: ${product.brandName} (${product.inn}). Training document; fictional product.`, '', `Change: ${doc.change || '(not described)'}`, `Process step affected: ${doc.step || '(not given)'}`,
    `Risk assessment: ${doc.risk || '(not written)'}`, `Batches compared: ${doc.preBatches} pre-change, ${doc.postBatches} post-change`, ''];
  for (const g of Q5E_GROUPS) {
    lines.push(`${g.label} (${g.ref})`);
    for (const r of doc.rows.filter((x) => x.group === g.id)) lines.push(`  - ${r.attr}: ${Q5E_RESULTS.find((x) => x.id === r.result)?.label}${r.method ? `; method: ${r.method}` : ''}${r.criteria ? `; criteria: ${r.criteria}` : ''}${r.note ? `; ${r.note}` : ''}`);
  }
  lines.push('', `Conclusion: ${v.label}. ${v.text}`, ...v.notes.map((n) => `Note: ${n}`));
  if (doc.nonclinical) lines.push('', `Nonclinical or clinical considerations: ${doc.nonclinical}`);
  return lines.join('\n');
}
