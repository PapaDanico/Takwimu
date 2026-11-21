// Print-optimised report renderer. Server component: renders the blocks that build.js returns. Every value is a
// <Fig>, which carries data-file and data-ptr so scripts/test-reports.js can resolve it against the data file.
import { LineChart, ColumnChart } from '../Charts';
import { PROVISIONAL } from './model';

const num = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 6 });
const fmtValue = (f) => {
  if (f.suppress) return 'Suppressed (fewer than 10)';
  if (f.value === null || f.value === undefined || f.value === '') return 'Not published';
  if (typeof f.value === 'number') return num(f.value);
  if (typeof f.value === 'boolean') return f.value ? 'Yes' : 'No';
  if (typeof f.value === 'object') return JSON.stringify(f.value);
  return String(f.value).replace(/_/g, ' ');
};
const dataValue = (f) => (f.suppress ? undefined : typeof f.value === 'object' && f.value !== null ? JSON.stringify(f.value) : String(f.value));
const pageOf = (f) => (f.page == null ? 'Not stated' : `${typeof f.page === 'number' ? 'PDF p. ' : ''}${f.page}${f.printed != null && f.printed !== f.page ? ` (printed ${f.printed})` : ''}`);
const confOf = (f) => (f.confidence == null ? 'Not graded' : typeof f.confidence === 'number' ? `${f.confidence} of 5` : String(f.confidence));
const statusOf = (f) => (f.review ? f.review.label : PROVISIONAL);

// A figure rejected in editorial review (lib/review-status.js) prints the withdrawal and its rationale, not the value.
export function Fig({ f }) {
  const b = f.review;
  const obs = b ? { 'data-obs': b.key, 'data-obs-state': b.state } : {};
  if (b && b.hide) {
    return <span className="fig withheld" data-file={f.file} data-ptr={f.ptr} data-value={dataValue(f)} {...obs}>{b.label}: {b.reason}</span>;
  }
  return (
    <span className={`fig${f.reviewed ? '' : ' prov'}`} data-file={f.file} data-ptr={f.ptr} data-value={dataValue(f)} data-suppressed={f.suppress ? 'true' : undefined} {...obs}
      {...(b && b.approved ? { 'data-review': 'approved', 'data-record': b.key } : {})}>
      {fmtValue(f)}{f.unit && typeof f.value === 'number' && !f.suppress ? (f.unit === '%' ? '%' : ` ${f.unit}`) : ''}
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
      <small className="cite">
        <Cite f={f} bib={bib} />; {pageOf(f)}; {f.period || 'period not stated'}; confidence {confOf(f)}. <em>{statusOf(f)}</em>
      </small>
    </>
  );
}
const cell = (c, bib) => (c && typeof c === 'object' && c.ptr ? <FigCell f={c} bib={bib} /> : c == null ? '' : String(c));

function Mixed({ parts, bib }) {
  return <>{parts.map((p, i) => (p && typeof p === 'object' && p.ptr ? <span key={i}><Fig f={p} /> <small className="cite">[<Cite f={p} bib={bib} />, {pageOf(p)}; {statusOf(p)}]</small></span> : <span key={i}>{p}</span>))}</>;
}

