// PDFs made in the browser with pdf-lib: the completion certificate, a statement of progress
// and the classification report for a case. Loaded only when one is made. Every page says it
// is training material; the certificate says it is a portfolio exercise, not an accreditation.
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { verificationCode } from './certificate.js';
import { CHANGE, regionOf, categoryOf, sourceOf } from './packs.js';
import { classify } from './classify.js';
import { answersFor, filingsFor, timelineFor, impactFor, packForCase } from './filing.js';
import { displayCode } from './filing.js';
import { productRefs } from './model.js';

const INK = rgb(0.11, 0.14, 0.2);
const MUTED = rgb(0.38, 0.42, 0.48);
const ACCENT = rgb(0.153, 0.416, 0.231);
const WARN = rgb(0.6, 0.15, 0.15);
const A4 = [595.28, 841.89];
const A4L = [841.89, 595.28];

// The standard PDF fonts use WinAnsi encoding: map typographic characters and drop the rest.
const MAP = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '→': '->', '≥': '>=', '≤': '<=', '…': '...', ' ': ' ', '•': '-', '✕': 'x' };
export const clean = (s) => String(s ?? '').replace(/[‘’“”–—→≥≤… •✕]/g, (c) => MAP[c]).replace(/[^\x09\x0a\x0d\x20-\x7e¡-ÿ]/g, '?');

async function setup(title) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(title);
  pdf.setAuthor('Variations Classifier');
  pdf.setCreator('Variations Classifier (built by Khan Gulrez Shagufa Fazal Ahmed)');
  pdf.setSubject('Training material. Fictional products and companies.');
  return { pdf, font, bold };
}

const centre = (page, text, f, size, y, color = INK) => {
  const t = clean(text);
  page.drawText(t, { x: (page.getWidth() - f.widthOfTextAtSize(t, size)) / 2, y, size, font: f, color });
};

function wrap(text, f, size, width) {
  const out = [];
  for (const para of clean(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, size) <= width || !line) line = next;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

// A simple flowing writer for portrait pages, with a training watermark and footer on each page.
function writer(pdf, font, bold, { header, watermark = 'TRAINING - NOT FOR SUBMISSION' }) {
  const M = 50;
  let page; let y;
  const pages = [];
  const add = () => {
    page = pdf.addPage(A4);
    pages.push(page);
    const { width: W, height: H } = page.getSize();
    page.drawText(clean(watermark), { x: 90, y: 230, size: 46, font: bold, color: rgb(0.85, 0.87, 0.9), rotate: degrees(42), opacity: 0.55 });
    page.drawText(clean(header), { x: M, y: H - 34, size: 8.5, font, color: MUTED });
    y = H - 60;
  };
  add();
  const W = () => page.getWidth() - 2 * M;
  const need = (h) => { if (y - h < 60) add(); };
  const api = {
    text(str, { size = 10, f = font, color = INK, indent = 0, gap = 3 } = {}) {
      for (const line of wrap(str, f, size, W() - indent)) {
        need(size + gap);
        page.drawText(line, { x: M + indent, y: y - size, size, font: f, color });
        y -= size + gap;
      }
    },
    h(str, size = 13) { need(size + 18); y -= 8; api.text(str, { size, f: bold }); y -= 2; },
    space(n = 6) { y -= n; },
    rule() { need(10); page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + W(), y: y - 4 }, thickness: 0.5, color: rgb(0.8, 0.82, 0.86) }); y -= 10; },
    finish(footer) {
      pages.forEach((p, i) => {
        p.drawText(clean(`${footer} · page ${i + 1} of ${pages.length}`), { x: M, y: 30, size: 8, font, color: MUTED });
      });
    },
  };
  return api;
}

