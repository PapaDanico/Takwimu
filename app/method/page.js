import Link from 'next/link';
import PageHead from '../../components/PageHead';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';

export const metadata = {
  title: 'Method: sources, confidence and verification',
  description: 'How Takwimu Kenya collects, checks, scores and corrects the numbers it publishes.',
};

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

const RUBRIC = [
  { score: 5, meaning: 'Read directly from the primary document and confirmed a second way (for example a second reading of the page, or a matching total).' },
  { score: 4, meaning: 'Read from the primary document and passes arithmetic checks. Scanned pages read by text recognition are capped here.' },
  { score: 3, meaning: 'A secondary reproduction of an official figure, a projection, or a reading from a noisy scan. Shown with a note.' },
  { score: 2, meaning: 'A press report attributed to an official source that we have not seen. Shown only as a lead, with a warning.' },
  { score: 1, meaning: 'Not found or not verified. Listed as a gap, never plotted.' },
];

const SOURCES = [
  { name: 'Controller of Budget, annual county budget implementation review reports', what: 'Approved budget, spending, own-source revenue, pending bills, by county and year', how: 'Downloaded from the Parliament of Kenya library; the Siaya section is read from the text layer or, for scanned pages, with text recognition' },
  { name: 'Auditor-General, reports on the County Executive of Siaya', what: 'Audit opinion and the reasons for it', how: 'Downloaded from the Parliament library; every quoted sentence was matched against the report text' },
  { name: 'Siaya County Integrated Development Plan 2023 to 2027', what: 'Sub-county population, facilities, poverty and health figures', how: 'Text layer, with sums and densities recomputed by our validator' },
  { name: 'Siaya County Annual Development Plans (2015/16, 2017/18, 2018/19)', what: '2009 census population by constituency and earlier projections', how: 'Text layer; six constituencies must add to the county total' },
  { name: 'Kenya Demographic and Health Surveys 2014 and 2022', what: 'County health indicators in two survey years', how: 'Rows read from the report tables and spot-checked against the downloaded text' },
  { name: 'World Bank, consumer price index for Kenya', what: 'Prices, for the real-terms view', how: 'World Bank data interface; fiscal-year averages of calendar-year indices' },
];

export default function Method() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Method" title="How Takwimu handles numbers" sub="What we publish, where it comes from, how we check it, and what we do when two sources disagree." path="/method/" shareText="How Takwimu Kenya handles numbers" />
      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#sources">Sources</a></li><li><a href="#confidence">Confidence</a></li><li><a href="#checks">Checks</a></li><li><a href="#conflicts">Disagreements</a></li><li><a href="#prices">Prices</a></li><li><a href="#years">Fiscal years</a></li><li><a href="#people">Named people</a></li><li><a href="#gaps">Gaps</a></li>
      </ul></nav>

      <section id="sources" className="card" aria-labelledby="so-h">
        <h2 id="so-h">Sources</h2>
        <p className="lead">Every figure shows its source, publication or retrieval date, period, unit and a confidence score. Primary official documents take priority over press reports.</p>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Source register</caption>
            <thead><tr><th scope="col">Source</th><th scope="col">What we use it for</th><th scope="col">How we read it</th></tr></thead>
            <tbody>{SOURCES.map((s) => <tr key={s.name}><th scope="row">{s.name}</th><td>{s.what}</td><td>{s.how}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section id="confidence" className="card" aria-labelledby="cf-h">
        <h2 id="cf-h">Confidence score</h2>
        <div className="tablewrap">
          <table className="data rubric">
            <caption className="sr-only">Confidence rubric</caption>
            <thead><tr><th scope="col">Score</th><th scope="col">Meaning</th></tr></thead>
            <tbody>{RUBRIC.map((r) => <tr key={r.score}><th scope="row">{r.score} of 5</th><td>{r.meaning}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section id="checks" className="card" aria-labelledby="ck-h">
        <h2 id="ck-h">What we check before publishing</h2>
        <ol className="steps">
          <li>Many reports are scans. We read them with text recognition and, for key figures, with a second engine. Scanned readings are capped at confidence 4.</li>
          <li>Budget parts must add to the approved total and spending parts to total spending.</li>
          <li>Absorption rates are recomputed from spending and budget and compared with the report's stated rate.</li>
          <li>Sub-county populations must add to the county census total, and densities must match population over area.</li>
          <li>A figure that cannot pass its checks is shown with a caveat or left out. The build fails if any figure loses its source.</li>
        </ol>
      </section>

      <section id="conflicts" className="card" aria-labelledby="cn-h">
        <h2 id="cn-h">When sources disagree</h2>
        <p>Both values are shown side by side with their sources. We never average them or pick a winner without evidence. Current examples:</p>
        <ul className="steps">{hist.osr_series.conflicts.map((c) => <li key={c}>{c}</li>)}<li>FY 2023/24 own-source revenue: KSh 610.74 million (FY 2023/24 report) against KSh 427.95 million (FY 2024/25 report).</li><li>Pending bills at 30 June 2021: KSh 1,061 million (FY 2020/21 report) against KSh 602 million (FY 2021/22 report).</li></ul>
        <p>All open items are on the <Link href="/data/#conflicts">Data page</Link>.</p>
      </section>

      <section id="prices" className="card" aria-labelledby="pr-h">
        <h2 id="pr-h">Real-terms (price-adjusted) values</h2>
        <p>{cpi.meta.method} Source: <a href={cpi.meta.source_url}>{cpi.meta.source}</a>, retrieved {cpi.meta.retrieved}. Status: {cpi.meta.status}.</p>
      </section>

      <section id="years" className="card" aria-labelledby="fy-h">
        <h2 id="fy-h">Fiscal years</h2>
        <p>Kenya's fiscal year runs from 1 July to 30 June. FY 2024/25 is July 2024 to June 2025. Population figures are for calendar years. Where a chart mixes the two, the label says so.</p>
      </section>

      <section id="people" className="card" aria-labelledby="pe-h">
        <h2 id="pe-h">Named people and parties</h2>
        <p>Takwimu does not label named individuals as wrong or misleading. Any claim tied to a person needs a primary document and a legal check first.</p>
      </section>

      <section id="gaps" className="card" aria-labelledby="gp-h">
        <h2 id="gp-h">Known gaps</h2>
        <ul className="steps">{hist.meta.gaps.map((g) => <li key={g}>{g}</li>)}<li>{hist.poverty.gap}</li><li>County health series between 2014 and 2022 are not shown; only the two survey years are available.</li></ul>
        <p className="how">Found a mistake? <a href={ISSUES_URL}>Report it</a>.</p>
      </section>
    </main>
  );
}
