import Link from 'next/link';

// Page header for the Explore pages: breadcrumb trail, title and summary. The breadcrumb is the only way back
// (design review P2-5: a "Back to Home" link under a "Home" crumb said the same thing twice).
// trail: [{ href, label }] from Home down to the parent; the current page is the last crumb (not a link).
export default function ExploreHead({ trail, current, title, sub, children }) {
  return (
    <header>
      <nav aria-label="Breadcrumb">
        <ol className="crumbs">
          {trail.map((t) => <li key={t.href}><Link href={t.href}>{t.label}</Link></li>)}
          <li aria-current="page">{current}</li>
        </ol>
      </nav>
      <h1>{title}</h1>
      {sub ? <p className="page-sub">{sub}</p> : null}
      {children}
    </header>
  );
}
