// India pack: PAC/2024 levels for biologicals, case by case for chemical drugs, the draft
// G.S.R. 97(E) what-if, clocks and hand-off.
import assert from 'node:assert/strict';
import { packFor } from '../src/engine/packs.js';
import { classify, productAnswers } from '../src/engine/classify.js';
import { filingsFor, timelineFor, impactFor, ectdFor, packForCase, coverLetter, addWorkingDays } from '../src/engine/filing.js';
import { buildChangePackage } from '../src/engine/handoff.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const inForce = packFor('in');
const inDraft = packFor('in', { draft: true });
const P = Object.fromEntries(BUILTIN_PRODUCTS.map((p) => [p.id, p]));
const cls = (pack, pid, change, a = {}) => classify(pack, change, { ...productAnswers(P[pid]), ...a });

t('editions', () => { assert.equal(inForce.edition, '2026.1'); assert.equal(inDraft.edition, '2026.1-draft'); assert.ok(inDraft.draft); });
t('chemical drug quality change: case by case in force, a level under the draft', () => {
  const a = { siteNeverInspected: 'no', siteCgmp: 'yes' };
  assert.equal(cls(inForce, 'nce-tablet', 'dp-site-move', a).category, 'CDSCO');
  const d = cls(inDraft, 'nce-tablet', 'dp-site-move', a);
  assert.equal(d.category, 'L2'); assert.match(d.outcome.at, /draft/);
  assert.equal(cls(inDraft, 'nce-tablet', 'spec-tighten').category, 'L3');
  assert.equal(cls(inDraft, 'nce-tablet', 'shelf-life-extend', { approvedProtocolFullData: 'yes' }).category, 'L3SL');
});
t('new claims make a new drug', () => assert.equal(cls(inForce, 'nce-tablet', 'lab-new-indication').category, 'NEWDRUG'));
t('biologics follow PAC/2024', () => {
  assert.equal(cls(inForce, 'mab-infusion', 'ds-site-move', { existingSite: 'no' }).category, 'L1');
  assert.equal(cls(inForce, 'mab-infusion', 'bio-wcb').category, 'L3');
  assert.equal(cls(inForce, 'mab-infusion', 'bio-mcb').category, 'L2');
  assert.equal(cls(inForce, 'mab-infusion', 'lab-safety-add', { seriousWarning: 'yes' }).category, 'L1');
  assert.equal(cls(inDraft, 'mab-infusion', 'bio-mcb').category, 'L2');
});
t('case option switches to the draft', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['in'] });
  assert.equal(packForCase(k, 'in').edition, '2026.1');
  k.options.inDraft = true;
  assert.equal(packForCase(k, 'in').edition, '2026.1-draft');
});
t('annual notification and import documents', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['in'], submitDate: '2026-11-02' });
  addChange(k, 'spec-tighten'); addChange(k, 'reference-standard');
  k.related = false;
  const { filings } = filingsFor(inDraft, P['nce-tablet'], k);
  assert.deepEqual(filings.map((f) => f.category), ['L3']);
  const tl = timelineFor(inDraft, P['nce-tablet'], filings[0], { submitDate: '2026-11-02' });
  assert.ok(tl.events.some((e) => e.kind === 'due' && e.date === '2027-03-31'));
  const k2 = newCase({ product: P['nce-tablet'], regions: ['in'], submitDate: '2026-11-02' });
  const c = addChange(k2, 'dp-site-move'); Object.assign(c.answers, { siteNeverInspected: 'no', siteCgmp: 'yes' });
  const f = filingsFor(inDraft, P['nce-tablet'], k2).filings[0];
  assert.ok(impactFor(inDraft, f).some((e) => e.code === 'in:1.5'));
  assert.equal(ectdFor(inDraft, f).submissionType, 'post-approval-change');
  assert.match(coverLetter(inDraft, P['nce-tablet'], f, k2), /authorised agent/);
});
t('new drug permission: 90 working days and the right form', () => {
  assert.equal(addWorkingDays('2026-11-02', 5), '2026-11-09');
  const k = newCase({ product: P['generic-tablet'], regions: ['in'], submitDate: '2026-11-02' });
  addChange(k, 'new-strength');
  const f = filingsFor(inForce, P['generic-tablet'], k).filings[0];
  assert.equal(ectdFor(inForce, f).submissionType, 'new-drug-manufacture');
  assert.equal(timelineFor(inForce, P['generic-tablet'], f, { submitDate: '2026-11-02' }).earliestUse, addWorkingDays('2026-11-02', 90));
  const pkg = buildChangePackage({ pack: inForce, product: P['generic-tablet'], kase: k, filing: f });
  assert.equal(pkg.region, 'IN'); assert.equal(pkg.product.in.route, 'manufacture');
});
console.log(`India tests: ${n} passed`);
