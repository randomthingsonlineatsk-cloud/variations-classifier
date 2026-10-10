import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { READY, regionOf, sourceOf } from '../engine/packs.js';
import { drillSet } from '../engine/drills.js';
import { Cat } from '../components/ui.jsx';

export default function Drills() {
  const { saveAttempt, toast, attempts } = useApp();
  const [region, setRegion] = useState('us');
  const [seed, setSeed] = useState(() => Date.now() % 2 ** 31);
  const set = useMemo(() => drillSet(region, 10, seed), [region, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const d = set[i];
  const done = Object.keys(picked).length === set.length;
  const right = set.filter((x, j) => picked[j] === x.answer).length;
  const secs = Math.round((now - started) / 1000);
  const restart = (r = region) => { setRegion(r); setSeed(Date.now() % 2 ** 31); setI(0); setPicked({}); };
  const past = attempts.filter((a) => a.kind === 'drill');
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <p className="small"><a href="#/quiz">Quiz bank</a> / Drills</p>
      <h1>Classification drills</h1>
      <p>Ten quick cases: a product, a change and the facts. Pick the category. Every case is built from the region's decision tree, so the answer is the one the rules give.{past.length ? ` Best so far: ${Math.max(...past.map((a) => a.score))}%.` : ''}</p>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <div className="seg" role="group" aria-label="Region">{READY.map((r) => <button key={r} aria-pressed={r === region} onClick={() => restart(r)}>{regionOf(r).label}</button>)}</div>
        <span className="timer" aria-live="off">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
        <span className="small muted">{i + 1} of {set.length}</span>
      </div>
      {d && (
        <section className="panel" aria-live="polite">
          <h2 style={{ fontSize: 'var(--step-1)' }}>{d.change.title}</h2>
          <p className="small muted">{d.product.brandName} ({d.product.dosageForm}{d.product.facts.bio ? ', biologic' : ''}{d.product.facts.sterile ? ', sterile' : ''}) · {d.regionLabel}{d.pack.draft ? ' (draft rules)' : ''}</p>
          {d.facts.length ? <ul className="small">{d.facts.map((f) => <li key={f.text}>{f.text} <strong>{f.answer}</strong></li>)}</ul> : <p className="small muted">No further facts needed.</p>}
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend className="small" style={{ fontWeight: 600 }}>Category</legend>
            <div className="row">
              {d.options.map((o) => (
                <button key={o.id} className={`btn small${picked[i] === o.id ? ' primary' : ''}`} disabled={picked[i] !== undefined} onClick={() => setPicked({ ...picked, [i]: o.id })}>{o.label}</button>
              ))}
            </div>
          </fieldset>
          {picked[i] !== undefined && (
            <div style={{ marginTop: '.75rem' }}>
              <p style={{ margin: 0 }}>{picked[i] === d.answer ? 'Right: ' : 'Not quite: '}<Cat pack={d.pack} id={d.answer} label="long" /></p>
              <p className="small" style={{ margin: '.3rem 0 0' }}>{d.outcome.why} <span className="muted">({d.outcome.at}, {sourceOf(d.pack, d.outcome.src).title})</span></p>
            </div>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            {i > 0 && <button className="btn small" onClick={() => setI(i - 1)}>Previous</button>}
            {i < set.length - 1 && <button className="btn small" disabled={picked[i] === undefined} onClick={() => setI(i + 1)}>Next</button>}
          </div>
        </section>
      )}
      {done && (
        <section className="panel" style={{ marginTop: '1rem' }}>
          <div className="row"><span className="score-big">{right}/{set.length}</span><span className="muted">in {Math.floor(secs / 60)} min {secs % 60} s</span></div>
          <div className="row" style={{ marginTop: '.5rem' }}>
            <button className="btn primary" onClick={async () => { await saveAttempt({ kind: 'drill', region, score: Math.round((right / set.length) * 100), right, total: set.length, seconds: secs }); toast(`Drill saved: ${right} of ${set.length}.`); restart(); }}>Save and start a new set</button>
            <button className="btn" onClick={() => restart()}>New set without saving</button>
          </div>
        </section>
      )}
    </div>
  );
}
