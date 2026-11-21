// Pure helpers for the county comparison, shared by components/CompareView.js and scripts/test-explore.js.
// A cell keeps its own note (blank or doubtful reason, or a reporting-date caveat on a published value) and any
// note on another value of the same table row and group (for example Nandi's pending bills at 31 March 2024).
const { unverifiedText } = require('./unverified');

const STATUS = ['read', 'blank', 'doubtful', 'not_in_table', 'unverified', 'withdrawn'];

function cellOf(data, fy, key, idx) {
  const p = idx === 'total' ? data.totals[fy][key] : data.values[fy][key][idx];
  return { value: p[0], st: STATUS[p[1]], note: data.notes[p[2]] || '', rowNote: data.notes[p[7]] || '', review: data.notes[p[8]] || '', raw: p[3], pdf: p[4], printed: p[5], conf: p[6] };
}
const naText = (c) => (c.st === 'withdrawn' ? c.note : c.st === 'unverified' ? unverifiedText(c.note) : c.st === 'not_in_table' ? `Not available: ${c.note || 'not in that year\'s table'}` : c.st === 'doubtful' ? (c.note ? `Not available: ${c.note}` : `Not available: the OCR reading "${c.raw}" does not agree with the printed amounts`) : `Not available: ${c.note ? c.note.replace(/^blank cell in table \(no value printed\)(, or not read by OCR)?$/, 'blank in the published table$1') : 'blank in the published table'}`);
// Cells the OCR re-read could not confirm, and other doubtful readings: neither can be ordered by value.
const isDoubt = (c) => c.st === 'doubtful' || c.st === 'unverified';
// Caveat to show beside a published value (reporting date and similar); empty when there is none.
const caveat = (c) => (c.st === 'read' ? [c.note, c.rowNote].filter((x, i, a) => x && a.indexOf(x) === i).join(' ') : '');
const unitText = (f) => (f.kind === 'pct' ? 'per cent' : 'KSh million');

function dlRow(data, fy, field, idx) {
  const r = data.counties[idx]; const c = cellOf(data, fy, field.key, idx); const src = data.sources[fy];
  return { fiscal_year: fy, county_code: r.code, county: r.name, measure: field.key, measure_label: field.label, value: c.value, unit: unitText(field), status: c.st === 'read' ? 'published' : c.st === 'unverified' ? 'not yet verified' : c.st === 'withdrawn' ? 'withdrawn after editorial review' : `not available (${c.st.replace(/_/g, ' ')})`, note: c.st === 'read' ? caveat(c) : naText(c), raw_reading: c.raw, table: src.tables[field.tab], pdf_page: c.pdf, printed_page: c.printed, read: 'OCR (RapidOCR)', ocr_confidence: c.conf, source: src.title, source_url: src.url, review_status: c.review };
}

module.exports = { STATUS, cellOf, isDoubt, naText, caveat, unitText, dlRow };
