import PageHead from '../../components/PageHead';

export const metadata = {
  title: 'Corrections and open questions',
  description: 'A public log of mistakes we found and fixed on Takwimu Counties, and questions we have not resolved.',
};

const FIXED = [
  { date: '20 Nov 2026', was: 'We described a figure of about KSh 1.04 billion, reported in the press, as a third total for Siaya\'s own revenue.', now: 'The Controller of Budget report shows KSh 1.04 billion is the budgeted target, not money collected. It is now shown as the target, from the primary report.' },
  { date: '20 Nov 2026', was: 'A trend takeaway said Siaya\'s own revenue was "nearly flat" between KSh 428 and 508 million.', now: 'The FY 2023/24 report gives KSh 610.74 million for that year, while the FY 2024/25 report quotes KSh 427.95 million for the same year. The chart now shows both and the text describes the conflict instead of a trend.' },
  { date: '20 Nov 2026', was: 'The recurrent budget for FY 2024/25 was entered as KSh 6.02 billion.', now: 'A second reading of the scanned page gives KSh 6.07 billion, and 4.87 plus 6.07 equals the approved total of KSh 10.94 billion. We now use 6.07 and check that budget parts add to the total.' },
  { date: '20 Nov 2026', was: 'The headline revenue bar was labelled as coming from the primary report although it came from a press article.', now: 'The figure is now sourced to the Controller of Budget report itself, with a confidence score of 4 out of 5.' },
  { date: '20 Nov 2026', was: 'The build published thirteen data files of national figures that no page showed and that we could not trace to a source.', now: 'Only files with traceable figures are published. The rest were removed.' },
  { date: '20 Nov 2026', was: 'A page naming individuals and labelling claims as disputed was part of the site.', now: 'It was removed until each claim has a primary document and legal review.' },
];

const OPEN = [
  { q: 'The report states 47 per cent of the revenue target for FY 2024/25, but 436.68 of 1,043 is about 42 per cent.', note: 'Resolved in part: 47 per cent is measured against an annual target of about KSh 929 million, not the KSh 1,043 million in budget financing. The report does not explain why the two targets differ.' },
  { q: 'Own-source revenue for FY 2015/16 is KSh 127.93 million in the FY 2016/17 report and KSh 113.26 million in the FY 2018/19 report.', note: 'Both are shown. The reports do not say whether the later figure is a restatement.' },
  { q: 'FY 2016/17 recurrent spending is KSh 3.9 billion in one sentence of the report and KSh 3.65 billion in its table.', note: 'We use the table, which adds to the KSh 5.63 billion total.' },
  { q: 'The FY 2025/26 Controller of Budget report could not be reached from our build environment.', note: 'Press coverage reports Siaya at 26.94 per cent of its own-revenue target. We have not shown it because we could not read the document.' },
  { q: 'The FY 2019/20 full-year county report could not be downloaded.', note: 'Only own-source revenue for that year is shown, taken from the FY 2020/21 report.' },
];

export default function Corrections() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Trust" title="Corrections and open questions" sub="We publish our mistakes. Each entry says what was wrong, what changed and when." path="/corrections/" shareText="Takwimu Counties corrections log" />
      <section className="card" aria-labelledby="fixed">
        <h2 id="fixed">Fixed</h2>
        <div className="log">
          {FIXED.map((f, i) => (
            <article key={i} className="term-card">
              <p className="log-date">{f.date}</p>
              <p><b>Was:</b> {f.was}</p>
              <p><b>Now:</b> {f.now}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="card" aria-labelledby="open">
        <h2 id="open">Open questions</h2>
        <div className="log">
          {OPEN.map((o, i) => (
            <article key={i} className="term-card">
              <p><b>{o.q}</b></p>
              <p>{o.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Report a mistake</h2>
        <p>Open an issue at <a href="https://github.com/PapaDanico/Takwimu/issues">github.com/PapaDanico/Takwimu/issues</a> with the page, the figure and the document that shows the right value.</p>
      </section>
    </main>
  );
}
