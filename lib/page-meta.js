// Per-page metadata for every routed, indexable page: rel=canonical (the page's own trailing-slash path), og:url,
// og:site_name, og:type and a twitter card. Paths are resolved against metadataBase (SITE_URL, app/layout.js).
// A page's openGraph replaces the layout's (Next.js merges metadata one level deep), so the shared image is repeated.
// Moved stubs use movedMetadata (components/Moved.js) instead; the build checks both (scripts/check-meta.js).
// CommonJS so the build check reads the same constants.
const { SITE_URL } = require('./site-url');

const SITE_NAME = 'Takwimu Kenya';
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Takwimu Kenya: Turning Data into Progress.' };

function canonicalPath(p) {
  const s = String(p || '/').split('#')[0].split('?')[0];
  const lead = s.startsWith('/') ? s : `/${s}`;
  return lead.endsWith('/') ? lead : `${lead}/`;
}

function pageMeta(pathname, meta = {}) {
  const url = canonicalPath(pathname);
  const { alternates, openGraph, twitter, ...rest } = meta;
  return {
    ...rest,
    alternates: { ...(alternates || {}), canonical: url },
    openGraph: { type: 'website', siteName: SITE_NAME, url, images: [OG_IMAGE], ...(openGraph || {}) },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE.url], ...(twitter || {}) },
  };
}

module.exports = { pageMeta, canonicalPath, SITE_NAME, SITE_URL };
