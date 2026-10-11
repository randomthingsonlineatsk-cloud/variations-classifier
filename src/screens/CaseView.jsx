import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { CHANGE, GROUP, QUESTIONS, EVIDENCE, READY, regionsFor, changesFor, searchChanges, optionsFor, categoryOf, regionOf, questionText, conditionCode, toneOf, noFiling } from '../engine/packs.js';
import { classify, nextQuestion, whatIfs, lowerRoutes, pathItems, answerOf, isFromProduct, autoKey } from '../engine/classify.js';
import { answersFor, filingsFor, impactFor, timelineFor, coverLetter, ectdFor, cmpCode, displayCode, packForCase, isEU, euRoute } from '../engine/filing.js';
import { productRefs } from '../engine/model.js';
import { buildChangePackage } from '../engine/handoff.js';
import { addChange } from '../engine/model.js';
import { download } from '../engine/io.js';
import { missionById, scoreMission, LEVELS } from '../engine/missions.js';
import { IntakeTab, RolloutTab, LabellingTab } from './CaseExtras.jsx';
import { Cat, Range, Ladder, Cite, Badge } from '../components/ui.jsx';

const short = (r) => regionOf(r)?.short ?? r.toUpperCase();

export default function CaseView({ id }) {
  const { cases, productById, saveCase, user, toast } = useApp();
  const stored = cases.find((c) => c.id === id);
  const [k, setK] = useState(() => (stored ? structuredClone(stored) : null));
  const [tab, setTab] = useState(() => (stored?.intake ? 'intake' : stored?.ccds ? 'labelling' : 'classify'));
  const [sel, setSel] = useState(() => stored?.changes[0]?.id ?? null);
  if (!k) return <div className="page"><h1>Case not found</h1><p><a href="#/">Back to your cases</a></p></div>;
  const product = productById(k.productId);
  if (!product) return <div className="page"><h1>Product missing</h1><p>The product for this case was deleted. <a href="#/">Back</a></p></div>;
  const packs = Object.fromEntries(k.regions.map((r) => [r, packForCase(k, r)]));
  const mission = k.missionId ? missionById(k.missionId) : null;
  const submitted = !!k.mission?.submitted;
  const level = k.difficulty ?? 'standard';
  const showHelp = !mission || level !== 'expert' || submitted;
  const showCites = !mission || level === 'guided' || submitted;
  const reveal = !mission || level === 'guided' || submitted;

  const mutate = (fn) => {
    const next = structuredClone(k);
    fn(next);
    next.packs = Object.fromEntries(next.regions.map((r) => { const p = packForCase(next, r); return [r, { id: p.id, edition: p.edition }]; }));
    setK(next);
    saveCase(next);
  };
  const selected = k.changes.find((c) => c.id === sel) ?? k.changes[0];
  const tabs = [
    ...(k.intake ? [['intake', 'Change request']] : []),
    ...(k.ccds ? [['labelling', 'Labelling rollout']] : []),
    ['classify', 'Classify'], ['plan', 'Filing plan'],
    ...(k.regions.length > 1 ? [['rollout', 'Rollout']] : []),
    ...(mission ? [['mission', submitted ? 'Mission result' : 'Submit mission']] : []),
  ];
  const toggleRegion = (r) => mutate((x) => {
    const has = x.regions.includes(r);
    if (has && x.regions.length === 1) return;
    x.regions = has ? x.regions.filter((y) => y !== r) : READY.filter((y) => x.regions.includes(y) || y === r);
    x.region = x.regions[0];
  });

  return (
    <div className="ws">
      <div className="ws-head">
        <div className="ws-title">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="small" style={{ margin: 0 }}><a href={mission ? '#/missions' : '#/'}>{mission ? 'Missions' : 'Cases'}</a> /</p>
            <h1>
              {mission ? k.name : (
                <input aria-label="Case name" value={k.name} onChange={(e) => mutate((x) => { x.name = e.target.value; })}
                  style={{ font: 'inherit', border: 0, background: 'transparent', padding: 0, width: '100%', minWidth: 0 }} />
              )}
            </h1>
            <p className="small muted" style={{ margin: 0 }}>
              {product.brandName} ({product.inn}) · {product.dosageForm} · {productRefs(product, k.regions).join(' · ')} · numbers fictional
            </p>
            <div className="row small" style={{ marginTop: '.35rem' }}>
              {mission ? k.regions.map((r) => <span key={r} className="pill">{regionOf(r).label}: edition {packs[r].edition}</span>) : READY.map((r) => (
                <label key={r} className="row" style={{ gap: '.3rem' }}>
                  <input type="checkbox" checked={k.regions.includes(r)} onChange={() => toggleRegion(r)} disabled={(k.regions.includes(r) && k.regions.length === 1) || (!k.regions.includes(r) && !regionsFor(product).includes(r))} />
                  {regionOf(r).label}{packs[r] ? <span className="muted">(edition {packs[r].edition})</span> : null}
                </label>
              ))}
              {k.regions.includes('in') && (
                <label className="row" style={{ gap: '.3rem' }}>
                  <input type="checkbox" checked={!!k.options?.inDraft} disabled={!!mission} onChange={(e) => mutate((x) => { x.options.inDraft = e.target.checked; })} />
                  India: use the February 2026 draft rules (what-if)
                </label>
              )}
            </div>
          </div>
          <div className="row no-print">
            <button className="btn small" onClick={async () => {
              try {
                const { reportPdf } = await import('../engine/pdf.js');
                const bytes = await reportPdf({ kase: k, product, user });
                download(`classification-report-${k.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.pdf`, bytes, 'application/pdf');
              } catch (e) { toast(`Could not make the report: ${e.message}`, 'error'); }
            }} disabled={!!mission && !submitted} title={mission && !submitted ? 'Available after you submit the mission' : undefined}>Classification report (PDF)</button>
            <button className="btn small ghost" onClick={() => window.print()}>Print</button>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Case views">
          {tabs.map(([t, l]) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}</button>)}
        </div>
      </div>
      {mission && (
        <div className="mission-bar">
          <strong>Mission {mission.id}</strong>
          <span>Region: {regionOf(mission.region).label}</span>
          <span>Level: {LEVELS.find((l) => l.id === level)?.label}</span>
          {submitted && <span>Score: <strong>{k.mission.submitted.score}</strong>/100</span>}
        </div>
      )}
      <div className="ws-body">
        {packs.in?.draft && (
          <p className="callout warn small">India answers use the draft rules G.S.R. 97(E) of 2 February 2026, which are not in force. Levels for chemical drugs are inferred from the matching FDA entries; untick the box above for the rules in force.</p>
        )}
        {packs.eu?.status === 'superseded' && (
          <p className="callout warn small">The case date ({k.submitDate}) is before 15 January 2026, so the EU answer uses the 2013 guidelines that were in force then. Change the date on the filing plan to see the 2025 guidelines.</p>
        )}
        {mission && tab !== 'mission' && (
          <details className="panel" open={tab === 'classify'} style={{ marginBottom: '1rem' }}>
            <summary><strong>Brief</strong></summary>
            <p style={{ marginTop: '.5rem' }}>{mission.brief}</p>
            <p className="small"><strong>Your task:</strong> {mission.goal}</p>
          </details>
        )}
        {tab === 'intake' && k.intake && <IntakeTab {...{ k, product, mutate, goClassify: () => setTab('classify'), setSel }} />}
        {tab === 'labelling' && k.ccds && <LabellingTab {...{ k, product, mutate }} />}
        {tab === 'rollout' && <RolloutTab {...{ k, product }} />}
        {tab === 'classify' && <ClassifyTab {...{ k, packs, product, selected, setSel, mutate, showHelp, showCites, mission }} />}
        {tab === 'plan' && <PlanTab {...{ k, packs, product, mutate, reveal, mission }} />}
        {tab === 'mission' && mission && <MissionTab {...{ k, pack: packs[mission.region], product, mission, mutate }} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Classify
function ClassifyTab({ k, packs, product, selected, setSel, mutate, showHelp, showCites, mission }) {
  const [adding, setAdding] = useState(k.changes.length === 0);
  return (
    <div className="case-grid">
      <aside className="stack" aria-label="Changes in this case">
        <div className="change-list">
          {k.changes.map((c) => (
            <button key={c.id} className="change-item" aria-current={selected?.id === c.id} onClick={() => { setSel(c.id); setAdding(false); }}>
              <span className="t">{CHANGE[c.changeId]?.title}</span>
              {c.note && <span className="small muted">{c.note}</span>}
              <span className="row" style={{ gap: '.3rem' }}>
                {k.regions.map((r) => {
                  const res = classify(packs[r], c.changeId, answersFor(product, c));
                  return (
                    <span key={r} className="row small" style={{ gap: '.2rem' }}>
                      {k.regions.length > 1 && <span className="muted">{short(r)}</span>}
                      {res.status === 'done' ? <Cat pack={packs[r]} id={res.category} /> : res.status === 'range' ? <Range pack={packs[r]} min={res.min} max={res.max} /> : <span className="muted">n/a</span>}
                    </span>
                  );
                })}
              </span>
            </button>
          ))}
        </div>
        {!mission && <button className="btn" onClick={() => setAdding(true)}>Add a change</button>}
        {k.changes.length > 1 && <p className="small muted">{k.changes.length} changes. See the filing plan for how they are filed.</p>}
      </aside>
      <section>
        {adding && !mission ? (
          <AddChange product={product} onAdd={(changeId) => { let nid; mutate((x) => { nid = addChange(x, changeId).id; if (x.changes.length === 1 && /: change$/.test(x.name)) x.name = `${product.brandName}: ${CHANGE[changeId].title}`; }); setSel(nid); setAdding(false); }} onCancel={k.changes.length ? () => setAdding(false) : null} />
        ) : selected ? (
          <ChangePanel key={selected.id} {...{ k, packs, product, change: selected, mutate, showHelp, showCites, mission }} />
        ) : <p className="muted">Add a change to start.</p>}
      </section>
    </div>
  );
}

function AddChange({ product, onAdd, onCancel }) {
  const [q, setQ] = useState('');
  const all = changesFor(product);
  const list = searchChanges(all, q);
  return (
    <div className="panel stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>Add a change</h2>
        {onCancel && <button className="btn small ghost" onClick={onCancel}>Cancel</button>}
      </div>
      <label className="field">Search
        <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="for example: site, excipient, warning" />
        <small>{list.length} of {all.length} changes that apply to {product.brandName}.</small>
      </label>
      {Object.values(GROUP).map((g) => {
        const items = list.filter((c) => c.group === g.id);
        if (!items.length) return null;
        return (
          <div key={g.id}>
            <h3 className="small" style={{ color: 'var(--ink-3)', margin: '.5rem 0 .3rem' }}>{g.label}</h3>
            <div className="list">
              {items.map((c) => (
                <div key={c.id} className="list-item" style={{ padding: '.5rem .75rem' }}>
                  <div style={{ minWidth: 0, flex: 1 }}><strong className="small">{c.title}</strong><div className="small muted">{c.help}</div></div>
                  <button className="btn small primary" onClick={() => onAdd(c.id)} aria-label={`Add: ${c.title}`}>Add</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Questions from every region's path, merged: a shared question is asked once.
function mergedItems(k, packs, changeId, answers) {
  const rows = [];
  const seen = new Map();
  for (const r of k.regions) {
    const pack = packs[r];
    if (!pack.entries[changeId]) continue;
    const next = nextQuestion(pack, changeId, answers);
    for (const it of pathItems(pack, changeId, answers)) {
      if (it.group) {
        const key = `${r}:${it.group.join('|')}`;
        if (!seen.has(key)) { const row = { group: it.group, region: r, pack, next }; seen.set(key, row); rows.push(row); }
        continue;
      }
      if (isFromProduct(pack, it.q)) continue;
      const row = seen.get(it.q);
      if (row) { row.regions.push(r); if (next === it.q) row.next = true; continue; }
      const nrow = { q: it.q, regions: [r], next: next === it.q };
      seen.set(it.q, nrow); rows.push(nrow);
    }
  }
  return rows;
}

function ChangePanel({ k, packs, product, change, mutate, showHelp, showCites, mission }) {
  const def = CHANGE[change.changeId];
  const answers = answersFor(product, change);
  const rows = mergedItems(k, packs, change.changeId, answers);
  const fromProduct = new Set();
  for (const r of k.regions) for (const it of pathItems(packs[r], change.changeId, answers)) if (it.q && isFromProduct(packs[r], it.q)) fromProduct.add(it.q);
  const setAnswer = (q, v) => mutate((x) => { const c = x.changes.find((y) => y.id === change.id); c.answers = { ...c.answers, [q]: v }; });
  const multi = k.regions.length > 1;
  return (
    <div className="stack">
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--step-2)', margin: 0 }}>{def.title}</h2>
          {!mission && <button className="btn small danger" onClick={() => mutate((x) => { x.changes = x.changes.filter((y) => y.id !== change.id); })}>Remove</button>}
        </div>
        <p className="small muted">{def.help}</p>
        {!mission && (
          <label className="field">Describe this change (goes in the cover letter)
            <input type="text" value={change.note ?? ''} onChange={(e) => mutate((x) => { x.changes.find((y) => y.id === change.id).note = e.target.value; })} placeholder="for example: add Fictionburg plant for compression and coating" />
          </label>
        )}
        {fromProduct.size > 0 && (
          <p className="from-product" style={{ marginTop: '.75rem' }}>
            From the product profile: {[...fromProduct].map((q) => `${(QUESTIONS[q]?.text ?? q).replace(/\?$/, '')}: ${answers[q] === 'yes' ? 'yes' : 'no'}`).join(' · ')}. Use what-if below to see the effect of changing these.
          </p>
        )}
        <div style={{ marginTop: '.5rem' }}>
          {rows.map((row) => row.group
            ? <ConditionGroup key={`${row.region}-${row.group[0]}`} {...{ row, answers, change, setAnswer, showHelp, multi }} />
            : <QuestionRow key={row.q} q={row.q} value={change.answers?.[row.q]} onChange={(v) => setAnswer(row.q, v)} next={row.next} showHelp={showHelp} regions={multi ? row.regions : null} />)}
          {rows.length === 0 && <p className="small muted">No questions: the rules give one answer for this change.</p>}
        </div>
      </div>
      <div className="grid-2" style={{ gridTemplateColumns: multi ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', alignItems: 'start' }}>
        {k.regions.map((r) => <Result key={r} {...{ pack: packs[r], r: classify(packs[r], change.changeId, answers), showCites, product, region: r, multi }} />)}
      </div>
      {(!mission || k.mission?.submitted) && k.regions.map((r) => {
        const res = classify(packs[r], change.changeId, answers);
        return res.status === 'done' ? <WhatIf key={r} {...{ pack: packs[r], change, answers, region: multi ? r : null }} /> : null;
      })}
    </div>
  );
}

function QuestionRow({ q, value, onChange, next, showHelp, regions }) {
  const def = QUESTIONS[q];
  const opts = optionsFor(q);
  const choice = def?.type === 'choice';
  const name = `q-${q}`;
  return (
    <div className={`qrow${next ? ' next' : ''}`}>
      <fieldset>
        <legend>{def?.text ?? q}{regions && <span className="small muted"> ({regions.map(short).join(', ')})</span>}</legend>
        <div className={`opts${choice ? ' choice' : ''}`}>
          {opts.map((o) => <label key={o.value}><input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} /> {o.label}</label>)}
          <label><input type="radio" name={name} checked={value === 'unknown'} onChange={() => onChange('unknown')} /> Not known</label>
        </div>
        {showHelp && def?.help && <p className="small muted" style={{ margin: '.35rem 0 0' }}>{def.help}</p>}
      </fieldset>
    </div>
  );
}

function ConditionGroup({ row, answers, change, setAnswer, showHelp, multi }) {
  const { pack, group, region, next } = row;
  const code = conditionCode(group[0]).replace(/ condition \d+$/, '');
  return (
    <div className="qrow">
      <fieldset className="conditions">
        <legend>{multi ? `${short(region)}: ` : ''}Conditions for {code}{showHelp && <span className="small muted"> · the lower category needs every condition met</span>}</legend>
        {group.map((q) => {
          const auto = autoKey(pack, q);
          const val = answerOf(pack, q, answers);
          const n = q.match(/:(\d+)$/)[1];
          return (
            <div key={q} className={`cond${next === q ? ' next' : ''}`}>
              <p style={{ margin: '0 0 .25rem' }}><strong>{n}.</strong> {questionText(pack, q)}</p>
              {auto ? (
                <p className="from-product" style={{ margin: 0 }}>From the product profile: {val === 'yes' ? 'met' : 'not met'}.</p>
              ) : (
                <div className="opts">
                  {[['yes', 'Met'], ['no', 'Not met'], ['unknown', 'Not known']].map(([v, l]) => (
                    <label key={v}><input type="radio" name={`c-${change.id}-${q}`} checked={(change.answers?.[q] ?? null) === v} onChange={() => setAnswer(q, v)} /> {l}</label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}

function Result({ pack, r, showCites, product, region, multi }) {
  const head = multi ? <p className="small" style={{ margin: '0 0 .4rem' }}><strong>{regionOf(region).label}</strong> · edition {pack.edition}</p> : null;
  if (r.status === 'missing') return <div className="result">{head}<p className="small" style={{ margin: 0 }}>The {pack.label} pack, edition {pack.edition}, does not model this change{pack.status === 'superseded' ? ' (the 2013 transition edition covers the most common changes only)' : ''}.</p></div>;
  if (r.status === 'range') {
    return (
      <div className="result" aria-live="polite">
        {head}
        <h3 style={{ margin: 0 }}>Not settled yet</h3>
        <p className="small">Depending on the answers still open, this change is between <Range pack={pack} min={r.min} max={r.max} /></p>
        <p className="small muted">Open: {r.missing.map((q) => questionText(pack, q)).join(' · ')}</p>
      </div>
    );
  }
  const o = r.outcome;
  const cat = categoryOf(pack, r.category);
  return (
    <div className={`result tone-${toneOf(pack, r.category)}`} aria-live="polite">
      {head}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row"><Cat pack={pack} id={r.category} big label="long" /><Badge pack={pack} id={r.category} /></div>
        {!multi && <span className="small muted">{pack.region} · edition {pack.edition}</span>}
      </div>
      <Ladder pack={pack} id={r.category} />
      <p style={{ margin: '.25rem 0 .5rem' }}><strong>{o.why}</strong></p>
      {showCites && <p style={{ margin: 0 }}><Cite pack={pack} src={o.src} at={o.at} /></p>}
      <h4 className="small" style={{ margin: '.9rem 0 .2rem', color: 'var(--ink-3)' }}>Reason trail</h4>
      <ol className="trail">
        {r.steps.map((s) => <li key={s.q}><span>{s.cond ? `${conditionCode(s.q)}: ` : ''}{s.text} <strong>{s.answer}</strong>{s.fromProduct ? <span className="muted"> (product profile)</span> : null}</span></li>)}
        <li className="final"><span>{cat.label}: {o.why}</span></li>
      </ol>
      <p className="small" style={{ margin: '.5rem 0 0' }}><strong>When you can implement:</strong> {o.rule?.text} {showCites && o.rule && <Cite pack={pack} src={o.rule.src} at={o.rule.at} />}</p>
      {o.pi && <p className="small" style={{ margin: '.3rem 0 0' }}>The product information changes too.</p>}
      {o.notes.map((n) => <div key={n} className="note">Simplification or caution: {n}</div>)}
      {r.clock === '505o4' && <div className="note">Clock: respond within 30 days of FDA's notification. Set the notification date in the filing plan.</div>}
    </div>
  );
}

function WhatIf({ pack, change, answers, region }) {
  const w = useMemo(() => whatIfs(pack, change.changeId, answers), [pack, change.changeId, answers]);
  const routes = useMemo(() => lowerRoutes(pack, change.changeId, answers), [pack, change.changeId, answers]);
  const changing = w.filter((x) => x.changes);
  return (
    <details className="panel">
      <summary><strong>What if?{region ? ` ${regionOf(region).label}` : ''}</strong> <span className="small muted">{changing.length} answer(s) would change the category</span></summary>
      {changing.length === 0 ? <p className="small muted">No single answer on this path changes the category.</p> : (
        <ul className="whatif">
          {changing.map((x) => (
            <li key={`${x.q}-${x.to}`}>
              If {x.cond ? <>the condition <em>{x.text}</em> were <strong>{x.toLabel.toLowerCase()}</strong></> : <>the answer to <em>{x.text}</em> were <strong>{x.toLabel}</strong></>}{x.fromProduct ? ' (a different product)' : ''}: {x.category ? <Cat pack={pack} id={x.category} /> : <Range pack={pack} min={x.range[0]} max={x.range[1]} />}
            </li>
          ))}
        </ul>
      )}
      {routes.length > 0 && (
        <>
          <h4 className="small" style={{ margin: '.75rem 0 .3rem' }}>Routes to a lower category</h4>
          <ul className="small">{routes.map((x) => <li key={x.text}>{x.text}</li>)}</ul>
        </>
      )}
    </details>
  );
}

// ---------------------------------------------------------------- Filing plan
function PlanTab({ k, packs, product, mutate, reveal, mission }) {
  const { user, toast, products } = useApp();
  const [region, setRegion] = useState(k.regions[0]);
  const r = k.regions.includes(region) ? region : k.regions[0];
  const pack = packs[r];
  const { filings, pending } = filingsFor(pack, product, k);
  const has505 = k.changes.some((c) => pack.entries[c.changeId]?.clock === '505o4');
  const anyPAS = filings.some((f) => ['PAS', 'NEW'].includes(f.category)) || (r === 'jp' && filings.some((f) => ['PCA', 'NEW'].includes(f.category) && f.kind === 'efficacy'));
  const anyII = filings.some((f) => categoryOf(pack, f.category)?.implement === 'wait-for-approval' && ['eu', 'ch', 'who', 'ca', 'jp'].includes(r) && !['ADMIN'].includes(f.category));
  const eu = isEU(pack);
  const relatedText = { us: 'in the most restrictive category, guidance section XII', eu: 'a group follows its highest type', ch: 'a multiple application follows the longest time limit', in: 'one application, explained together', ca: 'the filing takes the highest level', jp: 'one partial change application covers them', who: 'a grouped variation takes the highest category' }[r];
  const apartText = { us: 'annual report items share the annual report', eu: 'Type IA items share the annual update', ch: 'Type IA items can be collected over the year', in: 'Level III items share the annual notification', ca: 'Level III items can share an annual notification', jp: 'minor change notifications can be filed together', who: 'annual notifications are grouped once a year' }[r];
  const others = products.filter((p) => p.id !== product.id && p.eu);
  const exportPkg = (f) => {
    const pkg = buildChangePackage({ pack, product, kase: k, filing: f, user });
    if (!pkg) { toast('This filing has no eCTD sequence in the eCTD Dossier Builder.'); return; }
    const slug = `${product.brandName}-${pack.region}-${f.category}-${k.submitDate}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    download(`change-package-${slug}.json`, JSON.stringify(pkg, null, 2));
    toast('Change package saved. In the eCTD Dossier Builder, open the project for this product and region, then use "Import change package" on the Sequences tab.');
  };
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      {k.regions.length > 1 && (
        <div className="seg" role="group" aria-label="Region">
          {k.regions.map((x) => <button key={x} aria-pressed={x === r} onClick={() => setRegion(x)}>{regionOf(x).label}</button>)}
        </div>
      )}
      <section className="panel stack">
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>Plan: {regionOf(r).label}</h2>
        <div className="grid-2">
          <label className="field">Submission (or implementation) date
            <input type="text" inputMode="numeric" pattern="\d{4}-\d{2}-\d{2}" value={k.submitDate} onChange={(e) => mutate((x) => { x.submitDate = e.target.value; })} disabled={!!mission} aria-describedby="date-help" />
            <small id="date-help">yyyy-mm-dd. For do-and-tell changes, the date the change is made.{eu ? ' The EU edition follows this date.' : ''}</small>
          </label>
          {!mission && (
            <label className="field">Planned date of use (optional)
              <input type="text" inputMode="numeric" placeholder="yyyy-mm-dd" value={k.plannedUse ?? ''} onChange={(e) => mutate((x) => { x.plannedUse = e.target.value; })} />
              <small>The app warns if this comes before the rules allow.</small>
            </label>
          )}
          {has505 && (
            <label className="field">Date of FDA's 505(o)(4) notification
              <input type="text" inputMode="numeric" placeholder="yyyy-mm-dd" value={k.options?.notificationDate ?? ''} disabled={!!mission} onChange={(e) => mutate((x) => { x.options.notificationDate = e.target.value; })} />
            </label>
          )}
          {eu && anyII && (
            <label className="field">Clock stop for responses (days)
              <input type="number" min="0" max="365" value={k.options?.clockStop ?? 0} disabled={!!mission} onChange={(e) => mutate((x) => { x.options.clockStop = Math.max(0, Number(e.target.value) || 0); })} />
              <small>Time the holder takes to answer questions; the clock stops meanwhile.</small>
            </label>
          )}
        </div>
        {anyPAS && (
          <div className="row">
            <label className="row small"><input type="checkbox" checked={!!k.options?.priority} onChange={(e) => mutate((x) => { x.options.priority = e.target.checked; })} /> Priority review (indications and new applications)</label>
            {r === 'us' && <label className="row small"><input type="checkbox" checked={!!k.options?.inspection} onChange={(e) => mutate((x) => { x.options.inspection = e.target.checked; })} /> Inspection needed (ANDA prior approval supplements)</label>}
          </div>
        )}
        {k.changes.length > 1 && (
          <fieldset className="small" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>Are the changes related?</legend>
            <label className="row"><input type="radio" name="related" checked={!!k.related} onChange={() => mutate((x) => { x.related = true; })} /> Yes: file them together ({relatedText})</label>
            <label className="row"><input type="radio" name="related" checked={!k.related} onChange={() => mutate((x) => { x.related = false; })} /> No: file each on its own; {apartText}</label>
          </fieldset>
        )}
        {eu && !mission && others.length > 0 && (
          <fieldset className="small" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>The same change for other authorisations of the holder (worksharing or super-grouping)</legend>
            <div className="row">
              {others.map((p) => (
                <label key={p.id} className="row" style={{ gap: '.3rem' }}>
                  <input type="checkbox" checked={(k.alsoProducts ?? []).includes(p.id)} onChange={(e) => mutate((x) => { const s = new Set(x.alsoProducts ?? []); e.target.checked ? s.add(p.id) : s.delete(p.id); x.alsoProducts = [...s]; })} />
                  {p.brandName} <span className="muted">({euRoute(p)})</span>
                </label>
              ))}
            </div>
            <small className="muted">For training the app lets you pick any product; in practice all must belong to the same holder.</small>
          </fieldset>
        )}
      </section>

      {pending.length > 0 && (
        <div className="callout warn">
          {pending.length} change(s) not classified for {regionOf(r).label} yet: {pending.map((p) => CHANGE[p.change.changeId].title).join('; ')}. {pending.some((p) => p.result.status === 'missing') ? 'Some are not modelled in this pack edition. ' : ''}Answer the open questions on the Classify tab.
        </div>
      )}
      {filings.length === 0 && pending.length === 0 && <p className="muted">Add a change on the Classify tab.</p>}
      {filings.map((f) => <Filing key={`${r}-${f.id}-${f.category}-${f.items.length}`} {...{ f, k, pack, product, mutate, reveal, exportPkg, region: r }} />)}
    </div>
  );
}

const FILING_LABEL = {
  IN: (f) => ({ REC: 'Record of change (no submission)', L3: 'Annual notification', NEWDRUG: 'New drug permission application', ADMIN: 'Administrative change application' })[f.category] ?? 'Post-approval change application',
  US: (f) => (f.category === 'AR' ? 'Annual report' : f.category === 'LETTER' ? 'Letter' : f.kind === 'efficacy' ? 'Efficacy supplement' : f.kind === 'labeling' ? 'Labeling supplement' : 'CMC supplement'),
  EU: (f) => ({ NONE: 'No submission', OTHER: 'Other procedure', IA: f.items.length > 1 ? 'Type IA notification (annual update)' : 'Type IA notification', IAIN: 'Type IA-IN notification', IB: 'Type IB notification', II: 'Type II variation', EXT: 'Extension application' })[f.category],
};
const MODE_LABEL = { grouping: 'Group of variations', 'single-notification': 'Several Type IA changes in one notification', worksharing: 'Worksharing', 'super-grouping': 'Super-grouping' };

function Filing({ f, k, pack, product, mutate, reveal, exportPkg, region }) {
  const cat = categoryOf(pack, f.category);
  const ectd = ectdFor(pack, f, product);
  const tl = timelineFor(pack, product, f, { submitDate: k.submitDate, priority: k.options?.priority, inspection: k.options?.inspection, notificationDate: k.options?.notificationDate, clockStop: k.options?.clockStop, plannedUse: k.plannedUse });
  const impact = impactFor(pack, f);
  const key = (code) => `${region}:${f.items.map((i) => i.change.id).join('+')}:${code}`;
  const done = impact.filter((e) => k.checks?.[key(e.code)]).length;
  const label = FILING_LABEL[pack.region]?.(f) ?? (noFiling(pack, f.category) ? 'No submission' : cat.label);
  const submits = !noFiling(pack, f.category);
  return (
    <section className={`filing tone-${toneOf(pack, f.category)}`} aria-label={`${label}: ${cat.label}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>{label} <Cat pack={pack} id={f.category} label="long" /></h2>
        <Badge pack={pack} id={f.category} />
      </div>
      {MODE_LABEL[f.mode] && <p className="small" style={{ margin: '.4rem 0 0' }}><span className="pill">{MODE_LABEL[f.mode]}</span></p>}
      <ul className="small" style={{ margin: '.5rem 0' }}>{f.items.map((i) => <li key={i.change.id}>{i.def.title}{i.change.note ? `: ${i.change.note}` : ''} <Cat pack={pack} id={i.result.category} /> <span className="muted">{i.result.outcome?.at}</span></li>)}</ul>
      {f.warnings?.map((w) => <div key={w} className="note">{w}</div>)}
      {submits && ectd && <p className="small muted" style={{ margin: '.5rem 0 0' }}>eCTD: submission type <code>{ectd.submissionType}</code>, sub-type <code>{ectd.subType}</code>{ectd.submissionMode ? <>, mode <code>{ectd.submissionMode}</code></> : null}.</p>}
      {submits && !ectd && <p className="small muted" style={{ margin: '.5rem 0 0' }}>{region === 'who' ? 'WHO PQ variations are filed with the PQ variation form and documents, not as a sequence in the eCTD Dossier Builder.' : 'Filed as a notification outside an eCTD sequence.'}</p>}

      {reveal ? (
        <>
          <h3 className="small" style={{ margin: '1rem 0 .3rem' }}>Dates</h3>
          <ul className="events">{tl.events.map((e) => <li key={e.date + e.label} className={e.kind}><time dateTime={e.date}>{e.date}</time><span>{e.label}</span></li>)}</ul>
          {tl.notes.map((n) => <p key={n} className="small muted" style={{ margin: '.2rem 0' }}>{n}</p>)}
          {impact.length > 0 && (
            <>
              <h3 className="small" style={{ margin: '1rem 0 .3rem' }}>Documents and CTD sections <span className="muted">({done} of {impact.length} ready)</span></h3>
              <ul className="checklist">
                {impact.map((e) => (
                  <li key={e.code}>
                    <label>
                      <input type="checkbox" checked={!!k.checks?.[key(e.code)]} onChange={(ev) => mutate((x) => { x.checks = { ...x.checks, [key(e.code)]: ev.target.checked }; })} />
                      <code>{displayCode(e.code)}</code>
                      <span>{e.label} <span className={`op ${e.op}`}>{e.op}</span><span className="muted"> · {e.why.join('; ')}</span></span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
          {submits && (
            <details style={{ marginTop: '1rem' }}>
              <summary className="small"><strong>Cover letter draft</strong></summary>
              <pre className="letter" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font)' }}>{coverLetter(pack, product, f, k)}</pre>
            </details>
          )}
          {submits && ectd && (
            <div className="row no-print" style={{ marginTop: '1rem' }}>
              <button className="btn primary" onClick={() => exportPkg(f)}>Export change package for the eCTD Dossier Builder</button>
            </div>
          )}
        </>
      ) : (
        <p className="small muted" style={{ marginTop: '.75rem' }}>Dates, documents and CTD sections are hidden until you submit the mission.</p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Mission
function MissionTab({ k, pack, product, mission, mutate }) {
  const { saveAttempt, toast } = useApp();
  const codes = useMemo(() => {
    const all = new Set(Object.values(EVIDENCE).map((e) => e.ctd));
    for (const list of Object.values(pack.m1)) for (const d of list) all.add(d.code);
    return [...all].sort(cmpCode);
  }, [pack]);
  const labelOf = (code) => Object.values(EVIDENCE).find((e) => e.ctd === code)?.label ?? Object.values(pack.m1).flat().find((d) => d.code === code)?.label ?? code;
  const picked = new Set(k.mission?.ctd ?? []);
  const sub = k.mission?.submitted;
  const toggle = (code) => mutate((x) => { const s = new Set(x.mission.ctd); s.has(code) ? s.delete(code) : s.add(code); x.mission.ctd = [...s].sort(cmpCode); });
  const submit = async () => {
    const res = scoreMission(mission, k);
    const store = { score: res.score, parts: res.parts, feedback: res.feedback, at: new Date().toISOString() };
    mutate((x) => { x.mission.submitted = store; });
    await saveAttempt({ kind: 'mission', missionId: mission.id, region: mission.region, difficulty: k.difficulty, score: res.score, parts: res.parts, caseId: k.id });
    toast(`Mission ${mission.id}: ${res.score}/100.`);
  };
  const truth = sub ? scoreMission(mission, k).truth : null;
  const dateLabel = mission.timeline === 'due505' ? 'Date the response is due' : mission.timeline === 'notify' ? 'Latest date to notify the change' : pack.id === 'us' ? 'Earliest date of use, or FDA goal date for a prior approval supplement' : 'Earliest date the change can be implemented (or the review target date)';
  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>Mission {mission.id}: {mission.title}</h2>
        <p>{mission.brief}</p>
        <p className="small"><strong>Your task:</strong> {mission.goal}</p>
        <p className="small muted">Classify each change on the Classify tab{k.changes.length > 1 ? ' and decide on the Filing plan tab whether they are related' : ''}. Then answer below{k.changes.length > 1 ? ' for the main filing (the one in the highest category)' : ''} and submit.</p>
      </section>
      <fieldset className="panel" disabled={!!sub}>
        <legend style={{ fontWeight: 700 }}>CTD sections the {k.changes.length > 1 ? 'main ' : ''}filing updates, Module 1 included</legend>
        <div className="topic-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {codes.map((c) => (
            <label key={c} className="small row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <input type="checkbox" checked={picked.has(c)} onChange={() => toggle(c)} />
              <span><code>{displayCode(c)}</code> {labelOf(c)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="panel" disabled={!!sub}>
        <legend style={{ fontWeight: 700 }}>{dateLabel}</legend>
        <input type="text" inputMode="numeric" placeholder="yyyy-mm-dd" value={k.mission?.date ?? ''} onChange={(e) => mutate((x) => { x.mission.date = e.target.value.trim(); })} style={{ maxWidth: 200 }} aria-label={dateLabel} />
      </fieldset>
      {!sub ? (
        <div className="row"><button className="btn primary" onClick={submit}>Submit the mission</button><span className="small muted">You can retry from the Missions page; your best score counts.</span></div>
      ) : (
        <section className="panel">
          <div className="row"><span className="score-big">{sub.score}</span><span className="muted">/ 100</span></div>
          <p className="small">Categories {sub.parts.categories}/40 · Reasons {sub.parts.reasons}/20 · CTD sections {sub.parts.ctd}/20 · Date {sub.parts.date}/20</p>
          <ul className="acks">{sub.feedback.map((f) => <li key={f.text} className={f.ok ? '' : 'bad'}>{f.text}</li>)}</ul>
          <h3 style={{ fontSize: 'var(--step-1)' }}>Debrief</h3>
          <p>{mission.debrief}</p>
          {truth && <p className="small">Expected: {truth.filings.map((f) => categoryOf(pack, f.category).label).join(' + ')}; {truth.dateLabel}: {truth.date}. Citations and what-if are now shown on the Classify tab.</p>}
          <div className="row"><a className="btn" href="#/missions">Back to missions</a></div>
        </section>
      )}
    </div>
  );
}
