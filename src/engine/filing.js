// From classified changes to filings: grouping, worksharing, CTD impact, Module 1 documents,
// clocks, the cover letter and the eCTD submission type. Region rules come from the pack.
import { CHANGE, EVIDENCE, categoryOf, rankOf, sourceOf, packFor, noFiling } from './packs.js';
import { classify, productAnswers, mostRestrictive } from './classify.js';

const KIND_ORDER = { admin: 0, cmc: 1, labeling: 2, efficacy: 3 };
const kindOf = (items) => items.map((i) => i.def.kind).sort((a, b) => KIND_ORDER[b] - KIND_ORDER[a])[0] ?? 'cmc';
export const isEU = (pack) => pack?.id === 'eu';
export const isIN = (pack) => pack?.id === 'in';
export const isEUlike = (pack) => pack?.id === 'eu' || pack?.id === 'ch';
export const isGeneric = (pack) => ['ca', 'ch', 'jp', 'who'].includes(pack?.id);

export const answersFor = (product, change) => ({ ...productAnswers(product), ...(change.answers ?? {}) });

// The pack edition a case uses in a region: US has one; the EU edition follows the case date
// (Type IB and II by submission date, Type IA by implementation date: both are the case date).
export const packForCase = (kase, region) => packFor(region, { date: kase.submitDate || undefined, draft: region === 'in' && !!kase.options?.inDraft });

export function resultsFor(pack, product, kase) {
  return kase.changes.map((c) => ({ change: c, def: CHANGE[c.changeId], result: classify(pack, c.changeId, answersFor(product, c)) }));
}

// Group the case's changes into filings.
// US: related changes go together in the most restrictive category; unrelated ones are filed
// on their own, except that annual report items share the annual report and letters one letter.
// EU: related variations form a group that follows its highest type; unrelated Type IA share the
// annual update and Type IA-IN one immediate notification; no-variation and other-procedure items
// are listed apart.
export function filingsFor(pack, product, kase) {
  const rows = resultsFor(pack, product, kase);
  const done = rows.filter((r) => r.result.status === 'done');
  const pending = rows.filter((r) => r.result.status !== 'done');
  const filings = [];
  const make = (items, category, extra = {}) => ({ id: '', category, kind: kindOf(items), items, mode: items.length > 1 ? 'grouping' : 'single', warnings: [], ...extra });
  const shared = pack.filing?.shared ?? [];
  const apart = pack.filing?.apart ?? [];
  const variations = done.filter((d) => !apart.includes(d.result.category));
  if (kase.related && variations.length > 1) {
    const f = make(variations, mostRestrictive(pack, variations.map((d) => d.result.category)));
    if (isEU(pack)) f.warnings = groupWarnings(variations, f.category);
    filings.push(f);
  } else {
    for (const d of variations.filter((x) => !shared.includes(x.result.category))) filings.push(make([d], d.result.category));
    for (const cat of shared) {
      const items = variations.filter((d) => d.result.category === cat);
      if (items.length) filings.push(make(items, cat, { mode: items.length > 1 ? 'single-notification' : 'single' }));
    }
  }
  // Items that need no filing, or another procedure, are listed apart.
  for (const cat of apart) {
    const items = done.filter((d) => d.result.category === cat);
    if (!items.length) continue;
    if (['OTHER', 'NA', 'OUT'].includes(cat)) for (const d of items) filings.push(make([d], cat, { mode: 'other' }));
    else filings.push(make(items, cat, { mode: 'none' }));
  }
  if (isIN(pack)) filings.forEach((f) => { f.importRoute = product.in?.route === 'import'; });
  if (isEU(pack)) {
    const also = (kase.alsoProducts ?? []).filter(Boolean);
    if (also.length) for (const f of filings) applyWorksharing(f, also);
  }
  if (pack.id === 'ch') for (const f of filings) {
    if (f.items.length > 1 && f.items.some((i) => i.def.kind === 'labeling' && /C\.3|C\.4/.test(i.result.outcome?.at ?? ''))) f.warnings.push('Safety-related variations cannot be part of a multiple application in Switzerland; file them on their own.');
    if (f.items.length > 1 && !noFiling(pack, f.category)) f.warnings.push('A multiple application is processed on the longest time limit, and all its variations are completed together.');
  }
  if (pack.id === 'who' && f0Grouping(filings)) for (const f of filings) if (f.items.length > 1 && f.category !== 'AN') f.warnings.push('WHO PQ allows grouping only for consequential changes, the same change to several FPPs, or annual notifications (FAQ Q4).');
  filings.sort((a, b) => rankOf(pack, b.category) - rankOf(pack, a.category));
  filings.forEach((f, i) => { f.id = `f${i + 1}`; });
  return { filings, pending, rows };
}

