// From classified changes to filings: grouping, CTD impact, Module 1 documents, clocks,
// the cover letter and the eCTD submission type.
import { CHANGE, EVIDENCE, categoryOf, rankOf, sourceOf } from './packs.js';
import { classify, productAnswers, mostRestrictive } from './classify.js';

const KIND_ORDER = { admin: 0, cmc: 1, labeling: 2, efficacy: 3 };

export const answersFor = (product, change) => ({ ...productAnswers(product), ...(change.answers ?? {}) });

export function resultsFor(pack, product, kase) {
  return kase.changes.map((c) => ({ change: c, def: CHANGE[c.changeId], result: classify(pack, c.changeId, answersFor(product, c)) }));
}

// Group the case's changes into filings. Related changes go together in the most
// restrictive category; unrelated ones are filed on their own, except that annual report
// items share the annual report and letters share one letter.
export function filingsFor(pack, product, kase) {
  const rows = resultsFor(pack, product, kase);
  const done = rows.filter((r) => r.result.status === 'done');
  const pending = rows.filter((r) => r.result.status !== 'done');
  const filings = [];
  const make = (items, category) => ({
    id: `f${filings.length + 1}`,
    category,
    kind: items.map((i) => i.def.kind).sort((a, b) => KIND_ORDER[b] - KIND_ORDER[a])[0] ?? 'cmc',
    items,
  });
  if (kase.related && done.length > 1) {
    filings.push(make(done, mostRestrictive(pack, done.map((d) => d.result.category))));
  } else {
    const ar = done.filter((d) => d.result.category === 'AR');
    const letters = done.filter((d) => d.result.category === 'LETTER');
    for (const d of done.filter((x) => !['AR', 'LETTER'].includes(x.result.category))) filings.push(make([d], d.result.category));
    if (ar.length) filings.push(make(ar, 'AR'));
    if (letters.length) filings.push(make(letters, 'LETTER'));
  }
  filings.sort((a, b) => rankOf(pack, b.category) - rankOf(pack, a.category));
  filings.forEach((f, i) => { f.id = `f${i + 1}`; });
  return { filings, pending, rows };
}

export function ectdFor(pack, filing) {
  if (filing.category === 'AR' || filing.category === 'LETTER') return pack.ectd[filing.category];
  return pack.ectd[filing.kind] ?? pack.ectd.cmc;
}

export function m1For(pack, filing) {
  const ids = filing.items.map((i) => i.change.changeId);
  if (filing.category === 'LETTER') return pack.m1.letter.filter((d) => !d.change || ids.includes(d.change));
  if (filing.category === 'AR') {
    const kinds = new Set(filing.items.map((i) => (i.def.kind === 'cmc' ? 'cmc' : 'labeling')));
    return pack.m1.annual.filter((d) => !d.kind || kinds.has(d.kind));
  }
  const out = [...pack.m1.supplement];
  if (['labeling', 'efficacy'].includes(filing.kind) || filing.items.some((i) => ['labeling', 'efficacy'].includes(i.def.kind))) out.push(...pack.m1.labeling);
  if (ids.includes('lab-rld-update')) out.push(...pack.m1.rld);
  return out;
}

// CTD order: Module 1 to 5; within Module 3, S before P before A before R.
const LETTER_RANK = { S: 1, P: 2, A: 3, R: 4 };
export function cmpCode(a, b) {
  const pa = a.split('.'); const pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] == null) return -1;
    if (pb[i] == null) return 1;
    const na = /^\d+$/.test(pa[i]) ? Number(pa[i]) : (LETTER_RANK[pa[i]] ?? 9) + 0.5;
    const nb = /^\d+$/.test(pb[i]) ? Number(pb[i]) : (LETTER_RANK[pb[i]] ?? 9) + 0.5;
    if (na !== nb) return na - nb;
  }
  return 0;
}

