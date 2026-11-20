export const metadata = { title: 'How we handle numbers | Takwimu Counties' };

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

export default function Method() {
  return (
    <main id="main" className="wrap page">
      <header>
        <p className="eyebrow">Method and corrections</p>
        <h1>How Takwimu handles numbers</h1>
        <p className="page-sub">What we publish, where it comes from, and what we do when two sources disagree.</p>
      </header>
      <section className="card prose" aria-labelledby="m-sources">
        <h2 id="sources" style={{ marginTop: 0 }}><span id="m-sources">Sources</span></h2>
        <p>Every figure shows its source, the date we retrieved it and a confidence score from 1 to 5. Primary official documents, such as Controller of Budget and Auditor-General reports, take priority over press reports and statements.</p>
        <p>Many reports are scanned pages. We read them with two text-recognition engines and compare the results. Figures that were read from scans carry a confidence score of 4 or lower.</p>
        <h2>Disagreements</h2>
        <p>When two sources give different figures for the same period, both are shown side by side. The figure closest to the primary document is shown first. The others are labelled with their source and status, and are never merged or averaged. A figure is marked verified only after we have read it in the primary document itself.</p>
        <h2>Named people and parties</h2>
        <p>Takwimu does not label named individuals as wrong or misleading. Any claim tied to a person needs a primary document and a legal check first.</p>
        <h2>Explainers</h2>
        <p>Explainers are plain-language definitions. They are marked as drafts until they have been reviewed by someone with subject knowledge.</p>
        <h2>Corrections</h2>
        <p>If you find an error, <a href={ISSUES_URL}>report it</a>. Corrections are logged publicly in the repository history.</p>
        <h2>Status</h2>
        <p>This is an early version. Trend series are added only when their sources have been verified.</p>
      </section>
    </main>
  );
}
