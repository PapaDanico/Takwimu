import Link from 'next/link';
import ShareRow from './ShareRow';

export default function PageHead({ eyebrow, title, sub, path, shareText, county }) {
  return (
    <header>
      {county ? (
        <nav aria-label="Breadcrumb"><p className="eyebrow"><Link href="/counties/">Counties</Link> · <Link href={`/counties/${county.slug}/`}>{county.name}</Link> · {eyebrow}</p></nav>
      ) : <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
      {path && <ShareRow path={path} text={shareText || title} />}
    </header>
  );
}
