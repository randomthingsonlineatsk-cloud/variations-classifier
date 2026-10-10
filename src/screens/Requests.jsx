import React, { useState } from 'react';
import { useApp, go } from '../ctx.js';
import { READY, regionOf } from '../engine/packs.js';
import { newCase } from '../engine/model.js';
import { STEPS, emptyIntake } from '../engine/intake.js';

export default function Requests() {
  const { cases, products, productById, user, saveCase } = useApp();
  const [productId, setProductId] = useState(products[0].id);
  const [title, setTitle] = useState('');
  const [regions, setRegions] = useState(READY);
  const requests = cases.filter((c) => c.intake);
  const create = async (e) => {
    e.preventDefault();
    const product = productById(productId);
    const k = newCase({ product, user, regions, name: `Change request: ${title || product.brandName}` });
    k.intake = { ...emptyIntake(), title };
    k.related = true;
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Change requests</h1>
      <p>Practise the step before classification: a change request comes in from manufacturing or quality, you work out which regulatory changes it holds, classify them in every market, and sign off the regulatory assessment.</p>
      <form className="panel grid-2" onSubmit={create} aria-label="New change request" style={{ marginBottom: '1.5rem' }}>
        <label className="field">Title<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="for example: move blister packaging to Unit III" /></label>
        <label className="field">Product
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.label ?? p.brandName}</option>)}</select>
        </label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, fontSize: 'var(--step--1)', color: 'var(--ink-2)' }}>Markets</legend>
          <div className="row">{READY.map((r) => (
            <label key={r} className="row small" style={{ gap: '.3rem', fontWeight: 400 }}>
              <input type="checkbox" checked={regions.includes(r)} disabled={regions.includes(r) && regions.length === 1} onChange={(e) => setRegions(READY.filter((x) => (x === r ? e.target.checked : regions.includes(x))))} /> {regionOf(r).label}
            </label>
          ))}</div>
        </fieldset>
        <div style={{ alignSelf: 'end' }}><button className="btn primary" type="submit">Raise the request</button></div>
      </form>
      <div className="board">
        {STEPS.map((s, i) => {
          const items = requests.filter((r) => (r.intake.step ?? 0) === i);
          return (
            <section key={s} className="board-col" aria-label={`${s}: ${items.length}`}>
              <h2>{s} <span className="muted">{items.length}</span></h2>
              {items.map((r) => (
                <a key={r.id} className="board-card" href={`#/case/${r.id}`}>
                  <strong>{r.intake.title || r.name}</strong>
                  <span className="small muted">{productById(r.productId)?.brandName} · {r.changes.length} change(s) · {r.regions.map((x) => regionOf(x).short).join(', ')}</span>
                  {r.intake.plannedDate && <span className="small">Planned {r.intake.plannedDate}</span>}
                </a>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
