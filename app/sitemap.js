import { PAGES, SITE_URL, SITE_UPDATED } from '../lib/site';
import { COUNTIES } from '../lib/counties';
import { STORIES } from '../lib/stories';
import fs from 'fs';
import path from 'path';
import registry from '../components/report/reports.json';

// Redirect sources (netlify.toml) are not pages: a sitemap URL must never be one (duplication sweep D22;
// scripts/check-redirects.js fails the build if one is listed).
const REDIRECTED = new Set([...fs.readFileSync(path.join(process.cwd(), 'netlify.toml'), 'utf8').matchAll(/from\s*=\s*"([^"]+)"/g)].map((m) => m[1].replace(/\/?$/, '/')));

export const dynamic = 'force-static';

export default function sitemap() {
  const lastModified = new Date(SITE_UPDATED);
  const counties = COUNTIES.filter((c) => !c.published).map((c) => ({ href: `/counties/${c.slug}/` }));
  const extra = [{ href: '/counties/siaya/brief/' }, { href: '/counties/siaya/economy/' }, { href: '/counties/siaya/governance/' }, { href: '/counties/siaya/audits/' }, { href: '/counties/siaya/ledger/' }, { href: '/counties/siaya/analysis/' }, { href: '/counties/siaya/departments/' }, { href: '/counties/siaya/health/' }, { href: '/counties/siaya/education/' }, { href: '/counties/siaya/agriculture/' }, { href: '/counties/siaya/climate/' }, { href: '/counties/siaya/wards/' }, { href: '/counties/siaya/projects/' }, { href: '/counties/siaya/programmes/' }, { href: '/counties/siaya/sources/' }, { href: '/data/' }, { href: '/reports/' }, { href: '/reports/method/' }, ...registry.reports.map((r) => ({ href: `/reports/${r.slug}/` })), ...STORIES.map((x) => ({ href: `/stories/${x.slug}/` }))];
  return [...PAGES.filter((p) => p.href !== '/reports/'), ...extra, ...counties].filter((p) => !REDIRECTED.has(p.href.split('#')[0].replace(/\/?$/, '/'))).map((p) => ({ url: `${SITE_URL}${p.href}`, lastModified, changeFrequency: 'monthly', priority: p.href === '/' ? 1 : 0.7 }));
}
