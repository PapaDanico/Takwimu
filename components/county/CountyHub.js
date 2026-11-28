import Link from 'next/link';
import PageHead from '../PageHead';
import TableWrap from '../TableWrap';
import KenyaMap from '../KenyaMap';
import CountyProvisional from './CountyProvisional';
import CountyCite, { ValueFlags } from './Cite';
import { fmtNum } from '../../lib/format';
import * as cp from '../../lib/county-pages';

// Hub of a county from the registry (app/counties/[slug]/): what is published, the latest value of each core fiscal
// measure from every source side by side, the gaps, and what is not yet here. Nothing is estimated or filled.
const HEADLINE = ['budget_total', 'expenditure_total', 'osr_total_actual', 'pending_bills_close'];
const amount = (o) => (o.unit === 'KSh billion' ? `KSh ${fmtNum(o.value, { dp: 2 })} billion` : `KSh ${fmtNum(o.value, { dp: 2 })} million`);

export default function CountyHub({ slug }) {
  const m = cp.meta(slug);
  const l = cp.ledger(slug);
  const a = cp.audits(slug);
  const p = cp.people(slug);
  const counts = cp.counts(slug);
  const census = p.points.find((x) => x.kind === 'census');
  const rows = HEADLINE.filter((k) => l.values[k]).map((k) => {
    const measure = l.measures.find((x) => x.key === k);
    const latest = [...l.values[k]].reverse().find((r) => r.byKind.some((v) => v.length));
    return { measure, fy: latest ? latest.fy : null, values: latest ? latest.byKind.flat() : [] };
  });
  const gaps = l.completeness.reduce((s, r) => s + r.cells.filter((c) => c.missing).length, 0);
  const cells = l.completeness.reduce((s, r) => s + r.cells.length, 0);
  const auditGaps = a.gaps.filter((g) => g.status === 'missing').length;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow={`County ${m.code3}`} title={`${m.name} County`}
        sub={`${m.name} County's budget, spending, own-source revenue, pending bills, audit opinions and population, each figure as its official source printed it, with the page it was read from. Where sources differ, both values are shown side by side.`}
        path={`/counties/${slug}/`} shareText={`${m.name} County on Takwimu Kenya`} />

      <section className="card gold" aria-labelledby="hub-read">
        <h2 id="hub-read">How to read these pages</h2>
        <CountyProvisional counts={counts} datasets={cp.datasets(slug)} />
        <ul className="how">
          <li>Every value carries its source, publication date, period, unit, confidence (1 to 5) and the page it was read from. Until an independent reviewer has checked a value against its page, it is labelled &ldquo;Provisional: awaiting editorial review&rdquo;.</li>
          <li>Where two official documents give different figures for the same thing, both are shown side by side with their definitions; none is averaged, preferred or corrected here.</li>
          <li>A missing value is listed as a gap with its reason, never filled and never shown as zero.</li>
          <li>Values marked &ldquo;Needs page check&rdquo; were read by machine from a scan and have not yet been compared with the page image.</li>
          <li>No individual is named. Audit opinions are findings about financial statements, not verdicts on any person.</li>
        </ul>
      </section>

      <nav aria-label={`${m.name} County pages`}><ul className="toc">{cp.nav(slug).slice(1).map(([h, t]) => <li key={h}><Link href={h}>{t}</Link></li>)}</ul></nav>

      <section className="card" aria-labelledby="hub-latest">
        <h2 id="hub-latest">Latest year held, every source</h2>
        <p className="lead">For each core measure, the latest fiscal year for which any value is held, with every source&rsquo;s value side by side. The full ten-year record is on the <Link href={`/counties/${slug}/ledger/`}>fiscal reconciliation</Link> page.</p>
        <TableWrap label={`${m.name}: latest values of core fiscal measures`}>
          <table className="data" id="hub-latest-table">
            <caption className="sr-only">Latest fiscal year held for each core measure, every source&rsquo;s value as printed</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">Fiscal year</th><th scope="col">Values, as printed, by source</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.measure.key}>
                  <th scope="row">{r.measure.label}</th>
                  <td>{r.fy ? `FY ${r.fy}` : 'No value held'}</td>
                  <td>{r.values.map((o) => (
                    <div key={o.id} className="lv" data-obs={o.review.key}>
                      <b>{amount(o)}</b><ValueFlags label={o.state_label} needsCheck={o.needs_page_check} machine={o.machine} />
                      {o.disputed ? <> <a className="tag warn" href={o.conflictHref}>Disputed: both values shown</a></> : null}
                      <br /><CountyCite title={o.source} url={o.url} published={o.published} period={o.period} unit={o.unit} confidence={o.confidence} pdf={o.pdf_page} printed={o.printed_page} table={o.table} read={o.read} />
                    </div>
                  ))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="hub-what">
        <h2 id="hub-what">What is published</h2>
        <TableWrap label={`${m.name}: what each page holds`}>
          <table className="data" id="hub-what-table">
            <caption className="sr-only">Each {m.name} page, what it holds and its gaps</caption>
            <thead><tr><th scope="col">Page</th><th scope="col">Holds</th><th scope="col">Gaps</th></tr></thead>
            <tbody>
              <tr><th scope="row"><Link href={`/counties/${slug}/ledger/`}>Fiscal reconciliation</Link></th><td>{l.measures.reduce((s, x) => s + x.n, 0)} values for {l.measures.length} measures, FY {l.years[0]} to FY {l.years[l.years.length - 1]}; {l.cases.length} discrepancy cases; {cp.conflicts(slug).length} explained conflict cases</td><td>{gaps} of {cells} measure-year cells hold no value; each gap has its reason</td></tr>
              <tr><th scope="row"><Link href={`/counties/${slug}/audits/`}>Audit opinions</Link></th><td>{a.opinions.length} Auditor-General opinions from {a.documents} documents, {a.opinions.filter((o) => o.tier === 'secondary').length} of them from secondary summaries (labelled)</td><td>{auditGaps} entity-years with no primary report held; audit findings not yet coded</td></tr>
              <tr><th scope="row"><Link href={`/counties/${slug}/people/`}>Population</Link></th><td>{census ? <>2019 census count <b>{fmtNum(census.value)}</b> persons and {p.points.length - 1} KNBS projections, by sub-county for 2019</> : 'No census count held'}</td><td>{p.gaps.length} listed</td></tr>
              <tr><th scope="row"><Link href={`/counties/${slug}/sources/`}>Sources</Link></th><td>{cp.sources(slug).length} documents cited, with links and SHA-256 hashes where held</td><td>Documents not yet obtained are listed on the pages where they would be used</td></tr>
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="hub-not">
        <h2 id="hub-not">Not yet here</h2>
        <p className="lead">Health, education, agriculture and fisheries, water and sanitation, urban services, climate, wards, projects and development-partner programmes are being researched for {m.name}. They will be added one domain at a time, each to the same standard. Until then nothing is estimated in their place.</p>
      </section>

      <section className="card" aria-labelledby="hub-loc">
        <h2 id="hub-loc">Where {m.name} is</h2>
        <KenyaMap focus={slug} ariaLabel={`Map of Kenya with ${m.name} County highlighted`} />
      </section>
    </main>
  );
}
