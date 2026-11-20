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
  { q: 'Can I use the data?', a: 'Yes. The Data page lists the files and their sources. Please cite the original publisher as well as Takwimu.' },
  { q: 'I found a mistake. What should I do?', a: 'Tell us on the Corrections page. Fixes are logged there with the date, what was wrong and what changed.' },
];

export default function Faq() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Help" title="Frequently asked questions" sub="How to read, trust and reuse the numbers on this site." path="/faq/" shareText="Takwimu Counties: frequently asked questions" />
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
