// Where each county's data files live, which schema each reuses, and which counties are not yet on pages
// (docs/adr-0001-multi-county-data.md). Siaya keeps its original file names (data/siaya-*.json, data/history.json),
// so nothing published about Siaya moves; every other county keeps its files under data/counties/<slug>/ with the
// same file kinds and the same schemas. The tests (scripts/test-fiscal-ledger.js, scripts/test-audits.js,
// scripts/test-county-reconciliation.js, scripts/test-unpublished-counties.js) loop over this registry.
//
// NOT_YET_ON_PAGES: counties whose data layer exists but whose pages do not. No file of theirs may be copied to
// public/data/, imported by a page or component, or appear in dist/ (scripts/test-unpublished-counties.js).
// A county leaves the list only when lib/counties.js marks it published and its pages exist.
// CommonJS: the build scripts and the tests read the same list. Server and build only.
const fs = require('fs');
const path = require('path');
const { bySlug } = require('./counties');

const ROOT = path.join(__dirname, '..');

// File kinds: the schema each reuses and its review-dataset name (lib/county-review.js).
const KINDS = {
  ledger: { schema: 'schemas/siaya-fiscal-ledger.schema.json', label: 'fiscal reconciliation ledger (core fiscal series)' },
  audits: { schema: 'schemas/siaya-audits.schema.json', label: 'Auditor-General opinions (and findings when coded)' },
  population: { schema: 'schemas/county-population.schema.json', label: 'population and per-capita denominator' },
  conflicts: { schema: 'schemas/conflicts.schema.json', label: 'source conflict register' },
};

const COUNTY_DATA = {
  siaya: {
    code: 41,
    layout: 'legacy (data/siaya-*.json, data/history.json); unchanged',
    files: { ledger: 'data/siaya-fiscal-ledger.json', audits: 'data/siaya-audits.json', conflicts: 'data/conflicts.json' },
  },
  kisumu: {
    code: 42,
    layout: 'data/counties/kisumu/',
    files: {
      ledger: 'data/counties/kisumu/fiscal-ledger.json',
      audits: 'data/counties/kisumu/audits.json',
      population: 'data/counties/kisumu/population.json',
      conflicts: 'data/counties/kisumu/conflicts.json',
    },
    // Review preparation for the county (scripts/review-packs.js --county, scripts/machine-check.js --county).
    review: {
      packs_json: 'data/counties/kisumu/review-packs.json',
      packs_md: 'docs/editorial/packs/kisumu',
      machine_checks: 'data/counties/kisumu/machine-checks.json',
    },
    research: 'docs/research/kisumu-2026-11-27/kisumu-sources.json',
  },
};

const slugs = () => Object.keys(COUNTY_DATA);
const NOT_YET_ON_PAGES = slugs().filter((s) => !(bySlug(s) || {}).published);
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

module.exports = { COUNTY_DATA, KINDS, NOT_YET_ON_PAGES, slugs, has, file, abs, load, schema, withKind, heldDir, ROOT };