// Sections a filing touches: the Module 1 documents plus the evidence for each change.
export function impactFor(pack, filing) {
  const map = new Map();
  const add = (code, label, op, why) => {
    const e = map.get(code) ?? { code, label, op, why: [] };
    if (why && !e.why.includes(why)) e.why.push(why);
    map.set(code, e);
  };
  for (const d of m1For(pack, filing)) add(d.code, d.label, 'new', 'Regional Module 1');
  for (const it of filing.items) for (const id of it.def.evidence ?? []) {
    const ev = EVIDENCE[id];
    if (ev) add(ev.ctd, ev.label, ev.op, it.def.title);
  }
  return [...map.values()].sort((a, b) => cmpCode(a.code, b.code));
}

// Every CTD section any change in the catalogue can touch (used for missions' distractors).
export function allEvidenceCodes() {
  return [...new Set(Object.values(EVIDENCE).map((e) => e.ctd))].sort(cmpCode);
}

// ---------- dates ----------
const D = (s) => new Date(`${s}T00:00:00Z`);
export const iso = (d) => d.toISOString().slice(0, 10);
export function addDays(s, n) { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
export function addMonths(s, n) {
  const d = D(s); const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return iso(d);
}
// The annual report due date that covers a change made on `when`: the reporting year runs to
// the anniversary of approval, and the report is due within 60 days after it.
export function annualReportDue(approvalDate, when) {
  const a = D(approvalDate); const w = D(when);
  let year = w.getUTCFullYear();
  let anniv = new Date(Date.UTC(year, a.getUTCMonth(), a.getUTCDate()));
  if (anniv < w) anniv = new Date(Date.UTC(year + 1, a.getUTCMonth(), a.getUTCDate()));
  return { anniversary: iso(anniv), due: addDays(iso(anniv), 60) };
}

export const appKey = (product) => (product.appType === 'anda' ? 'anda' : product.appType === 'bla' ? 'bla' : 'nda');

// Dates for one filing. Goal dates are user-fee performance goals, not legal deadlines.
export function timelineFor(pack, product, filing, opts = {}) {
  const submit = opts.submitDate || iso(new Date());
  const events = [];
  const notes = [];
  let earliestUse = null;
  const cat = filing.category;
  const has505 = filing.items.some((i) => i.result.clock === '505o4');
  if (has505 && opts.notificationDate) {
    const c = pack.clocks['505o4'];
    events.push({ date: opts.notificationDate, label: 'FDA safety labeling change notification received', kind: 'start' });
    events.push({ date: addDays(opts.notificationDate, c.days), label: 'Response due: supplement or rebuttal', kind: 'due', src: c.src });
  }
  if (cat === 'AR') {
    events.push({ date: submit, label: 'Change made (implemented)', kind: 'implement' });
    earliestUse = submit;
    if (product.approvalDate) {
      const r = annualReportDue(product.approvalDate, submit);
      events.push({ date: r.anniversary, label: 'Anniversary of approval: end of the reporting year', kind: 'milestone' });
      events.push({ date: r.due, label: 'Annual report due (within 60 days of the anniversary)', kind: 'due', src: pack.clocks.AR.src });
    }
  } else if (cat === 'LETTER') {
    events.push({ date: submit, label: 'Letter sent to FDA', kind: 'submit' });
    earliestUse = submit;
  } else {
    events.push({ date: submit, label: `${categoryOf(pack, cat).label} received by FDA`, kind: 'submit' });
    if (cat === 'CBE0') { earliestUse = submit; events.push({ date: submit, label: 'Earliest distribution of product made with the change', kind: 'implement', src: pack.clocks.CBE0.src }); }
    if (cat === 'CBE30') { earliestUse = addDays(submit, 30); events.push({ date: earliestUse, label: 'Earliest distribution: 30 days after receipt, unless FDA objects', kind: 'implement', src: pack.clocks.CBE30.src }); }
    if (cat === 'PAS') {
      const key = `PAS:${filing.kind === 'admin' ? 'cmc' : filing.kind}:${appKey(product)}`;
      const c = pack.clocks[key];
      if (c) {
        const months = opts.priority && c.monthsPriority ? c.monthsPriority : opts.inspection && c.monthsInspection ? c.monthsInspection : c.months;
        earliestUse = addMonths(submit, months);
        events.push({ date: earliestUse, label: `Goal date (${months} months): ${c.label}`, kind: 'goal', src: c.src });
        notes.push('A goal date is a user-fee performance goal for FDA, not a legal deadline; the earliest use is on approval, which may come sooner or later.');
      } else {
        notes.push('No user-fee goal date is modelled for this kind of supplement. Product made with the change can be distributed only after approval.');
      }
    }
  }
  if (opts.plannedUse && earliestUse && opts.plannedUse < earliestUse) notes.push(`The planned date of use (${opts.plannedUse}) comes before the earliest date the rules allow (${earliestUse}).`);
  events.sort((a, b) => a.date.localeCompare(b.date));
  return { events, earliestUse, notes };
}

// ---------- cover letter ----------
export function coverLetter(pack, product, filing, kase) {
  const cat = categoryOf(pack, filing.category);
  const app = `${product.appType.toUpperCase()} ${product.applicationNumber}`;
  const at = `21 CFR ${product.facts?.bio && cat.bioAt ? cat.bioAt : cat.at}`;
  const today = kase.submitDate || iso(new Date());
  const lines = [];
  lines.push(`${product.holder.name}`, product.holder.address, '', today, '');
  lines.push('Food and Drug Administration (training letter; not for submission)', '');
  if (filing.category === 'AR') {
    lines.push(`Re: ${app}, ${product.brandName} (${product.inn}) - Annual report: manufacturing and labeling changes`, '');
    lines.push(`${product.holder.name} reports the following changes, made since the last annual report, under ${at}:`);
  } else if (filing.category === 'LETTER') {
    lines.push(`Re: ${app}, ${product.brandName} (${product.inn}) - Notification`, '');
    lines.push(`${product.holder.name} notifies FDA of the following:`);
  } else {
    const kindWord = filing.kind === 'efficacy' ? 'Efficacy supplement' : filing.kind === 'labeling' ? 'Labeling supplement' : 'Chemistry, manufacturing and controls supplement';
    lines.push(`Re: ${app}, ${product.brandName} (${product.inn})`);
    lines.push(`${kindWord.toUpperCase()}: ${cat.label.toUpperCase()}`, '');
    lines.push(`${product.holder.name} submits this ${cat.label.toLowerCase()} under ${at} for the change${filing.items.length > 1 ? 's' : ''} below.`);
    if (filing.items.length > 1) lines.push(`The changes are related and are filed together in the most restrictive category of the individual changes (${pack.multipleChanges.src === 'g04' ? 'guidance section XII' : pack.multipleChanges.at}).`);
  }
  lines.push('');
  filing.items.forEach((it, i) => {
    const o = it.result.outcome;
    lines.push(`${i + 1}. ${it.def.title}${it.change.note ? `: ${it.change.note}` : ''}`);
    lines.push(`   Category: ${categoryOf(pack, it.result.category).label} (${sourceOf(pack, o.src).title}, ${o.at}).`);
  });
  lines.push('');
  if (filing.category === 'CBE30') lines.push('We intend to distribute product made with these changes 30 days after FDA receives this supplement, unless FDA informs us otherwise.');
  if (filing.category === 'CBE0') lines.push('Product made with these changes will be distributed on FDA\'s receipt of this supplement.');
  if (filing.category === 'PAS') lines.push('Product made with these changes will not be distributed until FDA approves this supplement.');
  lines.push('', `Contact: ${product.holder.contact}`, '', `Sincerely,`, product.holder.contact.split(',')[0], '', 'Training material. Fictional company and product.');
  return lines.join('\n');
}
