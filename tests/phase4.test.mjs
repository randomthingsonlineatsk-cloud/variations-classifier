// Phase 4: Canada, Switzerland, Japan and WHO PQ packs, the generic filing engine, missions
// 21 to 28, and the ICH Q12 and Q5E tools.
import assert from 'node:assert/strict';
import { packFor, READY, CHANGES, regionsFor } from '../src/engine/packs.js';
import { classify, productAnswers, lowerRoutes } from '../src/engine/classify.js';
import { filingsFor, timelineFor, coverLetter, ectdFor, m1For } from '../src/engine/filing.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';
import { MISSIONS, missionTruth } from '../src/engine/missions.js';
import { buildChangePackage } from '../src/engine/handoff.js';
import { suggestEC, regionCategory, newQ5e, q5eVerdict, pacmpStep1, newPlcm, newEc, plcmHtml } from '../src/engine/lifecycle.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const P = (id) => BUILTIN_PRODUCTS.find((p) => p.id === id);
const one = (region, pid, cid, answers = {}, date = '2026-11-02') => {
  const p = P(pid);
  const k = newCase({ product: p, regions: [region], submitDate: date });
  const c = addChange(k, cid); c.answers = answers;
  const pack = packFor(region);
  const { filings } = filingsFor(pack, p, k);
  return { p, k, pack, f: filings[0], res: classify(pack, cid, { ...productAnswers(p), ...answers }) };
};

t('seven regions ready, every pack covers all 120 changes', () => {
  assert.equal(READY.length, 7);
  assert.equal(CHANGES.length, 120);
  for (const r of READY) for (const c of CHANGES) assert.ok(packFor(r).entries[c.id], `${r} ${c.id}`);
});

t('Canada: pharmaceutical site change meeting the conditions is Level III, filed at implementation', () => {
  const a = Object.fromEntries([1, 2, 3, 4, 5].map((i) => [`HC-A1.23:${i}`, 'yes']));
  const { p, pack, f, res } = one('ca', 'nce-tablet', 'dp-site-move', a);
  assert.equal(res.category, 'L3');
  const tl = timelineFor(pack, p, f, { submitDate: '2026-11-02' });
  assert.equal(tl.events.find((e) => e.kind === 'due').date, '2026-11-02');
  assert.equal(ectdFor(pack, f, p).submissionType, 'level-iii');
  const failed = one('ca', 'nce-tablet', 'dp-site-move', { ...a, 'HC-A1.23:3': 'no' });
  assert.equal(failed.res.category, 'L1');
});

t('Canada: biologic relaxation is a notifiable change with a 90-day target; pharma is Level I', () => {
  const b = one('ca', 'mab-infusion', 'spec-relax');
  assert.equal(b.res.category, 'NC');
  assert.equal(timelineFor(b.pack, b.p, b.f, { submitDate: '2026-11-02' }).earliestUse, '2027-01-31');
  assert.equal(one('ca', 'nce-tablet', 'spec-relax', { compendial: 'no' }).res.category, 'L1');
  assert.equal(one('ca', 'generic-tablet', 'new-strength').f && ectdFor(packFor('ca'), one('ca', 'generic-tablet', 'new-strength').f, P('generic-tablet')).submissionType, 'sands');
});

t('Canada: no established conditions yet; PACMP route for biologics only', () => {
  assert.equal(one('ca', 'nce-tablet', 'non-ec-change').res.category, 'NA');
  assert.equal(one('ca', 'nce-tablet', 'cp-submit').res.category, 'NA');
  assert.equal(one('ca', 'mab-infusion', 'cp-submit').res.category, 'NC');
});

t('Switzerland: EU codes, Swiss clocks (IA-IN one month, IB 70 days)', () => {
  const ia = one('ch', 'nce-tablet', 'admin-name-address', { 'E.4:1': 'yes' });
  assert.equal(ia.res.category, 'IAIN');
  assert.equal(timelineFor(ia.pack, ia.p, ia.f, { submitDate: '2026-12-01' }).events.find((e) => e.kind === 'due').date, '2026-12-31');
  const ib = one('ch', 'sterile-injectable', 'shelf-life-extend', { realTimeData: 'yes', 'Q.II.f.1:3': 'yes' });
  assert.equal(ib.res.category, 'IB');
  assert.equal(ib.res.outcome.src, 'annex7');
  assert.equal(timelineFor(ib.pack, ib.p, ib.f, { submitDate: '2026-11-30' }).earliestUse, '2027-02-08');
  assert.equal(one('ch', 'nce-tablet', 'lab-layout').res.category, 'IB');
  assert.equal(one('ch', 'nce-tablet', 'lab-brand-name').res.category, 'IB');
  assert.doesNotMatch(JSON.stringify(packFor('ch').conditions), /EU\/EEA/);
});

