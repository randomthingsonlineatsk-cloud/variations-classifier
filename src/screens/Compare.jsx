import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { packFor, GROUP, CHANGES, READY, regionOf, searchChanges, categoryOf, regionsFor } from '../engine/packs.js';
import { reachable } from '../engine/classify.js';
import { newCase, addChange } from '../engine/model.js';
import { Cat } from '../components/ui.jsx';

// How the categories line up across regions by when the change may be used.
const TIMING = [
  { id: 'do-and-tell', label: 'Do, then tell', help: 'Implement first; report later or at once.' },
  { id: 'tell-and-wait', label: 'Tell, wait, then do', help: 'Notify and wait a fixed period without objection.' },
  { id: 'tell-and-do', label: 'Tell, then do at once', help: 'Implement when the agency receives the notice.' },
  { id: 'wait-for-approval', label: 'Wait for approval', help: 'Implement only after the agency approves.' },
];

export default function Compare() {
  const { products, productById, user, saveCase } = useApp();
  const [inDraft, setInDraft] = useState(false);
  const packs = Object.fromEntries(READY.map((r) => [r, packFor(r, { draft: r === 'in' && inDraft })]));
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [diffOnly, setDiffOnly] = useState(false);
  const [productId, setProductId] = useState(products[0].id);
  const product = productById(productId);
  const heaviest = (r, id) => { const cats = reachable(packs[r], id); return cats.length ? categoryOf(packs[r], cats[cats.length - 1]) : null; };
  const lightest = (r, id) => { const cats = reachable(packs[r], id); return cats.length ? categoryOf(packs[r], cats[0]) : null; };
  const list = useMemo(() => searchChanges(CHANGES, q).filter((c) => !group || c.group === group)
    .filter((c) => !diffOnly || new Set(READY.map((r) => lightest(r, c.id)?.implement)).size > 1), [q, group, diffOnly]);
  const open = async (c) => {
    const rs = regionsFor(product);
    const k = newCase({ product, user, regions: rs, name: `${product.brandName}: ${c.title} (${rs.length > 3 ? `${rs.length} regions` : rs.map((r) => regionOf(r).short).join(' vs ')})` });
    addChange(k, c.id);
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Compare regions</h1>
      <p>The same change can be a notification in one region and need approval in another. This table shows every category each change can reach in the seven rule sets; open a change to answer the questions once and see every answer side by side.</p>
      <section className="panel" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 'var(--step-1)' }}>How the categories line up</h2>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>When you can use the change</th>{READY.map((r) => <th key={r}>{regionOf(r).label}</th>)}</tr></thead>
            <tbody>
              {TIMING.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.label}</strong><div className="small muted">{t.help}</div></td>
                  {READY.map((r) => <td key={r}><div className="row" style={{ gap: '.3rem' }}>{packs[r].categories.filter((c) => c.implement === t.id).map((c) => <Cat key={c.id} pack={packs[r]} id={c.id} />)}{!packs[r].categories.some((c) => c.implement === t.id) && <span className="muted">—</span>}</div></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>India's "Ask CDSCO" means no codified category for chemical drugs in force. The US CBE-0 lets you distribute on receipt; the EU has no exact match (Type IA-IN is implemented before it is notified). Switzerland mirrors the EU list with its own time limits (IA-IN within a month, IB after about 70 days). Canada's notifiable change exists only for biologics. Japan decides by what the approval form says, not by a list. WHO PQ defaults unlisted changes to major.</p>
      </section>
      <div className="grid-2 panel" style={{ marginBottom: '1rem' }}>
        <label className="field">Search<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="words such as site, shelf life" /></label>
        <label className="field">Group
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All groups</option>
            {Object.values(GROUP).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="field">Product for side-by-side cases
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.label ?? p.brandName}</option>)}</select>
        </label>
        <label className="row small" style={{ alignSelf: 'end' }}><input type="checkbox" checked={inDraft} onChange={(e) => setInDraft(e.target.checked)} /> India: show the February 2026 draft rules</label>
        <label className="row small" style={{ alignSelf: 'end' }}><input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} /> Only changes whose lightest route differs in timing</label>
      </div>
      <p className="small muted" aria-live="polite">{list.length} change(s).</p>
      <div className="table-wrap">
        <table className="data compare">
          <thead><tr><th>Change</th>{READY.map((r) => <th key={r}>{regionOf(r).label}</th>)}<th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.title}</strong><div className="small muted">{GROUP[c.group].label}</div></td>
                {READY.map((r) => (
                  <td key={r}>
                    <div className="row" style={{ gap: '.25rem' }}>{reachable(packs[r], c.id).map((x) => <Cat key={x} pack={packs[r]} id={x} />)}</div>
                    <div className="small muted">{lightest(r, c.id)?.badge}{heaviest(r, c.id) && heaviest(r, c.id) !== lightest(r, c.id) ? ` → ${heaviest(r, c.id).badge.toLowerCase()}` : ''}</div>
                  </td>
                ))}
                <td><button className="btn small" onClick={() => open(c)} aria-label={`Compare ${c.title} for ${product.brandName}`}>Side by side</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
