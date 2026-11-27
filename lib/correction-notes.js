// Correction footnotes (owner decision, 27 Nov 2026: no corrections register page; a small footnote beside the value).
// Our corrections come from resolved conflict cases with register "our_correction" (correction.records, "dataset|id")
// and the data corrections log (data/corrections.json: dataset, record_ids). Each footnote reads
// "Corrected <date>: was <original>. <note>" and is keyed "dataset:record", the value of its data-correction attribute.
// scripts/test-corrections.js checks that every one renders on a built page. Server and build only.
const conflicts = require('../data/conflicts.json');
const log = require('../data/corrections.json');

const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const wasFor = (was, rec) => (typeof was === 'string' ? was : was[rec]);

// Every footnote: { id, ref, dataset, record, date, was, note, text }.
function correctionNotes() {
  const out = [];
  conflicts.conflicts.filter((c) => c.status === 'resolved' && c.register === 'our_correction').forEach((c) => (c.correction.records || []).forEach((r) => {
    const [dataset, record] = r.split('|');
    out.push({ id: c.id, dataset, record, date: c.correction.date, was: c.correction.was, note: c.correction.note });
  }));
  (log.entries || []).forEach((e) => e.record_ids.forEach((record) => out.push({ id: e.id, dataset: e.dataset, record, date: e.date, was: wasFor(e.was, record), note: e.note })));
  return out.map((n) => ({ ...n, ref: `${n.dataset}:${n.record}`, text: `Corrected ${day(n.date)}: was ${n.was}. ${n.note}` }));
}

const BY_REF = {};
correctionNotes().forEach((n) => { (BY_REF[n.ref] = BY_REF[n.ref] || []).push(n); });
// The footnotes for one value, latest first, or null. Plain objects, safe to pass to client components.
const notesFor = (dataset, record) => {
  const list = BY_REF[`${dataset}:${record}`];
  return list ? [...list].sort((a, b) => b.date.localeCompare(a.date) || String(a.id).localeCompare(String(b.id))).map(({ ref, text, id }) => ({ ref, text, id })) : null;
};

module.exports = { correctionNotes, notesFor };
