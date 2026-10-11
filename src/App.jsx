import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx } from './ctx.js';
import { db, getUser, getMeta, setMeta } from './engine/db.js';
import { BUILTIN_PRODUCTS, touch, migrateCase } from './engine/model.js';
import Home from './screens/Home.jsx';
import CaseView from './screens/CaseView.jsx';
import Catalogue from './screens/Catalogue.jsx';
import Products from './screens/Products.jsx';
import Learn from './screens/Learn.jsx';
import Lesson from './screens/Lesson.jsx';
import Missions from './screens/Missions.jsx';
import Quiz from './screens/Quiz.jsx';
import Progress from './screens/Progress.jsx';
import Sources from './screens/Sources.jsx';
import Glossary from './screens/Glossary.jsx';
import Compare from './screens/Compare.jsx';
import Requests from './screens/Requests.jsx';
import Labelling from './screens/Labelling.jsx';
import Drills from './screens/Drills.jsx';
import Lifecycle from './screens/Lifecycle.jsx';

function useHashRoute() {
  const read = () => (window.location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => { setParts(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

const NAV = [
  ['', 'Cases'], ['requests', 'Requests'], ['labelling', 'Labelling'], ['catalogue', 'Catalogue'], ['compare', 'Compare'], ['lifecycle', 'Lifecycle'], ['products', 'Products'], ['learn', 'Learn'],
  ['missions', 'Missions'], ['quiz', 'Quiz'], ['progress', 'Progress'], ['sources', 'Sources'],
];

export default function App() {
  const route = useHashRoute();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [custom, setCustom] = useState([]);
  const [lifecycle, setLifecycle] = useState([]);
  const [lessons, setLessons] = useState({});
  const [theme, setTheme] = useState('system');
  const [toasts, setToasts] = useState([]);
  const [dbError, setDbError] = useState(null);

  const toast = useCallback((text, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'info' ? 3500 : 7000);
  }, []);

  const reload = useCallback(async () => {
    const [c, a, p, l] = await Promise.all([db.all('cases'), db.all('attempts'), db.all('products'), db.all('lifecycle')]);
    c.forEach(migrateCase);
    c.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    l.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    setCases(c); setAttempts(a); setCustom(p); setLifecycle(l);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setUser(await getUser());
        setLessons(await getMeta('lessons', {}));
        setTheme(await getMeta('theme', 'system'));
        await reload();
      } catch {
        setDbError('Your browser blocked local storage (IndexedDB). Cases cannot be saved in this window; try a normal, non-private window.');
      }
    })();
  }, [reload]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
  }, [theme]);

  const products = useMemo(() => [...BUILTIN_PRODUCTS, ...custom], [custom]);
  const ctx = useMemo(() => ({
    user, cases, attempts, products, lessons, lifecycle, toast, reload,
    saveDoc: async (d) => { await db.put('lifecycle', { ...d, updatedAt: new Date().toISOString() }); await reload(); },
    deleteDoc: async (id) => { await db.del('lifecycle', id); await reload(); },
    productById: (id) => products.find((p) => p.id === id),
    saveCase: async (k) => { await db.put('cases', touch(k)); await reload(); },
    deleteCase: async (id) => { await db.del('cases', id); await reload(); },
    saveProduct: async (p) => { await db.put('products', { ...p, userId: user?.userId ?? null, classId: user?.classId ?? null }); await reload(); },
    deleteProduct: async (id) => { await db.del('products', id); await reload(); },
    saveAttempt: async (fields) => {
      const now = new Date().toISOString();
      await db.put('attempts', { id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, userId: user?.userId ?? null, classId: user?.classId ?? null, at: now, ...fields });
      await reload();
    },
    saveLesson: async (id, score) => {
      const next = { ...lessons, [id]: { best: Math.max(score, lessons[id]?.best ?? 0), at: new Date().toISOString(), userId: user?.userId, classId: user?.classId ?? null } };
      setLessons(next); await setMeta('lessons', next);
    },
    importAll: async ({ cases: cs0, attempts: as, products: ps, lessons: ls, lifecycle: lc = [] }) => {
      for (const c of cs0) await db.put('cases', migrateCase(c));
      for (const d of lc) await db.put('lifecycle', d);
      for (const a of as) await db.put('attempts', a);
      for (const p of ps) await db.put('products', p);
      if (ls && Object.keys(ls).length) { const next = { ...ls, ...lessons }; setLessons(next); await setMeta('lessons', next); }
      await reload();
    },
  }), [user, cases, attempts, products, lessons, lifecycle, toast, reload]);

  const [section, arg] = route;
  let screen;
  if (!section) screen = <Home />;
  else if (section === 'case' && arg) screen = <CaseView key={arg} id={arg} />;
  else if (section === 'catalogue') screen = <Catalogue />;
  else if (section === 'products') screen = <Products />;
  else if (section === 'learn' && arg) screen = <Lesson id={Number(arg)} />;
  else if (section === 'learn') screen = <Learn />;
  else if (section === 'missions') screen = <Missions />;
  else if (section === 'quiz') screen = <Quiz />;
  else if (section === 'progress') screen = <Progress />;
  else if (section === 'sources') screen = <Sources />;
  else if (section === 'glossary') screen = <Glossary />;
  else if (section === 'compare') screen = <Compare />;
  else if (section === 'requests') screen = <Requests />;
  else if (section === 'labelling') screen = <Labelling />;
  else if (section === 'drills') screen = <Drills />;
  else if (section === 'lifecycle') screen = <Lifecycle tab={arg} />;
  else screen = <div className="page"><h1>Page not found</h1><p><a href="#/">Go to your cases</a></p></div>;

  const cycleTheme = async () => {
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
    setTheme(next); try { await setMeta('theme', next); } catch { /* storage blocked */ }
  };
  const current = section === 'case' ? '' : section === 'glossary' ? 'learn' : section === 'drills' ? 'quiz' : (section ?? '');

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">
        <a href="#main" className="sr-only">Skip to content</a>
        <header className="topbar">
          <a className="brand" href="#/">
            <span className="brand-ladder" aria-hidden="true" style={{ width: 20 }}>
              {['--c-pas', '--c-cbe30', '--c-cbe0', '--c-ar'].map((v, i) => <span key={v} style={{ background: `var(${v})`, width: `${100 - i * 22}%` }} />)}
            </span>
            Variations Classifier
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map(([k, l]) => <a key={k} href={`#/${k}`} aria-current={current === k ? 'page' : undefined}>{l}</a>)}
          </nav>
          <span className="spacer" />
          <button className="btn small ghost" onClick={cycleTheme} aria-label={`Theme: ${theme}. Change theme`}>Theme: {theme}</button>
        </header>
        {dbError && <div className="callout bad" role="alert" style={{ margin: '1rem' }}>{dbError}</div>}
        <main id="main">{user || dbError ? screen : <div className="page muted">Loading…</div>}</main>
        <footer className="footer">
          <span>Built by <strong>Khan Gulrez Shagufa Fazal Ahmed</strong></span>
          <span>Training only. Products, companies and people are fictional; results are not regulatory advice. Your work stays in this browser.</span>
          <span>Apache-2.0</span>
        </footer>
        <div className="toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
              <span>{t.text}</span>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss">✕</button>
            </div>
          ))}
        </div>
      </div>
    </AppCtx.Provider>
  );
}
