import Link from 'next/link';
import PageHead from '../../../../components/PageHead';

export const metadata = {
  title: 'Request received',
  description: 'Thank you for your request to Takwimu Kenya. We will reply by email.',
  robots: { index: false },
};

export default function RequestThanks() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Briefs" title="Thank you, your request has been sent" sub="We read every request and will reply to the email address you gave. Thank you for working with evidence." />
      <section className="card legal" aria-labelledby="next-h">
        <h2 id="next-h">What happens next</h2>
        <ul className="how">
          <li>We will reply to confirm what we can prepare and when.</li>
          <li>Every brief uses the same published figures and method as this site, whoever asks.</li>
          <li>Your details are used only to answer this request. The <Link href="/privacy/">privacy notice</Link> explains how long we keep them and how to ask us to delete them.</li>
        </ul>
        <p className="backhome"><Link href="/">Home</Link><Link href="/explore/">Explore the data</Link><Link href="/counties/siaya/brief/">See a sample brief</Link></p>
      </section>
    </main>
  );
}
