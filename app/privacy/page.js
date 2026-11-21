import PageHead from '../../components/PageHead';
import { SITE_URL, ISSUES_URL } from '../../lib/site';

export const metadata = {
  title: 'Privacy notice',
  description: 'What personal data Takwimu Counties collects (very little), why, who processes it, how long it is kept and your rights under the Kenya Data Protection Act, 2019.',
};

const UPDATED = '21 November 2026';

const NOT_COLLECTED = [
  'We do not ask you to create an account or log in.',
  'We have no forms, comment boxes or newsletter sign-up.',
  'We do not run advertising, tracking pixels, or analytics or profiling tools.',
  'We do not set cookies of our own, and we do not use cookie-based tracking.',
  'We do not load fonts, scripts or images from other companies\' servers when you open a page: fonts and all page code are served from our own domain.',
  'We do not sell or rent personal data, and we do not use any data about you to make automated decisions.',
];

const SECTIONS = [
  { id: 'who', title: '1. Who we are', body: [
    'Takwimu Counties is a free civic-education website run by Danico Ventures Ltd, a company in Kenya, which decides how and why any personal data connected with the Site is used (the "data controller" under the Kenya Data Protection Act, 2019).',
    `This notice covers ${SITE_URL.replace('https://', '')} (the "Site"). It explains what personal data is involved when you visit, in plain language. It should be read with our Terms of use.`,
  ] },
  { id: 'collect', title: '2. What personal data is involved', body: [
    'Visiting the Site is anonymous in the sense that we do not know who you are and have no way to ask. The only personal data involved is technical data that is created automatically whenever any web page is requested:',
    '• Your internet (IP) address, the date and time of the request, the page or file requested, the response code, the type of browser and device (the "user agent"), and the address of the page that sent you here, if any.',
    'This technical data is processed by our hosting provider so that the Site can be delivered to you and kept secure (section 4). We do not combine it with any other information to identify you, and we do not use it for marketing.',
    'If you choose to report a mistake through GitHub (section 6), the information you put in your report, and your GitHub account details, are also involved.',
  ] },
  { id: 'why', title: '3. Why we use it, and our legal basis', body: [
    'Technical request data is used only to deliver the Site, keep it secure and working, and diagnose faults. Under the Kenya Data Protection Act, 2019, our basis is our legitimate interest in running a safe, working public website, which is limited to what is strictly needed for that purpose and does not override your rights.',
    'We do not rely on your consent because we do not ask for or collect anything that needs it. Because we do not use cookies or tracking, there is no cookie banner.',
  ] },
  { id: 'processors', title: '4. Who processes it for us', body: [
    'The Site is hosted by Netlify, Inc., a cloud hosting company. Netlify receives the technical request data described above in order to serve pages to you and to protect its network. Netlify has its own privacy notice at https://www.netlify.com/privacy/, which applies to its handling of that data.',
    'Netlify operates internationally, so technical request data may be processed outside Kenya, including in the United States. Those transfers are governed by Netlify\'s own terms and privacy policy, which we have not separately negotiated. We have not added any analytics or tracking to the Site\'s code.',
    'The source code for the Site is stored on GitHub (https://github.com/PapaDanico/Takwimu). GitHub does not receive data from your visit to the Site.',
  ] },
  { id: 'cookies', title: '5. Cookies and similar technologies', body: [
    'The Site does not set cookies and does not use local storage or similar technologies to track or identify you. Your device may remember your light or dark display preference, which is set by your own browser settings and is not sent to us.',
    'Pages you open from our links (for example official reports) are run by other organisations, which may use cookies under their own policies.',
  ] },
  { id: 'sharing', title: '6. Sharing buttons, links and reports you send us', body: [
    'The "share" buttons are ordinary links. They open WhatsApp, your email program or another app on your device with a ready-made message containing the page address. We do not see, store or receive the message, the recipient or whether you send it. What happens next is covered by that app\'s own privacy notice.',
    `If you report a mistake at ${ISSUES_URL.replace('/new', '')}, your report is hosted by GitHub, is public, and may be seen, copied and indexed by anyone. Do not put personal information, contact details or confidential material in it. We use what you write only to check and correct the Site.`,
  ] },
  { id: 'retention', title: '7. How long data is kept', body: [
    'We do not keep a copy of visitor technical data ourselves. Netlify keeps request logs for the periods set out in its own notice and terms, after which they are deleted or anonymised.',
    'Public issue reports remain on GitHub until deleted by you or by GitHub, or until the repository is changed.',
  ] },
  { id: 'rights', title: '8. Your rights', body: [
    'Under the Kenya Data Protection Act, 2019, you have the right to be informed about the use of your personal data; to access it; to object to its processing; to have inaccurate data corrected; to have data deleted where the law allows; and to receive a copy of data you gave us in a usable format.',
    'Because we do not hold personal data that identifies you, there is usually nothing for us to show or delete. If you believe we hold data about you, or you want to use any of these rights, contact us (section 11) and we will respond as soon as we can and within the time the Data Protection Act, 2019 requires. For technical logs held by Netlify, you can also contact Netlify.',
    'You also have the right to complain to the Office of the Data Protection Commissioner of Kenya (https://www.odpc.go.ke) if you think your data has been mishandled.',
  ] },
  { id: 'children', title: '9. Children', body: [
    'The Site is for general public education and is not aimed at children. We do not knowingly collect personal data from anyone, including children. Teachers and parents are welcome to use the Site with learners.',
  ] },
  { id: 'security', title: '10. Security', body: [
    'The Site is a static website served over an encrypted (HTTPS) connection. It has no database of visitors and no login, which removes most of the risks that come with storing personal data. No system is perfectly secure; if we learn of a breach that affects personal data we will act as the law requires.',
  ] },
  { id: 'contact', title: '11. Changes to this notice and contact', body: [
    `We may update this notice if the Site or the law changes, for example if we ever add analytics, a form or an account feature. If we do, we will update this page and its date before the change takes effect. This version was last updated on ${UPDATED}.`,
    `To ask a question about this notice or to use your rights, open an issue at ${ISSUES_URL.replace('/new', '')} (issues are public and need a GitHub account: do not include personal details). A private contact address is not yet published; until one is, a request that needs privacy cannot be handled through this route.`,
  ] },
];

export default function Privacy() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Legal" title="Privacy notice" sub={`What personal data Takwimu Counties collects (very little), why, and your rights. Version 1.0, last updated ${UPDATED}.`} path="/privacy/" shareText="Takwimu Counties: privacy notice" />
      <nav aria-label="Sections on this page"><ul className="toc">
        {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s/, '')}</a></li>)}
      </ul></nav>
      <section className="card legal insight" aria-labelledby="short-h">
        <p className="eyebrow">In short</p>
        <h2 id="short-h">We collect almost nothing about you</h2>
        <ul className="steps">{NOT_COLLECTED.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="how">The only personal data involved is the technical data every website receives (such as your IP address), handled by our host, Netlify, to deliver the Site. Details and your rights are below.</p>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="card legal" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{s.title}</h2>
          {s.body.map((para, i) => <p key={i}>{para}</p>)}
        </section>
      ))}
    </main>
  );
}
