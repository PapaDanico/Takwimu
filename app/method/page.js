import Link from 'next/link';
import OsrNote from '../../components/OsrNote';
import TableWrap from '../../components/TableWrap';
import PageHead from '../../components/PageHead';
import hist from '../../data/history.json';
import cpi from '../../data/cpi.json';

export const metadata = {
  title: 'Method: sources, confidence and verification',
  description: 'How Takwimu Kenya collects, checks, scores and corrects the numbers it publishes.',
};

import { ISSUES_URL } from '../../lib/site';
import { KNOWN_GAPS } from '../../lib/known-gaps';
import { DEP, SER, gaps as layerGaps } from '../../lib/layers';
import { Provisional } from '../../components/ObsTable';

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
      <Provisional dataset={'history'} />
      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#sources">Sources</a></li><li><a href="#confidence">Confidence</a></li><li><a href="#checks">Checks</a></li><li><a href="#conflicts">Disagreements</a></li><li><a href="#review">Editorial review</a></li><li><a href="#corrections">Corrections</a></li><li><a href="#prices">Prices</a></li><li><a href="#years">Fiscal years</a></li><li><a href="#people">Named people</a></li><li><a href="#known-gaps">Gaps</a></li>
      </ul></nav>

      <section id="sources" className="card" aria-labelledby="so-h">
        <h2 id="so-h">Sources</h2>
        <p className="lead">Every figure shows its source, publication or retrieval date, period, unit and a confidence score. Primary official documents take priority over press reports.</p>
        <TableWrap label="Source register">
          <table className="data">
            <caption className="sr-only">Source register</caption>
            <thead><tr><th scope="col">Source</th><th scope="col">What we use it for</th><th scope="col">How we read it</th></tr></thead>
            <tbody>{SOURCES.map((s) => <tr key={s.name}><th scope="row">{s.name}</th><td>{s.what}</td><td>{s.how}</td></tr>)}</tbody>
          </table>
        </TableWrap>
      </section>

      <section id="confidence" className="card" aria-labelledby="cf-h">
        <h2 id="cf-h">Confidence score</h2>
        <TableWrap label="Confidence rubric">
          <table className="data rubric">
            <caption className="sr-only">Confidence rubric</caption>
            <thead><tr><th scope="col">Score</th><th scope="col">Meaning</th></tr></thead>
            <tbody>{RUBRIC.map((r) => <tr key={r.score}><th scope="row">{r.score} of 5</th><td>{r.meaning}</td></tr>)}</tbody>
          </table>
        </TableWrap>
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
        <p>Both values are shown side by side with their sources. We never average them or pick a winner without evidence. Every open case, with both readings and their documents, is in one place: the <Link href="/data/#conflicts">conflict register</Link>.</p>
      </section>

      <section id="review" className="card" aria-labelledby="rv-h">
        <h2 id="rv-h">Editorial review</h2>
        <p>Every value Takwimu transcribed or calculated carries the provisional label, as at the top of this page, until a reviewer, identified by role only, checks it against the source page and records a decision. Each page states this once, at the top, with the count of its values in each review state; the source of each value is cited beside it. A value is shown as approved only when that record names it and the source document has not changed since; a rejected value is withdrawn with the reason. A value marked disputed is one where the documents disagree: both readings are kept (see <a href="#conflicts">when sources disagree</a>). Totals across every dataset are on the <Link href="/datasets/#review">Datasets page</Link>; how the reports show review state is in the <Link href="/reports/method/#review">reports appendix</Link>.</p>
      </section>

      <section id="corrections" className="card" aria-labelledby="cor-h">
        <h2 id="cor-h">Corrections</h2>
        <p>When we correct a figure, label or citation, a small footnote beside the value gives the date, what it was and why. An error in the source document itself is flagged beside the value in the same way, quoted, and the value is kept as published. The machine-readable log is <a href="/data/corrections.json">corrections.json</a>; a changed value without an entry stops the build.</p>
      </section>

      <section id="prices" className="card" aria-labelledby="pr-h">
        <h2 id="pr-h">Real-terms (price-adjusted) values</h2>
        <p>A real value multiplies each year&apos;s figure by the ratio of the FY 2024/25 price index to that year&apos;s index, so every year is in FY 2024/25 prices. {cpi.meta.method} Source: <a href={cpi.meta.source_url}>{cpi.meta.source}</a>, retrieved {cpi.meta.retrieved}. Status: {cpi.meta.status}.</p>
      </section>

      <section id="years" className="card" aria-labelledby="fy-h">
        <h2 id="fy-h">Fiscal years</h2>
        <p>Kenya's fiscal year runs from 1 July to 30 June. FY 2024/25 is July 2024 to June 2025. Population figures are for calendar years. Where a chart mixes the two, the label says so.</p>
      </section>

      <section id="people" className="card" aria-labelledby="pe-h">
        <h2 id="pe-h">Named people and parties</h2>
        <p>Takwimu does not label named individuals as wrong or misleading. Any claim tied to a person needs a primary document and a legal check first.</p>
      </section>

      <section id="known-gaps" className="card" aria-labelledby="gp-h">
        <h2 id="gp-h">Known gaps</h2>
        <p className="lead">Every gap is listed here once; other pages link to this list. Nothing is filled or estimated.</p>
        <h3 className="mini">In the Siaya ten-year series</h3>
        <ul className="steps" id="gaps">{hist.meta.gaps.map((g) => <li key={g}>{g}</li>)}<li>{hist.poverty.gap}</li><li>County health series between 2014 and 2022 are not shown; only the two survey years are available.</li></ul>
        <h3 className="mini">In the department budgets and the county and audited series</h3>
        <ul className="steps" id="gaps-county-documents">
          {DEP.meta.gaps.map((g) => <li key={`d${g.fy}${g.what}`}><b>FY {g.fy}, {g.what}:</b> {g.reason}</li>)}
          {SER.meta.gaps.map((g) => <li key={`s${g.series}${g.fy}`}><b>FY {g.fy}, {g.series === 'county-cbrop' ? 'County Treasury review series' : g.series === 'oag-ror' ? 'Auditor-General Receiver of Revenue statements' : g.series === 'oag-crf' ? 'Auditor-General County Revenue Fund statements' : g.series}:</b> {g.reason}</li>)}
          <li>The wage bill, development share, own-source revenue, department absorption and pending bills layers have {layerGaps().layers} calculation gaps; each states its reason in its record on <Link href="/counties/siaya/analysis/spending/#an-b1">Siaya analysis</Link> or the <Link href="/counties/siaya/ledger/#osr-b3">ledger</Link>.</li>
        </ul>
        <h3 className="mini">Sources we could not use yet</h3>
        <div className="log" id="sources-gaps">
          {KNOWN_GAPS.map((o) => <article key={o.q} className="term-card"><p><b>{o.q}</b></p><p>{o.note}</p></article>)}
        </div>
        <p className="how">Found a mistake? <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Report it on WhatsApp</a>.</p>
      </section>
      <OsrNote />
    </main>
  );
}