// EMA's Q&A on grouping lists groupings that are generally not accepted.
function groupWarnings(items, category) {
  const w = [];
  const kinds = new Set(items.map((i) => i.def.kind));
  if (kinds.has('cmc') && (kinds.has('labeling') || kinds.has('efficacy'))) w.push('Quality and clinical or labelling changes are generally not grouped unless one supports the other; justify the link or file them apart.');
  const ds = items.some((i) => /^(ds-|bio-)/.test(i.def.id));
  const dp = items.some((i) => i.def.kind === 'cmc' && !/^(ds-|bio-)/.test(i.def.id));
  if (ds && dp) w.push('Active substance and finished product changes are generally not grouped unless justified.');
  const agreedWording = items.some((i) => ['C.3(a)', 'C.3(b)'].includes(i.result.outcome?.at));
  if (agreedWording && category === 'II') w.push('Implementing agreed safety wording should not wait for a Type II: grouping it would delay implementation.');
  if (items.some((i) => i.result.category === 'EXT')) w.push('A group with an extension follows the extension timetable and cannot be worksharing.');
  w.push('Groups need a case listed in Annex III of the Regulation or the authority\'s agreement (EMA recommends asking at least 2 months ahead).');
  return w;
}

const f0Grouping = (filings) => filings.some((f) => f.items.length > 1);

function applyWorksharing(f, also) {
  if (['NONE', 'OTHER'].includes(f.category)) return;
  f.alsoProducts = also;
  if (f.category === 'EXT') { f.warnings.push('Extensions cannot be submitted through worksharing.'); return; }
  if (['IA', 'IAIN'].includes(f.category)) {
    f.mode = 'super-grouping';
    f.warnings.push('Super-grouping (Article 7a): the same Type IA or IA-IN change for several authorisations of the same holder in one notification. Not possible when it mixes centralised and non-centralised products.');
  } else {
    f.mode = 'worksharing';
    f.warnings.push('Worksharing (Article 20): one assessment by a reference authority for the same change in several authorisations of the same holder. EMA is the reference authority when a centrally authorised product is included.');
  }
}

export function ectdFor(pack, filing, product = null) {
  if (isGeneric(pack)) {
    let base = pack.ectd?.[filing.category] ?? null;
    if (!base) return null;
    if (pack.id === 'ca' && base.submissionType === 'snds' && product?.appType === 'anda') base = { ...base, submissionType: 'sands' };
    if (pack.id === 'ch') {
      const submissionMode = filing.items.length > 1 ? 'grouping' : 'single';
      return { ...base, submissionMode };
    }
    return base;
  }
  if (isIN(pack)) {
    if (filing.category === 'NEWDRUG') return { submissionType: filing.importRoute ? 'new-drug-import' : 'new-drug-manufacture', subType: 'application' };
    return pack.ectd[filing.category] ?? pack.ectd.CDSCO;
  }
  if (isEU(pack)) {
    const base = pack.ectd[filing.category] ?? pack.ectd.II;
    const submissionMode = filing.mode === 'worksharing' ? 'worksharing' : ['grouping', 'super-grouping', 'single-notification'].includes(filing.mode) && filing.items.length > 1 ? 'grouping' : 'single';
    return { ...base, submissionMode };
  }
  if (noFiling(pack, filing.category)) return null;
  if (['AR', 'LETTER', 'NEW'].includes(filing.category)) return pack.ectd[filing.category];
  return pack.ectd[filing.kind] ?? pack.ectd.cmc;
}

export const changesProductInfo = (filing) => filing.items.some((i) => i.result.outcome?.pi || ['labeling', 'efficacy'].includes(i.def.kind));

