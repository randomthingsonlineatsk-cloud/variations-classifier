import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import { packFor, GROUP, CHANGES, searchChanges, rankOf } from '../engine/packs.js';
import { newCase, addChange } from '../engine/model.js';
import { Cat } from '../components/ui.jsx';

// Every category a change can reach in a pack, lowest first.
function reachable(pack, changeId) {
  const out = new Set();
  const walk = (n) => { if (!n) return; if (n.cat) { out.add(n.cat); return; } Object.values(n.on).forEach(walk); };
  walk(pack.entries[changeId]?.tree);
  return [...out].sort((a, b) => rankOf(pack, a) - rankOf(pack, b));
}

export default function Catalogue() {
  const { products, productById, user, saveCase } = useApp();
  const pack = packFor('us');
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [productId, setProductId] = useState(products[0].id);
  const product = productById(productId);
  const list = useMemo(() => searchChanges(CHANGES, q).filter((c) => !group || c.group === group), [q, group]);
  const applies = (c) => c.scope === 'all' || (c.scope === 'bio' && product.facts.bio) || (c.scope === 'small' && !product.facts.bio) || (c.scope === 'sterile' && product.facts.sterile);
  const start = async (c) => {
    const k = newCase({ product, user, name: `${product.brandName}: ${c.title}` });
    addChange(k, c.id);
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <h1>Change catalogue</h1>
      <p>{CHANGES.length} changes, each with a decision tree in the US pack. The coloured pills show every category the change can reach; the questions decide which one applies.</p>
      <div className="grid-2 panel" style={{ marginBottom: '1rem' }}>
        <label className="field">Search<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="words such as site, shelf life, resin" /></label>
        <label className="field">Group
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All groups</option>
            {Object.values(GROUP).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="field">Product for new cases
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.label ?? p.brandName} · {p.appType.toUpperCase()}</option>)}
          </select>
        </label>
      </div>
      <p className="small muted" aria-live="polite">{list.length} change(s).</p>
      {Object.values(GROUP).map((g) => {
        const items = list.filter((c) => c.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: 'var(--step-1)' }}>{g.label}</h2>
            <div className="cat-grid">
              {items.map((c) => (
                <article key={c.id} className="cat-card">
                  <h3>{c.title}</h3>
                  <p className="small muted" style={{ margin: 0 }}>{c.help}</p>
                  <div className="row">{reachable(pack, c.id).map((x) => <Cat key={x} pack={pack} id={x} />)}</div>
                  <div className="row">
                    {applies(c)
                      ? <button className="btn small primary" onClick={() => start(c)}>Classify for {product.brandName}</button>
                      : <span className="small muted">Does not apply to {product.brandName}.</span>}
                    <span className="small muted">{c.kind === 'cmc' ? 'CMC' : c.kind}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
