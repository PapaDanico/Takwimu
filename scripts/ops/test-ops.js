#!/usr/bin/env node
// Tests for scripts/ops: freshness.js offline against a fixture catalogue, and check-sources.js against a local
// HTTP server (200, 301, 404, HEAD refused, robots.txt, changed and unchanged documents). No external network.
// Usage: node scripts/ops/test-ops.js
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const assert = require('assert');

const freshness = require('./freshness.js');
const checkSources = require('./check-sources.js');

let passed = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); passed++; };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ---------- freshness ----------
function testFreshness(tmp) {
  const today = '2026-11-21';
  const cat = [
    { id: 'wdi-current', title: 't', source: 'World Bank WDI', period: { from: '2010', to: '2025' }, years: [2020, 2021, 2022, 2023, 2024] },
    { id: 'wdi-stale', title: 't', source: 'World Bank WDI', period: { from: '2010', to: '2025' }, years: [2018, 2019, 2020, 2021] },
    { id: 'kenya-gini', title: 't', source: 'World Bank WDI', period: { from: '2010', to: '2025' }, years: [2015, 2020, 2021, 2022] },
    { id: 'cob-annual', title: 't', source: 'Controller of Budget', period: { from: 'FY 2021/22', to: 'FY 2024/25' }, years: [2022, 2023, 2024, 2025] },
    { id: 'cob-old', title: 't', source: 'Controller of Budget', period: { from: 'FY 2013/14', to: 'FY 2022/23' }, years: [2014, 2023] },
    { id: 'oag', title: 't', source: 'Office of the Auditor-General (via the Parliament library)', period: { from: 'FY 2013/14', to: 'FY 2023/24' }, years: [2014, 2024] },
    { id: 'cbk-m', title: 't', source: 'Central Bank of Kenya', period: { from: '2010-01', to: '2026-10' }, years: [2026] },
    { id: 'cbk-fx-reserves', title: 't', source: 'Central Bank of Kenya', period: { from: '2016-12-29', to: '2026-10-01' }, years: [2026] },
    { id: 'gcp', title: 't', source: 'KNBS', period: { from: '2019', to: '2024' }, years: [2024] },
    { id: 'obs', title: 't', source: 'International Budget Partnership', period: { from: '2006', to: '2023' }, years: [2023] },
    { id: 'iebc', title: 't', source: 'IEBC', period: { from: '2022', to: '2022' }, years: [2022] },
    { id: 'source-conflicts', title: 't', source: 'Takwimu register', period: { from: 'FY 2013/14', to: 'FY 2025/26' }, years: [2026] },
    { id: 'mystery', title: 't', source: 'Somebody Else', period: { from: '2020', to: '2021' }, years: [2021] },
  ];
  const f = path.join(tmp, 'catalogue.json');
  fs.writeFileSync(f, JSON.stringify(cat));
  const rows = freshness.assess(cat, today);
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  ok(freshness.periodEnd('FY 2024/25').toISOString().startsWith('2025-06-30'), 'FY ends 30 June');
  ok(freshness.periodEnd('2026-02').toISOString().startsWith('2026-02-28'), 'month end');
  ok(freshness.latestCovered(cat[1]) === '2021', 'latest year with data, not the request range');
  ok(by['wdi-current'].status === 'current', `wdi-current: ${by['wdi-current'].status}`);
  ok(by['wdi-stale'].status === 'overdue' && by['wdi-stale'].days_overdue > 0, 'stale WDI overdue');
  ok(by['kenya-gini'].status === 'not assessed', 'survey indicator not assessed');
  ok(by['cob-annual'].status === 'current', `cob-annual: ${by['cob-annual'].status} ${by['cob-annual'].next_due}`);
  ok(by['cob-old'].status === 'overdue', 'CoB two years behind is overdue');
  ok(by.oag.status === 'overdue' && by.oag.next_due === '2025-12-30', `OAG FY 2023/24 due 2025-12-30: ${by.oag.next_due}`);
  ok(by['cbk-m'].status === 'current', `cbk monthly: ${by['cbk-m'].status}`);
  ok(by['cbk-fx-reserves'].status === 'overdue', 'weekly series 7 weeks behind is overdue');
  ok(by.gcp.status === 'due', `GCP 2024 due end 2026: ${by.gcp.status}`);
  ok(by.obs.status === 'overdue', 'OBS round 2023 overdue by 2026-11 (biennial)');
  ok(by.iebc.status === 'current', 'IEBC five-yearly current');
  ok(by['source-conflicts'].status === 'not assessed', 'internal not assessed');
  ok(by.mystery.status === 'no rule', 'unknown source flagged as no rule');

  const out = path.join(tmp, 'freshness.md');
  const r = spawnSyncNode([path.join(__dirname, 'freshness.js'), '--catalogue', f, '--today', today, '--out', out]);
  ok(r.status === 0, `freshness CLI exit ${r.status}: ${r.stderr}`);
  const md = fs.readFileSync(out, 'utf8');
  ['# Data freshness', '## Summary', '## Overdue', '## All datasets', '## Cadence basis', '| overdue |', '| total | 13 |'].forEach((h) => ok(md.includes(h), `freshness report has "${h}"`));
  ok(/\| wdi-stale \| World Bank WDI \| 2021 \|/.test(md), 'overdue table lists wdi-stale');
  ok(!/\| wdi-current \| World Bank WDI/.test(md.split('## All datasets')[0]), 'current dataset not in overdue table');
}