export function m1For(pack, filing) {
  const ids = filing.items.map((i) => i.change.changeId);
  if (isGeneric(pack)) {
    const sets = pack.m1map?.[filing.category] ?? [];
    const out = sets.flatMap((s) => pack.m1[s] ?? []);
    if (sets.length && changesProductInfo(filing) && pack.m1.pi) out.push(...pack.m1.pi);
    return out.filter((d, i, a) => a.findIndex((x) => x.code === d.code) === i);
  }
  if (isIN(pack)) {
    if (filing.category === 'REC') return [];
    if (filing.category === 'L3') return pack.m1.annual;
    if (filing.category === 'NEWDRUG') return [...pack.m1.newdrug, ...(changesProductInfo(filing) ? pack.m1.pi : [])];
    return [...pack.m1.pac, ...(filing.importRoute ? pack.m1.import : []), ...(changesProductInfo(filing) ? pack.m1.pi : [])];
  }
  if (isEU(pack)) {
    if (filing.category === 'NONE') return [];
    if (filing.category === 'OTHER') return pack.m1.other;
    const out = filing.category === 'EXT' ? [...pack.m1.extension] : [...pack.m1.variation];
    if (changesProductInfo(filing)) out.push(...pack.m1.pi);
    return out;
  }
  if (noFiling(pack, filing.category)) return [];
  if (filing.category === 'NEW') return [...pack.m1.new, ...pack.m1.labeling];
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

// CTD order: Module 1 to 5; within Module 3, S before P before A before R. Regional prefixes
// such as "eu:" are ignored for sorting.
const LETTER_RANK = { S: 1, P: 2, A: 3, R: 4 };
export const displayCode = (code) => code.replace(/^[a-z]+:/, '');
export function cmpCode(a, b) {
  const pa = displayCode(a).split('.'); const pb = displayCode(b).split('.');
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
  if (noFiling(pack, filing.category)) return m1For(pack, filing).map((d) => ({ code: d.code, label: d.label, op: 'new', why: ['Regional Module 1'] }));
  const map = new Map();
  const add = (code, label, op, why) => {
    const e = map.get(code) ?? { code, label, op, why: [] };
    if (why && !e.why.includes(why)) e.why.push(why);
    map.set(code, e);
  };
  for (const d of m1For(pack, filing)) add(d.code, d.label, ['eu:1.3.1', 'ca:1.3.1', 'ch:1.3.1', 'jp:1.8', 'who:1.3', 'who:QIS'].includes(d.code) ? 'replace' : 'new', 'Regional Module 1');
  for (const it of filing.items) for (const id of it.def.evidence ?? []) {
    const ev = EVIDENCE[id];
    if (ev) add(ev.ctd, ev.label, ev.op, it.def.title);
  }
  return [...map.values()].sort((a, b) => cmpCode(a.code, b.code));
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
  const year = w.getUTCFullYear();
  let anniv = new Date(Date.UTC(year, a.getUTCMonth(), a.getUTCDate()));
  if (anniv < w) anniv = new Date(Date.UTC(year + 1, a.getUTCMonth(), a.getUTCDate()));
  return { anniversary: iso(anniv), due: addDays(iso(anniv), 60) };
}

export const appKey = (product) => (product.appType === 'anda' ? 'anda' : product.appType === 'bla' ? 'bla' : 'nda');

// Dates for one filing. US goal dates are user-fee goals, not legal deadlines; EU clocks leave
// out validation and fixed start dates, and add any clock stop the learner enters.
export function timelineFor(pack, product, filing, opts = {}) {
  if (isGeneric(pack)) return timelineGeneric(pack, product, filing, opts);
  if (isIN(pack)) return timelineIN(pack, product, filing, opts);
  return isEU(pack) ? timelineEU(pack, product, filing, opts) : timelineUS(pack, product, filing, opts);
}

export function addWorkingDays(s, n) {
  const d = D(s);
  let left = n;
  while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) left -= 1; }
  return iso(d);
}

