import { PAGES, SITE_URL } from '../lib/site';

export const dynamic = 'force-static';

export default function sitemap() {
  const lastModified = new Date('2026-11-20');
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.href}`, lastModified, changeFrequency: 'monthly', priority: p.href === '/' ? 1 : 0.7 }));
}