// ---------- certificate ----------
export async function certificatePdf({ name, userId, status, date = new Date().toISOString().slice(0, 10) }) {
  const { pdf, font, bold } = await setup('Variations Classifier - portfolio certificate');
  const page = pdf.addPage(A4L);
  const { width: W, height: H } = page.getSize();
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: ACCENT, borderWidth: 2 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: ACCENT, borderWidth: 0.5 });
  [[0.722, 0.196, 0.165], [0.498, 0.341, 0], [0.145, 0.365, 0.588], [0.153, 0.416, 0.231]].forEach((c, i) => {
    page.drawRectangle({ x: W / 2 - 40, y: H - 70 - i * 7, width: 80 - i * 18, height: 4, color: rgb(...c) });
  });
  centre(page, 'VARIATIONS CLASSIFIER', bold, 13, H - 112, ACCENT);
  centre(page, 'Certificate of completion', font, 30, H - 156);
  centre(page, 'This certifies that', font, 12, H - 194, MUTED);
  centre(page, name.trim(), font, 28, H - 232);
  [
    `completed every lesson, all ${status.missionScores.length} classification missions, a mixed quiz round and drills in ${status.drillRegions.length} regions`,
    'in the Variations Classifier, a browser-based practice tool for post-approval changes:',
    'reporting categories, conditions, filing plans and timelines for the US, EU, India, Canada, Switzerland, Japan and WHO PQ,',
    'with ICH Q12 lifecycle tools and ICH Q5E comparability.',
  ].forEach((t, i) => centre(page, t, font, 11, H - 270 - i * 16));
  if (status.distinction) centre(page, `With distinction: ${status.expertCount} missions scored 85 or more at expert level.`, bold, 11.5, H - 344, ACCENT);
  const code = verificationCode({ name, userId, status, date });
  page.drawText(clean(`Date: ${date}`), { x: 70, y: 120, size: 11, font, color: INK });
  page.drawText(clean(`Verification code: ${code}`), { x: 70, y: 102, size: 11, font, color: INK });
  page.drawText(clean(`Mixed quiz: ${status.quiz?.score ?? '-'}%`), { x: 70, y: 84, size: 11, font, color: INK });
  const r = 'Built by Khan Gulrez Shagufa Fazal Ahmed';
  page.drawText(r, { x: W - 70 - font.widthOfTextAtSize(r, 11), y: 102, size: 11, font, color: INK });
  centre(page, 'PORTFOLIO EXERCISE. NOT AN ACCREDITATION OR A PROFESSIONAL QUALIFICATION.', bold, 10, 56, WARN);
  centre(page, 'All products, companies and documents in the exercises are fictional. Results are not regulatory advice.', font, 9, 44, MUTED);
  // Page 2: the record of results behind the code.
  const w = writer(pdf, font, bold, { header: `Variations Classifier - record of results - ${name.trim()}`, watermark: 'PORTFOLIO EXERCISE' });
  w.h('Record of results');
  w.text(`${name.trim()} · ${date} · verification code ${code} · learner ID ${userId}`, { size: 9, color: MUTED });
  w.h('Missions', 11);
  for (const m of status.missionScores) w.text(`${m.id}. ${m.title} (${regionOf(m.region)?.short}): ${m.score ?? '-'}${m.difficulty ? `, ${m.difficulty}` : ''}`, { size: 9 });
  w.h('Lesson checks', 11);
  for (const l of status.lessonScores) w.text(`${l.id}. ${l.title}: ${l.best ?? '-'}%`, { size: 9 });
  w.h('Quiz and drills', 11);
  w.text(`Best mixed quiz round: ${status.quiz ? `${status.quiz.score}% (${status.quiz.right} of ${status.quiz.total})` : '-'}. Drill regions passed: ${status.drillRegions.map((r) => regionOf(r)?.label).join(', ') || '-'}.`, { size: 9 });
  w.space(8);
  w.text('The verification code is a hash of the name, learner ID, date and scores. Anyone can recompute it from an exported project file; it is not a security feature.', { size: 8.5, color: MUTED });
  w.finish('Variations Classifier · portfolio exercise, not an accreditation');
  return pdf.save();
}

export async function progressStatementPdf({ name, status, date = new Date().toISOString().slice(0, 10) }) {
  const { pdf, font, bold } = await setup('Variations Classifier - statement of progress');
  const w = writer(pdf, font, bold, { header: 'Variations Classifier - statement of progress', watermark: 'STATEMENT OF PROGRESS' });
  w.h('Statement of progress', 16);
  w.text(`${name.trim() || 'Learner'} · ${date}. This statement lists progress so far and does not claim completion.`, { size: 10, color: MUTED });
  w.h('Criteria for the certificate', 12);
  for (const c of status.criteria) w.text(`${c.done >= c.of ? '[done]' : '[open]'} ${c.label}: ${c.done} of ${c.of}`, { size: 10 });
  w.h('Missions', 12);
  for (const m of status.missionScores) w.text(`${m.id}. ${m.title}: ${m.score ?? 'not attempted'}`, { size: 9 });
  w.finish('Variations Classifier · training only');
  return pdf.save();
}

