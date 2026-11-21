#!/usr/bin/env node
// Data freshness check (WO-09). For each dataset in the catalogue (lib/explore.js catalogue()), compares the latest
// period covered with the publisher's release cadence and flags datasets whose next edition should already be out.
// Offline: it reads the catalogue only, never the network, and never changes data files.
//
// Rule: next_due = end of the latest period covered + one cadence interval + the publisher's usual lag.
// "overdue" when today is past next_due + grace; "due" within 60 days of the due date of next_due; otherwise "current".
// Cadence and lag are stated per publisher below, with where the cadence comes from. Lags marked "working
// assumption" are Takwimu's estimate of normal publication delay, not a published commitment.
//
// Usage: node scripts/ops/freshness.js [--catalogue F.json] [--today YYYY-MM-DD] [--out docs/ops/freshness.md]
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const GRACE_DAYS = 30;
const SOON_DAYS = 60;

// Ordered: the first rule whose test matches the dataset wins.
const RULES = [
  { key: 'internal', test: (d) => /^Takwimu/.test(d.source) || ['source-conflicts', 'kenya-derived-measures', 'siaya-analysis'].includes(d.id),
    publisher: 'Takwimu (compiled or calculated)', cadence: null, basis: 'Rebuilt from other datasets at every release; freshness follows its inputs.' },
  { key: 'static', test: (d) => d.id === 'siaya-ward-boundaries',
    publisher: 'American Red Cross (HDX)', cadence: null, basis: 'One-off boundary layer (2016 vintage); changes only when IEBC gazettes new boundaries.' },
  { key: 'composite', test: (d) => ['siaya-health', 'siaya-education', 'siaya-agriculture', 'siaya-climate', 'siaya-projects', 'siaya-programmes', 'siaya-sub-counties'].includes(d.id),
    publisher: 'Several publishers', cadence: null, basis: 'Built from documents with different cadences (surveys, plans, reports); assess each source in docs/ops/source-health.md and the dataset notes.' },
  { key: 'wdi-irregular', test: (d) => d.source === 'World Bank WDI' && (/gini|poverty|enrolment|account-ownership/.test(d.id) || medianGap(d.years) > 1),
    publisher: 'World Bank WDI', cadence: null, basis: 'Survey-based indicator (household, Findex or school surveys): no fixed cadence; check the WDI release notes.' },
  { key: 'wdi', test: (d) => d.source === 'World Bank WDI',
    publisher: 'World Bank WDI', cadence: { months: 12, lag: 18 }, basis: 'Annual values; WDI is refreshed several times a year (World Bank data release calendar). Lag of 18 months after year end is a working assumption.' },
  { key: 'cbk-daily', test: (d) => d.id === 'cbk-fx-reserves',
    publisher: 'Central Bank of Kenya', cadence: { days: 7, lagDays: 14 }, basis: 'Weekly Bulletin (CBK, published every Friday). Lag of 14 days is a working assumption.' },
  { key: 'cbk-annual', test: (d) => d.source === 'Central Bank of Kenya' && /^\d{4}$/.test(String(d.period.to)),
    publisher: 'Central Bank of Kenya / KNBS', cadence: { months: 12, lag: 6 }, basis: 'Annual GDP from the KNBS Economic Survey (published each April to May). Lag of 6 months after year end.' },
  { key: 'cbk-monthly', test: (d) => d.source === 'Central Bank of Kenya',
    publisher: 'Central Bank of Kenya', cadence: { months: 1, lag: 2 }, basis: 'Monthly statistical series on centralbank.go.ke (Statistics pages). Lag of 2 months is a working assumption; public debt and fiscal tables can lag longer.' },
  { key: 'oag', test: (d) => /Auditor-General/.test(d.source) && !/Controller of Budget/.test(d.source),
    publisher: 'Office of the Auditor-General', cadence: { months: 12, lag: 6 }, basis: 'Annual audit of each county entity; Constitution Art. 229(4) and Public Audit Act 2015: report within six months after the end of the financial year.' },
  { key: 'cob', test: (d) => /Controller of Budget/.test(d.source),
    publisher: 'Controller of Budget', cadence: { months: 12, lag: 9 }, basis: 'County Budget Implementation Review Reports: quarterly and annual (PFM Act s.39 and Controller of Budget Act). Datasets here use the annual report; lag of 9 months after 30 June is a working assumption based on past release dates.' },
  { key: 'knbs-gcp', test: (d) => d.source === 'KNBS',
    publisher: 'KNBS (Gross County Product)', cadence: { months: 12, lag: 12 }, basis: 'Gross County Product report, annual since 2019; each edition covers to the previous calendar year (GCP 2025 covers 2024).' },
  { key: 'ibp', test: (d) => /IBP|International Budget Partnership/.test(d.source),
    publisher: 'International Budget Partnership', cadence: { months: 24, lag: 9 }, basis: 'Open Budget Survey and County Budget Transparency Survey: biennial rounds (IBP). Lag of 9 months after the round year is a working assumption.' },
  { key: 'cra', test: (d) => /Commission on Revenue Allocation/.test(d.source),
    publisher: 'Commission on Revenue Allocation', cadence: { months: 12, lag: -16 }, basis: 'Annual recommendation on revenue sharing for the coming financial year (Constitution Art. 216, PFM Act s.190), released ahead of the year it covers.' },
  { key: 'iebc', test: (d) => /IEBC/.test(d.source),
    publisher: 'IEBC', cadence: { months: 60, lag: 3 }, basis: 'General election every five years (Constitution Art. 101; next on the second Tuesday of August 2027). Voter register and candidate counts follow each election.' },
];

