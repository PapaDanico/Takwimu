import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import siaya from '../../../../data/siaya.json';
import hist from '../../../../data/history.json';
import reg from '../../../../data/conflicts.json';
import ledger from '../../../../data/siaya-fiscal-ledger.json';
import { fmt, shortDate } from '../../../../lib/format';
import { SITE_URL, SITE_UPDATED } from '../../../../lib/site';
import { counts, isProvisional, PUBLIC_LABEL } from '../../../../lib/review-status';
import { latestOpinions } from '../../../../lib/audits';

export const metadata = {
  title: 'Siaya County fiscal brief',
  description: 'A one-page printable brief on Siaya County finances: budget, spending, own-source revenue, pending bills and audit opinions, with sources and confidence.',
};

// Every fiscal year in the ten-year window, so missing years show as gaps rather than disappearing.
const FYS = ['2013/14', '2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25'];
const BY_FY = Object.fromEntries(hist.years.map((y) => [y.fy, y]));
const OSR_BY_FY = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
// Same rule as the Insights page: a stated total wins, otherwise recurrent plus development.
const pendOf = (y) => (y ? y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined) : undefined);
const num = (v, d = 2) => (v === undefined ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));
const conflict = (id) => reg.conflicts.find((c) => c.id === id);
// Years whose year-end pending-bills stock has an open discrepancy in the fiscal ledger.
const PEND_DISPUTED = new Set(ledger.discrepancies.filter((d) => d.indicator_id === 'pending_bills_close' && d.status === 'open').map((d) => d.period.replace('FY ', '')));
const lbl = (v) => v.label.replace(' (', ', ').replace(/\)$/, '');
// The brief shows values from these reviewed datasets; while any is unreviewed the sheet (and so its PDF) is a DRAFT.
const BRIEF_DATASETS = ['history', 'siaya-fiscal-ledger'];
const DRAFT = BRIEF_DATASETS.some((d) => isProvisional(counts(d)));

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
  const audits = [...hist.audits.points].sort((a, b) => a.fy.localeCompare(b.fy));
  const latestReport = hist.reports['2024/25'];
  // Pending bills at 30 June 2024 by the own-year rule (sweep D5), as in the ten-year table.
  const own24 = BY_FY['2023/24'].pending_total_m;

  const heads = [
    { k: `Approved budget, FY ${budget.fiscal_year}`, v: `KSh ${fmt(budget.approved_total)} bn`, m: `KSh ${fmt(budget.total_spent)} bn spent (${spentPct}% of budget)`, src: 'Controller of Budget, FY 2024/25 report', c: budget.confidence },
    { k: `Own-source revenue, FY ${osr.fiscal_year}`, v: `KSh ${fmt(primary.value)} m`, m: `The report states ${osr.share_of_annual_target_pct}% of the annual target`, src: 'Controller of Budget, FY 2024/25 report', c: primary.confidence },
    { k: 'Pending bills, 30 June 2024: sources disagree', v: `KSh ${fmt(own24)} m`, m: `FY 2023/24 report (own year); the FY 2024/25 report gives KSh ${fmt(pb.opening_30_jun_2024_billion)} bn. KSh ${fmt(pb.settled_in_year_million)} m settled in FY 2024/25`, src: 'Controller of Budget, FY 2024/25 and FY 2023/24 reports', c: budget.confidence },
    { k: `Audit opinion, FY ${aud.map((e) => e.fy).sort().slice(-1)[0]}`, v: [...new Set(aud.map((e) => e.opinion.replace(/ Opinion$/, '')))].join(' / '), m: aud.map((e) => e.label).join(' and '), src: 'Auditor-General', c: 3 },
  ];

  return (
    <main id="main" className="wrap brief">
      <article className="brief-sheet" aria-labelledby="brief-h">
        <header className="brief-head">
          <img className="brief-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="96" height="91" />
          <div>
            <nav aria-label="Breadcrumb"><p className="brief-eyebrow"><Link href="/counties/">Counties</Link> · <Link href="/counties/siaya/">Siaya</Link> · Fiscal brief</p></nav>
            <h1 id="brief-h">Siaya County fiscal brief</h1>
            {DRAFT ? <p className="brief-draft" data-draft="true"><span className="tag warn">DRAFT</span> <span className="tag warn">{PUBLIC_LABEL.REVIEW_PENDING}</span> Not yet checked by a reviewer.</p> : null}
            <p className="brief-sub">Ten years of budget, spending, revenue, unpaid bills and audit opinions, read from the Controller of Budget and Auditor-General reports. Nominal shillings; fiscal years run July to June.</p>
            <p className="brief-actions"><a href="/reports/siaya-fiscal-brief.pdf" download>Download this brief as PDF</a> · <Link href="/reports/#briefs">About briefs for your county or constituency</Link> · <Link href="/counties/siaya/">Back to Siaya</Link></p>
          </div>
        </header>

        <PageToc items={[['brief-head-h', 'Headline figures'], ['brief-ten-h', 'Ten years of spending'], ['brief-audit-h', 'Audit opinions'], ['brief-cav-h', 'Key caveats']]} />
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

        <div className="brief-cols">
          <section aria-labelledby="brief-ten-h">
            <h2 id="brief-ten-h">Ten years of spending</h2>
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
            <p className="brief-note">— means not published or not retrieved; gaps are never filled. Spent % is computed (spent ÷ budget). FY 2013/14 covers 16 months. FY 2019/20: Controller of Budget report not found; county and Senate figures are on takwimu.netlify.app/counties/siaya/ledger/. Pending bills: the closing stock printed in each year&apos;s own report; * another document gives a different stock for that date (open ledger discrepancy). † FY 2022/23 own revenue is ordinary own-source revenue (402.23 m) without 105.81 m of appropriations-in-aid; with them the report gives 508.04 m.</p>
          </section>

          <section aria-labelledby="brief-audit-h">
            <h2 id="brief-audit-h">Audit opinions</h2>
            <table className="brief-table">
              <caption className="sr-only">Auditor-General opinions on the County Executive of Siaya</caption>
              <thead><tr><th scope="col">FY</th><th scope="col">Opinion</th><th scope="col">Conf.</th></tr></thead>
              <tbody>
                {audits.map((a) => <tr key={a.fy}><th scope="row">{a.fy}</th><td>{a.opinion}</td><td>{a.confidence}</td></tr>)}
              </tbody>
            </table>
            <p className="brief-note">FY 2014/15 and 2015/16: Senate compilation of Auditor-General opinions, not the reports; FY 2014/15 may cover Executive and Assembly together. FY 2016/17 to 2018/19 not shown: reports not found. FY 2013/14 is the whole county government; later years the County Executive.</p>
          </section>
        </div>

        <section aria-labelledby="brief-cav-h">
          <h2 id="brief-cav-h">Key caveats</h2>
          <ul className="brief-list" aria-labelledby="brief-cav-h">
            <li>{openCases} disagreements between reports are open in the conflict register; none has been reviewed by a specialist.</li>
            <li>Pending bills at 30 June 2024: KSh {num(pend24.values[0].value)} m ({lbl(pend24.values[0])}) against KSh {num(pend24.values[1].value)} m ({lbl(pend24.values[1])}). The headline and the ten-year table use each year&apos;s own report ({num(own24)} m for FY 2023/24).</li>
            <li>Own revenue FY 2023/24: KSh {num(osr24.values[0].value)} m against KSh {num(osr24.values[1].value)} m in the next report.</li>
            <li>Pending bills at 30 June 2021: KSh {num(pend21.values[0].value)} m against KSh {num(pend21.values[1].value)} m. Read the ten-year rise as a direction, not exact steps.</li>
            <li>Figures are nominal and many were read from scanned PDFs. Confidence (1 to 5) grades source quality and extraction, not the chance a figure is right.</li>
          </ul>
        </section>

        <footer className="brief-foot">
          <p><b>Sources.</b> Controller of Budget, County Governments Budget Implementation Review Reports FY 2014/15 to FY 2024/25 (Parliament of Kenya library), latest: {latestReport.url.replace('https://', '')}. Auditor-General reports on Siaya, latest: {aud[0].url.replace('https://', '')}. Full list, checksums and the conflict register: {SITE_URL.replace('https://', '')}/data/.</p>
          <p><b>Prepared</b> {shortDate(SITE_UPDATED)} from data retrieved {shortDate(hist.meta.retrieved)}. Takwimu Kenya: Turning Data into Progress. A Danico Ventures Ltd product. Independent; not affiliated with any government body. Education only, not legal, financial or audit advice. Check figures against the source documents.</p>
        </footer>
      </article>
    </main>
  );
}
