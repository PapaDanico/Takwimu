// Reproducible-build check: builds twice from the same commit and compares a hash of every file in dist/,
// ignoring Next's per-build ID folder names. Usage: npm run verify:repro
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const digest = () => {
  const id = fs.readFileSync(path.join(__dirname, '..', '.next', 'BUILD_ID'), 'utf8').trim();
  const files = {};
  walk(dist).sort().forEach((f) => { files[path.relative(dist, f).split(id).join('ID')] = crypto.createHash('sha256').update(fs.readFileSync(f, 'utf8').split(id).join('ID')).digest('hex'); });
  return files;
};
const run = () => { execSync('npm run build', { stdio: 'ignore' }); return digest(); };
const a = run(); const b = run();
const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);
const all = crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');
console.log(diff.length ? `NOT reproducible; ${diff.length} files differ:\n${diff.slice(0, 12).join('\n')}` : `Reproducible: ${all}`);
process.exit(diff.length ? 1 : 0);