function spawnSyncNode(argv) {
  return require('child_process').spawnSync(process.execPath, argv, { encoding: 'utf8', env: { ...process.env } });
}

// ---------- check-sources ----------
function startServer() {
  const OLD = Buffer.from('%PDF-1.4 old body\n%%EOF\n');
  const NEW = Buffer.from('%PDF-1.4 new body, longer\n%%EOF\n');
  const SAME = Buffer.from('%PDF-1.4 same body\n%%EOF\n');
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push({ method: req.method, url: req.url, ua: req.headers['user-agent'], range: req.headers.range, at: Date.now() });
    const send = (code, body, headers = {}) => {
      res.writeHead(code, { 'Content-Length': body.length, ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const ranged = (body, headers) => {
      if (req.method === 'GET' && /^bytes=0-/.test(req.headers.range || '')) {
        const part = body.subarray(0, 1024);
        res.writeHead(206, { 'Content-Length': part.length, 'Content-Range': `bytes 0-${part.length - 1}/${body.length}`, ...headers });
        return res.end(part);
      }
      return send(200, body, headers);
    };
    switch (req.url) {
      case '/robots.txt': return send(200, Buffer.from('User-agent: *\nDisallow: /private/\n'), { 'Content-Type': 'text/plain' });
      case '/landing': return send(200, Buffer.from('landing page'));
      case '/refused': return send(403, Buffer.from('forbidden'));
      case '/waf': return send(202, Buffer.from(''), { 'x-amzn-waf-action': 'challenge', 'Content-Type': 'text/html' });
      case '/zip-page': return send(200, Buffer.from('<html>dataset page</html>'), { 'Content-Type': 'text/html; charset=utf-8' });
      case '/ok': return send(200, Buffer.from('hello'), { ETag: '"a1"', 'Last-Modified': 'Mon, 01 Jan 2024 00:00:00 GMT' });
      case '/old-place': return send(301, Buffer.from(''), { Location: '/new-place' });
      case '/new-place': return send(200, Buffer.from('moved here'));
      case '/missing': return send(404, Buffer.from('not found'));
      case '/no-head': if (req.method === 'HEAD') return send(405, Buffer.from('')); return ranged(Buffer.from('get only'), {});
      case '/changed.pdf': return ranged(NEW, { ETag: '"v2"' });
      case '/same.pdf': return ranged(SAME, { ETag: '"s2"' });
      case '/stable.pdf': return ranged(SAME, { ETag: '"st"' });
      case '/private/doc': return send(200, Buffer.from('should not be fetched'));
      default: return send(404, Buffer.from(''));
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, hits, base: `http://127.0.0.1:${server.address().port}`, OLD, NEW, SAME })));
}

