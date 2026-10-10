// Pack integrity: every tree reaches an outcome, every outcome cites a known source and
// category, every question and annex condition exists, and the catalogue and the pack agree.
import assert from 'node:assert/strict';
import { PACKS, CHANGES, QUESTIONS, EVIDENCE, optionsFor } from '../src/engine/packs.js';
import { productAnswers } from '../src/engine/classify.js';

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const productKeys = new Set(Object.keys(productAnswers({ facts: {} })));
for (const [id, editions] of Object.entries(PACKS)) {
  for (const pack of editions) {
    const tag = `${id} ${pack.edition}`;
    const cats = new Set(pack.categories.map((c) => c.id));
    ok(pack.appliesFrom && pack.edition && pack.status, `${tag}: header`);
    for (const c of pack.categories) { ok(pack.sources[c.src], `${tag} category ${c.id} source`); if (c.bioSrc) ok(pack.sources[c.bioSrc], `${c.id} bioSrc`); }
    for (const [k, c] of Object.entries(pack.conditions ?? {})) {
      ok(c.text?.length > 10, `${tag}: condition ${k} text`);
      if (c.auto) ok(productKeys.has(c.auto), `${tag}: condition ${k} auto key ${c.auto}`);
    }
    const walk = (n, where) => {
      if (n.cat) {
        ok(cats.has(n.cat), `${where}: unknown category ${n.cat}`);
        ok(pack.sources[n.src], `${where}: unknown source ${n.src}`);
        ok(n.at && n.why, `${where}: outcome needs at and why`);
        if (n.bioSrc) ok(pack.sources[n.bioSrc] && n.bioAt, `${where}: bioSrc`);
        return 1;
      }
      if (n.allOf) {
        ok(n.allOf.length && n.pass && n.fail, `${where}: allOf needs conditions, pass and fail`);
        for (const c of n.allOf) ok(pack.conditions?.[c], `${where}: unknown condition ${c}`);
        return walk(n.pass, `${where}/pass`) + walk(n.fail, `${where}/fail`);
      }
      ok(QUESTIONS[n.ask], `${where}: unknown question ${n.ask}`);
      const want = optionsFor(n.ask).map((o) => o.value).sort().join(',');
      ok(Object.keys(n.on).sort().join(',') === want, `${where}: branches of ${n.ask} must be ${want}`);
      return Object.entries(n.on).reduce((s, [k, c]) => s + walk(c, `${where}/${n.ask}=${k}`), 0);
    };
    const complete = pack.status !== 'superseded';
    let covered = 0;
    for (const ch of CHANGES) {
      const e = pack.entries[ch.id];
      if (complete) ok(e, `${tag}: no entry for ${ch.id}`);
      if (!e) continue;
      covered++;
      ok(walk(e.tree, `${tag}/${ch.id}`) >= 1, `${ch.id}: no outcome`);
      for (const ev of ch.evidence) ok(EVIDENCE[ev], `${ch.id}: unknown evidence ${ev}`);
    }
    if (!complete) ok(covered >= 40, `${tag}: transition edition should cover the common changes`);
    for (const k of Object.keys(pack.entries)) ok(CHANGES.some((c) => c.id === k), `${tag}: entry ${k} not in catalogue`);
    for (const [k, c] of Object.entries(pack.clocks)) ok(pack.sources[c.src], `${tag}: clock ${k} source`);
    for (const c of pack.categories) if (!['NONE', 'LETTER'].includes(c.id) && id === 'eu') ok(pack.ectd[c.id], `${tag}: no eCTD type for ${c.id}`);
  }
}
const eds = PACKS.eu;
ok(eds[0].appliesTo === eds[1].appliesFrom, 'EU editions meet on 15 January 2026');
console.log(`pack tests: ${checks} checks passed`);