t('Japan: the approval form decides, Article 47 overrides the minor route', () => {
  assert.equal(one('jp', 'nce-tablet', 'dp-scale', { jpItem: 'minor' }).res.category, 'MCN');
  assert.equal(one('jp', 'nce-tablet', 'dp-scale', { jpItem: 'absent' }).res.category, 'NONE');
  assert.equal(one('jp', 'nce-tablet', 'spec-relax', { jpItem: 'minor' }).res.category, 'PCA');
  assert.equal(one('jp', 'nce-tablet', 'dp-site-move', { jpItem: 'pca' }).res.category, 'PCAR');
  assert.equal(one('jp', 'nce-tablet', 'new-strength').res.category, 'NEW');
  const pn = one('jp', 'nce-tablet', 'cp-use', { jpProtocolNotice: 'yes' });
  assert.equal(pn.res.category, 'PACMPN');
  assert.equal(timelineFor(pn.pack, pn.p, pn.f, { submitDate: '2026-11-02' }).earliestUse, '2026-12-28');
  assert.equal(ectdFor(pn.pack, pn.f, pn.p), null);
});

t('WHO PQ: categories, unlisted changes default to major, biologics out of scope', () => {
  assert.equal(one('who', 'pq-antimalarial', 'dp-site-move', { pqInspected: 'yes' }).res.category, 'VMIN');
  assert.equal(one('who', 'pq-antimalarial', 'dp-site-move', { pqInspected: 'no' }).res.category, 'VMAJ');
  assert.equal(one('who', 'pq-antimalarial', 'nitrosamine-control').res.category, 'IN');
  assert.equal(one('who', 'pq-antimalarial', 'lab-safety-add', { whoMinorU: 'no' }).res.category, 'VMAJ');
  assert.equal(one('who', 'mab-infusion', 'spec-relax').res.category, 'OUT');
  const v = one('who', 'pq-antimalarial', 'shelf-life-extend');
  assert.equal(v.res.category, 'VMIN');
  assert.equal(timelineFor(v.pack, v.p, v.f, { submitDate: '2026-12-01' }).earliestUse, '2027-02-06');
  assert.equal(buildChangePackage({ pack: v.pack, product: v.p, kase: v.k, filing: v.f }), null);
  assert.ok(m1For(v.pack, v.f).some((d) => d.code === 'who:1.2'));
});

t('US and EU: new Phase 4 entries', () => {
  assert.equal(one('us', 'nce-tablet', 'design-space-within').res.category, 'NONE');
  assert.equal(one('us', 'nce-tablet', 'dosage-form-new').res.category, 'NEW');
  assert.equal(one('eu', 'nce-tablet', 'skip-testing').res.category, 'IB');
  assert.equal(one('eu', 'nce-tablet', 'lab-brand-name', { 'E.1:1': 'yes' }).res.category, 'IAIN');
  assert.equal(one('eu', 'mab-infusion', 'bio-scale', { bioScaleOnly: 'no' }).res.category, 'II');
  const none = one('us', 'nce-tablet', 'non-ec-change', { isEC: 'no' });
  assert.equal(none.f.category, 'NONE');
  assert.equal(timelineFor(none.pack, none.p, none.f, { submitDate: '2026-11-02' }).earliestUse, '2026-11-02');
});

