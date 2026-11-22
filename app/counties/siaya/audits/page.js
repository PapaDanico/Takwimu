import { Provisional } from '../../../../components/ObsTable';
import PageToc from '../../../../components/PageToc';
import Reviewed from '../../../../components/Reviewed';
import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import AuditExplorer from '../../../../components/AuditExplorer';
import { audits, withdrawnText, ENTITY, CATEGORY, YEARS } from '../../../../lib/audits';

export const metadata = {
  title: 'Audit findings',
  description: 'Auditor-General opinions and findings for the County Executive and the County Assembly of Siaya, FY 2013/14 to FY 2024/25: each opinion as printed, findings by category with report and page, and the matters later reports list as unresolved.',
};

const a = audits();
const years = YEARS.filter((fy) => a.findings.some((f) => f.fy === fy));
const entities = Object.fromEntries(Object.entries(ENTITY).filter(([k]) => a.findings.some((f) => f.entity === k)));
const Cite = ({ c }) => (c.url ? <small className="cite"><a href={c.url} rel="noopener">{c.doc}</a>{c.page ? `, PDF p. ${c.page}` : ''}{c.confidence ? `, confidence ${c.confidence}` : ''}</small> : null);
const Opinion = ({ c }) => (c.review ? <Reviewed b={c.review}>{() => <OpinionText c={c} />}</Reviewed> : <OpinionText c={c} />);
const OpinionText = ({ c }) => {
  if (c.opinion) return <><b>{c.opinion}</b>{c.findings ? ` · ${c.findings} findings recorded` : ''}{c.withdrawn ? ` · ${withdrawnText(c.withdrawn)}` : ''}<br /><Cite c={c} />{c.note ? <><br /><small>{c.note}</small></> : null}</>;
  if (c.url) return <>{c.note || 'No opinion printed'}{c.findings ? ` · ${c.findings} findings recorded` : ''}{c.withdrawn ? ` · ${withdrawnText(c.withdrawn)}` : ''}<br /><Cite c={c} /></>;
  return <span className="muted">No report found{c.reason ? <><br /><small>{c.reason}</small></> : null}</span>;
};
const catRows = (entity) => Object.keys(CATEGORY).filter((k) => a.matrix[entity] && a.matrix[entity][k]);
const entityYears = (entity) => years.filter((fy) => a.findings.some((f) => f.entity === entity && f.fy === fy));

