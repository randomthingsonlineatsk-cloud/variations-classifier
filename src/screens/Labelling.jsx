import React, { useRef, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { READY, regionOf, regionsFor } from '../engine/packs.js';
import { today } from '../engine/model.js';
import { KINDS, newCcdsCase, rolloutRows } from '../engine/labelling.js';
import { parseLabellingChange, caseFromLabellingChange } from '../engine/labelhandoff.js';
import { readFile } from '../engine/io.js';

export default function Labelling() {
  const { cases, products, productById, user, saveCase, toast } = useApp();
  const fileRef = useRef(null);
  const importLw = async (file) => {
    try {
      const d = parseLabellingChange(await readFile(file));
      const product = productById(d.product.id);
      if (!product) throw new Error(`This app has no product with the id "${d.product.id}".`);
      const { kase, skipped } = caseFromLabellingChange(d, product, user, regionsFor(product));
      await saveCase(kase);
      toast(`Rollout started from the Labelling Workbench (${kase.regions.length} region(s)).${skipped.length ? ` Not set up here for this product: ${skipped.join(', ').toUpperCase()}.` : ''}`, skipped.length ? 'warn' : 'info');
      go(`/case/${kase.id}`);
    } catch (e) { toast(e.message, 'error'); }
  };
  const [form, setForm] = useState({ productId: products[0].id, kind: 'adr', text: '', version: '', ccdsDate: today(), regions: READY });
  const items = cases.filter((c) => c.ccds);
  const create = async (e) => {
    e.preventDefault();
    const k = newCcdsCase({ product: productById(form.productId), user, kind: form.kind, text: form.text || KINDS.find((x) => x.id === form.kind).label, version: form.version || '1.0', ccdsDate: form.ccdsDate, regions: regionsFor(productById(form.productId)) });
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Labelling rollout</h1>
      <p>A change to the company core data sheet (CCDS) has to reach every regional label. Track one CCDS change across every regional label the product has (US prescribing information, EU SmPC, Indian prescribing information, Canadian product monograph, Swiss information texts, Japanese package insert, WHO PQ SmPC): where it goes, how it is classified, the deadline and how far each region lags.</p>
      <form className="panel grid-2" onSubmit={create} aria-label="New CCDS change" style={{ marginBottom: '1.5rem' }}>
        <label className="field">Product<select value={form.productId} onChange={set('productId')}>{products.map((p) => <option key={p.id} value={p.id}>{p.label ?? p.brandName}</option>)}</select></label>
        <label className="field">Kind of change<select value={form.kind} onChange={set('kind')}>{KINDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label className="field">CCDS version<input type="text" value={form.version} onChange={set('version')} placeholder="for example 4.0" /></label>
        <label className="field">CCDS approval date<input type="text" inputMode="numeric" value={form.ccdsDate} onChange={set('ccdsDate')} placeholder="yyyy-mm-dd" /></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>Core wording (fictional)<textarea value={form.text} onChange={set('text')} style={{ minHeight: '4rem', fontFamily: 'var(--font)' }} placeholder="for example: Photosensitivity reactions have been reported. Advise patients to avoid strong sunlight." /></label>
        <div className="row"><button className="btn primary" type="submit">Start the rollout</button>
          <button className="btn" type="button" onClick={() => fileRef.current?.click()}>Import a change from the Labelling Workbench</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { if (e.target.files?.[0]) importLw(e.target.files[0]); e.target.value = ''; }} />
        </div>
      </form>
      {items.length === 0 ? <p className="muted">No CCDS changes yet.</p> : (
        <div className="table-wrap" tabIndex={0}>
          <table className="data">
            <thead><tr><th>CCDS change</th>{READY.map((r) => <th key={r}>{regionOf(r).label}</th>)}</tr></thead>
            <tbody>
              {items.map((k) => {
                const product = productById(k.productId);
                const rows = product ? rolloutRows(k, product, today()) : [];
                return (
                  <tr key={k.id}>
                    <td><a href={`#/case/${k.id}`}>{product?.brandName} CCDS {k.ccds.version}</a><div className="small muted">{KINDS.find((x) => x.id === k.ccds.kind)?.label} · {k.ccds.date}</div></td>
                    {READY.map((r) => {
                      const row = rows.find((x) => x.region === r);
                      return <td key={r}>{row ? <><div>{row.status}</div><div className={`small ${row.late ? 'flag' : 'muted'}`}>{row.late ? 'late · ' : ''}target {row.target}</div></> : <span className="muted">—</span>}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
