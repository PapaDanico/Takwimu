import SectorPage from '../../../../components/county/SectorPage';
import { paramsFor } from '../../../../components/county/params';
import { pageMeta } from '../../../../lib/page-meta';
import * as cp from '../../../../lib/county-pages';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('social');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/social/`, { title: `${m.name}: social protection and community services`, description: `${m.name} County social statistics from the KNBS County Statistical Abstract 2024: safe homes, women and youth group registration, cash transfer beneficiaries, libraries, social halls and Kenya National Library Service use, 2019-2024, as printed with page references.` });
}

export default function CountySocial({ params }) {
  const { slug } = params;
  return <SectorPage slug={slug} page="social" sector="social" title="Social protection and community services"
    sub="Safe homes, women and youth groups, cash transfers, libraries and social halls in Kisumu County, as the county statistical abstract prints them."
    notes={['Counts are of people served, groups registered or facilities; they are not rates and are not divided by population here. Table 1.6.3 (books borrowed) has no 2023 values in the record set; the gap is shown, not filled.']}
    also={[[`/counties/${slug}/people/`, 'population']]} />;
}
