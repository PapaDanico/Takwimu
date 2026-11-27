// Shared appendix for Reports A-E (UX sweep U3): how to read the reports, the method, the confidence scales, the
// bibliography conventions and the licence, stated once here and linked from every report.
import Link from 'next/link';
import TableWrap from '../../../components/TableWrap';
import registry from '../../../components/report/reports.json';
import { REVIEW_FILES, REVIEW_STATE } from '../../../components/report/snapshot';
import { PROVISIONAL } from '../../../components/report/model';

export const metadata = {
  title: 'How to read these reports',
  description: 'Shared method, confidence scales, bibliography conventions and licence for the five Siaya evidence reports.',
  alternates: { canonical: '/reports/method/' },
};

const SCALES = [
  { scale: 'confidence N of 5', where: 'Most figures (fiscal ledger, economy, health, education, agriculture, climate, audits, projects)', meaning: <>The Takwimu rubric on the <Link href="/method/#confidence">method page</Link>: 5 read from the primary document and confirmed a second way; 4 read from the primary document and passes arithmetic checks (scanned pages are capped here); 3 secondary reproduction, projection or noisy scan; 2 press report of an official figure not seen; 1 not verified.</> },
  { scale: 'source tier A to D', where: 'Programme atlas (Report E and the programme tables of Reports A and C)', meaning: 'The atlas grades the source, not the value: A county government document; B research publication; C funder or registry record (World Bank, IATI); D news item. It is not converted to the 1 to 5 scale.' },
  { scale: 'high, medium, low', where: 'County Budget Transparency Survey items (governance)', meaning: 'The extractor’s grade as recorded in data/siaya-governance.json. It is not converted to the 1 to 5 scale.' },
  { scale: 'OCR score 0 to 1', where: 'Controller of Budget 47-county tables (Report B comparison)', meaning: 'The text-recognition engine’s own score for the cell read from a scanned table. It is a reading score, not a confidence grade.' },
  { scale: 'count compiled by Takwimu, not graded', where: 'Counts of records (programme records, audit findings per category)', meaning: 'A count of records listed in the data file. It cites the pages of the records it counts.' },
  { scale: 'lowest of its inputs', where: 'Figures calculated by Takwimu (share of budget spent, transfer dependency, pending-bill changes)', meaning: 'A calculated figure carries the lowest confidence of the values it is calculated from, and the page of its first input.' },
];

