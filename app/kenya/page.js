import ExploreHead from '../../components/ExploreHead';
import OsrNote from '../../components/OsrNote';
import StatStrip from '../../components/StatStrip';
import { Suspense } from 'react';
import TrendsView from '../../components/TrendsView';
import TableWrap from '../../components/TableWrap';
import DownloadView from '../../components/DownloadView';
import SaveView from '../../components/SaveView';
import PrintButton from '../../components/PrintButton';
import DataStamp from '../../components/DataStamp';
import Link from 'next/link';
import { natIndicators, nat, SECTORS, COB_YEARS, cobTotal, cobSource, trendSeries, BASE_FY, extra } from '../../lib/explore';
import { shortDate, fmtFixed, fmtNum } from '../../lib/format';
import ImfView from '../../components/ImfView';
import { imfViewData } from '../../lib/imf';
import reg from '../../data/conflicts.json';
import { Provisional } from '../../components/ObsTable';
import OpenTarget from '../../components/OpenTarget';
import CorrectionNote, { CorrectionMark } from '../../components/CorrectionNote';
import { notesFor } from '../../lib/correction-notes';

const imfData = imfViewData();
// IMF against the World Bank: definitional differences, both values side by side (sweep D13).
const IMF_WB = ['imf-wb-gdp-per-capita-2025', 'imf-wb-gdp-usd-2024', 'imf-wb-revenue-gdp-2023', 'imf-wb-expense-gdp-2023'].map((id) => reg.conflicts.find((c) => c.id === id)).filter(Boolean);
const imfV0 = imfData.vintages[0];

export const metadata = {
  title: 'Kenya dashboard',
  description: "Kenya's economy, money and banking, public finance, people, health, education, infrastructure, environment and governance from 2010, with sparklines, derived measures, a trend explorer and tables, from the World Bank, the Central Bank of Kenya, the Controller of Budget, the CRA, IBP and the IEBC.",
};

const series = trendSeries();
// Phone scanning (live review, 27 Nov 2026): each section shows its first HEAD cards; the rest open from a <details>
// that is closed on load. Everything stays in the static HTML, and printing opens every detail.
const HEAD = 4;
const Rest = ({ items, label, what }) => (items.length > HEAD ? (
  <details className="tableview more">
    <summary>Show {items.length - HEAD} more {what}</summary>
    <div style={{ marginTop: 12 }}><StatStrip label={`${label} (more)`} items={items.slice(HEAD)} /></div>
  </details>
) : null);
const Strip = ({ items, label, what = 'indicators' }) => (
  <>
    <div style={{ marginTop: 14 }}><StatStrip label={label} items={items.slice(0, HEAD)} /></div>
    <Rest items={items} label={label} what={what} />
  </>
);
const More = ({ summary, children }) => (
  <details className="tableview more">
    <summary>{summary}</summary>
    {children}
  </details>
);
const ORDER = ['economy', 'money and banking', 'public finance', 'people', 'health', 'education', 'infrastructure', 'environment'];
const show = (v, dec) => fmtFixed(v, dec);
const inds = natIndicators.filter((x) => x.hasValues);
const scaled = (x) => x.series.map((p) => (p.value === null ? null : p.value / x.div));
const dlRows = inds.flatMap((x) => x.series.map((p) => ({ indicator_code: x.code, indicator: x.name, year: p.year, value: p.value, unit: x.unit, status: p.value === null ? 'not available' : 'published', source: x.source, api_url: x.api_url, last_updated: x.last_updated })));
const latest = COB_YEARS[COB_YEARS.length - 1];
const prev = COB_YEARS[COB_YEARS.length - 2]; // the year before the latest
const bn = (m) => fmtFixed(m / 1000, 1);
const countyItems = [['approved_budget_total', 'County budgets, all 47'], ['expenditure_total', 'County spending, all 47'], ['total_osr_actual', 'Own-source revenue, all 47'], ['pb_grand_total', 'Pending bills, all 47']].map(([k, label]) => {
  const a = cobTotal(prev, k).value; const b = cobTotal(latest, k).value;
  return { label, value: bn(b), unit: 'KSh bn', note: `FY ${latest}; FY ${prev}: KSh ${bn(a)} bn` };
});

// Central Bank of Kenya series: the latest annual reading and its first, with a sparkline.
const lastOf = (rows) => [...rows].reverse().find((r) => r.value !== null);
const firstOf = (rows) => rows.find((r) => r.value !== null);
const cbkItems = extra.CBK_SERIES.map((x) => {
  const rows = extra.cbkRows(x); const l = lastOf(rows); const f = firstOf(rows);
  return { label: x.short, value: show(l.value / x.div, x.dec), unit: x.unit, note: `${l.period}; ${f.period}: ${show(f.value / x.div, x.dec)}`, spark: rows.map((r) => (r.value === null ? null : r.value / x.div)) };
});
const anaItems = extra.ANALYSIS.map((a) => {
  const rows = extra.analysisRows(a); const l = lastOf(rows); const f = firstOf(rows);
  return { label: a.short, value: show(l.value, a.dec), unit: a.unit, note: `${l.period}; ${f.period}: ${show(f.value, a.dec)}. Derived`, spark: rows.map((r) => r.value) };
});
const obs = extra.ngo.ibp_open_budget_survey_kenya; const obsLast = obs.rows[obs.rows.length - 1]; const obsPrev = obs.rows[obs.rows.length - 2];
const cand = extra.pol.iebc_candidates_2022_by_position;
const voterTotal = extra.VOTERS.checks.published_total;

