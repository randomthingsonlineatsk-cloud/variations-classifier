import React from 'react';
import { categoryOf, sourceOf } from '../engine/packs.js';

export function Cat({ pack, id, big = false, label = 'short' }) {
  if (!id) return null;
  const c = categoryOf(pack, id);
  return <span className={`cat cat-${id}${big ? ' big' : ''}`}>{label === 'long' ? c?.label : c?.short ?? id}</span>;
}

export function Range({ pack, min, max }) {
  return <span className="row" style={{ gap: '.3rem' }}><Cat pack={pack} id={min} /><span className="small muted">to</span><Cat pack={pack} id={max} /></span>;
}

// Five-step ladder from letter to PAS, with the category's step lit.
export function Ladder({ pack, id }) {
  const rank = categoryOf(pack, id)?.rank ?? -1;
  return (
    <div className="ladder" aria-hidden="true">
      {pack.categories.map((c) => <span key={c.id} className={c.rank <= rank ? `on cat-${id}` : ''} />)}
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
