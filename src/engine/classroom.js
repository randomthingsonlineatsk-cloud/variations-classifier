// Client for the classroom API (the shared Cloudflare Worker + D1 in the eCTD Dossier Builder
// repository, routes under /vc/v1). Without a server address the app stays fully browser-only;
// classroom mode is the only feature that talks to a server.
import { getMeta, setMeta } from './db.js';
import { missionById, scoreMission } from './missions.js';
import { migrateCase } from './model.js';

export const BUILT_IN_API = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLASSROOM_API) || '';
export const SUBMISSION_KIND = 'variations-classifier/mission-submission';

export async function loadSession() {
  const s = (await getMeta('classroom', null)) ?? {};
  return { ...s, api: s.api || BUILT_IN_API };
}
export const saveSession = (s) => setMeta('classroom', s);

export async function api(session, method, path, body) {
  if (!session.api) throw new Error('No classroom server is set.');
  const base = session.api.replace(/\/+$/, '');
  let res;
  try {
    res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(session.token ? { authorization: `Bearer ${session.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Could not reach the classroom server. Check the address and your connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `The classroom server answered ${res.status}.`);
  return data;
}

// What a student sends: the mission case (answers, CTD picks, date) and the score the app gave.
export function submissionPayload(kase, user) {
  const m = missionById(kase.missionId);
  if (!m) throw new Error('This case is not a mission.');
  const res = scoreMission(m, kase);
  return {
    project: { kind: SUBMISSION_KIND, schema: 1, submittedAt: new Date().toISOString(), userId: user?.userId ?? kase.userId ?? null, classId: user?.classId ?? kase.classId ?? null, case: kase },
    score: res.score,
    axes: res.parts,
    counts: null,
    checks: res.feedback.map((f, i) => ({ id: `f${i + 1}`, label: f.text, ok: f.ok })),
  };
}

// The instructor re-scores the submitted case in their own browser, with this copy of the app.
export function verifySubmission(file) {
  if (file?.kind !== SUBMISSION_KIND) throw new Error('This is not a Variations Classifier submission.');
  const kase = migrateCase(structuredClone(file.case));
  const m = missionById(kase.missionId);
  if (!m) throw new Error(`Mission ${kase.missionId} is not in this version of the app.`);
  const res = scoreMission(m, kase);
  return { score: res.score, axes: res.parts, checks: res.feedback.map((f, i) => ({ id: `f${i + 1}`, label: f.text, ok: f.ok })) };
}

export const isLate = (assignment, submittedAt) => submittedAt > assignment.dueAt;
