import { Suspense } from 'react';
import Link from 'next/link';
import ExploreHead from '../../components/ExploreHead';
import DatasetCatalogue from '../../components/DatasetCatalogue';
import SavedViews from '../../components/SavedViews';
import { catalogue, SECTORS, nat } from '../../lib/explore';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Datasets',
  description: 'Search and download every dataset behind Takwimu Kenya: national indicators and county budgets, revenue and pending bills, each with its source, unit, coverage and method.',
};

const datasets = catalogue();
const sources = [...new Set(datasets.map((d) => d.source))].sort();
const years = [...new Set(datasets.flatMap((d) => d.years))].sort((a, b) => a - b);

function Loading() {
  return (
    <section className="card" aria-busy="true">
      <p className="loading" role="status">Loading the catalogue…</p>
      <noscript>
        <ul className="ds-list">
          {datasets.map((d) => <li key={d.id} className="ds"><h3>{d.title}</h3><p>{d.description}</p><div className="ds-links"><a className="file" href={d.files.csv}>CSV</a><a className="file" href={d.files.json}>JSON</a></div></li>)}
        </ul>
      </noscript>
    </section>
  );
}

export default function DatasetsPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/explore/', label: 'Explore' }]} current="Datasets" title="Datasets"
        sub={`${datasets.length} datasets, national and county, each with its source, unit, coverage, method and the date it was last updated. Every one downloads as CSV and JSON.`} />
      <Suspense fallback={<Loading />}>
        <DatasetCatalogue datasets={datasets} sectors={SECTORS} sources={sources} years={years} />
      </Suspense>
      <section className="card" id="saved" aria-labelledby="saved-h">
        <h2 id="saved-h">Saved views</h2>
        <p className="lead">Views you saved on this device, with their filters. They are kept in this browser only: no account, nothing sent to us.</p>
        <SavedViews />
      </section>
      <section className="card" aria-labelledby="gaps-h">
        <h2 id="gaps-h">Not available</h2>
        <p className="lead">Series we looked for and could not publish. They are listed so the gap is visible, not filled.</p>
        <ul className="how">
          <li><b>Central government debt as a share of GDP.</b> The World Bank series (GC.DOD.TOTL.GD.ZS) has no values for Kenya in any year, and the IMF&apos;s series could not be reached on {shortDate(nat.meta.retrieved)} (the service refused the request). No debt figure is shown.</li>
          <li><b>Net primary enrolment.</b> Only 2012 has a value from 2010 on; the gross enrolment series is listed beside it.</li>
          <li><b>Poverty.</b> The World Bank now measures this at $3.00 a day in 2021 prices, and only survey years have values.</li>
          <li><b>2025 values.</b> Under-5 mortality, life expectancy and access to electricity have no 2025 value yet.</li>
          <li><b>Counties.</b> Two financial years (FY 2023/24 and 2024/25) are loaded for all 47 counties so far; earlier years are in preparation.</li>
        </ul>
        <p className="src">More on sources and checks: <Link href="/data/">Data</Link> and <Link href="/method/">Method</Link>. The full catalogue as JSON: <a href="/data/datasets/catalogue.json">catalogue.json</a>.</p>
      </section>
    </main>
  );
}
