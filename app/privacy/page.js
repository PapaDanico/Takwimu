import Link from 'next/link';
import PageHead from '../../components/PageHead';
import { SITE_URL, ISSUES_URL } from '../../lib/site';

export const metadata = {
  title: 'Privacy notice',
  description: 'What personal data Takwimu Kenya collects (very little), including through the Request a brief form, why, who processes it, how long it is kept and your rights under the Kenya Data Protection Act, 2019.',
};

const UPDATED = '21 November 2026';

const NOT_COLLECTED = [
  'Browsing the Site needs no account, login or form. You can read and download everything without telling us who you are.',
  'The only form is "Request a brief". It is optional, asks only for what we need to reply, and is used only for that reply.',
  'We do not run advertising, tracking pixels, or analytics or profiling tools, and we do not set cookies.',
  'We do not load fonts, scripts or images from other companies\' servers when you open a page: fonts and all page code are served from our own domain.',
  'We never sell or rent personal data, and we do not use it for profiling or automated decisions.',
];

const SECTIONS = [
  { id: 'who', title: '1. Who we are (the data controller)', body: [
    'The data controller for the Site is Takwimu Kenya, a civic-education service of Danico Ventures Ltd, a company in Kenya. Takwimu Kenya decides how and why personal data connected with the Site is used, within the meaning of the Kenya Data Protection Act, 2019 (the "Act").',
    `This notice covers ${SITE_URL.replace('https://', '')} (the "Site"). It explains in plain language what personal data is involved, why, who handles it, how long it is kept and your rights. It should be read with our Terms of use.`,
  ] },
  { id: 'collect', title: '2. What personal data is involved', body: [
    'Visiting the Site: technical data is created automatically whenever any web page is requested. This is your internet (IP) address, the date and time, the page or file requested, the response code, the type of browser and device, and the page that sent you here, if any. Our host, Netlify, processes it to deliver the Site and keep it secure (section 5). We do not combine it with other information to identify you.',
    'The "Request a brief" form: if you choose to use it, we receive what you type: the kind of request, your name, organisation or office, role (optional), email address, county or constituency, what you need, and your consent. A hidden anti-spam field, left empty by people, is also sent. We do not ask for identity numbers, phone numbers, political affiliation or any other sensitive personal data, and we ask you not to include personal details about other people.',
    'Reports through GitHub: if you choose to report a mistake on GitHub (section 7), what you write and your GitHub account details are involved.',
  ] },
  { id: 'why', title: '3. Why we use it, and our legal basis', body: [
    'Form details: we use them only to read your request, reply to it, prepare and deliver what you asked for, and keep a record that we did so. Our lawful basis is your consent, given by ticking the consent box (sections 30 and 32 of the Act). You may withdraw consent at any time (section 32); this does not affect what was done before you withdrew it.',
    'Technical request data: used only to deliver the Site, keep it secure and diagnose faults. Our basis is our legitimate interest in running a safe, working public website, limited to what is strictly needed and not overriding your rights.',
    'Purpose limitation: we do not use your details for any other purpose. We do not add you to a mailing list, send marketing, share your details with any party, candidate or client, or use them to build profiles. If we ever wished to use them for something new, we would ask you first.',
  ] },
  { id: 'retention', title: '4. How long data is kept', body: [
    'Form submissions are kept for up to 24 months from the date you send them, so that we can follow up on the work and answer questions about it. After that they are deleted from Netlify and from our inbox. If you ask us to delete them sooner, we will, unless the law requires us to keep a record.',
    'We do not keep a copy of visitor technical data ourselves. Netlify keeps request logs for the periods set out in its own notice and terms, after which they are deleted or anonymised.',
    'Public issue reports remain on GitHub until deleted by you or by GitHub, or until the repository is changed.',
  ] },
  { id: 'processors', title: '5. Who processes it for us, and transfers outside Kenya', body: [
    'The Site is hosted by Netlify, Inc. Netlify serves the pages, receives technical request data and stores form submissions on our behalf, as our data processor. Its privacy notice is at https://www.netlify.com/privacy/. When a request arrives, Netlify sends a notification to the Takwimu team\'s private inbox, whose provider also holds a copy for the retention period above.',
    'Netlify and email providers operate outside Kenya, including in the United States, so your data is transferred out of Kenya (sections 48 to 50 of the Act). To be honest about the safeguards: we rely on your consent to this transfer, given with the form, and on the provider\'s standard published contractual and security commitments, including encryption in transit. We have not negotiated separate terms with Netlify, and Kenya has not issued an adequacy decision for the United States. If you would rather not have your details sent abroad, please do not use the form.',
    'Only the Takwimu team can see form submissions. We do not sell, rent or share personal data with anyone else, and nobody who pays for a brief receives the details of other people who asked for one.',
    'The source code for the Site is stored on GitHub (https://github.com/PapaDanico/Takwimu). GitHub does not receive data from your visit to the Site or from the form.',
  ] },
  { id: 'cookies', title: '6. Cookies, analytics and similar technologies', body: [
    'The Site does not set cookies and does not run analytics, tracking pixels or advertising code. The "analytics" pages on the Site are calculations from public budget data; they are not visitor analytics.',
    'If you use "Save this view" on the Explore pages, the address of that view is kept in your own browser\'s local storage so that you can find it again. It never leaves your device, is not sent to us, and you can remove it at any time from the Saved views list or by clearing your browser data. Your light or dark display preference comes from your own device settings.',
    'Pages you open from our links (for example official reports) are run by other organisations, which may use cookies under their own policies.',
  ] },
  { id: 'sharing', title: '7. Sharing buttons, links and reports you send us', body: [
    'The "share" buttons are ordinary links. They open WhatsApp, your email program or another app on your device with a ready-made message containing the page address. We do not see, store or receive the message, the recipient or whether you send it. What happens next is covered by that app\'s own privacy notice.',
    `If you report a mistake at ${ISSUES_URL.replace('/new', '')}, your report is hosted by GitHub, is public, and may be seen, copied and indexed by anyone. Do not put personal information, contact details or confidential material in it. We use what you write only to check and correct the Site.`,
  ] },
  { id: 'rights', title: '8. Your rights, and how to use them', body: [
    'Under section 26 of the Act you have the right to be informed about how your personal data is used; to access it; to object to its processing; to have false or misleading data corrected; and to have it deleted. You may also withdraw consent, and ask for a copy of data you gave us in a usable format (section 38).',
    'How to use them: send the "Request a brief" form at /briefs/request/ and choose "A data request" as the kind of request. Tell us which right you want to use and, if it concerns an earlier request, roughly when you sent it, using the same email address so that we can match it to you safely. We will reply within the time the Act and its regulations allow, and free of charge in the normal case.',
    'Because browsing the Site does not identify you, we usually hold no personal data about visitors other than people who have used the form. For technical logs held by Netlify, you can also contact Netlify directly.',
    'You also have the right to complain to the Office of the Data Protection Commissioner (ODPC), the regulator in Kenya, at https://www.odpc.go.ke, if you think your data has been mishandled. We would welcome the chance to put things right first, but you do not need to contact us before complaining.',
  ] },
  { id: 'children', title: '9. Children', body: [
    'The Site is for general public education. The form is meant for adults and organisations, and we do not knowingly collect personal data from children. Teachers and parents are welcome to use the Site with learners.',
  ] },
  { id: 'security', title: '10. Security', body: [
    'The Site is a static website served over an encrypted (HTTPS) connection, and the form is sent over that same connection to Netlify. Access to submissions is limited to the Takwimu team\'s accounts. No system is perfectly secure; if a breach affects your personal data we will notify the ODPC and, where required, you, as the Act requires (section 43).',
  ] },
  { id: 'contact', title: '11. Changes to this notice and contact', body: [
    `We may update this notice if the Site or the law changes. If we do, we will update this page and its date before the change takes effect. This version was last updated on ${UPDATED}.`,
    'To ask a question about this notice or to use your rights, use the form at /briefs/request/ and choose "A data request". We do not publish a contact email address; the form is the private route, and replies come from the Takwimu team.',
  ] },
];

export default function Privacy() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Legal" title="Privacy notice" sub={`What personal data Takwimu Kenya collects (very little), why, and your rights. Version 1.1, last updated ${UPDATED}.`} path="/privacy/" shareText="Takwimu Kenya: privacy notice" />
      <nav aria-label="Sections on this page"><ul className="toc">
        {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s/, '')}</a></li>)}
      </ul></nav>
      <section className="card legal insight" aria-labelledby="short-h">
        <p className="eyebrow">In short</p>
        <h2 id="short-h">We collect very little, and only what you choose to send</h2>
        <ul className="steps">{NOT_COLLECTED.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="how">Browsing involves only the technical data every website receives (such as your IP address), handled by our host, Netlify. If you use the form, we keep your details for up to 24 months, only to reply. Details and your rights, including how to complain to the ODPC, are below.</p>
        <p className="how"><Link href="/briefs/request/">Use the form to request a brief or make a data request</Link></p>
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
