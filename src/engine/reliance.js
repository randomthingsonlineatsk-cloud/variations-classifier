// The Divergence and Reliance Map. Two questions that a global regulatory team asks about every
// change: does the same change fall in a different category in the EU, the UK and Switzerland
// (the EU moved to its 2025 classification guidelines on 15 January 2026; MHRA still applies the
// 2013 guidelines; Swissmedic aligned its list with the EU on 1 February 2026), and which reliance
// route could let one agency build on another's decision.
import { CHANGES, CHANGE, packFor, rankOf, categoryOf } from './packs.js';
import { reachable } from './classify.js';

export const MAP_REGIONS = ['eu', 'uk', 'ch'];
const packsNow = () => Object.fromEntries(MAP_REGIONS.map((r) => [r, packFor(r)]));

// For every change: the categories it can reach in each region, and how the EU and UK differ.
export function divergence() {
  const P = packsNow();
  return CHANGES.map((c) => {
    const sets = Object.fromEntries(MAP_REGIONS.map((r) => [r, reachable(P[r], c.id)]));
    const lo = (r) => rankOf(P[r], sets[r][0]);
    const hi = (r) => rankOf(P[r], sets[r][sets[r].length - 1]);
    const same = sets.eu.join() === sets.uk.join();
    let direction = 'same';
    if (!same) {
      const dl = lo('uk') - lo('eu'), dh = hi('uk') - hi('eu');
      if (sets.uk.includes('OTHER') && !sets.eu.includes('OTHER')) direction = 'no-uk-route';
      else if (dl >= 0 && dh >= 0 && (dl > 0 || dh > 0)) direction = 'uk-heavier';
      else if (dl <= 0 && dh <= 0 && (dl < 0 || dh < 0)) direction = 'eu-heavier';
      else direction = 'mixed';
    }
    const chSame = sets.ch.join() === sets.eu.join();
    return { id: c.id, title: c.title, group: c.group, kind: c.kind, sets, same, direction, chSame };
  });
}

export function divergenceSummary(rows = divergence()) {
  const by = (d) => rows.filter((r) => r.direction === d).length;
  return { total: rows.length, differ: rows.filter((r) => !r.same).length, ukHeavier: by('uk-heavier'), euHeavier: by('eu-heavier'), mixed: by('mixed'), noUkRoute: by('no-uk-route'), chDiffers: rows.filter((r) => !r.chSame).length };
}

export const DIRECTION_TEXT = {
  same: 'Same categories',
  'uk-heavier': 'Heavier in the UK',
  'eu-heavier': 'Lighter in the UK',
  mixed: 'Different in both directions',
  'no-uk-route': 'No UK procedure for it',
};

// ---------- reliance ----------
export const IRP_REFERENCE_REGULATORS = [
  'Australia (TGA)', 'Canada (Health Canada)', 'Switzerland (Swissmedic)', 'Singapore (HSA)', 'Japan (PMDA)', 'United States (FDA)',
  'EU/EEA (EMA, and the national authorities of the EU, Norway, Iceland and Liechtenstein: centralised, MRP/DCP and national routes)',
];
export const ACCESS_MEMBERS = ['Australia (TGA)', 'Canada (Health Canada)', 'Singapore (HSA)', 'Switzerland (Swissmedic)', 'United Kingdom (MHRA)'];
const INDICATION = new Set(['lab-new-indication']);

