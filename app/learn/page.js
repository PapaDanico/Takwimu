import { ABBR } from '../../lib/abbreviations';
import PageHead from '../../components/PageHead';
import ledger from '../../data/siaya-fiscal-ledger.json';
import { Provisional } from '../../components/ObsTable';
import { fmtFixed } from '../../lib/format';

// Duplication sweep D10: the FY 2024/25 own-source revenue figures quoted below are read from the fiscal ledger
// (observation ids), so the text cannot drift from the data.
const LV = (id) => fmtFixed(ledger.observations.find((o) => o.id === id).value, 2);

export const metadata = {
  title: 'Learn: budget, audit and statistics terms in plain English',
  description: 'Plain-language explainers for the budget, audit and statistics terms used on Takwimu Kenya.',
};

const GROUPS = [
  {
    id: 'money-in',
    title: 'Money coming in',
    terms: [
      { id: 'osr-term', term: 'Own-source revenue', def: 'Money a county raises itself from fees, levies, licences and charges, as opposed to money it receives from the national government.', eg: 'In Siaya it includes payments made at county health facilities.' },
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
  {
    id: 'abbreviations',
    title: 'Abbreviations',
    terms: Object.entries(ABBR).filter(([, a]) => a.def).map(([k, a]) => ({ id: a.id, term: `${k}: ${a.full}`, def: a.def })),
  },
];

// Own-source revenue, hospital income, FIF and A-i-A (owner item 5, 23 Nov 2026). Every page or report that shows own-source
// revenue or FIF links here (/learn/#own-source-revenue); the smoke test checks the links.
function OsrExplainer() {
  return (
    <section className="card" id="own-source-revenue" aria-labelledby="osr-h">
      <h2 id="osr-h">Own-source revenue, hospital income, FIF and A-i-A: why the totals differ</h2>
      <p className="lead">Different official documents often give different &ldquo;own-source revenue&rdquo; totals for the same county and year. Usually nobody has made a mistake: they are counting different things. This section explains the four terms and how each publisher uses them.</p>
      <div className="terms">
        <article className="term-card" id="osr-ordinary">
          <h3>Ordinary own-source revenue</h3>
          <p>Money the county raises itself under its own laws: property rates, business permits, market and parking fees, produce cess, liquor and other licences, and charges for services. The Constitution lets counties impose property rates and entertainment taxes (Article 209(3)) and charge for the services they provide (Article 209(4)). This money is paid into the County Revenue Fund before it is spent.</p>
        </article>
        <article className="term-card" id="osr-hospital">
          <h3>Hospital revenue</h3>
          <p>Money paid to county hospitals and health centres for services: fees from patients, and reimbursements from insurers and national schemes, such as the National Health Insurance Fund (NHIF) until 2024, the Social Health Authority (SHA and its fund, SHIF) since then, and the Linda Mama free maternity programme. For many counties it is now the largest part of what they collect themselves.</p>
        </article>
        <article className="term-card" id="osr-fif">
          <h3>Facility Improvement Financing (FIF)</h3>
          <p>The Facility Improvement Financing Act, 2023 allows public health facilities to keep the money they collect and spend it on their own needs, such as medicines and repairs, instead of sending it to the county treasury first. &ldquo;FIF&rdquo; in county reports usually means this hospital money. Before the Act, counties ran similar arrangements under their own laws, often called a Facility Improvement Fund.</p>
        </article>
        <article className="term-card" id="osr-aia">
          <h3>Appropriations-in-aid (A-i-A)</h3>
          <p>Revenue a department collects and is allowed to spend at source, without paying it into the County Revenue Fund first. Hospital FIF is the main kind of A-i-A, but a county can also treat other income this way (Siaya&apos;s own reports, for example, list liquor licensing under A-i-A in FY 2024/25). Because A-i-A is spent where it is collected, it can be missed or counted twice when totals are compiled.</p>
        </article>
      </div>
      <h3 className="mini" id="osr-publishers">How each publisher counts them</h3>
      <Provisional dataset="siaya-fiscal-ledger">The Siaya figures in this table are read from the fiscal ledger, transcribed by Takwimu from the source documents, and have not yet been checked by a reviewer.</Provisional>
      <div className="tablewrap" tabIndex={0} role="region" aria-labelledby="osr-publishers">
        <table className="data" id="osr-publishers-table">
          <caption className="sr-only">How each publisher counts own-source revenue, hospital income, FIF and A-i-A</caption>
          <thead><tr><th scope="col">Publisher</th><th scope="col">What its &ldquo;own-source revenue&rdquo; includes</th></tr></thead>
          <tbody>
            <tr><th scope="row">Controller of Budget (CoB), budget implementation review reports</th><td>Ordinary own-source revenue plus a FIF or A-i-A line, and in recent reports a split between the two. For Siaya in FY 2023/24 the report gives KSh 610.74 million: KSh 222.11 million ordinary revenue and KSh 388.63 million health FIF. A later report can quote a different figure for the same year.</td></tr>
            <tr><th scope="row">County government reports (quarterly budget reports, Budget Review and Outlook Paper)</th><td>County Revenue Fund receipts plus all A-i-A the county records, including hospital reimbursements from SHA/SHIF, Linda Mama and NHIF capitation. For Siaya in FY 2024/25 the county reports KSh {LV('L162')} million, of which KSh {LV('L164')} million A-i-A, while the CoB reports KSh {LV('L153')} million, of which KSh {LV('L155')} million FIF/A-i-A.</td></tr>
            <tr><th scope="row">Auditor-General (OAG)</th><td>Audits the county&apos;s financial statements, which record receipts as the county reports them, and comments where collections were not banked, not recorded or not supported. Audit reports do not give a comparable own-source revenue total for every year, so we use them for findings, not for the series.</td></tr>
            <tr><th scope="row">Kenya National Bureau of Statistics (KNBS)</th><td>Does not compile its own count of county revenue in the sources we use. Its Gross County Product measures the size of the county economy, which is not money the county government collects. Where a KNBS abstract shows county revenue, it repeats a county or Treasury figure.</td></tr>
          </tbody>
        </table>
      </div>
      <h3 className="mini" id="osr-why">Why the totals differ</h3>
      <ul className="how">
        <li><b>Hospital money in or out.</b> The largest gap is usually whether FIF and other A-i-A are added to ordinary revenue, and which insurer reimbursements count as FIF.</li>
        <li><b>Date and version.</b> A quarterly report, the annual report and a figure quoted a year later can each use a different cut-off or a revised figure.</li>
        <li><b>Where the money was recorded.</b> Money spent at source may reach the county&apos;s books late, or only through a separate facility account.</li>
        <li><b>Targets.</b> Targets come from different budget versions (original or supplementary), so revenue &ldquo;as a share of target&rdquo; differs too.</li>
      </ul>
      <p className="how">On this site every source&apos;s figure is shown side by side, with its basis, in the <a href="/counties/siaya/ledger/#osr-latest">fiscal reconciliation</a>, and the make-up of Siaya&apos;s own-source revenue is on <a href="/counties/siaya/analysis/#an-a8">Siaya analysis</a>. A difference is a question to put to the documents, not evidence that a figure is wrong.</p>
    </section>
  );
}

export default function Learn() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Learn" title="Budget, audit and statistics terms in plain English" sub="Short definitions you can use when reading any county report. They are drafts until someone with subject knowledge has reviewed them." path="/learn/" shareText="Budget and audit terms in plain English" />
      <nav aria-label="Sections on this page"><ul className="toc">{GROUPS.map((g) => <li key={g.id}><a href={`#${g.id}`}>{g.title}</a></li>)}<li><a href="#own-source-revenue">Own-source revenue, FIF and A-i-A</a></li></ul></nav>
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
      <OsrExplainer />
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
