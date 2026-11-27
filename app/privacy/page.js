import PageHead from '../../components/PageHead';
import { SITE_URL, ISSUES_URL } from '../../lib/site';

export const metadata = {
  title: 'Privacy notice',
  description: 'Takwimu Kenya does not collect, store or ask for personal data: no forms, accounts, analytics, tracking, advertising or cookies.',
};

const UPDATED = '21 November 2026';

const SECTIONS = [
  { id: 'none', title: '1. We do not collect personal data', body: [
    `Takwimu Kenya, a civic-education service of Danico Ventures Ltd, runs ${SITE_URL.replace('https://', '')} (the "Site"). We do not collect, store or ask for personal data.`,
    'The Site has no forms, no accounts or logins, no analytics, no tracking pixels, no advertising and no cookies. Fonts and page code are served from our own domain, so opening a page does not load anything from other companies\' servers. The "analytics" pages are calculations from public budget data, not visitor analytics.',
  ] },
  { id: 'saved', title: '2. Saved views stay in your browser', body: [
    'If you use "Save this view" on the Explore pages, the address of that view is kept in your own browser\'s local storage so that you can find it again. It never leaves your device and never reaches us. You can remove it from the Saved views list or by clearing your browser data. Your light or dark display preference comes from your device settings.',
  ] },
  { id: 'host', title: '3. Our host, Netlify', body: [
    'Like every website, the Site cannot be delivered without technical request data: your internet (IP) address, the date and time, the page requested and your browser type. Our host, Netlify, Inc., processes this data to serve the Site and protect it from abuse, under its own privacy policy at https://www.netlify.com/privacy/. We do not receive it from Netlify, combine it with anything or use it to identify anyone.',
  ] },
  { id: 'report', title: '4. Reporting a mistake', body: [
    'The "Report an inaccuracy" link opens a WhatsApp chat with Danico Ventures Ltd. Using it is your choice; what you share is handled as set out in section 5. Please send only the page, the figure and the source, not personal information.',
    'The "share" buttons are ordinary links that open an app on your device with a ready-made message. We do not see the message or whether you send it.',
  ] },
  { id: 'whatsapp', title: '5. Contacting us on WhatsApp', body: [
    'The "Request a brief" link on the Reports page (/reports/#briefs) opens WhatsApp so you can message Danico Ventures Ltd, which runs Takwimu Kenya. The Site does not pass anything to WhatsApp; the chat starts only if you choose to open it. WhatsApp is run by Meta under its own terms and privacy policy.',
    'Your name, phone number and what you write in the chat reach us through WhatsApp. We use them only to reply to your request and agree any brief, we do not add you to a mailing list, share your details or use them for profiling, and we delete the chat when the request is closed unless the law requires us to keep records of a paid service. You may ask us in the same chat to see, correct or delete what you shared.',
  ] },
  { id: 'complain', title: '6. Your right to complain', body: [
    'If you think personal data has been mishandled, you can complain to the Office of the Data Protection Commissioner (ODPC), the regulator under the Kenya Data Protection Act, 2019, at https://www.odpc.go.ke.',
  ] },
  { id: 'changes', title: '7. Changes to this notice', body: [
    `If the Site ever starts to collect personal data, we will update this notice before that happens. This version was last updated on ${UPDATED}.`,
  ] },
];

export default function Privacy() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Legal" title="Privacy notice" sub={`Takwimu Kenya does not collect personal data. Version 2.1, last updated ${UPDATED}.`} path="/privacy/" shareText="Takwimu Kenya: privacy notice" />
      <nav aria-label="Sections on this page"><ul className="toc">
        {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s/, '')}</a></li>)}
      </ul></nav>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="card legal" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{s.title}</h2>
          {s.body.map((para, i) => <p key={i}>{para}</p>)}
        </section>
      ))}
    </main>
  );
}
