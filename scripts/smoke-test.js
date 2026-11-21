// End-to-end smoke test: serves dist/ with the production CSP and checks routes, charts, table views,
// keyboard focus, downloads and CSP violations. Needs Playwright installed outside the project. Usage: node scripts/smoke-test.js [dist-dir]
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Playwright is not installed. It is deliberately not a project dependency, so Netlify builds stay light.\nInstall it outside the project (npm i -g playwright && npx playwright install chromium) and run again with NODE_PATH set to the global modules.');
  process.exit(2);
}
const http = require('http');
const fs = require('fs');
const { natIndicators } = require('../lib/explore');
const NAT_WITH_VALUES = natIndicators.filter((x) => x.hasValues).length;
const NAT_PF = natIndicators.filter((x) => x.hasValues && x.sector === 'public finance').length;
const path = require('path');
const toml = fs.readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8');
const csp = (toml.match(/Content-Security-Policy = "([^"]+)"/) || [])[1];
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
// .txt follows the netlify.toml rule for Next route payloads (text/x-component), checked below.
const txtType = /for = "\/\*\/index\.txt"[\s\S]*?Content-Type = "text\/x-component"/.test(toml) ? 'text/x-component' : 'text/plain';
const types = { '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': txtType };
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed += 1; console.error('FAIL', msg); } else console.log('ok  ', msg); };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(root, p), (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'text/html', 'content-security-policy': csp }); res.end(d);
  });
}).listen(0, async () => {
  const base = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  const pg = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  const bad = [];
  pg.on('console', (m) => { if (/content security policy|refused to/i.test(m.text())) bad.push(m.text()); });
  pg.on('pageerror', (e) => bad.push(String(e)));
  for (const u of ['/', '/counties/', '/counties/siaya/', '/counties/siaya/pulse/', '/counties/siaya/economy/', '/counties/siaya/governance/', '/counties/siaya/audits/', '/counties/siaya/ledger/', '/counties/siaya/sources/', '/counties/kisumu/', '/insights/', '/analytics/', '/subcounties/', '/profile/', '/learn/', '/faq/', '/method/', '/data/', '/terms/', '/privacy/', '/explore/', '/datasets/', '/kenya/', '/compare/', '/stories/', '/stories/county-budget-absorption/', '/stories/population-and-towns/', '/stories/own-source-revenue/', '/briefs/request/']) {
    const r = await pg.goto(base + u, { waitUntil: 'load' });
    check(r.status() === 200, `${u} loads`);
    check((await pg.locator('main h1').count()) === 1, `${u} has one h1`);
  }
  await pg.goto(base + '/counties/siaya/pulse/', { waitUntil: 'load' });
  check(await pg.locator('main section h2[id^=pulse-]').count() === 5 && await pg.locator('main ul.how li a[href$="/content"]').count() >= 6 && await pg.locator('figure.chart').count() === 1 && await pg.locator('a[href="/counties/siaya/brief/"]').count() >= 1, 'Siaya Fiscal Pulse: three findings with source PDF links, one chart and a link to the brief');
  const pulseDet = pg.locator('details.tableview').first();
  await pulseDet.locator('summary').click();
  check(await pulseDet.locator('table.data tbody tr').count() >= 10, 'Fiscal Pulse chart has a table view');
  // Siaya topic pages (health, education, agriculture, wards, climate, analysis): each loads, carries the provisional
  // label, is linked from the hub, and every chart has a table view that opens with rows.
  const TOPICS = { health: 2 + 1, education: 2, agriculture: 2, wards: 0, climate: 0, analysis: 3, projects: 1, programmes: 1 };
  for (const [slug, charts] of Object.entries(TOPICS)) {
    const u = `/counties/siaya/${slug}/`;
    const r = await pg.goto(base + u, { waitUntil: 'load' });
    check(r.status() === 200 && (await pg.locator('main h1').count()) === 1, `${u} loads with one h1`);
    check(/Provisional: awaiting editorial review/i.test(await pg.locator('main .provisional').first().innerText()), `${u}: labelled "Provisional: awaiting editorial review"`);
    const figs = pg.locator('main figure.chart');
    const n = await figs.count();
    let tv = 0;
    for (let i = 0; i < n; i += 1) {
      const det = figs.nth(i).locator('details.tableview');
      if (await det.count() === 1) { await det.locator('summary').click(); if (await det.locator('table.data tbody tr').count() >= 1) tv += 1; }
    }
    check(n === charts && tv === n, `${u}: ${charts} chart(s), each with a table view that opens with rows (found ${n}, ${tv} with tables)`);
    check(await pg.locator('main td a[href^="https://"], main small.cite a[href^="https://"]').count() >= 1, `${u}: values link to their source documents`);
  }
  {
    const hJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-health.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/health/', { waitUntil: 'load' });
    const other = await pg.locator('#hiv-other').innerText();
    check(/Sentinel site: not county-representative/i.test(other) && /Secondary report/i.test(other), 'health: the sentinel-site value is flagged as not county-representative and the press figure as a secondary report');
    check(await pg.locator('#hiv-rounds tbody tr').count() === hJson.observations.filter((o) => o.measure === 'hiv-prevalence' && o.geography === 'county' && o.confidence > 1).length && !/Sentinel/i.test(await pg.locator('#hiv-rounds').innerText()), 'health: HIV estimate rounds are listed one per row, without the sentinel-site value');
    check(await pg.locator('#press tbody tr').count() >= 3 && await pg.locator('main .conflict').count() === hJson.conflicts.length, 'health: press figures listed as secondary reports; every conflict set shown side by side');
    const eJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-education.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/education/', { waitUntil: 'load' });
    check(await pg.locator('#devolved tbody tr').count() === eJson.observations.filter((o) => o.function === 'devolved').length && await pg.locator('#national tbody tr').count() === eJson.observations.filter((o) => o.function === 'national').length, 'education: devolved and national functions in separate tables, every value listed');
    check(await pg.locator('ol.conflicts > li.conflict').count() === 10, 'education: the ten source inconsistencies are shown side by side');
    const aJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-agriculture.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/agriculture/', { waitUntil: 'load' });
    const tg = await pg.locator('#targets tbody tr').count();
    check(tg === aJson.observations.filter((o) => o.status !== 'observed').length && !/Target, not observed/i.test(await pg.locator('#obs-crops').innerText()) && await pg.locator('#targets .tag').count() === tg, 'agriculture: targets only in their own labelled table, never with observed values');
    check(await pg.locator('main .conflict').count() === aJson.conflicts.length, 'agriculture: unit conflicts shown side by side');
    await pg.goto(base + '/counties/siaya/wards/', { waitUntil: 'load' });
    check(await pg.locator('#constituencies tbody tr').count() === 6 && await pg.locator('#wards tbody tr').count() === 30, 'wards: registry lists 6 constituencies and 30 wards');
    check(/not an official IEBC map/.test(await pg.locator('#ward-layer').innerText()) && /boundary changes since 2016 are not shown/.test(await pg.locator('#ward-layer').innerText()), 'wards: states the boundaries are the 2016 HDX layer, not an official IEBC map');
    const wm = pg.locator('figure.wmap');
    check(await wm.locator('path.wmap-ward').count() === 30, 'ward map: 30 ward shapes render');
    const vb0 = await wm.locator('svg.wmap-svg').getAttribute('viewBox');
    await wm.getByRole('button', { name: 'Zoom in' }).click();
    const vb1 = await wm.locator('svg.wmap-svg').getAttribute('viewBox');
    await wm.getByRole('button', { name: 'Zoom out' }).click();
    const vb2 = await wm.locator('svg.wmap-svg').getAttribute('viewBox');
    await wm.getByRole('button', { name: 'Zoom in' }).click();
    await wm.getByRole('button', { name: 'Reset map view' }).click();
    const vb3 = await wm.locator('svg.wmap-svg').getAttribute('viewBox');
    check(vb1 !== vb0 && vb2 !== vb1 && vb3 === vb0, 'ward map: zoom in, zoom out and reset change the view');
    const ward = wm.locator('path.wmap-ward').first();
    await ward.focus();
    check(await ward.evaluate((el) => el === document.activeElement && el.tabIndex >= 0) && /ward/i.test((await ward.getAttribute('aria-label')) || ''), 'ward map: a ward is keyboard-focusable with an accessible name');
    await wm.locator('details.tableview summary').click();
    check(await wm.locator('details.tableview table.data tbody tr').count() === 30 && /American Red Cross via HDX, CC BY, 2016/.test(await wm.innerText()), 'ward map: table view lists 30 wards; attribution shown');
    const cJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-climate.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/climate/', { waitUntil: 'load' });
    check(/prints no ranking of wards/.test(await pg.locator('#no-ranking').innerText()) && await pg.locator('#no-table + ul li').count() === 7, 'climate: says the PCRA prints no ward ranking and lists the 7 wards with no table');
    check(await pg.locator('#hotspots tbody tr').count() === cJson.observations.filter((o) => /^pcra-ward-/.test(o.series)).length && await pg.locator('#water-side tbody tr').count() >= 4, 'climate: every ward hotspot as printed; water figures side by side with definitions');
    check(await pg.locator('div[id^="money-"]').count() === 4 && /never added together/.test(await pg.locator('#money-kinds').innerText()), 'climate: allocation, receipt, transfer and expenditure in separate tables');
    check(/Flood impact counts/.test(await pg.locator('#gaps').innerText()) && /adaptation outcomes/.test(await pg.locator('#gaps').innerText()) && /Climate-tagged/.test(await pg.locator('#gaps').innerText()), 'climate: gaps listed (flood impact counts, adaptation outcomes, climate tagging)');
    const mainC = await pg.locator('main').innerText();
    check(!/(?:\+?254|\b0)[\s-]?7\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/.test(mainC), 'climate: no phone numbers on the page (PCRA Annex 1 personal data never shown)');
    const anJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-analysis.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/analysis/', { waitUntil: 'load' });
    check(/Calculated by Takwimu Kenya from published figures/i.test(await pg.locator('#calc-label').innerText()) && /context, not causation/.test(await pg.locator('#context-not-causation').innerText()), 'analysis: calculated label and "context, not causation" shown');
    check(await pg.locator('table.calc tbody tr').count() >= anJson.records.filter((r) => r.family !== 'A5' || r.flags.count_kind !== 'category' || r.status === 'gap').length && await pg.locator('#gap-list li').count() === anJson.records.filter((r) => r.status === 'gap').length, 'analysis: every record with its calc_id; every gap listed with its reason');
    check(await pg.locator('main a[href="/counties/siaya/wards/"]').count() >= 1, 'analysis: climate finance links to the ward map');
    // Project register: eight-state legend, reported beside audit-found, one verified project, filters, finding links.
    const pJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-projects.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/projects/', { waitUntil: 'load' });
    const usedStates = [...new Set(pJson.projects.map((x) => x.status))];
    check(usedStates.length === 8 && await pg.locator('#status-legend dt').count() === 8, 'projects: status legend lists the eight states in use');
    check(await pg.locator('main li.ds').count() === pJson.projects.length && new RegExp(`Showing ${pJson.projects.length} of ${pJson.projects.length}`).test(await pg.locator('#pr-count').innerText()), 'projects: every project is listed');
    const ver = pg.locator('main li.ds .tags .tag', { hasText: /^completed-independently-verified$/ });
    check(await ver.count() === 1 && await pg.locator('li#SIA-P-038 .tags .tag', { hasText: /^completed-independently-verified$/ }).count() === 1, 'projects: only SIA-P-038 is shown as independently verified');
    const opoda = await pg.locator('li#SIA-P-018').innerText();
    check(/Reported by the county/i.test(opoda) && /Found by the Auditor-General/i.test(opoda) && /100%/.test(opoda) && /20%/.test(opoda), 'projects: Opoda road shows the county report (100%) beside the audit finding (20%)');
    check(/Found by the Auditor-General/i.test(await pg.locator('li#SIA-P-036').innerText()), 'projects: Bondo mortuary shows reported and audit-found status side by side');
    check(await pg.locator('main li.ds a[href^="/counties/siaya/audits/#f-"]').count() >= 1, 'projects: audit finding ids link to the audit findings page');
    const selects = pg.locator('main .controls select');
    await selects.nth(1).selectOption('north-sakwa');
    const nsk = pJson.projects.filter((x) => x.location.ward_ids.includes('north-sakwa')).length;
    check(await pg.locator('main li.ds').count() === nsk && await selects.nth(1).locator('option').count() === 31, 'projects: the ward filter uses the 30 registry wards and narrows the list');
    await selects.nth(1).selectOption('');
    await selects.nth(2).selectOption('suspended');
    check(await pg.locator('main li.ds').count() === pJson.projects.filter((x) => x.status === 'suspended').length, 'projects: the status filter narrows the list');
    await selects.nth(2).selectOption('');
    await selects.nth(0).selectOption('health');
    check(await pg.locator('main li.ds').count() === pJson.projects.filter((x) => x.sector === 'health').length, 'projects: the sector filter narrows the list');
    // Owner decision: contractor company names never reach the published site.
    // A public utility also named as a programme implementer in the atlas is checked by field only, not by name.
    const progText = fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-programmes.json'), 'utf8');
    const names = pJson.projects.map((x) => x.contract.contractor && x.contract.contractor.name).filter(Boolean).filter((nm) => !progText.includes(nm));
    const walkDist = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkDist(path.join(d, e.name)) : [path.join(d, e.name)]));
    const leaks = walkDist(root).filter((f) => /\.(html|json|csv|txt|js)$/.test(f)).filter((f) => { const s = fs.readFileSync(f, 'utf8'); return /"contractor(_note)?"\s*:/.test(s) || /\bcontractor(_note)?,/.test(s.split('\n')[0] || '') || names.some((nm) => s.includes(nm)); });
    check(names.length >= 1 && leaks.length === 0, `no contractor field or contractor name reaches dist (withheld pending review)${leaks.length ? `: ${leaks.slice(0, 5).join(', ')}` : ''}`);
    // Programme atlas: Siaya-specific and pooled separated, pooled never summed, evidence badges, screened-out list.
    const gJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-programmes.json'), 'utf8'));
    await pg.goto(base + '/counties/siaya/programmes/', { waitUntil: 'load' });
    const spec = gJson.programmes.filter((x) => ['siaya_specific', 'siaya_wards_listed'].includes(x.geography.class));
    check(await pg.locator('#pg-specific tbody tr').count() === spec.length && await pg.locator('#pg-pooled tbody tr').count() === gJson.programmes.length - spec.length, 'programmes: Siaya-specific and multi-county or national programmes in separate tables');
    check(!/Pooled total/i.test(await pg.locator('#pg-specific').innerText()) && await pg.locator('#pg-pooled .tag', { hasText: /Pooled total/i }).count() === gJson.programmes.filter((x) => !['siaya_specific', 'siaya_wards_listed'].includes(x.geography.class)).reduce((s, x) => s + x.amounts.filter((a) => a.pooled).length, 0), 'programmes: every pooled amount is labelled and none appears among Siaya-specific amounts');
    check(gJson.summary.siaya_development_partner_grants_kes.every((x) => x.record_ids.every((id) => spec.some((s) => s.id === id))), 'programmes: Siaya totals are built only from Siaya-specific records (pooled never summed)');
    check(await pg.locator('main .tag', { hasText: /^(Planned|Self-reported|Independently evaluated)$/ }).count() >= gJson.programmes.length && await pg.locator('#screened li').count() === gJson.screened_out.length, 'programmes: evidence-type badges on every record; screened-out reports listed');
    await pg.goto(base + '/counties/siaya/', { waitUntil: 'load' });
    check(await Promise.all(Object.keys(TOPICS).map((s) => pg.locator(`main a[href="/counties/siaya/${s}/"]`).count())).then((c) => c.every((x) => x >= 1)), 'Siaya hub links to the eight Siaya topic pages');
    const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    check(Object.keys(TOPICS).every((s) => sm.includes(`/counties/siaya/${s}/`)), 'sitemap lists the eight Siaya topic pages');
  }
  // Siaya's economy (data/siaya-economy.json): two line charts and a column chart, each with a table view; revisions side by side.
  await pg.goto(base + '/counties/siaya/economy/', { waitUntil: 'load' });
  const ecoCharts = pg.locator('main figure.chart');
  check(await ecoCharts.count() === 3 && await pg.locator('main figure.chart details.tableview').count() === 3, "Siaya's economy: total (current and constant prices) and sector charts, each with a table view");
  for (let i = 0; i < 3; i += 1) await ecoCharts.nth(i).locator('details.tableview summary').click();
  check(await ecoCharts.nth(0).locator('table.data tbody tr').count() === 6 && await ecoCharts.nth(1).locator('table.data tbody tr').count() === 6 && await ecoCharts.nth(2).locator('table.data tbody tr').count() === 18, "Siaya's economy: table views open with every year and every activity");
  const revHead = await pg.locator('#revisions thead').innerText();
  check(/GCP 2024 edition/i.test(revHead) && /GCP 2025 edition/i.test(revHead) && await pg.locator('#revisions tbody tr').count() === 8, "Siaya's economy: revisions table shows both editions for the overlapping years");
  check(/County output is not county government revenue/.test(await pg.locator('#not-revenue').innerText()) && /No share of national GDP is published/.test(await pg.locator('main').innerText()), "Siaya's economy states that county output is not government revenue and that no GDP share is published");
  await pg.goto(base + '/counties/siaya/', { waitUntil: 'load' });
  check(await pg.locator('main a[href="/counties/siaya/economy/"]').count() >= 1, "Siaya hub links to Siaya's economy");
  check(await pg.locator('main a[href="/counties/siaya/governance/"]').count() >= 1, 'Siaya hub links to budget transparency and public participation');
  // Budget transparency and public participation (data/siaya-governance.json): two CBTS editions side by side, three unresolved inconsistencies, APRM findings by theme.
  const govJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-governance.json'), 'utf8'));
  await pg.goto(base + '/counties/siaya/governance/', { waitUntil: 'load' });
  const cbtsHead = await pg.locator('#cbts thead').innerText();
  const cbtsText = await pg.locator('#cbts').innerText();
  check(/CBTS 2021/.test(cbtsHead) && /CBTS 2022/.test(cbtsHead) && /45 out of 100/.test(cbtsText) && /48 out of 100/.test(cbtsText) && /7 of 10/.test(cbtsText) && /8 of 10/.test(cbtsText) && /No score printed for Siaya/.test(cbtsText), 'governance: CBTS 2021 and 2022 side by side, with index, documents of 10 and the missing 2021 participation score stated');
  check(await pg.locator('.conflict').count() === govJson.ibp_cbts.conflicts.length && govJson.ibp_cbts.conflicts.every((c) => c.resolution.startsWith('Unresolved')) && await pg.locator('.conflict table tbody tr').count() === govJson.ibp_cbts.conflicts.reduce((s, c) => s + c.positions.length, 0), 'governance: the IBP inconsistencies are shown side by side and unresolved');
  check(['participation', 'civic_education', 'feedback'].every((t) => govJson.aprm.findings.filter((f) => f.theme === t).length > 0) && await pg.locator('#aprm-participation li, #aprm-civic_education li, #aprm-feedback li, #aprm-transparency li').count() === govJson.aprm.findings.length, 'governance: every APRM finding is shown, grouped by theme, with its page');
  check(/not current practice/.test(await pg.locator('#survey-date').innerText()) && /Findings are not verdicts/.test(await pg.locator('#not-verdicts').innerText()), 'governance: says scores describe availability at the survey date and findings are not verdicts');
  // Audit findings (data/siaya-audits.json): opinions by year and entity, chart with table view, filterable findings, carried-forward matters, gaps.
  const audJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-audits.json'), 'utf8'));
  await pg.goto(base + '/counties/siaya/', { waitUntil: 'load' });
  check(await pg.locator('main a[href="/counties/siaya/audits/"]').count() >= 1 && await pg.locator('main a[href="/counties/siaya/ledger/"]').count() >= 1, 'Siaya hub links to audit findings and fiscal reconciliation');
  await pg.goto(base + '/counties/siaya/audits/', { waitUntil: 'load' });
  const opHead = await pg.locator('#opinions thead').innerText();
  const opText = await pg.locator('#opinions').innerText();
  check(/County Executive/i.test(opHead) && /County Assembly/i.test(opHead) && audJson.opinions.filter((o) => o.opinion).every((o) => opText.includes(o.opinion)), 'audits: every opinion as printed, Executive and Assembly in separate columns');
  check(/findings, not convictions/.test(await pg.locator('#not-convictions').innerText()) && /unavailable on 21 Nov 2026/.test(await pg.locator('#oag-unavailable').innerText()) && /2016\/17/.test(await pg.locator('#no-report').innerText()), 'audits: says findings are not convictions, the Auditor-General site was unavailable, and lists years with no report');
  check(/Provisional: awaiting editorial review/i.test(await pg.locator('main .provisional').innerText()), 'audits: labelled provisional, awaiting editorial review');
  check(await pg.locator('main li.ds').count() === audJson.findings.length && new RegExp(`Showing ${audJson.findings.length} of ${audJson.findings.length}`).test(await pg.locator('#aud-count').innerText()), 'audits: every finding is listed');
  const audChart = pg.locator('main figure.chart');
  check(await audChart.count() === 1 && await audChart.locator('details.tableview').count() === 1, 'audits: one category chart with a table view');
  const audSel = pg.locator('main select');
  await audSel.nth(0).selectOption('2023/24'); await audSel.nth(1).selectOption('county_assembly');
  const asm2324 = audJson.findings.filter((f) => f.fy === '2023/24' && f.entity === 'county_assembly').length;
  check(await pg.locator('main li.ds').count() === asm2324 && new RegExp(`Showing ${asm2324} of`).test(await pg.locator('#aud-count').innerText()), 'audits: filtering by year and entity narrows the list');
  await audSel.nth(2).selectOption('payroll');
  check(await pg.locator('main li.ds').count() === audJson.findings.filter((f) => f.fy === '2023/24' && f.entity === 'county_assembly' && f.category === 'payroll').length, 'audits: filtering by category narrows the list');
  check(await pg.locator('section[aria-labelledby="aud-carry"] details').count() >= 2 && await pg.locator('#carry-prior + ul li').count() === audJson.findings.filter((f) => f.unresolved_prior_year.flag).length, 'audits: carried-forward unresolved matters are listed per the reports');
  check(!/\b(Hon\.|H\.E\.|Mr\.|Mrs\.|Ms\.|Dr\.|M\/s)\s/.test(await pg.locator('main').innerText()), 'audits: no honorific (no individual named)');
  // Fiscal reconciliation (data/siaya-fiscal-ledger.json): completeness matrix, sources side by side, open discrepancy cases.
  const ledJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya-fiscal-ledger.json'), 'utf8'));
  await pg.goto(base + '/counties/siaya/ledger/', { waitUntil: 'load' });
  check(await pg.locator('#completeness tbody tr').count() === Object.keys(ledJson.measures).length && await pg.locator('#completeness thead th').count() === ledJson.years.length + 1, 'ledger: completeness matrix has every measure and year');
  check(/No averaging and no verdicts/.test(await pg.locator('#no-averaging').innerText()) && /cash/.test(await pg.locator('#why-differ').innerText()) && /FIF/.test(await pg.locator('#why-differ').innerText()), 'ledger: says no averaging or verdicts and explains why figures differ');
  check(/Provisional: awaiting editorial review/i.test(await pg.locator('main .provisional').innerText()), 'ledger: labelled provisional, awaiting editorial review');
  check(await pg.locator('#case-summary tfoot').innerText().then((t) => new RegExp(`${ledJson.discrepancies.length}\\s*$`).test(t.trim())), 'ledger: case summary accounts for every open case');
  const osrCases = ledJson.discrepancies.filter((d) => d.indicator_id === 'osr_total_actual').length;
  check(await pg.locator('#led-case-list > li').count() === osrCases && await pg.locator('#led-table a[href*="#page="]').count() >= 1, 'ledger: own-source revenue shows every source with page links and its open cases');
  await pg.locator('main select').first().selectOption('equitable_share_received');
  const esText = await pg.locator('#led-table').innerText();
  check(/6,680/.test(esText) && !/5,680/.test(esText) && await pg.locator('#led-case-list > li').count() === ledJson.discrepancies.filter((d) => d.indicator_id === 'equitable_share_received').length, 'ledger: choosing a measure switches the table and cases (FY 2023/24 equitable share shows the printed 6,680)');
  // Siaya Source Library: one card per record in data/source-library.json, client-side search and filters, no form fields beyond the search box.
  const libJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'source-library.json'), 'utf8'));
  await pg.goto(base + '/counties/siaya/sources/', { waitUntil: 'networkidle' });
  const libItems = pg.locator('main li.lib-item');
  const pgText = await pg.locator('section[aria-labelledby="lib-counts"]').innerText();
  check(await libItems.count() === libJson.documents.length && /Showing (\d+) of \1 records/.test(await pg.locator('#lib-count').innerText()), `source library lists every record (${libJson.documents.length})`);
  check(await pg.locator('main form, main select, main textarea').count() === 0 && await pg.locator('main input').count() === 1 && await pg.locator('main input[type="search"]').count() === 1, 'source library has no form element other than the search input');
  await pg.locator('main input[type="search"]').fill('Kenya News Agency');
  const nKna = libJson.documents.filter((d) => [d.document_id, d.title, d.publisher, d.document_type, d.reference_period, d.siaya_relevance, d.research_use, d.licence, d.retrieval_note].join(' ').toLowerCase().includes('kenya news agency')).length;
  check(nKna >= 1 && await libItems.count() === nKna && await pg.locator('#doc-MEDIA-01').count() === 1, `source library search filters (${nKna} match "Kenya News Agency")`);
  await pg.locator('main input[type="search"]').fill('');
  await pg.getByRole('button', { name: /^Blocked \(/ }).click();
  const nBlocked = libJson.documents.filter((d) => d.retrieval_status === 'blocked').length;
  check(await libItems.count() === nBlocked && await pg.getByRole('button', { name: /^Blocked \(/ }).getAttribute('aria-pressed') === 'true', `source library status filter shows the ${nBlocked} blocked records`);
  check(['downloaded', 'discovered', 'inaccessible', 'blocked'].every((s) => new RegExp(`${s}\\s+${libJson.documents.filter((d) => d.retrieval_status === s).length} of ${libJson.documents.length}`, 'i').test(pgText)), 'source library states the count for each retrieval status');
  await pg.goto(base + '/counties/siaya/', { waitUntil: 'load' });
  check(await pg.locator('main a[href="/counties/siaya/sources/"]').count() >= 1, 'Siaya hub links to the source library');
  // No personal data is collected (owner, 21 Nov 2026): /briefs/request/ describes the service with no form; the thanks page is gone.
  check(!fs.existsSync(path.join(root, 'briefs', 'request', 'thanks')), '/briefs/request/thanks/ is not built');
  await pg.goto(base + '/briefs/request/', { waitUntil: 'load' });
  check(await pg.locator('main form, main input, main textarea').count() === 0 && await pg.locator('main a[href="https://wa.me/message/GPPIKMENXJVWO1"]').count() === 1, 'request a brief page has no form or fields and links to the Danico Ventures WhatsApp chat');
  check(await pg.locator('header a.report[href="https://wa.me/message/GPPIKMENXJVWO1"]').count() === 1 && await pg.locator('a[href*="github.com"]').count() === 0, 'report-an-error links go to the WhatsApp chat, none to GitHub');
  await pg.goto(base + '/privacy/', { waitUntil: 'load' });
  const privText = (await pg.locator('main').innerText()).toLowerCase();
  check(['do not collect', 'odpc.go.ke', 'netlify', 'local storage', 'whatsapp'].every((t) => privText.includes(t)) && !/consent|24 months|data request/.test(privText), 'privacy notice says no personal data is collected, names Netlify and the ODPC, and has no form-era terms');
  await pg.goto(base + '/terms/', { waitUntil: 'load' });
  check(/CC BY 4\.0/.test(await pg.locator('main').innerText()) && await pg.locator('#nonpartisan').count() === 1, 'terms name third-party licences and the non-partisan policy');
  // No email address is published: no mailto: with an address and no address-shaped text in any built page.
  const htmlFiles = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith('.html')) htmlFiles.push(f); });
  walk(root);
  const leaks = htmlFiles.filter((f) => { const h = fs.readFileSync(f, 'utf8'); return /mailto:(?!\?)/i.test(h) || /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/.test(h); });
  check(htmlFiles.length > 20 && leaks.length === 0, `no email address in any built page (${htmlFiles.length} checked${leaks.length ? '; found in ' + leaks.slice(0, 3).map((f) => path.relative(root, f)).join(', ') : ''})`);
  // No form that collects personal data: no Netlify form, no POST/action form, no textarea, and inputs only of the filter types used by datasets/explore/compare.
  const dataForms = htmlFiles.filter((f) => { const h = fs.readFileSync(f, 'utf8'); return /data-netlify|netlify-honeypot|<textarea/i.test(h) || /<form[^>]*\s(method|action)=/i.test(h) || (h.match(/<input\b[^>]*>/gi) || []).some((t) => !/type="(search|radio|checkbox)"/i.test(t)); });
  check(dataForms.length === 0, `no built page has a Netlify form, posting form, textarea or personal-data input${dataForms.length ? ' (found in ' + dataForms.slice(0, 3).map((f) => path.relative(root, f)).join(', ') + ')' : ''}`);
  await pg.goto(base + '/insights/', { waitUntil: 'load' });
  const charts = await pg.locator('figure.chart').count();
  check(charts >= 5, `insights shows charts (${charts})`);
  const det = pg.locator('details.tableview').first();
  await det.locator('summary').click();
  check(await det.locator('table.data tbody tr').count() >= 10, 'table view opens with rows');
  await pg.locator('svg rect[tabindex]').first().focus();
  check(await pg.locator('.ctip').count() === 1, 'keyboard focus shows a tooltip');
  check(!(await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal overflow at 390px');
  const rfRows = await pg.locator('#rollforward tbody tr').count();
  const rfNp = await pg.locator('#rollforward .rf-np').count();
  const histJson = JSON.parse(fs.readFileSync(path.join(root, 'data', 'history.json'), 'utf8'));
  const npWant = histJson.pending_rollforward.years.reduce((s, r) => s + ['opening', 'new_bills', 'payments', 'adjustments', 'closing'].filter((k) => r[k].status === 'not published').length, 0);
  check(rfRows === histJson.pending_rollforward.years.length && rfNp === npWant, `roll-forward table shows every year (${rfRows}) and every unpublished term as "Not published" (${rfNp} of ${npWant})`);
  // Internal links navigate client-side (no full reload) when route payloads have the right type.
  await pg.goto(base + '/', { waitUntil: 'networkidle' });
  await pg.evaluate(() => { window.__noReload = true; });
  await pg.locator('.bottom-nav a[href="/learn/"]').click();
  await pg.waitForFunction(() => location.pathname.startsWith('/learn'), null, { timeout: 10000 }).catch(() => {});
  check(txtType === 'text/x-component' && (await pg.evaluate(() => window.__noReload === true)), 'netlify.toml serves route payloads as text/x-component, so links navigate without a full reload');
  await pg.goto(base + '/data/', { waitUntil: 'load' });
  const gapText = await pg.locator('#gaps').innerText();
  check(['FinAccess', 'Uwezo', 'NG-CDF', 'KNBS 2019 census'].every((g) => new RegExp(`Known gap: [^\\n]*${g}[^\\n]*\\n+[^\\n]*Retry quarterly`).test(gapText)), 'Data page lists FinAccess, Uwezo, NG-CDF and KNBS census as known gaps, each with a reason and "Retry quarterly"');
  const csv = await pg.request.get(base + '/data/history.csv');
  check(csv.ok() && (await csv.text()).startsWith('"indicator"'), 'history.csv served with header');
  const conf = await (await pg.request.get(base + '/data/conflicts.json')).json();
  check(conf.conflicts.length >= 10 && conf.conflicts.every((c) => c.verification_state), 'conflicts.json has verification states');

  // Explore pages (phase 2): URL state, ordered list and map, side by side, empty states, saved views, downloads.
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => bad.push(String(e)));
  p2.on('console', (m) => { if (/content security policy|refused to/i.test(m.text())) bad.push(m.text()); });
  await p2.goto(base + '/compare/', { waitUntil: 'networkidle' });
  check(await p2.locator('ul.rank > li').count() === 47, 'compare lists all 47 counties');
  check(await p2.locator('.kmap-values').first().locator('a').count() === 47, 'compare map shades all 47 counties');
  await p2.locator('select').first().selectOption('development_absorption_pct');
  await p2.waitForFunction(() => location.search.includes('i=development_absorption_pct'));
  check(/i=development_absorption_pct/.test(p2.url()), 'compare writes the indicator to the address');
  check(!(await p2.locator('input[type=radio][value=high]').isDisabled()) && /not a judgement of performance/.test(await p2.locator('.notice').first().innerText()), 'with every reading confirmed, the list orders by value and says the order is not a judgement of performance');
  const rankText = await p2.locator('ul.rank').innerText();
  check(!/Not yet verified/.test(rankText) && /Makueni[\s\S]{0,80}?71(\.\d)?\s*%/.test(rankText), 'cells confirmed by the third reading show their printed value, and none is left as not yet verified');
  check(/No county chosen yet/.test(await p2.locator('#side-h ~ .empty').innerText()), 'side by side shows an empty state with no county chosen');
  const add = p2.locator('select').last();
  for (const s of ['siaya', 'kisumu']) { await add.selectOption(s); await p2.getByRole('button', { name: 'Add', exact: true }).click(); }
  check(/c=siaya(%2C|,)kisumu/.test(p2.url()) && await p2.locator('#side-h ~ div table tbody tr').count() >= 10, 'two counties side by side, in the address');
  await p2.goto(base + '/compare/?c=siaya,kisumu,nakuru,kakamega,busia', { waitUntil: 'networkidle' });
  check(/At most 4 counties/.test(await p2.locator('.invalid').first().innerText()), 'more than four counties gives a validation message');
  const [dl] = await Promise.all([p2.waitForEvent('download'), p2.getByRole('group', { name: 'Download this list' }).getByRole('button', { name: 'CSV' }).click()]);
  const dlText = fs.readFileSync(await dl.path(), 'utf8');
  check(dlText.split('\n').filter(Boolean).length === 48 && dlText.startsWith('"fiscal_year"'), 'compare list downloads as CSV with 47 rows');
  await p2.getByRole('button', { name: 'Save this view' }).click();
  await p2.goto(base + '/datasets/?q=zzzz', { waitUntil: 'networkidle' });
  check(/No dataset matches/.test(await p2.locator('main').innerText()), 'datasets search shows an empty state');
  check(await p2.locator('#saved .saved-list li').count() === 1, 'saved view appears in the Saved views list');
  await p2.locator('#saved button', { hasText: 'Remove' }).click();
  check(await p2.locator('#saved .saved-list li').count() === 0, 'saved view can be removed');
  await p2.goto(base + '/datasets/?geo=county&source=Controller%20of%20Budget', { waitUntil: 'networkidle' });
  check(await p2.locator('.ds-list > li').count() >= 4, 'datasets filters read from the address');
  const dsCsv = await p2.request.get(base + '/data/datasets/counties-absorption.csv');
  const dsCsvText = dsCsv.ok() ? await dsCsv.text() : '';
  check(dsCsv.ok() && dsCsvText.includes('"Siaya"'), 'dataset CSV served');
  const cat = await (await p2.request.get(base + '/data/datasets/catalogue.json')).json();
  const absCat = cat.datasets.find((d) => d.id === 'counties-absorption');
  check(cat.status_vocabulary.length === 6 && cat.datasets.every((d) => d.status && /^[0-9a-f]{10}$/.test(d.version)) && dsCsvText.split('\n')[0].endsWith('"dataset_version"') && dsCsvText.split('\n')[1].endsWith(`"${absCat.version}"`), 'catalogue gives every dataset a status and version; the CSV carries the version');
  await p2.goto(base + '/datasets/?q=counties-absorption', { waitUntil: 'networkidle' });
  check((await p2.locator('#counties-absorption a.file').first().getAttribute('download')) === `counties-absorption-${absCat.version}.csv` && /disputed/i.test(await p2.locator('#counties-absorption').innerText()) && await p2.locator('#status dt').count() === 6, '/datasets/ shows status, version and the six-term status list; downloads are named with the version');
  await p2.goto(base + '/trends/?i=siaya-spending&basis=real', { waitUntil: 'networkidle' });
  await p2.waitForURL(/\/kenya\/\?i=siaya-spending&basis=real#trends/, { timeout: 10000 }).catch(() => {});
  check(/\/kenya\/\?i=siaya-spending&basis=real#trends$/.test(p2.url()), 'old /trends/ links move to the Kenya dashboard trend explorer with their choices');
  check(await p2.locator('#trends ~ section input[type=radio]').nth(1).isChecked() && await p2.locator('figure.chart').count() === 1, 'trend explorer reads indicator and real basis from the address');
  await p2.goto(base + '/kenya/?i=nonsense', { waitUntil: 'networkidle' });
  check(/do not have/.test(await p2.locator('.invalid').innerText()), 'trends explains an unknown indicator');
  await p2.goto(base + '/kenya/?i=interest-burden#trends', { waitUntil: 'networkidle' });
  check(await p2.locator('figure.chart').count() === 1 && /derived/i.test(await p2.locator('#trends ~ section').first().innerText()), 'trend explorer shows a derived measure, labelled derived');
  await p2.goto(base + '/compare/', { waitUntil: 'networkidle' });
  check(await p2.locator('#cra .kmap-values a').count() === 47 && await p2.locator('#cra tbody tr').count() === 47 && /recommendation/i.test(await p2.locator('#cra').innerText()), 'compare: CRA allocation map and table for 47 counties, labelled a recommendation');
  check(await p2.locator('#voters .kmap-values a').count() === 47 && await p2.locator('#voters tbody tr').count() === 290 + 47 && /22,120,458/.test(await p2.locator('#voters').innerText()), 'compare: registered voters map and 290-constituency table, with the other total named');
  await p2.goto(base + '/kenya/', { waitUntil: 'networkidle' });
  check(await p2.locator('figure.chart').count() === 1 && await p2.locator('.spark').count() >= 12 && await p2.locator('#notes tbody tr').count() === NAT_WITH_VALUES && await p2.locator('#public-finance .spark').count() === NAT_PF && await p2.locator('#cbk .spark').count() === 15 && await p2.locator('#analysis tbody tr').count() === 7, 'Kenya dashboard: sparkline cards, one trend explorer chart, a sources row per indicator');
  const nf = await p2.goto(base + '/no-such-page/', { waitUntil: 'load' });
  const nfHtml = fs.readFileSync(path.join(root, '404.html'), 'utf8');
  check(/That page is not here/.test(nfHtml) && /href="\/explore\/"/.test(nfHtml), 'friendly 404 with Home and Explore links');
  check((await pg.context().cookies()).length === 0 && (await ctx2.cookies()).length === 0, 'no cookies are set on any page visited (no personal data collected)');
  await ctx2.close();
  check(bad.length === 0, `no CSP violations or page errors ${bad.slice(0, 2).join(' | ')}`);
  await b.close(); srv.close();
  process.exit(failed ? 1 : 0);
});
