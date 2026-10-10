import React from 'react';
import { useApp } from '../ctx.js';
import data from '../data/lessons.json';

export default function Learn() {
  const { lessons } = useApp();
  return (
    <div className="page">
      <h1>Learn</h1>
      <p>Six short lessons on US post-approval changes. Each ends with a check and a link to try the classifier on a real-looking case. See also the <a href="#/glossary">glossary</a> and the <a href="#/quiz">quiz bank</a>.</p>
      <div className="lesson-grid">
        {data.lessons.map((l) => (
          <a key={l.id} className="lesson-card" href={`#/learn/${l.id}`}>
            <span className="n">{l.id}</span>
            <strong>{l.title}</strong>
            <span className="small muted">{l.minutes} minutes{lessons[l.id] ? ` · best check ${lessons[l.id].best}%` : ''}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