function timelineIN(pack, product, filing, opts) {
  const d0 = opts.submitDate || iso(new Date());
  const events = [];
  const notes = [];
  let earliestUse = null;
  const cat = filing.category;
  if (cat === 'REC') {
    events.push({ date: d0, label: 'Change made and recorded under GMP (no submission)', kind: 'implement' });
    return finish(events, d0, notes, opts);
  }
  if (cat === 'L3') {
    events.push({ date: d0, label: 'Change implemented', kind: 'implement' });
    earliestUse = d0;
    const due = `${Number(d0.slice(0, 4)) + 1}-03-31`;
    events.push({ date: due, label: 'Annual notification due: end of the first quarter of the next calendar year', kind: 'due', src: pack.clocks.L3.src });
    notes.push('If CDSCO asks for the supporting data, it is due within 30 days.');
    return finish(events, earliestUse, notes, opts);
  }
  events.push({ date: d0, label: cat === 'NEWDRUG' ? `Application in Form ${filing.importRoute ? 'CT-18' : 'CT-21'} submitted on SUGAM` : 'Post-approval change application submitted on SUGAM', kind: 'submit' });
  if (cat === 'ADMIN') {
    earliestUse = addDays(d0, 30);
    events.push({ date: earliestUse, label: 'About 30 days: typical review of an administrative change', kind: 'goal', src: pack.clocks.ADMIN.src });
  } else if (cat === 'NEWDRUG') {
    earliestUse = addWorkingDays(d0, 90);
    events.push({ date: earliestUse, label: 'Decision due within 90 working days', kind: 'goal', src: pack.clocks.NEWDRUG.src });
  } else {
    notes.push('The rules set no fixed review time for this application; implement only after CDSCO approves.');
  }
  if (pack.draft) notes.push('Draft rules: timings may change when the rules are final.');
  return finish(events, earliestUse, notes, opts);
}

function finish(events, earliestUse, notes, opts) {
  if (opts.plannedUse && earliestUse && opts.plannedUse < earliestUse) notes.push(`The planned date of use (${opts.plannedUse}) comes before the earliest date the rules allow (${earliestUse}).`);
  events.sort((a, b) => a.date.localeCompare(b.date));
  return { events, earliestUse, notes };
}

function timelineUS(pack, product, filing, opts) {
  const submit = opts.submitDate || iso(new Date());
  const events = [];
  const notes = [];
  let earliestUse = null;
  const cat = filing.category;
  const has505 = filing.items.some((i) => i.result.clock === '505o4');
  if (noFiling(pack, cat)) {
    events.push({ date: submit, label: 'Change made under CGMP and the quality system (no report)', kind: 'implement' });
    return finish(events, submit, notes, opts);
  }
  if (cat === 'NEW') {
    const c = pack.clocks.NEW;
    events.push({ date: submit, label: 'New application received by FDA', kind: 'submit' });
    const months = opts.priority && c.monthsPriority ? c.monthsPriority : c.months;
    earliestUse = addMonths(submit, months);
    events.push({ date: earliestUse, label: `Goal date (${months} months): ${c.label}`, kind: 'goal', src: c.src });
    notes.push('A goal date is a user-fee performance goal, not a legal deadline. New molecular entities add a 60-day filing period under the PDUFA program.');
    return finish(events, earliestUse, notes, opts);
  }
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
  return finish(events, earliestUse, notes, opts);
}

