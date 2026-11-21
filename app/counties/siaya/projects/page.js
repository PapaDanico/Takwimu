import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import ProjectExplorer from '../../../../components/ProjectExplorer';
import { Provisional } from '../../../../components/ObsTable';
import { projectRows, STATES, SECTOR, pub } from '../../../../lib/projects';
import geo from '../../../../data/siaya-geography.json';

export const metadata = {
  title: 'Development project register',
  description: 'Siaya County development projects named in county, Controller of Budget and Auditor-General reports: status from eight states with its source, what the county reported beside what the auditor found, and linked audit findings.',
};

const rows = projectRows();
const verified = rows.filter((p) => p.status === 'completed-independently-verified');
const wards = [...geo.wards].sort((a, b) => a.name.localeCompare(b.name)).map((w) => ({ id: w.id, name: w.name, constituency: geo.constituencies.find((c) => c.id === w.parent).name }));
const EXAMPLES = ['SIA-P-018', 'SIA-P-036'].map((id) => rows.find((p) => p.id === id)).filter(Boolean);

export default function SiayaProjects() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Projects" title="Development project register"
        sub={`${rows.length} county development projects named in the county’s plans and budget reports, the Controller of Budget’s reports and the Auditor-General’s reports, with what each source says about progress. Where the county’s report and the auditor’s inspection differ, both are shown.`}
        path="/counties/siaya/projects/" shareText="Siaya development project register" />

      <section className="card gold" aria-labelledby="pr-read">
        <h2 id="pr-read">How to read this page</h2>
        <Provisional dataset="siaya-projects">The register was compiled by Takwimu from the reports (some pages read by OCR) and has not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li id="verified-rule"><b>Reported is not verified.</b> &ldquo;Completed (reported)&rdquo; means the county reported completion. Only a project whose completion the Auditor-General confirmed on inspection is shown as independently verified: in this register that is {verified.map((p) => <span key={p.id}><code>{p.id}</code> ({p.name})</span>)} alone. Takwimu has made no site visits.</li>
          <li><b>Not exhaustive.</b> The reports list mainly the highest-spending and stalled projects, so many projects are not here.</li>
          <li><b>Audit findings are findings, not convictions.</b> Linked finding ids open the finding on <Link href="/counties/siaya/audits/">Audit findings</Link>. No individual is named, and contractor company names are withheld from this site pending editorial review.</li>
          <li>Amounts are as printed, in the document&rsquo;s own year; they are never added together.</li>
        </ul>
        <h3>The eight status states used</h3>
        <dl className="legend-list" id="status-legend">
          {STATES.map((s) => <div key={s.state}><dt><span className={`tag ${s.state === 'completed-independently-verified' ? 'good' : 'warn'}`}>{s.state}</span> ({s.count})</dt><dd>{s.rule}</dd></div>)}
        </dl>
      </section>

      <section className="card" aria-labelledby="pr-ex">
        <h2 id="pr-ex">Where the county&rsquo;s report and the audit differ: two examples</h2>
        {EXAMPLES.map((p) => (
          <div key={p.id} className="conflict" id={`ex-${p.id}`}>
            <h3>{p.name} (<a href={`#${p.id}`}>{p.id}</a>)</h3>
            <ul className="how">{p.conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        ))}
      </section>

      <ProjectExplorer projects={rows} states={STATES} sectors={SECTOR} wards={wards} />

      <section className="card" aria-labelledby="pr-gaps">
        <h2 id="pr-gaps">What is not in the register</h2>
        <ul className="how">{pub.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        <p className="src">Documents: {pub.documents.map((d, i) => <span key={d.doc_id}>{i ? '; ' : ''}<a href={d.url} rel="noopener">{d.title}</a></span>)}. Every project is in the <Link href="/datasets/?q=siaya-projects">dataset catalogue</Link> and in <a href="/data/siaya-projects.json">siaya-projects.json</a> (contractor fields withheld).</p>
      </section>
    </main>
  );
}
