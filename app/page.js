import siaya from '../data/siaya.json';

const PLOT = { x0: 70, x1: 620, y0: 200, h: 180, max: 1000 };
const yFor = (v) => PLOT.y0 - (v / PLOT.max) * PLOT.h;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export default function Home() {
  const osr = siaya.own_source_revenue;
  const [primary, county] = osr.observations;
  const ratio = (county.value / primary.value).toFixed(1);
  const ticks = [0, 250, 500, 750, 1000];

  return (
    <main>
      <div className="hero">
        <div>
          <div className="eyebrow">Siaya County · Own-source revenue · FY {osr.fiscal_year}</div>
          <h1>Two reported numbers for Siaya&apos;s own revenue differ by more than two to one. Here is why that matters.</h1>
          <p className="lede">The Controller of Budget and the county give different totals for the same year. Takwimu shows both, names the source of each, and explains what could cause the gap.</p>
        </div>
        <div className="keyfacts mono" aria-label="Key facts">
          <div><span>Controller of Budget</span><span>KSh {fmt(primary.value)}M</span></div>
          <div><span>County statement</span><span>KSh {fmt(county.value)}M</span></div>
          <div><span>Ratio</span><span>{ratio}×</span></div>
          <div><span>County figure</span><span className="tag warn">Unverified</span></div>
        </div>
      </div>

      <section id="siaya">
        <div className="head">
          <div className="eyebrow">Exhibit 1</div>
          <h2>The headline figure comes from the primary official report. The county&apos;s figure is shown beside it.</h2>
        </div>
        <div className="exhibit">
          <div className="cap">
            <strong>Siaya own-source revenue, FY {osr.fiscal_year}, {osr.unit}</strong>
            <span className="tag warn">Sources disagree</span>
          </div>
          <svg viewBox="0 0 640 250" role="img" aria-label={`Bar chart: Controller of Budget ${primary.value} million shillings, county statement ${county.value} million shillings`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PLOT.x0} x2={PLOT.x1} y1={yFor(t)} y2={yFor(t)} stroke="var(--rule)" />
                <text x="62" y={yFor(t) + 4} textAnchor="end">{t.toLocaleString('en-US')}</text>
              </g>
            ))}
            <rect x="150" y={yFor(primary.value)} width="140" height={PLOT.y0 - yFor(primary.value)} fill="var(--navy)" />
            <rect x="390" y={yFor(county.value)} width="140" height={PLOT.y0 - yFor(county.value)} fill="var(--gold-soft)" stroke="var(--gold)" strokeWidth="2" strokeDasharray="5 4" />
            <text className="lab" x="220" y={yFor(primary.value) - 7} textAnchor="middle">{fmt(primary.value)}</text>
            <text className="lab" x="460" y={yFor(county.value) - 7} textAnchor="middle">{fmt(county.value)}</text>
            <text x="220" y="222" textAnchor="middle">Controller of Budget</text>
            <text x="460" y="222" textAnchor="middle">County statement</text>
            <text x="220" y="238" textAnchor="middle">primary report</text>
            <text x="460" y="238" textAnchor="middle">per press, unverified</text>
          </svg>
          <div className="src">
            Sources: <a href={primary.source_url}>{primary.source}</a>; <a href={county.source_url}>{county.source}</a>. Retrieved {primary.retrieved}. Confidence: {primary.confidence}/5 and {county.confidence}/5. A dashed bar means the figure is unverified until the county&apos;s own document is seen.
          </div>
        </div>
        <div className="takeaway"><b>What to take from this:</b> a gap like this usually means the two figures count different things, such as cash collected against revenue billed, or different reporting dates. Check the definition before the number.</div>
      </section>

      <section id="learn">
        <div className="head">
          <div className="eyebrow">Learn</div>
          <h2>Three ideas that make any county budget readable.</h2>
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
          <h2>Six sub-counties. More trends are added only once their sources are verified.</h2>
        </div>
        <div className="chips" aria-label="Siaya sub-counties">
          {siaya.sub_counties.map((s) => <span key={s}>{s}</span>)}
        </div>
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