function timelineEU(pack, product, filing, opts) {
  const d0 = opts.submitDate || iso(new Date());
  const events = [];
  const notes = [];
  let earliestUse = null;
  const cat = filing.category;
  const stop = Number(opts.clockStop) || 0;
  const authority = euAuthority(product);
  if (cat === 'NONE') {
    events.push({ date: d0, label: 'Change made under the quality system (no submission)', kind: 'implement' });
    return finish(events, d0, notes, opts);
  }
  if (cat === 'OTHER') {
    events.push({ date: d0, label: 'Submit through the procedure named in the result', kind: 'submit' });
    notes.push('The timing depends on that procedure; it is not modelled here.');
    return finish(events, null, notes, opts);
  }
  if (cat === 'IA' || cat === 'IAIN') {
    events.push({ date: d0, label: 'Change implemented', kind: 'implement' });
    earliestUse = d0;
    const notify = cat === 'IA' ? addMonths(d0, 12) : d0;
    events.push({ date: notify, label: cat === 'IA' ? 'Latest date to notify: within 12 months of implementation (annual update)' : 'Notify immediately after implementation', kind: 'due', src: pack.clocks[cat].src });
    events.push({ date: addDays(notify, 30), label: `${authority} completes its check within 30 days of the notification`, kind: 'milestone' });
    if (cat === 'IA') notes.push('Type IA changes can be collected in one annual update, due within 12 months of the first change implemented.');
    notes.push('If the authority rejects a Type IA or IA-IN, the holder must stop applying the change at once.');
    return finish(events, earliestUse, notes, opts);
  }
  if (cat === 'IB') {
    events.push({ date: d0, label: `Type IB notification sent to ${authority}`, kind: 'submit' });
    earliestUse = addDays(d0, 30);
    events.push({ date: earliestUse, label: 'Accepted if no objection within 30 days of a valid notification: earliest implementation', kind: 'implement', src: pack.clocks.IB.src });
    notes.push('The 30 days run from the acknowledgement of a valid notification; validation time is not included.');
    return finish(events, earliestUse, notes, opts);
  }
  const c = pack.clocks[cat === 'EXT' ? 'EXT' : 'II'];
  const days = cat === 'EXT' ? c.days : filing.kind === 'efficacy' ? c.daysEfficacy : c.days;
  events.push({ date: d0, label: `${categoryOf(pack, cat).label} application submitted to ${authority}`, kind: 'submit' });
  if (stop) notes.push(`Includes a clock stop of ${stop} days for responses.`);
  const opinion = addDays(d0, days + stop);
  events.push({ date: opinion, label: `${days}-day evaluation ends${stop ? ` (plus ${stop}-day clock stop)` : ''}: opinion or outcome`, kind: cat === 'EXT' ? 'milestone' : 'goal', src: c.src });
  const pi = changesProductInfo(filing);
  if (cat === 'EXT' || pi) {
    earliestUse = addDays(opinion, c.decisionDays);
    events.push({ date: earliestUse, label: euRoute(product) === 'centralised' ? 'Commission decision amending the authorisation: implement then' : 'National decisions amending the authorisations: implement then', kind: 'implement' });
  } else {
    earliestUse = opinion;
    events.push({ date: opinion, label: 'Quality-only change: may be implemented once the positive opinion or outcome is received', kind: 'implement' });
  }
  notes.push('EMA and national authorities start procedures on set dates, so real timetables run a little longer.');
  return finish(events, earliestUse, notes, opts);
}

export const euRoute = (product) => product.eu?.route ?? 'centralised';
export function euAuthority(product) {
  const r = euRoute(product);
  if (r === 'centralised') return 'EMA';
  if (r === 'national') return product.eu?.authority ?? 'the national authority';
  return `the reference member state (${product.eu?.rms ?? 'RMS'})`;
}

// ---------- cover letter ----------
export function coverLetter(pack, product, filing, kase) {
  if (isGeneric(pack)) return coverLetterGeneric(pack, product, filing, kase);
  if (isIN(pack)) return coverLetterIN(pack, product, filing, kase);
  return isEU(pack) ? coverLetterEU(pack, product, filing, kase) : coverLetterUS(pack, product, filing, kase);
}

function coverLetterIN(pack, product, filing, kase) {
  const cat = categoryOf(pack, filing.category);
  const today = kase.submitDate || iso(new Date());
  const who = product.in?.agent ? `${product.in.agent}, authorised agent of ${product.holder.name}` : product.holder.name;
  const lines = [who, '', today, '', 'To: The Drugs Controller General (India), Central Drugs Standard Control Organisation (training letter; not for submission)', ''];
  if (filing.category === 'REC') return [...lines, 'No submission is needed; the changes are recorded under GMP and mentioned in the next submission.', '', 'Training material. Fictional company and product.'].join('\n');
  lines.push(`Subject: ${filing.category === 'L3' ? 'Annual notification of minor changes' : filing.category === 'NEWDRUG' ? `Application for permission (Form ${filing.importRoute ? 'CT-18' : 'CT-21'})` : 'Post-approval change application'} for ${product.brandName} (${product.inn}), permission ${product.in?.permission ?? '[number]'}`);
  lines.push(`Category: ${cat.label}`, '');
  lines.push('We submit the following change(s) with the supporting documents on SUGAM:');
  filing.items.forEach((it, i) => lines.push(`${i + 1}. ${it.def.title}${it.change.note ? `: ${it.change.note}` : ''} (${categoryOf(pack, it.result.category).label}; ${it.result.outcome.at})`));
  lines.push('');
  if (filing.importRoute && filing.category !== 'L3') lines.push('The approval of the change by the regulator of the country of origin and the list of countries where it is approved are enclosed.');
  if (['L1', 'L2', 'L3SL', 'CDSCO', 'ADMIN'].includes(filing.category)) lines.push('The change will not be implemented for commercial supply until CDSCO approves it.');
  if (filing.category === 'L3') lines.push('These changes have been implemented; supporting data will be provided within 30 days if requested.');
  lines.push('', 'Training material. Fictional company and product.');
  return lines.join('\n');
}

