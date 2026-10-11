import React from 'react';
import { PACKS, REGIONS, CHANGES } from '../engine/packs.js';
import { Cat } from '../components/ui.jsx';

function notesOf(pack) {
  const out = [];
  const walk = (n, id) => { if (!n) return; if (n.cat) { if (n.note && !out.some((o) => o.id === id && o.note === n.note)) out.push({ id, note: n.note }); return; } if (n.allOf) { walk(n.pass, id); walk(n.fail, id); return; } Object.values(n.on).forEach((c) => walk(c, id)); };
  for (const c of CHANGES) walk(pack.entries[c.id]?.tree, c.id);
  return out;
}

export default function Sources() {
  return (
    <div className="page">
      <h1>Sources and pack editions</h1>
      <p>Every answer comes from a dated, versioned content pack. A case keeps the pack edition it was classified with. Where the app simplifies a rule, the result says so; the list is below.</p>
      <h2 style={{ fontSize: 'var(--step-2)' }}>Regions</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Region</th><th>Status</th></tr></thead>
          <tbody>{REGIONS.map((r) => <tr key={r.id}><td>{r.label}</td><td>{r.ready ? 'Available' : `Planned, phase ${r.phase}`}</td></tr>)}</tbody>
        </table>
      </div>
      {Object.values(PACKS).flat().map((p) => {
        const notes = notesOf(p);
        return (
          <section key={`${p.id}-${p.edition}`} style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: 'var(--step-2)' }}>{p.label}: edition {p.edition}</h2>
            <p className="small">Applies from {p.appliesFrom}{p.appliesTo ? ` until ${p.appliesTo}` : ' (current)'} · status: {p.status} · {Object.keys(p.entries).length} changes modelled{Object.keys(p.conditions ?? {}).length ? ` · ${Object.keys(p.conditions).length} annex conditions (paraphrased; read the official text for exact wording)` : ''}. {p.summary}</p>
            <h3>Categories</h3>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Category</th><th>When you can implement</th><th>Rule</th></tr></thead>
                <tbody>{p.categories.map((c) => <tr key={c.id}><td><Cat pack={p} id={c.id} label="long" /></td><td>{c.rule}</td><td>{c.at}{c.bioAt ? `; biologics ${c.bioAt}` : ''}</td></tr>)}</tbody>
              </table>
            </div>
            <h3 style={{ marginTop: '1rem' }}>Sources</h3>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Source</th><th>Version</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>{Object.entries(p.sources).map(([k, s]) => <tr key={k}><td><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></td><td>{s.version}</td><td>{s.date}</td><td>{s.status}</td></tr>)}</tbody>
              </table>
            </div>
            <h3 style={{ marginTop: '1rem' }}>Simplifications and cautions ({notes.length})</h3>
            <ul className="small">{notes.map((n) => <li key={n.id + n.note}><strong>{CHANGES.find((c) => c.id === n.id)?.title}:</strong> {n.note}</li>)}</ul>
            {p.id === 'us' && <p className="small">Also: when a biologic reaches an outcome taken from FDA guidance written for NDAs and ANDAs, the result carries a caution to check the 2021 biologics guidance.</p>}
            {(p.id === 'eu' || p.id === 'ch') && <p className="small">Codes ending in .z (for example Q.II.b.z) mark changes that are Type IB by default because no listed condition set fits.</p>}
            {p.id === 'ch' && <p className="small">Built from the EU 2026.1 trees: Swissmedic's revised list (Annex 7 TPLRO, 1 February 2026) is harmonised as far as possible with the EU list. Swiss sources, wording, time limits and procedures replace the EU ones; check the Swiss form for Swiss-only variations (numbered from 100).</p>}
            {(p.id === 'ca' || p.id === 'who') && <p className="small">Condition numbers shown as "{p.id === 'ca' ? 'HC' : 'WHO'} item condition n" are the app's own shorthand for the conditions in the guidance tables; read the guidance for the official numbering and wording.</p>}
            {p.id === 'jp' && <p className="small">Japan has no list of categories by change type. The app asks how the item appears in the approval form, then applies the Article 47 exclusions. Moderate change items (2024) and annual report items (2025) are trials that apply only to items designated in the approval.</p>}
            <h3 style={{ marginTop: '1rem' }}>Change log</h3>
            <ul className="small">{p.changeLog.map((c) => <li key={c.edition}>{c.edition} ({c.date}): {c.text}</li>)}</ul>
          </section>
        );
      })}
    </div>
  );
}
