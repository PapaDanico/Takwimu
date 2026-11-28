// Release state of each county that has a data layer (docs/adr-0001-multi-county-data.md; handover E03/E05).
// The state is set here by hand, never derived from another flag, and the guard (scripts/test-unpublished-counties.js)
// checks routes and built output against it. Fail closed: a county missing from this list is "draft".
//   draft       data layer in progress; no route, no page, nothing in dist/
//   reviewable  data complete enough for independent review in staging; review records may be added to
//               data/reviews.json, but still no route, no page and nothing in dist/
//   published   pages exist (lib/county-registry.js `pages`); only the kinds in `public_kinds` may reach dist/
// Approval of a value (data/reviews.json) and publication of a county are separate events: a published county shows
// unreviewed values labelled "Provisional: awaiting editorial review", exactly as Siaya does.
// CommonJS, no other imports: lib/counties.js and lib/county-registry.js both read it.
const STATES = ['draft', 'reviewable', 'published'];
const COUNTY_STATE = {
  siaya: 'published',
  kisumu: 'published',
};
const stateOf = (slug) => (STATES.includes(COUNTY_STATE[slug]) ? COUNTY_STATE[slug] : 'draft');
module.exports = { STATES, COUNTY_STATE, stateOf };
