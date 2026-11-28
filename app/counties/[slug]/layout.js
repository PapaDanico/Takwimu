import CountyNav from '../../../components/county/CountyNav';
import { ON_PAGES, nav, meta } from '../../../lib/county-pages';

// Pages of a county published from the registry end with the list of its pages; "in preparation" pages do not.
export default function CountyLayout({ children, params }) {
  if (!ON_PAGES.includes(params.slug)) return children;
  return <>{children}<CountyNav name={meta(params.slug).name} links={nav(params.slug)} /></>;
}
