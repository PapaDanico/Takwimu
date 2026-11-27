import Link from 'next/link';
import SourceErrorFlag from '../../components/SourceErrorFlag';
import CorrectionNote, { CorrectionMark } from '../../components/CorrectionNote';
import { notesFor } from '../../lib/correction-notes';
import Abbrs from '../../components/Abbrs';
import PageToc from '../../components/PageToc';
import { plain } from '../../lib/plain';
import PageHead from '../../components/PageHead';
import TableWrap from '../../components/TableWrap';
import hist from '../../data/history.json';
import reg from '../../data/conflicts.json';
import manifest from '../../data/source-manifest.json';
import { Provisional } from '../../components/ObsTable';
import { fmtMaybe, fmtNum } from '../../lib/format';
import siaya from '../../data/siaya.json';

// Duplication sweep D10: the figures of this question come from data/siaya.json, not page text.
const OSR = siaya.own_source_revenue;

const OPEN = [
  { q: `The report states ${OSR.share_of_annual_target_pct} per cent of the revenue target for FY ${OSR.fiscal_year}, but ${fmtNum(OSR.observations[0].value)} of ${fmtNum(OSR.target.value)} is about ${Math.round((OSR.observations[0].value / OSR.target.value) * 100)} per cent.`, note: 'Resolved in part: 47 per cent is measured against an annual target of about KSh 929 million, not the KSh 1,043 million in budget financing. The report does not explain why the two targets differ.' },
  { q: 'Own-source revenue for FY 2015/16 is KSh 127.93 million in the FY 2016/17 report and KSh 113.26 million in the FY 2018/19 report.', note: 'Both are shown. The reports do not say whether the later figure is a restatement.' },
  { q: 'FY 2016/17 recurrent spending is KSh 3.9 billion in one sentence of the report and KSh 3.65 billion in its table.', note: 'We use the table, which adds to the KSh 5.63 billion total.' },
  { q: 'The FY 2025/26 Controller of Budget report could not be reached from our build environment.', note: 'Press coverage reports Siaya at 26.94 per cent of its own-revenue target. We have not shown it because we could not read the document.' },
  { q: 'Audit opinions for FY 2014/15 to FY 2018/19 are missing.', note: 'The Auditor-General\'s site was unavailable and the Parliament library does not hold those reports. Search summaries suggest FY 2017/18 and FY 2018/19 were qualified, but we could not open the reports, so they are not shown.' },
  { q: 'The FY 2019/20 full-year county report could not be downloaded.', note: 'Only own-source revenue for that year is shown, taken from the FY 2020/21 report.' },
  // Sources looked for and not obtained (21 Nov 2026); the reasons are in data/ngo.json and data/political.json (not_staged).
];

const DOCS = Object.fromEntries(manifest.documents.map((d) => [d.id, d]));
const FIELD = {
  approved: 'Approved budget (KSh bn)', recurrent_budget: 'Recurrent budget (KSh bn)', development_budget: 'Development budget (KSh bn)',
  spent: 'Spending (KSh bn)', recurrent_spent: 'Recurrent spending (KSh bn)', development_spent: 'Development spending (KSh bn)',
  recurrent_absorption_pct: 'Recurrent absorption (%)', development_absorption_pct: 'Development absorption (%)',
  osr_m: 'Own-source revenue (KSh m)', osr_target_m: 'Own-source revenue target (KSh m)',
  pending_development_m: 'Pending bills, development (KSh m)', pending_recurrent_m: 'Pending bills, recurrent (KSh m)', pending_total_m: 'Pending bills, total (KSh m)',
};
const pageText = (r) => (r.page === null ? 'Not located' : `PDF p. ${r.page}${r.printed_page ? ` (printed p. ${r.printed_page})` : ''}`);
// rec: the history.json record id ("years:<fy>:<field>"), for source-error flags and correction footnotes.
function RefRows({ rows }) {
  return rows.map(([key, label, value, r, rec]) => (
    <tr key={key}>
      <th scope="row">{label}</th>
      <td>{value}{rec ? <CorrectionMark notes={notesFor('history', rec)} /> : null}</td>
      <td><a href={DOCS[r.source_id].url}>{DOCS[r.source_id].title}</a></td>
      <td>{pageText(r)}</td>
      <td>{r.read}{r.page_note ? `. ${r.page_note}` : ''}<SourceErrorFlag e={r.source_error} id={key} refId={rec ? `history:${rec}` : undefined} />{rec ? <CorrectionNote notes={notesFor('history', rec)} /> : null}</td>
    </tr>
  ));
}
const REF_HEAD = <thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">Document</th><th scope="col">Page</th><th scope="col">How read, note</th></tr></thead>;

