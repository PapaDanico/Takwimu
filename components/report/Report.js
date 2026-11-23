// Print-optimised report renderer. Server component: renders the blocks that build.js returns. Every value is a
// <Fig>, which carries data-file and data-ptr so scripts/test-reports.js can resolve it against the data file.
// Repetition rules (UX sweep U3): the provisional state is stated once on the cover; a figure carries a mark only
// when its review state is an exception (approved, disputed, superseded, withdrawn). A note, unit, source, page or
// confidence shared by every row of a table is stated once under the caption; notes that differ are footnoted.
// How to read the reports, the method, the confidence scales and the licence live once at /reports/method/.
import { Fragment } from 'react';
import ReportChart from './ReportChart';
import { PROVISIONAL } from './model';
import { conflictNote } from './rules';

export const METHOD_HREF = '/reports/method/';
const num = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 6 });
const fmtValue = (f) => {
  if (f.suppress) return 'Suppressed (fewer than 10)';
  if (f.display) return f.display;
  if (f.value === null || f.value === undefined || f.value === '') return 'Not published';
  if (typeof f.value === 'number') return num(f.value);
  if (typeof f.value === 'boolean') return f.value ? 'Yes' : 'No';
  if (typeof f.value === 'object') return JSON.stringify(f.value);
  return String(f.value).replace(/_/g, ' ');
};
const dataValue = (f) => (f.suppress ? undefined : typeof f.value === 'object' && f.value !== null ? JSON.stringify(f.value) : String(f.value));
const pageOf = (f) => (f.page == null ? 'Not stated' : `${typeof f.page === 'number' ? 'PDF p. ' : ''}${f.page}${f.printed != null && f.printed !== f.page ? ` (printed ${f.printed})` : ''}`);
// Confidence: the 1-5 rubric of /method/ prints "N of 5". A file that grades on its own scale keeps its grade and
// names the scale (no mapping to 1-5 is defined; /reports/method/#confidence lists the scales).
export function confOf(f) {
  const c = f.confidence;
  if (c == null) return 'Not graded';
  if (typeof c === 'number') return `${c} of 5`;
  const s = String(c);
  let m = s.match(/^tier ([A-D])$/);
  if (m) return `source tier ${m[1]} (scale A to D)`;
  if (/^(high|medium|low)$/.test(s)) return `${s} (scale high, medium, low)`;
  m = s.match(/^OCR(?: \(score ([\d.]+)\))?$/);
  if (m) return m[1] ? `OCR score ${m[1]} (scale 0 to 1)` : 'OCR reading, not scored';
  if (/^(compiled count|count compiled by Takwimu)$/.test(s)) return 'count compiled by Takwimu, not graded';
  return s;
}
const confWord = (f) => (typeof f.confidence === 'number' ? `confidence ${confOf(f)}` : confOf(f));
const MARK = { approved: 'Approved', disputed: 'Disputed', superseded: 'Superseded' };
const exception = (f) => (f.review && !f.review.hide && MARK[f.review.state] ? f.review.state : null);

// A figure rejected in editorial review (lib/review-status.js) prints the withdrawal and its rationale, not the value.
export function Fig({ f }) {
  const b = f.review;
  const obs = b ? { 'data-obs': b.key, 'data-obs-state': b.state } : {};
  const trace = { 'data-file': f.file, 'data-ptr': f.ptr, 'data-value': dataValue(f), 'data-page': f.page == null ? '' : String(f.page), 'data-conf': f.confidence == null ? '' : String(f.confidence), ...(f.obs ? { 'data-src-file': f.obs.file, 'data-src-ptr': f.obs.ptr } : {}) };
  if (b && b.hide) {
    return <span className="fig withheld" {...trace} {...obs}>{b.label}: {b.reason}</span>;
  }
  const ex = exception(f);
  return (
    <span className={`fig${f.reviewed ? '' : ' prov'}${f.display ? ' unclear' : ''}`} {...trace} data-suppressed={f.suppress ? 'true' : undefined} {...obs}
      {...(b && b.approved ? { 'data-review': 'approved', 'data-record': b.key } : {})}>
      {fmtValue(f)}{f.unit && typeof f.value === 'number' && !f.suppress && !f.display ? (f.unit === '%' ? '%' : ` ${f.unit}`) : ''}
      {ex ? <span className={`rp-mark ${ex}`}>{MARK[ex]}</span> : null}
    </span>
  );
}

function Cite({ f, bib }) {
  if (!f.source) return <span>Not stated</span>;
  return bib.has(f.source) ? <a href={`#src-${f.source}`}>{f.source}</a> : <span>{f.source}</span>;
}

