// Exchange with the Labelling Workbench (a separate app). It sends a CCDS change file; this app
// starts a labelling rollout case from it. This app sends back a rollout file with each
// region's classification and status. Keep in step with labelling-workbench/src/engine/changes.js.
import { newCcdsCase, rolloutRows, kindOf, STATUSES } from './labelling.js';
import { categoryOf } from './packs.js';
import { today } from './model.js';

export const LW_CHANGE_KIND = 'labelling-workbench/ccds-change';
export const ROLLOUT_KIND = 'variations-classifier/ccds-rollout';

export function parseLabellingChange(text) {
  let d;
  try { d = typeof text === 'string' ? JSON.parse(text) : text; } catch { throw new Error('This file is not valid JSON.'); }
  if (d?.kind !== LW_CHANGE_KIND) throw new Error('This is not a change file from the Labelling Workbench.');
  if (d.schema > 1) throw new Error('This file was made by a newer version of the Labelling Workbench.');
  if (!d.product?.id || !d.ccds?.kind) throw new Error('The change file is missing the product or the kind of change.');
  if (!kindOf(d.ccds.kind)) throw new Error(`Unknown kind of change "${d.ccds.kind}".`);
  return d;
}

// Starts a rollout case. Regions the product is not sold in here are skipped with a note.
export function caseFromLabellingChange(d, product, user, availableRegions) {
  const regions = (d.regions ?? []).filter((r) => availableRegions.includes(r));
  const skipped = (d.regions ?? []).filter((r) => !availableRegions.includes(r));
  if (!regions.length) throw new Error('None of the markets in the file are set up for this product here.');
  const k = newCcdsCase({ product, user, kind: d.ccds.kind, text: d.ccds.text || kindOf(d.ccds.kind).label, version: d.ccds.version || '1.0', ccdsDate: d.ccds.date || today(), regions });
  for (const r of regions) {
    const st = d.status?.[r];
    if (st && Number.isInteger(st.step)) k.ccds.status[r] = { step: Math.min(st.step, STATUSES.length - 1), dates: { ...(st.dates ?? {}) } };
  }
  k.labellingLink = { changeId: d.changeId ?? null, projectId: d.projectId ?? null, trigger: d.trigger ?? null, importedAt: new Date().toISOString() };
  return { kase: k, skipped };
}

export function rolloutFile(k, product, user = null) {
  const rows = rolloutRows(k, product, today());
  return {
    kind: ROLLOUT_KIND, schema: 1, createdAt: new Date().toISOString(),
    notice: 'Training only. Fictional product and company; not regulatory advice.',
    app: { name: 'Variations Classifier', author: 'Khan Gulrez Shagufa Fazal Ahmed' },
    userId: user?.userId ?? k.userId ?? null, classId: user?.classId ?? k.classId ?? null,
    caseId: k.id, changeId: k.labellingLink?.changeId ?? null,
    product: { id: product.id, brandName: product.brandName },
    ccds: { version: k.ccds.version, kind: k.ccds.kind, date: k.ccds.date },
    regions: rows.map((r) => ({
      region: r.region, step: r.step, status: r.status, dates: k.ccds.status[r.region]?.dates ?? {}, target: r.target,
      classification: r.result.status === 'done' ? categoryOf(r.pack, r.result.category)?.label ?? r.result.category : r.result.status === 'range' ? `${categoryOf(r.pack, r.result.min)?.label ?? r.result.min} to ${categoryOf(r.pack, r.result.max)?.label ?? r.result.max} (questions unanswered)` : '',
      earliestUse: r.timeline?.earliestUse ?? null,
    })),
  };
}