export default function KenyaPage() {
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }]} current="Kenya dashboard" title="Kenya dashboard"
        sub="National indicators from 2010, grouped by sector. Each card shows the latest value and a small trend line. The trend explorer below charts any indicator, national, all counties or Siaya, in nominal or real terms, with a table." />
      <DataStamp period="2010 to 2025 (latest year varies by indicator)" updated="21 Nov 2026" completeness={`${inds.length} indicators with values; ${natIndicators.length - inds.length} without (see Not available)`} />
      <Provisional dataset={['counties-cob', 'imf', 'history']} />
      <nav className="secnav no-print" aria-label="Sections on this page"><ul className="toc">
        <li><a href="#trends">Trend explorer</a></li><li><a href="#counties">Counties together</a></li>
        {ORDER.map((s) => <li key={s}><a href={`#${s.replace(' ', '-')}`}>{SECTORS[s]}</a></li>)}
        <li><a href="#analysis">Analysis</a></li>
        <li><a href="#governance">Governance and elections</a></li>
        <li><a href="#imf">IMF outlook</a></li>
        <li><a href="#imf-wb">IMF and World Bank</a></li>
        <li><a href="#notes">Sources and notes</a></li>
      </ul></nav>
      <OpenTarget />
      <section className="card no-print-break" aria-labelledby="tools-h">
        <h2 id="tools-h">Use this dashboard</h2>
        <div className="toolbar">
          <DownloadView rows={dlRows} name="takwimu-kenya-dashboard" meta={{ title: 'Kenya dashboard: every series shown', source: 'World Bank, World Development Indicators', retrieved: nat.meta.retrieved }} label="Download every series shown" />
          <SaveView title="Kenya dashboard" />
          <PrintButton />
        </div>
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
            <Strip label={`${SECTORS[sec]}: latest values`} what={`${SECTORS[sec].toLowerCase()} indicators`} items={list.map((x) => ({ label: x.short, value: show(x.last.value / x.div, x.dec), unit: x.dispUnit, note: `${x.last.year}; ${x.first.year}: ${show(x.first.value / x.div, x.dec)}`, spark: scaled(x) }))} />
            {sec === 'money and banking' ? (
      <div id="cbk">
        <h3 id="cbk-h">Central Bank of Kenya series</h3>
        <p className="lead">Exchange rate, interest rates, public debt, government revenue and spending, money supply and reserves, from the CBK&apos;s own statistics files. One reading per year is shown (December, or the fiscal year for revenue and spending); every monthly value is in the <Link href="/datasets/?source=Central%20Bank%20of%20Kenya">CBK datasets</Link>.</p>
        <Strip label="Central Bank of Kenya: latest values" what="CBK series" items={cbkItems} />
        <p className="src">Source: <a href="https://www.centralbank.go.ke/statistics/">Central Bank of Kenya statistics</a>, retrieved {shortDate(extra.cbk.meta.retrieved)}; each file&apos;s SHA-256 is in the source manifest. Public debt is the national government&apos;s domestic and external debt as the CBK publishes it. GDP is the KNBS figure republished by the CBK. Reserves are &quot;usable&quot; reserves to 2024; from 2025 the bulletins drop that word. Notes: {extra.cbk.gaps.doubtful.join(' ')}</p>
      </div>
            ) : null}
          </section>
        );
      })}
      <section className="card" id="analysis" aria-labelledby="analysis-h">
        <h2 id="analysis-h">Analysis: measures worked out from the published figures</h2>
        <p className="lead">These are not published by any source: Takwimu computes them from the CBK series above. Each says how. A year is left empty when any input is missing or the year is not complete.</p>
        <Strip label="Derived measures: latest values" what="derived measures" items={anaItems} />
        <More summary="How each derived measure is worked out (table)">
        <TableWrap label="How each derived measure is worked out">
          <table className="data">
            <caption>How each derived measure is worked out</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">What it shows</th><th scope="col">Formula</th><th scope="col">Inputs</th></tr></thead>
            <tbody>
              {extra.ANALYSIS.map((a) => (
                <tr key={a.key}><th scope="row">{a.short}<small style={{ display: 'block', fontWeight: 400 }}><Link href={`/kenya/?i=${a.slug}#trends`}>Show trend</Link></small></th><td>{a.why}</td><td><code>{a.m.formula}</code></td><td>{a.m.inputs.join('; ')}</td></tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        </More>
        <p className="src">A real rate subtracts the 12-month inflation rate of the same month (an ex-post rate). Debt to GDP divides December debt by calendar-year GDP. Interest burden uses fiscal-year totals. Remittances are converted at the annual average exchange rate. All {Object.keys(extra.der.measures).length} derived measures, with formulas, download from the <Link href="/datasets/?q=derived">derived measures dataset</Link>.</p>
      </section>
      <section className="card" id="governance" aria-labelledby="governance-h">
        <h2 id="governance-h">Governance and elections</h2>
        <p className="lead">Figures about institutions and places only; no person is rated.</p>
        <div style={{ marginTop: 14 }}><StatStrip label="Governance and elections" items={[
          { label: 'Open Budget Index, national government', value: show(obsLast['OBI (unrounded)'], 1), unit: 'out of 100', note: `${obsLast.Year} (${obsLast['OBI Category']}); ${obsPrev.Year}: ${show(obsPrev['OBI (unrounded)'], 1)}` },
          { label: 'Registered voters, 2022', value: fmtNum(voterTotal), unit: 'voters', note: 'IEBC constituency file; 22,120,458 elsewhere (see register)' },
          { label: 'Candidates, 2022 general election', value: fmtNum(cand.rows.find((r) => r.position === 'Total').total), unit: 'candidates', note: `${fmtNum(cand.rows.find((r) => r.position === 'Total').independent)} independent; the printed parts add to one less (see register)` },
        ]} /></div>
        <More summary="Candidates by elective position, 2022 (table)">
        <TableWrap label="Candidates by elective position, 2022">
          <table className="data">
            <caption>Candidates by elective position, 2022 general election</caption>
            <thead><tr><th scope="col">Position</th><th scope="col" className="num">Party-sponsored</th><th scope="col" className="num">Independent</th><th scope="col" className="num">Total</th></tr></thead>
            <tbody>{cand.rows.map((r) => <tr key={r.position}><th scope="row">{r.position}</th><td className="num">{fmtNum(r.party_sponsored)}</td><td className="num">{r.independent === null ? <><span title="Shown as '-' in the IEBC table">-</span><CorrectionMark notes={notesFor('political', `iebc_candidates_2022_by_position:${r.position}`)} /><CorrectionNote notes={notesFor('political', `iebc_candidates_2022_by_position:${r.position}`)} /></> : fmtNum(r.independent)}</td><td className="num">{fmtNum(r.total)}</td></tr>)}</tbody>
          </table>
        </TableWrap>
        </More>
        <p className="src">Sources: {obs.source.citation_requested} (<a href={obs.source.landing_page}>Open Budget Survey data</a>); scores before 2017 are not comparable for oversight and participation. IEBC, <a href={extra.VOTERS.source.url}>registered voters per constituency, 2022</a> and <a href={cand.source.url}>Annual Report 2022-23</a>, Table 21. The IEBC states no reuse licence for these files. The August 2017 presidential results are not shown: that election was annulled, and the copy found is unsigned and does not add up. Registered voters by constituency are on <Link href="/compare/#voters">Compare counties</Link>.</p>
      </section>
      <ImfView data={imfData} />
      <section className="card" id="imf-wb" aria-labelledby="imf-wb-h">
        <h2 id="imf-wb-h">IMF and World Bank figures that differ by definition</h2>
        <p className="lead">The IMF and the World Bank publish some measures that look the same but are defined differently, so their values differ. Both are shown; neither is chosen and they are never averaged.</p>
        <TableWrap label="IMF and World Bank values side by side">
          <table className="data">
            <caption className="sr-only">IMF World Economic Outlook and World Bank WDI values for the same measure and year, with the reason they differ</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col" className="num">IMF WEO</th><th scope="col" className="num">World Bank WDI</th><th scope="col">Why they differ</th></tr></thead>
            <tbody>{IMF_WB.map((c) => <tr key={c.id}><th scope="row">{c.measure}<small style={{ display: 'block', fontWeight: 400 }}>{c.unit}</small></th><td className="num">{show(c.values[0].value, 2)}</td><td className="num">{show(c.values[1].value, 2)}</td><td><span className="tag warn">Definitional difference</span> {c.definitions} {c.hypothesis} <a href={`/data/#${c.id}`}>Case {c.id}</a>.</td></tr>)}</tbody>
          </table>
        </TableWrap>
        <p className="src">Source: IMF World Economic Outlook, {imfV0.vintage} (published {shortDate(imfV0.published)}), <a href="https://www.imf.org/en/Publications/WEO">imf.org</a>; link and cite only, © IMF (no copy of the IMF data is offered for download). World Bank, World Development Indicators, CC BY 4.0.</p>
      </section>

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
        <More summary={`Source, unit and missing years for all ${inds.length} indicators (table)`}>
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
        </More>
      </section>
      <OsrNote />
    </main>
  );
}
