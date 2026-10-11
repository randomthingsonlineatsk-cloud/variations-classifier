// Exchange with the Labelling Workbench: its CCDS change file starts a rollout case here, and
// the rollout file goes back with each region's classification and status.
import assert from 'node:assert/strict';
import { regionsFor } from '../src/engine/packs.js';
import { BUILTIN_PRODUCTS } from '../src/engine/model.js';
import { parseLabellingChange, caseFromLabellingChange, rolloutFile, ROLLOUT_KIND } from '../src/engine/labelhandoff.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const product = BUILTIN_PRODUCTS.find((p) => p.id === 'nce-tablet');
const file = {
  kind: 'labelling-workbench/ccds-change', schema: 1, changeId: 'c-1', projectId: 'p-1', trigger: 'ccds',
  product: { id: 'nce-tablet', brandName: 'Ostrevia', inn: 'lumiravostat' },
  ccds: { version: '4.0', date: '2026-10-01', kind: 'warning', text: 'Hepatitis B virus reactivation has been reported.' },
  regions: ['us', 'eu', 'xx'], status: { us: { step: 1, dates: { 'Wording drafted': '2026-10-03' } } },
};

t('parses the change file and rejects others', () => {
  assert.equal(parseLabellingChange(JSON.stringify(file)).ccds.version, '4.0');
  assert.throws(() => parseLabellingChange('{"kind":"other"}'));
  assert.throws(() => parseLabellingChange({ ...file, ccds: { ...file.ccds, kind: 'nonsense' } }));
});

t('starts a rollout case with the known regions and the status carried over', () => {
  const { kase, skipped } = caseFromLabellingChange(parseLabellingChange(file), product, { userId: 'u' }, regionsFor(product));
  assert.deepEqual(kase.regions, ['us', 'eu']);
  assert.deepEqual(skipped, ['xx']);
  assert.equal(kase.ccds.version, '4.0');
  assert.equal(kase.ccds.status.us.step, 1);
  assert.equal(kase.labellingLink.changeId, 'c-1');
});

t('the rollout file lists each region with its classification and status', () => {
  const { kase } = caseFromLabellingChange(parseLabellingChange(file), product, { userId: 'u' }, regionsFor(product));
  const out = rolloutFile(kase, product);
  assert.equal(out.kind, ROLLOUT_KIND);
  assert.equal(out.changeId, 'c-1');
  assert.deepEqual(out.regions.map((r) => r.region), ['us', 'eu']);
  const us = out.regions.find((r) => r.region === 'us');
  assert.equal(us.step, 1);
  assert.ok(us.classification.length > 0, 'a classification or a range is given');
});

console.log(`labelling hand-off: ${n} tests passed`);
