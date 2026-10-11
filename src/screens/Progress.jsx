import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { MISSIONS } from '../engine/missions.js';
import { certificateStatus, RULES } from '../engine/certificate.js';
import { download } from '../engine/io.js';
import lessons from '../data/lessons.json';

export default function Progress() {
  const { attempts, lessons: done, cases, user, toast } = useApp();
  const status = useMemo(() => certificateStatus({ attempts, lessonsDone: done }), [attempts, done]);
  const [name, setName] = useState(user?.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const make = async (kind) => {
    if (kind === 'cert' && !name.trim()) { toast('Type the name to print on the certificate.', 'warn'); return; }
    setBusy(true);
    try {
      const { certificatePdf, progressStatementPdf } = await import('../engine/pdf.js');
      const bytes = kind === 'cert' ? await certificatePdf({ name, userId: user?.userId, status }) : await progressStatementPdf({ name, status });
      download(kind === 'cert' ? 'variations-classifier-certificate.pdf' : 'variations-classifier-progress.pdf', bytes, 'application/pdf');
    } catch (e) { toast(`Could not make the PDF: ${e.message}`, 'error'); }
    setBusy(false);
  };
  const ms = MISSIONS.map((m) => {
    const a = attempts.filter((x) => x.kind === 'mission' && x.missionId === m.id);
    return { m, best: a.length ? Math.max(...a.map((x) => x.score)) : null, tries: a.length, level: a.sort((x, y) => y.score - x.score)[0]?.difficulty };
  });
  const quiz = attempts.filter((a) => a.kind === 'quiz');
  const finished = ms.filter((x) => x.best != null).length;
  return (
    <div className="page">
      <h1>Progress</h1>
      <p className="small muted">Learner ID {user?.userId}. Results stay in this browser; export a project file from the Cases page to keep or move them.</p>
      <section className="panel stack" aria-labelledby="cert-h" style={{ marginBottom: '1.5rem' }}>
        <h2 id="cert-h" style={{ fontSize: 'var(--step-1)', margin: 0 }}>Completion certificate</h2>
        <p className="small" style={{ margin: 0 }}>A portfolio certificate for this app, separate from the eCTD Dossier Builder's. It is not an accreditation. It unlocks when every criterion is met; a distinction needs {RULES.distinctionMissions} missions at {RULES.distinctionScore} or more on the expert level.</p>
        <ul className="checklist">
          {status.criteria.map((c) => <li key={c.id}><label><input type="checkbox" readOnly checked={c.done >= c.of} tabIndex={-1} aria-hidden="true" /><span>{c.label}: <strong>{c.done} of {c.of}</strong></span></label></li>)}
        </ul>
        <label className="field" style={{ maxWidth: 420 }}>Name on the certificate<input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <div className="row">
          <button className="btn primary" disabled={!status.eligible || busy} onClick={() => make('cert')}>{busy ? 'Making…' : 'Download certificate (PDF)'}</button>
          <button className="btn" disabled={busy} onClick={() => make('progress')}>Statement of progress (PDF)</button>
        </div>
        {!status.eligible && <p className="small muted" style={{ margin: 0 }}>The statement of progress is available any time and claims no completion.</p>}
        {status.distinction && <p className="small" style={{ margin: 0 }}><strong>Distinction:</strong> {status.expertCount} missions at expert level.</p>}
      </section>
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="panel"><div className="score-big">{finished}/{MISSIONS.length}</div><div className="small muted">missions done</div></div>
        <div className="panel"><div className="score-big">{Object.keys(done).length}/{lessons.lessons.length}</div><div className="small muted">lesson checks saved</div></div>
        <div className="panel"><div className="score-big">{quiz.length ? `${Math.max(...quiz.map((q) => q.score))}%` : '-'}</div><div className="small muted">best quiz round ({quiz.length} saved)</div></div>
        <div className="panel"><div className="score-big">{cases.filter((c) => !c.missionId).length}</div><div className="small muted">own cases</div></div>
      </div>
      <h2 style={{ fontSize: 'var(--step-2)' }}>Missions</h2>
      <div className="table-wrap" tabIndex={0}>
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