function medianGap(years) {
  const y = [...new Set(years || [])].sort((a, b) => a - b);
  if (y.length < 3) return y.length < 2 ? Infinity : y[1] - y[0];
  const g = y.slice(1).map((v, i) => v - y[i]).sort((a, b) => a - b);
  return g[Math.floor(g.length / 2)];
}

// End date (UTC) of a period label: "2024", "FY 2024/25", "2026-10", "2026-11-12".
function periodEnd(label) {
  const s = String(label).trim();
  let m;
  if ((m = s.match(/^FY\s*(\d{4})\/(\d{2,4})$/))) return new Date(Date.UTC(Number(m[1]) + 1, 5, 30));
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{4})-(\d{2})$/))) return new Date(Date.UTC(+m[1], +m[2], 0));
  if ((m = s.match(/^(\d{4})$/))) return new Date(Date.UTC(+m[1], 11, 31));
  return null;
}
const addMonths = (d, n) => { const x = new Date(d); const day = x.getUTCDate(); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n); const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate(); x.setUTCDate(Math.min(day, last)); return x; };
const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
const iso = (d) => (d ? d.toISOString().slice(0, 10) : '');

// Latest period actually covered. For plain-year ranges the catalogue's period.to can be the request range
// (World Bank asks to 2025), so the last year with data (max of years) is used when it is earlier.
function latestCovered(d) {
  const to = String(d.period && d.period.to != null ? d.period.to : '');
  if (/^\d{4}$/.test(to) && Array.isArray(d.years) && d.years.length) {
    const y = Math.max(...d.years);
    if (y < Number(to)) return String(y);
  }
  return to;
}

