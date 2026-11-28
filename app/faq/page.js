import PageHead from '../../components/PageHead';
import { pageMeta } from '../../lib/page-meta';

export const metadata = pageMeta('/faq/', {
  title: 'Frequently asked questions',
  description: 'Answers to common questions about where Takwimu numbers come from, how current they are and how to use them.',
});

const FAQS = [
  { q: 'Where do the numbers come from?', a: 'From official public documents: the Controller of Budget county reports, Auditor-General reports, the Siaya County Integrated Development Plan and the national census. Every figure on the site shows its source, publication date, period, unit and a confidence score.' },
  { q: 'Why do some figures have two values?', a: 'Official reports sometimes disagree, or a later report restates an earlier year. We show both side by side and say which report each came from. We do not pick a winner or average them.' },
  { q: 'What does the confidence score mean?', a: 'It runs from 1 to 5: a 5 is read from the primary document and confirmed a second way, and lower scores carry a warning. The full rubric is on the Method page (confidence).' },
  { q: 'How far back does the data go, and why are some years missing?', a: 'We aim for at least ten years. Reports are published months after a fiscal year ends, and some could not be found or read, so a chart shows a gap instead of joining the dots. Each missing year is listed with its reason, once, under known gaps on the Method page; nothing is estimated in its place.' },
  { q: 'Are the shilling amounts adjusted for inflation?', a: 'Not unless a chart says so: amounts are nominal, the money of the day. Nominal and real values are defined in the glossary on the Learn page, and the Method page (prices) says how real values are calculated.' },
  { q: 'Does Takwimu say whether the county is doing well or badly?', a: 'We report what the documents say and compare years. We do not score or rank named officials. Claims about individuals would need a primary document and legal review first.' },
  { q: 'What is the difference between budget, release and spending?', a: 'The budget is the approved plan. A release (exchequer issue) is money the Controller of Budget allowed the county to withdraw. Spending is what was actually paid out. Pending bills are goods and services delivered but not yet paid for.' },
  { q: 'Why does a high audit opinion not always mean good money management?', a: 'An audit opinion says whether the accounts are fair and lawful, not whether projects were wise or completed. Read the findings behind the label.' },
  { q: 'Who runs Takwimu, and who pays for it?', a: 'Takwimu Kenya is a product of Danico Ventures Ltd, a Kenyan company. It is free to use, carries no advertising and takes no money from the public bodies whose reports it explains.' },
  { q: 'Which counties are published, and when will others be added?', a: 'Siaya was prepared first because the project began there; that says nothing about how it compares with any other county. Its pages show what a full county looks like: a ten-year history, six sub-counties and a county profile. The same method applies to all 47 counties. Each one is added when its figures meet the same sourcing and confidence rules, and each in-preparation page lists what is still needed.' },
  { q: 'How often is the data updated?', a: 'When new official reports are published and we have read and checked them. The Controller of Budget publishes annual county reports several months after each fiscal year, so the newest year is always the slowest to appear. Each page shows when its data was last checked.' },
  { q: 'Can I reuse the charts, text and data, for example in a classroom or a news story?', a: 'Yes, with credit. Name Takwimu Kenya and the original publisher, do not hide our caveats or confidence scores, and check a number against its source document before publishing. Downloads, with their sources, are on the Datasets page; the Terms of use set out the details.' },
  { q: 'Do you collect my personal data or use cookies?', a: 'No. The site has no forms, accounts, analytics, advertising or cookies, and fonts come from our own domain. Briefs are requested by WhatsApp message, from the Request a brief link on the Reports page; the chat starts only if you open it. Our host, Netlify, receives the technical request data every website receives (such as an IP address). The Privacy notice explains this and your rights under the Kenya Data Protection Act, 2019.' },
  { q: 'What does "read from a scanned page" mean for accuracy?', a: 'Software reads the text of a photographed page and can swap or drop digits, so such figures get extra checks and a lower confidence score. The checks are listed on the Method page (checks).' },
  { q: 'Is the site accessible, and can I print it?', a: 'We build to WCAG 2.2 level AA as far as we can test. Every chart has a "View as table" option, charts have a legend and direct labels on wide screens, and the site works in light and dark modes and on small phones. Pages print cleanly without menus. If you meet a barrier, tell us with the Report an error link.' },
  { q: 'How do I report a mistake, contact you or complain?', a: 'The Report an error link at the top of every page opens a WhatsApp chat with Danico Ventures Ltd, which runs Takwimu. Name the page and the figure, and share the document that shows the right value; please leave out personal details. Complaints about content that concerns you are handled promptly. A corrected figure carries a dated footnote beside it (Method page, corrections).' },
];

export default function Faq() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Help" title="Frequently asked questions" sub="How to read, trust and reuse the numbers on this site." path="/faq/" shareText="Takwimu Kenya: frequently asked questions" />
      <section className="card faq" aria-label="Questions and answers">
        {FAQS.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p className="ans">{f.a}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