export default function ReportsMethod() {
  return (
    <main id="main" className="wrap page">
      <p className="eyebrow">Reports</p>
      <h1>How to read these reports</h1>
      <p className="lead">One appendix for the five Siaya evidence reports: what the parts of a report mean, how every figure is traced to its document, the confidence scales, the bibliography conventions and the licence.</p>
      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#reading">Reading a report</a></li><li><a href="#review">Review state</a></li><li><a href="#tables">Tables and notes</a></li>
        <li><a href="#confidence">Confidence scales</a></li><li><a href="#method">Method</a></li><li><a href="#gaps">Gaps</a></li>
        <li><a href="#bibliography">Bibliography</a></li><li><a href="#snapshot">Snapshot ID</a></li><li><a href="#licence">Licence</a></li>
      </ul></nav>

      <section id="reading" className="card" aria-labelledby="rd-h">
        <h2 id="rd-h">Reading a report</h2>
        <p>Each section gives <strong>Findings</strong>, the values as the documents print them with source, page, period, unit and confidence, and then, separately, <strong>Interpretation</strong>: Takwimu’s reading, which is not a finding. Where documents disagree, the values are shown together and none is chosen. Each section names its canonical topic page on this site, where the full series is kept up to date.</p>
        <p>The reports: {registry.reports.map((r, i) => <span key={r.slug}>{i ? '; ' : ''}<Link href={`/reports/${r.slug}/`}>Report {r.letter}: {r.title}</Link></span>)}.</p>
        <p>Terms: “share of budget spent (absorption rate)” is spending divided by the approved budget in the same document and budget version (<Link href="/learn/#absorption-rate">glossary</Link>); “own-source revenue” is money the county raises itself (<Link href="/learn/#own-source-revenue">glossary</Link>).</p>
      </section>

      <section id="review" className="card" aria-labelledby="rv-h">
        <h2 id="rv-h">Review state</h2>
        <p>Editorial review works as on the rest of the site (<Link href="/method/#review">Method, editorial review</Link>): until a figure is reviewed it is “{PROVISIONAL}”. A report says this once, on its cover, with the count of figures in each review state, instead of labelling every figure. While any figure is provisional the report carries a DRAFT watermark and a DRAFT header on every printed page.</p>
        <p>Only exceptions carry a mark beside the value: <strong>Approved</strong> (an approved review record), <strong>Disputed</strong> (the data file records a conflict for the value; both readings are kept, see the <Link href="/data/#conflicts">conflict register</Link>), <strong>Superseded</strong> (replaced by a later reading). A value withdrawn after editorial review prints the withdrawal and its reason in place of the number.</p>
      </section>

      <section id="tables" className="card" aria-labelledby="tb-h">
        <h2 id="tb-h">Tables and notes</h2>
        <p>Each value is printed with its unit. A period, source, page or confidence that is the same for every row of a table is stated once under the table (“Every row: …”) and its column is left out. So is a note shared by every row, such as a scope or a reading method. Notes that differ between rows are numbered: the number after the indicator name points to the note under the table.</p>
        <p>Pages are PDF pages (counted from the first page of the file) unless marked “printed”, which is the number printed on the page. Each chart is followed by a table with every charted value and its citation; the chart itself is a single stop for keyboard users.</p>
      </section>

      <section id="confidence" className="card" aria-labelledby="cf-h">
        <h2 id="cf-h">Confidence scales</h2>
        <p>Most figures use the 1 to 5 rubric and print “confidence N of 5”. Some data files grade on their own scale; no mapping to 1 to 5 is defined, so the report shows the original grade and names its scale.</p>
        <TableWrap label="Confidence scales used in the reports">
          <table className="data">
            <caption className="sr-only">Confidence scales used in the reports</caption>
            <thead><tr><th scope="col">As printed</th><th scope="col">Used for</th><th scope="col">Meaning</th></tr></thead>
            <tbody>{SCALES.map((s) => <tr key={s.scale}><th scope="row">{s.scale}</th><td>{s.where}</td><td>{s.meaning}</td></tr>)}</tbody>
          </table>
        </TableWrap>
      </section>

      <section id="method" className="card" aria-labelledby="me-h">
        <h2 id="me-h">Method</h2>
        <p>Every value is read at build time from a data file in this site; no value is typed into a report. Each value keeps the unit, period and page its source prints. A test resolves every figure on every report page against its data file and fails the build if a value differs, and checks that the page and grade of the source observation are carried into pairs and cross-tabulations. Figures calculated by Takwimu are labelled as such and give their formula. Counts of people below 10 are suppressed. No report names a contractor or an individual, and none holds personal data. The general method, checks and price conventions are on the <Link href="/method/">method page</Link>.</p>
      </section>

      <section id="gaps" className="card" aria-labelledby="gp-h">
        <h2 id="gp-h">Gaps</h2>
        <p>Each report lists the gaps recorded in its own input files in its “Data gaps” appendix. Gaps are listed, never filled, and a missing value is never shown as zero. The site-wide list of known gaps is on the <Link href="/method/#known-gaps">method page</Link>.</p>
      </section>

      <section id="bibliography" className="card" aria-labelledby="bi-h">
        <h2 id="bi-h">Bibliography conventions</h2>
        <p>The bibliography of a report lists every document cited by a figure in it. The key is the document identifier used in the data files. The SHA-256 digest identifies the exact file version read; “not recorded” means the file was not captured. “Link and cite only” means the publisher states no reuse licence: link to the document and cite it; do not redistribute it. Sources cited by description are datasets or compilations without a single document.</p>
      </section>

      <section id="snapshot" className="card" aria-labelledby="sn-h">
        <h2 id="sn-h">Snapshot ID</h2>
        <p>The snapshot ID on a report is the first 12 hex digits of a SHA-256 digest over the names and digests of its input files, the review files ({REVIEW_FILES.map((f) => `data/${f}`).join(', ')}) and the {REVIEW_STATE}. Rebuilding from the same files gives the same ID; any data change or new review decision changes it, so a PDF printed before the change no longer matches the page.</p>
      </section>

      <section id="licence" className="card" aria-labelledby="li-h">
        <h2 id="li-h">Licence</h2>
        <p>Takwimu Kenya’s original text, tables and charts in these reports may be reused for personal, educational, journalistic, research or commercial purposes with the credit “Takwimu Kenya (takwimu.netlify.app), based on [the original publisher]”, without suggesting endorsement; say so if you change the material. The underlying documents and figures remain under their publishers’ own licences, listed in each report’s bibliography.</p>
      </section>
    </main>
  );
}
