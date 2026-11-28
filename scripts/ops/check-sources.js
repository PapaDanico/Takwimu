#!/usr/bin/env node
// Source link and document-change check (WO-09; handover section 5 step 10 "Monitor").
// For every URL in data/source-library.json and data/source-manifest.json: HEAD, falling back to a ranged GET,
// one request per second per host, 30-second timeout, honest User-Agent, robots.txt respected. Records status,
// final URL, Content-Length, ETag and Last-Modified. For records whose bytes were saved and hashed, the file is
// downloaded again only when the headers suggest a change, into a new empty directory, and its SHA-256 compared.
// Downloads are untrusted data: they are only hashed, never parsed or executed, and deleted afterwards.
// The script never writes to data/: it writes a report (docs/ops/source-health.md) and the header state used by the
// next run (docs/ops/source-health.json). Any change it finds is a proposal for a human editor.
//
// Usage: node scripts/ops/check-sources.js [--library F] [--manifest F] [--out F.md] [--state F.json]
//        [--tmp-root DIR] [--interval-ms 1000] [--timeout 30] [--max-download-mb 200] [--today YYYY-MM-DD]
// Uses curl (it honours the environment's HTTPS proxy and CA bundle). No personal data is sent.
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const { SITE_URL } = require('../../lib/site-url');
const UA = `TakwimuKenya-linkcheck/1.0 (+${SITE_URL})`;

const args = (argv) => {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  return o;
};

const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);

// One target per URL; a URL listed by several records keeps all of them.
function collectTargets(library, manifest) {
  const map = new Map();
  const add = (url, ref) => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return;
    if (!map.has(url)) map.set(url, { url, refs: [] });
    map.get(url).refs.push(ref);
  };
  for (const d of (library && library.documents) || []) {
    const hashed = d.retrieval_status === 'downloaded' && d.sha256;
    const fileUrl = d.file_url || d.source_url;
    const landing = !!(d.file_type && !/html|web/i.test(d.file_type));
    add(d.source_url, { file: 'source-library', id: d.document_id, field: 'source_url', recorded_status: d.retrieval_status, ...(hashed && fileUrl === d.source_url ? { sha256: d.sha256, bytes: d.bytes, checked: d.last_checked_at, landing } : {}) });
    if (d.file_url && d.file_url !== d.source_url) add(d.file_url, { file: 'source-library', id: d.document_id, field: 'file_url', recorded_status: d.retrieval_status, ...(hashed ? { sha256: d.sha256, bytes: d.bytes, checked: d.last_checked_at } : {}) });
    for (const a of [].concat(d.also_at || [])) add(typeof a === 'string' ? a : a && a.url, { file: 'source-library', id: d.document_id, field: 'also_at', recorded_status: d.retrieval_status });
  }
  for (const d of (manifest && manifest.documents) || []) {
    const hashed = d.sha256 && d.file_url;
    add(d.url, { file: 'source-manifest', id: d.id, field: 'url', recorded_status: d.access });
    if (d.file_url) add(d.file_url, { file: 'source-manifest', id: d.id, field: 'file_url', recorded_status: d.access, ...(hashed ? { sha256: d.sha256, bytes: d.bytes, checked: d.hashed_on || d.retrieved } : {}) });
  }
  return [...map.values()];
}

