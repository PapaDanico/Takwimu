import Link from 'next/link';
import { buildReport, SLUGS } from '../../components/report/build';
import { WHATSAPP_URL } from '../../lib/site';
import { Provisional } from '../../components/ObsTable';
import { DATASET_IDS } from '../../lib/review-status';
import { pageMeta } from '../../lib/page-meta';

export const metadata = pageMeta('/reports/', {
  title: 'Publications',
  description: 'Takwimu Kenya publications for Siaya County: the one-page fiscal brief (HTML and PDF), five print-ready evidence reports, and how to ask for a brief on another county or constituency.',
});

// Publications (owner decision U2, 21 Nov 2026): the one-page brief, its PDF, reports A to E and "About our briefs"
// (moved from /reports/#briefs, which now redirects to /reports/#briefs). No form and no contact address on purpose:
// the site collects no personal data (owner decision, 21 Nov 2026).
export default function Publications() {
  const reports = SLUGS.map(buildReport);
  return (
    <main id="main" className="wrap page">
      <header><p className="eyebrow">Publications</p><h1>Publications</h1>
      <p className="page-sub">Everything here is built only from the data files on this site. Every figure gives its source, page, period, unit and confidence. While any figure is unreviewed, a publication is marked DRAFT and says so once, at the top.</p>
      <Provisional dataset={DATASET_IDS.filter((d) => d !== 'imf')} /></header>
      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#brief">County fiscal briefs</a></li><li><a href="#evidence">Evidence reports</a></li><li><a href="#briefs">About our briefs</a></li>
      </ul></nav>

      <section className="card" aria-labelledby="brief-h" id="brief">
        <h2 id="brief-h">County fiscal briefs</h2>
        <p>Revenue, spending, unpaid bills and audit for one county on three A4 pages, marked DRAFT until reviewed.</p>
        <ul>
          <li>Siaya: read it as a <Link href="/counties/siaya/brief/">web page</Link> or download the <a href="/reports/siaya-fiscal-brief.pdf" download>PDF (A4)</a>.</li>
          <li>Kisumu: read it as a <Link href="/counties/kisumu/brief/">web page</Link> or download the <a href="/reports/kisumu-fiscal-brief.pdf" download>PDF (A4)</a>.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="evidence-h" id="evidence">
        <h2 id="evidence-h">Siaya evidence reports A to E</h2>
        <p>Five print-ready reports. Shared method, licence and how to read them are set out once in the <Link href="/reports/method/">reports appendix</Link>.</p>
        <ul className="steps">
          {reports.map((r) => (
            <li key={r.meta.slug}>
              <h3 className="mini"><Link href={`/reports/${r.meta.slug}/`}>Report {r.meta.letter}: {r.meta.title}</Link></h3>
              <p>{r.meta.subtitle}.</p>
              <p className="rp-index-meta">{r.edition} · data as of {r.date} · snapshot <span className="mono">{r.snapshot.id}</span>{r.draft ? ' · DRAFT' : ''} · <a href={`/reports/${r.meta.slug}.pdf`}>PDF (A4)</a></p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="briefs-h" id="briefs">
        <h2 id="briefs-h">About our briefs</h2>
        <p>Takwimu Kenya prepares briefs on a county or constituency, built on the same sourced figures you see on this site. A brief brings together population, allocations, the share of budget spent, unpaid bills, audit opinions and ten-year trends for one place, with the source, date, unit and confidence of every figure. The Siaya brief above is the sample.</p>
        <ul className="how">
          <li><b>The same offer to everyone.</b> Every political party and independent candidate, and any office, organisation or citizen, is offered the same service on the same terms. We do not take sides and we do not rate named individuals.</li>
          <li><b>Paid work never changes a published figure.</b> A figure, ranking or caveat on this site stays as the evidence shows it, whoever asks or pays. Clients have no say over what we publish.</li>
          <li><b>Public statistics only.</b> A brief is built from published, aggregate figures (budgets, spending, population, services). It holds no information about individual voters or residents, and we do not take on campaign canvassing, voter targeting or direct marketing work.</li>
          <li><b>Free facts stay free.</b> Everything on the site remains open to all. A brief saves you time; it does not unlock different numbers.</li>
        </ul>
        <h3 id="briefs-how">How to ask for one</h3>
        <p>Message Danico Ventures Ltd, which runs Takwimu Kenya, on WhatsApp. Tell us the county or constituency, what you need the brief for, and when you need it. We will reply with the scope and the price.</p>
        <p><a className="btn" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Message Danico Ventures Ltd on WhatsApp</a></p>
        <p>This site itself collects no personal data and has no form. Your conversation happens in WhatsApp, under WhatsApp&apos;s own terms; what you share there is used only to reply to your request (see the <Link href="/privacy/">privacy notice</Link>). To report a mistake in a figure, use &ldquo;Report an error&rdquo; in the header or at the foot of every page.</p>
      </section>
    </main>
  );
}
