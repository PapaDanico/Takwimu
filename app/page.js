import siaya from '../data/siaya.json';

const X0 = 160;
const WIDTH = 440;
const MAX = 1000;
const BAR_H = 24;
const xFor = (v) => X0 + (v / MAX) * WIDTH;
const fmt = (v) => String(Number(v.toFixed(2)));

// Bar with a 4px rounded data end and a square baseline edge.
const barPath = (x, y, w, h) =>
  `M${x},${y} h${w - 4} a4,4 0 0 1 4,4 v${h - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z`;

export default function Home() {
  const osr = siaya.own_source_revenue;
  const [primary, county] = osr.observations;
  const ratio = (county.value / primary.value).toFixed(1);
  const ticks = [0, 250, 500, 750, 1000];
  const rows = [
    { o: primary, label: 'Controller of Budget', sub: 'FY 2024/25 report', y: 28, verified: true },
    { o: county, label: 'County statement', sub: 'per press, unverified', y: 84, verified: false },
  ];

  return (
    <main id="main">
      <div className="hero">
        <div>
          <div className="eyebrow">Siaya County · Own-source revenue · FY {osr.fiscal_year}</div>
          <h1>Reported figures for Siaya&apos;s own revenue differ by more than two to one. Here is why that matters.</h1>
          <p className="lede">The Controller of Budget and the county give different totals for the same year. Takwimu shows each, names its source, and explains what could cause the gap.</p>
        </div>
        <div className="keyfacts mono" role="group" aria-label="Key facts">
          <div><span>Controller of Budget</span><span>KSh {fmt(primary.value)}M</span></div>
          <div><span>County statement</span><span>KSh {fmt(county.value)}M</span></div>
          <div><span>Share of annual target</span><span>{osr.share_of_annual_target_pct}%</span></div>
          <div><span>Ratio, county to CoB</span><span>{ratio}×</span></div>
          <div><span>County figure</span><span className="tag warn">Unverified</span></div>
        </div>
      </div>

      <section id="siaya">
        <div className="head">
          <div className="eyebrow">Exhibit 1</div>
          <h2 className="question">Why does Siaya have two numbers for its own revenue?</h2>
        </div>
        <figure className="exhibit" style={{ margin: 0 }}>
          <div className="cap">
            <strong>Siaya own-source revenue, FY {osr.fiscal_year}</strong>
            <span className="tag warn">Sources disagree</span>
          </div>
          <p className="units">Nominal KSh million. Own-source revenue is money the county raises itself.</p>
          <svg viewBox="0 0 640 160" role="img" aria-label={`Bar chart: Controller of Budget reports ${primary.value} million shillings. County statement says ${county.value} million shillings, unverified.`}>
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--surface)" />
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
                  <text className="lab" x="0" y={y + 12} style={{ fontFamily: 'var(--body)', fontSize: 13 }}>{label}</text>
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
                      <td className="mono">{o.retrieved}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><a href={osr.target.source_url}>Own-source revenue in budget financing (Controller of Budget)</a>: {osr.target.description}</td>
                    <td className="mono">{osr.target.value.toLocaleString('en-US')}</td>
                    <td>{osr.target.status}</td>
                    <td className="mono">{osr.target.confidence}/5</td>
                    <td className="mono">{osr.target.retrieved}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Sources: <a href={primary.source_url}>{primary.source}</a>; <a href={county.source_url}>{county.source}</a>. <span className="updated">Retrieved {primary.retrieved}.</span>
            <br />
            Notes: the solid bar is the figure the Controller of Budget states for FY 2024/25 (KSh {fmt(primary.value)} million, including KSh 199 million from health facilities). The report calls this 2 per cent more than KSh {fmt(osr.previous_year.value)} million in FY 2023/24, but the previous year&apos;s report gave KSh 610.74 million for that year (see Exhibit 2). It is {osr.share_of_annual_target_pct} per cent of the annual target, which implies a target of about KSh 929 million. The budget financing counted about KSh {osr.target.value.toLocaleString('en-US')} million of own-source revenue, and the report does not explain the difference. The hatched bar is unverified, and it is close to the implied target, which may explain it but is not established. The figures are not averaged.
          </div>
        </figure>
        <div className="takeaway"><b>What to take from this:</b> a gap like this usually means the two figures count different things, such as cash collected against revenue billed, or different reporting dates. Check the definition before the number.</div>
        <ol className="steps" style={{ marginTop: 20 }} aria-label="How to read this chart">
          <li>Find the units under the title. Here they are millions of shillings.</li>
          <li>Compare the two bars. The solid bar comes from the Controller of Budget&apos;s own report.</li>
          <li>Open the source line to see where each figure comes from and when we retrieved it.</li>
        </ol>
      </section>

      <section id="trend">
        <div className="head">
          <div className="eyebrow">Exhibit 2</div>
          <h2 className="question">Is Siaya collecting more of its own revenue over time?</h2>
        </div>
        <figure className="exhibit" style={{ margin: 0 }}>
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
                          <circle cx={p.x} cy={185 - p.alternate.value * 0.25} r="4" fill="var(--surface)" stroke="var(--chart)" strokeWidth="2" />
                          <text x={p.x + 12} y={185 - p.alternate.value * 0.25 + 4}>{fmt(p.alternate.value)} in next report</text>
                        </g>
                      )}
                      <circle cx={p.x} cy={p.y} r="4" fill="var(--chart)" stroke="var(--surface)" strokeWidth="2" />
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
                      <td>{p.note}{p.alternate ? ` ${p.alternate.note}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Sources: Controller of Budget county reports for <a href={osr.trend.points[1].source_url}>FY 2022/23</a> and <a href={osr.trend.points[3].source_url}>FY 2024/25</a>. <span className="updated">Retrieved {primary.retrieved}.</span>
            <br />
            Notes: {osr.trend.caveat}
          </div>
        </figure>
        <div className="takeaway"><b>What to take from this:</b> two Controller of Budget reports give different figures for the same year, FY 2023/24 (KSh 610.74 million and KSh 427.95 million). Whether Siaya&apos;s own revenue fell sharply in FY 2024/25 or rose 2 per cent depends on which figure is right. In the reports&apos; own breakdowns, health facility financing fell from KSh 388.53 million to KSh 199 million, while ordinary own-source revenue rose from KSh 222.10 million to KSh 236 million. Check which figures a report is comparing before drawing a trend.</div>
      </section>

      <section id="spending">
        <div className="head">
          <div className="eyebrow">Exhibit 3</div>
          <h2 className="question">How much of its budget did Siaya actually spend?</h2>
        </div>
        <figure className="exhibit" style={{ margin: 0 }}>
          <div className="cap">
            <strong>Siaya budget and spending, FY {siaya.budget.fiscal_year}</strong>
            <span className="tag ok">Primary document</span>
          </div>
          <p className="units">KSh billion. The pale bar is the approved budget. The solid bar is what was spent.</p>
          <svg viewBox="0 0 640 150" role="img" aria-label={siaya.budget.categories.map((c) => `${c.label}: spent ${c.spent} of ${c.budget} billion shillings, ${c.absorption_pct} per cent`).join('. ')}>
            {siaya.budget.categories.map((c, i) => {
              const scale = WIDTH / 6.02;
              const y = 20 + i * 60;
              const tw = c.budget * scale;
              const sw = c.spent * scale;
              return (
                <g key={c.label}>
                  <text className="lab" x="0" y={y + 12} style={{ fontFamily: 'var(--body)', fontSize: 13 }}>{c.label}</text>
                  <text x="0" y={y + 28}>{c.spent} of {c.budget}</text>
                  <path d={barPath(X0, y, tw, BAR_H)} fill="var(--rule)" />
                  <path d={barPath(X0, y, sw, BAR_H)} fill="var(--chart)" />
                  <text x={X0 + 10} y={y + 16} style={{ fill: 'var(--on-chart)', fontWeight: 600 }}>{c.absorption_pct}% spent</text>
                </g>
              );
            })}
          </svg>
          <details className="tableview">
            <summary>View as table</summary>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>Item</th><th>Budget</th><th>Spent</th><th>Share spent</th></tr></thead>
                <tbody>
                  {siaya.budget.categories.map((c) => (
                    <tr key={c.label}><td>{c.label}</td><td className="mono">{c.budget}</td><td className="mono">{c.spent}</td><td className="mono">{c.absorption_pct}%</td></tr>
                  ))}
                  <tr><td>Total</td><td className="mono">{siaya.budget.approved_total}</td><td className="mono">{siaya.budget.total_spent}</td><td className="mono">{Math.round((siaya.budget.total_spent / siaya.budget.approved_total) * 100)}%</td></tr>
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Source: <a href={siaya.budget.source_url}>{siaya.budget.source}</a>. <span className="updated">Retrieved {siaya.budget.retrieved}. Confidence {siaya.budget.confidence}/5.</span>
            <br />
            Notes: {siaya.budget.note} At 30 June 2024 the county reported KSh {siaya.budget.pending_bills.opening_30_jun_2024_billion} billion in pending bills and settled KSh {siaya.budget.pending_bills.settled_in_year_million} million of them during the year. Revenue arrears were KSh {siaya.budget.revenue_arrears_30_jun_2025_million} million at 30 June 2025. The county reported {siaya.budget.stalled_projects.count} stalled development projects, estimated at KSh {siaya.budget.stalled_projects.estimated_value_million} million, of which KSh {siaya.budget.stalled_projects.paid_million} million had been paid.
          </div>
        </figure>
        <div className="takeaway"><b>What to take from this:</b> development spending pays for projects such as roads and facilities. Recurrent spending pays for salaries and running costs. Siaya used a smaller share of its project budget (57 per cent) than of its recurrent budget (83 per cent).</div>
      </section>

      <section id="audit">
        <div className="head">
          <div className="eyebrow">Exhibit 4</div>
          <h2 className="question">What did the Auditor-General say about Siaya&apos;s accounts?</h2>
        </div>
        <div className="exhibit">
          <div className="cap">
            <strong>{siaya.audit.entity}, FY {siaya.audit.fiscal_year}</strong>
            <span className="tag warn">{siaya.audit.opinion} opinion</span>
          </div>
          <p className="units">A qualified opinion means the accounts are fair except for specific matters the auditor describes.</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>Item</th><th>KSh</th><th>What the report says</th></tr></thead>
              <tbody>
                {siaya.audit.findings.map((f) => (
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
            Source: <a href={siaya.audit.source_url}>{siaya.audit.source}</a>, Office of the Auditor-General. Retrieved {siaya.audit.retrieved}. Confidence {siaya.audit.confidence}/5 (primary document). This is the most recent audit report read so far, not the latest published.
          </div>
        </div>
      </section>

      <section id="learn">
        <div className="head">
          <div className="eyebrow">Learn</div>
          <h2 className="question">What do these budget terms mean?</h2>
        </div>
        <div className="cols">
          <div className="card"><span className="tag ok">Explainer</span><h3>Own-source revenue</h3><p>Money a county raises itself from fees, levies and licences, separate from what it receives from the national government.</p></div>
          <div className="card"><span className="tag ok">Explainer</span><h3>Pending bills</h3><p>Money a county owes suppliers for work already done. Growing pending bills can signal spending beyond what is collected.</p></div>
          <div className="card"><span className="tag ok">Explainer</span><h3>Audit opinion</h3><p>The Auditor-General&apos;s verdict on whether accounts are reliable. Read the basis for the opinion, not only its label.</p></div>
        </div>
      </section>

      <section>
        <div className="head">
          <div className="eyebrow">Siaya County</div>
          <h2 className="question">Where else can I look in Siaya?</h2>
        </div>
        <div className="chips" role="group" aria-label="Siaya sub-counties">
          {siaya.sub_counties.map((s) => <span key={s}>{s}</span>)}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>Sub-county pages and more trends are added only once their sources are verified.</p>
        <div className="prov">
          <div><b>Source</b>Named on every figure</div>
          <div><b>Period and date</b>Fiscal year, retrieval date</div>
          <div><b>Confidence</b>1 to 5, with the reason</div>
          <div><b>Disputes</b>Shown side by side</div>
        </div>
      </section>
    </main>
  );
}