// Run curl; resolve with exit code, stdout and stderr. Never throws.
function curl(argv, timeoutMs) {
  return new Promise((resolve) => {
    const p = spawn('curl', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; let err = '';
    const kill = setTimeout(() => p.kill('SIGKILL'), timeoutMs + 5000);
    p.stdout.on('data', (b) => { out += b; });
    p.stderr.on('data', (b) => { err += b; });
    p.on('close', (code) => { clearTimeout(kill); resolve({ code, out, err }); });
    p.on('error', (e) => { clearTimeout(kill); resolve({ code: -1, out, err: String(e) }); });
  });
}

// Parse a curl -D dump (all hops) into [{status, headers}].
function parseHops(dump) {
  const hops = [];
  for (const line of dump.split(/\r?\n/)) {
    // The HTTPS proxy's CONNECT reply is not a hop of the request.
    if (/^HTTP\/[\d.]+\s+200\s+Connection established/i.test(line)) { hops.push({ status: 0, headers: {} }); continue; }
    const m = line.match(/^HTTP\/[\d.]+\s+(\d{3})/);
    if (m) { hops.push({ status: Number(m[1]), headers: {} }); continue; }
    const h = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
    if (h && hops.length) hops[hops.length - 1].headers[h[1].toLowerCase()] = h[2].trim();
  }
  // Drop interim 1xx and proxy "Connection established" blocks.
  return hops.filter((x) => x.status >= 200);
}

const curlError = (r) => (r.err.split('\n').find((l) => /^curl: \(\d+\)/.test(l)) || r.err.trim().split('\n')[0] || `curl exit ${r.code}`).trim();

async function request(url, method, o, tmp) {
  const dump = path.join(tmp, `h-${crypto.randomBytes(6).toString('hex')}`);
  const argv = ['-sS', '-L', '--max-redirs', '10', '--max-time', String(o.timeout), '-A', UA, '-D', dump, '-o', '/dev/null',
    '--noproxy', '127.0.0.1,localhost', '-w', '%{http_code} %{url_effective}'];
  if (method === 'HEAD') argv.push('-I');
  else argv.push('-r', '0-1023', '--max-filesize', '10485760');
  argv.push('--', url);
  const r = await curl(argv, o.timeout * 1000);
  const hops = fs.existsSync(dump) ? parseHops(fs.readFileSync(dump, 'utf8')) : [];
  fs.rmSync(dump, { force: true });
  const [code, ...rest] = r.out.trim().split(' ');
  const last = hops[hops.length - 1] || { status: Number(code) || 0, headers: {} };
  const total = (last.headers['content-range'] || '').match(/\/(\d+)$/);
  return {
    method,
    status: Number(code) || last.status || 0,
    final_url: rest.join(' ') || url,
    redirects: hops.slice(0, -1).map((h) => h.status),
    content_length: total ? Number(total[1]) : (last.status === 206 ? null : (last.headers['content-length'] ? Number(last.headers['content-length']) : null)),
    etag: last.headers.etag || null,
    last_modified: last.headers['last-modified'] || null,
    content_type: last.headers['content-type'] || null,
    waf: !!(last.headers['x-amzn-waf-action'] || last.headers['cf-mitigated']),
    // A status line means the server answered (a ranged GET cut short by the size cap or timeout still counts).
    error: r.code !== 0 && !Number(code) ? curlError(r) : null,
  };
}

// robots.txt: the rules for our agent name, else for *. Longest matching Allow/Disallow wins.
function parseRobots(text) {
  const groups = []; let cur = null; let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') { if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (cur && (k === 'allow' || k === 'disallow')) cur.rules.push({ allow: k === 'allow', path: v });
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && 'takwimukenya-linkcheck'.startsWith(a)));
  return (mine || groups.find((g) => g.agents.includes('*')) || { rules: [] }).rules;
}
function robotsAllows(rules, url) {
  const u = new URL(url); const p = u.pathname + u.search;
  let best = null;
  for (const r of rules) {
    if (!r.path) continue;
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(p) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

async function sha256File(f) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(f).on('data', (b) => h.update(b)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });
}

