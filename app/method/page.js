export const metadata = { title: 'Method and corrections | Takwimu' };

const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';

export default function Method() {
  return (
    <main className="prose">
      <div className="eyebrow">Method and corrections</div>
      <h1>How Takwimu handles numbers</h1>
      <h2>Sources</h2>
      <p>Every figure shows its source, the date we retrieved it and a confidence score from 1 to 5. Primary official documents, such as Controller of Budget and Auditor-General reports, take priority over press reports and statements.</p>
      <h2>Disagreements</h2>
      <p>When two sources give different figures for the same period, both are shown side by side. The primary official figure is the headline. The other is labelled, with its source and status, and is never merged or averaged.</p>
      <h2>Named people and parties</h2>
      <p>Takwimu does not label named individuals as wrong or misleading. Any claim tied to a person needs a primary document and a legal check first.</p>
      <h2>Corrections</h2>
      <p>If you find an error, <a href={ISSUES_URL}>report it</a>. Corrections are logged publicly in the repository history.</p>
      <h2>Status</h2>
      <p>This is an early version. Trend series are added only when their sources have been verified.</p>
    </main>
  );
}
