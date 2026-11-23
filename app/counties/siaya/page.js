import Link from 'next/link';
import TableWrap from '../../../components/TableWrap';
import KenyaMap from '../../../components/KenyaMap';
import PageToc from '../../../components/PageToc';
import { Provisional } from '../../../components/ObsTable';
import { SIAYA_GROUPS } from '../../../lib/siaya-nav';

export const metadata = {
  title: 'Siaya County',
  description: 'Siaya County public finances: revenue, spending, unpaid bills and audit opinions, with sources and confidence for every figure.',
};
import siaya from '../../../data/siaya.json';
import hist from '../../../data/history.json';
import { fmt, shortDate } from '../../../lib/format';
import { latestOpinions } from '../../../lib/audits';
import { pendingAt, range } from '../../../lib/editorial';
import Reviewed from '../../../components/Reviewed';

// Audit summary generated from data/siaya-audits.json and data/history.json (owner item 3): the latest year with an
// opinion for each entity, as printed; never typed into the page. The smoke test compares this text with the data.
const AUD = latestOpinions();
const AUD_LATEST_FY = AUD.entities.map((e) => e.fy).sort().slice(-1)[0];
const lower = (t) => t.replace(/ Opinion$/, '').toLowerCase();
// Pending bills at 30 June 2025 (end of FY 2024/25): every printed value, smallest to largest (owner item 4).
const P25 = pendingAt('2024/25');
const P25R = range(P25);
const m2 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Tile({ label, value, unit, note, tone, dashed, tag }) {
  return (
    <div className={`tile${tone ? ` ${tone}` : ''}${dashed ? ' dashed' : ''}`}>
      <p className="k">{label} {tag && <span className="tag warn">{tag}</span>}</p>
      <p className="v">{value}{unit && <small>{unit}</small>}</p>
      {note && <p className="m">{note}</p>}
    </div>
  );
}

// FY 2025/26 in-year (partial-year) figures: shown apart from the ten-year series, never charted with it.
const IY = hist.in_year;
const IY_MEASURES = IY.periods.flatMap((p) => p.figures).filter((f, i, a) => a.findIndex((x) => x.measure === f.measure) === i);
const IY_CONFLICT = { payables_assembly_opening: 'in-year-assembly-payables-2025', revenue_arrears_close: 'in-year-revenue-arrears-2025' };
const iyValue = (f) => (f.unit === '%' ? `${f.value}%` : `${f.unit} ${f.value.toLocaleString('en-US')}`);