t('cover letters and change packages for the new regions', () => {
  const ch = one('ch', 'nce-tablet', 'spec-tighten', { 'Q.II.d.1:1': 'yes', 'Q.II.d.1:2': 'yes', 'Q.II.d.1:4': 'yes' });
  const letter = coverLetter(ch.pack, ch.p, ch.f, ch.k);
  assert.match(letter, /Swissmedic/);
  assert.match(letter, /Training material/);
  const pkg = buildChangePackage({ pack: ch.pack, product: ch.p, kase: ch.k, filing: ch.f });
  assert.equal(pkg.region, 'CH');
  assert.equal(pkg.submission.ectd.submissionType, 'var-type1a');
  assert.equal(pkg.product.ch.authNumber, '99101');
  const jp = one('jp', 'nce-tablet', 'spec-relax', { jpItem: 'pca' });
  const jpk = buildChangePackage({ pack: jp.pack, product: jp.p, kase: jp.k, filing: jp.f });
  assert.equal(jpk.submission.ectd.submissionType, 'jp_partial-change');
});

t('protocol routes in Japan, Switzerland and Canadian biologics', () => {
  const jp = lowerRoutes(packFor('jp'), 'dp-process-change', { ...productAnswers(P('nce-tablet')), majorImpact: 'yes', jpItem: 'pca' });
  assert.ok(jp.some((r) => r.kind === 'protocol'));
  const caPharma = lowerRoutes(packFor('ca'), 'dp-process-change', { ...productAnswers(P('nce-tablet')), 'HC-A1.25:1': 'no' });
  assert.ok(!caPharma.some((r) => r.kind === 'protocol'));
});

t('missions 21 to 28 resolve with their facts', () => {
  const want = { 21: ['L3', '2026-11-16'], 22: ['NC', '2027-02-21'], 23: ['IB', '2027-02-08'], 24: ['IAIN', '2026-12-31'], 25: ['MCN', '2027-01-06'], 26: ['PCA', '2027-06-14'], 27: ['VMIN', '2027-02-06'], 28: ['IN', '2026-12-08'] };
  for (const [id, [cat, date]] of Object.entries(want)) {
    const m = MISSIONS.find((x) => x.id === Number(id));
    const tr = missionTruth(m);
    assert.equal(tr.main.category, cat, `mission ${id}`);
    assert.equal(tr.date, date, `mission ${id} date`);
  }
  assert.equal(missionTruth(MISSIONS.find((x) => x.id === 28)).filings.length, 2);
});

t('products: regions follow the profiles', () => {
  assert.deepEqual(regionsFor(P('pq-antimalarial')), ['us', 'eu', 'in', 'ca', 'who']);
  assert.ok(!regionsFor(P('nce-tablet')).includes('who'));
});

t('ICH Q12: EC suggestions and region mapping', () => {
  assert.deepEqual(suggestEC({ type: 'process', impact: 'high' }).category, 'prior');
  assert.equal(suggestEC({ type: 'process', impact: 'none' }).ec, false);
  assert.equal(suggestEC({ type: 'spec', impact: 'none' }).ec, true);
  assert.equal(regionCategory('us', 'moderate').id, 'CBE30');
  assert.equal(regionCategory('eu', 'low').id, 'IA');
  assert.equal(regionCategory('jp', 'moderate').id, 'MOD');
  assert.equal(regionCategory('ca', 'prior'), null);
  const s1 = pacmpStep1(P('nce-tablet'));
  assert.equal(s1.find((x) => x.region === 'us').result.category, 'PAS');
  assert.equal(s1.find((x) => x.region === 'eu').result.category, 'II');
  const doc = newPlcm({ product: P('nce-tablet') });
  doc.ecs.push({ ...newEc(), element: 'Granulation water', value: '18-22%', impact: 'high', category: 'prior', ec: true });
  const html = plcmHtml(doc, P('nce-tablet'));
  assert.match(html, /Granulation water/);
  assert.match(html, /TRAINING DOCUMENT/);
});

t('ICH Q5E: verdicts', () => {
  const d = newQ5e({ product: P('mab-infusion') });
  assert.equal(q5eVerdict(d).level, 'incomplete');
  for (const r of d.rows) r.result = 'same';
  assert.equal(q5eVerdict(d).level, 'comparable');
  d.rows.find((r) => r.group === 'structure').result = 'diff-ok';
  assert.equal(q5eVerdict(d).level, 'justified');
  d.rows.find((r) => r.group === 'activity').result = 'diff-risk';
  assert.equal(q5eVerdict(d).level, 'bridging');
});

console.log(`phase 4 tests: ${n} passed`);