// ---------- classification report ----------
export async function reportPdf({ kase, product, user }) {
  const { pdf, font, bold } = await setup(`Classification report - ${kase.name}`);
  const w = writer(pdf, font, bold, { header: `Variations Classifier - classification report - ${kase.name}` });
  w.h('Classification report', 18);
  w.text(kase.name, { size: 12, f: bold });
  w.text(`${product.brandName} (${product.inn}), ${product.dosageForm}. ${productRefs(product, kase.regions).join('; ')} (numbers fictional).`, { size: 10 });
  w.text(`Case date ${kase.submitDate} · regions ${kase.regions.map((r) => regionOf(r).label).join(', ')} · learner ID ${user?.userId ?? kase.userId ?? '-'}${kase.classId ? ` · class ${kase.classId}` : ''}`, { size: 9, color: MUTED });
  w.text('Training material. Fictional product and company. The categories come from the app\'s content packs, which simplify some rules (see the notes); this is not regulatory advice.', { size: 9, color: WARN });
  w.rule();
  const packs = Object.fromEntries(kase.regions.map((r) => [r, packForCase(kase, r)]));
  w.h('Changes and their classification', 14);
  kase.changes.forEach((c, i) => {
    const def = CHANGE[c.changeId];
    w.h(`${i + 1}. ${def.title}`, 11.5);
    if (c.note) w.text(c.note, { size: 9.5, color: MUTED });
    for (const r of kase.regions) {
      const pack = packs[r];
      const res = classify(pack, c.changeId, answersFor(product, c));
      if (res.status === 'missing') { w.text(`${regionOf(r).label}: not modelled in edition ${pack.edition}.`, { size: 9.5, indent: 10 }); continue; }
      if (res.status === 'range') { w.text(`${regionOf(r).label}: not settled; between ${categoryOf(pack, res.min).label} and ${categoryOf(pack, res.max).label}.`, { size: 9.5, indent: 10 }); continue; }
      const o = res.outcome;
      w.text(`${regionOf(r).label} (edition ${pack.edition}): ${categoryOf(pack, res.category).label}`, { size: 10, f: bold, indent: 10 });
      w.text(o.why, { size: 9.5, indent: 20 });
      w.text(`Rule: ${sourceOf(pack, o.src).title}, ${o.at}`, { size: 8.5, color: MUTED, indent: 20 });
      for (const s of res.steps) w.text(`- ${s.text} ${s.answer}${s.fromProduct ? ' (product profile)' : ''}`, { size: 8.5, indent: 20 });
      for (const n of o.notes) w.text(`Note: ${n}`, { size: 8.5, color: WARN, indent: 20 });
    }
  });
  w.h('Filing plan', 14);
  for (const r of kase.regions) {
    const pack = packs[r];
    const { filings, pending } = filingsFor(pack, product, kase);
    w.h(regionOf(r).label, 11.5);
    if (pending.length) w.text(`${pending.length} change(s) not classified yet.`, { size: 9.5, color: WARN });
    for (const f of filings) {
      const cat = categoryOf(pack, f.category);
      const tl = timelineFor(pack, product, f, { submitDate: kase.submitDate, clockStop: kase.options?.clockStop, priority: kase.options?.priority, inspection: kase.options?.inspection, notificationDate: kase.options?.notificationDate });
      w.text(`${cat.label}: ${f.items.map((x) => x.def.title).join('; ')}`, { size: 10, f: bold, indent: 10 });
      w.text(cat.rule, { size: 9, indent: 20 });
      for (const e of tl.events) w.text(`${e.date}  ${e.label}`, { size: 9, indent: 20 });
      for (const n of tl.notes) w.text(n, { size: 8.5, color: MUTED, indent: 20 });
      const impact = impactFor(pack, f);
      if (impact.length) w.text(`Documents and sections: ${impact.map((x) => `${displayCode(x.code)} ${x.label}`).join('; ')}`, { size: 8.5, indent: 20 });
      w.space(4);
    }
  }
  w.finish(`Variations Classifier · built by Khan Gulrez Shagufa Fazal Ahmed · made ${new Date().toISOString().slice(0, 10)}`);
  return pdf.save();
}
