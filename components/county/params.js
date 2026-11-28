// Static params for a page of the counties published from the registry (lib/county-registry.js `pages`).
import { ON_PAGES, meta } from '../../lib/county-pages';

export const paramsFor = (page) => ON_PAGES.filter((s) => meta(s).pages.includes(page)).map((slug) => ({ slug }));
