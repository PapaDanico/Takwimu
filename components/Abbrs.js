import Link from 'next/link';
import { ABBR } from '../lib/abbreviations';

// One line near the top of a page that expands every abbreviation the page uses, before its first use (owner decision U4).
export default function Abbrs({ list }) {
  return (
    <p className="abbr-line"><b>Abbreviations on this page:</b>{' '}
      {list.map((k, i) => <span key={k}>{i ? '; ' : ''}<Link href={`/learn/#${ABBR[k].id}`}>{k}</Link>, {ABBR[k].full}</span>)}.
    </p>
  );
}
