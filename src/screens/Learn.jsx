import React from 'react';
import { useApp } from '../ctx.js';
import data from '../data/lessons.json';

export default function Learn() {
  const { lessons } = useApp();
  return (
    <div className="page">
      <h1>Learn</h1>
      <p>Short lessons on post-approval changes in seven rule sets, and on the ICH lifecycle tools. Each ends with a check and a link to try the classifier on a realistic case. See also the <a href="#/glossary">glossary</a> and the <a href="#/quiz">quiz bank</a>.</p>
      {[['us', 'United States'], ['eu', 'European Union'], ['in', 'India and labelling'], ['intl', 'Canada, Switzerland, Japan and WHO PQ'], ['lifecycle', 'ICH Q12 and Q5E lifecycle tools']].map(([r, label]) => (
      <section key={r} style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: 'var(--step-2)' }}>{label}</h2>
      <div className="lesson-grid">
        {data.lessons.filter((l) => (l.section ?? l.region ?? 'us') === r).map((l) => (
          <a key={l.id} className="lesson-card" href={`#/learn/${l.id}`}>
            <span className="n">{l.id}</span>
            <strong>{l.title}</strong>
            <span className="small muted">{l.minutes} minutes{lessons[l.id] ? ` · best check ${lessons[l.id].best}%` : ''}</span>
          </a>
        ))}
      </div>
      </section>
      ))}
    </div>
  );
}
