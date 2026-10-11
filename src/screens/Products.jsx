import React, { useRef } from 'react';
import { useApp } from '../ctx.js';
import { productFromEctdFile } from '../engine/model.js';
import { readFile } from '../engine/io.js';

const FACT_LABELS = { bio: 'Biologic', sterile: 'Sterile', aseptic: 'Aseptic processing', mr: 'Modified release', solidOral: 'Solid oral', doseControl: 'Packaging controls the dose' };

export default function Products() {
  const { products, saveProduct, deleteProduct, toast, cases } = useApp();
  const ref = useRef(null);
  const importEctd = async (file) => {
    try {
      const p = productFromEctdFile(await readFile(file));
      await saveProduct(p);
      toast(`Added ${p.label}.`);
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div className="page">
      <h1>Products</h1>
      <p>Fictional products with registration profiles for each region they are sold in. The profile answers some classifier questions for you (biologic, sterile, modified release and so on). Six products are the same as in the eCTD Dossier Builder, so a change package goes straight into a dossier for the same product.</p>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <button className="btn" onClick={() => ref.current?.click()}>Add a product from an eCTD Dossier Builder project file</button>
        <input ref={ref} type="file" accept=".json,application/json" hidden onChange={(e) => { if (e.target.files[0]) importEctd(e.target.files[0]); e.target.value = ''; }} />
      </div>
      <div className="cat-grid">
        {products.map((p) => (
          <article key={p.id} className="cat-card">
            <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>{p.brandName} <span className="small muted">({p.inn})</span></h2>
            <p className="small" style={{ margin: 0 }}>{p.summary}</p>
            <dl className="small" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.2rem .6rem', margin: 0 }}>
              <dt className="muted">Application</dt><dd style={{ margin: 0 }}>{p.appType.toUpperCase()} {p.applicationNumber} (fictional), approved {p.approvalDate}</dd>
              {p.eu && <><dt className="muted">EU</dt><dd style={{ margin: 0 }}>{p.eu.maNumber} (fictional), {p.eu.route}{p.eu.rms ? `, RMS ${p.eu.rms}` : ''}</dd></>}
              {p.ca && <><dt className="muted">Canada</dt><dd style={{ margin: 0 }}>DIN {p.ca.din} (fictional), {p.ca.holder.name}</dd></>}
              {p.ch && <><dt className="muted">Switzerland</dt><dd style={{ margin: 0 }}>No. {p.ch.authNumber} (fictional), {p.ch.holder.name}</dd></>}
              {p.jp && <><dt className="muted">Japan</dt><dd style={{ margin: 0 }}>Approval {p.jp.approvalNumber} (fictional), {p.jp.holder.name}</dd></>}
              {p.who && <><dt className="muted">WHO PQ</dt><dd style={{ margin: 0 }}>{p.who.pqRef} (fictional)</dd></>}
              <dt className="muted">Holder</dt><dd style={{ margin: 0 }}>{p.holder.name}</dd>
              <dt className="muted">Form</dt><dd style={{ margin: 0 }}>{p.dosageForm}, {p.strengths.join(', ')}</dd>
              <dt className="muted">Drug product site</dt><dd style={{ margin: 0 }}>{p.sites.drugProduct}</dd>
              <dt className="muted">Shelf life</dt><dd style={{ margin: 0 }}>{p.shelfLife}; {p.storage}</dd>
              {p.ectdProjectName && <><dt className="muted">eCTD project</dt><dd style={{ margin: 0 }}>{p.ectdProjectName}</dd></>}
            </dl>
            <div className="facts">{Object.entries(FACT_LABELS).map(([k, l]) => p.facts[k] ? <span key={k} className="pill">{l}</span> : null)}</div>
            {p.custom && (
              <button className="btn small danger" onClick={async () => {
                if (cases.some((c) => c.productId === p.id)) { toast('Cases use this product; delete them first.', 'warn'); return; }
                await deleteProduct(p.id); toast('Product removed.');
              }}>Remove</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
