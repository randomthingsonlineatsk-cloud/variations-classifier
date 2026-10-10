import React from 'react';
import { useApp } from '../ctx.js';
import { MISSIONS } from '../engine/missions.js';
import lessons from '../data/lessons.json';

export default function Progress() {
  const { attempts, lessons: done, cases, user } = useApp();
  const ms = MISSIONS.map((m) => {
    const a = attempts.filter((x) => x.kind === 'mission' && x.missionId === m.id);
    return { m, best: a.length ? Math.max(...a.map((x) => x.score)) : null, tries: a.length, level: a.sort((x, y) => y.score - x.score)[0]?.difficulty };
  });
  const quiz = attempts.filter((a) => a.kind === 'quiz');
  const finished = ms.filter((x) => x.best != null).length;
  return (
    <div className="page">
      <h1>Progress</h1>
      <p className="small muted">Learner ID {user?.userId}. Results stay in this browser; export a project file from the Cases page to keep or move them. A certificate comes in a later phase.</p>
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="panel"><div className="score-big">{finished}/{MISSIONS.length}</div><div className="small muted">missions done</div></div>
        <div className="panel"><div className="score-big">{Object.keys(done).length}/{lessons.lessons.length}</div><div className="small muted">lesson checks saved</div></div>
        <div className="panel"><div className="score-big">{quiz.length ? `${Math.max(...quiz.map((q) => q.score))}%` : '-'}</div><div className="small muted">best quiz round ({quiz.length} saved)</div></div>
        <div className="panel"><div className="score-big">{cases.filter((c) => !c.missionId).length}</div><div className="small muted">own cases</div></div>
      </div>
      <h2 style={{ fontSize: 'var(--step-2)' }}>Missions</h2>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Mission</th><th>Best score</th><th>Level of best</th><th>Attempts</th></tr></thead>
          <tbody>{ms.map(({ m, best, tries, level }) => <tr key={m.id}><td>{m.id}. {m.title}</td><td>{best ?? '-'}</td><td>{level ?? '-'}</td><td>{tries}</td></tr>)}</tbody>
        </table>
      </div>
      <h2 style={{ fontSize: 'var(--step-2)', marginTop: '1.5rem' }}>Lessons</h2>
      <ul>{lessons.lessons.map((l) => <li key={l.id}><a href={`#/learn/${l.id}`}>{l.title}</a>: {done[l.id] ? `${done[l.id].best}%` : 'not checked yet'}</li>)}</ul>
    </div>
  );
}
