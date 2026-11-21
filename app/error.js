'use client';
// Error boundary for every page: a plain message, a retry, and ways back. No technical detail is shown.
import Link from 'next/link';

export default function Error({ reset }) {
  return (
    <main id="main" className="wrap page">
      <section className="card nf" aria-labelledby="err-h">
        <p className="eyebrow">Something went wrong</p>
        <h1 id="err-h">This view could not be shown</h1>
        <p className="page-sub" style={{ marginInline: 'auto' }}>The page hit a problem while loading. Your data and saved views are safe. Try again, or go back.</p>
        <p className="toolbar" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-s" onClick={() => reset()}>Try again</button>
          <button type="button" className="btn-s ghost" onClick={() => window.history.back()}>Back</button>
          <Link className="btn-s ghost" href="/">Home</Link>
        </p>
        <p className="muted">If it keeps happening, please <a href="https://github.com/PapaDanico/Takwimu/issues/new">report it</a> and say which page and what you chose.</p>
      </section>
    </main>
  );
}
