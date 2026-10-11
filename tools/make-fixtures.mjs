// Writes real change packages for Canada, Switzerland and Japan into the eCTD Dossier Builder's
// test fixtures (run from this repo with the eCTD repo checked out next to it).
import { writeFileSync, mkdirSync } from 'node:fs';
import { packFor } from '../src/engine/packs.js';
import { filingsFor } from '../src/engine/filing.js';
import { buildChangePackage } from '../src/engine/handoff.js';
import { BUILTIN_PRODUCTS, newCase, addChange } from '../src/engine/model.js';

const dir = process.argv[2] ?? '../ectd-dossier-builder/tests/fixtures';
mkdirSync(dir, { recursive: true });
const make = (region, pid, cid, answers, file) => {
  const p = BUILTIN_PRODUCTS.find((x) => x.id === pid);
  const k = newCase({ product: p, regions: [region], submitDate: '2026-11-02' });
  k.id = `c-fixture-${region}`;
  const c = addChange(k, cid); c.answers = answers; c.id = `ch-fixture-${region}`;
  const pack = packFor(region);
  const f = filingsFor(pack, p, k).filings[0];
  const pkg = buildChangePackage({ pack, product: p, kase: k, filing: f, user: { userId: 'u-fixture', classId: null } });
  pkg.createdAt = '2026-10-11T00:00:00.000Z';
  writeFileSync(`${dir}/${file}`, JSON.stringify(pkg, null, 2) + '\n');
  console.log(file, pkg.submission.ectd.submissionType, pkg.ctd.length);
};
make('ca', 'nce-tablet', 'dp-site-move', Object.fromEntries([1, 2, 3, 4, 5].map((i) => [`HC-A1.23:${i}`, 'yes'])), 'change-package-ca.json');
make('ch', 'nce-tablet', 'shelf-life-extend', { realTimeData: 'no', extrapolationPerGuideline: 'yes' }, 'change-package-ch.json');
make('jp', 'nce-tablet', 'spec-relax', { jpItem: 'pca' }, 'change-package-jp.json');
