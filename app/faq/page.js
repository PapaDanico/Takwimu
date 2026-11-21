import PageHead from '../../components/PageHead';

export const metadata = {
  title: 'Frequently asked questions',
  description: 'Answers to common questions about where Takwimu numbers come from, how current they are and how to use them.',
};

const FAQS = [
  { q: 'Where do the numbers come from?', a: 'From official public documents: the Controller of Budget county reports, Auditor-General reports, the Siaya County Integrated Development Plan and the national census. Every figure on the site shows its source, publication date, period, unit and a confidence score.' },
  { q: 'Why do some figures have two values?', a: 'Official reports sometimes disagree, or a later report restates an earlier year. We show both side by side and say which report each came from. We do not pick a winner or average them.' },
  { q: 'What does the confidence score mean?', a: 'It runs from 1 to 5. A 5 is a figure read directly from the primary document and confirmed a second way. A 4 is read from the primary document and passes arithmetic checks. A 3 is a secondary source or a projection. Lower scores are leads we show only with a warning. The Method page has the full rubric.' },
  { q: 'How far back does the data go?', a: 'We aim for at least ten years. Where a series is shorter, the page says why and which years are missing. Gaps are listed on the Method page and the Data page.' },
  { q: 'Why is the latest year missing for some measures?', a: 'Reports are published months after a fiscal year ends, and some source sites were not reachable when we built the site. We list each open gap rather than fill it with an estimate.' },
  { q: 'Are the shilling amounts adjusted for inflation?', a: 'Not unless a chart says so. Amounts are nominal, meaning the money of the day. Real-terms views use Kenya\'s consumer price index and are labelled approximate because fiscal years straddle two calendar years.' },
  { q: 'Does Takwimu say whether the county is doing well or badly?', a: 'We report what the documents say and compare years. We do not score or rank named officials. Claims about individuals would need a primary document and legal review first.' },
  { q: 'What is the difference between budget, release and spending?', a: 'The budget is the approved plan. A release (exchequer issue) is money the Controller of Budget allowed the county to withdraw. Spending is what was actually paid out. Pending bills are goods and services delivered but not yet paid for.' },
  { q: 'Why does a high audit opinion not always mean good money management?', a: 'An audit opinion says whether the accounts are fair and lawful, not whether projects were wise or completed. Read the findings behind the label.' },
  { q: 'Who runs Takwimu, and who pays for it?', a: 'Takwimu Kenya is a product of Danico Ventures Ltd, a Kenyan company. It is free to use, carries no advertising and takes no money from the public bodies whose reports it explains. It is independent of the Controller of Budget, the Auditor-General, KNBS and Siaya County Government.' },
  { q: 'Why Siaya, and will other counties be added?', a: 'Siaya is the home county of the project, so it is the first full example: a ten-year history, six sub-counties and a county profile. The method is built to extend to other counties as their reports are read and checked. We add a county only when its figures can meet the same sourcing and confidence rules.' },
  { q: 'How often is the data updated?', a: 'When new official reports are published and we have read and checked them. The Controller of Budget publishes annual county reports several months after each fiscal year, so the newest year is always the slowest to appear. Each page shows when its data was last checked.' },
  { q: 'Can I reuse your charts, text and data?', a: 'Yes, with credit. Name Takwimu Kenya and the original publisher, and do not hide our caveats or confidence scores. The Terms of use set out the details, and the Data page has downloadable files.' },
  { q: 'Do you collect my personal data or use cookies?', a: 'We do not ask for accounts, run analytics or advertising, or set cookies, and fonts come from our own domain. Our host, Netlify, receives the technical request data every website receives (such as an IP address). The Privacy notice explains this and your rights under the Kenya Data Protection Act, 2019.' },
  { q: 'What does "read from a scanned page" mean for accuracy?', a: 'Many older reports are photographs of printed pages. Software reads the text, which can swap or drop digits. For key figures we use two readings, check that parts add up to totals, and cap the confidence score at 4 of 5. Where a page could not be read reliably, we leave the figure out.' },
  { q: 'What are real (price-adjusted) figures?', a: 'The same money buys less each year as prices rise. A real figure restates old amounts in the prices of a recent year so that years can be compared fairly. We use the World Bank consumer price index, averaged over each fiscal year, so real figures are approximate.' },
  { q: 'Why are some charts missing a year?', a: 'Because a report for that year was not available or could not be read. We leave a gap in the line instead of joining the dots, and the gaps are listed on the Method and Data pages.' },
  { q: 'Is the site accessible, and can I print it?', a: 'We build to WCAG 2.2 level AA as far as we can test. Every chart has a "View as table" option, charts have a legend and direct labels on wide screens, and the site works in light and dark modes and on small phones. Pages print cleanly without menus. If you meet a barrier, tell us using the link on the Data page.' },
  { q: 'Can I use Takwimu in a classroom or a news story?', a: 'Yes. Teachers and journalists are welcome to use and cite it. Check any number against the source document before publishing, and link to the original report as well.' },
  { q: 'How do I contact you or complain about something on the site?', a: 'Open an issue using the link in the footer or on the Data page. Say which page and figure, and share the document that shows the right value. Issues are public, so please leave out personal details. Complaints about content that concerns you are handled promptly and logged.' },
  { q: 'Can I use the data?', a: 'Yes. The Data page lists the files and their sources. Please cite the original publisher as well as Takwimu.' },
  { q: 'I found a mistake. What should I do?', a: 'Open an issue using the link on the Data page, naming the page, the figure and the document that shows the right value.' },
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