function coverLetterUS(pack, product, filing, kase) {
  const cat = categoryOf(pack, filing.category);
  if (noFiling(pack, filing.category)) return [product.holder.name, '', 'No submission is needed for these changes; they are managed under CGMP and the quality system.', '', 'Training material. Fictional company and product.'].join('\n');
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
    if (filing.items.length > 1) lines.push('The changes are related and are filed together in the most restrictive category of the individual changes (guidance section XII).');
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
  lines.push('', `Contact: ${product.holder.contact}`, '', 'Sincerely,', product.holder.contact.split(',')[0], '', 'Training material. Fictional company and product.');
  return lines.join('\n');
}

function coverLetterEU(pack, product, filing, kase) {
  const cat = categoryOf(pack, filing.category);
  const today = kase.submitDate || iso(new Date());
  const holder = product.eu?.holder ?? product.holder;
  const authority = euAuthority(product);
  const ma = product.eu?.maNumber ?? '[authorisation number]';
  const mode = { grouping: 'a grouped application', 'single-notification': 'a single notification', 'super-grouping': 'a super-grouped notification (Article 7a)', worksharing: 'a worksharing application (Article 20)' }[filing.mode] ?? 'an application';
  const lines = [holder.name, holder.address, '', today, '', `To: ${authority} (training letter; not for submission)`, ''];
  if (filing.category === 'NONE') return [...lines, 'No submission is needed for these changes; they are recorded in the quality system.', '', 'Training material. Fictional company and product.'].join('\n');
  lines.push(`Re: ${product.brandName} (${product.inn}), ${ma}`);
  lines.push(`${cat.label.toUpperCase()}${filing.items.length > 1 ? ' - GROUP OF VARIATIONS' : ''}`, '');
  lines.push(`${holder.name} submits ${mode} for the variation${filing.items.length > 1 ? 's' : ''} below, under Commission Regulation (EC) No 1234/2008 as amended.`);
  if (filing.alsoProducts?.length) lines.push(`The same change is submitted for ${filing.alsoProducts.length} other authorisation(s) of the holder.`);
  lines.push('');
  filing.items.forEach((it, i) => {
    const o = it.result.outcome;
    lines.push(`${i + 1}. ${o.at} - ${it.def.title}${it.change.note ? `: ${it.change.note}` : ''} (${categoryOf(pack, it.result.category).label})`);
  });
  lines.push('');
  if (['IA', 'IAIN'].includes(filing.category)) lines.push('We confirm that all the conditions in the classification guidelines are met and that the required documentation is provided. The change has been implemented.');
  if (filing.category === 'IB') lines.push('We will implement the change(s) only after the 30-day period, if no objection is raised.');
  if (filing.category === 'II') lines.push('We will implement the change(s) only after a positive outcome.');
  if (changesProductInfo(filing)) lines.push('Revised product information is provided in Module 1.3.1.');
  lines.push('', `Contact: ${holder.contact}`, '', 'Training material. Fictional company and product.');
  return lines.join('\n');
}

// ---------- Canada, Switzerland, Japan, WHO PQ: driven by the pack's clocks ----------
export const AUTHORITY = {
  ca: (p) => (p.facts?.bio ? 'Health Canada, Biologic and Radiopharmaceutical Drugs Directorate' : 'Health Canada, Pharmaceutical Drugs Directorate'),
  ch: () => 'Swissmedic',
  jp: () => 'the Ministry of Health, Labour and Welfare and PMDA',
  who: () => 'WHO Prequalification Unit (PQT)',
};
export const authorityFor = (pack, product) => (AUTHORITY[pack.id] ? AUTHORITY[pack.id](product) : pack.label);

