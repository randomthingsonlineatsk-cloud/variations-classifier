// Cases: a product, one or more changes, the learner's answers and the filing plan.
import products from '../data/products.json' with { type: 'json' };
import { packFor } from './packs.js';

export const SCHEMA_VERSION = 1;
export const BUILTIN_PRODUCTS = products.products;

export function uid(prefix = '') {
  const r = (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`).replace(/-/g, '').slice(0, 12);
  return `${prefix}${prefix ? '-' : ''}${r}`;
}
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function newCase({ product, user = null, region = 'us', regions = null, name = '', missionId = null, difficulty = null, submitDate = null }) {
  regions = regions?.length ? regions : [region];
  const now = new Date().toISOString();
  const date = submitDate ?? today();
  return {
    id: uid('c'), schema: SCHEMA_VERSION,
    userId: user?.userId ?? null, classId: user?.classId ?? null,
    name: name || `${product.brandName}: change`,
    productId: product.id, regions, region: regions[0],
    packs: Object.fromEntries(regions.map((r) => { const p = packFor(r, { date }); return [r, { id: p.id, edition: p.edition }]; })),

    changes: [], related: true, alsoProducts: [],
    submitDate: date, plannedUse: '',
    options: { priority: false, inspection: false, notificationDate: '', clockStop: 0, inDraft: false },
    checks: {}, missionId, difficulty, mission: null,
    createdAt: now, updatedAt: now,
  };
}

// Cases saved before the EU pack had one region.
export function migrateCase(k) {
  if (!k.regions) k.regions = [k.region ?? 'us'];
  k.region = k.regions[0];
  k.alsoProducts ??= [];
  k.options = { priority: false, inspection: false, notificationDate: '', clockStop: 0, inDraft: false, ...(k.options ?? {}) };
  k.packs ??= Object.fromEntries(k.regions.map((r) => { const p = packFor(r, { date: k.submitDate }); return [r, { id: p.id, edition: p.edition }]; }));
  return k;
}

export function addChange(kase, changeId, note = '') {
  const c = { id: uid('ch'), changeId, answers: {}, note };
  kase.changes.push(c);
  return c;
}

export const touch = (k) => { k.updatedAt = new Date().toISOString(); return k; };

// A product from an eCTD Dossier Builder project file, so both apps work on the same product.
export function productFromEctdFile(text) {
  let d;
  try { d = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if (d?.kind !== 'ectd-dossier-builder/project' || !d.project) throw new Error('This is not an eCTD Dossier Builder project file.');
  const p = d.project;
  const base = BUILTIN_PRODUCTS.find((b) => b.ectdProductId && b.ectdProductId === p.productId);
  if (!base) throw new Error(`The project's product (${p.productId}) is not one this app knows.`);
  const s = p.settings ?? {};
  return {
    ...structuredClone(base),
    id: uid('p'), custom: true, basedOn: base.id,
    ectdProjectId: p.id, ectdProjectName: p.name, ectdRegion: p.region,
    applicationNumber: s.applicationNumber || base.applicationNumber,
    holder: s.applicant?.name ? { ...base.holder, name: s.applicant.name, address: s.applicant.address ?? base.holder.address } : base.holder,
    label: `${base.brandName} (from eCTD project "${p.name}")`,
  };
}
