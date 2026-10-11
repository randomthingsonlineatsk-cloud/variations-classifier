import React, { useState } from 'react';
import { CHANGE, regionOf, categoryOf } from '../engine/packs.js';
import { addChange, today } from '../engine/model.js';
import { STEPS, suggestChanges, impactStatement } from '../engine/intake.js';
import { rolloutPlan } from '../engine/rollout.js';
import { rolloutRows, kindOf, STATUSES } from '../engine/labelling.js';
import { download } from '../engine/io.js';
import { Cat, Range } from '../components/ui.jsx';

// ---------------------------------------------------------------- Change request (intake)
export function IntakeTab({ k, product, mutate, goClassify, setSel }) {
  const it = k.intake;
  const set = (field) => (e) => mutate((x) => { x.intake[field] = e.target.value; });
  const desc = `${it.title} ${it.proposed} ${it.reason}`;
  const suggestions = suggestChanges(product, desc).filter((c) => !k.changes.some((x) => x.changeId === c.id));
  const statement = impactStatement(k, product);
  const unclassified = statement.regions.some((r) => r.pending);
  const [signer, setSigner] = useState('');
  const step = (n, note) => mutate((x) => { x.intake.step = n; x.intake.history = [...(x.intake.history ?? []), { step: STEPS[n], date: today(), note }]; });
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>Change request</h2>
          <ol className="steps" aria-label="Status">{STEPS.map((s, i) => <li key={s} className={i < it.step ? 'done' : i === it.step ? 'now' : ''} aria-current={i === it.step ? 'step' : undefined}>{s}</li>)}</ol>
        </div>
        <p className="small muted">A training change request, like the one a quality or manufacturing team raises. It is not a validated change control system.</p>
        <div className="grid-2">
          <label className="field">Title<input type="text" value={it.title} onChange={set('title')} placeholder="for example: second site for tablet compression" /></label>
          <label className="field">Raised by<input type="text" value={it.raisedBy} onChange={set('raisedBy')} placeholder="name (fictional)" /></label>
          <label className="field">Team
            <select value={it.team} onChange={set('team')}>{['Manufacturing', 'Quality control', 'Quality assurance', 'Supply chain', 'Safety', 'Regulatory'].map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="field">Planned implementation date<input type="text" inputMode="numeric" placeholder="yyyy-mm-dd" value={it.plannedDate} onChange={(e) => mutate((x) => { x.intake.plannedDate = e.target.value; x.plannedUse = e.target.value; })} /></label>
        </div>
        <div className="grid-2" style={{ marginTop: '.75rem' }}>
          <label className="field">Present state<textarea value={it.present} onChange={set('present')} style={{ minHeight: '5rem', fontFamily: 'var(--font)' }} /></label>
          <label className="field">Proposed state<textarea value={it.proposed} onChange={set('proposed')} style={{ minHeight: '5rem', fontFamily: 'var(--font)' }} /></label>
        </div>
        <label className="field" style={{ marginTop: '.75rem' }}>Reason for the change<textarea value={it.reason} onChange={set('reason')} style={{ minHeight: '4rem', fontFamily: 'var(--font)' }} /></label>
      </section>

      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>Which regulatory changes does it contain?</h2>
        <p className="small muted">One request often holds several changes (a new site plus a batch size change plus a new excipient supplier). Add each, then classify it.</p>
        {k.changes.length > 0 && (
          <ul className="small">{k.changes.map((c) => <li key={c.id}>{CHANGE[c.changeId].title} <button className="btn small ghost" onClick={() => { setSel(c.id); goClassify(); }}>Classify</button></li>)}</ul>
        )}
        {suggestions.length > 0 ? (
          <>
            <p className="small"><strong>Suggested from the description:</strong></p>
            <div className="row">{suggestions.map((c) => <button key={c.id} className="btn small" onClick={() => mutate((x) => { addChange(x, c.id, it.title); })}>Add: {c.title}</button>)}</div>
          </>
        ) : <p className="small muted">Fill in the title and proposed state to get suggestions, or add changes on the Classify tab.</p>}
      </section>

      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>Regulatory impact statement</h2>
        <div className="table-wrap" tabIndex={0}>
          <table className="data">
            <thead><tr><th>Region</th><th>Filings</th><th>Earliest use</th></tr></thead>
            <tbody>
              {statement.regions.map((r) => (
                <tr key={r.region}>
                  <td>{regionOf(r.region).label}<div className="small muted">edition {r.edition}</div></td>
                  <td>{r.rows.map((x) => <div key={x.label + x.items.join()}>{x.label}: <span className="small">{x.items.join('; ')}</span></div>)}{r.pending ? <div className="small muted">{r.pending} not classified yet</div> : null}</td>
                  <td>{r.latest ?? (r.rows.length ? 'after approval (no fixed date)' : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ marginTop: '.75rem' }}>
          <button className="btn small" onClick={() => download(`impact-statement-${k.id}.txt`, `${it.title}\n\n${statement.text}\n\nTraining only.`, 'text/plain')}>Download as text</button>
        </div>
      </section>

      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>Decision record</h2>
        {it.signOff ? <p className="small">Assessment signed off by <strong>{it.signOff.name}</strong> on {it.signOff.date}, with pack editions {it.signOff.editions}.</p> : (
          <div className="row">
            <label className="field" style={{ maxWidth: 260 }}>Your name<input type="text" value={signer} onChange={(e) => setSigner(e.target.value)} /></label>
            <button className="btn primary" disabled={!signer.trim() || !k.changes.length || unclassified} onClick={() => mutate((x) => {
              x.intake.signOff = { name: signer.trim(), date: today(), editions: Object.entries(x.packs ?? {}).map(([r, p]) => `${r.toUpperCase()} ${p.edition}`).join(', ') };
              x.intake.step = Math.max(1, x.intake.step);
              x.intake.history = [...(x.intake.history ?? []), { step: 'Assessed', date: today(), note: `Signed off by ${signer.trim()}` }];
            })}>Sign off the assessment</button>
            {unclassified && <span className="small muted">Classify every change first.</span>}
          </div>
        )}
        <div className="row" style={{ marginTop: '.75rem' }}>
          {it.step >= 1 && it.step < STEPS.length - 1 && <button className="btn small" onClick={() => step(it.step + 1)}>Move to {STEPS[it.step + 1]}</button>}
          {it.step > 0 && <button className="btn small ghost" onClick={() => step(it.step - 1, 'moved back')}>Move back</button>}
        </div>
        {it.history?.length > 0 && <ul className="small">{it.history.map((h, i) => <li key={i}>{h.date}: {h.step}{h.note ? ` (${h.note})` : ''}</li>)}</ul>}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Rollout planner
export function RolloutTab({ k, product }) {
  const plan = rolloutPlan(k, product);
  const start = Date.parse(k.submitDate);
  const ends = plan.markets.map((m) => (m.ready ? Date.parse(m.ready) : null)).filter(Boolean);
  const span = Math.max(30 * 86400000, ...ends.map((e) => e - start)) * 1.1;
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>When can every market take the change?</h2>
        <p style={{ margin: '.25rem 0' }}>{plan.allReady
          ? <>All markets from <strong>{plan.allReady}</strong>. Held back by {plan.holdBack.map((r) => regionOf(r).label).join(' and ')}.{plan.overlapDays ? ` Old and new product run side by side for about ${plan.overlapDays} days after the first market switches (${plan.first}).` : ''}</>
          : <>Not yet known: {plan.holdBack.map((r) => regionOf(r).label).join(' and ')} {plan.holdBack.length > 1 ? 'have' : 'has'} no fixed date (approval with no set review time, or changes not classified).</>}
        </p>
        <div className="gantt" role="list" aria-label="Rollout by market">
          {plan.markets.map((m) => (
            <div key={m.region} className="g-row" role="listitem">
              <div className="g-name"><strong>{m.label}</strong><span className="small muted">{m.heaviest ? categoryOf(m.pack, m.heaviest.category).label : 'not classified'} · {m.ready ?? 'no fixed date'}</span></div>
              <div className="g-track" aria-hidden="true">
                {m.ready ? <span className={`g-bar${plan.holdBack.includes(m.region) ? ' crit' : ''}`} style={{ left: 0, width: `${Math.max(2, ((Date.parse(m.ready) - start) / span) * 100)}%` }} /> : <span className="g-slack" style={{ left: 0, width: '100%' }} />}
              </div>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Bars start on the case date ({k.submitDate}). A dotted line means no fixed date. All markets and dates are fictional; this is a learning tool, not a supply plan.</p>
      </section>
      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>Ways to shorten the rollout</h2>
        {plan.markets.map((m) => (
          <div key={m.region} style={{ marginBottom: '.6rem' }}>
            <strong className="small">{m.label}</strong>
            {m.shorten.length ? <ul className="small" style={{ margin: '.2rem 0' }}>{m.shorten.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="small muted" style={{ margin: '.2rem 0' }}>No lower route found on the answers given.</p>}
          </div>
        ))}
        <p className="small muted" style={{ marginBottom: 0 }}>Filing the slowest market first also helps: submit there as soon as the data are ready, then the faster markets.</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- CCDS labelling rollout
export function LabellingTab({ k, product, mutate }) {
  const rows = rolloutRows(k, product, today());
  const kd = kindOf(k.ccds.kind);
  return (
    <div className="stack" style={{ maxWidth: 1000 }}>
      <section className="panel">
        <h2 style={{ fontSize: 'var(--step-1)' }}>CCDS {k.ccds.version}: {kd.label}</h2>
        <p style={{ margin: '.25rem 0' }}>{k.ccds.text}</p>
        <p className="small muted" style={{ margin: 0 }}>Core data sheet approved {k.ccds.date}. Company target to submit each region: {kd.safety ? 30 : 90} days (a training default, not a rule). Answer the classification questions on the Classify tab.</p>
      </section>
      {rows.map((r) => (
        <section key={r.region} className={`filing${r.late ? ' late' : ''}`}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{regionOf(r.region).label}</h3>
            <span className="row small">
              {r.result.status === 'done' ? <Cat pack={r.pack} id={r.result.category} label="long" /> : r.result.status === 'range' ? <Range pack={r.pack} min={r.result.min} max={r.result.max} /> : <span className="muted">not modelled</span>}
            </span>
          </div>
          <p className="small" style={{ margin: '.4rem 0' }}><strong>Where it goes:</strong> {r.section}</p>
          <p className="small" style={{ margin: '.2rem 0' }}><strong>Company target to submit:</strong> {r.target}{r.late ? <span className="flag"> · late</span> : ''}{r.lagDays != null ? ` · ${r.lagDays} days since the CCDS change` : ''}</p>
          {r.timeline?.earliestUse && <p className="small" style={{ margin: '.2rem 0' }}><strong>Earliest use in this region:</strong> {r.timeline.earliestUse}</p>}
          <label className="field" style={{ marginTop: '.5rem' }}>Regional wording (fictional)
            <textarea value={k.ccds.wording?.[r.region] ?? ''} onChange={(e) => mutate((x) => { x.ccds.wording = { ...x.ccds.wording, [r.region]: e.target.value }; })} style={{ minHeight: '4rem', fontFamily: 'var(--font)' }} placeholder={`Wording for ${r.section}`} />
          </label>
          <label className="field" style={{ maxWidth: 260, marginTop: '.5rem' }}>Status
            <select value={r.step} onChange={(e) => mutate((x) => { const n = Number(e.target.value); const st = x.ccds.status[r.region] ?? { step: 0, dates: {} }; st.step = n; st.dates = { ...st.dates, [STATUSES[n]]: st.dates?.[STATUSES[n]] ?? today() }; x.ccds.status[r.region] = st; })}>
              {STATUSES.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </label>
        </section>
      ))}
    </div>
  );
}
