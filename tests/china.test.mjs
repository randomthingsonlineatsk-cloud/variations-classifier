// The China pack (NMPA): approval, filing and report changes.
import assert from 'node:assert/strict';
import { packFor, CHANGES, regionsFor } from '../src/engine/packs.js';
import { classify, productAnswers } from '../src/engine/classify.js';
import { filingsFor, timelineFor, coverLetter } from '../src/engine/filing.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';
import { buildChangePackage } from '../src/engine/handoff.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const P = (id) => BUILTIN_PRODUCTS.find((p) => p.id === id);
const cn = packFor('cn');
const cls = (pid, cid, a = {}) => classify(cn, cid, { ...productAnswers(P(pid)), ...a });

t('every change, in force since the 2026 Implementing Regulations', () => {
  for (const c of CHANGES) assert.ok(cn.entries[c.id], c.id);
  assert.equal(cn.appliesFrom, '2026-05-15');
  assert.match(cn.sources.impl.title, /Order No\. 828/);
  assert.ok(regionsFor(P('nce-tablet')).includes('cn'));
  assert.ok(!regionsFor(P('pq-antimalarial')).includes('cn'));
});

t('chemical drugs follow the guideline examples', () => {
  assert.equal(cls('nce-tablet', 'dp-process-change', { fundamentalTech: 'yes' }).category, 'SUPP');
  assert.equal(cls('nce-tablet', 'dp-process-change', { fundamentalTech: 'no', affectsRelease: 'no', bioMinorParam: 'yes' }).category, 'REPORT');
  assert.equal(cls('nce-tablet', 'dp-scale', { cnComplexForm: 'no', scaleWithin10: 'no' }).category, 'FILE');
  assert.equal(cls('talmisartan-er', 'dp-scale', { cnComplexForm: 'yes' }).category, 'SUPP');
  assert.equal(cls('nce-tablet', 'excipient-change', { cnExcipient: 'moderate' }).category, 'FILE');
  assert.equal(cls('nce-tablet', 'spec-relax').category, 'SUPP');
  assert.equal(cls('nce-tablet', 'spec-tighten').category, 'FILE');
  assert.equal(cls('nce-tablet', 'new-strength').category, 'SUPP');
  assert.equal(cls('nce-tablet', 'ds-cep', { cnApprovedApi: 'yes' }).category, 'FILE');
  assert.equal(cls('sterile-injectable', 'cc-polymer').category, 'SUPP');
  assert.equal(cls('nce-tablet', 'shelf-life-extend').category, 'FILE');
  assert.equal(cls('nce-tablet', 'storage-conditions').category, 'SUPP');
});

t('sites: imported drugs file or apply; domestic drugs change the production licence first', () => {
  assert.equal(cls('nce-tablet', 'dp-site-move').category, 'FILE');
  assert.equal(cls('sterile-injectable', 'dp-site-move').category, 'SUPP');
  assert.equal(cls('nce-tablet', 'dp-site-move', { cnImported: 'no' }).category, 'LICENCE');
  assert.equal(cls('mab-infusion', 'dp-site-move', { cnSameQaLine: 'yes' }).category, 'FILE');
});

t('biologics, labelling and lifecycle tools', () => {
  assert.equal(cls('mab-infusion', 'bio-mcb', { cnFromApprovedMcb: 'no' }).category, 'SUPP');
  assert.equal(cls('mab-infusion', 'bio-media', { cnMedia: 'nonkey' }).category, 'REPORT');
  assert.equal(cls('nce-tablet', 'lab-new-indication').category, 'SUPP');
  assert.equal(cls('nce-tablet', 'lab-safety-add').category, 'FILE');
  assert.equal(cls('nce-tablet', 'lab-new-route').category, 'NEW');
  assert.equal(cls('nce-tablet', 'cp-submit').category, 'NA');
  assert.equal(cls('nce-tablet', 'admin-ownership').category, 'SUPP');
});

t('filing plan, timeline, cover letter and change package', () => {
  const p = P('nce-tablet');
  const k = newCase({ product: p, regions: ['cn'], name: 'China test' });
  const c = addChange(k, 'spec-relax'); c.answers = {};
  const { filings } = filingsFor(cn, p, k);
  assert.equal(filings[0].category, 'SUPP');
  const tl = timelineFor(cn, p, filings[0], { submitDate: '2026-12-01' });
  assert.ok(tl.events.some((e) => /60 working days/.test(e.label)));
  const letter = coverLetter(cn, p, filings[0], k);
  assert.match(letter, /Center for Drug Evaluation/);
  assert.match(letter, /Guoyao Zhunzi/);
  assert.match(letter, /Domestic agent/);
  const pkg = buildChangePackage({ pack: cn, product: p, kase: k, filing: filings[0] });
  assert.equal(pkg, null); // no eCTD hand-off: the Dossier Builder has no China region
  const k2 = newCase({ product: p, regions: ['cn'], name: 'China report' });
  const c2 = addChange(k2, 'ipc-tighten'); c2.answers = {};
  const f2 = filingsFor(cn, p, k2).filings[0];
  assert.equal(f2.category, 'REPORT');
  assert.ok(timelineFor(cn, p, f2, { submitDate: '2026-12-01' }).events.some((e) => /annual report/.test(e.label)));
});

console.log(`China tests: ${n} passed`);
