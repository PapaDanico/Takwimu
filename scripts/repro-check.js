// Reproducible-build check: builds twice from the same commit and compares a hash of every file in dist/,
// ignoring Next's per-build ID folder names. Usage: npm run verify:repro
// Guards (27 Nov 2026): the build inputs (every tracked or untracked, non-ignored file) are fingerprinted before,
// between and after the two builds. A difference there is not build nondeterminism: either a build step rewrote one
// of its own inputs, or something edited the checkout while the check ran (the ~3 minute check is easy to overlap
// with an edit or another build in the same folder). It is reported as such, and the check fails. When the outputs
// differ, both copies of each differing file are kept under the OS temp folder so the bytes can be compared.
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
// latin1 keeps every byte (the build ID is ASCII), so binary files are compared exactly, not through a UTF-8 decode.
const digest = () => {
  const id = fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8').trim();
  const files = {};
  walk(dist).sort().forEach((f) => { files[path.relative(dist, f).split(id).join('ID')] = sha(Buffer.from(fs.readFileSync(f).toString('latin1').split(id).join('ID'), 'latin1')); });
  return { id, files };
};
const inputs = () => {
  const list = execSync('git ls-files -z -c -o --exclude-standard', { cwd: root, maxBuffer: 64 << 20 }).toString().split('\0').filter(Boolean).sort();
  return Object.fromEntries(list.map((f) => [f, fs.existsSync(path.join(root, f)) ? sha(fs.readFileSync(path.join(root, f))) : 'missing']));
};
const changed = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => x[k] !== y[k]);
let keep = null; // copy of build A's dist/, kept only when the outputs differ
// A failing gate inside either build is reported with the end of its output, not as a bare child-process error.
const build = (label) => {
  try { execSync('npm run build', { cwd: root, stdio: 'pipe', maxBuffer: 256 << 20 }); } catch (e) {
    console.log(`Build ${label} failed (exit ${e.status}); the check did not compare anything. End of its output:\n${`${e.stdout || ''}\n${e.stderr || ''}`.trim().split('\n').slice(-40).join('\n')}`);
    if (keep) fs.rmSync(keep, { recursive: true, force: true });
    process.exit(2);
  }
  return digest();
};

const in0 = inputs();
const a = build('A');
keep = fs.mkdtempSync(path.join(os.tmpdir(), 'takwimu-repro-'));
fs.cpSync(dist, path.join(keep, 'a'), { recursive: true });
const in1 = inputs();
const b = build('B');
const in2 = inputs();
const diff = changed(a.files, b.files);
const moved = [...new Set([...changed(in0, in1), ...changed(in1, in2)])];
if (moved.length) console.log(`Build inputs changed during the check (${moved.length}): ${moved.slice(0, 12).join(', ')}\n  A build step rewrote its own input, or the checkout was edited or built elsewhere while the check ran; the comparison is not valid.`);
if (diff.length) {
  fs.cpSync(dist, path.join(keep, 'b'), { recursive: true });
  console.log(`NOT reproducible; ${diff.length} files differ (copies in ${keep}/a and ${keep}/b, build IDs ${a.id} and ${b.id}):`);
  diff.slice(0, 12).forEach((k) => console.log(`  ${k}\n    a ${a.files[k] || 'absent'}\n    b ${b.files[k] || 'absent'}`));
} else {
  fs.rmSync(keep, { recursive: true, force: true });
  if (!moved.length) console.log(`Reproducible: ${sha(JSON.stringify(a.files))}`);
}
process.exit(diff.length || moved.length ? 1 : 0);
