import siaya from '../data/siaya.json';

const X0 = 160;
const WIDTH = 440;
const MAX = 1000;
const BAR_H = 24;
const xFor = (v) => X0 + (v / MAX) * WIDTH;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Bar with a 4px rounded data end and a square baseline edge.
const barPath = (x, y, w, h) =>
  `M${x},${y} h${w - 4} a4,4 0 0 1 4,4 v${h - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z`;

export default function Home() {
  const osr = siaya.own_source_revenue;
  const [primary, county] = osr.observations;
  const ratio = (county.value / primary.value).toFixed(1);
  const ticks = [0, 250, 500, 750, 1000];
  const rows = [
    { o: primary, label: 'Controller of Budget', sub: 'primary report', y: 28, verified: true },
    { o: county, label: 'County statement', sub: 'per press, unverified', y: 84, verified: false },
  ];

  return (
    <main id="main">
      <div className="hero">
        <div>
          <div className="eyebrow">Siaya County · Own-source revenue · FY {osr.fiscal_year}</div>
          <h1>Two reported numbers for Siaya&apos;s own revenue differ by more than two to one. Here is why that matters.</h1>
          <p className="lede">The Controller of Budget and the county give different totals for the same year. Takwimu shows both, names the source of each, and explains what could cause the gap.</p>
        </div>
        <div className="keyfacts mono" role="group" aria-label="Key facts">
          <div><span>Controller of Budget</span><span>KSh {fmt(primary.value)}M</span></div>
          <div><span>County statement</span><span>KSh {fmt(county.value)}M</span></div>
          <div><span>Ratio</span><span>{ratio}×</span></div>
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
                </tbody>
              </table>
            </div>
          </details>
          <div className="src">
            Source: <a href={primary.source_url}>{primary.source}</a>; <a href={county.source_url}>{county.source}</a>. <span className="updated">Retrieved {primary.retrieved}.</span>
            <br />
            Note: the hatched bar is unverified until the county&apos;s own document is seen. The two figures may count different things, so they are not averaged.
          </div>
        </figure>
        <div className="takeaway"><b>What to take from this:</b> a gap like this usually means the two figures count different things, such as cash collected against revenue billed, or different reporting dates. Check the definition before the number.</div>
        <ol className="steps" style={{ marginTop: 20 }} aria-label="How to read this chart">
          <li>Find the units under the title. Here they are millions of shillings.</li>
          <li>Compare the two bars. The solid bar is the primary official report.</li>
          <li>Open the source line to see where each figure comes from and when we retrieved it.</li>
        </ol>
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
