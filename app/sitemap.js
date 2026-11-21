import { PAGES, SITE_URL } from '../lib/site';
import { COUNTIES } from '../lib/counties';

export const dynamic = 'force-static';

export default function sitemap() {
  const lastModified = new Date('2026-11-20');
  const counties = COUNTIES.filter((c) => !c.published).map((c) => ({ href: `/counties/${c.slug}/` }));
  const extra = [{ href: '/counties/siaya/brief/' }];
  return [...PAGES, ...extra, ...counties].map((p) => ({ url: `${SITE_URL}${p.href}`, lastModified, changeFrequency: 'monthly', priority: p.href === '/' ? 1 : 0.7 }));
}
