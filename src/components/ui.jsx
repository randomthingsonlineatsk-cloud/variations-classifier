import React from 'react';
import { categoryOf, sourceOf } from '../engine/packs.js';

export function Cat({ pack, id, big = false, label = 'short' }) {
  if (!id) return null;
  const c = categoryOf(pack, id);
  return <span className={`cat cat-${id} tone-${c?.tone ?? 'letter'}${big ? ' big' : ''}`}>{label === 'long' ? c?.label : c?.short ?? id}</span>;
}

export function Range({ pack, min, max }) {
  return <span className="row" style={{ gap: '.3rem' }}><Cat pack={pack} id={min} /><span className="small muted">to</span><Cat pack={pack} id={max} /></span>;
}

// A ladder of the pack's categories, lowest to highest, with the category's step lit.
export function Ladder({ pack, id }) {
  const rank = categoryOf(pack, id)?.rank ?? -1;
  const tone = categoryOf(pack, id)?.tone ?? 'letter';
  return (
    <div className="ladder" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${pack.categories.length}, 1fr)` }}>
      {pack.categories.map((c) => <span key={c.id} className={c.rank <= rank ? `on tone-${tone}` : ''} />)}
    </div>
  );
}

export function Cite({ pack, src, at, show = true }) {
  if (!show) return null;
  const s = sourceOf(pack, src);
  return (
    <span className="cite">
      <b>{at}</b> · {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}{s.version ? `, ${s.version}` : ''}{s.date ? ` (${s.date})` : ''}
    </span>
  );
}

export function Badge({ pack, id }) {
  const c = categoryOf(pack, id);
  return c ? <span className="pill">{c.badge}</span> : null;
}
