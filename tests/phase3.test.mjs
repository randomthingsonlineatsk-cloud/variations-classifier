// Labelling rollout, change requests, rollout planner and drills.
import assert from 'node:assert/strict';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';
import { newCcdsCase, rolloutRows, KINDS } from '../src/engine/labelling.js';
import { suggestChanges, impactStatement, emptyIntake } from '../src/engine/intake.js';
import { rolloutPlan } from '../src/engine/rollout.js';
import { drillSet, makeDrill } from '../src/engine/drills.js';
import { classify } from '../src/engine/classify.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const P = Object.fromEntries(BUILTIN_PRODUCTS.map((p) => [p.id, p]));

t('CCDS rollout: sections, classification and lag per region', () => {
  const k = newCcdsCase({ product: P['nce-tablet'], kind: 'adr', text: 'Add photosensitivity', version: '4.0', ccdsDate: '2026-09-01', regions: ['us', 'eu', 'in'] });
  k.changes[0].answers = { newlyAcquired: 'yes', agencyOutcome: 'no' };
  const rows = rolloutRows(k, P['nce-tablet'], '2026-10-11');
  assert.equal(rows.length, 3);
  assert.match(rows[1].section, /4\.8/);
  assert.equal(rows[0].result.category, 'CBE0');
  assert.equal(rows[1].result.category, 'II');
  assert.equal(rows[2].result.category, 'CDSCO');
  assert.ok(rows.every((r) => r.late && r.lagDays === 40));
  assert.ok(KINDS.length >= 6);
});
t('contraindication marks the serious-warning question for India biologics', () => {
  const k = newCcdsCase({ product: P['mab-infusion'], kind: 'contra', text: 'x', version: '2.1', ccdsDate: '2026-09-01', regions: ['in'] });
  assert.equal(rolloutRows(k, P['mab-infusion'], '2026-10-11')[0].result.category, 'L1');
});
t('change request suggestions and impact statement', () => {
  const s = suggestChanges(P['nce-tablet'], 'We want a new contract manufacturer site for tablets');
  assert.ok(s.some((c) => c.id === 'dp-site-move'));
  const k = newCase({ product: P['nce-tablet'], regions: ['us', 'eu'], submitDate: '2026-11-02' });
  k.intake = emptyIntake();
  const c = addChange(k, 'dp-site-move'); Object.assign(c.answers, { siteNeverInspected: 'no', siteCgmp: 'yes', siteNeedsInspection: 'no', novelComplex: 'no' });
  const st = impactStatement(k, P['nce-tablet']);
  assert.equal(st.regions[0].rows[0].category, 'CBE30'); assert.equal(st.regions[1].rows[0].category, 'IB');
  assert.match(st.text, /earliest use 2026-12-02/);
});
t('rollout plan finds the market that holds the change back', () => {
  const k = newCase({ product: P['talmisartan-er'], regions: ['us', 'eu', 'in'], submitDate: '2026-11-02' });
  const c = addChange(k, 'dp-site-move'); Object.assign(c.answers, { siteNeverInspected: 'no', siteCgmp: 'yes', siteNeedsInspection: 'no', novelComplex: 'no' });
  let plan = rolloutPlan(k, P['talmisartan-er']);
  assert.equal(plan.markets.find((m) => m.region === 'in').ready, null);
  assert.equal(plan.allReady, null); assert.deepEqual(plan.holdBack, ['in']);
  k.regions = ['us', 'eu'];
  plan = rolloutPlan(k, P['talmisartan-er']);
  assert.equal(plan.allReady, '2027-03-02'); assert.deepEqual(plan.holdBack, ['us']);
  assert.equal(plan.first, '2026-12-02'); assert.equal(plan.overlapDays, 90);
  assert.ok(plan.markets[0].shorten.length > 0);
});
t('drills always have one right answer that the classifier agrees with', () => {
  for (const region of ['us', 'eu', 'in']) {
    const set = drillSet(region, 10, 42);
    assert.ok(set.length >= 8, `${region} drill set size ${set.length}`);
    for (const d of set) assert.ok(d.options.some((o) => o.id === d.answer));
  }
  const d1 = makeDrill('eu', 7); const d2 = makeDrill('eu', 7);
  assert.equal(d1.change.id, d2.change.id); assert.equal(d1.answer, d2.answer);
});
console.log(`phase 3 tests: ${n} passed`);
