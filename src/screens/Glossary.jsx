import React, { useState } from 'react';
import data from '../data/glossary.json';

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = data.terms.filter((t) => `${t.term} ${t.def}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <p className="small"><a href="#/learn">Learn</a> / Glossary</p>
      <h1>Glossary</h1>
      <label className="field" style={{ maxWidth: 360, marginBottom: '1rem' }}>Search<input type="search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <dl>
        {list.map((t) => (
          <div key={t.term} style={{ marginBottom: '.9rem' }}>
            <dt><strong>{t.term}</strong> <span className="pill">{t.region}</span></dt>
            <dd style={{ margin: '.2rem 0 0' }}>{t.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
