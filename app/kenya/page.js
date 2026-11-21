import ExploreHead from '../../components/ExploreHead';
import StatStrip from '../../components/StatStrip';
import { LineChart } from '../../components/Charts';
import DownloadView from '../../components/DownloadView';
import SaveView from '../../components/SaveView';
import PrintButton from '../../components/PrintButton';
import DataStamp from '../../components/DataStamp';
import Link from 'next/link';
import { natIndicators, nat, SECTORS, COB_YEARS, cobTotal, cobSource } from '../../lib/explore';
import { shortDate } from '../../lib/format';

export const metadata = {
  title: 'Kenya dashboard',
  description: "Kenya's economy, people, health, education and infrastructure from 2010, with sparklines, trend charts and tables, from the World Bank's World Development Indicators.",
};

const ORDER = ['economy', 'people', 'health', 'education', 'infrastructure'];
const show = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const inds = natIndicators.filter((x) => x.hasValues);
const scaled = (x) => x.series.map((p) => (p.value === null ? null : p.value / x.div));
const dlRows = inds.flatMap((x) => x.series.map((p) => ({ indicator_code: x.code, indicator: x.name, year: p.year, value: p.value, unit: x.unit, status: p.value === null ? 'not available' : 'published', source: x.source, api_url: x.api_url, last_updated: x.last_updated })));
const latest = COB_YEARS[COB_YEARS.length - 1];
const prev = COB_YEARS[0];
const bn = (m) => (m / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const countyItems = [['approved_budget_total', 'County budgets, all 47'], ['expenditure_total', 'County spending, all 47'], ['total_osr_actual', 'Own-source revenue, all 47'], ['pb_grand_total', 'Pending bills, all 47']].map(([k, label]) => {
  const a = cobTotal(prev, k).value; const b = cobTotal(latest, k).value;
  return { label, value: bn(b), unit: 'KSh bn', note: `FY ${latest}; FY ${prev}: KSh ${bn(a)} bn` };
});

export default function KenyaPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/explore/', label: 'Explore' }]} current="Kenya dashboard" title="Kenya dashboard"
        sub="National indicators from 2010, grouped by sector. Each card shows the latest value and a small trend line; the charts below give every year, with a table view. Missing years are left blank." />
      <DataStamp period="2010 to 2025 (latest year varies by indicator)" checked={`Retrieved ${shortDate(nat.meta.retrieved)}`} updated="21 Nov 2026" completeness={`${inds.length} indicators with values; ${natIndicators.length - inds.length} without (see Not available)`} />
      <section className="card no-print-break" aria-labelledby="tools-h">
        <h2 id="tools-h">Use this dashboard</h2>
        <div className="toolbar">
          <DownloadView rows={dlRows} name="takwimu-kenya-dashboard" meta={{ title: 'Kenya dashboard: every series shown', source: 'World Bank, World Development Indicators', retrieved: nat.meta.retrieved }} label="Download every series shown" />
          <SaveView title="Kenya dashboard" />
          <PrintButton />
        </div>
        <p className="hint" style={{ marginTop: 10 }}>Jump to: {ORDER.map((s, i) => <span key={s}>{i ? ' · ' : ''}<a href={`#${s}`}>{SECTORS[s]}</a></span>)} · <a href="#counties">Counties together</a></p>
      </section>

      <section className="card" id="counties" aria-labelledby="counties-h">
        <h2 id="counties-h">All 47 counties together</h2>
        <p className="lead">The printed totals of the Controller of Budget&apos;s county tables, FY {prev} and FY {latest}, read by OCR. To see each county, use <Link href="/compare/">Compare counties</Link>.</p>
        <div style={{ marginTop: 14 }}><StatStrip label="County totals" items={countyItems} /></div>
        <p className="src">Source: <a href={cobSource(latest).url}>{cobSource(latest).title}</a> and <a href={cobSource(prev).url}>the FY {prev} report</a>, chapter 2 tables. Nominal shillings; the two years are not adjusted for prices here (see <Link href="/trends/?i=counties-total-expenditure-total&amp;basis=real">Trends</Link> for real terms).</p>
      </section>

      {ORDER.map((sec) => {
        const list = inds.filter((x) => x.sector === sec);
        if (!list.length) return null;
        return (
          <section key={sec} className="card" id={sec} aria-labelledby={`${sec}-h`}>
            <h2 id={`${sec}-h`}>{SECTORS[sec]}</h2>
            <div style={{ marginTop: 14 }}>
              <StatStrip label={`${SECTORS[sec]}: latest values`} items={list.map((x) => ({ label: x.short, value: show(x.last.value / x.div, x.dec), unit: x.dispUnit, note: `${x.last.year}; ${x.first.year}: ${show(x.first.value / x.div, x.dec)}`, spark: scaled(x) }))} />
            </div>
            {list.map((x) => (
              <div key={x.code} className="indicator" id={x.slug}>
                <h3>{x.short}</h3>
                <p className="meta">{x.dispUnit}{x.basis ? `. ${x.basis}` : ''}. {x.missing_years.length ? `No value for ${x.missing_years.join(', ')}.` : 'A value for every year.'}</p>
                <LineChart labels={x.series.map((p) => String(p.year))} series={[{ name: x.short, color: 1, values: scaled(x) }]} yFormat={x.dec === 0 ? 'int' : 'one'} valueFormat="auto" unit={x.dispUnit} naText="Not available (no value from the World Bank API)" ariaLabel={`${x.short}, Kenya, ${x.series[0].year} to ${x.series[x.series.length - 1].year}, ${x.dispUnit}`} />
                <p className="src" style={{ overflowWrap: "anywhere" }}>Source: <a href={x.api_url}>{x.source}, {x.code}</a>; original source: {x.original_source.split('\n')[0].replace(/;$/, '')}. Last updated {shortDate(x.last_updated)}, retrieved {shortDate(x.retrieved)}.{(x.method || x.modelled_or_estimated_note) ? ` ${x.method || x.modelled_or_estimated_note}` : ''}{x.note ? ` ${x.note}` : ''} <Link href={`/datasets/?q=kenya-${x.slug}`}>Dataset</Link> · <Link href={`/trends/?i=${x.slug}`}>Trend</Link></p>
              </div>
            ))}
          </section>
        );
      })}
      <section className="card" aria-labelledby="na-h">
        <h2 id="na-h">Not available</h2>
        <p className="lead">Central government debt as a share of GDP has no values for Kenya in the World Bank series, and the IMF series could not be reached when the data was retrieved. It is left out rather than estimated. See the <Link href="/datasets/">datasets page</Link> for every gap.</p>
      </section>
    </main>
  );
}
