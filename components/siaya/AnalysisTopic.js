import Link from 'next/link';
import PageHead from '../PageHead';
import Abbrs from '../Abbrs';
import { Provisional } from '../ObsTable';
import { LABEL } from './AnalysisCalc';
import { ANALYSIS_BASE, ANALYSIS_TOPICS, topicOf } from '../../lib/analysis-topics';

export const topicMetadata = (slug) => {
  const t = topicOf(slug);
  return { title: `${t.title} | Siaya analysis`, description: `Siaya analysis, ${t.title.toLowerCase()}: ${t.summary}` };
};

// One Siaya analysis topic page (lib/analysis-topics.js). The full "how to read" note and the limits stay once, on
// the index; each topic page carries the calculated label, the provisional label and a link to them.
export default function AnalysisTopic({ slug, abbrs, children }) {
  const t = topicOf(slug);
  const path = `${ANALYSIS_BASE}${slug}/`;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow={<><Link href={ANALYSIS_BASE}>Analysis</Link> · {t.nav}</>} title={t.title}
        sub={t.summary} path={path} shareText={`Siaya analysis, ${t.title.toLowerCase()}: calculated from published figures`} />
      {abbrs ? <Abbrs list={abbrs} /> : null}
      <section className="card gold" aria-label="About these figures">
        <Provisional dataset={['siaya-analysis', 'siaya-analysis-layers']} lead={<><span className="tag warn" id="calc-label">{LABEL}</span> </>} />
        <p className="how">Every value has a calc_id, its formula and its inputs, each linked to the document and page it was read from. How to read these calculations, and what they cannot tell you: <Link href={`${ANALYSIS_BASE}#an-read`}>Siaya analysis</Link>.{abbrs && abbrs.includes('FIF') ? null : <> Own-source revenue and how each publisher counts it: <Link href="/learn/#own-source-revenue">explained on Learn</Link>.</>}</p>
      </section>
      <nav aria-label="Analysis topics" className="no-print"><ul className="toc">
        {ANALYSIS_TOPICS.map((x) => <li key={x.slug}><Link href={`${ANALYSIS_BASE}${x.slug}/`} aria-current={x.slug === slug ? 'page' : undefined}>{x.nav}</Link></li>)}
      </ul></nav>
      {t.sections.length > 1 ? (
        <nav aria-label="Sections on this page"><ul className="toc">
          {t.sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
        </ul></nav>
      ) : null}
      {children}
    </main>
  );
}
