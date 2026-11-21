import Link from 'next/link';
import PageHead from '../../../components/PageHead';

export const metadata = {
  title: 'Request a brief',
  description: 'Takwimu Kenya prepares sourced county and constituency briefs. The same offer is open to every party and independent candidate, and paid work never changes a published figure.',
};

// No form and no contact address on purpose: the Site collects no personal data (owner decision, 21 Nov 2026).
export default function RequestBrief() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Briefs" title="Request a brief" sub="Takwimu Kenya prepares briefs on a county or constituency, built on the same sourced figures you see on this site." />

      <section className="card legal" aria-labelledby="offer-h">
        <h2 id="offer-h">What a brief is</h2>
        <p>A constituency or county brief brings together population, allocations, budget execution, unpaid bills, audit opinions and ten-year trends for one place, with the source, date, unit and confidence of every figure. See the <Link href="/counties/siaya/brief/">sample Siaya brief</Link>.</p>
        <ul className="how">
          <li><b>The same offer to everyone.</b> Every political party and independent candidate, and any office, organisation or citizen, is offered the same service on the same terms. We do not take sides and we do not rate named individuals.</li>
          <li><b>Paid work never changes a published figure.</b> A figure, ranking or caveat on this site stays as the evidence shows it, whoever asks or pays. Clients have no say over what we publish.</li>
          <li><b>Free facts stay free.</b> Everything on the site remains open to all. A brief saves you time; it does not unlock different numbers.</li>
        </ul>
      </section>

      <section className="card legal" aria-labelledby="how-h">
        <h2 id="how-h">How to ask for one</h2>
        <p>Message Danico Ventures Ltd, which runs Takwimu Kenya, on WhatsApp. Tell us the county or constituency, what you need the brief for, and when you need it. We will reply with the scope and the price.</p>
        <p><a className="btn" href="https://wa.me/message/GPPIKMENXJVWO1" target="_blank" rel="noopener noreferrer">Message Danico Ventures Ltd on WhatsApp</a></p>
        <p>This site itself collects no personal data and has no form. Your conversation happens in WhatsApp, under WhatsApp&apos;s own terms; what you share there is used only to reply to your request (see the <a href="/privacy/">privacy notice</a>). To report a mistake in a figure, use the &quot;Report an inaccuracy&quot; link at the foot of every page.</p>
      </section>
    </main>
  );
}
