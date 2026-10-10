import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import data from '../data/quiz.json';

function shuffle(a, seed) {
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

export default function Quiz() {
  const { saveAttempt, toast, attempts } = useApp();
  const [topic, setTopic] = useState('');
  const [seed, setSeed] = useState(() => Date.now());
  const [mode, setMode] = useState('quiz');
  const qs = useMemo(() => shuffle(data.questions.filter((q) => !topic || q.topic === topic), seed).slice(0, 10), [topic, seed]);
  const [ans, setAns] = useState({});
  const [flip, setFlip] = useState({});
  const right = qs.filter((q) => ans[q.id] === q.answer).length;
  const done = qs.length > 0 && Object.keys(ans).length === qs.length;
  const reset = () => { setSeed(Date.now()); setAns({}); setFlip({}); };
  const past = attempts.filter((a) => a.kind === 'quiz');
  return (
    <div className="page">
      <h1>Quiz bank</h1>
      <p className="small">Want speed practice? Try the <a href="#/drills">classification drills</a>.</p>
      <p>{data.questions.length} questions on US and EU post-approval changes, each with its source. Ten at a time.{past.length ? ` You have saved ${past.length} round(s); best ${Math.max(...past.map((a) => a.score))}%.` : ''}</p>
      <div className="row panel" style={{ marginBottom: '1rem' }}>
        <label className="field" style={{ minWidth: 240 }}>Topic
          <select value={topic} onChange={(e) => { setTopic(e.target.value); setAns({}); setFlip({}); }}>
            <option value="">All topics</option>
            {data.topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <div className="seg" role="group" aria-label="Mode">
          <button aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>Quiz</button>
          <button aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>Flashcards</button>
        </div>
        <button className="btn" onClick={reset}>New set</button>
      </div>
      {mode === 'quiz' ? qs.map((q, i) => {
        const a = ans[q.id];
        return (
          <div key={q.id} className="quiz-q">
            <fieldset>
              <legend>{i + 1}. {q.q}</legend>
              {q.options.map((o, j) => (
                <label key={o} className={`quiz-opt ${a !== undefined && j === q.answer ? 'right' : a === j ? 'wrong' : ''}`}>
                  <input type="radio" name={q.id} disabled={a !== undefined} checked={a === j} onChange={() => setAns({ ...ans, [q.id]: j })} /> <span>{o}</span>
                </label>
              ))}
            </fieldset>
            {a !== undefined && <p className="small" style={{ margin: '.4rem 0 0' }}>{a === q.answer ? 'Correct. ' : 'Not quite. '}{q.why} <span className="muted">({q.cite})</span></p>}
          </div>
        );
      }) : (
        <div className="cat-grid">
          {qs.map((q) => (
            <button key={q.id} className="cat-card" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'var(--ink)' }} onClick={() => setFlip({ ...flip, [q.id]: !flip[q.id] })} aria-pressed={!!flip[q.id]}>
              {flip[q.id] ? <><strong>{q.options[q.answer]}</strong><span className="small">{q.why}</span><span className="small muted">{q.cite}</span></> : <><span>{q.q}</span><span className="small muted">Select to turn over</span></>}
            </button>
          ))}
        </div>
      )}
      {mode === 'quiz' && (
        <div className="row" style={{ marginTop: '1rem' }}>
          <span aria-live="polite">{Object.keys(ans).length} of {qs.length} answered{Object.keys(ans).length ? `, ${right} right` : ''}.</span>
          {done && <button className="btn primary" onClick={async () => { const score = Math.round((right / qs.length) * 100); await saveAttempt({ kind: 'quiz', topic: topic || 'all', score, right, total: qs.length }); toast(`Quiz: ${right} of ${qs.length}.`); reset(); }}>Save score</button>}
        </div>
      )}
    </div>
  );
}