async function download(url, o, dlRoot) {
  const dir = fs.mkdtempSync(path.join(dlRoot, 'dl-'));
  const file = path.join(dir, 'body');
  const r = await curl(['-sS', '-L', '--max-redirs', '10', '--max-time', String(Math.max(o.timeout, 600)), '-A', UA, '--noproxy', '127.0.0.1,localhost',
    '--max-filesize', String(o.maxDownload), '-o', file, '-w', '%{http_code}', '--', url], Math.max(o.timeout, 600) * 1000);
  try {
    if (r.code === 0 && fs.existsSync(file) && fs.statSync(file).size === 0) return { error: 'empty body' };
    if (r.code !== 0 || !/^2/.test(r.out.trim()) || !fs.existsSync(file)) return { error: r.code !== 0 ? curlError(r) : `HTTP ${r.out.trim()}` };
    return { sha256: await sha256File(file), bytes: fs.statSync(file).size };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One queue per host, run in parallel across hosts; at most one request per interval per host.
async function checkAll(targets, o, prevState) {
  const tmp = fs.mkdtempSync(path.join(o.tmpRoot, 'run-'));
  const byHost = new Map();
  for (const t of targets) { const h = new URL(t.url).host; if (!byHost.has(h)) byHost.set(h, []); byHost.get(h).push(t); }
  const results = [];
  await Promise.all([...byHost.entries()].map(async ([host, list]) => {
    let lastAt = 0;
    const polite = async (fn) => { const wait = lastAt + o.interval - Date.now(); if (wait > 0) await sleep(wait); try { return await fn(); } finally { lastAt = Date.now(); } };
    const origin = new URL(list[0].url).origin;
    const robots = await polite(async () => {
      const dump = path.join(tmp, `robots-${crypto.randomBytes(4).toString('hex')}`);
      const r = await curl(['-sS', '-L', '--max-time', String(o.timeout), '-A', UA, '--noproxy', '127.0.0.1,localhost', '--max-filesize', '524288', '-o', dump, '-w', '%{http_code}', '--', `${origin}/robots.txt`], o.timeout * 1000);
      const text = r.out.trim() === '200' && fs.existsSync(dump) ? fs.readFileSync(dump, 'utf8') : '';
      fs.rmSync(dump, { force: true });
      // Only plain-text robots files count; an HTML page served at /robots.txt is not a robots file.
      return /<html/i.test(text) ? [] : parseRobots(text);
    });
    for (const t of list) {
      const rec = { url: t.url, host, refs: t.refs };
      if (!robotsAllows(robots, t.url)) { rec.category = 'robots'; rec.note = 'Disallowed by robots.txt; not requested.'; results.push(rec); continue; }
      let r = await polite(() => request(t.url, 'HEAD', o, tmp));
      if (r.error || r.status >= 400 || r.status === 0) {
        const g = await polite(() => request(t.url, 'GET', o, tmp));
        if (g.status || !r.status) r = g;
      }
      Object.assign(rec, r);
      if ([401, 403, 429].includes(r.status) || (r.status === 202 && r.waf)) rec.category = 'blocked';
      else if (!r.status || r.status >= 400) rec.category = 'broken';
      else rec.category = r.final_url !== t.url && r.redirects.length ? 'moved' : 'ok';

      // Document integrity for hashed records.
      const hashed = t.refs.find((x) => x.sha256);
      if (hashed && (rec.category === 'blocked' || rec.category === 'broken')) {
        rec.integrity = { recorded_sha256: hashed.sha256, recorded_bytes: hashed.bytes, reasons: [], result: `not rechecked (${rec.category})` };
      } else if (hashed && hashed.landing && /text\/html/i.test(r.content_type || '')) {
        // The hash is of a file whose address is not recorded; this URL is its landing page.
        rec.integrity = { recorded_sha256: hashed.sha256, recorded_bytes: hashed.bytes, reasons: [], result: 'not comparable (URL is a landing page; file address not recorded)' };
      } else if (hashed) {
        const prev = prevState && prevState[t.url];
        const reasons = [];
        if (prev && prev.etag && r.etag && prev.etag !== r.etag) reasons.push('ETag changed');
        if (prev && prev.last_modified && r.last_modified && prev.last_modified !== r.last_modified) reasons.push('Last-Modified changed');
        if (r.content_length && hashed.bytes != null && r.content_length !== hashed.bytes) reasons.push(`size ${r.content_length} vs recorded ${hashed.bytes}`);
        if (!prev && r.last_modified && hashed.checked && new Date(r.last_modified) > new Date(`${hashed.checked}T23:59:59Z`)) reasons.push(`Last-Modified ${r.last_modified} is after the recorded check ${hashed.checked}`);
        if (o.rehashAll && !reasons.length) reasons.push('--rehash-all');
        rec.integrity = { recorded_sha256: hashed.sha256, recorded_bytes: hashed.bytes, reasons };
        // A change found on an earlier run stays reported until the data file records the new hash: compare the hash
        // the last run computed with the one in data/, not only this run's headers with the last run's.
        const known = !reasons.length && prev && prev.sha256 && prev.sha256 !== hashed.sha256 && prev.integrity === 'changed';
        if (known) {
          reasons.push('an earlier run found a new SHA-256; data/ still records the old one');
          Object.assign(rec.integrity, { new_sha256: prev.sha256, new_bytes: prev.content_length ?? null, result: 'changed' });
        } else if (!reasons.length) {
          rec.integrity.result = r.content_length && hashed.bytes != null ? 'unchanged (headers)' : 'not rechecked (no size or validator header)';
        } else if (r.content_length != null && r.content_length > o.maxDownload) {
          rec.integrity.result = 'needs manual hash (file larger than the download limit)';
        } else {
          const d = await polite(() => download(t.url, o, tmp));
          if (d.error) rec.integrity.result = `download failed: ${d.error}`;
          else { rec.integrity.new_sha256 = d.sha256; rec.integrity.new_bytes = d.bytes; rec.integrity.result = d.sha256 === hashed.sha256 ? 'unchanged (hash)' : 'changed'; }
        }
      }
      results.push(rec);
    }
  }));
  fs.rmSync(tmp, { recursive: true, force: true });
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const refsText = (r) => [...new Set(r.refs.map((x) => `${x.file === 'source-library' ? 'lib' : 'man'}:${x.id}`))].join(', ');
const prevStatus = (r) => [...new Set(r.refs.map((x) => x.recorded_status).filter(Boolean))].join('/');

function report(results, meta) {
  const count = (c) => results.filter((r) => r.category === c).length;
  const integ = results.filter((r) => r.integrity);
  const ic = (f) => integ.filter((r) => f(r.integrity.result)).length;
  const changed = integ.filter((r) => r.integrity.result === 'changed');
  const L = [];
  L.push('# Source health', '');
  L.push(`Generated by \`scripts/ops/check-sources.js\` on ${meta.date}. Read-only: nothing in \`data/\` was changed. Every finding below is a proposal for a human editor, who updates \`data/source-library.json\` or \`data/source-manifest.json\` (and the review record, if a hashed document changed) by hand.`, '');
  L.push(`Method: HEAD, falling back to a ranged GET; at most one request per second per host; ${meta.timeout}-second timeout; User-Agent \`${UA}\`; robots.txt honoured. Hashed documents are downloaded again only when the size, ETag or Last-Modified differs from what was recorded, and then compared by SHA-256.`, '');
  L.push('## Summary', '');
  L.push('| Measure | Count |', '|---|---:|');
  L.push(`| URLs checked | ${results.length} |`);
  L.push(`| OK (2xx, same address) | ${count('ok')} |`);
  L.push(`| Moved (2xx after a redirect to another address) | ${count('moved')} |`);
  L.push(`| Broken (4xx, 5xx, timeout or connection error) | ${count('broken')} |`);
  L.push(`| Blocked (401, 403, 429 or a bot-check challenge) | ${count('blocked')} |`);
  L.push(`| Not requested (robots.txt) | ${count('robots')} |`);
  L.push(`| Hashed documents examined | ${integ.length} |`);
  L.push(`| Changed (new SHA-256) | ${changed.length} |`);
  L.push(`| Unchanged (hash re-verified) | ${ic((x) => x === 'unchanged (hash)')} |`);
  L.push(`| Unchanged (size matches record; not downloaded) | ${ic((x) => x === 'unchanged (headers)')} |`);
  L.push(`| Not rechecked (no size header, blocked, broken, landing page, too large, or download failed) | ${ic((x) => /^not rechecked|^not comparable|^needs manual|^download failed/.test(x))} |`, '');
  L.push('## Changed documents', '');
  if (!changed.length) L.push('None.', '');
  else { L.push('| URL | Records | Recorded SHA-256 | New SHA-256 | Why re-downloaded |', '|---|---|---|---|---|'); changed.forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | \`${r.integrity.recorded_sha256}\` | \`${r.integrity.new_sha256}\` | ${esc(r.integrity.reasons.join('; '))} |`)); L.push(''); }
  L.push('## Broken', '');
  const broken = results.filter((r) => r.category === 'broken');
  if (!broken.length) L.push('None.', '');
  else { L.push('| URL | Records | Recorded status | HTTP | Error |', '|---|---|---|---:|---|'); broken.forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | ${esc(prevStatus(r))} | ${r.status || ''} | ${esc(r.error)} |`)); L.push(''); }
  L.push('## Blocked', '');
  const blocked = results.filter((r) => r.category === 'blocked');
  if (!blocked.length) L.push('None.', '');
  else { L.push('The server refused an automated request (bot check or access rule). Check by hand in a browser; do not try to get round it.', '', '| URL | Records | Recorded status | HTTP |', '|---|---|---|---:|'); blocked.forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | ${esc(prevStatus(r))} | ${r.status} |`)); L.push(''); }
  L.push('## Moved', '');
  const moved = results.filter((r) => r.category === 'moved');
  if (!moved.length) L.push('None.', '');
  else { L.push('| URL | Records | Redirects | Final URL |', '|---|---|---|---|'); moved.forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | ${r.redirects.join(' > ')} | ${esc(r.final_url)} |`)); L.push(''); }
  const other = integ.filter((r) => !['changed', 'unchanged (hash)', 'unchanged (headers)'].includes(r.integrity.result));
  if (other.length) {
    L.push('## Hashed documents not re-verified', '');
    L.push('| URL | Records | Result | Reason |', '|---|---|---|---|');
    other.forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | ${esc(r.integrity.result)} | ${esc(r.integrity.reasons.join('; '))} |`)); L.push('');
  }
  if (count('robots')) { L.push('## Not requested (robots.txt)', ''); results.filter((r) => r.category === 'robots').forEach((r) => L.push(`- ${r.url} (${refsText(r)})`)); L.push(''); }
  L.push('## Unchanged and OK', '');
  L.push('| URL | Records | HTTP | Method | Content-Length | Last-Modified | Integrity |', '|---|---|---:|---|---:|---|---|');
  results.filter((r) => r.category === 'ok').forEach((r) => L.push(`| ${esc(r.url)} | ${refsText(r)} | ${r.status} | ${r.method} | ${r.content_length == null ? '' : r.content_length} | ${esc(r.last_modified)} | ${esc(r.integrity ? r.integrity.result : '')} |`));
  L.push('', 'Records: `lib:` = data/source-library.json document_id; `man:` = data/source-manifest.json id. "Recorded status" is the status stored in the data file, so a break already known there is not new.', '');
  return L.join('\n');
}

