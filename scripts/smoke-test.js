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
  for (const u of ['/', '/counties/', '/counties/siaya/', '/counties/siaya/pulse/', '/counties/kisumu/', '/insights/', '/analytics/', '/subcounties/', '/profile/', '/learn/', '/faq/', '/method/', '/data/', '/terms/', '/privacy/', '/explore/', '/datasets/', '/kenya/', '/compare/', '/stories/', '/stories/county-budget-absorption/', '/stories/population-and-towns/', '/stories/own-source-revenue/', '/briefs/request/', '/briefs/request/thanks/']) {
    const r = await pg.goto(base + u, { waitUntil: 'load' });
    check(r.status() === 200, `${u} loads`);
    check((await pg.locator('main h1').count()) === 1, `${u} has one h1`);
  }
  await pg.goto(base + '/counties/siaya/pulse/', { waitUntil: 'load' });
  check(await pg.locator('main section h2[id^=pulse-]').count() === 5 && await pg.locator('main ul.how li a[href$="/content"]').count() >= 6 && await pg.locator('figure.chart').count() === 1 && await pg.locator('a[href="/counties/siaya/brief/"]').count() >= 1, 'Siaya Fiscal Pulse: three findings with source PDF links, one chart and a link to the brief');
  const pulseDet = pg.locator('details.tableview').first();
  await pulseDet.locator('summary').click();
  check(await pulseDet.locator('table.data tbody tr').count() >= 10, 'Fiscal Pulse chart has a table view');
  // Request a brief: a static Netlify Forms form (detected from the built HTML), with a honeypot and required consent.
  const reqHtml = fs.readFileSync(path.join(root, 'briefs', 'request', 'index.html'), 'utf8');
  const formTag = (reqHtml.match(/<form[^>]*name="brief-request"[^>]*>/) || [''])[0];
  check(/data-netlify="true"/.test(formTag) && /netlify-honeypot="bot-field"/.test(formTag) && /method="POST"/i.test(formTag) && /action="\/briefs\/request\/thanks\/"/.test(formTag)
    && /<input type="hidden" name="form-name" value="brief-request"\/?>/.test(reqHtml) && /name="bot-field"/.test(reqHtml), 'brief request form is a Netlify form with honeypot, form-name and a thank-you action');
  await pg.goto(base + '/briefs/request/', { waitUntil: 'load' });
  const consent = pg.locator('form[name="brief-request"] input[type=checkbox][name=consent]');
  check(await consent.count() === 1 && await consent.evaluate((e) => e.required) && await pg.locator('form[name="brief-request"] .consent a[href="/privacy/"]').count() === 1, 'brief request: consent checkbox is required and links to the privacy notice');
  check(/script-src[^;]*;[\s\S]*form-action 'self'/.test(csp), 'CSP form-action allows the form to post to the Site');
  // No email address is published: no mailto: with an address and no address-shaped text in any built page.
  const htmlFiles = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith('.html')) htmlFiles.push(f); });
  walk(root);
  const leaks = htmlFiles.filter((f) => { const h = fs.readFileSync(f, 'utf8'); return /mailto:(?!\?)/i.test(h) || /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/.test(h); });
  check(htmlFiles.length > 20 && leaks.length === 0, `no email address in any built page (${htmlFiles.length} checked${leaks.length ? '; found in ' + leaks.slice(0, 3).map((f) => path.relative(root, f)).join(', ') : ''})`);
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
  check(await p2.locator('input[type=radio][value=high]').isDisabled() && /not by value/.test(await p2.locator('.notice').first().innerText()), 'doubtful readings switch the list to A to Z and disable ordering by value');
  const rankText = await p2.locator('ul.rank').innerText();
  check(/Not yet verified: /.test(rankText) && !/Makueni\s*\n?\s*7?1(\.\d)?%/.test(rankText), 'readings the OCR re-read did not confirm say "Not yet verified" with the reason, not a number');
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
  await ctx2.close();
  check(bad.length === 0, `no CSP violations or page errors ${bad.slice(0, 2).join(' | ')}`);
  await b.close(); srv.close();
  process.exit(failed ? 1 : 0);
});
