import React, { useState } from 'react';
import { useApp, go } from '../ctx.js';
import { MISSIONS, LEVELS, missionCase } from '../engine/missions.js';

export default function Missions() {
  const { attempts, cases, user, saveCase, productById } = useApp();
  const [level, setLevel] = useState('standard');
  const best = (id) => Math.max(-1, ...attempts.filter((a) => a.kind === 'mission' && a.missionId === id).map((a) => a.score));
  const open = (id) => cases.find((c) => c.missionId === id && !c.mission?.submitted);
  const start = async (m) => {
    const k = missionCase(m, user, level);
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page">
      <h1>Missions</h1>
      <p>Each mission is a short case with a fictional product: read the brief, classify the change, plan the filing, and give the key date. Scores: categories 40, reasons 20, CTD sections 20, date 20. Over-filing earns half the category points; under-filing earns none.</p>
      <fieldset className="panel" style={{ marginBottom: '1rem' }}>
        <legend style={{ fontWeight: 700 }}>Level for new attempts</legend>
        <div className="row">
          {LEVELS.map((l) => (
            <label key={l.id} className="choice" style={{ flex: '1 1 220px', marginBottom: 0 }}>
              <input type="radio" name="level" checked={level === l.id} onChange={() => setLevel(l.id)} />
              <span><strong>{l.label}</strong><br /><span className="small muted">{l.help}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="list">
        {MISSIONS.map((m) => {
          const b = best(m.id);
          const o = open(m.id);
          const p = productById(m.product);
          return (
            <div key={m.id} className="list-item">
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3>{m.id}. {m.title}</h3>
                <div className="small muted">{p.brandName} · {p.appType.toUpperCase()} · {m.changes.length} change(s){b >= 0 ? ` · best ${b}/100` : ''}</div>
              </div>
              <div className="row">
                {o && <a className="btn small" href={`#/case/${o.id}`}>Continue</a>}
                <button className="btn small primary" onClick={() => start(m)}>{b >= 0 ? 'Try again' : 'Start'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
