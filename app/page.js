import Link from 'next/link';
import siaya from '../data/siaya.json';
import hist from '../data/history.json';
import { ColumnChart } from '../components/Charts';
import { fmt, shortDate } from '../lib/format';

const X0 = 160;
const WIDTH = 440;
const MAX = 1000;
const BAR_H = 24;
const xFor = (v) => X0 + (v / MAX) * WIDTH;

// Bar with a 4px rounded data end and a square baseline edge.
const barPath = (x, y, w, h) =>
  `M${x},${y} h${w - 4} a4,4 0 0 1 4,4 v${h - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z`;

function Tile({ label, value, unit, note, tone, dashed, tag }) {
  return (
    <div className={`tile${tone ? ` ${tone}` : ''}${dashed ? ' dashed' : ''}`}>
      <p className="k">{label} {tag && <span className="tag warn">{tag}</span>}</p>
      <p className="v">{value}{unit && <small>{unit}</small>}</p>
      {note && <p className="m">{note}</p>}
    </div>
  );
}

const TEN_BY = Object.fromEntries(hist.years.map((y) => [y.fy, y]));
const TEN_LABELS = ['13/14', '14/15', '15/16', '16/17', '17/18', '18/19', '19/20', '20/21', '21/22', '22/23', '23/24', '24/25'];

