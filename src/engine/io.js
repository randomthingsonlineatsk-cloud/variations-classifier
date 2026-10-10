// Project file export and import: every case, attempt and custom product of the local user.
import { SCHEMA_VERSION, uid } from './model.js';

export const FILE_KIND = 'variations-classifier/project';

export function exportProject({ user, cases, attempts, products, lessons }) {
  return JSON.stringify({
    kind: FILE_KIND, schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
    notice: 'Training only. Fictional products and companies; not regulatory advice.',
    user: { userId: user?.userId ?? null, classId: user?.classId ?? null, displayName: user?.displayName ?? '' },
    cases, attempts, products, lessons: lessons ?? {},
  }, null, 2);
}

export function parseProjectFile(text, user, existing = { cases: new Set(), attempts: new Set(), products: new Set() }) {
  let d;
  try { d = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if (d?.kind !== FILE_KIND) throw new Error('This is not a Variations Classifier project file.');
  if (d.schema > SCHEMA_VERSION) throw new Error('This file was saved by a newer version of the app.');
  const own = (x) => ({ ...x, importedFrom: { userId: x.userId ?? null, classId: x.classId ?? null }, userId: user?.userId ?? x.userId, classId: user?.classId ?? x.classId ?? null });
  const fresh = (x, set, prefix) => (set.has(x.id) ? { ...x, id: uid(prefix) } : x);
  return {
    cases: (d.cases ?? []).map((c) => own(fresh(c, existing.cases, 'c'))),
    attempts: (d.attempts ?? []).map((a) => own(fresh(a, existing.attempts, 'a'))),
    products: (d.products ?? []).map((p) => own(p)),
    lessons: d.lessons ?? {},
  };
}

export function download(filename, data, type = 'application/json') {
  const blob = new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export const readFile = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsText(file);
});
