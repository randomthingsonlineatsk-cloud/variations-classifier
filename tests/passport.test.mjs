// Skills Passport record: the seal and the verification code can be recomputed from the record.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { vcRecord, sealOf } from '../src/engine/passport.js';
import { certificateStatus, verificationCode } from '../src/engine/certificate.js';
import { MISSIONS } from '../src/engine/missions.js';
import { sha256 } from '../src/engine/sha256.js';

const attempts = MISSIONS.map((m) => ({ kind: 'mission', missionId: m.id, score: 90, difficulty: 'standard' }));
const status = certificateStatus({ attempts, lessonsDone: {} });
const r = vcRecord({ name: 'Asha Rao', userId: 'u-123', status, date: '2026-11-09' });
assert.equal(r.code, verificationCode({ name: 'Asha Rao', userId: 'u-123', status, date: '2026-11-09' }));
const h = sha256(r.basis).toUpperCase();
assert.equal(r.code, `VC-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`);
assert.equal(r.seal, sealOf(r));
assert.equal(r.criteria.length, status.criteria.length);
assert.ok(r.criteria.some((c) => !c.met), 'lessons not done, so a criterion is unmet');
if (process.env.PASSPORT_FIXTURES) writeFileSync(`${process.env.PASSPORT_FIXTURES}/vc-unmet.json`, JSON.stringify(r, null, 2));
console.log('passport: 5 checks passed');
