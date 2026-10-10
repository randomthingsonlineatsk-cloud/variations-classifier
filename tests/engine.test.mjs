// Engine tests: classifications that follow the FDA texts, ranges, what-if, filings,
// clocks, the hand-off file and the missions.
import assert from 'node:assert/strict';
import { packFor, CHANGES, changesFor, searchChanges } from '../src/engine/packs.js';
import { classify, productAnswers, nextQuestion, whatIfs, lowerRoutes, questionsIn } from '../src/engine/classify.js';
import { filingsFor, impactFor, timelineFor, addMonths, addDays, annualReportDue, coverLetter, cmpCode } from '../src/engine/filing.js';
import { buildChangePackage, parseChangePackage } from '../src/engine/handoff.js';
import { BUILTIN_PRODUCTS, newCase, addChange, productFromEctdFile } from '../src/engine/model.js';
import { MISSIONS, missionTruth, scoreMission, missionCase } from '../src/engine/missions.js';
import { exportProject, parseProjectFile } from '../src/engine/io.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const pack = packFor('us');
const P = Object.fromEntries(BUILTIN_PRODUCTS.map((p) => [p.id, p]));
const cls = (pid, change, answers = {}) => classify(pack, change, { ...productAnswers(P[pid]), ...answers });

t('IR tablet site move to an inspected site is CBE-30 (VI.C.1.a)', () => {
  const r = cls('nce-tablet', 'dp-site-move', { siteNeverInspected: 'no', siteCgmp: 'yes' });
  assert.equal(r.status, 'done'); assert.equal(r.category, 'CBE30'); assert.equal(r.outcome.at, 'VI.C.1.a');
});
t('never-inspected site is PAS (VI.B.1)', () => assert.equal(cls('nce-tablet', 'dp-site-move', { siteNeverInspected: 'yes' }).outcome.at, 'VI.B.1'));
t('MR product site move is PAS (VI.B.3)', () => {
  const r = cls('talmisartan-er', 'dp-site-move', { siteNeverInspected: 'no', siteCgmp: 'yes' });
  assert.equal(r.category, 'PAS'); assert.equal(r.outcome.at, 'VI.B.3');
});
t('MDI site move is PAS: packaging controls the dose', () => assert.equal(cls('mdi-aerosol', 'dp-site-move', { siteNeverInspected: 'no', siteCgmp: 'yes' }).category, 'PAS'));
t('aseptic move into a similar existing area is CBE-30 (VI.C.1.b)', () => assert.equal(cls('sterile-injectable', 'dp-site-move', { siteNeverInspected: 'no', siteCgmp: 'yes', asepticNewOrDissimilar: 'no' }).outcome.at, 'VI.C.1.b'));
t('unanswered questions give a range', () => {
  const r = cls('nce-tablet', 'dp-site-move');
  assert.equal(r.status, 'range'); assert.equal(r.min, 'CBE30'); assert.equal(r.max, 'PAS');
  assert.equal(nextQuestion(pack, 'dp-site-move', productAnswers(P['nce-tablet'])), 'siteNeverInspected');
});
t('"not known" behaves like unanswered', () => assert.equal(cls('nce-tablet', 'dp-site-move', { siteNeverInspected: 'unknown' }).status, 'range'));
t('biologic labeling citation switches to 601.12', () => {
  const r = cls('mab-infusion', 'lab-safety-add', { newlyAcquired: 'yes' });
  assert.equal(r.category, 'CBE0'); assert.equal(r.outcome.src, 'cfr601'); assert.match(r.outcome.at, /601\.12\(f\)\(2\)/);
});
t('NDA guidance used for a biologic carries a caveat', () => {
  const r = cls('mab-infusion', 'shelf-life-reduce');
  assert.ok(r.outcome.notes.some((x) => /BLA/.test(x)));
});
t('SUPAC levels', () => {
  assert.equal(cls('nce-tablet', 'excipient-change', { supacLevel: '1' }).category, 'AR');
  assert.equal(cls('nce-tablet', 'excipient-change', { supacLevel: '2' }).category, 'PAS');
});
t('specifications follow section VIII', () => {
  assert.equal(cls('nce-tablet', 'spec-tighten').category, 'AR');
  assert.equal(cls('mab-infusion', 'spec-tighten').category, 'CBE30');
  assert.equal(cls('nce-tablet', 'spec-add-test').category, 'CBE0');
  assert.equal(cls('nce-tablet', 'spec-relax', { adventitious: 'no', compendial: 'yes' }).category, 'CBE30');
});
t('what-if finds the flips that change the category', () => {
  const a = { ...productAnswers(P['nce-tablet']), siteNeverInspected: 'no', siteCgmp: 'yes' };
  const w = whatIfs(pack, 'dp-site-move', a);
  assert.ok(w.some((x) => x.q === 'siteCgmp' && x.category === 'PAS'));
  assert.ok(w.some((x) => x.q === 'mr' && x.category === 'PAS' && x.fromProduct));
  const lr = lowerRoutes(pack, 'dp-site-move', { ...a, siteNeverInspected: 'yes' });
  assert.ok(lr.some((x) => x.kind === 'protocol'));
});
t('questionsIn lists the tree questions', () => assert.ok(questionsIn(pack, 'dp-site-move').includes('asepticNewOrDissimilar')));
t('changesFor hides biologics changes for small molecules', () => {
  assert.ok(!changesFor(P['nce-tablet']).some((c) => c.scope === 'bio'));
  assert.ok(changesFor(P['mab-infusion']).some((c) => c.id === 'bio-mcb'));
  assert.ok(searchChanges(CHANGES, 'shelf life').length >= 2);
});
t('dates', () => {
  assert.equal(addMonths('2026-10-31', 4), '2027-02-28');
  assert.equal(addDays('2026-11-02', 30), '2026-12-02');
  assert.deepEqual(annualReportDue('2023-03-14', '2026-11-02'), { anniversary: '2027-03-14', due: '2027-05-13' });
  assert.ok(cmpCode('3.2.S.4.1', '3.2.P.1') < 0 && cmpCode('1.2', '3.2.S.2.1') < 0 && cmpCode('3.2.P.8.3', '3.2.A.1') < 0);
});
t('related changes file together in the most restrictive category', () => {
  const k = newCase({ product: P['generic-tablet'] });
  addChange(k, 'spec-tighten'); addChange(k, 'spec-add-test');
  const c = addChange(k, 'spec-relax'); Object.assign(c.answers, { adventitious: 'no', compendial: 'no', rawMaterialPreFinal: 'no', envMicro: 'no' });
  k.related = true;
  let f = filingsFor(pack, P['generic-tablet'], k).filings;
  assert.equal(f.length, 1); assert.equal(f[0].category, 'PAS');
  k.related = false;
  f = filingsFor(pack, P['generic-tablet'], k).filings;
  assert.deepEqual(f.map((x) => x.category), ['PAS', 'CBE0', 'AR']);
  const tl = timelineFor(pack, P['generic-tablet'], f[0], { submitDate: '2026-12-01' });
  assert.equal(tl.earliestUse, '2027-06-01');
  const imp = impactFor(pack, f[0]).map((e) => e.code);
  assert.ok(imp.includes('1.1') && imp.includes('3.2.P.5.1'));
});
t('hand-off file round trip', () => {
  const k = newCase({ product: P['nce-tablet'], submitDate: '2026-11-02' });
  const c = addChange(k, 'dp-site-move'); Object.assign(c.answers, { siteNeverInspected: 'no', siteCgmp: 'yes' });
  const f = filingsFor(pack, P['nce-tablet'], k).filings[0];
  const pkg = buildChangePackage({ pack, product: P['nce-tablet'], kase: k, filing: f, user: { userId: 'u-1', classId: null } });
  assert.equal(pkg.submission.ectd.submissionType, 'chemistry-manufacturing-controls-supplement');
  assert.equal(pkg.submission.earliestUse, '2026-12-02');
  assert.equal(pkg.product.ectdProductId, 'nce-tablet');
  assert.ok(pkg.ctd.some((e) => e.code === '3.2.P.3.1' && e.operation === 'replace'));
  assert.match(pkg.coverLetter, /CHANGES BEING EFFECTED IN 30 DAYS/);
  assert.match(pkg.coverLetter, /21 CFR 314\.70\(c\)\(3\)/);
  const back = parseChangePackage(JSON.stringify(pkg));
  assert.equal(back.changes[0].category, 'CBE30');
  assert.throws(() => parseChangePackage('{"kind":"x"}'));
});
t('cover letter for an annual report', () => {
  const k = newCase({ product: P['nce-tablet'] });
  addChange(k, 'spec-tighten');
  const f = filingsFor(pack, P['nce-tablet'], k).filings[0];
  assert.match(coverLetter(pack, P['nce-tablet'], f, k), /Annual report/);
});
t('missions: truth computed, perfect answers score 100', () => {
  for (const m of MISSIONS) {
    const truth = missionTruth(m);
    assert.ok(truth.date, `mission ${m.id} date`);
    const k = missionCase(m, null);
    k.changes.forEach((c, i) => { c.answers = { ...m.changes[i].facts }; });
    k.related = m.related ?? false;
    k.mission = { ctd: truth.ctd, date: truth.date };
    const s = scoreMission(m, k);
    assert.equal(s.score, 100, `mission ${m.id}: ${JSON.stringify(s.feedback)}`);
  }
  const m1 = MISSIONS[0];
  assert.equal(missionTruth(m1).main.category, 'CBE30');
  assert.equal(missionTruth(MISSIONS[1]).date, '2027-03-02');
  assert.equal(missionTruth(MISSIONS[5]).date, '2026-11-04');
  assert.deepEqual(missionTruth(MISSIONS[6]).filings.map((f) => f.category), ['PAS', 'AR']);
});
t('missions: over-filing gets half the category points', () => {
  const m = MISSIONS[0];
  const k = missionCase(m, null);
  k.changes[0].answers = { siteNeverInspected: 'yes' };
  const s = scoreMission(m, k);
  assert.equal(s.parts.categories, 20);
});
t('eCTD project file gives a linked product', () => {
  const file = JSON.stringify({ kind: 'ectd-dossier-builder/project', project: { id: 'p-1', name: 'Ostrevia NDA', productId: 'nce-tablet', region: 'US', settings: { applicationNumber: '999999', applicant: { name: 'Halcyon Ridge Pharmaceuticals, Inc.' } } } });
  const p = productFromEctdFile(file);
  assert.equal(p.applicationNumber, '999999'); assert.equal(p.ectdProjectId, 'p-1'); assert.equal(p.basedOn, 'nce-tablet');
  assert.throws(() => productFromEctdFile('{"kind":"other"}'));
});
t('project file round trip keeps user and class ids', () => {
  const k = newCase({ product: P['nce-tablet'], user: { userId: 'u-a', classId: 'cls-1' } });
  const text = exportProject({ user: { userId: 'u-a', classId: 'cls-1' }, cases: [k], attempts: [], products: [] });
  const back = parseProjectFile(text, { userId: 'u-b', classId: null }, { cases: new Set([k.id]), attempts: new Set(), products: new Set() });
  assert.notEqual(back.cases[0].id, k.id);
  assert.equal(back.cases[0].userId, 'u-b'); assert.equal(back.cases[0].importedFrom.userId, 'u-a');
});
console.log(`engine tests: ${n} passed`);
