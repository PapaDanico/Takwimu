import ExploreHead from '../../components/ExploreHead';
import StatStrip from '../../components/StatStrip';
import { Suspense } from 'react';
import TrendsView from '../../components/TrendsView';
import TableWrap from '../../components/TableWrap';
import DownloadView from '../../components/DownloadView';
import SaveView from '../../components/SaveView';
import PrintButton from '../../components/PrintButton';
import DataStamp from '../../components/DataStamp';
import Link from 'next/link';
import { natIndicators, nat, SECTORS, COB_YEARS, cobTotal, cobSource, trendSeries, BASE_FY } from '../../lib/explore';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Kenya dashboard',
  description: "Kenya's economy, people, health, education and infrastructure from 2010, with sparklines, a trend explorer (nominal and real) and tables, from the World Bank and the Controller of Budget.",
};

const series = trendSeries();
const ORDER = ['economy', 'people', 'health', 'education', 'infrastructure', 'public finance'];
const show = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const inds = natIndicators.filter((x) => x.hasValues);
const scaled = (x) => x.series.map((p) => (p.value === null ? null : p.value / x.div));
const dlRows = inds.flatMap((x) => x.series.map((p) => ({ indicator_code: x.code, indicator: x.name, year: p.year, value: p.value, unit: x.unit, status: p.value === null ? 'not available' : 'published', source: x.source, api_url: x.api_url, last_updated: x.last_updated })));
const latest = COB_YEARS[COB_YEARS.length - 1];
const prev = COB_YEARS[COB_YEARS.length - 2]; // the year before the latest
const bn = (m) => (m / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const countyItems = [['approved_budget_total', 'County budgets, all 47'], ['expenditure_total', 'County spending, all 47'], ['total_osr_actual', 'Own-source revenue, all 47'], ['pb_grand_total', 'Pending bills, all 47']].map(([k, label]) => {
  const a = cobTotal(prev, k).value; const b = cobTotal(latest, k).value;
  return { label, value: bn(b), unit: 'KSh bn', note: `FY ${latest}; FY ${prev}: KSh ${bn(a)} bn` };
});

export default function KenyaPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/explore/', label: 'Explore' }]} current="Kenya dashboard" title="Kenya dashboard"
        sub="National indicators from 2010, grouped by sector. Each card shows the latest value and a small trend line. The trend explorer below charts any indicator, national, all counties or Siaya, in nominal or real terms, with a table." />
      <DataStamp period="2010 to 2025 (latest year varies by indicator)" checked={`Retrieved ${shortDate(nat.meta.retrieved)}`} updated="21 Nov 2026" completeness={`${inds.length} indicators with values; ${natIndicators.length - inds.length} without (see Not available)`} />
      <section className="card no-print-break" aria-labelledby="tools-h">
        <h2 id="tools-h">Use this dashboard</h2>
        <div className="toolbar">
          <DownloadView rows={dlRows} name="takwimu-kenya-dashboard" meta={{ title: 'Kenya dashboard: every series shown', source: 'World Bank, World Development Indicators', retrieved: nat.meta.retrieved }} label="Download every series shown" />
          <SaveView title="Kenya dashboard" />
          <PrintButton />
        </div>
        <p className="hint" style={{ marginTop: 10 }}>Jump to: {ORDER.map((s, i) => <span key={s}>{i ? ' · ' : ''}<a href={`#${s.replace(' ', '-')}`}>{SECTORS[s]}</a></span>)} · <a href="#counties">Counties together</a> · <a href="#trends">Trend explorer</a> · <a href="#notes">Sources and notes</a></p>
      </section>

      <section className="card" id="counties" aria-labelledby="counties-h">
        <h2 id="counties-h">All 47 counties together</h2>
        <p className="lead">The printed totals of the Controller of Budget&apos;s county tables, FY {prev} and FY {latest}, read by OCR. To see each county, use <Link href="/compare/">Compare counties</Link>.</p>
        <div style={{ marginTop: 14 }}><StatStrip label="County totals" items={countyItems} /></div>
        <p className="src">Source: <a href={cobSource(latest).url}>{cobSource(latest).title}</a> and <a href={cobSource(prev).url}>the FY {prev} report</a>, chapter 2 tables. Earlier years (from FY {COB_YEARS[0]}) are in the trend explorer. Nominal shillings; the two years are not adjusted for prices here (see the <Link href="/kenya/?i=counties-total-expenditure-total&amp;basis=real#trends">trend explorer</Link> for real terms).</p>
      </section>

      {ORDER.map((sec) => {
        const list = inds.filter((x) => x.sector === sec);
        if (!list.length) return null;
        return (
          <section key={sec} className="card" id={sec.replace(' ', '-')} aria-labelledby={`${sec.replace(' ', '-')}-h`}>
            <h2 id={`${sec.replace(' ', '-')}-h`}>{SECTORS[sec]}</h2>
            <div style={{ marginTop: 14 }}>
              <StatStrip label={`${SECTORS[sec]}: latest values`} items={list.map((x) => ({ label: x.short, value: show(x.last.value / x.div, x.dec), unit: x.dispUnit, note: `${x.last.year}; ${x.first.year}: ${show(x.first.value / x.div, x.dec)}`, spark: scaled(x) }))} />
            </div>
          </section>
        );
      })}
      <section className="card" id="trends" aria-labelledby="trends-h">
        <h2 id="trends-h">Trend explorer</h2>
        <p className="lead">Choose any of {series.length} indicators to see every year as a chart and a table. Money values can be shown in real terms, at FY {BASE_FY} prices; <Link href="/method/#prices">how real terms are worked out</Link>.</p>
      </section>
      <Suspense fallback={<section className="card" aria-busy="true"><p className="loading" role="status">Loading the trend explorer…</p><noscript><p className="empty">The trend explorer needs JavaScript. Every series downloads from the <Link href="/datasets/">datasets catalogue</Link>.</p></noscript></section>}>
        <TrendsView series={series} baseFy={BASE_FY} />
      </Suspense>
      <section className="card" id="notes" aria-labelledby="notes-h">
        <h2 id="notes-h">Sources and notes</h2>
        <p className="lead">One row per national indicator. Series without values are listed under <Link href="/datasets/#gaps">Not available</Link> on the datasets page.</p>
        <TableWrap label="Sources and notes for each national indicator">
          <table className="data">
            <caption className="sr-only">Source, unit, last update, missing years and notes for each national indicator</caption>
            <thead><tr><th scope="col">Indicator</th><th scope="col">Unit</th><th scope="col">Source</th><th scope="col">Missing years</th><th scope="col">Notes</th></tr></thead>
            <tbody>
              {inds.map((x) => (
                <tr key={x.code} id={x.slug}>
                  <th scope="row">{x.short}<small style={{ display: 'block', fontWeight: 400 }}><Link href={`/kenya/?i=${x.slug}#trends`}>Show trend</Link></small></th>
                  <td>{x.dispUnit}{x.basis ? `. ${x.basis}` : ''}</td>
                  <td style={{ overflowWrap: 'anywhere' }}><a href={x.api_url}>{x.code}</a>; original source: {x.original_source.split('\n')[0].replace(/;$/, '')}. Updated {shortDate(x.last_updated)}, retrieved {shortDate(x.retrieved)}.</td>
                  <td>{x.missing_years.length ? x.missing_years.join(', ') : 'None'}</td>
                  <td>{[x.method || x.modelled_or_estimated_note, x.note].filter(Boolean).join(' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </main>
  );
}
