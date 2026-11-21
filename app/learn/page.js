import PageHead from '../../components/PageHead';

export const metadata = {
  title: 'Learn: budget, audit and statistics terms in plain English',
  description: 'Plain-language explainers for the budget, audit and statistics terms used on Takwimu Kenya.',
};

const GROUPS = [
  {
    id: 'money-in',
    title: 'Money coming in',
    terms: [
      { id: 'own-source-revenue', term: 'Own-source revenue', def: 'Money a county raises itself from fees, levies, licences and charges, as opposed to money it receives from the national government.', eg: 'In Siaya it includes payments made at county health facilities.' },
      { id: 'equitable-share', term: 'Equitable share', def: 'The money the national government sends to counties each year from the revenue it collects. The Constitution says counties must receive at least 15 per cent of national revenue, and Parliament decides the exact amount each year.', eg: 'For most counties it is by far the largest source of money.' },
      { id: 'conditional-grants', term: 'Conditional grants', def: 'Extra money from the national government or development partners that may only be spent on a stated purpose, such as a health or road programme.' },
      { id: 'appropriations-in-aid', term: 'Appropriations-in-aid', def: 'Revenue that a county department collects and keeps to spend directly, rather than paying it into the County Revenue Fund first. Reports sometimes call this money spent at source.' },
      { id: 'fif', term: 'Facility improvement financing', def: 'Money that county health facilities collect from patients and health insurers and keep for their own use, such as buying medicines.' },
    ],
  },
  {
    id: 'money-out',
    title: 'Money going out',
    terms: [
      { id: 'development-vs-recurrent', term: 'Development and recurrent spending', def: 'Development spending pays for projects that last, such as roads, classrooms and clinics. Recurrent spending pays for running costs, mainly salaries, medicines and fuel.' },
      { id: 'absorption-rate', term: 'Absorption rate', def: 'The share of a budget that was actually spent. A low rate on the development budget means less of the planned spending was paid out in the year. It does not by itself show whether the works were or were not delivered: projects can be paid for in a later year, or be delivered by other funding.', eg: 'Siaya spent 57 per cent of its development budget in FY 2024/25, according to the Controller of Budget.' },
      { id: 'supplementary-budget', term: 'Supplementary budget', def: 'A change to a budget during the year. It can raise or cut allocations, which is why the "approved" budget and the "revised" budget can differ.' },
      { id: 'pending-bills', term: 'Pending bills', def: 'Money a county owes suppliers and contractors for goods or work already delivered. Large pending bills can mean a county has committed more than it collects.' },
      { id: 'revenue-arrears', term: 'Revenue arrears', def: 'Money owed to the county, such as unpaid rates or fees, that has not been collected yet.' },
      { id: 'stalled-projects', term: 'Stalled projects', def: 'Projects that have started but stopped before completion, often because payments or approvals ran out.' },
    ],
  },
  {
    id: 'accountability',
    title: 'Checking and accountability',
    terms: [
      { id: 'controller-of-budget', term: 'Controller of Budget', def: 'The independent office that approves withdrawals from the public purse and reports to Parliament on how national and county budgets are implemented.' },
      { id: 'auditor-general', term: 'Auditor-General', def: 'The independent office that audits public accounts and says whether they are reliable and whether money was used lawfully.' },
      { id: 'audit-opinion', term: 'Audit opinion', def: 'The auditor\'s verdict on the accounts. Unqualified (clean): the accounts are fair. Qualified: fair except for specific problems the auditor lists. Adverse: the accounts are materially wrong. Disclaimer: the auditor could not form an opinion, usually because records were missing or unreliable.', eg: 'Read the basis paragraphs, not only the label.' },
      { id: 'cidp', term: 'County Integrated Development Plan', def: 'The county\'s five-year plan. Takwimu uses the Siaya plan for 2023 to 2027 because it reproduces official population and health statistics by sub-county.' },
    ],
  },
  {
    id: 'statistics',
    title: 'Reading the statistics',
    terms: [
      { id: 'fiscal-year', term: 'Fiscal year', def: 'The 12-month budget year. In Kenya it runs from 1 July to 30 June, so FY 2024/25 means July 2024 to June 2025.' },
      { id: 'nominal-real', term: 'Nominal and real values', def: 'A nominal value is the amount in the money of the day. A real value adjusts for rising prices so that different years can be compared fairly. KSh 100 in 2015 buys more than KSh 100 in 2025.' },
      { id: 'per-capita', term: 'Per person (per capita)', def: 'A total divided by the number of people, so counties or years of different size can be compared.' },
      { id: 'census-projection', term: 'Census and projection', def: 'A census counts everyone on one night (Kenya\'s last was in 2019). A projection is a statistical estimate of the population in later years.' },
      { id: 'sub-county', term: 'Sub-county, constituency and ward', def: 'In Siaya each of the six sub-counties matches one constituency. Constituencies are divided into wards, the smallest elected unit. Siaya has 30 wards.' },
      { id: 'multidimensional-poverty', term: 'Multidimensional poverty', def: 'A measure of people who lack several basic needs at once, such as education, health, housing, water and sanitation, not only money.' },
    ],
  },
];

export default function Learn() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Learn" title="Budget, audit and statistics terms in plain English" sub="Short definitions you can use when reading any county report. They are drafts until someone with subject knowledge has reviewed them." path="/learn/" shareText="Budget and audit terms in plain English" />
      <nav aria-label="Sections on this page"><ul className="toc">{GROUPS.map((g) => <li key={g.id}><a href={`#${g.id}`}>{g.title}</a></li>)}</ul></nav>
      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} className="card" aria-labelledby={`${g.id}-h`}>
          <h2 id={`${g.id}-h`}>{g.title}</h2>
          <div className="terms">
            {g.terms.map((t) => (
              <article key={t.id} id={t.id} className="term-card">
                <span className="tag good">Draft explainer</span>
                <h3>{t.term}</h3>
                <p>{t.def}</p>
                {t.eg && <p className="eg">{t.eg}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className="card" aria-labelledby="questions">
        <h2 id="questions">Five questions to ask of any county number</h2>
        <ol className="steps">
          <li><b>Which year?</b> Fiscal years run July to June. Check you are comparing the same period.</li>
          <li><b>Which measure?</b> Does the figure include money spent at source, health facility income or arrears?</li>
          <li><b>Whose number?</b> A primary report, the county, or a news article? Our confidence score says which.</li>
          <li><b>Compared with what?</b> A target, last year, or another county? A figure alone says little.</li>
          <li><b>Adjusted for prices?</b> Ten years of inflation changes what a shilling buys.</li>
        </ol>
      </section>
    </main>
  );
}
