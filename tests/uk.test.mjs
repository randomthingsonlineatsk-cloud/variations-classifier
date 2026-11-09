// The UK pack (MHRA applies the 2013 guidelines) and the Divergence and Reliance Map.
import assert from 'node:assert/strict';
import { packFor, CHANGES, regionsFor } from '../src/engine/packs.js';
import { classify, productAnswers } from '../src/engine/classify.js';
import { filingsFor, timelineFor, coverLetter, ectdFor, m1For } from '../src/engine/filing.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';
import { buildChangePackage } from '../src/engine/handoff.js';
import { divergence, divergenceSummary, relianceFor } from '../src/engine/reliance.js';

let n = 0;
const t = (name, fn) => { fn(); n++; };
const P = (id) => BUILTIN_PRODUCTS.find((p) => p.id === id);
const uk = packFor('uk'), eu = packFor('eu', { date: '2026-11-02' });
const cls = (pack, pid, cid, a = {}) => classify(pack, cid, { ...productAnswers(P(pid)), ...a });

t('UK pack: every change, UK sources, current', () => {
  for (const c of CHANGES) assert.ok(uk.entries[c.id], c.id);
  assert.equal(uk.status, 'current');
  assert.match(uk.sources.gl13.title, /MHRA/);
  assert.ok(regionsFor(P('nce-tablet')).includes('uk'));
  assert.ok(!regionsFor(P('pq-antimalarial')).includes('uk'));
});

t('2013 and 2025 split: re-test period on real-time data is IB in the UK, IA in the EU', () => {
  const a = { realTimeData: 'yes', 'Q.I.d.1:2': 'yes' };
  assert.equal(cls(uk, 'nce-tablet', 'ds-retest', a).category, 'IB');
  assert.equal(cls(eu, 'nce-tablet', 'ds-retest', a).category, 'IA');
});

t('PACMP implementation: no Type IA in the UK (B.II.g.5), design space always Type II', () => {
  const r = cls(uk, 'nce-tablet', 'cp-use', { pacmpType: 'IA' });
  assert.equal(r.category, 'IAIN'); assert.equal(r.outcome.at, 'B.II.g.5(a)');
  assert.equal(cls(uk, 'nce-tablet', 'design-space-new', { dsScope: 'method' }).category, 'II');
  assert.equal(cls(eu, 'nce-tablet', 'design-space-new', { dsScope: 'method' }).category, 'IB');
  assert.equal(cls(uk, 'nce-tablet', 'ec-define').category, 'OTHER');
});

t('UK filing: MHRA timeline, UK Module 1, cover letter names the IRP reference regulator', () => {
  const p = P('nce-tablet');
  const k = newCase({ product: p, regions: ['uk'], submitDate: '2026-11-02' });
  const c = addChange(k, 'lab-new-indication'); c.answers = {};
  k.options.irp = 'United States (FDA)';
  const { filings } = filingsFor(uk, p, k);
  const f = filings[0];
  assert.equal(f.category, 'II');
  const tl = timelineFor(uk, p, f, { submitDate: '2026-11-02' });
  assert.ok(tl.events.some((e) => /MHRA/.test(e.label)));
  assert.ok(m1For(uk, f).some((d) => d.code === 'uk:1.3.1'));
  assert.equal(ectdFor(uk, f, p).submissionType, 'var-type2');
  const letter = coverLetter(uk, p, f, k);
  assert.match(letter, /International Recognition Procedure/); assert.match(letter, /United States \(FDA\)/); assert.match(letter, /PL 99101\/0001/);
  const pkg = buildChangePackage({ pack: uk, product: p, kase: k, filing: f });
  assert.equal(pkg.region, 'UK'); assert.equal(pkg.product.uk.plNumber, 'PL 99101/0001');
});

t('divergence map: counts add up and include the known splits', () => {
  const rows = divergence(); const s = divergenceSummary(rows);
  assert.equal(s.total, 120);
  assert.equal(s.differ, s.ukHeavier + s.euHeavier + s.mixed + s.noUkRoute);
  const d = (id) => rows.find((r) => r.id === id);
  assert.equal(d('ds-retest').direction, 'uk-heavier');
  assert.equal(d('ec-define').direction, 'no-uk-route');
  assert.equal(d('dp-site-move').same, true);
});

t('reliance: IRP for Type II, only grouped for Type IA; Access only for new indications', () => {
  const ind = relianceFor('lab-new-indication');
  assert.equal(ind.routes.find((r) => r.id === 'irp').applies, 'yes');
  assert.equal(ind.routes.find((r) => r.id === 'access').applies, 'yes');
  const tighten = relianceFor('ipc-tighten', { uk: 'IA' });
  assert.equal(tighten.routes.find((r) => r.id === 'irp').applies, 'grouped');
  assert.equal(tighten.routes.find((r) => r.id === 'access').applies, 'no');
  assert.equal(relianceFor('design-space-within').routes.find((r) => r.id === 'irp').applies, 'no');
});

console.log(`UK and divergence tests: ${n} passed`);
