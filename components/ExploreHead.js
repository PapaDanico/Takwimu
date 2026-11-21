import Link from 'next/link';

// Page header for the Explore pages: breadcrumb trail, title, summary, and plain Back and Home links.
// trail: [{ href, label }] from Home down to the parent; the current page is the last crumb (not a link).
export default function ExploreHead({ trail, current, title, sub, children }) {
  const parent = trail[trail.length - 1];
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
      <p className="backhome no-print">
        <Link href={parent.href}>← Back to {parent.label}</Link>
        {parent.href !== '/' ? <Link href="/">Home</Link> : null}
      </p>
    </header>
  );
}
