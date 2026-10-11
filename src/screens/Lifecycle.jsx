import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { CHANGE, CHANGES, READY, regionOf, regionsFor, categoryOf, packFor, searchChanges } from '../engine/packs.js';
import { newCase, addChange } from '../engine/model.js';
import { download } from '../engine/io.js';
import {
  Q12_CATEGORIES, EC_TYPES, IMPACTS, suggestEC, regionCategory, REGION_NOTE, newPlcm, newEc, newPacmp, newCommitment,
  pacmpStep1, STEP2_OPTIONS, plcmSections, plcmHtml, Q5E_GROUPS, Q5E_RESULTS, newQ5e, q5eVerdict, q5eText, q12Label,
} from '../engine/lifecycle.js';
import { Cat, Range } from '../components/ui.jsx';

const TABS = [['ec', 'Established conditions'], ['pacmp', 'PACMP builder'], ['plcm', 'PLCM document'], ['q5e', 'Q5E comparability']];

const EXAMPLES = {
  small: [
    { type: 'process', element: 'Granulation: water amount', value: '18% to 22% w/w', impact: 'high', justification: 'Affects granule density and dissolution (a CQA).' },
    { type: 'process', element: 'Blending time', value: '10 to 20 minutes', impact: 'medium', justification: 'Content uniformity confirmed by in-process testing.' },
    { type: 'process', element: 'Dryer inlet air temperature', value: '55 to 70 degrees C', impact: 'low', justification: 'Wide proven acceptable range; loss on drying is controlled.' },
    { type: 'process', element: 'Tablet press speed', value: 'Set by operator', impact: 'none', justification: 'No effect on CQAs across the studied range.' },
    { type: 'spec', element: 'Drug product specification: dissolution', value: 'Q = 80% at 30 minutes', impact: 'high', justification: 'Release specification.' },
    { type: 'site', element: 'Drug product manufacturing site', value: 'Fictional site named in 3.2.P.3.1', impact: 'medium', justification: 'Site of manufacture.' },
  ],
  bio: [
    { type: 'process', element: 'Production bioreactor: pH', value: '6.9 to 7.1', impact: 'high', justification: 'Affects glycosylation (a CQA).' },
    { type: 'process', element: 'Protein A column: load density', value: 'up to 40 g/L resin', impact: 'medium', justification: 'Affects host cell protein clearance; controlled by testing.' },
    { type: 'material', element: 'Cell culture medium (chemically defined)', value: 'Named medium and supplier', impact: 'medium', justification: 'Medium changes can affect product quality.' },
    { type: 'process', element: 'Harvest centrifuge speed', value: 'Set by operator', impact: 'none', justification: 'No effect on CQAs in characterisation studies.' },
    { type: 'method', element: 'Potency assay (cell-based)', value: 'Validated procedure', impact: 'high', justification: 'Measures biological activity.' },
  ],
};

export default function Lifecycle({ tab = 'ec' }) {
  const { products, productById, lifecycle, saveDoc, deleteDoc, user, saveCase, toast } = useApp();
  const [productId, setProductId] = useState(products[0].id);
  const product = productById(productId) ?? products[0];
  const stored = lifecycle.find((d) => d.kind === 'plcm' && d.productId === product.id);
  // Edits live in local state first, so typing never waits for the database.
  const [drafts, setDrafts] = useState({});
  const fresh = useMemo(() => newPlcm({ product, user }), [product.id]);
  const doc = drafts[product.id] ?? stored ?? fresh;
  const save = (fn) => { const next = structuredClone(doc); fn(next); next.updatedAt = new Date().toISOString(); setDrafts((x) => ({ ...x, [product.id]: next })); saveDoc(next); };
  const current = TABS.some(([t]) => t === tab) ? tab : 'ec';
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Lifecycle tools</h1>
      <p>ICH Q12 tools for one product: decide which elements are <strong>established conditions</strong> and how changes to them are reported, build a <strong>post-approval change management protocol</strong>, and compile the <strong>product lifecycle management document</strong>. For biologics, run an <strong>ICH Q5E comparability</strong> check. Everything is training material for fictional products.</p>
      <div className="row panel" style={{ marginBottom: '1rem' }}>
        <label className="field" style={{ flex: '1 1 280px' }}>Product
          <select value={product.id} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.label ?? `${p.brandName} (${p.inn})`}</option>)}</select>
        </label>
        <p className="small muted" style={{ flex: '2 1 320px', margin: 0 }}>{stored ? `PLCM version ${doc.version}, saved ${doc.updatedAt.slice(0, 10)}. ${doc.ecs.length} element(s), ${doc.pacmps.length} protocol(s).` : 'Nothing saved for this product yet; your first edit saves it in this browser.'}</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Lifecycle tools">
        {TABS.map(([t, l]) => <button key={t} role="tab" aria-selected={current === t} onClick={() => go(`/lifecycle/${t}`)}>{l}</button>)}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {current === 'ec' && <EcTab {...{ doc, save, product, user, saveCase, toast }} />}
        {current === 'pacmp' && <PacmpTab {...{ doc, save, product, user, saveCase }} />}
        {current === 'plcm' && <PlcmTab {...{ doc, save, product, stored, deleteDoc: async (id) => { setDrafts((x) => { const y = { ...x }; delete y[product.id]; return y; }); await deleteDoc(id); }, toast }} />}
        {current === 'q5e' && <Q5eTab {...{ product, user, lifecycle, saveDoc, deleteDoc }} />}
      </div>
    </div>
  );
}

