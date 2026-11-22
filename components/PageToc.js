// "Sections on this page" for every page with four or more sections (owner decision U7, 21 Nov 2026).
export default function PageToc({ items }) {
  return (
    <nav aria-label="Sections on this page"><ul className="toc">
      {items.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t}</a></li>)}
    </ul></nav>
  );
}
