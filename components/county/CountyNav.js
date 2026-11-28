import Link from 'next/link';

// Every page of a county from the registry, at the foot of each (the same role as components/SiayaRelated.js).
export default function CountyNav({ name, links, current }) {
  return (
    <nav className="wrap siaya-related" aria-label={`${name} County pages`}>
      <h2 className="mini">{name} County pages</h2>
      <ul className="toc">{links.map(([h, t]) => <li key={h}><Link href={h} aria-current={h === current ? 'page' : undefined}>{t}</Link></li>)}</ul>
    </nav>
  );
}
