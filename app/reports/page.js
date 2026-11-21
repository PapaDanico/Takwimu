import Link from 'next/link';
import { buildReport, SLUGS } from '../../components/report/build';

export const metadata = {
  title: 'Siaya evidence reports',
  description: 'Five print-ready Siaya County reports built only from the Takwimu data files, each with sources, pages, confidence, conflicts, data gaps and a snapshot ID.',
  alternates: { canonical: '/reports/' },
};

export default function ReportsIndex() {
  const reports = SLUGS.map(buildReport);
  return (
    <main id="main" className="wrap rp-index">
      <h1>Siaya evidence reports</h1>
      <p>Five report templates built only from the data files in this site. Every figure gives its source, page, period, unit and confidence. While any figure is unreviewed, the report is marked DRAFT and the figure is labelled “Provisional: awaiting editorial review”.</p>
      <ul>
        {reports.map((r) => (
          <li key={r.meta.slug}>
            <h2><Link href={`/reports/${r.meta.slug}/`}>Report {r.meta.letter}: {r.meta.title}</Link></h2>
            <p>{r.meta.subtitle}.</p>
            <p className="rp-index-meta">{r.edition} · data as of {r.date} · snapshot <span className="mono">{r.snapshot.id}</span>{r.draft ? ' · DRAFT' : ''} · <a href={`/reports/${r.meta.slug}.pdf`}>PDF (A4)</a></p>
          </li>
        ))}
      </ul>
    </main>
  );
}