function timelineGeneric(pack, product, filing, opts) {
  const d0 = opts.submitDate || iso(new Date());
  const events = [];
  const notes = [];
  let earliestUse = null;
  const cat = filing.category;
  const c = pack.clocks?.[cat] ?? {};
  const def = categoryOf(pack, cat);
  const who = authorityFor(pack, product);
  const stop = Number(opts.clockStop) || 0;
  const bio = !!product.facts?.bio;
  if (noFiling(pack, cat)) {
    if (['OTHER', 'NA', 'OUT'].includes(cat)) {
      events.push({ date: d0, label: 'Follow the procedure or entry named in the result', kind: 'submit' });
      notes.push('The timing depends on that procedure; it is not modelled here.');
      return finish(events, null, notes, opts);
    }
    events.push({ date: d0, label: 'Change made under the quality system (no submission)', kind: 'implement' });
    return finish(events, d0, notes, opts);
  }
  if (def?.implement === 'do-and-tell') {
    events.push({ date: d0, label: 'Change implemented', kind: 'implement' });
    earliestUse = d0;
    if (pack.id === 'ca' && cat === 'L3') {
      const due = bio ? addMonths(d0, 12) : d0;
      events.push({ date: due, label: bio ? 'Level III notice due within 12 months of implementation (biologics)' : 'File the Level III form at implementation (recommended for pharmaceutical quality changes)', kind: 'due', src: c.src });
      if (!bio) notes.push('Pharmaceutical Level III changes may instead be filed in the annual notification; Health Canada recommends filing at implementation.');
      notes.push('If Health Canada asks for the supporting data, they are due within 30 days.');
    } else if (pack.id === 'ca' && cat === 'L3IN') {
      events.push({ date: addDays(d0, -c.daysBefore), label: 'Earliest date to notify (21 days before implementation)', kind: 'milestone', src: c.src });
      events.push({ date: addDays(d0, c.daysAfter), label: 'Latest date to notify (14 days after implementation)', kind: 'due', src: c.src });
    } else if (c.ackDays && c.reviewDays) {
      events.push({ date: d0, label: `Notify ${who} immediately`, kind: 'due', src: c.src });
      events.push({ date: addDays(d0, c.ackDays + c.reviewDays), label: `Accepted unless ${who} objects (${c.ackDays} days to acknowledge, ${c.reviewDays} days to review)`, kind: 'milestone', src: c.src });
    } else {
      const due = c.months ? addMonths(d0, c.months) : addDays(d0, c.daysAfter ?? 0);
      events.push({ date: due, label: c.label, kind: 'due', src: c.src });
      if (c.reviewDays) events.push({ date: addDays(due, c.reviewDays), label: `${who} accepts tacitly if it does not object within ${c.reviewDays} days of the notification`, kind: 'milestone' });
      if (c.ackDays) events.push({ date: addDays(due, c.ackDays), label: `${who} acknowledges within ${c.ackDays} days`, kind: 'milestone' });
    }
    if (pack.id === 'ch' && cat === 'IA') notes.push('Type IA changes can be collected and notified together within the year.');
    return finish(events, earliestUse, notes, opts);
  }
  events.push({ date: d0, label: `${def?.label ?? cat} submitted to ${who}`, kind: 'submit' });
  if (def?.implement === 'tell-and-do') {
    earliestUse = d0;
    events.push({ date: d0, label: c.label ?? 'Implement once notified', kind: 'implement', src: c.src });
    return finish(events, earliestUse, notes, opts);
  }
  if (c.workingDays) {
    earliestUse = addWorkingDays(d0, c.workingDays);
    events.push({ date: earliestUse, label: c.approx ? `About ${c.workingDays} working days: ${c.label}` : c.label, kind: def?.implement === 'tell-and-wait' ? 'implement' : 'goal', src: c.src });
    if (c.approx) notes.push('An approximate date for training: the trial sets no fixed review time.');
    notes.push('Working days skip weekends only; Japanese public holidays are not counted here.');
    return finish(events, earliestUse, notes, opts);
  }
  let days = null; let months = null;
  if (c.ackDays && c.reviewDays) days = c.ackDays + c.reviewDays;
  else if (c.daysByKind) days = c.daysByKind[filing.kind] ?? c.daysByKind.cmc;
  else if (c.monthsByKind) months = (opts.priority && c.monthsPriority && filing.kind === 'efficacy') ? c.monthsPriority : bio && filing.kind === 'cmc' && c.monthsBio ? c.monthsBio : (c.monthsByKind[filing.kind] ?? c.monthsByKind.cmc);
  else if (c.days) days = pack.id === 'ch' && cat === 'II' && filing.items.every((i) => /C\.3/.test(i.result.outcome?.at ?? '')) && c.daysSafety ? c.daysSafety : c.days;
  else if (c.months) months = opts.priority && c.monthsPriority ? c.monthsPriority : c.months;
  if (days == null && months == null) {
    notes.push(c.label ?? 'No fixed timing is modelled for this procedure.');
    return finish(events, null, notes, opts);
  }
  const waitOnly = def?.implement === 'tell-and-wait';
  const end = days != null ? addDays(d0, days + (waitOnly ? 0 : stop)) : addDays(addMonths(d0, months), waitOnly ? 0 : stop);
  earliestUse = end;
  const span = days != null ? `${days} days` : `${months} months`;
  events.push({ date: end, label: waitOnly ? `${span}: ${c.label}` : `${span}${stop && !waitOnly ? ` plus a ${stop}-day clock stop` : ''}: ${c.label}`, kind: waitOnly ? 'implement' : 'goal', src: c.src });
  if (!waitOnly) notes.push('Review targets and time limits are goals or maxima, not guaranteed dates; implement only after approval.');
  if (stop && !waitOnly) notes.push(`Includes a clock stop of ${stop} days for responses.`);
  return finish(events, earliestUse, notes, opts);
}

