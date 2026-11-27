// Print edition of a report: the full, standalone content that scripts/make-reports-pdf.js prints to
// public/reports/<slug>.pdf. The web page (/reports/<slug>/) shows only what is unique to the report and links
// the rest (duplication sweep D13, D23, D24); this route keeps every table, gap and bibliography entry for the PDF.
// Not in the sitemap and not indexed; its canonical is the web page.
import { notFound } from 'next/navigation';
import Report from '../../../../components/report/Report';
import { buildReport, SLUGS } from '../../../../components/report/build';

export const dynamicParams = false;
export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const r = buildReport(params.slug);
  if (!r) return {};
  return {
    title: `Report ${r.meta.letter}: ${r.meta.title}, print edition${r.draft ? ' (draft)' : ''}`,
    description: `Full print edition of Report ${r.meta.letter} (the PDF source); snapshot ${r.snapshot.id}.`,
    alternates: { canonical: `/reports/${r.meta.slug}/` },
    robots: { index: false, follow: true },
  };
}

export default function ReportPrintPage({ params }) {
  const r = buildReport(params.slug);
  if (!r) notFound();
  return <Report r={r} edition="print" />;
}