async function main(argv) {
  const a = args(argv);
  const o = {
    library: path.resolve(a.library || path.join(ROOT, 'data/source-library.json')),
    manifest: path.resolve(a.manifest || path.join(ROOT, 'data/source-manifest.json')),
    out: path.resolve(a.out || path.join(ROOT, 'docs/ops/source-health.md')),
    state: path.resolve(a.state || path.join(ROOT, 'docs/ops/source-health.json')),
    tmpRoot: path.resolve(a['tmp-root'] || '/tmp/claude-0/ops'),
    interval: Number(a['interval-ms'] || 1000),
    timeout: Number(a.timeout || 30),
    maxDownload: Number(a['max-download-mb'] || 200) * 1024 * 1024,
    rehashAll: !!a['rehash-all'],
    date: a.today || new Date().toISOString().slice(0, 10),
  };
  fs.mkdirSync(o.tmpRoot, { recursive: true });
  const targets = collectTargets(readJson(o.library), readJson(o.manifest));
  const prevState = (readJson(o.state) || {}).urls || null;
  const results = await checkAll(targets, o, prevState);
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  fs.writeFileSync(o.out, report(results, o));
  const urls = {};
  for (const r of results) urls[r.url] = { category: r.category, status: r.status || null, final_url: r.final_url || null, content_length: r.content_length ?? null, etag: r.etag || null, last_modified: r.last_modified || null, ...(r.integrity ? { integrity: r.integrity.result, sha256: r.integrity.new_sha256 || r.integrity.recorded_sha256 } : {}) };
  fs.writeFileSync(o.state, JSON.stringify({ meta: { generated: o.date, tool: 'scripts/ops/check-sources.js', note: 'Header state for the next run. Not a data file: nothing on the site reads it.' }, urls }, null, 1) + '\n');
  const c = (k) => results.filter((r) => r.category === k).length;
  console.log(`check-sources: ${results.length} URLs; ok ${c('ok')}, moved ${c('moved')}, broken ${c('broken')}, blocked ${c('blocked')}, robots ${c('robots')}; changed ${results.filter((r) => r.integrity && r.integrity.result === 'changed').length}. Report: ${path.relative(process.cwd(), o.out)}`);
  return results;
}

if (require.main === module) main(process.argv.slice(2)).catch((e) => { console.error(e); process.exit(1); });
module.exports = { main, collectTargets, parseRobots, robotsAllows, parseHops };
