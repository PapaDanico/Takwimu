// The canonical site address: the primary domain since 28 Nov 2026 (the Netlify alias 301s here, netlify.toml).
// CommonJS so Node scripts (PDF makers, checks) and Next.js pages share one constant; lib/site.js re-exports it.
const SITE_URL = 'https://takwimukenya.com';
module.exports = { SITE_URL };