function assess(catalogue, today) {
  const now = new Date(`${today}T00:00:00Z`);
  return catalogue.map((d) => {
    const rule = RULES.find((r) => r.test(d)) || { key: 'unknown', publisher: d.source, cadence: null, basis: 'No cadence rule: add one to scripts/ops/freshness.js.' };
    const latest = latestCovered(d);
    const end = periodEnd(latest);
    const row = { id: d.id, title: d.title, source: d.source, rule: rule.key, publisher: rule.publisher, basis: rule.basis, latest, latest_end: iso(end), next_due: '', status: 'not assessed', days_overdue: 0 };
    if (!rule.cadence) { row.status = rule.key === 'unknown' ? 'no rule' : 'not assessed'; return row; }
    if (!end) { row.status = 'unparsed period'; return row; }
    const c = rule.cadence;
    const due = c.days ? addDays(addDays(end, c.days), c.lagDays) : addMonths(addMonths(end, c.months), c.lag);
    row.next_due = iso(due);
    row.cadence = c.days ? `every ${c.days} days, lag ${c.lagDays} days` : `every ${c.months} months, lag ${c.lag} months`;
    const grace = c.days ? 7 : GRACE_DAYS;
    const late = Math.floor((now - due) / 864e5);
    if (late > grace) { row.status = 'overdue'; row.days_overdue = late; }
    else if (late > -SOON_DAYS) row.status = 'due';
    else row.status = 'current';
    return row;
  });
}

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');
function report(rows, today) {
  const n = (s) => rows.filter((r) => r.status === s).length;
  const L = ['# Data freshness', ''];
  L.push(`Generated by \`scripts/ops/freshness.js\` on ${today} from the dataset catalogue (\`lib/explore.js\`). Offline: no network, no data file changed. "Overdue" means the next edition should already be out by the publisher's cadence; check the publisher and, if a new edition exists, open an update in the research workflow. It does not mean the site is wrong.`, '');
  L.push(`Rule: next due = end of the latest period covered + one cadence interval + the usual publication lag. Overdue after ${GRACE_DAYS} days' grace (7 for weekly series); "due" from ${SOON_DAYS} days before the date until the grace ends.`, '');
  L.push('## Summary', '', '| Status | Datasets |', '|---|---:|');
  ['overdue', 'due', 'current', 'not assessed', 'no rule', 'unparsed period'].forEach((s) => L.push(`| ${s} | ${n(s)} |`));
  L.push(`| total | ${rows.length} |`, '');
  const sorted = [...rows].sort((a, b) => b.days_overdue - a.days_overdue || a.id.localeCompare(b.id));
  L.push('## Overdue', '');
  const od = sorted.filter((r) => r.status === 'overdue');
  if (!od.length) L.push('None.', '');
  else { L.push('| Dataset | Publisher | Latest covered | Next due | Days overdue |', '|---|---|---|---|---:|'); od.forEach((r) => L.push(`| ${r.id} | ${esc(r.publisher)} | ${esc(r.latest)} | ${r.next_due} | ${r.days_overdue} |`)); L.push(''); }
  L.push('## All datasets', '', '| Dataset | Status | Latest covered | Next due | Cadence | Publisher |', '|---|---|---|---|---|---|');
  sorted.forEach((r) => L.push(`| ${r.id} | ${r.status} | ${esc(r.latest)} | ${r.next_due} | ${esc(r.cadence || '')} | ${esc(r.publisher)} |`));
  L.push('', '## Cadence basis', '', '| Rule | Publisher | Basis |', '|---|---|---|');
  const seen = new Set();
  rows.forEach((r) => { if (!seen.has(r.rule)) { seen.add(r.rule); L.push(`| ${r.rule} | ${esc(r.publisher)} | ${esc(r.basis)} |`); } });
  L.push('');
  return L.join('\n');
}

function main(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[i + 1];
  const today = a.today || new Date().toISOString().slice(0, 10);
  const catalogue = a.catalogue ? JSON.parse(fs.readFileSync(a.catalogue, 'utf8')) : require(path.join(ROOT, 'lib/explore.js')).catalogue();
  const rows = assess(catalogue, today);
  const out = path.resolve(a.out || path.join(ROOT, 'docs/ops/freshness.md'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, report(rows, today));
  console.log(`freshness: ${rows.length} datasets; overdue ${rows.filter((r) => r.status === 'overdue').length}, due ${rows.filter((r) => r.status === 'due').length}. Report: ${path.relative(process.cwd(), out)}`);
  return rows;
}

if (require.main === module) main(process.argv.slice(2));
module.exports = { assess, report, periodEnd, latestCovered, RULES, main };
