import { PAGES, SITE_URL } from '../lib/site';
import { COUNTIES } from '../lib/counties';
import { STORIES } from '../lib/stories';
import registry from '../components/report/reports.json';

export const dynamic = 'force-static';

export default function sitemap() {
  const lastModified = new Date('2026-11-20');
  const counties = COUNTIES.filter((c) => !c.published).map((c) => ({ href: `/counties/${c.slug}/` }));
  const extra = [{ href: '/counties/siaya/brief/' }, { href: '/counties/siaya/pulse/' }, { href: '/counties/siaya/economy/' }, { href: '/counties/siaya/governance/' }, { href: '/counties/siaya/audits/' }, { href: '/counties/siaya/ledger/' }, { href: '/counties/siaya/analysis/' }, { href: '/counties/siaya/health/' }, { href: '/counties/siaya/education/' }, { href: '/counties/siaya/agriculture/' }, { href: '/counties/siaya/climate/' }, { href: '/counties/siaya/wards/' }, { href: '/counties/siaya/projects/' }, { href: '/counties/siaya/programmes/' }, { href: '/counties/siaya/sources/' }, { href: '/briefs/request/' }, { href: '/reports/' }, ...registry.reports.map((r) => ({ href: `/reports/${r.slug}/` })), ...STORIES.map((x) => ({ href: `/stories/${x.slug}/` }))];
  return [...PAGES, ...extra, ...counties].map((p) => ({ url: `${SITE_URL}${p.href}`, lastModified, changeFrequency: 'monthly', priority: p.href === '/' ? 1 : 0.7 }));
}