const PRODUCT_REF = {
  ca: (p) => `DIN ${p.ca?.din ?? '[DIN]'}`,
  ch: (p) => `Swissmedic authorisation No. ${p.ch?.authNumber ?? '[number]'}`,
  jp: (p) => `approval No. ${p.jp?.approvalNumber ?? '[number]'}`,
  who: (p) => `WHO PQ reference ${p.who?.pqRef ?? '[reference]'}`,
};
const HOLDER = { ca: (p) => p.ca?.holder, ch: (p) => p.ch?.holder, jp: (p) => p.jp?.holder, who: (p) => p.who?.holder };

function coverLetterGeneric(pack, product, filing, kase) {
  const cat = categoryOf(pack, filing.category);
  const today = kase.submitDate || iso(new Date());
  const holder = HOLDER[pack.id]?.(product) ?? product.holder;
  const who = authorityFor(pack, product);
  const lines = [holder.name, holder.address, '', today, '', `To: ${who} (training letter; not for submission)`, ''];
  if (noFiling(pack, filing.category)) return [...lines, 'No submission is needed for these changes; they are managed and recorded in the quality system, or follow the procedure named in the result.', '', 'Training material. Fictional company and product.'].join('\n');
  lines.push(`Re: ${product.brandName} (${product.inn}), ${PRODUCT_REF[pack.id]?.(product) ?? ''}`.trim());
  lines.push(`${cat.label.toUpperCase()}${filing.items.length > 1 ? ' - SEVERAL CHANGES' : ''}`, '');
  lines.push(`${holder.name} submits the following change${filing.items.length > 1 ? 's' : ''}:`);
  lines.push('');
  filing.items.forEach((it, i) => {
    const o = it.result.outcome;
    lines.push(`${i + 1}. ${it.def.title}${it.change.note ? `: ${it.change.note}` : ''} (${categoryOf(pack, it.result.category).label}; ${sourceOf(pack, o.src).title.split(':')[0]}, ${o.at})`);
  });
  lines.push('');
  const imp = cat.implement;
  if (imp === 'do-and-tell') lines.push(`The change${filing.items.length > 1 ? 's have' : ' has'} been implemented on ${today}. Supporting data are available on request.`);
  if (imp === 'tell-and-do') lines.push('We notify the revised information; it applies from the date of this notification.');
  if (imp === 'tell-and-wait') lines.push(`We will implement the change${filing.items.length > 1 ? 's' : ''} only after the waiting period, unless ${who} objects.`);
  if (imp === 'wait-for-approval') lines.push(`We will implement the change${filing.items.length > 1 ? 's' : ''} only after approval.`);
  if (changesProductInfo(filing)) lines.push('Revised product information is enclosed (clean and with changes marked).');
  if (pack.id === 'jp') lines.push('A comparison of the current and proposed approval form entries is enclosed.');
  if (pack.id === 'who') lines.push('The quality information summary is updated where affected (tracked and clean versions).');
  lines.push('', `Contact: ${holder.contact}`, '', 'Training material. Fictional company and product.');
  return lines.join('\n');
}
