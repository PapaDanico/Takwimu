import { Suspense } from 'react';
import Abbrs from '../../components/Abbrs';
import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import PageToc from '../../components/PageToc';
import DatasetCatalogue from '../../components/DatasetCatalogue';
import SavedViews from '../../components/SavedViews';
import { catalogue, SECTORS, nat, STATUS_VOCABULARY } from '../../lib/explore';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Datasets',
  description: 'Search and download every dataset behind Takwimu Kenya: national indicators and county budgets, revenue and pending bills, each with its source, unit, coverage and method.',
};

const datasets = catalogue();
const sources = [...new Set(datasets.map((d) => d.source))].sort();
// Datasets with bulk files; the rest (IMF WEO, link and cite only) are viewed and cited, never downloaded (sweep N5).
const downloadable = datasets.filter((d) => d.files.csv);
const reviewed = datasets.filter((d) => d.review);
const totals = reviewed.reduce((t, d) => ({ approved: t.approved + d.review.approved, pending: t.pending + d.review.pending, rejected: t.rejected + d.review.rejected, total: t.total + d.review.total }), { approved: 0, pending: 0, rejected: 0, total: 0 });
const years = [...new Set(datasets.flatMap((d) => d.years))].sort((a, b) => a - b);

function Loading() {
  return (
    <section className="card" aria-busy="true">
      <p className="loading" role="status">Loading the catalogue…</p>
      <noscript>
        <ul className="ds-list">
          {datasets.map((d) => <li key={d.id} className="ds"><h3>{d.title}</h3><p>{d.description}</p><div className="ds-links">{d.files.csv ? <><a className="file" href={d.files.csv}>CSV</a><a className="file" href={d.files.json}>JSON</a></> : <span>Link and cite only: no download</span>}</div></li>)}
        </ul>
      </noscript>
    </section>
  );
}

export default function DatasetsPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }]} current="Datasets" title="Datasets"
        sub={`${datasets.length} datasets, national and county, each with its source, unit, coverage, method and the date it was last updated. ${downloadable.length === datasets.length ? 'Every one downloads as CSV and JSON.' : `${downloadable.length} download as CSV and JSON. ${datasets.filter((d) => !d.files.csv).map((d) => d.source).filter((x, i, l) => l.indexOf(x) === i).join(' and ')} values are link and cite only: view and cite them here, and get them from the publisher at the link given.`}`} />
      <Abbrs list={['PCRA', 'FLLoCA', 'IATI', 'CBTS', 'GCP', 'FIF', 'A-i-A']} />
      <PageToc items={[['find-h', 'Find a dataset'], ['list-h', 'Datasets'], ['status-h', 'What the status means'], ['saved-h', 'Saved views'], ['gaps-h', 'Not available']]} />
      <Suspense fallback={<Loading />}>
        <DatasetCatalogue datasets={datasets} sectors={SECTORS} sources={sources} years={years} />
      </Suspense>
      <section className="card" id="status" aria-labelledby="status-h">
        <h2 id="status-h">What the status means</h2>
        <p className="lead">Each dataset has one status, worked out from what the data already records: the conflict register, the publisher&apos;s notes on modelled figures, and how the values were read. The most cautious one that applies is shown. The version is a short content hash of the data file, so a download can be matched to the file it came from; it is in every CSV row and in the downloaded file name.</p>
        <dl className="status-list">
          {STATUS_VOCABULARY.map((s) => <div key={s.status}><dt><span className={`ds-status st-${s.status}`}>{s.status}</span> <small>{datasets.filter((d) => d.status === s.status).length} dataset{datasets.filter((d) => d.status === s.status).length === 1 ? '' : 's'}</small></dt><dd>{s.definition}</dd></div>)}
        </dl>
        <h3 id="review">Editorial review</h3>
        <p>Every value Takwimu transcribed or calculated stays labelled &ldquo;Provisional: awaiting editorial review&rdquo; until a reviewer, identified by role only, checks it against the source page and records a decision. A value is shown as approved only when that record names it and the source document has not changed since; a rejected value is withdrawn with the reason. Across the {reviewed.length} datasets itemised for review: {totals.approved.toLocaleString('en-US')} approved, {totals.pending.toLocaleString('en-US')} pending, {totals.rejected.toLocaleString('en-US')} rejected, of {totals.total.toLocaleString('en-US')} values.</p>
      </section>
      <section className="card" id="saved" aria-labelledby="saved-h">
        <h2 id="saved-h">Saved views</h2>
        <p className="lead">Views you saved on this device, with their filters. They are kept in this browser only: no account, nothing sent to us.</p>
        <SavedViews />
      </section>
      <section className="card" id="gaps" aria-labelledby="gaps-h">
        <h2 id="gaps-h">Not available</h2>
        <p className="lead">Series we looked for and could not publish. They are listed so the gap is visible, not filled.</p>
        <ul className="how">
          <li><b>Central government debt as a share of GDP.</b> The World Bank series (GC.DOD.TOTL.GD.ZS) has no values for Kenya in any year, and the IMF&apos;s series could not be reached on {shortDate(nat.meta.retrieved)} (the service refused the request). The Central Bank of Kenya&apos;s public debt series (domestic plus external, in shillings) is in the catalogue, and its ratio to GDP is a derived measure on the Kenya dashboard. The World Bank external debt series count only debt owed to lenders outside Kenya, so they are not total public debt.</li>
          <li><b>Other sources not loaded.</b> Sources we could not reach or extract as tables are listed once, each with its reason and retry date, under <Link href="/method/#known-gaps">known gaps</Link>.</li>
          <li><b>Net primary enrolment.</b> Only 2012 has a value from 2010 on; the gross enrolment series is listed beside it.</li>
          <li><b>Poverty.</b> The World Bank now measures this at $3.00 a day in 2021 prices, and only survey years have values.</li>
          <li><b>2025 values.</b> Under-5 mortality, life expectancy and access to electricity have no 2025 value yet.</li>
          <li><b>Counties.</b> Four financial years (FY 2021/22 to 2024/25) are loaded for all 47 counties; earlier years are in preparation. Some columns are not printed in the older tables (for example own-source revenue with health facility revenue in FY 2022/23, and pending-bill subtotals in FY 2022/23); they are left empty with the reason.</li>
        </ul>
        <p className="src">More on sources and checks: <Link href="/data/">Data</Link> and <Link href="/method/">Method</Link>. The full catalogue as JSON: <a href="/data/datasets/catalogue.json">catalogue.json</a>.</p>
      </section>
    </main>
  );
}
