import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('safety');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/safety/`, { title: `${m.name}: road safety and communications`, description: `${m.name} County road traffic accidents by category and media and courier operators from the KNBS County Statistical Abstract 2024, 2019-2023, as printed with page references.` });
}

export default function CountySafety({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="safety" sector="justice/ICT" title="Road safety and communications"
    sub="Reported road traffic accidents by category, and media and courier operators, in Kisumu County, 2019 to 2023, as the county statistical abstract prints them."
    notes={['Accident counts are incidents reported to the police as printed; they are not rates per vehicle or per person.']}
    also={[[`/counties/${slug}/people/`, 'population']]} />;
}
