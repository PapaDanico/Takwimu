import Link from 'next/link';
import PageHead from '../../../components/PageHead';

export const metadata = {
  title: 'Request a brief',
  description: 'Ask Takwimu Kenya for a sourced county or constituency brief. The same service is open to every party, independent candidate and organisation, and paid work never changes a published figure.',
};

// A static Netlify Forms form: Netlify reads it from the built HTML at deploy time and stores submissions.
// No email address is published anywhere on the Site; replies come from the owner's inbox once a request arrives.
export default function RequestBrief() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Briefs" title="Request a brief" sub="Tell us what you need to know about a county or constituency, and we will prepare a brief built on the same sourced figures you see on this site." />

      <section className="card legal" aria-labelledby="offer-h">
        <h2 id="offer-h">What we offer, and how we work</h2>
        <p>A brief brings together population, allocations, budget execution, unpaid bills, audit opinions and trends for a place you care about, with the source, date, unit and confidence of every figure.</p>
        <ul className="how">
          <li><b>Open to everyone on the same terms.</b> The same service is offered to every political party, independent candidate, public office, organisation and citizen. We do not take sides and we do not rate named individuals.</li>
          <li><b>Paid work never changes a published figure.</b> A figure, ranking or caveat on this site stays as the evidence shows it, whoever asks or pays. Clients have no say over what we publish.</li>
          <li><b>Free facts stay free.</b> Everything already on the site remains open to all. A brief saves you time; it does not unlock different numbers.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="form-h">
        <h2 id="form-h">Your request</h2>
        <p className="lead">We ask only for what we need to reply. Fields marked optional can be left blank.</p>
        <form className="req-form" name="brief-request" method="POST" action="/briefs/request/thanks/" data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="brief-request" />
          <p hidden><label>Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <div className="field">
            <label htmlFor="rq-name">Your name</label>
            <input id="rq-name" type="text" name="name" autoComplete="name" required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="rq-org">Organisation or office</label>
            <input id="rq-org" type="text" name="organisation" autoComplete="organization" required maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="rq-role">Your role (optional)</label>
            <input id="rq-role" type="text" name="role" autoComplete="organization-title" maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="rq-email">Email, so we can reply</label>
            <input id="rq-email" type="email" name="email" autoComplete="email" required maxLength={200} />
          </div>
          <div className="field">
            <label htmlFor="rq-place">County or constituency</label>
            <input id="rq-place" type="text" name="place" required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="rq-need">What you need</label>
            <textarea id="rq-need" name="need" rows={6} required maxLength={3000} aria-describedby="rq-need-hint" />
            <p className="hint" id="rq-need-hint">For example the topics, years and format you have in mind, and any date you are working to. Please do not include personal details about other people.</p>
          </div>
          <div className="consent">
            <input id="rq-consent" type="checkbox" name="consent" value="yes" required />
            <label htmlFor="rq-consent">I agree that Takwimu Kenya may use these details to reply to this request, as set out in the <Link href="/privacy/">privacy notice</Link>.</label>
          </div>
          <p><button className="btn-s" type="submit">Send request</button></p>
        </form>
        <p className="src">Requests are stored by our host, Netlify, and read only by the Takwimu team. See the <Link href="/privacy/">privacy notice</Link> for how long we keep them and your rights. To report a mistake in a figure instead, use the &quot;Report an inaccuracy&quot; link at the foot of every page.</p>
      </section>
    </main>
  );
}
