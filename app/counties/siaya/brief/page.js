import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import BriefChart from '../../../../components/BriefChart';
import Reviewed from '../../../../components/Reviewed';
import siaya from '../../../../data/siaya.json';
import hist from '../../../../data/history.json';
import reg from '../../../../data/conflicts.json';
import ledger from '../../../../data/siaya-fiscal-ledger.json';
import { fmt, shortDate, fmtNum } from '../../../../lib/format';
import { SITE_URL, SITE_UPDATED } from '../../../../lib/site';
import { counts, isProvisional, PUBLIC_LABEL, badge } from '../../../../lib/review-status';
import { latestOpinions } from '../../../../lib/audits';
import { SIAYA_FYS, SIAYA_OSR_BY_FY, pendingTotal as pendOf } from '../../../../lib/siaya-years';
import { b1, b2, b5, osrSeries, refBadge, fyOf, gaps as layerGaps } from '../../../../lib/layers';
import { pageMeta } from '../../../../lib/page-meta';

export const metadata = pageMeta('/counties/siaya/brief/', {
  title: 'Siaya County fiscal brief',
  description: 'A three-page printable brief on Siaya County finances: headline figures and what they mean; ten-year trends in revenue, spending, the wage bill, development share and pending bills; audit opinions, open questions, data gaps and sources.',
});

// Every fiscal year in the ten-year window, so missing years show as gaps rather than disappearing.
const FYS = SIAYA_FYS;
const BY_FY = Object.fromEntries(hist.years.map((y) => [y.fy, y]));
const OSR_BY_FY = SIAYA_OSR_BY_FY;
const num = (v, d = 2) => (v === undefined || v === null ? '—' : fmtNum(Number(v), { dp: d }));
const conflict = (id) => reg.conflicts.find((c) => c.id === id);
// Years whose year-end pending-bills stock has an open discrepancy in the fiscal ledger.
const PEND_DISPUTED = new Set(ledger.discrepancies.filter((d) => d.indicator_id === 'pending_bills_close' && d.status === 'open').map((d) => d.period.replace('FY ', '')));
const lbl = (v) => v.label.replace(' (', ', ').replace(/\)$/, '');
// The brief shows values from these reviewed datasets; while any is unreviewed the brief (and so its PDF) is a DRAFT.
const BRIEF_DATASETS = ['history', 'siaya-fiscal-ledger', 'siaya-analysis-layers', 'siaya-county-series'];
const DRAFT = BRIEF_DATASETS.some((d) => isProvisional(counts(d)));
const short = (fy) => fy.slice(2);
const LAY = 'siaya-analysis-layers';
// A calculated share in a brief table: the value, or "withdrawn" when its review withholds it.
const Pct = ({ r }) => (r && r.status === 'value' ? <Reviewed b={badge(LAY, r.calc_id)}>{() => num(r.result, 1)}</Reviewed> : '—');