export default function Home() {
  const osr = siaya.own_source_revenue;
  const [primary, county] = osr.observations;
  const budget = siaya.budget;
  const audit = siaya.audit;
  const [dev, rec] = budget.categories;
  const ticks = [0, 250, 500, 750, 1000];
  const share = osr.share_of_annual_target_pct;
  const ofBudgetPct = (primary.value / (budget.approved_total * 1000)) * 100;
  const spentPct = Math.round((budget.total_spent / budget.approved_total) * 100);
  const settledPct = Math.round((budget.pending_bills.settled_in_year_million / (budget.pending_bills.opening_30_jun_2024_billion * 1000)) * 100);
  const asOf = shortDate(primary.retrieved);
  const rows = [
    { o: primary, label: 'Controller of Budget', sub: 'FY 2024/25 report', y: 28, verified: true },
    { o: county, label: 'County statement', sub: 'per press, unverified', y: 84, verified: false },
  ];
  const auditAmber = audit.opinion !== 'Unqualified';

  return (
    <main id="main" className="wrap page">
      <header>
        <p className="eyebrow">Siaya County · FY {osr.fiscal_year}</p>
        <h1>Siaya fiscal context</h1>
        <p className="page-sub">
          Revenue, spending, unpaid bills and audit in one view, with every figure traced to the
          document it came from.
        </p>
        <p className="asof"><span className="tag good">Checked {asOf}</span> against the Controller of Budget and Auditor-General reports</p>
      </header>

      <section className="card gold" aria-labelledby="position">
        <h2 id="position">County position</h2>
        <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--ink-soft)', maxWidth: '46rem' }}>
          In FY {osr.fiscal_year} Siaya collected KSh {fmt(primary.value)} million of its own revenue,
          {' '}{share} per cent of its annual target, and spent {dev.absorption_pct} per cent of its development budget.
          The latest audit opinion read is {audit.opinion.toLowerCase()} (FY {audit.fiscal_year}).
        </p>
        <div className="pills">
          <span className={`pill ${share < 50 ? 'warn' : ''}`}>Own revenue {share}% of target</span>
          <span className={`pill ${dev.absorption_pct < 60 ? 'warn' : ''}`}>Development spending {dev.absorption_pct}% of budget</span>
          <span className="pill">Recurrent spending {rec.absorption_pct}% of budget</span>
          <span className={`pill ${auditAmber ? 'warn' : 'good'}`}>Audit FY {audit.fiscal_year}: {audit.opinion}</span>
          <span className="pill warn">Sources disagree on revenue</span>
          <span className="pill">Pending bills KSh {budget.pending_bills.opening_30_jun_2024_billion}B at 30 Jun 2024</span>
        </div>
        <p className="rule-note">
          Amber marks a figure below 50 per cent of its target, a development budget less than 60 per
          cent spent, an audit opinion other than unqualified, or sources that disagree. These are
          simple rules, not verdicts.
        </p>
      </section>

      <section className="card" id="siaya" aria-labelledby="rev">
        <h2 id="rev">Own-source revenue</h2>
        <p className="lead">
          Money the county raises itself from fees, levies and payments at its health facilities,
          as opposed to money sent by the national government.
        </p>
        <div className="tiles">
          <Tile label="Collected" value={fmt(primary.value)} unit="KSh million" note="Stated by the Controller of Budget, including KSh 199 million from health facilities." />
          <Tile label="Share of annual target" value={`${share}%`} tone="warn" note="The report states this. It implies a target of about KSh 929 million." />
          <Tile label="County statement" value={fmt(county.value)} unit="KSh million" dashed tag="Unverified" note="Reported in the press. Not yet seen in a county document." />
          <Tile label="Share of approved budget" value={`${ofBudgetPct.toFixed(1)}%`} note={`Derived: ${fmt(primary.value)} million divided by the KSh ${budget.approved_total} billion approved budget.`} />
        </div>

        <figure className="figure" style={{ margin: '20px 0 0' }}>
          <div className="cap">
            <strong>Siaya own-source revenue, FY {osr.fiscal_year}</strong>
            <span className="tag warn">Sources disagree</span>
          </div>
          <p className="units">Nominal KSh million.</p>
          <svg viewBox="0 0 640 160" role="img" aria-label={`Bar chart: Controller of Budget reports ${primary.value} million shillings. County statement says ${county.value} million shillings, unverified.`}>
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--sand-50)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart)" strokeWidth="3" />
              </pattern>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={xFor(t)} x2={xFor(t)} y1="10" y2="124" stroke="var(--rule)" strokeWidth="1" />
                <text x={xFor(t)} y="142" textAnchor="middle">{t.toLocaleString('en-US')}</text>
              </g>
            ))}
            <g className="bars">
              {rows.map(({ o, label, sub, y, verified }) => (
                <g key={label} className="bar" tabIndex="0">
                  <title>{`${label}: KSh ${o.value} million. Confidence ${o.confidence}/5. ${verified ? 'Primary report.' : 'Unverified.'}`}</title>
                  <text className="lab" x="0" y={y + 12} style={{ fontFamily: 'var(--sans)', fontSize: 13 }}>{label}</text>
                  <text x="0" y={y + 28}>{sub}</text>
                  <path d={barPath(X0, y, xFor(o.value) - X0, BAR_H)} fill={verified ? 'var(--chart)' : 'url(#hatch)'} />
                  <text className="lab" x={xFor(o.value) + 8} y={y + 16}>{fmt(o.value)}</text>
                </g>
              ))}
            </g>
          </svg>
          <details className="tableview">
            <summary>View as table</summary>
            <div className="tablewrap">
              <table className="data">
                <thead>
                  <tr><th>Source</th><th>KSh million</th><th>Status</th><th>Confidence</th><th>Retrieved</th></tr>
                </thead>
                <tbody>
                  {osr.observations.map((o) => (
                    <tr key={o.source}>
                      <td><a href={o.source_url}>{o.source}</a></td>
                      <td className="mono">{fmt(o.value)}</td>
                      <td>{o.status}</td>
                      <td className="mono">{o.confidence}/5</td>
                      <td className="mono">{shortDate(o.retrieved)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><a href={osr.target.source_url}>Own-source revenue in budget financing (Controller of Budget)</a>: {osr.target.description}</td>
                    <td className="mono">{osr.target.value.toLocaleString('en-US')}</td>
                    <td>{osr.target.status}</td>
                    <td className="mono">{osr.target.confidence}/5</td>
                    <td className="mono">{shortDate(osr.target.retrieved)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Sources: <a href={primary.source_url}>{primary.source}</a>; <a href={county.source_url}>{county.source}</a>. Retrieved {asOf}.
            <br />
            Notes: the solid bar is the figure the Controller of Budget states for FY 2024/25 (KSh {fmt(primary.value)} million, including KSh 199 million from health facilities).
            The report calls this 2 per cent more than KSh {fmt(osr.previous_year.value)} million in FY 2023/24, but the previous year&apos;s report gave KSh 610.74 million for that year (see the trend below).
            It is {share} per cent of the annual target, which implies a target of about KSh 929 million. The budget financing counted about KSh {osr.target.value.toLocaleString('en-US')} million of own-source revenue, and the report does not explain the difference.
            The hatched bar is unverified, and it is close to the implied target, which may explain it but is not established. The figures are not averaged.
          </div>
        </figure>
        <div className="takeaway"><b>What this means:</b> a gap like this usually means the two figures count different things, such as cash collected against revenue billed, or different reporting dates. Check the definition before the number.</div>
        <ol className="steps" aria-label="How to read this chart">
          <li>Find the units under the title. Here they are millions of shillings.</li>
          <li>Compare the two bars. The solid bar comes from the Controller of Budget&apos;s own report.</li>
          <li>Open the source line to see where each figure comes from and when we retrieved it.</li>
        </ol>
      </section>

      <section className="card" id="trend" aria-labelledby="trendh">
        <h2 id="trendh">Is Siaya collecting more of its own revenue over time?</h2>
        <p className="lead">Four fiscal years of own-source revenue, each taken from a Controller of Budget report.</p>
        <figure className="figure" style={{ margin: '16px 0 0' }}>
          <div className="cap">
            <strong>Siaya own-source revenue, FY 2021/22 to FY 2024/25</strong>
            <span className="tag warn">Reports disagree</span>
          </div>
          <p className="units">Nominal KSh million, not adjusted for inflation.</p>
          <svg viewBox="0 0 640 230" role="img" aria-label={`Line chart of Siaya own-source revenue in million shillings: ${osr.trend.points.map((p) => `${p.fiscal_year} ${p.value}${p.alternate ? ` (a later report gives ${p.alternate.value})` : ''}`).join(', ')}`}>
            {[0, 200, 400, 600].map((t) => (
              <g key={t}>
                <line x1="80" x2="600" y1={185 - t * 0.25} y2={185 - t * 0.25} stroke="var(--rule)" strokeWidth="1" />
                <text x="72" y={189 - t * 0.25} textAnchor="end">{t}</text>
              </g>
            ))}
            {(() => {
              const pts = osr.trend.points.map((p, i) => ({ ...p, x: 120 + i * 140, y: 185 - p.value * 0.25 }));
              const max = Math.max(...pts.map((p) => p.value));
              const last = pts.length - 1;
              return (
                <g>
                  <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--chart)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((p, i) => (
                    <g key={p.fiscal_year} tabIndex="0" className="bar">
                      <title>{`FY ${p.fiscal_year}: KSh ${p.value} million. Confidence ${p.confidence}/5.`}</title>
                      <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                      {p.alternate && (
                        <g>
                          <line x1={p.x} x2={p.x} y1={p.y} y2={185 - p.alternate.value * 0.25} stroke="var(--chart)" strokeWidth="1" strokeDasharray="3 3" />
                          <circle cx={p.x} cy={185 - p.alternate.value * 0.25} r="4" fill="var(--sand-50)" stroke="var(--chart)" strokeWidth="2" />
                          <text x={p.x + 12} y={185 - p.alternate.value * 0.25 + 4}>{fmt(p.alternate.value)} in next report</text>
                        </g>
                      )}
                      <circle cx={p.x} cy={p.y} r="4" fill="var(--chart)" stroke="var(--sand-50)" strokeWidth="2" />
                      {(p.value === max || i === last) && <text className="lab" x={p.x} y={p.y - 12} textAnchor="middle">{fmt(p.value)}</text>}
                      <text x={p.x} y="212" textAnchor="middle">{p.fiscal_year}</text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
          <details className="tableview">
            <summary>View as table</summary>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>Fiscal year</th><th>KSh million</th><th>Confidence</th><th>What it includes</th></tr></thead>
                <tbody>
                  {osr.trend.points.map((p) => (
                    <tr key={p.fiscal_year}>
                      <td className="mono">{p.fiscal_year}</td>
                      <td className="mono">{fmt(p.value)}{p.alternate ? ` (and ${fmt(p.alternate.value)} in the next report)` : ''}</td>
                      <td className="mono">{p.confidence}/5</td>
                      <td>{p.note}{p.alternate ? ` ${p.alternate.note}` : ''}{p.corroboration ? ` ${p.corroboration}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Sources: Controller of Budget county reports for <a href={osr.trend.points[1].source_url}>FY 2022/23</a> and <a href={osr.trend.points[3].source_url}>FY 2024/25</a>. Retrieved {asOf}.
            <br />
            Notes: {osr.trend.caveat}
          </div>
        </figure>
        <div className="takeaway"><b>What this means:</b> two Controller of Budget reports give different figures for the same year, FY 2023/24 (KSh 610.74 million and KSh 427.95 million). Whether Siaya&apos;s own revenue fell sharply in FY 2024/25 or rose 2 per cent depends on which figure is right. In the reports&apos; own breakdowns, health facility financing fell from KSh 388.53 million to KSh 199 million, while ordinary own-source revenue rose from KSh 222.10 million to KSh 236 million. Check which figures a report is comparing before drawing a trend.</div>
      </section>

      <section className="card" id="spending" aria-labelledby="spend">
        <h2 id="spend">How much of its budget did Siaya actually spend?</h2>
        <p className="lead">Development spending pays for projects such as roads and facilities. Recurrent spending pays for salaries and running costs.</p>
        <div className="tiles">
          <Tile label="Approved budget" value={`KSh ${budget.approved_total}B`} note="What the county assembly approved for FY 2024/25." />
          <Tile label="Total spent" value={`KSh ${budget.total_spent}B`} note={`About ${spentPct} per cent of the approved budget.`} />
          <Tile label="Development spent" value={`${dev.absorption_pct}%`} tone={dev.absorption_pct < 60 ? 'warn' : ''} note={`KSh ${dev.spent}B of ${dev.budget}B. The share of project money actually used.`} />
          <Tile label="Recurrent spent" value={`${rec.absorption_pct}%`} note={`KSh ${rec.spent}B of ${rec.budget}B. Salaries and running costs.`} />
        </div>
        <figure className="figure" style={{ margin: '20px 0 0' }}>
          <div className="cap">
            <strong>Siaya budget and spending, FY {budget.fiscal_year}</strong>
            <span className="tag good">Primary document</span>
          </div>
          <p className="units">KSh billion. The pale bar is the approved budget. The solid bar is what was spent.</p>
          <svg viewBox="0 0 640 150" role="img" aria-label={budget.categories.map((c) => `${c.label}: spent ${c.spent} of ${c.budget} billion shillings, ${c.absorption_pct} per cent`).join('. ')}>
            {budget.categories.map((c, i) => {
              const scale = WIDTH / Math.max(...budget.categories.map((x) => x.budget));
              const y = 20 + i * 60;
              const tw = c.budget * scale;
              const sw = c.spent * scale;
              return (
                <g key={c.label}>
                  <text className="lab" x="0" y={y + 12} style={{ fontFamily: 'var(--sans)', fontSize: 13 }}>{c.label}</text>
                  <text x="0" y={y + 28}>{c.spent} of {c.budget}</text>
                  <path d={barPath(X0, y, tw, BAR_H)} fill="var(--track)" />
                  <path d={barPath(X0, y, sw, BAR_H)} fill="var(--chart)" />
                  <text x={X0 + 10} y={y + 16} style={{ fill: 'var(--on-chart)', fontWeight: 700 }}>{c.absorption_pct}% spent</text>
                </g>
              );
            })}
          </svg>
          <details className="tableview">
            <summary>View as table</summary>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>Item</th><th>Budget</th><th>Spent</th><th>Share spent (as stated)</th></tr></thead>
                <tbody>
                  {budget.categories.map((c) => (
                    <tr key={c.label}><td>{c.label}</td><td className="mono">{c.budget}</td><td className="mono">{c.spent}</td><td className="mono">{c.absorption_pct}%</td></tr>
                  ))}
                  <tr><td>Total</td><td className="mono">{budget.approved_total}</td><td className="mono">{budget.total_spent}</td><td className="mono">{spentPct}%</td></tr>
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Source: <a href={budget.source_url}>{budget.source}</a>. Retrieved {asOf}. Confidence {budget.confidence}/5.
            <br />
            Notes: {budget.note}
          </div>
        </figure>
        <div className="takeaway"><b>What this means:</b> Siaya used a smaller share of its project budget ({dev.absorption_pct} per cent) than of its recurrent budget ({rec.absorption_pct} per cent). Unspent development money means planned roads, clinics and water points were not all delivered in the year.</div>
      </section>

      <section className="card" id="obligations" aria-labelledby="obl">
        <h2 id="obl">Unpaid bills, arrears and stalled projects</h2>
        <p className="lead">What the county owes, what is owed to it, and what has stopped midway.</p>
        <div className="tiles">
          <Tile label="Pending bills at 30 June 2024" value={`KSh ${budget.pending_bills.opening_30_jun_2024_billion}B`} tone="warn" note="Bills the county owed suppliers for work already done." />
          <Tile label="Settled in FY 2024/25" value={`KSh ${fmt(budget.pending_bills.settled_in_year_million)}M`} note={`About ${settledPct} per cent of the opening balance (derived).`} />
          <Tile label="Revenue arrears, 30 June 2025" value={`KSh ${budget.revenue_arrears_30_jun_2025_million}M`} note="Revenue owed to the county by payers but not yet collected." />
          <Tile label="Stalled projects" value={`${budget.stalled_projects.count}`} unit={`worth KSh ${budget.stalled_projects.estimated_value_million}M`} tone="warn" note={`KSh ${budget.stalled_projects.paid_million}M had already been paid on them.`} />
        </div>
        <p className="rule-note">
          Source: <a href={budget.source_url}>{budget.source}</a>. {budget.pending_bills.note} {budget.stalled_projects.note}
        </p>
      </section>

      <section className="card" id="audit" aria-labelledby="aud">
        <h2 id="aud">What did the Auditor-General say about Siaya&apos;s accounts?</h2>
        <p className="lead">The Auditor-General checks whether a county&apos;s accounts are reliable.</p>
        <div className="tiles">
          <Tile label={`${audit.entity}, FY ${audit.fiscal_year}`} value={`${audit.opinion} opinion`} tone={auditAmber ? 'warn' : 'good'} note="A qualified opinion means the accounts are fair except for specific matters the auditor describes." />
        </div>
        <figure className="figure" style={{ margin: '16px 0 0' }}>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>Item</th><th>KSh</th><th>What the report says</th></tr></thead>
              <tbody>
                {audit.findings.map((f) => (
                  <tr key={f.label}>
                    <td>{f.label}</td>
                    <td className="mono">{f.amount_kes.toLocaleString('en-US')}</td>
                    <td>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="src">
            Source: <a href={audit.source_url}>{audit.source}</a>, Office of the Auditor-General. Retrieved {asOf}. Confidence {audit.confidence}/5 (primary document). This is the most recent audit report read so far, not the latest published.
          </div>
        </figure>
      </section>

      <section className="card" id="tenyears" aria-labelledby="tenh">
        <h2 id="tenh">Ten years at a glance</h2>
        <p className="lead">Approved budget and spending by fiscal year, KSh billion. Missing years are left blank. <Link href="/insights/">See the full ten-year analysis</Link> and the <Link href="/analytics/">analytics</Link>.</p>
        <ColumnChart
          labels={TEN_LABELS}
          yFormat="one"
          unit="KSh bn"
          ariaLabel="Approved budget and spending by fiscal year, KSh billion"
          series={[
            { name: 'Approved budget', color: 1, values: TEN_LABELS.map((l) => (TEN_BY['20' + l.slice(0, 2) + '/' + l.slice(3)] || {}).approved ?? null) },
            { name: 'Spent', color: 2, values: TEN_LABELS.map((l) => (TEN_BY['20' + l.slice(0, 2) + '/' + l.slice(3)] || {}).spent ?? null) },
          ]}
        />
      </section>

      <section className="card" id="learn" aria-labelledby="learnh">
        <h2 id="learnh">What do these budget terms mean?</h2>
        <p className="lead">Draft explainers in plain English. They stay marked as drafts until someone with subject knowledge has reviewed them.</p>
        <div className="terms">
          <div className="term"><span className="tag good">Draft explainer</span><h3>Own-source revenue</h3><p>Money a county raises itself from fees, levies and licences, separate from what it receives from the national government.</p></div>
          <div className="term"><span className="tag good">Draft explainer</span><h3>Absorption rate</h3><p>The share of a budget that was actually spent. A low rate on the development budget means less of the planned spending was paid out in the year. It does not by itself show whether the works were or were not delivered: projects can be paid for in a later year, or be delivered by other funding.</p></div>
          <div className="term"><span className="tag good">Draft explainer</span><h3>Pending bills</h3><p>Money a county owes suppliers for work already done. Growing pending bills can signal spending beyond what is collected.</p></div>
          <div className="term"><span className="tag good">Draft explainer</span><h3>Audit opinion</h3><p>The Auditor-General&apos;s verdict on whether accounts are reliable. Read the basis for the opinion, not only its label.</p></div>
        </div>
      </section>

      <section className="card" aria-labelledby="where">
        <h2 id="where">Go deeper</h2>
        <p className="lead">This page shows the latest year. The pages below go back ten years and down to the six sub-counties.</p>
        <ul className="toc">
          <li><Link href="/insights/">Ten-year insights</Link></li>
          <li><Link href="/subcounties/">Six sub-counties</Link></li>
          <li><Link href="/profile/">County profile</Link></li>
          <li><Link href="/learn/">Learn the terms</Link></li>
          <li><Link href="/faq/">FAQ</Link></li>
          <li><Link href="/data/">Download the data</Link></li>
        </ul>
        <div className="chips-row" role="group" aria-label="Siaya sub-counties">
          {siaya.sub_counties.map((s) => <Link key={s} href={`/subcounties/#${s.toLowerCase().replace(/\s+/g, '-')}`}>{s}</Link>)}
        </div>
      </section>
    </main>
  );
}
