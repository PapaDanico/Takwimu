// Dataset status and version stamp for the catalogue (/datasets/, data/datasets/catalogue.json, CSV downloads).
// Status is derived from what the data files already record (conflict register, modelled-estimate notes, how values
// were read); nothing is judged by hand here. Version is a short content hash of the data file the dataset is built
// from, so a download can be matched to the file it came from. Server and build only (reads the data files).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const conflicts = require('../data/conflicts.json');
const nat = require('../data/national.json');
const { UNVERIFIED } = require('./unverified');

// The vocabulary, most cautious first. A dataset gets the first status whose rule applies.
const STATUS_VOCABULARY = [
  { status: 'unavailable', definition: 'No value could be published: the dataset is listed so the gap is visible.' },
  { status: 'superseded', definition: 'Replaced by a later release or dataset, which is named; kept for reference.' },
  { status: 'disputed', definition: 'At least one value has an open case in the conflict register: two documents, or two readings, disagree. Both values are kept.' },
  { status: 'estimated', definition: 'The publisher describes the values (or some of them) as modelled, estimated, interpolated or projected.' },
  { status: 'provisional', definition: 'Read by OCR from scanned tables, computed by Takwimu, or a recommendation not yet enacted, and not yet checked by a reviewer.' },
  { status: 'verified', definition: 'Taken as published from the publisher’s machine-readable file or API, with no transcription by Takwimu and no open case in the register. Verified means traced to the publisher, not independently audited.' },
];
const STATUSES = STATUS_VOCABULARY.map((s) => s.status);

// Data file each dataset is built from (data/<file>). Unknown ids fail the build (scripts/test-explore.js).
const fileOf = (id) => (id === 'kenya-cpi' ? 'cpi.json' : id === 'kenya-derived-measures' ? 'derived.json' : id.startsWith('kenya-') ? 'national.json'
  : id.startsWith('counties-') ? 'counties-cob.json' : id === 'siaya-ten-year-history' ? 'history.json' : id === 'siaya-economy' ? 'siaya-economy.json' : id === 'siaya-governance' ? 'siaya-governance.json' : id === 'source-conflicts' ? 'conflicts.json'
    : id === 'siaya-sub-counties' ? 'subcounties.json' : id.startsWith('cbk-') ? 'cbk.json' : /^(cra|ibp)-/.test(id) ? 'ngo.json' : id.startsWith('iebc-') ? 'political.json' : null);
// Content hash of the file as stored (SHA-256, first 10 hex digits). Builds run from the project root.
const versions = {};
const versionOf = (file) => {
  if (!versions[file]) versions[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(process.cwd(), 'data', file))).digest('hex').slice(0, 10);
  return versions[file];
};

// Open register cases and the datasets whose values they concern. Cases not named here are Siaya figures.
const CASE_DATASETS = {
  'registered-voters-2022': ['iebc-registered-voters-2022'],
  'deposit-rate-cbk-wdi': ['kenya-deposit-rate-wb', 'cbk-interest-rates'],
  'candidates-2022-woman-member': ['iebc-candidates-2022'],
  // Siaya's row in the 47-county tables differs from history.json; the validator requires these cases.
  'budget-2024-25': ['siaya-ten-year-history', 'counties-budget-spending'],
  'recurrent-absorption-2024-25': ['siaya-ten-year-history', 'counties-absorption'],
  'recurrent-absorption-2023-24': ['siaya-ten-year-history', 'counties-absorption'],
  'budget-financing-osr-2024-25': ['siaya-ten-year-history', 'counties-own-source-revenue'],
  'pending-close-2025': ['siaya-ten-year-history', 'counties-pending-bills'],
  'pending-2024': ['siaya-ten-year-history', 'counties-pending-bills'],
  'pending-2023': ['siaya-ten-year-history', 'counties-pending-bills'],
  'pending-close-2022': ['siaya-ten-year-history', 'counties-pending-bills'],
};
const openCases = conflicts.conflicts.filter((c) => c.status === 'open');
const casesFor = (id) => (id === 'source-conflicts' ? openCases : openCases.filter((c) => (CASE_DATASETS[c.id] || ['siaya-ten-year-history']).includes(id))).map((c) => c.id);
const MODELLED = /model|estimate|projection|interpolat/i;
const UNVERIFIED_GROUP = { development_absorption_pct: 'counties-absorption', overall_absorption_pct: 'counties-absorption', osr_performance_pct: 'counties-own-source-revenue' };

function datasetStatus(d, rows) {
  const unverified = UNVERIFIED.filter((u) => UNVERIFIED_GROUP[u.key] === d.id).length;
  const ocr = d.id.startsWith('counties-') ? ` Values were read by OCR and not yet checked against the page images by a reviewer${unverified ? `; ${unverified} cell${unverified > 1 ? 's are' : ' is'} shown as not yet verified` : ''}.` : '';
  if (rows && rows.length && rows.some((r) => 'value' in r) && rows.every((r) => r.value === null || r.value === undefined)) return { status: 'unavailable', status_reason: 'No row has a published value.' };
  if (d.superseded_by) return { status: 'superseded', status_reason: `Replaced by ${d.superseded_by}.` };
  const cases = casesFor(d.id);
  if (cases.length) return { status: 'disputed', status_reason: `${cases.length} open case${cases.length > 1 ? 's' : ''} in the conflict register (${cases.join(', ')}).${ocr}` };
  const wdi = d.id.startsWith('kenya-') && d.id !== 'kenya-cpi' && nat.indicators.find((x) => d.source_url === x.api_url);
  if (wdi && MODELLED.test(wdi.modelled_or_estimated_note || '')) return { status: 'estimated', status_reason: `The World Bank notes: ${wdi.modelled_or_estimated_note}` };
  if (d.id === 'cra-revenue-sharing') return { status: 'estimated', status_reason: 'Later years in the CRA table are projections (flag column).' };
  if (d.id === 'siaya-sub-counties') return { status: 'estimated', status_reason: 'Population for 2022 to 2027 is the county plan’s own projection from the 2019 census.' };
  if (ocr) return { status: 'provisional', status_reason: ocr.trim() };
  if (d.id === 'siaya-economy') return { status: 'provisional', status_reason: 'Transcribed by Takwimu from the KNBS report tables (PDF text layer; one chart label by OCR) and not yet checked by a reviewer. KNBS also marks 2024 as provisional.' };
  if (d.id === 'siaya-governance') return { status: 'provisional', status_reason: 'Transcribed by Takwimu from the IBP Kenya and APRM PDFs (some availability icons read by colour) and not yet checked by a reviewer. Three inconsistencies between the IBP editions are kept side by side, unresolved.' };
  if (d.id === 'kenya-derived-measures') return { status: 'provisional', status_reason: 'Computed by Takwimu from published series (formula per row); not published by a source.' };
  if (d.id === 'kenya-cpi') return { status: 'provisional', status_reason: 'Calendar-year index as published; the fiscal-year averages are computed by Takwimu.' };
  if (d.id === 'cra-county-allocations-2026-27') return { status: 'provisional', status_reason: 'A CRA recommendation to Parliament, not the enacted County Allocation of Revenue Act.' };
  return { status: 'verified', status_reason: 'Taken as published from the publisher’s file or API; no open case in the conflict register.' };
}

module.exports = { STATUS_VOCABULARY, STATUSES, fileOf, versionOf, datasetStatus, CASE_DATASETS };