export default function SiayaAudits() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Audit" title="Audit findings"
        sub="What the Auditor-General reported on the accounts of the County Executive and the County Assembly of Siaya: the opinion for each year, the findings by category, and the matters later reports list as still unresolved."
        path="/counties/siaya/audits/" shareText="Siaya: Auditor-General audit findings" />

      <PageToc items={[['aud-op', 'Opinions by year'], ['aud-gaps', 'Years with no report'], ['aud-find', 'Findings'], ['aud-matrix', 'By category and year'], ['aud-carry', 'Carried forward'], ['aud-cav', 'Caveats']]} />
      <section className="card gold" aria-labelledby="aud-read">
        <h2 id="aud-read">How to read this page</h2>
        <Provisional dataset="siaya-audits">Findings were transcribed by Takwimu from the reports and have not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li id="not-convictions"><b>Audit findings are findings, not convictions.</b> Each finding is what the Auditor-General reported at the time, often with the county&rsquo;s management response in the same report. It is not a finding of guilt, and some matters are later explained or resolved. No individual is named on this page; offices and public bodies are named only where a finding concerns them.</li>
          <li id="oag-unavailable"><b>The Auditor-General&rsquo;s website was unavailable on 21 Nov 2026</b> (oagkenya.go.ke returned &ldquo;Under Maintenance&rdquo;). The reports used here are the copies tabled in Parliament and held in the Parliament library; each link opens that copy.</li>
          <li>The County Executive and the County Assembly are audited separately and are shown separately. For FY 2013/14 the first audit covered the whole county government over 16 months.</li>
          <li>Opinions are quoted as printed. Titles of findings are short neutral summaries; amounts are as printed, with the report&rsquo;s own label, and are never added together.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="aud-op">
        <h2 id="aud-op">Audit opinion by year</h2>
        <p className="lead">An unqualified opinion means the accounts give a fair view. A qualified opinion means they do, except for the matters listed. An adverse opinion means they do not. A disclaimer means the auditor could not obtain enough evidence to form an opinion.</p>
        <TableWrap label="Audit opinion by year, County Executive and County Assembly">
          <table className="data" id="opinions">
            <caption className="sr-only">Auditor-General opinion by fiscal year for the County Executive and the County Assembly of Siaya, as printed</caption>
            <thead><tr><th scope="col">Fiscal year</th><th scope="col">County Executive</th><th scope="col">County Assembly</th></tr></thead>
            <tbody>
              {a.whole.map((w) => (
                <tr key={`w${w.fy}`}><th scope="row">FY {w.fy}, whole county government (16 months)</th><td colSpan={2}><Reviewed b={w.review}>{() => <><b>{w.opinion}</b> · {w.findings} findings recorded{w.withdrawn ? ` · ${withdrawnText(w.withdrawn)}` : ''}<br /><Cite c={{ ...w, confidence: null }} /></>}</Reviewed></td></tr>
              ))}
              {a.opinions.map((r) => <tr key={r.fy}><th scope="row">FY {r.fy}</th><td><Opinion c={r.executive} /></td><td><Opinion c={r.assembly} /></td></tr>)}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="aud-gaps">
        <h2 id="aud-gaps">Years with no audit report found</h2>
        <p className="lead">These gaps are listed, not filled. A gap means no report was found in the Parliament library on 21 Nov 2026, not that no audit took place.</p>
        <ul className="how" id="no-report">
          {['county_executive', 'county_assembly'].map((e) => {
            const g = a.missing.filter((x) => x.entity === e);
            return <li key={e}><b>{ENTITY[e]}:</b> {g.length ? g.map((x) => `FY ${x.fy}`).join(', ') : 'none'}.</li>;
          })}
          <li>For FY 2014/15 and FY 2015/16 only the County Executive&rsquo;s opinion is known, from a Senate compilation; no findings are recorded for those years.</li>
        </ul>
      </section>

      <AuditExplorer findings={a.findings} entities={entities} categories={CATEGORY} years={years} />

      <section className="card" aria-labelledby="aud-matrix">
        <h2 id="aud-matrix">Findings by category and year</h2>
        <p className="lead">The number of findings in each category, by year, as recorded from each report. Blank means none recorded in that category.</p>
        {['county_executive', 'county_assembly'].map((e) => (
          <div key={e}>
            <h3 id={`matrix-${e}`}>{ENTITY[e]}</h3>
            <TableWrap label={`${ENTITY[e]}: findings by category and year`}>
              <table className="data">
                <caption className="sr-only">{ENTITY[e]}: number of audit findings by category and fiscal year</caption>
                <thead><tr><th scope="col">Category</th>{entityYears(e).map((fy) => <th key={fy} scope="col">FY {fy}</th>)}</tr></thead>
                <tbody>
                  {catRows(e).map((k) => <tr key={k}><th scope="row">{CATEGORY[k]}</th>{entityYears(e).map((fy) => <td key={fy}>{a.matrix[e][k][fy] || ''}</td>)}</tr>)}
                </tbody>
              </table>
            </TableWrap>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="aud-carry">
        <h2 id="aud-carry">Matters carried forward as unresolved</h2>
        <p className="lead">Only what the reports themselves say is shown here. A matter is linked to an earlier year when the report says it dates from that year, when the next report lists it as unresolved, or when the same named contract or requirement appears again.</p>
        {a.carried.next.map((e) => (
          <div key={e.entity} id={`next-${e.entity}`}>
            <h3>{ENTITY[e.entity]}: listed as unresolved in the following year&rsquo;s report</h3>
            {e.groups.map((g) => (
              <details key={g.fy}>
                <summary>FY {g.fy}: {g.items.length} matters listed as unresolved in the FY {`${+g.fy.slice(0, 4) + 1}/${String(+g.fy.slice(5) + 1).padStart(2, '0')}`} report</summary>
                <ul className="how">{g.items.map((f) => <li key={f.id}><Reviewed b={f.review}>{f.title}</Reviewed> <small className="cite">(<a href={f.url} rel="noopener">FY {f.fy} report</a>, PDF p. {f.page}, paragraph {f.paragraph})</small></li>)}</ul>
              </details>
            ))}
          </div>
        ))}
        <h3 id="carry-prior">Matters the report says date from an earlier year</h3>
        <ul className="how">
          {a.carried.prior.map((f) => <li key={f.id}><b>{ENTITY[f.entity]}, FY {f.fy}:</b> <Reviewed b={f.review}>{f.title}</Reviewed>. <small>The report says: {f.prior}.</small> <small className="cite">(<a href={f.url} rel="noopener">report</a>, PDF p. {f.page})</small></li>)}
        </ul>
        <h3 id="carry-same">The same contract or requirement reported in more than one year</h3>
        <ul className="how">
          {a.carried.same.map((s) => <li key={s.key}><b>{s.items[0].title}</b> ({ENTITY[s.entity]}): reported in FY {s.years.join(', FY ')}. <small>{s.basis}.</small></li>)}
        </ul>
      </section>

      <section className="card" aria-labelledby="aud-cav">
        <h2 id="aud-cav">Caveats</h2>
        <ul className="how">{a.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="src">Sources: {a.documents.length} documents from the Parliament library, each linked beside its opinion and findings. Every finding is in the <Link href="/datasets/?q=siaya-audit-findings">dataset catalogue</Link> and in <a href="/data/siaya-audits.json">siaya-audits.json</a>. See also the <Link href="/counties/siaya/ledger/">fiscal reconciliation</Link> and the <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
