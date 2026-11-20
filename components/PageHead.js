import ShareRow from './ShareRow';

export default function PageHead({ eyebrow, title, sub, path, shareText }) {
  return (
    <header>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
      {path && <ShareRow path={path} text={shareText || title} />}
    </header>
  );
}
