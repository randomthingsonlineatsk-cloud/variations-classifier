// The shared hand-off file. This app writes it; the eCTD Dossier Builder reads it to start a
// sequence of the right type. Keep the schema in step with that app's importer and test.
import { categoryOf, sourceOf } from './packs.js';
import { ectdFor, m1For, impactFor, coverLetter, timelineFor } from './filing.js';

export const PACKAGE_KIND = 'variations-classifier/change-package';
export const PACKAGE_SCHEMA = 1;

export function buildChangePackage({ pack, product, kase, filing, user = null }) {
  const cat = categoryOf(pack, filing.category);
  const tl = timelineFor(pack, product, filing, { submitDate: kase.submitDate, priority: kase.options?.priority, inspection: kase.options?.inspection, notificationDate: kase.options?.notificationDate, clockStop: kase.options?.clockStop });
  const ectd = ectdFor(pack, filing);
  const description = filing.items.map((i) => i.def.title).join('; ');
  return {
    kind: PACKAGE_KIND,
    schema: PACKAGE_SCHEMA,
    createdAt: new Date().toISOString(),
    notice: 'Training only. Fictional product and company; not suitable for a real submission.',
    app: { name: 'Variations Classifier', author: 'Khan Gulrez Shagufa Fazal Ahmed' },
    userId: user?.userId ?? kase.userId ?? null,
    classId: user?.classId ?? kase.classId ?? null,
    caseId: kase.id,
    product: {
      id: product.id, ectdProductId: product.ectdProductId ?? null, brandName: product.brandName, inn: product.inn,
      appType: product.appType, applicationNumber: product.applicationNumber, holder: product.holder.name,
      in: pack.id === 'in' ? { route: product.in?.route ?? null, permission: product.in?.permission ?? null, agent: product.in?.agent ?? null, draftRules: !!pack.draft } : null,
      eu: pack.id === 'eu' ? { route: product.eu?.route ?? null, maNumber: product.eu?.maNumber ?? null, holder: (product.eu?.holder ?? product.holder).name } : null,
    },
    region: pack.region,
    pack: { id: pack.id, edition: pack.edition },
    submission: {
      category: filing.category, categoryLabel: cat.label, kind: filing.kind,
      ectd: { submissionType: ectd.submissionType, subType: ectd.subType, submissionMode: ectd.submissionMode ?? 'single' },
      mode: filing.mode ?? 'single', alsoProducts: filing.alsoProducts ?? [],
      description,
      implementation: { badge: cat.badge, rule: cat.rule },
      submitDate: kase.submitDate ?? null,
      earliestUse: tl.earliestUse,
      related: filing.items.length > 1,
    },
    changes: filing.items.map((i) => ({
      id: i.change.id, changeId: i.change.changeId, title: i.def.title, note: i.change.note ?? '',
      category: i.result.category, categoryLabel: categoryOf(pack, i.result.category)?.label ?? i.result.category,
      entry: { src: i.result.outcome.src, source: sourceOf(pack, i.result.outcome.src).title, at: i.result.outcome.at },
      why: i.result.outcome.why,
    })),
    module1: m1For(pack, filing).map((d) => ({ code: d.code, label: d.label })),
    ctd: impactFor(pack, filing).map((e) => ({ code: e.code, label: e.label, operation: e.op, why: e.why })),
    coverLetter: coverLetter(pack, product, filing, kase),
  };
}

export function parseChangePackage(text) {
  let d;
  try { d = typeof text === 'string' ? JSON.parse(text) : text; } catch { throw new Error('This file is not valid JSON.'); }
  if (d?.kind !== PACKAGE_KIND) throw new Error('This is not a change package from the Variations Classifier.');
  if (d.schema > PACKAGE_SCHEMA) throw new Error('This change package was made by a newer version of the app.');
  for (const k of ['product', 'region', 'submission', 'changes', 'ctd']) if (!(k in d)) throw new Error(`Change package is missing "${k}".`);
  return d;
}
