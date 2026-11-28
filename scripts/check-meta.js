#!/usr/bin/env node
// Page metadata check (owner, 28 Nov 2026). Every indexable built page (no robots noindex) carries exactly one
// rel=canonical, which is SITE_URL plus the page's own trailing-slash path, exactly one og:url equal to it, og:site_name,
// og:type and a twitter card (lib/page-meta.js). Noindex pages (moved stubs, print editions, the 404 page) are listed
// and must carry no og:url pointing elsewhere than their canonical. Every sitemap URL must be an indexable page.
// Run after `next build`: node scripts/check-meta.js dist
const fs = require('fs');
const path = require('path');
const { SITE_URL } = require('../lib/site-url');

const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}="([^"]*)"`)); return m ? m[1].replace(/&amp;/g, '&') : null; };
const tags = (h, re) => h.match(re) || [];

function inspect(h) {
  const head = (h.match(/<head>([\s\S]*?)<\/head>/) || [null, h])[1];
  return {
    noindex: /<meta name="robots" content="[^"]*noindex/.test(head),
    canonical: tags(head, /<link rel="canonical"[^>]*>/g).map((t) => attr(t, 'href')),
    ogUrl: tags(head, /<meta property="og:url"[^>]*>/g).map((t) => attr(t, 'content')),
    ogSite: tags(head, /<meta property="og:site_name"[^>]*>/g).length,
    ogType: tags(head, /<meta property="og:type"[^>]*>/g).length,
    twitter: tags(head, /<meta name="twitter:card"[^>]*>/g).length,
  };
}

function problems(rel, m) {
  const own = `${SITE_URL}/${rel.replace(/(^|\/)index\.html$/, '$1')}`;
  const out = [];
  if (m.noindex) {
    if (m.ogUrl.length && m.ogUrl.some((u) => !m.canonical.includes(u))) out.push('noindex page: og:url differs from its canonical');
    return out;
  }
  if (m.canonical.length !== 1) out.push(`${m.canonical.length} rel=canonical (expected 1)`);
  else if (!m.canonical[0].startsWith(`${SITE_URL}/`)) out.push(`canonical ${m.canonical[0]} does not start with ${SITE_URL}/`);
  else if (m.canonical[0] !== own) out.push(`canonical ${m.canonical[0]} is not the page's own path ${own}`);
  if (m.ogUrl.length !== 1) out.push(`${m.ogUrl.length} og:url (expected 1)`);
  else if (m.ogUrl[0] !== m.canonical[0]) out.push(`og:url ${m.ogUrl[0]} differs from canonical`);
  if (m.ogSite !== 1) out.push('og:site_name missing or repeated');
  if (m.ogType !== 1) out.push('og:type missing or repeated');
  if (m.twitter !== 1) out.push('twitter:card missing or repeated');
  return out;
}

// Not vacuous: a page with no canonical and one with a foreign canonical must fail; a good one must pass.
const good = `<head><link rel="canonical" href="${SITE_URL}/x/"/><meta property="og:url" content="${SITE_URL}/x/"/><meta property="og:site_name" content="T"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/></head>`;
if (problems('x/index.html', inspect(good)).length || !problems('x/index.html', inspect('<head></head>')).length
  || !problems('x/index.html', inspect(good.replace(/takwimukenya\.com/g, 'example.org'))).length || !problems('y/index.html', inspect(good)).length) {
  console.error('check-meta: self-test failed'); process.exit(1);
}

const bad = [];
let indexable = 0; const noindex = [];
for (const f of walk(dist)) {
  const rel = path.relative(dist, f).split(path.sep).join('/');
  const m = inspect(fs.readFileSync(f, 'utf8'));
  if (m.noindex) noindex.push(rel); else indexable++;
  problems(rel, m).forEach((p) => bad.push(`${rel}: ${p}`));
}
const smap = path.join(dist, 'sitemap.xml');
if (fs.existsSync(smap)) {
  [...fs.readFileSync(smap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]).forEach((u) => {
    const p = path.join(dist, u.slice(SITE_URL.length), 'index.html');
    if (!u.startsWith(`${SITE_URL}/`) || !fs.existsSync(p)) bad.push(`sitemap: ${u} is not a built page`);
    else if (inspect(fs.readFileSync(p, 'utf8')).noindex) bad.push(`sitemap: ${u} is noindex`);
  });
} else bad.push('sitemap.xml missing');
if (indexable === 0) bad.push('no indexable pages found');
if (bad.length) { console.error(`check-meta: ${bad.length} problem(s)\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`check-meta: ${indexable} indexable pages each with one canonical under ${SITE_URL} and a matching og:url; ${noindex.length} noindex pages`);