export const metadata = {
  title: 'Siaya ten-year series: sources and conflicts',
  description: 'The Siaya ten-year series: where each figure was read, documents outside the series and the register of conflicts between sources.',
};

// Files that /datasets/ offers (duplication sweep D09): downloaded there, not listed again here.
const IN_CATALOGUE = new Set(['history.json', 'history.csv', 'conflicts.json', 'cpi.json', 'subcounties.json']);
const FILES = [
  { file: 'history.json', what: 'Ten-year Siaya series: budget, spending, absorption, own-source revenue, pending bills, audit opinions, population, health and poverty; plus FY 2025/26 in-year figures (in_year) and other documents for FY 2019/20 (supplementary), both kept out of the series', source: 'Controller of Budget annual and in-year county reports; Auditor-General reports and Senate compilations of them; Siaya County Treasury; KNBS census as reproduced in county plans; Kenya DHS 2014 and 2022', conf: '3 to 4' },
  { file: 'history.csv', what: 'The ten-year series in one long table: indicator, fiscal year, value, unit, basis (reported, derived or alternate), source report, source link and caveat', source: 'Built from history.json and cpi.json', conf: '3 to 4' },
  { file: 'conflicts.json', what: 'Source conflict register: where two reports disagree, with both values, definitions, hypotheses and status', source: 'Controller of Budget annual and in-year reports; Auditor-General via Senate committee; Siaya County Treasury', conf: '3 to 4' },
  { file: 'siaya.json', what: 'Latest-year fiscal context: FY 2024/25 revenue, budget, spending, pending bills and audit', source: 'Controller of Budget FY 2023/24 and 2024/25 reports', conf: '3 to 5' },
  { file: 'subcounties.json', what: 'Six sub-counties: population 2019 to 2027, area, density, facilities, health workers, voters', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'county.json', what: 'County population, households, urban centres, age groups, poverty and health indicators', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'cpi.json', what: 'Kenya consumer price index, calendar and fiscal-year averages', source: 'World Bank, series FP.CPI.TOTL', conf: '4' },
  { file: 'siaya-boundaries.json', what: 'Simplified outlines of the six Siaya sub-counties, as map paths, with their licence and source', source: 'geoBoundaries (IEBC boundaries via OCHA), CC BY 3.0 IGO', conf: '4' },
  { file: 'source-manifest.json', what: 'Source documents behind the ten-year series: title, link, fiscal year, retrieval date and a SHA-256 checksum of the exact PDF downloaded, so anyone can confirm they hold the same file', source: 'Parliament of Kenya library copies of Controller of Budget, Auditor-General and Senate reports; a Senate annex and a county paper that publish no checksum are listed without a hash', conf: 'n/a' },
  { file: 'sources.json', what: 'Source register', source: 'Takwimu', conf: 'n/a' },
];

