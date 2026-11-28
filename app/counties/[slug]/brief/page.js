import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import BriefChart from '../../../../components/BriefChart';
import { paramsFor } from '../../../../components/county/params';
import { fmtNum, shortDate } from '../../../../lib/format';
import { SITE_URL, SITE_UPDATED } from '../../../../lib/site';
import * as cp from '../../../../lib/county-pages';
import * as ca from '../../../../lib/county-analysis';
import { pageMeta } from '../../../../lib/page-meta';

// A three-page printable fiscal brief for a registry county, built only from its published kinds (ledger, audits,
// population) and the published all-county table, through lib/county-pages.js and lib/county-analysis.js. Every value
// is a Controller of Budget value for its year unless the line says otherwise; a year with none, or with two that
// differ, prints as a gap. DRAFT while any value is unreviewed (always, until data/reviews.json holds records).
// The PDF (public/reports/<slug>-fiscal-brief.pdf) is printed from this page: NODE_PATH=$(npm root -g) node
// scripts/make-brief-pdf.js --county <slug>; scripts/test-reports.js checks it.
export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('brief');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/brief/`, { title: `${m.name} County fiscal brief`, description: `A three-page printable brief on ${m.name} County finances: headline figures for FY 2024/25, budget, spending and absorption trends, spending per person, ${m.name} beside Siaya and all counties, audit opinions, open questions, gaps and sources.` });
}

const HEAD_FY = '2024/25';
const short = (fy) => fy.slice(2);
const bn = (v) => (v == null ? '—' : fmtNum(v / 1e9, { minDp: 2, dp: 2 }));
const m0 = (v) => (v == null ? '—' : fmtNum(Math.round(v / 1e6)));
const p1 = (v) => (v == null ? '—' : fmtNum(v, { minDp: 1, dp: 1 }));
const pageOf = (r) => (r ? `PDF p. ${r.pdf_page}` : '');

export default function CountyBrief({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const l = cp.ledger(slug);
  const A = cp.audits(slug);
  const counts = cp.counts(slug);
  const DRAFT = true; // no review records exist for any county dataset (data/reviews.json); a brief is a draft until they do
  const v = (measure, fy) => ca.cobValue(l, measure, fy);
  const FYS = l.years;
  const bud = v('budget_total', HEAD_FY);
  const exp = v('expenditure_total', HEAD_FY);
  const dev = v('expenditure_development', HEAD_FY);
  const osr = v('osr_total_actual', HEAD_FY);
  const osrT = v('osr_total_target', HEAD_FY);
  const wage = v('wage_bill', HEAD_FY);
  const pend = v('pending_bills_close', HEAD_FY);
  const pct = (a, b) => (a.value != null && b.value ? Math.round((a.value / b.value) * 1000) / 10 : null);
  const ab = ca.absorption(slug);
  const abBy = Object.fromEntries(ab.map((r) => [r.fy, r]));
  const both = ab.filter((r) => r.recurrent.value != null && r.development.value != null);
  const pp = ca.perPerson(slug);
  const ac = ca.amongCounties(slug);
  const last = ac.years[ac.years.length - 1];
  const exec = A.opinions.filter((o) => o.entity === 'county_executive' && o.opinion && !(o.review && o.review.hide)).sort((a, b) => a.fy.localeCompare(b.fy));
  const latestExec = exec[exec.length - 1];
  const others = A.opinions.filter((o) => o.entity !== 'county_executive' && o.fy === (latestExec || {}).fy && o.opinion && !(o.review && o.review.hide));
  const label = (k) => (A.entities.find((e) => e.key === k) || {}).label || k;
  const trendGaps = FYS.filter((fy) => v('budget_total', fy).gap || v('expenditure_total', fy).gap);
  const cases = l.cases.length;
  const conflicts = cp.conflicts(slug).length;
  const host = SITE_URL.replace('https://', '');
  const base = `/counties/${slug}/`;

  const heads = [
    { k: `Budget, FY ${HEAD_FY}`, v: bud.gap ? 'Gap' : `KSh ${bn(bud.value)} bn`, mm: exp.gap ? exp.gap : `KSh ${bn(exp.value)} bn spent (${p1(pct(exp, bud))}% of the budget, our calculation)`, r: bud.rec },
    { k: `Development spending, FY ${HEAD_FY}`, v: dev.gap ? 'Gap' : `KSh ${bn(dev.value)} bn`, mm: dev.gap || exp.gap ? '' : `${p1(pct(dev, exp))}% of all spending (our calculation); development absorption ${p1((abBy[HEAD_FY] || {}).development && abBy[HEAD_FY].development.value)}% as printed`, r: dev.rec },
    { k: `Own-source revenue, FY ${HEAD_FY}`, v: osr.gap ? 'Gap' : `KSh ${m0(osr.value)} m`, mm: osr.gap || osrT.gap ? '' : `${p1(pct(osr, osrT))}% of the KSh ${m0(osrT.value)} m target (our calculation); includes hospital revenue (FIF)`, r: osr.rec },
    { k: `Wage bill, FY ${HEAD_FY}`, v: wage.gap ? 'Gap' : `KSh ${bn(wage.value)} bn`, mm: wage.gap || exp.gap ? '' : `${p1(pct(wage, exp))}% of all spending (our calculation)`, r: wage.rec },
    { k: `Pending bills, 30 June ${HEAD_FY.slice(0, 2)}${HEAD_FY.slice(5)}`, v: pend.gap ? 'Sources disagree' : `KSh ${m0(pend.value)} m`, mm: pend.gap ? `${pend.gap.replace(/^the /, 'The ')}; all are on the ledger` : '', r: pend.rec },
    { k: latestExec ? `Audit opinion, County Executive, FY ${latestExec.fy}` : 'Audit opinion', v: latestExec ? latestExec.opinion.replace(/ Opinion$/, '') : 'Not held', mm: latestExec ? 'Auditor-General; a finding about the financial statements, not a verdict on any person' : '', r: latestExec ? { source: 'Auditor-General', pdf_page: latestExec.page, confidence: latestExec.confidence, needs_page_check: latestExec.needs_page_check } : null },
  ];

  return (
    <main id="main" className="wrap brief">
      <article className="brief-sheet" aria-labelledby="brief-h">
        {/* ---------- Page 1: headline figures and what they mean ---------- */}
        <div className="brief-page" id="brief-p1">
          <header className="brief-head">
            <img className="brief-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="96" height="91" />
            <div>
              <nav aria-label="Breadcrumb"><p className="brief-eyebrow"><Link href="/counties/">Counties</Link> · <Link href={base}>{m.name}</Link> · Fiscal brief</p></nav>
              <h1 id="brief-h">{m.name} County fiscal brief</h1>
              {DRAFT ? <p className="brief-draft" data-draft="true"><span className="tag warn">DRAFT</span> <span className="tag warn">Provisional: awaiting editorial review</span> Not yet checked by a reviewer.</p> : null}
              <p className="brief-sub">Budget, spending, revenue, unpaid bills and audit opinions, FY 2014/15 to FY 2025/26, read from the Controller of Budget and the Auditor-General. Nominal shillings unless stated; fiscal years run July to June. Three pages: headline figures, trends and comparisons, audit and sources.</p>
              <p className="brief-actions"><a href={`/reports/${slug}-fiscal-brief.pdf`} download>Download this brief as PDF</a> · <Link href="/reports/#briefs">About briefs for your county or constituency</Link> · <Link href={base}>Back to {m.name}</Link></p>
            </div>
          </header>

          <PageToc items={[['brief-head-h', 'Headline figures'], ['brief-mean-h', 'What the figures mean'], ['brief-trend-h', 'Trends and comparisons'], ['brief-audit-h', 'Audit opinions'], ['brief-q-h', 'Open questions'], ['brief-src-h', 'Sources and how to read']]} />
          <section aria-labelledby="brief-head-h">
            <h2 id="brief-head-h">Headline figures</h2>
            <dl className="brief-tiles">
              {heads.map((h) => (
                <div key={h.k}>
                  <dt>{h.k}</dt>
                  <dd className="v">{h.v}</dd>
                  {h.mm ? <dd>{h.mm}</dd> : null}
                  {h.r ? <dd className="src">{h.r.source === 'Auditor-General' ? 'Auditor-General' : 'Controller of Budget'}, {pageOf(h.r)} · confidence {h.r.confidence} of 5{h.r.needs_page_check ? ' · needs page check' : ''}</dd> : <dd className="src">See the ledger for every publisher&rsquo;s figure</dd>}
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="brief-mean-h">
            <h2 id="brief-mean-h">What the figures mean</h2>
            <ul className="brief-mean">
              <li><b>Spending.</b> {m.name} spent {p1(pct(exp, bud))} per cent of its FY {HEAD_FY} budget. Across the {ab.filter((r) => r.development.value != null).length} years with a printed figure, development absorption ranged from {p1(Math.min(...ab.filter((r) => r.development.value != null).map((r) => r.development.value)))} to {p1(Math.max(...ab.filter((r) => r.development.value != null).map((r) => r.development.value)))} per cent; recurrent absorption was higher than development absorption in {both.filter((r) => r.recurrent.value > r.development.value).length} of the {both.length} years with both figures.</li>
              <li><b>Beside other counties.</b> In FY {last}, {m.name}&rsquo;s overall absorption was {p1((ac.measures[0].years.find((y) => y.fy === last).county || {}).value)} per cent against {p1((ac.measures[0].years.find((y) => y.fy === last).all || {}).value)} per cent for all counties together and {p1((ac.measures[0].years.find((y) => y.fy === last).siaya || {}).value)} per cent for Siaya (Controller of Budget all-county table).</li>
              <li><b>Own revenue.</b> What the county raises itself is small beside national transfers, and its basis changed: from FY 2023/24 the Controller of Budget counts hospital revenue (FIF) in it, so earlier years are not comparable (<Link href="/learn/#own-source-revenue">own-source revenue explained</Link>).</li>
              <li><b>Unpaid bills.</b> {pend.gap ? `For 30 June 2025 the Controller of Budget prints more than one pending-bills figure; none is chosen here.` : `KSh ${m0(pend.value)} million at 30 June 2025.`} The {cases} cases where two publishers&rsquo; figures differ are listed side by side on the ledger.</li>
              <li><b>Audit.</b> {latestExec ? `The Auditor-General's latest opinion held on the County Executive (FY ${latestExec.fy}) is ${latestExec.opinion.toLowerCase()}. ${exec.filter((o) => /^Adverse/.test(o.opinion)).length} of the ${exec.length} County Executive opinions held are adverse.` : 'No County Executive opinion is held.'} An opinion is about the financial statements, not about any person.</li>
            </ul>
            <p className="brief-note">Shares marked as our calculation are arithmetic by Takwimu Kenya on published figures from one report. They describe the figures, not the performance of any official.</p>
          </section>
        </div>

        {/* ---------- Page 2: trends and comparisons ---------- */}
        <div className="brief-page" id="brief-p2">
          {DRAFT ? <p className="brief-runhead"><span className="tag warn">DRAFT</span> {m.name} County fiscal brief, page 2 of 3</p> : null}
          <h2 id="brief-trend-h" className="brief-pagehead">Trends and comparisons, FY {FYS[0]} to FY {FYS[FYS.length - 1]}</h2>
          <section className="brief-block" aria-labelledby="brief-ten-h">
            <h3 id="brief-ten-h">Budget, spending and absorption (Controller of Budget)</h3>
            <div className="brief-pair">
              <BriefChart labels={FYS.map(short)} unit="KSh billion" ariaLabel={`${m.name} budget and spending by fiscal year, Controller of Budget, KSh billion`}
                series={[{ name: 'Budget', color: 1, values: FYS.map((fy) => { const x = v('budget_total', fy); return x.gap ? null : Math.round(x.value / 1e7) / 100; }) }, { name: 'Spent', color: 2, dash: true, values: FYS.map((fy) => { const x = v('expenditure_total', fy); return x.gap ? null : Math.round(x.value / 1e7) / 100; }) }]} />
              <div className="tablewrap" role="region" aria-label="Budget and spending by year, scrollable table" tabIndex={0}>
              <table className="brief-table">
                <caption className="sr-only">{m.name} County budget, spending and absorption by fiscal year, Controller of Budget</caption>
                <thead><tr><th scope="col">FY</th><th scope="col">Budget, KSh bn</th><th scope="col">Spent, KSh bn</th><th scope="col">Recurrent absorption, %</th><th scope="col">Development absorption, %</th></tr></thead>
                <tbody>
                  {FYS.map((fy) => { const b = v('budget_total', fy); const e = v('expenditure_total', fy); const a = abBy[fy] || {}; return (
                    <tr key={fy}><th scope="row">{fy}</th><td>{b.gap ? '—' : bn(b.value)}</td><td>{e.gap ? '—' : bn(e.value)}</td><td>{a.recurrent && a.recurrent.value != null ? p1(a.recurrent.value) : '—'}</td><td>{a.development && a.development.value != null ? p1(a.development.value) : '—'}</td></tr>
                  ); })}
                </tbody>
              </table>
              </div>
            </div>
            <p className="brief-note">One publisher for every year. &mdash; means no Controller of Budget value, or two that differ; gaps are never filled ({trendGaps.length ? `budget or spending: FY ${trendGaps.join(', ')}` : 'none in budget or spending'}). Other publishers&rsquo; values: {host}{base}ledger/.</p>
          </section>

          <section className="brief-block" aria-labelledby="brief-pp-h">
            <h3 id="brief-pp-h">Spending per person, FY {pp.cpiBase} prices (our calculation)</h3>
            <table className="brief-table" id="brief-pp-table">
              <caption className="sr-only">{m.name} real spending per person by fiscal year, KSh at FY {pp.cpiBase} prices</caption>
              <thead><tr><th scope="col">FY</th>{pp.rows.map((r) => <th scope="col" key={r.fy}>{r.fy}</th>)}</tr></thead>
              <tbody><tr><th scope="row">KSh per person</th>{pp.rows.map((r) => <td key={r.fy}>{r.gap ? '—' : fmtNum(r.real)}</td>)}</tr></tbody>
            </table>
            <p className="brief-note">Spending (Controller of Budget) &divide; population (2019 census, then KNBS projections as printed in the county statistical abstract; never interpolated) &times; national CPI adjustment (World Bank; approximate). Inputs and Siaya&rsquo;s values: {host}{base}analysis/.</p>
          </section>

          <section className="brief-block" aria-labelledby="brief-47-h">
            <h3 id="brief-47-h">{m.name} beside Siaya and all 47 counties, FY {last}</h3>
            <table className="brief-table" id="brief-47-table">
              <caption className="sr-only">{m.name}, Siaya and all counties, FY {last}, Controller of Budget all-county table, per cent</caption>
              <thead><tr><th scope="col">Measure, %</th><th scope="col">{m.name}</th><th scope="col">Siaya</th><th scope="col">All counties</th><th scope="col">Position (1 = highest)</th></tr></thead>
              <tbody>{ac.measures.map((x) => { const y = x.years.find((z) => z.fy === last); return (
                <tr key={x.key}><th scope="row">{x.title}{x.derived ? ' (our calculation)' : ''}</th><td>{p1(y.county && y.county.value)}</td><td>{p1(y.siaya && y.siaya.value)}</td><td>{p1(y.all && y.all.value)}</td><td>{y.rank ? `${y.rank} of ${y.ranked}` : '—'}</td></tr>
              ); })}</tbody>
            </table>
            <p className="brief-note">One Controller of Budget table, read by OCR the same way for all 47 counties; &ldquo;all counties&rdquo; is the table&rsquo;s total row. A position ranks the figure, not the county government. Earlier years: {host}{base}analysis/.</p>
          </section>
        </div>

        {/* ---------- Page 3: audit, open questions, gaps, sources ---------- */}
        <div className="brief-page" id="brief-p3">
          {DRAFT ? <p className="brief-runhead"><span className="tag warn">DRAFT</span> {m.name} County fiscal brief, page 3 of 3</p> : null}
          <div className="brief-cols">
            <section aria-labelledby="brief-audit-h">
              <h2 id="brief-audit-h">Audit opinions</h2>
              <table className="brief-table">
                <caption className="sr-only">Auditor-General opinions on the County Executive of {m.name}</caption>
                <thead><tr><th scope="col">FY</th><th scope="col">County Executive</th><th scope="col">Conf.</th></tr></thead>
                <tbody>{exec.map((o) => <tr key={o.fy}><th scope="row">{o.fy}</th><td>{o.opinion.replace(/ Opinion$/, '')}{o.tier === 'secondary' ? ' (secondary)' : ''}{o.needs_page_check ? ' †' : ''}</td><td>{o.confidence}</td></tr>)}</tbody>
              </table>
              <p className="brief-note">Secondary: read from a summary that quotes the Auditor-General, not the report. &dagger; Needs page check: read from a machine text layer, not yet compared with the page image.{others.length ? ` Audited separately, FY ${latestExec.fy}: ${others.map((o) => `${label(o.entity).split(',')[0].split(' (')[0]}, ${o.opinion.replace(/ Opinion$/, '').toLowerCase()}`).join('; ')}.` : ''}</p>
            </section>

            <section aria-labelledby="brief-q-h">
              <h2 id="brief-q-h">Open questions</h2>
              <ul className="brief-list" aria-labelledby="brief-q-h">
                <li>{cases} cases where two publishers print different figures for the same measure and year, and {conflicts} explained conflict cases, are listed on the ledger; none has yet been reviewed by a specialist.</li>
                <li>Pending bills: most years print more than one figure (County Executive only, or Executive and Assembly; &ldquo;trade payables&rdquo; in FY 2025/26). Read them side by side on the ledger, not as one series.</li>
                <li>Own-source revenue changed basis in FY 2023/24 (hospital revenue counted); the County Treasury and the Controller of Budget do not always agree on it.</li>
                <li>Spending per person rests on KNBS projections after 2019; the next census will revise them.</li>
              </ul>
            </section>
          </div>

          <section aria-labelledby="brief-gap-h">
            <h2 id="brief-gap-h">Data gaps</h2>
            <p className="brief-text">Years with no single Controller of Budget figure are blank, never filled: budget or spending {trendGaps.length ? `FY ${trendGaps.join(', ')}` : 'none'}; spending per person {pp.rows.filter((r) => r.gap).map((r) => `FY ${r.fy}`).join(', ') || 'none'}. County Executive audit opinions are held for {exec.length} years. The full list of gaps is on each county page: {host}{base}.</p>
          </section>

          <section aria-labelledby="brief-src-h">
            <h2 id="brief-src-h">Sources and how to read</h2>
            <ul className="brief-list brief-how">
              <li><b>Every figure</b> carries its source, period and unit here, and its page and confidence on the site. Confidence (1 to 5) grades source quality and extraction, not the chance a figure is right. Many figures were read by OCR from scanned pages.</li>
              <li><b>Review.</b> {counts.total ? `All ${fmtNum(counts.total)} ${m.name} values are` : 'All values are'} still waiting for editorial review; none has been approved.</li>
              <li><b>Conflicting figures</b> are shown side by side, never averaged: {host}{base}ledger/.</li>
              <li><b>Our calculations</b> (shares, spending per person, positions) show their formula and inputs: {host}{base}analysis/.</li>
              <li><b>How to read our reports</b>, marks and review states: {host}/reports/method/.</li>
            </ul>
          </section>

          <footer className="brief-foot">
            <p id="brief-sources"><b>Sources.</b> Controller of Budget, County Governments Budget Implementation Review Reports FY 2014/15 to FY 2025/26 (Parliament of Kenya library); Auditor-General reports on the County Executive of {m.name} and secondary summaries; KNBS 2019 census and {m.name} County Statistical Abstract 2024; World Bank WDI (CPI). Every document with its link and hash: {host}{base}sources/.</p>
            <p><b>Prepared</b> {shortDate(SITE_UPDATED)}. Takwimu Kenya: Turning Data into Progress. A Danico Ventures Ltd product. Independent; not affiliated with any government body. Education only, not legal, financial or audit advice.</p>
          </footer>
        </div>
      </article>
    </main>
  );
}