function FigTable({ caption, rows, bib }) {
  if (!rows.length) return <p className="rp-empty">{caption}: no values held.</p>;
  return (
    <table className="rp-table figs">
      <caption>{caption}</caption>
      <colgroup><col style={{ width: '25%' }} /><col style={{ width: '13%' }} /><col style={{ width: '11%' }} /><col style={{ width: '11%' }} /><col style={{ width: '12%' }} /><col style={{ width: '9%' }} /><col style={{ width: '7%' }} /><col style={{ width: '12%' }} /></colgroup>
      <thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Unit</th><th scope="col">Period</th><th scope="col">Source</th><th scope="col">Page</th><th scope="col">Confidence</th><th scope="col">Review status</th></tr></thead>
      <tbody>
        {rows.map(({ f, label }, i) => (
          <tr key={i}>
            <th scope="row">{label || f.label}{f.note ? <small className="note">{f.note}</small> : null}</th>
            <td className="v"><Fig f={f} /></td>
            <td>{f.unit || '–'}</td>
            <td>{f.period || 'Not stated'}</td>
            <td className="src"><Cite f={f} bib={bib} /></td>
            <td>{pageOf(f)}</td>
            <td>{confOf(f)}</td>
            <td className="st">{statusOf(f)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
            <tr className="cnote"><td colSpan={5}>{g.note} All values above are {PROVISIONAL.toLowerCase()}; none has been chosen over another.</td></tr>
          </tbody>
        </table>
      ))}
    </div>
  );
}

function Chart({ b }) {
  const series = b.series.map((s, k) => ({ name: s.name, color: k + 1, values: s.figs.map((f) => (f && typeof f.value === 'number' ? f.value * (f.scale || 1) : null)) }));
  const C = b.kind === 'column' ? ColumnChart : LineChart;
  return (
    <div className="rp-chart">
      <p className="rp-cap">{b.title}</p>
      <C labels={b.labels} series={series} unit={b.unit} yFormat="int" ariaLabel={b.title} caption={b.title} />
    </div>
  );
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
      const rows = b.series.flatMap((s) => s.figs.map((f, i) => (f ? { f, label: `${s.name}, ${b.labels[i]}${f.scale && f.scale !== 1 ? ' (chart shows the value in KSh million)' : ''}` } : null))).filter(Boolean);
      return <><Chart b={b} /><FigTable caption={`Table for the chart: ${b.title}`} rows={rows} bib={bib} /></>;
    }
    default: return null;
  }
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
  return (
    <main id="main" className="rp" data-report={r.meta.slug} data-snapshot={r.snapshot.id} data-draft={r.draft ? 'true' : 'false'}>
      {r.draft ? <div className="rp-watermark" aria-hidden="true">DRAFT</div> : null}
      <header className="rp-cover">
        <img className="rp-logo" src="/brand/takwimu-logo.png" alt="Takwimu Kenya" width="160" height="151" />
        <p className="rp-kicker">Takwimu Kenya · Report {r.meta.letter}</p>
        <h1>{r.meta.title}</h1>
        <p className="rp-sub">{r.meta.subtitle}</p>
        {r.draft ? <p className="rp-draft">DRAFT: {r.unreviewed} figures in this report are “{PROVISIONAL}”. This watermark stays until every included figure has a review record.</p> : null}
        <dl className="rp-meta">
          <div><dt>Edition</dt><dd>{r.edition}</dd></div>
          <div><dt>Date</dt><dd>{r.date} (latest compile date of the input data files)</dd></div>
          <div><dt>Reference period</dt><dd>{r.referencePeriod}</dd></div>
          <div><dt>Snapshot ID</dt><dd className="mono">{r.snapshot.id}</dd></div>
          <div><dt>Geography</dt><dd>Siaya County (county code 41), Kenya</dd></div>
          <div><dt>Licence</dt><dd>Takwimu text: reuse with credit (see the last appendix). Source documents keep their publishers’ terms.</dd></div>
        </dl>
        <nav className="rp-toc" aria-label="Contents">
          <h2>Contents</h2>
          <ol>
            {r.sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`}>{i + 1}. {s.title}</a></li>)}
            {appendices.map((a, i) => <li key={a.id}><a href={`#${a.id}`}>{n0 + i + 1}. {a.title}</a></li>)}
          </ol>
        </nav>
        <p className="rp-howto">How to read this report: each section gives <strong>Findings</strong> (values as the documents print them, with source, page, period, unit and confidence) and then, separately, <strong>Interpretation</strong> (Takwimu’s reading, which is not a finding). Where documents disagree, the values are shown together and none is chosen.</p>
      </header>

      {r.sections.map((s, i) => (
        <section key={s.id} id={s.id} className="rp-section" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{i + 1}. {s.title}</h2>
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
        <p>Gaps are listed, never filled. A missing value is never shown as zero.</p>
        <table className="rp-table gaps">
          <colgroup><col style={{ width: '30%' }} /><col style={{ width: '52%' }} /><col style={{ width: '18%' }} /></colgroup>
          <thead><tr><th scope="col">Item</th><th scope="col">Reason</th><th scope="col">Data file</th></tr></thead>
          <tbody>{r.gaps.map((g, i) => <tr key={i}><th scope="row">{g.topic}</th><td>{g.reason}</td><td className="mono">data/{g.file}</td></tr>)}</tbody>
        </table>
      </section>

      {r.meta.letter === 'A' ? <Dictionary r={r} n={n0 + 2} /> : null}

      <section id="bibliography" className="rp-section rp-appendix" aria-labelledby="bibliography-h">
        <h2 id="bibliography-h">{n0 + appendices.length - 1}. Bibliography and document versions</h2>
        <p>Every document cited by a figure in this report. The SHA-256 digest identifies the exact file version read; “not recorded” means the file was not captured.</p>
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
        <p>Snapshot ID <span className="mono">{r.snapshot.id}</span> is the first 12 hex digits of a SHA-256 digest over the names and digests of the input files below. Rebuilding from the same files gives the same ID.</p>
        <table className="rp-table snap">
          <colgroup><col style={{ width: '32%' }} /><col style={{ width: '68%' }} /></colgroup>
          <thead><tr><th scope="col">Input file</th><th scope="col">SHA-256</th></tr></thead>
          <tbody>{r.snapshot.files.map((f) => <tr key={f.file}><th scope="row" className="mono">{f.file}</th><td className="mono hash">{f.sha256}</td></tr>)}</tbody>
        </table>
        <h3>Method</h3>
        <p>Every value is read at build time from the data file named above; no value is typed into the report. Values keep the unit, period and page the source prints. Confidence is the grade recorded in the data file (1 to 5 unless the file uses its own scale). Figures calculated by Takwimu are labelled as such and give their formula. A figure is reviewed only when its record carries an editorial review record; until then it is marked “{PROVISIONAL}” and the report carries a DRAFT watermark.</p>
        <h3>Licence</h3>
        <p>Takwimu Kenya’s original text, tables and charts in this report may be reused for personal, educational, journalistic, research or commercial purposes with the credit “Takwimu Kenya (takwimu.netlify.app), based on [the original publisher]”, without suggesting endorsement; say so if you change the material. The underlying documents and figures remain under their publishers’ own licences, listed in the bibliography. This report contains no personal data and names no contractor or individual.</p>
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
