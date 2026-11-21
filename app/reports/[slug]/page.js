import { notFound } from 'next/navigation';
import Report from '../../../components/report/Report';
import { buildReport, SLUGS } from '../../../components/report/build';

export const dynamicParams = false;
export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const r = buildReport(params.slug);
  if (!r) return {};
  return {
    title: `Report ${r.meta.letter}: ${r.meta.title}${r.draft ? ' (draft)' : ''}`,
    description: `${r.meta.subtitle}. Print-ready report built only from the Takwimu data files; snapshot ${r.snapshot.id}.`,
    alternates: { canonical: `/reports/${r.meta.slug}/` },
  };
}

export default function ReportPage({ params }) {
  const r = buildReport(params.slug);
  if (!r) notFound();
  return <Report r={r} />;
}