export default function Home() {
  const osr = siaya.own_source_revenue;
  const [primary, county, report] = osr.observations;
  const budget = siaya.budget;
  const [dev, rec] = budget.categories;
  const share = osr.share_of_annual_target_pct;
  const spentPct = Math.round((budget.total_spent / budget.approved_total) * 100);
  const settledPct = Math.round((budget.pending_bills.settled_in_year_million / (budget.pending_bills.opening_30_jun_2024_billion * 1000)) * 100);
  // Pending bills at 30 June 2024 by the own-year rule (sweep D5): the closing stock printed in the FY 2023/24 report,
  // as in the ten-year series; the FY 2024/25 report's opening stock for the same date is the other end of the range.
  const pend24 = hist.years.find((y) => y.fy === '2023/24');
  const pend24Src = pend24.provenance.pending_total_m;
  const asOf = shortDate(primary.retrieved);
  const auditAmber = AUD.entities.some((e) => !/^Unqualified/.test(e.opinion));

  return (
    <main id="main" className="wrap page">
      <header>
        <nav aria-label="Breadcrumb"><p className="eyebrow"><Link href="/counties/">Counties</Link> · Siaya · County 41 · FY {osr.fiscal_year}</p></nav>
        <h1>Siaya County finances at a glance</h1>
        <p className="page-sub">
          Revenue, spending, unpaid bills and audit in one view, with every figure traced to the
          document it came from.
        </p>
        <nav aria-label="Siaya County pages" className="hub-groups">
          {SIAYA_GROUPS.map((g) => (
            <div key={g.label}>
              <h2 className="mini">{g.label}</h2>
              <ul>{g.links.map(([h, t]) => <li key={h}><Link href={h}>{t}</Link></li>)}</ul>
            </div>
          ))}
        </nav>
        <p className="asof"><a href="/reports/siaya-fiscal-brief.pdf" download>Download the one-page fiscal brief (PDF, A4)</a></p>
        <p className="asof"><span className="tag good">Checked {asOf}</span> against the Controller of Budget and Auditor-General reports</p>
        <Provisional dataset={['history', 'siaya-audits', 'siaya-fiscal-ledger']}>Figures were transcribed by Takwimu from the Controller of Budget and Auditor-General reports and have not yet been checked by a reviewer.</Provisional>
      </header>
      <PageToc items={[['where-h', 'Where Siaya is'], ['position', 'County position'], ['key-h', 'Key figures'], ['obl', 'Pending bills, arrears and stalled projects'], ['aud', 'Audit'], ['tenh', 'Ten years'], ['inyh', `FY ${IY.fy} so far`], ['learnh', 'Budget terms'], ['where', 'Sub-counties']]} />
      <section className="card" aria-labelledby="where-h">
        <h2 id="where-h">Where Siaya is</h2>
        <KenyaMap focus="siaya" ariaLabel="Map of Kenya with Siaya County highlighted" />
      </section>

      <section className="card gold" aria-labelledby="position">
        <h2 id="position">County position</h2>
        <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--ink-soft)', maxWidth: '46rem' }}>
          In FY {osr.fiscal_year} Siaya collected KSh {fmt(primary.value)} million of its own revenue,
          {' '}{share} per cent of its annual target, and spent {dev.absorption_pct} per cent of its development budget.
          The latest audit opinions read, for FY {AUD_LATEST_FY}, are {AUD.entities.map((e) => `${lower(e.opinion)} for the ${e.label} (FY ${e.fy})`).join(' and ')}.
        </p>
        <div className="pills">
          <span className={`pill ${share < 50 ? 'warn' : ''}`}>Own revenue {share}% of target</span>
          <span className={`pill ${dev.absorption_pct < 60 ? 'warn' : ''}`}>Development spending {dev.absorption_pct}% of budget</span>
          <span className="pill">Recurrent spending {rec.absorption_pct}% of budget</span>
          {AUD.entities.map((e) => <span key={e.entity} className={`pill ${/^Unqualified/.test(e.opinion) ? 'good' : 'warn'}`}>Audit FY {e.fy}, {e.label}: {e.opinion}</span>)}
          <span className="pill warn">Sources disagree on revenue</span>
          <a className="pill warn" href="/counties/siaya/ledger/#pending-2025">Pending bills at 30 Jun 2025: sources disagree (KSh {m2(P25R.min)}M to KSh {m2(P25R.max)}M)</a>
          <a className="pill warn" href="/data/#pending-2024">Pending bills at 30 Jun 2024: sources disagree (KSh {fmt(pend24.pending_total_m)}M to {budget.pending_bills.opening_30_jun_2024_billion}B)</a>
        </div>
        <p className="rule-note">
          Amber marks a figure below 50 per cent of its target, a development budget less than 60 per
          cent spent, an audit opinion other than unqualified, or sources that disagree. These are
          simple rules, not verdicts.
        </p>
      </section>

      <section className="card" id="key" aria-labelledby="key-h">
        <h2 id="key-h">Key figures, FY {osr.fiscal_year}</h2>
        <p className="lead">One summary figure per measure. Each measure has one home page with every source, page, year and conflict.</p>
        <div className="tiles">
          <Tile label="Own-source revenue" value={fmt(primary.value)} unit="KSh million" tag="Sources disagree" note={<>Controller of Budget figure, {share} per cent of the annual target. The county&apos;s own Q4 report gives KSh {fmt(report.value)} million. All sources side by side, ten years and how it is made up: <Link href="/counties/siaya/ledger/#osr-latest">fiscal reconciliation and own-source revenue</Link>.</>} />
          <Tile label="Share of budget spent" value={`${spentPct}%`} tone={dev.absorption_pct < 60 ? 'warn' : ''} note={<>KSh {budget.total_spent}B of KSh {budget.approved_total}B approved; development {dev.absorption_pct}%, recurrent {rec.absorption_pct}%. Ten years, printed and recalculated: <Link href="/counties/siaya/analysis/#spent">Siaya analysis</Link>.</>} />
        </div>
      </section>

      <section className="card" id="obligations" aria-labelledby="obl">
        <h2 id="obl">Pending bills, arrears and stalled projects</h2>
        <p className="lead">What the county owes, what is owed to it, and what has stopped midway.</p>
        <div className="tiles">
          <Tile label="Pending bills at 30 June 2024" value={`KSh ${fmt(pend24.pending_total_m)}M`} tone="warn" tag="Sources disagree" note={<>Closing stock in the FY 2023/24 report, the year&apos;s own report (printed page {pend24Src.printed_page}; County Executive only, excluding bills incurred in the year), as in the ten-year series. The FY 2024/25 report gives an opening stock of KSh {budget.pending_bills.opening_30_jun_2024_billion} billion for the same date. Range KSh {fmt(pend24.pending_total_m)} million to KSh {budget.pending_bills.opening_30_jun_2024_billion} billion; see <a href="/data/#pending-2024">case pending-2024</a>. Every year, the roll-forward and the ratios: <Link href="/counties/siaya/analysis/#pending">Siaya analysis</Link>.</>} />
          <Tile label="Pending bills at 30 June 2025" value={`KSh ${m2(P25R.min)}M to ${m2(P25R.max)}M`} tone="warn" tag="Sources disagree" note={<>{P25.length} printed values for the same date. The lowest, KSh {m2(P25R.min)} million, is the County Executive&apos;s opening stock less payments with no new bills added (Controller of Budget Table 3.457 and the county&apos;s Q4 report); the others add the bills of the year or the County Assembly. Every value with its source, page, scope and basis: <Link href="/counties/siaya/ledger/#pending-2025">fiscal reconciliation</Link>.</>} />
          <Tile label="Settled in FY 2024/25" value={`KSh ${fmt(budget.pending_bills.settled_in_year_million)}M`} note={`About ${settledPct} per cent of the KSh ${budget.pending_bills.opening_30_jun_2024_billion} billion opening balance in the FY 2024/25 report (derived).`} />
          <Tile label="Revenue arrears, 30 June 2025" value={`KSh ${budget.revenue_arrears_30_jun_2025_million}M`} note="Revenue owed to the county by payers but not yet collected." />
          <Tile label="Stalled projects" value={`${budget.stalled_projects.count}`} unit={`worth KSh ${budget.stalled_projects.estimated_value_million}M`} tone="warn" note={`KSh ${budget.stalled_projects.paid_million}M had already been paid on them.`} />
        </div>
        <p className="rule-note">
          Source: <a href={budget.source_url}>{budget.source}</a>. {budget.pending_bills.note} {budget.stalled_projects.note}
        </p>
      </section>

      <section className="card" id="audit" aria-labelledby="aud">
        <h2 id="aud">What did the Auditor-General say about Siaya&apos;s accounts?</h2>
        <p className="lead">The Auditor-General checks whether a county&apos;s accounts are reliable. The County Executive and the County Assembly are audited separately. Below is the latest opinion read for each, as printed; every year and every finding is on <Link href="/counties/siaya/audits/">audit findings</Link>.</p>
        <div className="tiles" id="audit-latest">
          {AUD.entities.map((e) => (
            <Tile key={e.entity} label={`${e.label}, FY ${e.fy}`} value={<Reviewed b={e.review}>{() => e.opinion}</Reviewed>} tone={/^Unqualified/.test(e.opinion) ? 'good' : 'warn'} note={<>As printed in the <a href={e.url}>{e.title}</a>, PDF p. {e.page}{e.report_date ? `, dated ${shortDate(e.report_date)}` : ''}. {/^Qualified/.test(e.opinion) ? 'A qualified opinion means the accounts are fair except for specific matters the auditor describes.' : ''}</>} />
          ))}
        </div>
        <p className="rule-note" id="audit-history-note">Our ten-year audit series for the County Executive ends at FY {AUD.history.fy} ({AUD.history.opinion}); the FY {AUD_LATEST_FY} reports above are newer than that series. Findings, the reasons for each opinion and the years with no report are on <Link href="/counties/siaya/audits/">audit findings</Link>.</p>
      </section>

      <section className="card" id="tenyears" aria-labelledby="tenh">
        <h2 id="tenh">Ten years at a glance</h2>
        <p className="lead">The approved budget and spending for every year since FY 2013/14 are charted once, on <Link href="/counties/siaya/insights/#spending">Siaya insights</Link>, with real-terms values and the arithmetic; the share of budget spent and pending bills for every year are on <Link href="/counties/siaya/analysis/">Siaya analysis</Link>.</p>
      </section>

      <section className="card" id="in-year" aria-labelledby="inyh">
        <p className="eyebrow">FY {IY.fy} · <span className="tag warn">{IY.comparability}</span></p>
        <h2 id="inyh">FY {IY.fy} so far</h2>
        <p className="lead">Running totals from 1 July 2025, from the Controller of Budget&apos;s quarterly and half-year reports. A part of the year is not a full year: do not compare these with the ten-year figures above.</p>
        <TableWrap label={`Siaya County FY ${IY.fy} in-year figures`}>
          <table className="data">
            <caption className="sr-only">Siaya County FY {IY.fy} in-year figures by reporting period, with the two reports side by side</caption>
            <thead>
              <tr><th scope="col">Measure</th>{IY.periods.map((p) => <th scope="col" key={p.id}>{p.label}<small style={{ display: 'block', fontWeight: 500 }}>{p.period}</small></th>)}</tr>
            </thead>
            <tbody>
              {IY_MEASURES.map((m) => (
                <tr key={m.measure}>
                  <th scope="row">{m.label}{IY_CONFLICT[m.measure] && <> <a className="tag warn" href={`/data/#${IY_CONFLICT[m.measure]}`}>Reports differ</a></>}</th>
                  {IY.periods.map((p) => {
                    const f = p.figures.find((x) => x.measure === m.measure);
                    return <td key={p.id} className="mono">{f ? iyValue(f) : '—'}{f && f.as_of ? <small style={{ display: 'block' }}>at {shortDate(f.as_of)}</small> : null}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <div className="src">
          Sources: {IY.periods.map((p, i) => <span key={p.id}>{i ? '; ' : ''}<a href={p.report.url}>{p.report.title}</a>, section {p.report.section}, confidence {p.confidence} of 5</span>)}. Page numbers for each figure are in the <Link href="/data/">data files</Link>. — means the report gives no figure.
          <br />
          Notes: {IY.note} The two reports disagree on the Assembly&apos;s opening unpaid bills, and their revenue-arrears totals cover different things; both values are shown and explained in the <Link href="/data/#conflicts">conflict register</Link>.
        </div>
      </section>

      <section className="card" id="learn" aria-labelledby="learnh">
        <h2 id="learnh">What do these budget terms mean?</h2>
        <p className="lead">Own-source revenue, the share of budget spent (absorption rate), pending bills and audit opinion are explained in plain English on <Link href="/learn/">Learn</Link>, including <Link href="/learn/#own-source-revenue">why own-source revenue totals differ</Link> between the Controller of Budget, the county and the Auditor-General.</p>
      </section>

      <section className="card" aria-labelledby="where">
        <h2 id="where">Sub-counties</h2>
        <p className="lead">This page shows the latest year. The Siaya pages listed at the top go back ten years; each sub-county has its own section on the <Link href="/counties/siaya/wards/#subcounties">wards page</Link>, and common questions are in the <Link href="/faq/">FAQ</Link>:</p>
        <div className="chips-row" role="group" aria-label="Siaya sub-counties">
          {siaya.sub_counties.map((s) => <Link key={s} href={`/counties/siaya/wards/#${s.toLowerCase().replace(/\s+/g, '-')}`}>{s}</Link>)}
        </div>
      </section>
    </main>
  );
}
