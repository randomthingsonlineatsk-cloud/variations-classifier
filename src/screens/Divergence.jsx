import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { GROUP, CHANGE, packFor, regionOf, regionsFor } from '../engine/packs.js';
import { newCase, addChange } from '../engine/model.js';
import { divergence, divergenceSummary, DIRECTION_TEXT, relianceFor, MAP_REGIONS } from '../engine/reliance.js';
import { Cat } from '../components/ui.jsx';

// The Divergence and Reliance Map: where the EU, UK and Swiss rules now differ, and which
// reliance routes could carry one decision to another agency.
export default function Divergence() {
  const { products, productById, user, saveCase } = useApp();
  const rows = useMemo(() => divergence(), []);
  const sum = divergenceSummary(rows);
  const packs = useMemo(() => Object.fromEntries(MAP_REGIONS.map((r) => [r, packFor(r)])), []);
  const [only, setOnly] = useState(true);
  const [group, setGroup] = useState('');
  const [pick, setPick] = useState(rows.find((r) => !r.same)?.id ?? rows[0].id);
  const [productId, setProductId] = useState(products.find((p) => p.uk && p.ch)?.id ?? products[0].id);
  const product = productById(productId);
  const list = rows.filter((r) => (!only || !r.same || !r.chSame) && (!group || r.group === group));
  const rel = relianceFor(pick);
  const open = async () => {
    const rs = regionsFor(product).filter((r) => MAP_REGIONS.includes(r));
    const k = newCase({ product, user, regions: rs, name: `${product.brandName}: ${CHANGE[pick].title} (EU, UK, Switzerland)` });
    addChange(k, pick);
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Divergence and reliance map</h1>
      <p>The EU classifies variations with its 2025 guidelines since 15 January 2026. MHRA still applies the 2013 guidelines to UK marketing authorisations, and Swissmedic aligned its list with the EU on 1 February 2026. So the same change can now take a different route in each. This map shows where they differ, and which reliance routes can carry one agency’s decision to another.</p>
      <section className="panel" style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
          <div><div className="small muted">Changes in the catalogue</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.total}</div></div>
          <div><div className="small muted">Different in the UK and the EU</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.differ}</div></div>
          <div><div className="small muted">Heavier in the UK</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.ukHeavier}</div></div>
          <div><div className="small muted">Lighter in the UK</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.euHeavier}</div></div>
          <div><div className="small muted">Both ways</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.mixed}</div></div>
          <div><div className="small muted">No UK procedure</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.noUkRoute}</div></div>
          <div><div className="small muted">Switzerland differs from the EU</div><div style={{ fontSize: 'var(--step-2)', fontWeight: 700 }}>{sum.chDiffers}</div></div>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Counted from every category each change can reach under each rule set in this app (UK pack 2026.1, EU 2026.1, Switzerland 2026.1). A difference in reach is a prompt to check the conditions, not a verdict for your product.</p>
      </section>

      <div className="grid-2" style={{ gap: '1rem', alignItems: 'start' }}>
        <section className="panel">
          <h2 style={{ fontSize: 'var(--step-1)' }}>Where the rules differ</h2>
          <div className="row" style={{ marginBottom: '.5rem' }}>
            <label className="field" style={{ minWidth: 200 }}>Group
              <select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{Object.values(GROUP).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
            </label>
            <label className="row small"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Only changes that differ</label>
          </div>
          <p className="small muted" aria-live="polite">{list.length} change(s).</p>
          <div className="table-wrap" tabIndex={0}>
            <table className="data">
              <thead><tr><th>Change</th><th>EU</th><th>UK</th><th>Switzerland</th><th>UK against EU</th></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} aria-selected={pick === r.id} style={pick === r.id ? { outline: '2px solid var(--focus, #2563eb)' } : undefined}>
                    <td><button className="btn small ghost" style={{ textAlign: 'left', whiteSpace: 'normal' }} onClick={() => setPick(r.id)} aria-label={`Map ${r.title}`}>{r.title}</button><div className="small muted">{GROUP[r.group].label}</div></td>
                    {MAP_REGIONS.map((x) => <td key={x}><div className="row" style={{ gap: '.2rem' }}>{r.sets[x].map((c) => <Cat key={c} pack={packs[x]} id={c} />)}</div></td>)}
                    <td className="small">{DIRECTION_TEXT[r.direction]}{!r.chSame ? <div className="muted">Switzerland differs from the EU</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>{rel.change.title}</h2>
          <p className="small muted" style={{ margin: 0 }}>{rel.change.help}</p>
          <div className="table-wrap" tabIndex={0}>
            <table className="data">
              <thead><tr><th>Region</th><th>Can be</th><th>Rule set</th></tr></thead>
              <tbody>
                {MAP_REGIONS.map((x) => (
                  <tr key={x}>
                    <td>{regionOf(x).label}</td>
                    <td><div className="row" style={{ gap: '.2rem' }}>{rows.find((r) => r.id === pick).sets[x].map((c) => <Cat key={c} pack={packs[x]} id={c} label="long" />)}</div></td>
                    <td className="small">{packs[x].label}, edition {packs[x].edition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row">
            <label className="field" style={{ minWidth: 220 }}>Product
              <select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.label ?? p.brandName}</option>)}</select>
            </label>
            <button className="btn primary" onClick={open}>Answer the questions for this product</button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>Opens a case with the regions the product is authorised in (of the EU, the UK and Switzerland): answer once, see each region’s category, clock and documents side by side.</p>
          <h3 style={{ fontSize: 'var(--step-0)', marginBottom: 0 }}>Reliance routes</h3>
          {rel.routes.map((r) => (
            <details key={r.id} className="panel" open={r.applies === 'yes'} style={{ padding: '.6rem .8rem' }}>
              <summary><strong>{r.title}</strong> <span className={`pill ${r.applies === 'yes' ? 'ok' : r.applies === 'grouped' ? 'medium' : ''}`}>{r.applies === 'yes' ? 'Can apply' : r.applies === 'grouped' ? 'Only if grouped' : 'Does not apply'}</span></summary>
              <p className="small">{r.summary}</p>
              {r.points.length > 0 && <ul className="small">{r.points.map((p) => <li key={p}>{p}</li>)}</ul>}
              <p className="small muted" style={{ marginBottom: 0 }}>Source: {r.src}.</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
