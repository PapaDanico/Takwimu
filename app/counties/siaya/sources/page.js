import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import SourceLibrary from '../../../../components/SourceLibrary';
import { STATUS, COVERAGE } from '../../../../lib/source-library';
import lib from '../../../../data/source-library.json';
import { shortDate } from '../../../../lib/format';
import { bySource } from '../../../../lib/review-status';

export const metadata = {
  title: 'Siaya Source Library',
  description: 'Every document Takwimu Kenya uses or plans to consult for Siaya County: publisher, period, relevance, licence, whether a copy was retrieved, and a link to the original.',
};

// Each document carries the editorial review state of the values that cite it (lib/review-status.js), with any value
// withdrawn after review listed with its rationale.
const docs = lib.documents.map((d) => { const r = bySource(d.document_id); return r ? { ...d, values_review: r } : d; });
const n = (f) => docs.filter(f).length;
const byStatus = Object.keys(STATUS).map((k) => [k, n((d) => d.retrieval_status === k)]);
const ORIGIN = [
  ['programme register', 'Listed in the Siaya research programme register'],
  ['linked from a programme source', 'Linked directly from one of those pages'],
  ['cited by the site', 'Already cited by figures on this site'],
];

export default function SiayaSources() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Source library" title="Siaya Source Library"
        sub={`${docs.length} documents on Siaya County's public finances, development, health and governance: who published each one, the period it covers, how it relates to Siaya, its licence, and whether we were able to retrieve it. Last checked ${shortDate(lib.meta.updated)}.`}
        path="/counties/siaya/sources/" shareText="Siaya Source Library: the documents behind Takwimu's Siaya figures" />

      <section className="card" aria-labelledby="lib-counts">
        <h2 id="lib-counts">Where the library stands</h2>
        <p className="lead">This is a working inventory, not a claim that every document has been read or checked. We record what happened when we tried each address, so the gaps are visible as well as the holdings.</p>
        <dl className="status-list">
          {byStatus.map(([k, c]) => <div key={k}><dt><span className={`ds-status lib-${k}`}>{STATUS[k].label}</span> <small>{c} of {docs.length}</small></dt><dd>{STATUS[k].text}</dd></div>)}
        </dl>
        <ul className="how">
          {ORIGIN.map(([k, label]) => <li key={k}>{label}: {n((d) => d.origin === k)}.</li>)}
          {Object.entries(COVERAGE).map(([k, label]) => <li key={k}>Coverage, {label}: {n((d) => d.geographic_coverage === k)}.</li>)}
          <li>Figures may be reused with citation: {n((d) => d.data_reuse === 'figures may be reused with citation')}; link and cite only: {n((d) => d.data_reuse === 'link and cite only')}; permission required: {n((d) => d.data_reuse === 'permission required')}. Per-publisher terms are on the <a href="/terms/#copyright">terms page</a>.</li>
          <li>The document itself may be republished under its stated licence: {n((d) => d.document_redistribution)}. For the other {n((d) => !d.document_redistribution)}, we link to the original and cite it rather than share copies.</li>
        </ul>
      </section>

      <SourceLibrary documents={docs} />

      <section className="card" aria-labelledby="lib-how">
        <h2 id="lib-how">How to read this</h2>
        <ul className="how">
          <li>A record marked <b>discovered</b>, <b>inaccessible</b> or <b>blocked</b> is about our retrieval, not about the publisher. Many public websites are busy, under maintenance or protected against automated visits; we try again at each check.</li>
          <li>The SHA-256 fingerprint identifies the exact file we read. If a publisher later replaces a file, the fingerprint lets anyone see that the figures came from the earlier version.</li>
          <li>Coverage says whether a document is about Siaya alone, several counties including Siaya, or Kenya as a whole. Results pooled across counties, for example in a programme report, are never presented here as Siaya results.</li>
          <li>Where documents disagree, both are kept. The FY 2024/25 own-source revenue figures from the county government and from the Controller of Budget are shown side by side in the <Link href="/data/#conflicts">conflict register</Link>, without a verdict.</li>
          <li>Takwimu does not republish these files. Licences are recorded as each publisher states them; where none is stated we say so and link to the original.</li>
        </ul>
        <p className="src">Download the whole library: <a href="/data/source-library.json" download>source-library.json</a> (schema in the project repository, <code>schemas/source-library.schema.json</code>). Method: {lib.meta.method} See also the <Link href="/data/">Data page</Link>, the <Link href="/method/">method notes</Link> and the <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
