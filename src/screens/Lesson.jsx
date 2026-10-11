import React, { useMemo, useState } from 'react';
import { useApp, go } from '../ctx.js';
import data from '../data/lessons.json';
import quiz from '../data/quiz.json';
import { CHANGE, regionsFor } from '../engine/packs.js';
import { newCase, addChange } from '../engine/model.js';

export default function Lesson({ id }) {
  const { saveLesson, toast, products, user, saveCase } = useApp();
  const l = data.lessons.find((x) => x.id === id);
  const qs = useMemo(() => quiz.questions.filter((q) => q.topic === l?.topic).slice(0, 4), [l]);
  const [ans, setAns] = useState({});
  if (!l) return <div className="page"><h1>Lesson not found</h1></div>;
  const done = Object.keys(ans).length === qs.length;
  const right = qs.filter((q) => ans[q.id] === q.answer).length;
  const tryIt = async () => {
    const region = l.region ?? 'us';
    const product = products.find((p) => regionsFor(p).includes(region) && (CHANGE[l.tryChange].scope === 'bio' ? p.facts.bio : !p.facts.bio)) ?? products[0];
    const k = newCase({ product, user, regions: [region], name: `Lesson ${l.id}: ${CHANGE[l.tryChange].title}` });
    addChange(k, l.tryChange);
    await saveCase(k);
    go(`/case/${k.id}`);
  };
  return (
    <div className="page lesson">
      <p className="small"><a href="#/learn">Learn</a> / Lesson {l.id}</p>
      <h1>{l.title}</h1>
      {l.sections.map((s) => (
        <section key={s.h}>
          <h2 style={{ fontSize: 'var(--step-2)' }}>{s.h}</h2>
          {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </section>
      ))}
      <section>
        <h2 style={{ fontSize: 'var(--step-2)' }}>Check</h2>
        {qs.map((q, i) => {
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
        })}
        <div className="row">
          {done && <button className="btn primary" onClick={async () => { const s = Math.round((right / qs.length) * 100); await saveLesson(l.id, s); toast(`Lesson ${l.id}: ${right} of ${qs.length}.`); }}>Save result ({right} of {qs.length})</button>}
          <button className="btn" onClick={tryIt}>Try it: {CHANGE[l.tryChange].title.toLowerCase()}</button>
          {data.lessons.some((x) => x.id === id + 1) && <a className="btn ghost" href={`#/learn/${id + 1}`}>Next lesson</a>}
        </div>
      </section>
    </div>
  );
}