// Reliance routes for one change, given the category (or categories) it reaches in each region.
export function relianceFor(changeId, cats = null) {
  const P = packsNow();
  const c = CHANGE[changeId];
  const reach = (r) => cats?.[r] ? [cats[r]] : reachable(P[r], changeId);
  const routes = [];
  const uk = reach('uk');
  const ukFiled = uk.filter((x) => ['IB', 'II'].includes(x));
  routes.push({
    id: 'irp', region: 'uk', title: 'UK: International Recognition Procedure (IRP)',
    applies: ukFiled.length ? 'yes' : uk.some((x) => ['IA', 'IAIN'].includes(x)) ? 'grouped' : 'no',
    summary: ukFiled.length
      ? `This change can be ${ukFiled.map((x) => categoryOf(P.uk, x).label).join(' or ')} in the UK. Once a reference regulator has approved the same change, MHRA can take its decision into account through the IRP.`
      : uk.some((x) => ['IA', 'IAIN'].includes(x)) ? 'Type IA and IA-IN changes can go through the IRP only when grouped with a Type IB or II variation.' : 'No IRP route: the change needs no variation or follows another procedure.',
    points: [
      `Reference regulators: ${IRP_REFERENCE_REGULATORS.join('; ')}.`,
      'Classify the variation under MHRA’s guidance (the 2013 categories in this pack) and submit it as soon as possible after the reference regulator approves it, with that regulator’s approval decision (for Type IB, its assessment report is not required but should be provided where available).',
      'The variation must match the dossier the reference regulator approved, including its approved post-authorisation changes. Use the same reference regulator through the product’s lifecycle; say so in the cover letter if it changes.',
      'Type IA variations are accepted through the IRP only when grouped with a Type IB or II variation. MHRA may ask for the national route where patient safety or UK-specific matters are involved; tell MHRA in advance about a variation that may affect the benefit-risk balance.',
      'Submit one consolidated sequence in EU-format eCTD through the MHRA portal.',
    ],
    src: 'MHRA, International Recognition Procedure (updated 6 November 2026) and IRP for product lifecycle (updated 3 September 2026)',
  });
  const ch = reach('ch');
  routes.push({
    id: 'art13', region: 'ch', title: 'Switzerland: Article 13 TPA (taking foreign assessments into account)',
    applies: ch.some((x) => ['IB', 'II', 'EXT'].includes(x)) ? 'yes' : 'no',
    summary: ch.some((x) => ['IB', 'II', 'EXT'].includes(x))
      ? 'A variation can be submitted with a request to apply Article 13 TPA when a reference authority has already approved the same change; Swissmedic then factors that authority’s assessment into its own.'
      : 'Type IA and IA-IN notifications gain little from Article 13; it matters for changes Swissmedic assesses.',
    points: [
      'The documentation must be identical to what the reference authority based its decision on (Modules 2.4 to 2.7, 4 and 5); differences in Modules 2.3 and 3 only as the guidance allows.',
      'Answer “yes” to Article 13 on the variations form and complete the Article 13 information form; enclose the foreign decision and assessment report (Module 1.7 in this app).',
      'Variations the reference authority approved after its authorisation are submitted too, with an old/new comparison appended to the final assessment report.',
    ],
    src: 'Swissmedic, FAQ on Article 13 TPA',
  });
  routes.push({
    id: 'access', region: 'uk, ch', title: 'Access Consortium work-sharing (new indications only)',
    applies: INDICATION.has(changeId) ? 'yes' : 'no',
    summary: INDICATION.has(changeId)
      ? 'A new indication can be considered for joint review by the Access agencies: one evaluates Module 5, the others peer-review the assessment and evaluate their own Module 1.'
      : 'Other variations are outside the Access New Active Substance Work-Sharing Initiative.',
    points: [`Members: ${ACCESS_MEMBERS.join('; ')}.`, 'Provisional or conditional approvals are excluded.'],
    src: 'Access NASWSI operational procedures v1.2',
  });
  routes.push({
    id: 'eu-ws', region: 'eu', title: 'EU: worksharing and super-grouping across your own authorisations',
    applies: reach('eu').some((x) => !['NONE', 'OTHER'].includes(x)) ? 'yes' : 'no',
    summary: 'Not reliance on another agency, but one assessment for the same change in several of the holder’s EU authorisations (Article 20), or one notification for the same Type IA change (Article 7a). Set it up on the Plan tab of a case.',
    points: [],
    src: 'Commission Regulation (EC) No 1234/2008',
  });
  return { change: c, routes };
}