// A fig inside a records, pairs or conflict table: value, then its citation in small type.
function FigCell({ f, bib }) {
  return (
    <>
      <Fig f={f} />
      <small className="cite"><Cite f={f} bib={bib} />; {pageOf(f)}; {f.period || 'period not stated'}; {confWord(f)}.</small>
    </>
  );
}
const cell = (c, bib) => (c && typeof c === 'object' && c.ptr ? <FigCell f={c} bib={bib} /> : c == null ? '' : String(c));

function Mixed({ parts, bib }) {
  return <>{parts.map((p, i) => (p && typeof p === 'object' && p.ptr ? <span key={i}><Fig f={p} /> <small className="cite">[<Cite f={p} bib={bib} />, {pageOf(p)}; {confWord(p)}]</small></span> : <span key={i}>{p}</span>))}</>;
}

// Notes of a table: parts shared by every row are stated once; the rest get footnote numbers.
function noteIndex(figs) {
  const parts = figs.map((f) => (f.notes || []).map((n) => String(n).trim().replace(/\.$/, '')).filter(Boolean));
  const shared = figs.length > 1 ? (parts[0] || []).filter((n) => parts.every((p) => p.includes(n))) : [];
  const fn = [];
  const marks = parts.map((p) => p.filter((n) => !shared.includes(n)).map((n) => { let k = fn.indexOf(n); if (k < 0) { fn.push(n); k = fn.length - 1; } return k + 1; }));
  return { shared, fn, marks };
}
function TableNotes({ shared, common, fn }) {
  if (!shared.length && !common.length && !fn.length) return null;
  return (
    <div className="rp-tnotes">
      {common.length || shared.length ? <p><strong>Every row:</strong> {[...common, ...shared].map((x, k) => <Fragment key={k}>{k ? '; ' : ''}{x}</Fragment>)}.</p> : null}
      {fn.length ? <ol>{fn.map((n, i) => <li key={i} id={undefined}>{n}.</li>)}</ol> : null}
    </div>
  );
}

const COLS = [
  { key: 'period', head: 'Period', w: 12, text: (f) => f.period || 'Not stated', render: (f) => f.period || 'Not stated' },
  { key: 'source', head: 'Source', w: 15, text: (f) => f.source || 'Not stated', render: (f, bib) => <Cite f={f} bib={bib} />, cls: 'src' },
  { key: 'page', head: 'Page', w: 11, text: (f) => pageOf(f), render: (f) => pageOf(f) },
  { key: 'conf', head: 'Confidence', w: 13, text: (f) => confOf(f), render: (f) => confOf(f) },
];

function FigTable({ caption, rows, bib }) {
  if (!rows.length) return <p className="rp-empty">{caption}: no values held.</p>;
  const figs = rows.map((r) => r.f);
  const { shared, fn, marks } = noteIndex(figs);
  // A column whose text is the same on every row is stated once under the caption instead.
  const same = (c) => rows.length > 1 && figs.every((f) => c.text(f) === c.text(figs[0]));
  const cols = COLS.filter((c) => !same(c));
  const common = COLS.filter(same).map((c) => (c.key === 'source'
    ? <span key="s">source <Cite f={figs[0]} bib={bib} /></span>
    : `${c.key === 'conf' ? 'confidence' : c.head.toLowerCase()} ${c.text(figs[0])}`));
  const rest = 100 - cols.reduce((a, c) => a + c.w, 0);
  return (
    <div className="rp-tblock">
      <table className="rp-table figs">
        <caption>{caption}</caption>
        <colgroup><col style={{ width: `${rest * 0.62}%` }} /><col style={{ width: `${rest * 0.38}%` }} />{cols.map((c) => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
        <thead><tr><th scope="col">Indicator</th><th scope="col">Value</th>{cols.map((c) => <th key={c.key} scope="col">{c.head}</th>)}</tr></thead>
        <tbody>
          {rows.map(({ f, label }, i) => (
            <tr key={i}>
              <th scope="row">{label || f.label}{marks[i].length ? <sup className="fn">{marks[i].join(',')}</sup> : null}</th>
              <td className="v"><Fig f={f} /></td>
              {cols.map((c) => <td key={c.key} className={c.cls}>{c.render(f, bib)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <TableNotes shared={shared} common={common.length ? [<span key="c">{common.map((x, k) => <span key={k}>{k ? '; ' : ''}{x}</span>)}</span>] : []} fn={fn} />
    </div>
  );
}

function Records({ caption, columns, rows, bib }) {
  if (!rows.length) return <p className="rp-empty">{caption}: no records held.</p>;
  return (
    <table className="rp-table records">
      <caption>{caption}</caption>
      <thead><tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{cell(c, bib)}</th> : <td key={j}>{cell(c, bib)}</td>))}</tr>)}</tbody>
    </table>
  );
}

function Pairs({ caption, rows, aLabel, bLabel, bib }) {
  if (!rows.length) return <p className="rp-empty">{caption}: none recorded.</p>;
  return (
    <table className="rp-table pairs">
      <caption>{caption}</caption>
      <colgroup><col style={{ width: '20%' }} /><col style={{ width: '11%' }} /><col style={{ width: '22%' }} /><col style={{ width: '22%' }} /><col style={{ width: '11%' }} /><col style={{ width: '14%' }} /></colgroup>
      <thead><tr><th scope="col">Measure</th><th scope="col">Period</th><th scope="col">{aLabel}</th><th scope="col">{bLabel}</th><th scope="col">Difference</th><th scope="col">Possible reason</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={i}><th scope="row">{r.label}</th><td>{r.period}</td><td><FigCell f={r.a} bib={bib} /></td><td><FigCell f={r.b} bib={bib} /></td><td><Fig f={r.diff} /></td><td className="note">{r.note || '–'}</td></tr>
      ))}</tbody>
    </table>
  );
}

