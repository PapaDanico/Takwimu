// Where each county's data files live, which schema each reuses, its release state and what of it may be published
// (docs/adr-0001-multi-county-data.md). Siaya keeps its original file names (data/siaya-*.json, data/history.json),
// so nothing published about Siaya moves; every other county keeps its files under data/counties/<slug>/ with the
// same file kinds and the same schemas. The tests (scripts/test-fiscal-ledger.js, scripts/test-audits.js,
// scripts/test-county-reconciliation.js, scripts/test-unpublished-counties.js) loop over this registry.
//
// Release state (lib/county-states.js): draft / reviewable / published, set by hand, never derived from another flag.
// HELD (draft or reviewable): no file of theirs may be copied to public/data/, imported by a page, or appear in dist/.
// ON_PAGES (published, data/counties/ layout): the routes in `pages` exist under app/counties/[slug]/ and only the
// file kinds in `public_kinds` may reach dist/ (per-county allowlist); every other kind stays held, checked by record.
// scripts/test-unpublished-counties.js fails closed on any mismatch. CommonJS: build scripts, tests and pages.
const fs = require('fs');
const path = require('path');
const { bySlug } = require('./counties');
const { stateOf, STATES } = require('./county-states');

// The repository root. Under the Next.js build this module runs from .next/server, so fall back to the working
// directory (the build always runs from the root).
const ROOT = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : process.cwd();

// File kinds: the schema each reuses and its review-dataset name (lib/county-review.js).
const KINDS = {
  ledger: { schema: 'schemas/siaya-fiscal-ledger.schema.json', label: 'fiscal reconciliation ledger (core fiscal series)' },
  audits: { schema: 'schemas/siaya-audits.schema.json', label: 'Auditor-General opinions (and findings when coded)' },
  population: { schema: 'schemas/county-population.schema.json', label: 'population and per-capita denominator' },
  conflicts: { schema: 'schemas/conflicts.schema.json', label: 'source conflict register' },
  geography: { schema: 'schemas/county-geography.schema.json', label: 'IEBC county, constituency and ward registry with boundary files (geo.wards, geo.constituencies)' },
  abstract: { schema: 'schemas/county-indicators.schema.json', label: 'statistical abstract tables by sub-county and ward (KNBS county abstract)' },
  indicators: { schema: 'schemas/county-indicators.schema.json', label: 'poverty, survey, water-utility, fisheries and statistical-abstract indicators' },
};

const COUNTY_DATA = {
  siaya: {
    code: 41,
    layout: 'legacy (data/siaya-*.json, data/history.json); unchanged',
    files: { ledger: 'data/siaya-fiscal-ledger.json', audits: 'data/siaya-audits.json', conflicts: 'data/conflicts.json', indicators: 'data/indicators.json' },
  },
  kisumu: {
    code: 42,
    layout: 'data/counties/kisumu/',
    files: {
      ledger: 'data/counties/kisumu/fiscal-ledger.json',
      audits: 'data/counties/kisumu/audits.json',
      population: 'data/counties/kisumu/population.json',
      conflicts: 'data/counties/kisumu/conflicts.json',
      indicators: 'data/counties/kisumu/indicators.json',
      geography: 'data/counties/kisumu/geography.json',
      abstract: 'data/counties/kisumu/abstract.json',
    },
    // Review preparation for the county (scripts/review-packs.js --county, scripts/machine-check.js --county).
    review: {
      packs_json: 'data/counties/kisumu/review-packs.json',
      packs_md: 'docs/editorial/packs/kisumu',
      machine_checks: 'data/counties/kisumu/machine-checks.json',
    },
    research: 'docs/research/kisumu-2026-11-27/kisumu-sources.json',
    // Published pages (app/counties/[slug]/<page>/; '' is the hub) and the file kinds they may show.
    // Boundary files of the geography kind (simplified for display; scripts/build-county-geo.py).
    geo: { wards: 'data/counties/kisumu/wards-geo.json', constituencies: 'data/counties/kisumu/constituencies-geo.json' },
    pages: ['', 'ledger', 'audits', 'people', 'indicators', 'wards', 'sources'],
    public_kinds: ['ledger', 'audits', 'population', 'conflicts', 'indicators', 'geography'],
  },
};

const slugs = () => Object.keys(COUNTY_DATA);
const state = (slug) => stateOf(slug);
const legacy = (slug) => !COUNTY_DATA[slug].layout.startsWith('data/counties/');
// Held: draft or reviewable. NOT_YET_ON_PAGES is kept as the old name of the same list.
const HELD = slugs().filter((s) => state(s) !== 'published');
const NOT_YET_ON_PAGES = HELD;
// Published counties whose pages come from the registry (Siaya's legacy pages are its own routes).
const ON_PAGES = slugs().filter((s) => state(s) === 'published' && !legacy(s));
const pages = (slug) => (COUNTY_DATA[slug].pages || []);
const isPublicKind = (slug, kind) => state(slug) === 'published' && (legacy(slug) || (COUNTY_DATA[slug].public_kinds || []).includes(kind));
// bySlug is used to keep lib/counties.js and the state list in step (scripts/test-unpublished-counties.js).
const listedPublished = (slug) => Boolean((bySlug(slug) || {}).published);
const has = (slug, kind) => Boolean(COUNTY_DATA[slug] && COUNTY_DATA[slug].files[kind]);
const file = (slug, kind) => {
  if (!has(slug, kind)) throw new Error(`county-registry: no ${kind} file for ${slug}`);
  return COUNTY_DATA[slug].files[kind];
};
const abs = (rel) => path.join(ROOT, rel);
const load = (slug, kind) => JSON.parse(fs.readFileSync(abs(file(slug, kind)), 'utf8'));
const schema = (kind) => JSON.parse(fs.readFileSync(abs(KINDS[kind].schema), 'utf8'));
// Counties that hold a file of this kind, Siaya first.
const withKind = (kind) => slugs().filter((s) => has(s, kind));
// Directory of an unpublished county's files (everything under it is held back from the site).
const heldDir = (slug) => (COUNTY_DATA[slug].layout.startsWith('data/counties/') ? COUNTY_DATA[slug].layout : null);

module.exports = { COUNTY_DATA, KINDS, STATES, NOT_YET_ON_PAGES, HELD, ON_PAGES, slugs, state, legacy, pages, isPublicKind, listedPublished, has, file, abs, load, schema, withKind, heldDir, ROOT };