export default function DataPage() {
  const rows = hist.years.length;
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Ten-year series" title="Siaya ten-year series: sources and conflicts" sub="The Siaya series behind the ten-year pages, the source of every year and the register of conflicts between sources. Every file is plain JSON. Each figure carries its source and confidence, so you can check it or reuse it. Please cite the original publisher as well as Takwimu." path="/data/" shareText="Takwimu Kenya open data" />
      <Provisional dataset={'history'}>Figures were transcribed by Takwimu from the Controller of Budget and Auditor-General reports and have not yet been checked by a reviewer.</Provisional>
      <Abbrs list={['FIF', 'A-i-A']} />
      <nav className="card" aria-label="Data and method"><p style={{ margin: 0 }}>This section covers the data and how it is checked. <Link href="/method/">Read the method</Link> · <Link href="/datasets/">Search all datasets</Link></p></nav>
      <PageToc items={[['f-h', 'Files'], ['c-h', 'Coverage'], ['pref-h', 'Where each figure was read'], ['supp-h', 'Other documents'], ['reg-h', 'Conflict register'], ['open', 'Open questions']]} />

      <section className="card" aria-labelledby="f-h">
        <h2 id="f-h">Files</h2>
        <p className="lead">The series, the conflict register, the price index and the sub-county file download from <Link href="/datasets/?q=Siaya">Datasets</Link>, the one catalogue of downloads, each with its source, unit and date. The reference files below are not datasets in the catalogue.</p>
        <TableWrap label="Reference files">
          <table className="data">
            <caption className="sr-only">Data files</caption>
            <thead><tr><th scope="col">File</th><th scope="col">Contents</th><th scope="col">Source</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {FILES.filter((f) => !IN_CATALOGUE.has(f.file)).map((f) => (
                <tr key={f.file}>
                  <th scope="row"><a className="file" href={`/data/${f.file}`} download>{f.file}</a></th>
                  <td>{f.what}</td><td>{f.source}</td><td>{f.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
      <section className="card" aria-labelledby="c-h">
        <h2 id="c-h">What the history file covers</h2>
        <ul className="steps">
          <li>{rows} fiscal years from {hist.years[0].fy} to {hist.years[hist.years.length - 1].fy}, each tied to a named report with a link.</li>
          <li>Values are nominal KSh. Use cpi.json to adjust for prices; the method is on the Method page.</li>
          <li>Where two reports disagree, both values appear in the file as an alternate.</li>
        </ul>
        <p className="how">{hist.meta.gaps.length} gaps in the series are listed, with their reasons, once: <Link href="/method/#known-gaps">known gaps</Link>. The printable one-page brief built from the same files is on <Link href="/reports/#briefs">Reports</Link>.</p>
      </section>
      <section className="card" id="page-references" aria-labelledby="pref-h">
        <h2 id="pref-h">Where each figure was read</h2>
        <p className="lead">Every figure in the ten-year series, the audit opinions and the own-source revenue series names the document it came from (with its checksum in source-manifest.json) and the page where we found it. PDF page counts from the first page of the file; printed page is the number on the page, given only where the report numbers its pages consistently. A figure we could not find again is marked not located rather than given a guessed page.</p>
        {hist.years.map((y) => (
          <details key={y.fy} className="refs">
            <summary>FY {y.fy}: {Object.keys(y.provenance).length} figures</summary>
            <div className="tablewrap" tabIndex={0} role="region" aria-label={`Page references, FY ${y.fy}`}>
              <table className="data">
                <caption className="sr-only">Page references for FY {y.fy}</caption>
                {REF_HEAD}
                <tbody><RefRows rows={Object.entries(y.provenance).map(([k, r]) => [k, FIELD[k] || k, y[k], r, `years:${y.fy}:${k}`])} /></tbody>
              </table>
            </div>
          </details>
        ))}
        <details className="refs">
          <summary>Audit opinions: {hist.audits.points.length} years</summary>
          <div className="tablewrap" tabIndex={0} role="region" aria-label="Page references, audit opinions">
            <table className="data">
              <caption className="sr-only">Page references for audit opinions</caption>
              {REF_HEAD}
              <tbody><RefRows rows={hist.audits.points.map((a) => [a.fy, `Audit opinion, FY ${a.fy}`, a.opinion, a])} /></tbody>
            </table>
          </div>
        </details>
        <details className="refs">
          <summary>Own-source revenue series: {hist.osr_series.points.length} years and {hist.osr_series.points.filter((p) => p.alternate).length} alternates</summary>
          <div className="tablewrap" tabIndex={0} role="region" aria-label="Page references, own-source revenue">
            <table className="data">
              <caption className="sr-only">Page references for the own-source revenue series</caption>
              {REF_HEAD}
              <tbody><RefRows rows={hist.osr_series.points.flatMap((p) => [[p.fy, `Own-source revenue, FY ${p.fy} (KSh m)`, p.value, p], ...(p.alternate ? [[`${p.fy}-alt`, `Own-source revenue, FY ${p.fy}, alternate (KSh m)`, p.alternate.value, p.alternate]] : [])])} /></tbody>
            </table>
          </div>
        </details>
        <p className="how">FY {hist.in_year.fy} in-year figures and the FY 2019/20 documents below carry their PDF pages in their own tables.</p>
      </section>
      <section className="card" id="other-documents" aria-labelledby="supp-h">
        <h2 id="supp-h">{hist.supplementary.label}</h2>
        <p className="lead">{hist.supplementary.note}</p>
        {hist.supplementary.documents.map((d) => (
          <TableWrap key={d.id} label={d.title}>
            <table className="data">
              <caption><a href={d.url}>{d.title}</a>. {d.kind}; read from the {d.read}; confidence {d.confidence} of 5.</caption>
              <thead><tr><th scope="col">Figure, FY {d.fy}</th><th scope="col">Value</th><th scope="col">PDF page</th></tr></thead>
              <tbody>{d.figures.map((f) => <tr key={f.measure}><th scope="row">{f.label}</th><td>{f.unit === '%' ? `${f.value}%` : `${f.unit} ${fmtNum(f.value)}`}</td><td>{f.pdf_page}</td></tr>)}</tbody>
            </table>
          </TableWrap>
        ))}
        <p className="how">Searched, no Siaya figures: {hist.supplementary.not_found.replace(/: https:\/\/\S+$/, '.')}</p>
      </section>
      <section className="card" id="conflicts" aria-labelledby="reg-h">
        <h2 id="reg-h">Source conflict register</h2>
        <p className="lead">{reg.meta.rule}</p>
        <div className="log">
          {reg.conflicts.map((c) => (
            <article key={c.id} id={c.id} className="term-card">
              <p><span className={`tag ${c.status === 'open' ? 'warn' : 'good'}`}>{c.status === 'open' ? 'Open' : 'Resolved'}</span>{c.register === 'our_correction' ? <> <span className="tag" data-register="our_correction">Our correction</span></> : c.register === 'source_error' ? <> <span className="tag warn" data-register="source_error">Source error in original</span></> : null}</p>
              <h3>{c.measure}</h3>
              <TableWrap label={`${c.measure}: values by source`}>
                <table className="data">
                  <caption className="sr-only">{c.measure}: values by source</caption>
                  <thead><tr><th scope="col">Source</th><th scope="col">Value ({c.unit})</th></tr></thead>
                  <tbody>{c.values.map((v) => <tr key={v.label}><th scope="row"><a href={v.url}>{v.label}</a></th><td>{fmtMaybe(v.value)}</td></tr>)}</tbody>
                </table>
              </TableWrap>
              {typeof c.values[0].value === 'number' ? <p><b>Difference:</b> {fmtNum(Math.abs(c.values[0].value - c.values[1].value), { dp: 2 })} {c.unit} ({((Math.abs(c.values[0].value - c.values[1].value) / c.values[0].value) * 100).toFixed(1)}% of the first value)</p> : <p><b>Difference:</b> a label, citation or licence, not an amount.</p>}
              {c.ledger_cases ? <p><b>Fiscal-ledger cases comparing these values:</b> {c.ledger_cases.map((id, i) => <span key={id}>{i ? ', ' : ''}<a href={`/counties/siaya/ledger/?case=${id}#led-cases`}>{id}</a></span>)} (machine-classified pairs; <Link href="/counties/siaya/ledger/#two-registers">why there are two registers</Link>).</p> : null}
              <p><b>Definitions:</b> {plain(c.definitions)}</p>
              <p><b>Hypothesis, not established:</b> {plain(c.hypothesis)}</p>
              {/* A caveat shared by several cases is stated once, at its first case (owner decision U3). */}
              {(() => { const first = reg.conflicts.find((x) => x.effect === c.effect); return first.id === c.id ? <p><b>Effect on the site:</b> {plain(c.effect)}</p> : <p><b>Effect on the site:</b> as for case <a href={`#${first.id}`}>{first.id}</a>.</p>; })()}
            </article>
          ))}
        </div>
        <p className="how">Review status: {reg.meta.reviewed}. Register last updated {reg.meta.updated}.</p>
      </section>
      <section className="card" id="gaps" aria-labelledby="open">
        <h2 id="open">Open questions</h2>
        <p className="lead">Sources we could not use, with the reason and the retry date, are listed once under <Link href="/method/#known-gaps">known gaps</Link>.</p>
        <div className="log">
          {OPEN.map((o, i) => (
            <article key={i} className="term-card">
              <p><b>{o.q}</b></p>
              <p>{o.note}</p>
            </article>
          ))}
        </div>
        <p className="how">To report an error, <a href="https://wa.me/message/GPPIKMENXJVWO1" target="_blank" rel="noopener noreferrer">message us on WhatsApp</a> with the page, the figure and the document that shows the right value.</p>
      </section>
    </main>
  );
}