function Conflicts({ caption, groups, bib }) {
  if (!groups.length) return <p className="rp-empty">{caption}: none recorded.</p>;
  return (
    <div className="rp-conflicts">
      <p className="rp-cap">{caption}</p>
      {groups.map((g, i) => (
        <table className="rp-table conflict" key={i}>
          <caption>{g.topic}</caption>
          <thead><tr><th scope="col">Value as held</th><th scope="col">Indicator</th><th scope="col">Source and page</th><th scope="col">Period</th><th scope="col">Confidence</th></tr></thead>
          <tbody>
            {g.figs.map((f, j) => <tr key={j}><td className="v"><Fig f={f} /></td><th scope="row">{f.label}</th><td><Cite f={f} bib={bib} />; {pageOf(f)}</td><td>{f.period || 'Not stated'}</td><td>{confOf(f)}</td></tr>)}
            <tr className="cnote"><td colSpan={5}>{g.note} {conflictNote(g.figs)}</td></tr>
          </tbody>
        </table>
      ))}
    </div>
  );
}

function Chart({ b }) {
  const series = b.series.map((s) => ({ name: s.name, values: s.figs.map((f) => (f && typeof f.value === 'number' ? f.value * (f.scale || 1) : null)) }));
  return <ReportChart kind={b.kind} title={b.title} labels={b.labels} series={series} unit={b.unit} />;
}

function Block({ b, bib }) {
  switch (b.type) {
    case 'p': return <p>{b.text}</p>;
    case 'list': return <ul className="rp-list">{b.items.map((it, i) => <li key={i}><Mixed parts={it} bib={bib} /></li>)}</ul>;
    case 'figs': return <FigTable caption={b.caption} rows={b.rows} bib={bib} />;
    case 'records': return <Records caption={b.caption} columns={b.columns} rows={b.rows} bib={bib} />;
    case 'pairs': return <Pairs caption={b.caption} rows={b.rows} aLabel={b.aLabel} bLabel={b.bLabel} bib={bib} />;
    case 'conflicts': return <Conflicts caption={b.caption} groups={b.groups} bib={bib} />;
    case 'chart': {
      // The unit is printed with each value; a value the chart rescales says so once, as a note.
      const rows = b.series.flatMap((s) => s.figs.map((f, i) => (f ? { f: f.scale && f.scale !== 1 ? { ...f, notes: [...(f.notes || []), 'The chart shows this value in KSh million'] } : f, label: `${s.name}, ${b.labels[i]}` } : null))).filter(Boolean);
      return <><Chart b={b} /><FigTable caption={`Table for the chart: ${b.title}`} rows={rows} bib={bib} /></>;
    }
    default: return null;
  }
}

function Topics({ list }) {
  if (!list || !list.length) return null;
  return (
    <p className="rp-topic">Canonical topic page{list.length > 1 ? 's' : ''}: {list.map((t, i) => <span key={t.href}>{i ? '; ' : ''}<a href={t.href}>{t.label}</a> <span className="rp-url">(takwimu.netlify.app{t.href})</span></span>)}.</p>
  );
}