function runCli(argv) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; let err = '';
    p.stdout.on('data', (b) => { out += b; });
    p.stderr.on('data', (b) => { err += b; });
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

async function testCheckSources(tmp) {
  ok(checkSources.robotsAllows(checkSources.parseRobots('User-agent: *\nDisallow: /a/\nAllow: /a/b\n'), 'https://x.test/a/b/c'), 'robots: longer Allow wins');
  ok(!checkSources.robotsAllows(checkSources.parseRobots('User-agent: *\nDisallow: /a/\n'), 'https://x.test/a/c'), 'robots: Disallow');
  ok(checkSources.robotsAllows(checkSources.parseRobots('User-agent: other\nDisallow: /\n'), 'https://x.test/a'), 'robots: other agent rules ignored');

  const hops = checkSources.parseHops('HTTP/1.1 200 Connection established\r\n\r\nHTTP/2 301\r\nlocation: /b\r\n\r\nHTTP/1.1 200 Connection established\r\n\r\nHTTP/2 200\r\netag: "x"\r\n');
  ok(hops.length === 2 && hops[0].status === 301 && hops[1].headers.etag === '"x"', 'proxy CONNECT replies are not counted as hops');

  const s = await startServer();
  try {
    const lib = { meta: {}, documents: [
      { document_id: 'L-OK', source_url: `${s.base}/ok`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-MOVED', source_url: `${s.base}/old-place`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-404', source_url: `${s.base}/missing`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-NOHEAD', source_url: `${s.base}/no-head`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-CHANGED', source_url: `${s.base}/landing`, file_url: `${s.base}/changed.pdf`, retrieval_status: 'downloaded', sha256: sha(s.OLD), bytes: s.OLD.length, last_checked_at: '2026-11-21' },
      { document_id: 'L-PRIVATE', source_url: `${s.base}/private/doc`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-403', source_url: `${s.base}/refused`, retrieval_status: 'blocked', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-WAF', source_url: `${s.base}/waf`, retrieval_status: 'discovered', sha256: null, bytes: null, last_checked_at: '2026-11-21' },
      { document_id: 'L-ZIPPAGE', source_url: `${s.base}/zip-page`, file_type: 'ZIP', retrieval_status: 'downloaded', sha256: sha('zip bytes'), bytes: 9, last_checked_at: '2026-11-21' },
      { document_id: 'L-STABLE', source_url: `${s.base}/stable.pdf`, retrieval_status: 'downloaded', sha256: sha(s.SAME), bytes: s.SAME.length, last_checked_at: '2026-11-21' },
    ] };
    const man = { meta: {}, documents: [
      { id: 'm-same', url: `${s.base}/ok`, file_url: `${s.base}/same.pdf`, sha256: sha(s.SAME), bytes: s.SAME.length, hashed_on: '2026-11-21', retrieved: '2026-11-21', access: 'downloaded' },
    ] };
    const libF = path.join(tmp, 'lib.json'); const manF = path.join(tmp, 'man.json');
    const stateF = path.join(tmp, 'state.json'); const outF = path.join(tmp, 'health.md');
    fs.writeFileSync(libF, JSON.stringify(lib)); fs.writeFileSync(manF, JSON.stringify(man));
    // Previous run saw a different ETag for same.pdf, so it must be re-downloaded and found unchanged by hash.
    fs.writeFileSync(stateF, JSON.stringify({ urls: { [`${s.base}/same.pdf`]: { etag: '"s1"' }, [`${s.base}/stable.pdf`]: { etag: '"st"' } } }));
    const libBefore = fs.readFileSync(libF, 'utf8');
    const dlRoot = path.join(tmp, 'dl'); fs.mkdirSync(dlRoot);
    const r = await runCli([path.join(__dirname, 'check-sources.js'), '--library', libF, '--manifest', manF, '--out', outF, '--state', stateF,
      '--tmp-root', dlRoot, '--interval-ms', '150', '--timeout', '10', '--today', '2026-11-21']);
    ok(r.code === 0, `check-sources exit ${r.code}: ${r.err}`);
    const state = JSON.parse(fs.readFileSync(stateF, 'utf8')).urls;
    const cat = (p) => state[`${s.base}${p}`] && state[`${s.base}${p}`].category;
    ok(cat('/ok') === 'ok', `200 -> ok (${cat('/ok')})`);
    ok(state[`${s.base}/ok`].etag === '"a1"' && state[`${s.base}/ok`].last_modified, 'ETag and Last-Modified recorded');
    ok(cat('/old-place') === 'moved' && state[`${s.base}/old-place`].final_url === `${s.base}/new-place`, '301 -> moved with final URL');
    ok(cat('/missing') === 'broken' && state[`${s.base}/missing`].status === 404, '404 -> broken');
    ok(cat('/refused') === 'blocked' && cat('/waf') === 'blocked', `403 and bot-check 202 -> blocked (${cat('/refused')}, ${cat('/waf')})`);
    ok(/^not comparable/.test(state[`${s.base}/zip-page`].integrity), 'landing page of a hashed file is not compared');
    ok(cat('/no-head') === 'ok', 'HEAD 405 falls back to ranged GET');
    ok(s.hits.some((h) => h.url === '/no-head' && h.method === 'GET'), 'ranged GET was sent');
    ok(cat('/private/doc') === 'robots' && !s.hits.some((h) => h.url === '/private/doc'), 'robots-disallowed URL not requested');
    ok(state[`${s.base}/changed.pdf`].integrity === 'changed' && state[`${s.base}/changed.pdf`].sha256 === sha(s.NEW), 'changed document detected by SHA-256');
    ok(state[`${s.base}/same.pdf`].integrity === 'unchanged (hash)', `ETag change but same bytes -> unchanged (${state[`${s.base}/same.pdf`].integrity})`);
    ok(state[`${s.base}/stable.pdf`].integrity === 'unchanged (headers)', 'matching headers -> not downloaded');
    ok(s.hits.filter((h) => h.url === '/stable.pdf' && h.method === 'GET' && !h.range).length === 0, 'stable document not re-downloaded');
    ok(s.hits.every((h) => /^TakwimuKenya-linkcheck\//.test(h.ua)), 'honest User-Agent on every request');
    const robotsHits = s.hits.filter((h) => h.url === '/robots.txt').length;
    ok(robotsHits === 1, `robots.txt fetched once per host (${robotsHits})`);
    // A redirect hop is part of the same request, so /new-place is excluded.
    const times = s.hits.filter((h) => h.url !== '/new-place').map((h) => h.at).sort((a, b) => a - b);
    ok(times.slice(1).every((t, i) => t - times[i] >= 120), 'one request per interval per host');
    ok(fs.readFileSync(libF, 'utf8') === libBefore, 'data file not modified');
    ok(fs.readdirSync(dlRoot).length === 0, 'download directories removed');
    const md = fs.readFileSync(outF, 'utf8');
    ['# Source health', '## Summary', '## Changed documents', '## Broken', '## Moved', '## Unchanged and OK', '| Changed (new SHA-256) | 1 |', '| Broken (4xx, 5xx, timeout or connection error) | 1 |', '| Moved (2xx after a redirect to another address) | 1 |', '| Blocked (401, 403, 429 or a bot-check challenge) | 2 |', '## Blocked'].forEach((h) => ok(md.includes(h), `source report has "${h}"`));
  } finally { s.server.close(); }
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'takwimu-ops-test-'));
  try {
    testFreshness(tmp);
    await testCheckSources(tmp);
    console.log(`test-ops: ${passed} checks passed`);
  } catch (e) {
    console.error(`test-ops FAILED after ${passed} checks: ${e.message}`);
    process.exitCode = 1;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
})();
