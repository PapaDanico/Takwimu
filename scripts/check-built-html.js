// Fails the build if any exported HTML page contains "NaN" (a chart coordinate or figure computed from a
// missing value), or if its visible text contains "[object Object]" (an object or JSX array joined as a string) or a
// stray "undefined" (a missing field printed). Missing values must render as gaps.
// Run after `next build`: node scripts/check-built-html.js dist
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const data = path.join(__dirname, '..', 'data');

// "undefined" as English in a source's own note is allowed (the word with its preceding word, as in the data files).
const allowedUndefined = new Set();
fs.readdirSync(data).filter((f) => f.endsWith('.json')).forEach((f) => {
  (fs.readFileSync(path.join(data, f), 'utf8').match(/[A-Za-z,]+ undefined\b/g) || []).forEach((m) => allowedUndefined.add(m));
});
// Visible text of a page: scripts, styles and tags removed (the RSC payload in <script> uses "$undefined" by design).
const textOf = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const problems = (html) => {
  const out = [];
  if (/\bNaN\b/.test(html)) out.push('NaN');
  const t = textOf(html);
  if (t.includes('[object Object]')) out.push(`"[object Object]" x${t.split('[object Object]').length - 1}`);
  const und = [...t.matchAll(/(?:([A-Za-z,]+) )?\bundefined\b/g)].map((m) => m[0]).filter((m) => !allowedUndefined.has(m));
  if (und.length) out.push(`"undefined" (${und.slice(0, 2).join(' | ')})`);
  return out;
};
module.exports = { problems, textOf };
if (require.main !== module) return;

// The check is not vacuous: it must catch each kind of bug in a sample.
if (problems('<p>Every row: [object Object].</p>').length !== 1 || problems('<p>Value: undefined</p>').length !== 1 || problems('<p>ok</p><script>x="$undefined"</script>').length) {
  console.error('check-built-html: sample checks no longer behave as expected'); process.exit(1);
}
const pages = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(p);
});
walk(root);
if (!pages.length) { console.error(`No HTML found under ${root}`); process.exit(1); }
const bad = pages.map((p) => [p, problems(fs.readFileSync(p, 'utf8'))]).filter(([, x]) => x.length);
if (bad.length) {
  console.error(`Rendering bugs in ${bad.length} built page(s):\n- ` + bad.map(([p, x]) => `${path.relative(root, p)}: ${x.join(', ')}`).join('\n- '));
  process.exit(1);
}
console.log(`Built HTML check passed (${pages.length} pages, no NaN, "[object Object]" or stray "undefined").`);