export default function Report({ r }) {
  const bib = new Set(r.bibliography.map((s) => s.id));
  const n0 = r.sections.length;
  const appendices = [
    { id: 'gaps', title: 'Data gaps' },
    ...(r.meta.letter === 'A' ? [{ id: 'dictionary', title: 'Indicator dictionary' }] : []),
    { id: 'bibliography', title: 'Bibliography and document versions' },
    { id: 'snapshot', title: 'Snapshot, method and licence' },
  ];
  const st = r.reviewState;
  return (
    <main id="main" className="rp" data-report={r.meta.slug} data-snapshot={r.snapshot.id} data-draft={r.draft ? 'true' : 'false'}
      data-review-state={`${st.provisional}/${st.approved}/${st.disputed}/${st.superseded}/${st.withdrawn}`}>
      {r.draft ? <div className="rp-watermark" aria-hidden="true">DRAFT</div> : null}
      <header className="rp-cover">
        <img className="rp-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="160" height="151" />
        <p className="rp-kicker">Takwimu Kenya · Report {r.meta.letter}</p>
        <h1>{r.meta.title}</h1>
        <p className="rp-sub">{r.meta.subtitle}</p>
        <div className={r.draft ? 'rp-draft' : 'rp-reviewed'} role="note">
          {r.draft
            ? <p><strong>DRAFT.</strong> Every figure in this report is “{PROVISIONAL}” unless it carries a mark. This notice replaces a label on each figure; the watermark stays until every included figure has a review record.</p>
            : <p>Every figure in this report has an approved review record.</p>}
          <p className="rp-state">Review state: {st.provisional} provisional, {st.approved} approved, {st.disputed} disputed, {st.superseded} superseded, {st.withdrawn} withdrawn.</p>
          <p className="rp-legend-marks">Marks: <span className="rp-mark approved">Approved</span> approved in editorial review; <span className="rp-mark disputed">Disputed</span> the data file records a conflict for this value (both readings are kept); <span className="rp-mark superseded">Superseded</span> replaced by a later reading; a withdrawn value prints the withdrawal and its reason instead of the number.</p>
        </div>
        <dl className="rp-meta">
          <div><dt>Edition</dt><dd>{r.edition}</dd></div>
          <div><dt>Date</dt><dd>{r.date} (latest compile date of the input data files)</dd></div>
          <div><dt>Reference period</dt><dd>{r.referencePeriod}</dd></div>
          <div><dt>Snapshot ID</dt><dd className="mono">{r.snapshot.id}</dd></div>
          <div><dt>Geography</dt><dd>Siaya County (county code 41), Kenya</dd></div>
          <div><dt>Licence</dt><dd>Takwimu text: reuse with credit (<a href={`${METHOD_HREF}#licence`}>terms</a>). Source documents keep their publishers’ terms.</dd></div>
        </dl>
        <nav className="rp-toc" aria-label="Contents">
          <h2>Contents</h2>
          <ol>
            {r.sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`}>{i + 1}. {s.title}</a></li>)}
            {appendices.map((a, i) => <li key={a.id}><a href={`#${a.id}`}>{n0 + i + 1}. {a.title}</a></li>)}
          </ol>
        </nav>
        <p className="rp-howto">How to read this report, the method, the confidence scales and the licence are set out once for all five reports at <a href={METHOD_HREF}>How to read these reports</a> <span className="rp-url">(takwimu.netlify.app{METHOD_HREF})</span>. In short: <strong>Findings</strong> are values as the documents print them; <strong>Interpretation</strong> is Takwimu’s reading, not a finding; where documents disagree all values are shown and none is chosen.{/own[- ]source revenue|\bFIF\b/i.test(JSON.stringify(r)) ? <> Own-source revenue, hospital income (FIF) and A-i-A are counted differently by each publisher: <a href="/learn/#own-source-revenue">explained</a> <span className="rp-url">(takwimu.netlify.app/learn/#own-source-revenue)</span>.</> : null}</p>
      </header>

      {r.sections.map((s, i) => (
        <section key={s.id} id={s.id} className="rp-section" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{i + 1}. {s.title}</h2>
          <Topics list={s.topics} />
          <div className="rp-findings">
            <h3>Findings</h3>
            {s.findings.map((b, k) => <Block key={k} b={b} bib={bib} />)}
          </div>
          {s.interpretation.length ? (
            <div className="rp-interp">
              <h3>Interpretation (Takwimu editorial, not a finding)</h3>
              {s.interpretation.map((t, k) => <p key={k}>{t}</p>)}
            </div>
          ) : null}
        </section>
      ))}

      <section id="gaps" className="rp-section rp-appendix" aria-labelledby="gaps-h">
        <h2 id="gaps-h">{n0 + 1}. Data gaps</h2>
        <p>Gaps in the input files of this report, listed and never filled (see <a href={`${METHOD_HREF}#gaps`}>how gaps are handled</a>).</p>
        <table className="rp-table gaps">
          <colgroup><col style={{ width: '30%' }} /><col style={{ width: '52%' }} /><col style={{ width: '18%' }} /></colgroup>
          <thead><tr><th scope="col">Item</th><th scope="col">Reason</th><th scope="col">Data file</th></tr></thead>
          <tbody>{r.gaps.map((g, i) => <tr key={i}><th scope="row">{g.topic}</th><td>{g.reason}</td><td className="mono">data/{g.file}</td></tr>)}</tbody>
        </table>
      </section>

      {r.meta.letter === 'A' ? <Dictionary r={r} n={n0 + 2} /> : null}

      <section id="bibliography" className="rp-section rp-appendix" aria-labelledby="bibliography-h">
        <h2 id="bibliography-h">{n0 + appendices.length - 1}. Bibliography and document versions</h2>
        <p>Every document cited by a figure in this report, with the SHA-256 digest of the file version read (<a href={`${METHOD_HREF}#bibliography`}>conventions</a>).</p>
        <table className="rp-table bib">
          <colgroup><col style={{ width: '14%' }} /><col style={{ width: '34%' }} /><col style={{ width: '22%' }} /><col style={{ width: '18%' }} /><col style={{ width: '12%' }} /></colgroup>
          <thead><tr><th scope="col">Key</th><th scope="col">Title, publisher, date</th><th scope="col">SHA-256</th><th scope="col">URL</th><th scope="col">Licence</th></tr></thead>
          <tbody>{r.bibliography.map((s) => (
            <tr key={s.id} id={`src-${s.id}`}>
              <th scope="row" className="mono">{s.id}</th>
              <td>{s.title}. {s.publisher || 'Publisher not stated'}. {s.date || 'Date not stated'}.{s.period ? ` Period: ${s.period}.` : ''}</td>
              <td className="mono hash">{s.sha256 || 'not recorded'}</td>
              <td className="url">{s.url ? <a href={s.url}>{s.url}</a> : 'Not recorded'}</td>
              <td>{s.licence || 'Not stated: link and cite only'}</td>
            </tr>
          ))}</tbody>
        </table>
        {r.described.length ? (
          <>
            <h3>Sources cited by description</h3>
            <ul className="rp-list">{r.described.map((d) => <li key={d}>{d}</li>)}</ul>
          </>
        ) : null}
      </section>

      <section id="snapshot" className="rp-section rp-appendix" aria-labelledby="snapshot-h">
        <h2 id="snapshot-h">{n0 + appendices.length}. Snapshot, method and licence</h2>
        <p>Snapshot ID <span className="mono">{r.snapshot.id}</span> identifies the input files below and the review state of every value at the time of printing (review state: {st.provisional} provisional, {st.approved} approved, {st.disputed} disputed, {st.superseded} superseded, {st.withdrawn} withdrawn). How it is computed, the method, the confidence scales and the licence are at <a href={METHOD_HREF}>How to read these reports</a> <span className="rp-url">(takwimu.netlify.app{METHOD_HREF})</span>. This report contains no personal data and names no contractor or individual.</p>
        <table className="rp-table snap">
          <colgroup><col style={{ width: '32%' }} /><col style={{ width: '68%' }} /></colgroup>
          <thead><tr><th scope="col">Input file</th><th scope="col">SHA-256</th></tr></thead>
          <tbody>{r.snapshot.files.map((f) => <tr key={f.file}><th scope="row" className="mono">{f.file}</th><td className="mono hash">{f.sha256}</td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}

function Dictionary({ r, n }) {
  return (
    <section id="dictionary" className="rp-section rp-appendix" aria-labelledby="dictionary-h">
      <h2 id="dictionary-h">{n}. Indicator dictionary</h2>
      <table className="rp-table dict">
        <colgroup><col style={{ width: '28%' }} /><col style={{ width: '16%' }} /><col style={{ width: '56%' }} /></colgroup>
        <thead><tr><th scope="col">Indicator</th><th scope="col">Unit</th><th scope="col">Definition</th></tr></thead>
        <tbody>{r.dictionary.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.unit}</td><td>{d.definition}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
