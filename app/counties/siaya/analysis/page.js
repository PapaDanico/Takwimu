import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import { Provisional } from '../../../../components/ObsTable';
import { Limits } from '../../../../components/siaya/AnalysisTrends';
import { LABEL, RECORDS as R, gaps } from '../../../../components/siaya/AnalysisCalc';
import { ANALYSIS_TOPICS, MOVED_ANCHORS, topicHref } from '../../../../lib/analysis-topics';
import { pageMeta } from '../../../../lib/page-meta';

// Siaya analysis index (design review P1-2, 27 Nov 2026): the measures are on one page per topic
// (lib/analysis-topics.js). Old in-page anchors keep working: each section id is still here, as a link to its new page,
// and the inline script forwards any old anchor (sections and the tables in them) straight to the same anchor there.
export const metadata = pageMeta('/counties/siaya/analysis/', {
  title: 'Siaya analysis',
  description: 'Measures calculated by Takwimu Kenya from published figures for Siaya, one page per topic: the latest year; spending and the share of budget spent; revenue (transfers and own-source revenue); pending bills; audit findings that recur; spending per person, beside services and climate finance; and the gaps with their reasons.',
});

const forward = `(function(){var m=${JSON.stringify(MOVED_ANCHORS)};var h=decodeURIComponent(location.hash.slice(1));if(h&&m[h])location.replace(m[h]);})();`;

export default function SiayaAnalysis() {
  return (
    <main id="main" className="wrap page">
      <script dangerouslySetInnerHTML={{ __html: forward }} />
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Analysis" title="Siaya analysis"
        sub="The canonical home for Siaya’s share of budget spent, pending bills and real spending per person: the latest year, ten-year series, and measures worked out from figures the reports print, such as reliance on transfers and audit findings that recur. One page per topic."
        path="/counties/siaya/analysis/" shareText="Siaya analysis: calculated from published figures" />

      <section className="card gold" aria-labelledby="an-read">
        <h2 id="an-read">How to read the analysis</h2>
        <Provisional dataset={['siaya-analysis', 'siaya-analysis-layers']} lead={<><span className="tag warn" id="calc-label">{LABEL}</span> </>} />
        <ul className="how">
          <li><b>Every value can be traced.</b> Each has a calc_id, the formula in words and its inputs, each linked to the document and page it was read from. Open &ldquo;Inputs&rdquo; under any row.</li>
          <li><b>One source per calculation.</b> A numerator and its denominator come from the same document. Controller of Budget and county figures are kept as separate records and never mixed.</li>
          <li><b>Gaps stay gaps.</b> Where an input is missing or not comparable the record says why and has no value; nothing is filled or averaged. {gaps.length} of {R.length} records are gaps.</li>
          <li><b>No verdicts.</b> Rates and counts describe documents, not the performance of any person.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="an-topics">
        <h2 id="an-topics">Topics</h2>
        <ul className="an-topics">
          {ANALYSIS_TOPICS.map((t) => (
            <li key={t.slug}>
              <h3>{t.sections.length === 1
                ? <Link href={topicHref(t.slug, t.sections[0][0])} id={t.sections[0][0]}>{t.title}</Link>
                : <Link href={topicHref(t.slug)}>{t.title}</Link>}</h3>
              <p>{t.summary}{t.slug === 'revenue' ? <> The terms: <Link href="/learn/#own-source-revenue">own-source revenue explained</Link>.</> : null}</p>
              {t.sections.length > 1 ? (
                <ul className="an-sections" aria-label={`Sections on ${t.title}`}>
                  {t.sections.map(([id, label]) => {
                    const a = <a id={id} href={topicHref(t.slug, id)}>{label}</a>;
                    // The own-source revenue section had two ids; the old outer id wraps the link.
                    return <li key={id}>{id === 'an-a8' ? <span id="osr-composition">{a}</span> : a}</li>;
                  })}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <Limits />
    </main>
  );
}
