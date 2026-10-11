import React, { useMemo, useRef, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { packFor, changesFor, searchChanges, GROUP, REGIONS, READY, regionOf, regionsFor } from '../engine/packs.js';
import { newCase, addChange } from '../engine/model.js';
import { filingsFor, packForCase } from '../engine/filing.js';
import { exportProject, parseProjectFile, download, readFile } from '../engine/io.js';
import { Cat, Range } from '../components/ui.jsx';

export default function Home() {
  const { user, cases, attempts, products, lessons, saveCase, deleteCase, productById, importAll, toast } = useApp();
  const [productId, setProductId] = useState(products[0].id);
  const [q, setQ] = useState('');
  const [changeId, setChangeId] = useState('');
  const [regions, setRegions] = useState(['us', 'eu']);
  const product = productById(productId) ?? products[0];
  const list = useMemo(() => searchChanges(changesFor(product), q), [product, q]);
  const fileRef = useRef(null);

  const start = async (e) => {
    e.preventDefault();
    const k = newCase({ product, user, regions: regions.filter((r) => regionsFor(product).includes(r)).length ? regions.filter((r) => regionsFor(product).includes(r)) : ['us'] });
    if (changeId) { addChange(k, changeId); k.name = `${product.brandName}: ${list.find((c) => c.id === changeId)?.title ?? 'change'}`; }
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  const doExport = () => {
    download(`variations-classifier-${new Date().toISOString().slice(0, 10)}.vcproj.json`, exportProject({ user, cases, attempts, products: products.filter((p) => p.custom), lessons }));
  };
  const doImport = async (file) => {
    try {
      const text = await readFile(file);
      const data = parseProjectFile(text, user, { cases: new Set(cases.map((c) => c.id)), attempts: new Set(attempts.map((a) => a.id)), products: new Set() });
      await importAll(data);
      toast(`Imported ${data.cases.length} case(s) and ${data.attempts.length} attempt(s).`);
    } catch (err) { toast(err.message, 'error'); }
  };
  const realCases = cases.filter((c) => !c.missionId);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Classify a post-approval change</h1>
          <p className="lede">Describe a change to an approved product and answer the questions the rules ask. You get the reporting category, every reason with the rule behind it, the documents, the CTD sections, the dates and a filing package for the eCTD Dossier Builder.</p>
          <p className="small muted">Seven rule sets: the US (NDA, ANDA, BLA), the EU (2025 guidelines, with the 2013 guidelines for earlier dates), India (rules in force, with the 2026 draft as a what-if), Canada, Switzerland, Japan and WHO prequalification. Every product and company is fictional; results are for training, not regulatory advice.</p>
        </div>
        <form className="panel stack" onSubmit={start} aria-label="Start a case">
          <h2 style={{ fontSize: 'var(--step-1)' }}>Start a case</h2>
          <label className="field">Product
            <select value={productId} onChange={(e) => { setProductId(e.target.value); setChangeId(''); }}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.label ?? `${p.brandName} (${p.inn})`} · {p.appType.toUpperCase()}</option>)}
            </select>
            <small>{product.summary}</small>
          </label>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, fontSize: 'var(--step--1)', color: 'var(--ink-2)', marginBottom: '.25rem' }}>Regions</legend>
            <div className="row">
              {REGIONS.map((r) => (
                <label key={r.id} className="row small" style={{ gap: '.3rem', fontWeight: 400 }}>
                  <input type="checkbox" disabled={!r.ready || !regionsFor(product).includes(r.id) || (regions.includes(r.id) && regions.length === 1)} checked={regions.includes(r.id) && regionsFor(product).includes(r.id)}
                    onChange={(e) => setRegions(READY.filter((x) => (x === r.id ? e.target.checked : regions.includes(x))))} />
                  {r.short}{r.ready ? '' : <span className="muted"> (phase {r.phase})</span>}
                </label>
              ))}
            </div>
            <small className="muted" style={{ fontWeight: 400 }}>{regions.map((r) => `${regionOf(r).label}: edition ${packFor(r).edition}`).join(' · ')}</small>
          </fieldset>
          <label className="field">Find the change
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="for example: new site, shelf life, dissolution" />
          </label>
          <label className="field">Change
            <select value={changeId} onChange={(e) => setChangeId(e.target.value)}>
              <option value="">Choose later</option>
              {Object.values(GROUP).map((g) => {
                const items = list.filter((c) => c.group === g.id);
                return items.length ? <optgroup key={g.id} label={g.label}>{items.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup> : null;
              })}
            </select>
            <small>{list.length} of {changesFor(product).length} changes match.</small>
          </label>
          <div className="row"><button className="btn primary" type="submit">Start the case</button><a className="btn" href="#/catalogue">Browse the catalogue</a></div>
        </form>
      </section>

      <div className="section-head">
        <h2>Your cases</h2>
        <div className="row">
          <button className="btn small" onClick={doExport}>Export project file</button>
          <button className="btn small" onClick={() => fileRef.current?.click()}>Import project file</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { if (e.target.files[0]) doImport(e.target.files[0]); e.target.value = ''; }} />
        </div>
      </div>
      {realCases.length === 0 && <p className="muted">No cases yet. Start one above, or try a <a href="#/missions">mission</a>.</p>}
      <div className="list">
        {realCases.map((k) => <CaseRow key={k.id} k={k} product={productById(k.productId)} onDelete={async () => { if (confirm(`Delete "${k.name}"?`)) { await deleteCase(k.id); toast('Case deleted.'); } }} />)}
      </div>
    </div>
  );
}

function CaseRow({ k, product, onDelete }) {
  const multi = k.regions.length > 1;
  return (
    <div className="list-item">
      <div style={{ minWidth: 0 }}>
        <h3><a href={`#/case/${k.id}`}>{k.name}</a></h3>
        <div className="small muted">{product ? `${product.brandName} · ${k.regions.map((r) => regionOf(r).short).join(' + ')}` : 'Product missing'} · {k.changes.length} change(s) · updated {new Date(k.updatedAt).toLocaleDateString()}</div>
      </div>
      <div className="row">
        {product && k.regions.map((r) => {
          const pack = packForCase(k, r);
          const res = filingsFor(pack, product, k);
          return (
            <span key={r} className="row" style={{ gap: '.25rem' }}>
              {multi && <span className="small muted">{regionOf(r).short}</span>}
              {res.filings.map((f) => <Cat key={f.id} pack={pack} id={f.category} />)}
              {res.pending.map((p) => p.result.status === 'range' ? <Range key={p.change.id} pack={pack} min={p.result.min} max={p.result.max} /> : null)}
            </span>
          );
        })}
        <a className="btn small" href={`#/case/${k.id}`}>Open</a>
        <button className="btn small danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
