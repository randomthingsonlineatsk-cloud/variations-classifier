// Pack integrity: every tree reaches an outcome, every outcome cites a known source and
// category, every question exists, and the catalogue and the pack agree.
import assert from 'node:assert/strict';
import { PACKS, CHANGES, QUESTIONS, EVIDENCE, optionsFor } from '../src/engine/packs.js';

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
for (const [id, editions] of Object.entries(PACKS)) {
  for (const pack of editions) {
    const cats = new Set(pack.categories.map((c) => c.id));
    for (const c of pack.categories) { ok(pack.sources[c.src], `${id} category ${c.id} source`); if (c.bioSrc) ok(pack.sources[c.bioSrc], `${c.id} bioSrc`); }
    const walk = (n, where) => {
      if (n.cat) {
        ok(cats.has(n.cat), `${where}: unknown category ${n.cat}`);
        ok(pack.sources[n.src], `${where}: unknown source ${n.src}`);
        ok(n.at && n.why, `${where}: outcome needs at and why`);
        if (n.bioSrc) ok(pack.sources[n.bioSrc] && n.bioAt, `${where}: bioSrc`);
        return 1;
      }
      ok(QUESTIONS[n.ask], `${where}: unknown question ${n.ask}`);
      const want = optionsFor(n.ask).map((o) => o.value).sort().join(',');
      ok(Object.keys(n.on).sort().join(',') === want, `${where}: branches of ${n.ask} must be ${want}`);
      return Object.entries(n.on).reduce((s, [k, c]) => s + walk(c, `${where}/${n.ask}=${k}`), 0);
    };
    for (const ch of CHANGES) {
      const e = pack.entries[ch.id];
      ok(e, `${id}: no entry for ${ch.id}`);
      ok(walk(e.tree, ch.id) >= 1, `${ch.id}: no outcome`);
      for (const ev of ch.evidence) ok(EVIDENCE[ev], `${ch.id}: unknown evidence ${ev}`);
    }
    for (const k of Object.keys(pack.entries)) ok(CHANGES.some((c) => c.id === k), `${id}: entry ${k} not in catalogue`);
    for (const [k, c] of Object.entries(pack.clocks)) ok(pack.sources[c.src], `clock ${k} source`);
  }
}
console.log(`pack tests: ${checks} checks passed`);
