// EU pack: annex conditions, editions by date, grouping, worksharing, clocks and hand-off.
import assert from 'node:assert/strict';
import { packFor } from '../src/engine/packs.js';
import { classify, productAnswers, nextQuestion, pathItems, whatIfs, reachable } from '../src/engine/classify.js';
import { filingsFor, timelineFor, impactFor, ectdFor, packForCase, coverLetter } from '../src/engine/filing.js';
import { buildChangePackage } from '../src/engine/handoff.js';
import { BUILTIN_PRODUCTS, newCase, addChange, migrateCase } from '../src/engine/model.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const eu = packFor('eu');
const P = Object.fromEntries(BUILTIN_PRODUCTS.map((p) => [p.id, p]));
const cls = (pid, change, a = {}, pack = eu) => classify(pack, change, { ...productAnswers(P[pid]), ...a });
const yes = (entry, nums) => Object.fromEntries(nums.map((x) => [`${entry}:${x}`, 'yes']));

t('current edition is the 2025 guidelines', () => { assert.equal(eu.edition, '2026.1'); assert.equal(packFor('eu', { date: '2025-12-01' }).edition, '2013.1'); });
t('finished product site: Type IB (Q.II.b.1(e))', () => {
  const r = cls('nce-tablet', 'dp-site-move', { siteNeedsInspection: 'no', novelComplex: 'no' });
  assert.equal(r.category, 'IB'); assert.equal(r.outcome.at, 'Q.II.b.1(e)');
});
t('immediate packaging site: conditions met gives IA-IN; product condition answered from the profile', () => {
  const r = cls('nce-tablet', 'primary-pack-site', yes('Q.II.b.1', [1, 2, 4]));
  assert.equal(r.category, 'IAIN');
  assert.ok(r.steps.some((s) => s.q === 'Q.II.b.1:3' && s.fromProduct));
  const s = cls('sterile-injectable', 'primary-pack-site', yes('Q.II.b.1', [1, 2, 4]));
  assert.equal(s.category, 'IB');
});
t('open conditions give a range and the next question is the first open one', () => {
  const a = { ...productAnswers(P['nce-tablet']), 'Q.II.b.1:1': 'yes' };
  const r = classify(eu, 'primary-pack-site', a);
  assert.equal(r.status, 'range'); assert.equal(r.min, 'IAIN'); assert.equal(r.max, 'IB');
  assert.equal(nextQuestion(eu, 'primary-pack-site', a), 'Q.II.b.1:2');
  assert.ok(pathItems(eu, 'primary-pack-site', a)[0].group);
});
t('batch size within 10x: IA for an IR tablet, IB for an extended-release capsule', () => {
  const a = { comparabilityNeeded: 'no', novelComplex: 'no', scaleWithin10: 'yes', ...yes('Q.II.b.4', [1, 3, 4, 6, 7]) };
  assert.equal(cls('nce-tablet', 'dp-scale', a).category, 'IA');
  assert.equal(cls('talmisartan-er', 'dp-scale', a).category, 'IB');
});
t('shelf-life extension: IA-IN only for immediate-release film-coated tablets', () => {
  const a = { realTimeData: 'yes', 'Q.II.f.1:3': 'yes' };
  assert.equal(cls('nce-tablet', 'shelf-life-extend', a).category, 'IAIN');
  assert.equal(cls('generic-tablet', 'shelf-life-extend', a).category, 'IB');
});
t('what-if flips a condition', () => {
  const a = { ...productAnswers(P['nce-tablet']), ...yes('Q.II.b.1', [1, 2, 4]) };
  const w = whatIfs(eu, 'primary-pack-site', a);
  assert.ok(w.some((x) => x.cond && x.q === 'Q.II.b.1:1' && x.category === 'IB'));
});
t('reachable categories', () => assert.deepEqual(reachable(eu, 'dp-site-move'), ['IB', 'II']));
t('new working cell bank under an approved protocol: no variation', () => assert.equal(cls('mab-infusion', 'bio-wcb', { wcbApprovedProtocol: 'yes' }).category, 'NONE'));
t('transition: the 2013 edition applies to an earlier case date', () => {
  const p13 = packFor('eu', { date: '2025-11-03' });
  const r = cls('nce-tablet', 'dp-site-move', { siteNeedsInspection: 'no', novelComplex: 'no' }, p13);
  assert.equal(r.outcome.at, 'B.II.b.1(e)');
  assert.equal(classify(p13, 'cp-use', {}).status, 'missing');
});
t('unrelated Type IA share one notification; IB is filed apart', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['eu'], submitDate: '2026-11-02' });
  const a = addChange(k, 'spec-tighten'); Object.assign(a.answers, yes('Q.II.d.1', [1, 2, 4]));
  const b = addChange(k, 'stability-protocol'); Object.assign(b.answers, yes('Q.II.f.1', [1, 2]));
  const c = addChange(k, 'dp-site-move'); Object.assign(c.answers, { siteNeedsInspection: 'no', novelComplex: 'no' });
  k.related = false;
  const { filings } = filingsFor(eu, P['nce-tablet'], k);
  assert.deepEqual(filings.map((f) => f.category), ['IB', 'IA']);
  assert.equal(filings[1].items.length, 2); assert.equal(filings[1].mode, 'single-notification');
  const tl = timelineFor(eu, P['nce-tablet'], filings[1], { submitDate: k.submitDate });
  assert.ok(tl.events.some((e) => e.kind === 'due' && e.date === '2027-11-02'));
  assert.equal(timelineFor(eu, P['nce-tablet'], filings[0], { submitDate: k.submitDate }).earliestUse, '2026-12-02');
});
t('a related group follows its highest type and warns on mixed groups', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['eu'] });
  const a = addChange(k, 'ds-route-new');
  const b = addChange(k, 'spec-tighten'); Object.assign(b.answers, yes('Q.II.d.1', [1, 2, 4]));
  k.related = true;
  const f = filingsFor(eu, P['nce-tablet'], k).filings[0];
  assert.equal(f.category, 'II'); assert.equal(f.mode, 'grouping');
  assert.ok(f.warnings.some((w) => /Active substance and finished product/.test(w)));
  assert.equal(ectdFor(eu, f).submissionMode, 'grouping');
});
t('worksharing and super-grouping', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['eu'] });
  const c = addChange(k, 'dp-site-move'); Object.assign(c.answers, { siteNeedsInspection: 'no', novelComplex: 'no' });
  k.alsoProducts = ['sterile-injectable'];
  const f = filingsFor(eu, P['nce-tablet'], k).filings[0];
  assert.equal(f.mode, 'worksharing'); assert.equal(ectdFor(eu, f).submissionMode, 'worksharing');
  const k2 = newCase({ product: P['nce-tablet'], regions: ['eu'] });
  const d = addChange(k2, 'spec-tighten'); Object.assign(d.answers, yes('Q.II.d.1', [1, 2, 4]));
  k2.alsoProducts = ['sterile-injectable'];
  assert.equal(filingsFor(eu, P['nce-tablet'], k2).filings[0].mode, 'super-grouping');
});
t('Type II clocks: quality-only after the opinion; product information after the decision', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['eu'], submitDate: '2026-11-02' });
  addChange(k, 'ds-route-new');
  const f = filingsFor(eu, P['nce-tablet'], k).filings[0];
  assert.equal(timelineFor(eu, P['nce-tablet'], f, { submitDate: '2026-11-02' }).earliestUse, '2027-01-01');
  const k2 = newCase({ product: P['nce-tablet'], regions: ['eu'], submitDate: '2026-11-02' });
  addChange(k2, 'lab-new-indication');
  const g = filingsFor(eu, P['nce-tablet'], k2).filings[0];
  const tl = timelineFor(eu, P['nce-tablet'], g, { submitDate: '2026-11-02', clockStop: 30 });
  assert.equal(tl.earliestUse, '2027-05-01'); // 90-day indication timetable + 30-day stop + 60 days to the decision
  assert.ok(impactFor(eu, g).some((e) => e.code === 'eu:1.3.1'));
});
t('EU hand-off and cover letter', () => {
  const k = newCase({ product: P['mab-infusion'], regions: ['eu'], submitDate: '2026-11-02' });
  const c = addChange(k, 'storage-conditions');
  const f = filingsFor(eu, P['mab-infusion'], k).filings[0];
  const pkg = buildChangePackage({ pack: eu, product: P['mab-infusion'], kase: k, filing: f });
  assert.equal(pkg.region, 'EU'); assert.equal(pkg.submission.ectd.submissionType, 'var-type2');
  assert.equal(pkg.changes[0].entry.at, 'Q.II.f.1(c)');
  assert.match(coverLetter(eu, P['mab-infusion'], f, k), /EU\/1\/22\/9905/);
});
t('cases follow the edition in force on their date; old cases migrate', () => {
  const k = newCase({ product: P['nce-tablet'], regions: ['us', 'eu'], submitDate: '2025-10-01' });
  assert.equal(k.packs.eu.edition, '2013.1'); assert.equal(packForCase(k, 'eu').edition, '2013.1');
  const old = migrateCase({ id: 'c1', region: 'us', productId: 'nce-tablet', submitDate: '2026-11-01', changes: [], options: {} });
  assert.deepEqual(old.regions, ['us']); assert.equal(old.options.clockStop, 0);
});
console.log(`EU tests: ${n} passed`);
