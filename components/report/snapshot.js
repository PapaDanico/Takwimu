// Report snapshot ID, shared by the report builder (components/report/model.js), scripts/test-reports.js and the
// smoke test. SHA-256 over the names and digests of the report's input files, the review register and the documents
// it is checked against (data/reviews.json, data/source-manifest.json, data/source-library.json), and a digest of
// the review state of every value as lib/review-status.js resolves it (which also covers the synthetic rejections of
// scripts/test-reviews.js). A change to any input or to any review state changes the ID, so a PDF printed before the
// change no longer matches. CommonJS so Node scripts and Next.js both load it. Server and build only.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rs = require('../../lib/review-status');

const REVIEW_FILES = ['reviews.json', 'source-manifest.json', 'source-library.json'];
const REVIEW_STATE = 'review state (lib/review-status.js)';
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');

// Every value that is not simply pending, with its state and record: the same register gives the same digest.
function reviewDigest() {
  const lines = [];
  rs.DATASET_IDS.forEach((d) => rs.observations(d).forEach((i) => {
    const s = rs.stateOf(d, i.id);
    if (s && (s.state !== 'REVIEW_PENDING' || s.record)) lines.push(`${d}|${i.id}|${s.state}|${s.record || ''}`);
  }));
  return sha(lines.join('\n'));
}

function snapshot(inputs, root = process.cwd()) {
  const files = [...new Set([...inputs, ...REVIEW_FILES])].sort().map((f) => ({ file: `data/${f}`, sha256: sha(fs.readFileSync(path.join(root, 'data', f))) }));
  files.push({ file: REVIEW_STATE, sha256: reviewDigest() });
  const id = sha(files.map((x) => `${x.file}:${x.sha256}`).join('\n')).slice(0, 12);
  return { id, files };
}

module.exports = { snapshot, reviewDigest, REVIEW_FILES, REVIEW_STATE };