export default function SiayaBrief() {
  const osr = siaya.own_source_revenue;
  const primary = osr.observations[0];
  const budget = siaya.budget;
  // The latest opinion of each entity, from data/siaya-audits.json (as on the hub; never typed in).
  const aud = latestOpinions().entities;
  const pb = budget.pending_bills;
  const spentPct = Math.round((budget.total_spent / budget.approved_total) * 100);
  const openCases = reg.conflicts.filter((c) => c.status === 'open').length;
  const pend24 = conflict('pending-2024');
  const osr24 = conflict('osr-2023-24');
  const pend21 = conflict('pending-2021');
  const osr20 = conflict('osr-2019-20-audited-table');
  const audits = [...hist.audits.points].sort((a, b) => a.fy.localeCompare(b.fy));
  const latestReport = hist.reports['2024/25'];
  // Pending bills at 30 June 2024 by the own-year rule (sweep D5), as in the ten-year table.
  const own24 = BY_FY['2023/24'].pending_total_m;
  const dev = budget.categories.find((c) => c.label === 'Development') || {};

  // Layers B1, B2, B5 and the own-source revenue series (lib/layers.js, masked).
  const W = b1();
  const D = b2();
  const P = b5();
  const O = osrSeries();
  const wageOf = (fy) => W.records.find((r) => fyOf(r) === fy);
  const devOf = (fy, k) => D.cell(fy, k).find((r) => r.status === 'value');
  const pendRatioOf = (fy) => P.records.filter((r) => fyOf(r) === fy && r.status === 'value' && !P.cross(r))[0];
  const wageLatest = W.records.filter((r) => r.status === 'value').pop();
  const devActualBelow = D.years.filter((y) => { const r = devOf(y, 'actual-cob'); return r && r.result < D.threshold.value; });
  const devActualHeld = D.years.filter((y) => devOf(y, 'actual-cob'));
  const osr25 = O.rows.find((c) => c.fy === '2024/25');
  const osrVal = (c, s) => (c ? c.values.filter((v) => v.series === s) : []);
  const g = layerGaps();
  const devAbs = FYS.map((fy) => BY_FY[fy] && BY_FY[fy].development_absorption_pct).filter((v) => typeof v === 'number');
  const chapterAbove = W.years.filter((y) => { const r = pendRatioOf(y); return r && r.flags.above_limit; });
  const gapCount = hist.meta.gaps.length + g.departments + g.series + g.layers;

  const heads = [
    { k: `Approved budget, FY ${budget.fiscal_year}`, v: `KSh ${fmt(budget.approved_total)} bn`, m: `KSh ${fmt(budget.total_spent)} bn spent (${spentPct}% of budget)`, src: 'Controller of Budget, FY 2024/25 report', c: budget.confidence },
    { k: `Own-source revenue, FY ${osr.fiscal_year}`, v: `KSh ${fmt(primary.value)} m`, m: `The report states ${osr.share_of_annual_target_pct}% of the annual target`, src: 'Controller of Budget, FY 2024/25 report', c: primary.confidence },
    { k: 'Pending bills, 30 June 2024: sources disagree', v: `KSh ${fmt(own24)} m`, m: `FY 2023/24 report (own year); the FY 2024/25 report gives KSh ${fmt(pb.opening_30_jun_2024_billion)} bn. KSh ${fmt(pb.settled_in_year_million)} m settled in FY 2024/25`, src: 'Controller of Budget, FY 2024/25 and FY 2023/24 reports', c: budget.confidence },
    { k: `Audit opinion, FY ${aud.map((e) => e.fy).sort().slice(-1)[0]}`, v: [...new Set(aud.map((e) => e.opinion.replace(/ Opinion$/, '')))].join(' / '), m: aud.map((e) => e.label).join(' and '), src: 'Auditor-General', c: 3 },
  ];

  return (
    <main id="main" className="wrap brief">
      <article className="brief-sheet" aria-labelledby="brief-h">
        {/* ---------- Page 1: headline figures and what they mean ---------- */}
        <div className="brief-page" id="brief-p1">
          <header className="brief-head">
            <img className="brief-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="96" height="91" />
            <div>
              <nav aria-label="Breadcrumb"><p className="brief-eyebrow"><Link href="/counties/">Counties</Link> · <Link href="/counties/siaya/">Siaya</Link> · Fiscal brief</p></nav>
              <h1 id="brief-h">Siaya County fiscal brief</h1>
              {DRAFT ? <p className="brief-draft" data-draft="true"><span className="tag warn">DRAFT</span> <span className="tag warn">{PUBLIC_LABEL.REVIEW_PENDING}</span> Not yet checked by a reviewer.</p> : null}
              <p className="brief-sub">Budget, spending, revenue, unpaid bills and audit opinions over ten years, read from the Controller of Budget, the County Treasury and the Auditor-General. Nominal shillings; fiscal years run July to June. Three pages: headlines, trends, and audit, questions and sources.</p>
              <p className="brief-actions"><a href="/reports/siaya-fiscal-brief.pdf" download>Download this brief as PDF</a> · <Link href="/reports/#briefs">About briefs for your county or constituency</Link> · <Link href="/counties/siaya/">Back to Siaya</Link></p>
            </div>
          </header>

          <PageToc items={[['brief-head-h', 'Headline figures'], ['brief-mean-h', 'What the figures mean'], ['brief-trend-h', 'Trends'], ['brief-audit-h', 'Audit opinions'], ['brief-q-h', 'Open questions'], ['brief-src-h', 'Sources and how to read']]} />
          <section aria-labelledby="brief-head-h">
            <h2 id="brief-head-h">Headline figures</h2>
            <dl className="brief-tiles">
              {heads.map((h) => (
                <div key={h.k}>
                  <dt>{h.k}</dt>
                  <dd className="v">{h.v}</dd>
                  <dd>{h.m}</dd>
                  <dd className="src">{h.src} · confidence {h.c} of 5</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="brief-mean-h">
            <h2 id="brief-mean-h">What the figures mean</h2>
            <ul className="brief-mean">
              <li><b>Spending.</b> Siaya spent {spentPct} per cent of its FY {budget.fiscal_year} budget{dev.absorption_pct !== undefined ? `, and ${dev.absorption_pct} per cent of the development budget` : ''}. Across the years held the share of the development budget spent ranged from {devAbs.length ? `${num(Math.min(...devAbs), 1)} to ${num(Math.max(...devAbs), 1)}` : '—'} per cent (page 2). Unspent development money usually means projects started late or not at all; the reports do not always say which.</li>
              <li><b>Own revenue.</b> What the county raises itself is small beside national transfers, and the figure depends on who counts it. For FY 2024/25 the Controller of Budget prints KSh {fmt(primary.value)} million; the Auditor-General&rsquo;s audited statement counts {osrVal(osr25, 'oag-ror').map((v) => `KSh ${num(v.value_ksh_m)} million`).join(' and ')} received in cash, including hospital fees. The difference is mostly what is counted, not money gone missing.</li>
              <li><b>Wage bill.</b> Staff costs were above the 35 per cent of revenue ceiling in {W.above.length} of the {W.valued} years with a value{wageLatest ? `; FY ${fyOf(wageLatest)}: ${num(wageLatest.result, 1)} per cent (our calculation from the Controller of Budget report)` : ''}. The Auditor-General&rsquo;s own ratio for FY 2024/25 uses the County Executive&rsquo;s receipts and is higher ({W.oag.filter((o) => o.fy === '2024/25').map((o) => `“${o.value}”`).join('; ') || 'not printed'}).</li>
              <li><b>Development.</b> {D.budgetBelow.length ? `Budgets below the 30 per cent development floor: ${D.budgetBelow.join(', ')}.` : 'Every budget held puts at least 30 per cent on development, as the law asks.'} Actual development spending was below 30 per cent of all spending in {devActualBelow.length} of {devActualHeld.length} years. Budgeted is not delivered.</li>
              <li><b>Unpaid bills.</b> The stock printed in the county chapter of each year&rsquo;s report was {chapterAbove.length ? `above 20 per cent of revenue in ${chapterAbove.join(', ')}` : 'below 20 per cent of revenue in every year with a value'}; the FY 2024/25 cross-county table, which adds the Assembly and the bills of the year, gives {num((P.records.find((r) => r.calc_id.endsWith('-L256')) || {}).result, 1)} per cent. Which stock is right is an open question (page 3).</li>
              <li><b>Audit.</b> The latest opinions ({aud.map((e) => `${e.label}, FY ${e.fy}`).join('; ')}) are {[...new Set(aud.map((e) => e.opinion.replace(/ Opinion$/, '').toLowerCase()))].join(' and ')}{aud.every((e) => /^Qualified/.test(e.opinion)) ? ': the accounts are fair except for the matters the auditor lists' : ''}. A qualified opinion is a statement about the accounts, not about any person.</li>
            </ul>
            <p className="brief-note">Shares marked as our calculation are arithmetic by Takwimu Kenya on published figures (numerator and denominator from one document). Thresholds are facts about a ratio, not verdicts.</p>
          </section>
        </div>

        {/* ---------- Page 2: trends ---------- */}
        <div className="brief-page" id="brief-p2">
          {DRAFT ? <p className="brief-runhead"><span className="tag warn">DRAFT</span> Siaya County fiscal brief, page 2 of 3</p> : null}
          <h2 id="brief-trend-h" className="brief-pagehead">Trends, FY 2013/14 to FY 2024/25</h2>
          <section className="brief-block" aria-labelledby="brief-ten-h">
            <h3 id="brief-ten-h">Spending and absorption</h3>
            <div className="brief-pair">
              <BriefChart labels={FYS.map(short)} unit="KSh billion" ariaLabel="Siaya approved budget and spending by fiscal year, KSh billion"
                series={[{ name: 'Approved budget', color: 1, values: FYS.map((fy) => BY_FY[fy] && BY_FY[fy].approved !== undefined ? BY_FY[fy].approved : null) }, { name: 'Spent', color: 2, dash: true, values: FYS.map((fy) => BY_FY[fy] && BY_FY[fy].spent !== undefined ? BY_FY[fy].spent : null) }]} />
              <div className="tablewrap" role="region" aria-label="Ten years of spending, scrollable table" tabIndex={0}>
              <table className="brief-table">
                <caption className="sr-only">Siaya County budget, spending, own-source revenue and pending bills by fiscal year</caption>
                <thead>
                  <tr><th scope="col">FY</th><th scope="col">Budget, KSh bn</th><th scope="col">Spent, KSh bn</th><th scope="col">Spent, %</th><th scope="col"><Link href="/learn/#own-source-revenue">Own revenue</Link>, KSh m</th><th scope="col">Pending bills, KSh m</th></tr>
                </thead>
                <tbody>
                  {FYS.map((fy) => {
                    const y = BY_FY[fy];
                    const o = OSR_BY_FY[fy];
                    const share = y && y.approved !== undefined && y.spent !== undefined ? Math.round((y.spent / y.approved) * 100) : undefined;
                    return (
                      <tr key={fy}>
                        <th scope="row">{fy}</th>
                        <td>{num(y && y.approved)}</td>
                        <td>{num(y && y.spent)}</td>
                        <td>{num(share, 0)}</td>
                        <td>{num(o && o.value, 0)}{fy === '2022/23' ? '†' : ''}</td>
                        <td>{num(pendOf(y), 0)}{pendOf(y) !== undefined && PEND_DISPUTED.has(fy) ? '*' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
            <p className="brief-note">Controller of Budget reports. — means not published or not retrieved; gaps are never filled. Spent % is computed (spent ÷ budget). FY 2013/14 covers 16 months. FY 2019/20: Controller of Budget report not found. Pending bills: the closing stock printed in each year&apos;s own report; * another document gives a different stock for that date. † FY 2022/23 own revenue is ordinary revenue (402.23 m) without 105.81 m of appropriations-in-aid.</p>
          </section>

          <section className="brief-block" aria-labelledby="brief-osr-h">
            <h3 id="brief-osr-h">Own-source revenue as each publisher prints it</h3>
            <div className="brief-pair">
              <BriefChart labels={O.years.map(short)} unit="KSh million" ariaLabel="Siaya own-source revenue by fiscal year as four publishers print it, KSh million" series={O.series.map((s) => ({ ...s, name: s.name.replace(/ \(.*\)$/, '') }))} />
              <div className="tablewrap" role="region" aria-label="Own-source revenue by publisher, scrollable table" tabIndex={0}>
              <table className="brief-table brief-osr" id="brief-osr-table">
                <caption className="sr-only">Siaya own-source revenue by fiscal year and publisher, KSh million; publishers are never blended</caption>
                <thead><tr><th scope="col">FY</th><th scope="col">Controller of Budget</th><th scope="col">County review</th><th scope="col">Treasury table, OAG report</th><th scope="col">OAG audited</th></tr></thead>
                <tbody>{O.rows.map((c) => (
                  <tr key={c.fy}><th scope="row">{c.fy}</th>{O.cols.map((col) => { const vs = osrVal(c, col); const uniq = vs.filter((v, i) => vs.findIndex((w) => w.value_ksh_m === v.value_ksh_m) === i); return <td key={col}>{uniq.length ? uniq.map((v, i) => <span key={i}>{i ? ' / ' : ''}<Reviewed b={refBadge(v.ref)}>{() => num(v.value_ksh_m, 0)}</Reviewed></span>) : '—'}</td>; })}</tr>
                ))}</tbody>
              </table>
              </div>
            </div>
            <p className="brief-note">County review: the County Treasury&rsquo;s Budget Review and Outlook Paper (not audited). Treasury table: County Treasury figures printed in the Auditor-General&rsquo;s Receiver of Revenue report, outside the audit opinion. OAG audited: the audited statement (cash; FY 2024/25 accrual is higher). Two figures in one cell are two printings. FY 2019/20 is conflict case {osr20 ? osr20.id : 'osr-2019-20-audited-table'}.</p>
          </section>

          <section className="brief-block" aria-labelledby="brief-lim-h">
            <h3 id="brief-lim-h">Wage bill, development share and pending bills beside their limits</h3>
            <div className="brief-pair">
              <BriefChart labels={W.years.map(short)} unit="Per cent (our calculation)" ariaLabel="Siaya wage bill and pending bills as a share of revenue, and development share of the budget, by fiscal year, per cent, with the 35, 30 and 20 per cent limits"
                refLines={[{ value: 35, label: '35% wage ceiling' }, { value: 30, label: '30% development floor' }, { value: 20, label: '20% liabilities' }]}
                series={[{ name: 'Wage bill, % of revenue', color: 1, values: W.series[0].values }, { name: 'Development, % of budget', color: 3, dash: true, values: W.years.map((y) => { const r = devOf(y, 'budget-cob'); return r ? r.result : null; }) }, { name: 'Pending bills, % of revenue', color: 2, values: W.years.map((y) => { const r = pendRatioOf(y); return r ? r.result : null; }) }]} />
              <div className="tablewrap" role="region" aria-label="Shares beside their limits, scrollable table" tabIndex={0}>
              <table className="brief-table" id="brief-lim-table">
                <caption className="sr-only">Siaya wage bill, development share and pending bills shares by fiscal year, per cent (Takwimu calculation from the Controller of Budget report for each year)</caption>
                <thead><tr><th scope="col">FY</th><th scope="col">Wage bill, % revenue</th><th scope="col">Development, % budget</th><th scope="col">Development, % spent</th><th scope="col">Pending, % revenue</th></tr></thead>
                <tbody>{W.years.map((y) => (
                  <tr key={y}><th scope="row">{y}</th><td><Pct r={wageOf(y)} /></td><td><Pct r={devOf(y, 'budget-cob')} /></td><td><Pct r={devOf(y, 'actual-cob')} /></td><td><Pct r={pendRatioOf(y)} /></td></tr>
                ))}</tbody>
              </table>
              </div>
            </div>
            <p className="brief-note">Limits: wage bill at most 35 per cent of total revenue (PFM (County Governments) Regulations 2015, reg. 25(1)(b)); at least 30 per cent of the budget for development over the medium term (PFM Act 2012, s. 107(2)(b)); the 20 per cent is the liabilities limit the Auditor-General applies (FY 2024/25 report). The law texts are not yet in our source library, so wording is as commonly cited. Pending: the stock in the county chapter of each report.</p>
          </section>
        </div>

        {/* ---------- Page 3: audit, open questions, gaps, sources and how to read ---------- */}
        <div className="brief-page" id="brief-p3">
          {DRAFT ? <p className="brief-runhead"><span className="tag warn">DRAFT</span> Siaya County fiscal brief, page 3 of 3</p> : null}
          <div className="brief-cols">
            <section aria-labelledby="brief-audit-h">
              <h2 id="brief-audit-h">Audit opinions</h2>
              <table className="brief-table">
                <caption className="sr-only">Auditor-General opinions on the County Executive of Siaya</caption>
                <thead><tr><th scope="col">FY</th><th scope="col">Opinion</th><th scope="col">Conf.</th></tr></thead>
                <tbody>
                  {audits.map((a) => <tr key={a.fy}><th scope="row">{a.fy}</th><td>{a.opinion}</td><td>{a.confidence}</td></tr>)}
                  {aud.filter((e) => !audits.some((a) => a.fy === e.fy && e.entity === 'county_executive')).map((e) => <tr key={`${e.entity}${e.fy}`}><th scope="row">{e.fy}</th><td><Reviewed b={e.review}>{() => `${e.opinion.replace(/ Opinion$/, '')} (${e.label})`}</Reviewed></td><td>{e.confidence ?? 3}</td></tr>)}
                </tbody>
              </table>
              <p className="brief-note">FY 2014/15 and 2015/16: Senate compilation of Auditor-General opinions, not the reports; FY 2014/15 may cover Executive and Assembly together. FY 2016/17 to 2018/19: reports not found. FY 2013/14 is the whole county government; later years the County Executive.</p>
            </section>

            <section aria-labelledby="brief-q-h">
              <h2 id="brief-q-h">Open questions</h2>
              <ul className="brief-list" aria-labelledby="brief-q-h">
                <li>{openCases} disagreements between reports are open in the conflict register; none has been reviewed by a specialist.</li>
                <li>Pending bills at 30 June 2024: KSh {num(pend24.values[0].value)} m ({lbl(pend24.values[0])}) against KSh {num(pend24.values[1].value)} m ({lbl(pend24.values[1])}). The headline and the table use each year&apos;s own report ({num(own24)} m for FY 2023/24).</li>
                <li>Own revenue FY 2023/24: KSh {num(osr24.values[0].value)} m against KSh {num(osr24.values[1].value)} m in the next report.</li>
                {osr20 ? <li>Own revenue FY 2019/20: {osr20.values.map((v) => `KSh ${num(v.value)} m (${v.label.split(' (')[0]})`).join(', against ')}. Nothing printed explains the gap.</li> : null}
                <li>Pending bills at 30 June 2021: KSh {num(pend21.values[0].value)} m against KSh {num(pend21.values[1].value)} m. Read the ten-year rise as a direction, not exact steps.</li>
                <li>Why does the Controller of Budget&rsquo;s own revenue for FY 2024/25 (KSh {fmt(primary.value)} m) sit so far below the audited cash receipts? The basis explains much of it; a reviewer has not yet confirmed the rest.</li>
              </ul>
            </section>
          </div>

          <section aria-labelledby="brief-gap-h">
            <h2 id="brief-gap-h">Data gaps</h2>
            <p className="brief-text">{gapCount} gaps are recorded behind this brief: {hist.meta.gaps.length} in the ten-year series, {g.departments + g.series} missing county or audit documents, and {g.layers} calculations with no value (an input is missing or not comparable). Gaps are listed, never filled or estimated: {SITE_URL.replace('https://', '')}/method/#known-gaps.</p>
          </section>

          <section aria-labelledby="brief-src-h">
            <h2 id="brief-src-h">Sources and how to read</h2>
            <ul className="brief-list brief-how">
              <li><b>Every figure</b> carries its source, period and unit here, and its page and confidence on the site. Confidence (1 to 5) grades source quality and extraction, not the chance a figure is right. Many figures were read from scanned PDFs.</li>
              <li><b>Conflicting figures</b> are shown side by side, never averaged; the conflict register explains each case: {SITE_URL.replace('https://', '')}/data/#conflicts.</li>
              <li><b>Our calculations</b> (shares on page 2) use one document per ratio. Formulas and inputs: {SITE_URL.replace('https://', '')}/counties/siaya/analysis/.</li>
              <li><b>How to read our reports</b>, marks and review states: {SITE_URL.replace('https://', '')}/reports/method/.</li>
            </ul>
          </section>

          <footer className="brief-foot">
            <p id="brief-sources"><b>Sources.</b> Controller of Budget, County Governments Budget Implementation Review Reports FY 2014/15 to FY 2024/25 (Parliament of Kenya library), latest: {latestReport.url.replace('https://', '')}. Auditor-General reports on Siaya, latest: {aud[0].url.replace('https://', '')}; Receiver of Revenue reports FY 2023/24 and FY 2024/25. County Treasury Budget Review and Outlook Papers and programme-based budgets (KIPPRA repository). Full list, checksums and the conflict register: {SITE_URL.replace('https://', '')}/data/ and {SITE_URL.replace('https://', '')}/counties/siaya/sources/.</p>
            <p><b>Prepared</b> {shortDate(SITE_UPDATED)}. Takwimu Kenya: Turning Data into Progress. A Danico Ventures Ltd product. Independent; not affiliated with any government body. Education only, not legal, financial or audit advice. Check figures against the source documents.</p>
          </footer>
        </div>
      </article>
    </main>
  );
}