function RegionMap({ category }) {
  return (
    <div className="row small" style={{ gap: '.35rem' }}>
      {['us', 'eu', 'ch', 'jp'].map((r) => {
        const rc = regionCategory(r, category);
        return <span key={r} className="row" style={{ gap: '.2rem' }}><span className="muted">{regionOf(r).short}</span>{rc ? <Cat pack={rc.pack} id={rc.id} /> : <span className="muted">n/a</span>}</span>;
      })}
      <span className="muted">Canada, India, WHO PQ: no EC route</span>
    </div>
  );
}

function EcTab({ doc, save, product, user, saveCase }) {
  const setRow = (id, fn) => save((d) => { const e = d.ecs.find((x) => x.id === id); fn(e); });
  const recompute = (e) => { if (!e.overridden) { const s = suggestEC(e); e.ec = s.ec; e.category = s.category; } };
  const classify = async (e) => {
    const k = newCase({ product, user, regions: regionsFor(product).filter((r) => ['us', 'eu', 'ch', 'jp'].includes(r)), name: `${product.brandName}: change to ${e.element || 'an element'}` });
    const c = addChange(k, 'non-ec-change', `${e.element}${e.value ? ` (approved: ${e.value})` : ''}`);
    c.answers = e.ec ? { isEC: 'yes', plcmCategory: e.category } : { isEC: 'no' };
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="stack">
      <section className="panel stack">
        <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>How ICH Q12 sorts the dossier</h2>
        <p className="small" style={{ margin: 0 }}>Established conditions (ECs) are the legally binding elements that assure product quality. A change to an EC is reported in a category set by its risk: prior approval, moderate notification or low notification. Everything else is supportive information, managed in the quality system without a submission. More process knowledge (an enhanced or performance-based approach) can mean fewer ECs, or lower categories.</p>
        <label className="field" style={{ maxWidth: 420 }}>Approach
          <select value={doc.approach} onChange={(e) => save((d) => { d.approach = e.target.value; })}>
            <option value="parameter">Parameter-based (minimal knowledge)</option>
            <option value="enhanced">Enhanced, parameter-based</option>
            <option value="performance">Performance-based (for example with process models)</option>
          </select>
        </label>
        <div className="row">
          <button className="btn" onClick={() => save((d) => { d.ecs.push(newEc()); })}>Add an element</button>
          <button className="btn ghost" onClick={() => save((d) => { for (const x of EXAMPLES[product.facts?.bio ? 'bio' : 'small']) { const e = { ...newEc(), ...x }; recompute(e); d.ecs.push(e); } })}>Add example elements ({product.facts?.bio ? 'biologic' : 'tablet'})</button>
        </div>
      </section>
      {doc.ecs.length === 0 && <p className="muted">No elements yet. Add one, or start from the examples.</p>}
      {doc.ecs.map((e, i) => {
        const s = suggestEC(e);
        return (
          <section key={e.id} className="panel stack" aria-label={`Element ${i + 1}`}>
            <div className="grid-2">
              <label className="field">Element<input type="text" value={e.element} onChange={(ev) => setRow(e.id, (x) => { x.element = ev.target.value; })} placeholder="for example: granulation end point" /></label>
              <label className="field">Approved value or range<input type="text" value={e.value} onChange={(ev) => setRow(e.id, (x) => { x.value = ev.target.value; })} /></label>
              <label className="field">Type<select value={e.type} onChange={(ev) => setRow(e.id, (x) => { x.type = ev.target.value; recompute(x); })}>{EC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
              <label className="field">Potential impact on critical quality attributes
                <select value={e.impact} onChange={(ev) => setRow(e.id, (x) => { x.impact = ev.target.value; recompute(x); })}>{IMPACTS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                <small>{IMPACTS.find((t) => t.id === e.impact)?.help}</small>
              </label>
            </div>
            <p className="small" style={{ margin: 0 }}><strong>Suggestion:</strong> {s.why}</p>
            <div className="grid-2">
              <label className="field">Reporting category
                <select value={e.ec ? e.category : 'none'} onChange={(ev) => setRow(e.id, (x) => { x.category = ev.target.value; x.ec = ev.target.value !== 'none'; x.overridden = !(x.category === s.category); })}>
                  {Q12_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <small>{e.overridden ? 'Your choice differs from the suggestion: justify it below.' : 'Follows the suggestion.'}</small>
              </label>
              <label className="field">Justification<input type="text" value={e.justification} onChange={(ev) => setRow(e.id, (x) => { x.justification = ev.target.value; })} placeholder="risk assessment, development data" /></label>
            </div>
            <RegionMap category={e.ec ? e.category : 'none'} />
            <div className="row">
              <button className="btn small" onClick={() => classify(e)}>Classify a change to this element</button>
              <button className="btn small danger" onClick={() => save((d) => { d.ecs = d.ecs.filter((x) => x.id !== e.id); })}>Remove</button>
            </div>
          </section>
        );
      })}
      <details className="panel">
        <summary><strong>How each region uses established conditions</strong></summary>
        <ul className="small">{READY.map((r) => <li key={r}><strong>{regionOf(r).label}:</strong> {REGION_NOTE[r]}</li>)}</ul>
      </details>
    </div>
  );
}

function PacmpTab({ doc, save, product, user, saveCase }) {
  const [sel, setSel] = useState(doc.pacmps[0]?.id ?? null);
  const [q, setQ] = useState('');
  const p = doc.pacmps.find((x) => x.id === sel) ?? doc.pacmps[0];
  const set = (fn) => save((d) => { fn(d.pacmps.find((x) => x.id === p.id)); });
  const step1 = useMemo(() => pacmpStep1(product), [product]);
  const cmc = searchChanges(CHANGES.filter((c) => c.kind === 'cmc' && !['cp-submit', 'cp-use', 'pacmp-change'].includes(c.id)), q).slice(0, 8);
  const startCase = async () => {
    const k = newCase({ product, user, regions: regionsFor(product), name: `${product.brandName}: PACMP ${p.title || ''}`.trim() });
    addChange(k, 'cp-submit', p.title || 'Post-approval change management protocol');
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  const text = () => [
    `POST-APPROVAL CHANGE MANAGEMENT PROTOCOL (training document; fictional product)`, `${p.title || 'Untitled'}`, `Product: ${product.brandName} (${product.inn}). Scope: ${p.scope}.`, '',
    `Changes covered: ${p.changeIds.map((id) => CHANGE[id]?.title).join('; ') || '(none chosen)'}`, '', `Description: ${p.description}`, `Rationale: ${p.rationale}`, `Risk assessment: ${p.risk}`, '',
    'Studies and acceptance criteria:', ...p.studies.map((s, i) => `  ${i + 1}. ${s.test}: ${s.criteria}`), '',
    'Step 1 (submitting this protocol):', ...step1.map((s) => `  ${s.label}: ${s.result.status === 'done' ? categoryOf(s.pack, s.result.category).label : 'depends on answers'}`), '',
    'Step 2 (implementing a change under the approved protocol):', ...Object.entries(p.step2).filter(([, v]) => v).map(([r, v]) => `  ${regionOf(r).label}: ${categoryOf(packFor(r), v)?.label}`),
  ].join('\n');
  return (
    <div className="stack">
      <section className="panel stack">
        <p className="small" style={{ margin: 0 }}>A protocol is agreed in two steps. Step 1: submit the plan (the studies, the acceptance criteria and the category you propose for the change). Step 2: make the change, show the criteria are met, and report it in the lower category the protocol set.</p>
        <div className="row">
          {doc.pacmps.map((x) => <button key={x.id} className="btn small" aria-pressed={x.id === p?.id} onClick={() => setSel(x.id)}>{x.title || 'Untitled protocol'}</button>)}
          <button className="btn small primary" onClick={() => { const n = newPacmp(product); save((d) => { d.pacmps.push(n); }); setSel(n.id); }}>New protocol</button>
        </div>
      </section>
      {!p ? <p className="muted">No protocol yet.</p> : (
        <>
          <section className="panel stack">
            <div className="grid-2">
              <label className="field">Title<input type="text" value={p.title} onChange={(e) => set((x) => { x.title = e.target.value; })} placeholder="for example: adding a second drug product site" /></label>
              <label className="field">Scope<input type="text" value={p.scope} onChange={(e) => set((x) => { x.scope = e.target.value; })} /></label>
            </div>
            <label className="field">Description of the planned change<textarea value={p.description} onChange={(e) => set((x) => { x.description = e.target.value; })} /></label>
            <div className="grid-2">
              <label className="field">Rationale<textarea value={p.rationale} onChange={(e) => set((x) => { x.rationale = e.target.value; })} /></label>
              <label className="field">Risk assessment summary<textarea value={p.risk} onChange={(e) => set((x) => { x.risk = e.target.value; })} placeholder="what could go wrong, and which studies show it does not" /></label>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 600 }}>Changes the protocol covers</legend>
              <div className="row">{p.changeIds.map((id) => <span key={id} className="pill">{CHANGE[id]?.title} <button className="btn small ghost" aria-label={`Remove ${CHANGE[id]?.title}`} onClick={() => set((x) => { x.changeIds = x.changeIds.filter((y) => y !== id); })}>✕</button></span>)}</div>
              <label className="field" style={{ marginTop: '.5rem' }}>Find a change<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="for example: site, scale, resin" /></label>
              {q && <div className="list">{cmc.map((c) => <div key={c.id} className="list-item" style={{ padding: '.4rem .6rem' }}><span className="small">{c.title}</span><button className="btn small" disabled={p.changeIds.includes(c.id)} onClick={() => set((x) => { x.changeIds.push(c.id); })}>Add</button></div>)}</div>}
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 600 }}>Studies and acceptance criteria</legend>
              {p.studies.map((s, i) => (
                <div key={i} className="grid-2" style={{ marginBottom: '.4rem' }}>
                  <label className="field">Study or test {i + 1}<input type="text" value={s.test} onChange={(e) => set((x) => { x.studies[i].test = e.target.value; })} placeholder="for example: comparative dissolution, 3 batches" /></label>
                  <label className="field">Acceptance criterion<input type="text" value={s.criteria} onChange={(e) => set((x) => { x.studies[i].criteria = e.target.value; })} placeholder="for example: f2 of 50 or more" /></label>
                </div>
              ))}
              <div className="row"><button className="btn small" onClick={() => set((x) => { x.studies.push({ test: '', criteria: '' }); })}>Add a study</button>
                {p.studies.length > 1 && <button className="btn small ghost" onClick={() => set((x) => { x.studies.pop(); })}>Remove the last study</button>}</div>
            </fieldset>
          </section>
          <section className="panel">
            <h2 style={{ fontSize: 'var(--step-1)' }}>Step 1: submitting the protocol</h2>
            <div className="table-wrap" tabIndex={0}><table className="data"><thead><tr><th>Region</th><th>Category</th><th>Rule</th></tr></thead>
              <tbody>{step1.map((s) => <tr key={s.region}><td>{s.label}</td><td>{s.result.status === 'done' ? <Cat pack={s.pack} id={s.result.category} label="long" /> : <Range pack={s.pack} min={s.result.min} max={s.result.max} />}</td><td className="small">{s.result.outcome?.why ?? 'Depends on the product.'}</td></tr>)}</tbody></table></div>
          </section>
          <section className="panel">
            <h2 style={{ fontSize: 'var(--step-1)' }}>Step 2: the category the protocol proposes</h2>
            <div className="grid-2">
              {Object.keys(STEP2_OPTIONS).map((r) => {
                const pack = packFor(r);
                const off = r === 'ca' && !product.facts?.bio;
                return (
                  <label key={r} className="field">{regionOf(r).label}
                    <select value={p.step2[r] ?? ''} disabled={off} onChange={(e) => set((x) => { x.step2[r] = e.target.value; })}>
                      <option value="">{off ? 'Not available for pharmaceuticals yet' : 'Not proposed'}</option>
                      {STEP2_OPTIONS[r].map((c) => <option key={c} value={c}>{categoryOf(pack, c)?.label}</option>)}
                    </select>
                  </label>
                );
              })}
            </div>
            <p className="small muted">India and WHO PQ have no protocol route; Japan's step 2 is always a notification that takes effect 40 working days after acceptance.</p>
            <div className="row">
              <button className="btn primary" onClick={startCase}>Classify step 1 in a case</button>
              <button className="btn" onClick={() => download(`pacmp-${(p.title || 'protocol').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`, text(), 'text/plain')}>Download the protocol (text)</button>
              <button className="btn small danger" onClick={() => save((d) => { d.pacmps = d.pacmps.filter((x) => x.id !== p.id); })}>Delete protocol</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function PlcmTab({ doc, save, product, stored, deleteDoc, toast }) {
  const sections = plcmSections(doc, product);
  return (
    <div className="stack">
      <section className="panel stack">
        <div className="grid-2">
          <label className="field">Title<input type="text" value={doc.title} onChange={(e) => save((d) => { d.title = e.target.value; })} /></label>
          <label className="field">Version<input type="text" value={doc.version} onChange={(e) => save((d) => { d.version = e.target.value; })} /></label>
        </div>
        <label className="field">Summary of the product control strategy<textarea value={doc.controlStrategy} onChange={(e) => save((d) => { d.controlStrategy = e.target.value; })} placeholder="the critical quality attributes and how the process, materials and testing control them" /></label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600 }}>Post-approval CMC commitments</legend>
          {doc.commitments.map((c, i) => (
            <div key={c.id} className="grid-2" style={{ marginBottom: '.4rem' }}>
              <label className="field">Commitment {i + 1}<input type="text" value={c.text} onChange={(e) => save((d) => { d.commitments[i].text = e.target.value; })} placeholder="for example: complete real-time stability on three commercial batches" /></label>
              <label className="field">Due<input type="text" inputMode="numeric" value={c.due} onChange={(e) => save((d) => { d.commitments[i].due = e.target.value; })} placeholder="yyyy-mm-dd" /></label>
            </div>
          ))}
          <button className="btn small" onClick={() => save((d) => { d.commitments.push(newCommitment()); })}>Add a commitment</button>
        </fieldset>
      </section>
      <article className="panel letter-preview" aria-label="PLCM document preview">
        <p className="small" style={{ color: 'var(--high)', fontWeight: 700 }}>Training document. Fictional product. Not for submission.</p>
        <h2 style={{ fontSize: 'var(--step-2)' }}>{doc.title}</h2>
        {sections.map((s) => (
          <section key={s.h}>
            <h3 style={{ fontSize: 'var(--step-0)' }}>{s.h}</h3>
            {s.body?.map((b, i) => <p key={i} className="small">{b}</p>)}
            {s.table && (
              <div className="table-wrap" tabIndex={0}><table className="data"><thead><tr>{s.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{s.table.rows.length ? s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="small">{c}</td>)}</tr>) : <tr><td colSpan={s.table.head.length} className="muted">No established conditions yet: add them on the first tab.</td></tr>}</tbody></table></div>
            )}
          </section>
        ))}
      </article>
      <div className="row no-print">
        <button className="btn primary" onClick={() => download(`plcm-${product.brandName.toLowerCase()}-v${doc.version}.html`, plcmHtml(doc, product), 'text/html')}>Download the PLCM document (HTML)</button>
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
        {stored && <button className="btn danger" onClick={async () => { await deleteDoc(doc.id); toast('PLCM document deleted for this product.'); }}>Delete this product's lifecycle data</button>}
      </div>
    </div>
  );
}

function Q5eTab({ product, user, lifecycle, saveDoc, deleteDoc }) {
  const [drafts, setDrafts] = useState({});
  const docs = [...lifecycle.filter((x) => x.kind === 'q5e' && x.productId === product.id).map((x) => drafts[x.id] ?? x),
    ...Object.values(drafts).filter((x) => x.productId === product.id && !lifecycle.some((y) => y.id === x.id))];
  const [sel, setSel] = useState(null);
  const d = docs.find((x) => x.id === sel) ?? docs[0];
  const set = (fn) => { const next = structuredClone(d); fn(next); setDrafts((x) => ({ ...x, [next.id]: next })); saveDoc(next); };
  const v = d ? q5eVerdict(d) : null;
  return (
    <div className="stack">
      <section className="panel stack">
        <p className="small" style={{ margin: 0 }}>ICH Q5E: after a manufacturing change to a biological product, show that the product before and after the change is highly similar and that any difference has no adverse impact on safety or efficacy. Quality data come first; nonclinical or clinical data are needed only when quality data cannot settle it.</p>
        {!product.facts?.bio && <p className="callout warn small" style={{ margin: 0 }}>{product.brandName} is not a biological product. Q5E is written for biotechnological and biological products; pick a biologic above.</p>}
        <div className="row">
          {docs.map((x) => <button key={x.id} className="btn small" aria-pressed={x.id === d?.id} onClick={() => setSel(x.id)}>{x.change || x.title}</button>)}
          <button className="btn small primary" onClick={() => { const n = newQ5e({ product, user }); setDrafts((x) => ({ ...x, [n.id]: n })); saveDoc(n); setSel(n.id); }}>New comparability exercise</button>
        </div>
      </section>
      {d && (
        <>
          <section className="panel stack">
            <div className="grid-2">
              <label className="field">Change<input type="text" value={d.change} onChange={(e) => set((x) => { x.change = e.target.value; })} placeholder="for example: scale-up of the production bioreactor" /></label>
              <label className="field">Process step affected<input type="text" value={d.step} onChange={(e) => set((x) => { x.step = e.target.value; })} placeholder="for example: upstream cell culture" /></label>
              <label className="field">Pre-change batches<input type="number" min="1" value={d.preBatches} onChange={(e) => set((x) => { x.preBatches = Number(e.target.value) || 0; })} /></label>
              <label className="field">Post-change batches<input type="number" min="1" value={d.postBatches} onChange={(e) => set((x) => { x.postBatches = Number(e.target.value) || 0; })} /></label>
            </div>
            <label className="field">Risk assessment: which quality attributes could the change affect, and why?<textarea value={d.risk} onChange={(e) => set((x) => { x.risk = e.target.value; })} /></label>
          </section>
          {Q5E_GROUPS.map((g) => (
            <section key={g.id} className="panel">
              <h2 style={{ fontSize: 'var(--step-1)', margin: '0 0 .4rem' }}>{g.label} <span className="small muted">({g.ref})</span></h2>
              {d.rows.filter((r) => r.group === g.id).map((r) => {
                const i = d.rows.findIndex((x) => x.id === r.id);
                return (
                  <div key={r.id} className="grid-2" style={{ borderTop: '1px solid var(--line)', paddingTop: '.5rem', marginTop: '.5rem' }}>
                    <label className="field">{r.attr}: method<input type="text" value={r.method} onChange={(e) => set((x) => { x.rows[i].method = e.target.value; })} /></label>
                    <label className="field">Acceptance criteria or historical range<input type="text" value={r.criteria} onChange={(e) => set((x) => { x.rows[i].criteria = e.target.value; })} /></label>
                    <label className="field">Result<select value={r.result} onChange={(e) => set((x) => { x.rows[i].result = e.target.value; })}>{Q5E_RESULTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
                    <label className="field">Note<input type="text" value={r.note} onChange={(e) => set((x) => { x.rows[i].note = e.target.value; })} /></label>
                  </div>
                );
              })}
            </section>
          ))}
          <section className={`panel result tone-${v.level === 'bridging' ? 'pas' : v.level === 'incomplete' ? 'letter' : v.level === 'justified' ? 'cbe30' : 'ar'}`} aria-live="polite">
            <h2 style={{ fontSize: 'var(--step-1)', margin: 0 }}>Conclusion: {v.label}</h2>
            <p>{v.text}</p>
            <p className="small muted">{v.counts.assessed} attribute(s) assessed · {v.counts.justified} justified difference(s) · {v.counts.risk} with possible impact</p>
            {v.notes.map((n) => <div key={n} className="note">{n}</div>)}
            <label className="field" style={{ marginTop: '.75rem' }}>Nonclinical or clinical considerations<textarea value={d.nonclinical} onChange={(e) => set((x) => { x.nonclinical = e.target.value; })} placeholder="for example: a PK bridging study if glycosylation differs" /></label>
            <p className="small">In the classifier, a change that needs a comparability assessment is classified more strictly (for example Type II in the EU, Q.I.a.3(c)); a failed comparability exercise also stops a change made under a protocol.</p>
            <div className="row">
              <button className="btn primary" onClick={() => download(`q5e-${product.brandName.toLowerCase()}-${d.id}.txt`, q5eText(d, product), 'text/plain')}>Download the summary (text)</button>
              <button className="btn danger" onClick={async () => { setDrafts((x) => { const y = { ...x }; delete y[d.id]; return y; }); await deleteDoc(d.id); setSel(null); }}>Delete this exercise</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
