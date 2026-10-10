import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { packFor, CHANGE, GROUP, QUESTIONS, EVIDENCE, changesFor, searchChanges, optionsFor, categoryOf } from '../engine/packs.js';
import { classify, nextQuestion, whatIfs, lowerRoutes, FROM_PRODUCT } from '../engine/classify.js';
import { answersFor, filingsFor, impactFor, timelineFor, coverLetter, ectdFor, cmpCode } from '../engine/filing.js';
import { buildChangePackage } from '../engine/handoff.js';
import { addChange } from '../engine/model.js';
import { download } from '../engine/io.js';
import { missionById, scoreMission, LEVELS } from '../engine/missions.js';
import { Cat, Range, Ladder, Cite, Badge } from '../components/ui.jsx';

export default function CaseView({ id }) {
  const { cases, productById, saveCase } = useApp();
  const stored = cases.find((c) => c.id === id);
  const [k, setK] = useState(() => (stored ? structuredClone(stored) : null));
  const [tab, setTab] = useState('classify');
  const [sel, setSel] = useState(() => stored?.changes[0]?.id ?? null);
  if (!k) return <div className="page"><h1>Case not found</h1><p><a href="#/">Back to your cases</a></p></div>;
  const product = productById(k.productId);
  const pack = packFor(k.pack.id, { edition: k.pack.edition }) ?? packFor('us');
  if (!product) return <div className="page"><h1>Product missing</h1><p>The product for this case was deleted. <a href="#/">Back</a></p></div>;
  const mission = k.missionId ? missionById(k.missionId) : null;
  const submitted = !!k.mission?.submitted;
  const level = k.difficulty ?? 'standard';
  const showHelp = !mission || level !== 'expert' || submitted;
  const showCites = !mission || level === 'guided' || submitted;
  const reveal = !mission || level === 'guided' || submitted;

  const mutate = (fn) => {
    const next = structuredClone(k);
    fn(next);
    setK(next);
    saveCase(next);
  };
  const selected = k.changes.find((c) => c.id === sel) ?? k.changes[0];
  const tabs = [['classify', 'Classify'], ['plan', 'Filing plan'], ...(mission ? [['mission', submitted ? 'Mission result' : 'Submit mission']] : [])];

  return (
    <div className="ws">
      <div className="ws-head">
        <div className="ws-title">
          <div style={{ minWidth: 0 }}>
            <p className="small" style={{ margin: 0 }}><a href={mission ? '#/missions' : '#/'}>{mission ? 'Missions' : 'Cases'}</a> /</p>
            <h1>
              {mission ? k.name : (
                <input aria-label="Case name" value={k.name} onChange={(e) => mutate((x) => { x.name = e.target.value; })}
                  style={{ font: 'inherit', border: 0, background: 'transparent', padding: 0, width: '100%', minWidth: 0 }} />
              )}
            </h1>
            <p className="small muted" style={{ margin: 0 }}>
              {product.brandName} ({product.inn}) · {product.dosageForm} · {product.appType.toUpperCase()} {product.applicationNumber} (fictional) · {pack.label}, pack edition {pack.edition}
            </p>
          </div>
          <div className="row no-print">
            <button className="btn small" onClick={() => window.print()}>Print or save as PDF</button>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Case views">
          {tabs.map(([t, l]) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}</button>)}
        </div>
      </div>
      {mission && (
        <div className="mission-bar">
          <strong>Mission {mission.id}</strong>
          <span>Level: {LEVELS.find((l) => l.id === level)?.label}</span>
          {submitted && <span>Score: <strong>{k.mission.submitted.score}</strong>/100</span>}
        </div>
      )}
      <div className="ws-body">
        {mission && tab !== 'mission' && (
          <details className="panel" open={tab === 'classify'} style={{ marginBottom: '1rem' }}>
            <summary><strong>Brief</strong></summary>
            <p style={{ marginTop: '.5rem' }}>{mission.brief}</p>
            <p className="small"><strong>Your task:</strong> {mission.goal}</p>
          </details>
        )}
        {tab === 'classify' && (
          <ClassifyTab {...{ k, pack, product, selected, setSel, mutate, showHelp, showCites, mission }} />
        )}
        {tab === 'plan' && <PlanTab {...{ k, pack, product, mutate, reveal, mission }} />}
        {tab === 'mission' && mission && <MissionTab {...{ k, pack, product, mission, mutate }} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Classify
function ClassifyTab({ k, pack, product, selected, setSel, mutate, showHelp, showCites, mission }) {
  const [adding, setAdding] = useState(k.changes.length === 0);
  return (
    <div className="case-grid">
      <aside className="stack" aria-label="Changes in this case">
        <div className="change-list">
          {k.changes.map((c) => {
            const r = classify(pack, c.changeId, answersFor(product, c));
            return (
              <button key={c.id} className="change-item" aria-current={selected?.id === c.id} onClick={() => { setSel(c.id); setAdding(false); }}>
                <span className="t">{CHANGE[c.changeId]?.title}</span>
                {c.note && <span className="small muted">{c.note}</span>}
                <span>{r.status === 'done' ? <Cat pack={pack} id={r.category} /> : r.status === 'range' ? <Range pack={pack} min={r.min} max={r.max} /> : null}</span>
              </button>
            );
          })}
        </div>
        {!mission && <button className="btn" onClick={() => setAdding(true)}>Add a change</button>}
        {k.changes.length > 1 && <p className="small muted">{k.changes.length} changes. See the filing plan for how they are filed.</p>}
      </aside>
      <section>
        {adding && !mission ? (
          <AddChange product={product} onAdd={(changeId) => { let id; mutate((x) => { id = addChange(x, changeId).id; if (x.changes.length === 1 && /: change$/.test(x.name)) x.name = `${product.brandName}: ${CHANGE[changeId].title}`; }); setSel(id); setAdding(false); }} onCancel={k.changes.length ? () => setAdding(false) : null} />
        ) : selected ? (
          <ChangePanel key={selected.id} {...{ k, pack, product, change: selected, mutate, showHelp, showCites, mission }} />
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

// The questions on the answered path, plus the next one.
function pathQuestions(pack, changeId, answers) {
  const out = [];
  let node = pack.entries[changeId]?.tree;
  while (node && !node.cat) {
    out.push(node.ask);
    const a = answers[node.ask];
    if (a == null || a === 'unknown' || !node.on[a]) break;
    node = node.on[a];
  }
  return out;
}

function ChangePanel({ k, pack, product, change, mutate, showHelp, showCites, mission }) {
  const def = CHANGE[change.changeId];
  const answers = answersFor(product, change);
  const r = classify(pack, change.changeId, answers);
  const qs = pathQuestions(pack, change.changeId, answers);
  const next = nextQuestion(pack, change.changeId, answers);
  const productQs = qs.filter((q) => FROM_PRODUCT.has(q));
  const ownQs = qs.filter((q) => !FROM_PRODUCT.has(q));
  const setAnswer = (q, v) => mutate((x) => {
    const c = x.changes.find((y) => y.id === change.id);
    c.answers = { ...c.answers, [q]: v };
  });
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
        {productQs.length > 0 && (
          <p className="from-product" style={{ marginTop: '.75rem' }}>
            From the product profile: {productQs.map((q) => `${QUESTIONS[q].text.replace(/\?$/, '')}: ${answers[q] === 'yes' ? 'yes' : 'no'}`).join(' · ')}. Use what-if below to see the effect of changing these.
          </p>
        )}
        <div style={{ marginTop: '.5rem' }}>
          {ownQs.map((q) => <QuestionRow key={q} q={q} value={change.answers?.[q]} onChange={(v) => setAnswer(q, v)} next={q === next} showHelp={showHelp} />)}
          {ownQs.length === 0 && r.status === 'done' && <p className="small muted">No questions: the rules give one answer for this change.</p>}
        </div>
      </div>
      <Result {...{ pack, r, showCites, product }} />
      {r.status === 'done' && (!mission || k.mission?.submitted) && <WhatIf {...{ pack, change, answers }} />}
    </div>
  );
}

function QuestionRow({ q, value, onChange, next, showHelp }) {
  const def = QUESTIONS[q];
  const opts = optionsFor(q);
  const choice = def.type === 'choice';
  const name = `q-${q}`;
  return (
    <div className={`qrow${next ? ' next' : ''}`}>
      <fieldset>
        <legend>{def.text}</legend>
        <div className={`opts${choice ? ' choice' : ''}`}>
          {opts.map((o) => (
            <label key={o.value}><input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} /> {o.label}</label>
          ))}
          <label><input type="radio" name={name} checked={value === 'unknown'} onChange={() => onChange('unknown')} /> Not known</label>
        </div>
        {showHelp && def.help && <p className="small muted" style={{ margin: '.35rem 0 0' }}>{def.help}</p>}
      </fieldset>
    </div>
  );
}

function Result({ pack, r, showCites, product }) {
  if (r.status === 'missing') return <div className="callout warn">This pack has no entry for the change.</div>;
  if (r.status === 'range') {
    return (
      <div className="result" aria-live="polite">
        <h3 style={{ margin: 0 }}>Not settled yet</h3>
        <p className="small">Depending on the answers still open, this change is between <Range pack={pack} min={r.min} max={r.max} /></p>
        <p className="small muted">Open questions: {r.missing.map((q) => QUESTIONS[q]?.text).join(' ')}</p>
      </div>
    );
  }
  const o = r.outcome;
  const cat = categoryOf(pack, r.category);
  return (
    <div className={`result cat-${r.category}`} aria-live="polite">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row"><Cat pack={pack} id={r.category} big label="long" /><Badge pack={pack} id={r.category} /></div>
        <span className="small muted">{product.appType.toUpperCase()} · {pack.region}</span>
      </div>
      <Ladder pack={pack} id={r.category} />
      <p style={{ margin: '.25rem 0 .5rem' }}><strong>{o.why}</strong></p>
      {showCites && <p style={{ margin: 0 }}><Cite pack={pack} src={o.src} at={o.at} /></p>}
      <h4 className="small" style={{ margin: '.9rem 0 .2rem', color: 'var(--ink-3)' }}>Reason trail</h4>
      <ol className="trail">
        {r.steps.map((s) => <li key={s.q}><span>{s.text} <strong>{s.answer}</strong>{s.fromProduct ? <span className="muted"> (product profile)</span> : null}</span></li>)}
        <li className="final"><span>{cat.label}: {o.why}</span></li>
      </ol>
      <p className="small" style={{ margin: '.5rem 0 0' }}><strong>When you can implement:</strong> {o.rule?.text} {showCites && o.rule && <Cite pack={pack} src={o.rule.src} at={o.rule.at} />}</p>
      {o.notes.map((n) => <div key={n} className="note">Simplification or caution: {n}</div>)}
      {r.clock === '505o4' && <div className="note">Clock: respond within 30 days of FDA's notification. Set the notification date in the filing plan.</div>}
    </div>
  );
}

function WhatIf({ pack, change, answers }) {
  const w = useMemo(() => whatIfs(pack, change.changeId, answers), [pack, change.changeId, answers]);
  const routes = useMemo(() => lowerRoutes(pack, change.changeId, answers), [pack, change.changeId, answers]);
  const changing = w.filter((x) => x.changes);
  return (
    <details className="panel">
      <summary><strong>What if?</strong> <span className="small muted">{changing.length} answer(s) would change the category</span></summary>
      {changing.length === 0 ? <p className="small muted">No single answer on this path changes the category.</p> : (
        <ul className="whatif">
          {changing.map((x) => (
            <li key={`${x.q}-${x.to}`}>
              If the answer to <em>{x.text}</em> were <strong>{x.toLabel}</strong>{x.fromProduct ? ' (a different product)' : ''}: {x.category ? <Cat pack={pack} id={x.category} /> : <Range pack={pack} min={x.range[0]} max={x.range[1]} />}
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
function PlanTab({ k, pack, product, mutate, reveal, mission }) {
  const { user, toast } = useApp();
  const { filings, pending } = filingsFor(pack, product, k);
  const has505 = k.changes.some((c) => pack.entries[c.changeId]?.clock === '505o4');
  const anyPAS = filings.some((f) => f.category === 'PAS');
  const exportPkg = (f) => {
    const pkg = buildChangePackage({ pack, product, kase: k, filing: f, user });
    const slug = `${product.brandName}-${f.category}-${k.submitDate}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    download(`change-package-${slug}.json`, JSON.stringify(pkg, null, 2));
    toast('Change package saved. In the eCTD Dossier Builder, open the project for this product and use "Import change package".');
  };
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      <section className="panel stack">
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>Plan</h2>
        <div className="grid-2">
          <label className="field">Submission (or implementation) date
            <input type="text" inputMode="numeric" pattern="\d{4}-\d{2}-\d{2}" value={k.submitDate} onChange={(e) => mutate((x) => { x.submitDate = e.target.value; })} disabled={!!mission} aria-describedby="date-help" />
            <small id="date-help">yyyy-mm-dd. For annual report items, the date the change is made.</small>
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
        </div>
        {anyPAS && (
          <div className="row">
            <label className="row small"><input type="checkbox" checked={!!k.options?.priority} onChange={(e) => mutate((x) => { x.options.priority = e.target.checked; })} /> Priority review (efficacy supplements)</label>
            <label className="row small"><input type="checkbox" checked={!!k.options?.inspection} onChange={(e) => mutate((x) => { x.options.inspection = e.target.checked; })} /> Inspection needed (ANDA prior approval supplements)</label>
          </div>
        )}
        {k.changes.length > 1 && (
          <fieldset className="small" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600 }}>Are the changes related?</legend>
            <label className="row"><input type="radio" name="related" checked={!!k.related} onChange={() => mutate((x) => { x.related = true; })} /> Yes: file them together, in the most restrictive category ({pack.multipleChanges.src === 'g04' ? 'guidance section XII' : pack.multipleChanges.at})</label>
            <label className="row"><input type="radio" name="related" checked={!k.related} onChange={() => mutate((x) => { x.related = false; })} /> No: file each on its own; annual report items share the annual report</label>
          </fieldset>
        )}
      </section>

      {pending.length > 0 && (
        <div className="callout warn">
          {pending.length} change(s) not classified yet: {pending.map((p) => CHANGE[p.change.changeId].title).join('; ')}. Answer the open questions on the Classify tab.
        </div>
      )}
      {filings.length === 0 && pending.length === 0 && <p className="muted">Add a change on the Classify tab.</p>}
      {filings.map((f) => <Filing key={f.id + f.category + f.items.length} {...{ f, k, pack, product, mutate, reveal, exportPkg, mission }} />)}
    </div>
  );
}

function Filing({ f, k, pack, product, mutate, reveal, exportPkg, mission }) {
  const cat = categoryOf(pack, f.category);
  const ectd = ectdFor(pack, f);
  const tl = timelineFor(pack, product, f, { submitDate: k.submitDate, priority: k.options?.priority, inspection: k.options?.inspection, notificationDate: k.options?.notificationDate, plannedUse: k.plannedUse });
  const impact = impactFor(pack, f);
  const key = (code) => `${f.items.map((i) => i.change.id).join('+')}:${code}`;
  const done = impact.filter((e) => k.checks?.[key(e.code)]).length;
  const kindLabel = f.category === 'AR' ? 'Annual report' : f.category === 'LETTER' ? 'Letter' : f.kind === 'efficacy' ? 'Efficacy supplement' : f.kind === 'labeling' ? 'Labeling supplement' : 'CMC supplement';
  return (
    <section className={`filing cat-${f.category}`} aria-label={`${kindLabel}: ${cat.label}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>{kindLabel} <Cat pack={pack} id={f.category} label="long" /></h2>
        <Badge pack={pack} id={f.category} />
      </div>
      <ul className="small" style={{ margin: '.5rem 0' }}>{f.items.map((i) => <li key={i.change.id}>{i.def.title}{i.change.note ? `: ${i.change.note}` : ''} <Cat pack={pack} id={i.result.category} /></li>)}</ul>
      <p className="small muted" style={{ margin: 0 }}>eCTD: submission type <code>{ectd.submissionType}</code>, sub-type <code>{ectd.subType}</code>.</p>

      {reveal ? (
        <>
          <h3 className="small" style={{ margin: '1rem 0 .3rem' }}>Dates</h3>
          <ul className="events">{tl.events.map((e) => <li key={e.date + e.label} className={e.kind}><time dateTime={e.date}>{e.date}</time><span>{e.label}</span></li>)}</ul>
          {tl.notes.map((n) => <p key={n} className="small muted" style={{ margin: '.2rem 0' }}>{n}</p>)}

          <h3 className="small" style={{ margin: '1rem 0 .3rem' }}>Documents and CTD sections <span className="muted">({done} of {impact.length} ready)</span></h3>
          <ul className="checklist">
            {impact.map((e) => (
              <li key={e.code}>
                <label>
                  <input type="checkbox" checked={!!k.checks?.[key(e.code)]} onChange={(ev) => mutate((x) => { x.checks = { ...x.checks, [key(e.code)]: ev.target.checked }; })} />
                  <code>{e.code}</code>
                  <span>{e.label} <span className={`op ${e.op}`}>{e.op}</span><span className="muted"> · {e.why.join('; ')}</span></span>
                </label>
              </li>
            ))}
          </ul>

          <details style={{ marginTop: '1rem' }}>
            <summary className="small"><strong>Cover letter draft</strong></summary>
            <pre className="letter" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font)' }}>{coverLetter(pack, product, f, k)}</pre>
          </details>
          <div className="row no-print" style={{ marginTop: '1rem' }}>
            <button className="btn primary" onClick={() => exportPkg(f)}>Export change package for the eCTD Dossier Builder</button>
          </div>
        </>
      ) : (
        <p className="small muted" style={{ marginTop: '.75rem' }}>Dates, documents and CTD sections are hidden until you submit the mission{mission ? '' : ''}.</p>
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
    await saveAttempt({ kind: 'mission', missionId: mission.id, difficulty: k.difficulty, score: res.score, parts: res.parts, caseId: k.id });
    toast(`Mission ${mission.id}: ${res.score}/100.`);
  };
  const truth = sub ? scoreMission(mission, k).truth : null;
  const dateLabel = mission.timeline === 'due505' ? 'Date the response is due' : 'Earliest date of use, or FDA goal date for a prior approval supplement';
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
              <span><code>{c}</code> {labelOf(c)}</span>
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
          {truth && (
            <p className="small">Expected: {truth.filings.map((f) => categoryOf(pack, f.category).label).join(' + ')}; {truth.dateLabel}: {truth.date}. Citations and what-if are now shown on the Classify tab.</p>
          )}
          <div className="row"><a className="btn" href="#/missions">Back to missions</a></div>
        </section>
      )}
    </div>
  );
}
