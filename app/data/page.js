import PageHead from '../../components/PageHead';
import hist from '../../data/history.json';
import reg from '../../data/conflicts.json';

const OPEN = [
  { q: 'The report states 47 per cent of the revenue target for FY 2024/25, but 436.68 of 1,043 is about 42 per cent.', note: 'Resolved in part: 47 per cent is measured against an annual target of about KSh 929 million, not the KSh 1,043 million in budget financing. The report does not explain why the two targets differ.' },
  { q: 'Own-source revenue for FY 2015/16 is KSh 127.93 million in the FY 2016/17 report and KSh 113.26 million in the FY 2018/19 report.', note: 'Both are shown. The reports do not say whether the later figure is a restatement.' },
  { q: 'FY 2016/17 recurrent spending is KSh 3.9 billion in one sentence of the report and KSh 3.65 billion in its table.', note: 'We use the table, which adds to the KSh 5.63 billion total.' },
  { q: 'The FY 2025/26 Controller of Budget report could not be reached from our build environment.', note: 'Press coverage reports Siaya at 26.94 per cent of its own-revenue target. We have not shown it because we could not read the document.' },
  { q: 'Audit opinions for FY 2014/15 to FY 2018/19 are missing.', note: 'The Auditor-General\'s site was unavailable and the Parliament library does not hold those reports. Search summaries suggest FY 2017/18 and FY 2018/19 were qualified, but we could not open the reports, so they are not shown.' },
  { q: 'The FY 2019/20 full-year county report could not be downloaded.', note: 'Only own-source revenue for that year is shown, taken from the FY 2020/21 report.' },
];

export const metadata = {
  title: 'Data downloads and sources',
  description: 'Download the JSON data behind Takwimu Kenya, with the source and confidence of each file.',
};

const FILES = [
  { file: 'history.json', asof: '20 Nov 2026', what: 'Ten-year Siaya series: budget, spending, absorption, own-source revenue, pending bills, audit opinions, population, health and poverty', source: 'Controller of Budget annual county reports; Auditor-General reports; KNBS census as reproduced in county plans; Kenya DHS 2014 and 2022', conf: '3 to 4' },
  { file: 'history.csv', asof: '20 Nov 2026', what: 'The ten-year series in one long table: indicator, fiscal year, value, unit, basis (reported, derived or alternate), source report, source link and caveat', source: 'Built from history.json and cpi.json', conf: '3 to 4' },
  { file: 'conflicts.json', asof: '21 Nov 2026', what: 'Source conflict register: where two reports disagree, with both values, definitions, hypotheses and status', source: 'Controller of Budget annual reports', conf: '3 to 4' },
  { file: 'siaya.json', asof: '20 Nov 2026', what: 'Latest-year fiscal context: FY 2024/25 revenue, budget, spending, pending bills and audit', source: 'Controller of Budget FY 2023/24 and 2024/25 reports', conf: '3 to 5' },
  { file: 'subcounties.json', asof: '20 Nov 2026', what: 'Six sub-counties: population 2019 to 2027, area, density, facilities, health workers, voters', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'county.json', asof: '20 Nov 2026', what: 'County population, households, urban centres, age groups, poverty and health indicators', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'cpi.json', asof: '20 Nov 2026', what: 'Kenya consumer price index, calendar and fiscal-year averages', source: 'World Bank, series FP.CPI.TOTL', conf: '4' },
  { file: 'siaya-boundaries.json', asof: '21 Nov 2026', what: 'Simplified outlines of the six Siaya sub-counties, as map paths, with their licence and source', source: 'geoBoundaries (IEBC boundaries via OCHA), CC BY 3.0 IGO', conf: '4' },
  { file: 'source-manifest.json', asof: '21 Nov 2026', what: 'Source documents behind the ten-year series: title, link, fiscal year, retrieval date and a SHA-256 checksum of the exact PDF downloaded, so anyone can confirm they hold the same file', source: 'Parliament of Kenya library copies of Controller of Budget and Auditor-General reports', conf: 'n/a' },
  { file: 'sources.json', asof: '20 Nov 2026', what: 'Source register', source: 'Takwimu', conf: 'n/a' },
];

export default function DataPage() {
  const rows = hist.years.length;
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Data" title="Data downloads and sources" sub="Every file is plain JSON. Each figure carries its source and confidence, so you can check it or reuse it. Please cite the original publisher as well as Takwimu." path="/data/" shareText="Takwimu Kenya open data" />
      <section className="card" aria-labelledby="f-h">
        <h2 id="f-h">Files</h2>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Data files</caption>
            <thead><tr><th scope="col">File</th><th scope="col">Contents</th><th scope="col">Source</th><th scope="col">Confidence</th><th scope="col">Retrieved</th></tr></thead>
            <tbody>
              {FILES.map((f) => (
                <tr key={f.file}>
                  <th scope="row"><a className="file" href={`/data/${f.file}`} download>{f.file}</a></th>
                  <td>{f.what}</td><td>{f.source}</td><td>{f.conf}</td><td>{f.asof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card" aria-labelledby="c-h">
        <h2 id="c-h">What the history file covers</h2>
        <ul className="steps">
          <li>{rows} fiscal years from {hist.years[0].fy} to {hist.years[hist.years.length - 1].fy}, each tied to a named report with a link.</li>
          <li>Values are nominal KSh. Use cpi.json to adjust for prices; the method is on the Method page.</li>
          <li>Where two reports disagree, both values appear in the file as an alternate.</li>
        </ul>
        <h3 className="mini">Gaps</h3>
        <ul className="steps">{hist.meta.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
      </section>
      <section className="card" id="conflicts" aria-labelledby="reg-h">
        <h2 id="reg-h">Source conflict register</h2>
        <p className="lead">{reg.meta.rule}</p>
        <div className="log">
          {reg.conflicts.map((c) => (
            <article key={c.id} id={c.id} className="term-card">
              <p><span className={`tag ${c.status === 'open' ? 'warn' : 'good'}`}>{c.status === 'open' ? 'Open' : 'Resolved'}</span></p>
              <h3>{c.measure}</h3>
              <div className="tablewrap">
                <table className="data">
                  <caption className="sr-only">{c.measure}: values by source</caption>
                  <thead><tr><th scope="col">Source</th><th scope="col">Value ({c.unit})</th></tr></thead>
                  <tbody>{c.values.map((v) => <tr key={v.label}><th scope="row"><a href={v.url}>{v.label}</a></th><td>{v.value.toLocaleString('en-US')}</td></tr>)}</tbody>
                </table>
              </div>
              <p><b>Difference:</b> {Math.abs(c.values[0].value - c.values[1].value).toLocaleString('en-US', { maximumFractionDigits: 2 })} {c.unit} ({((Math.abs(c.values[0].value - c.values[1].value) / c.values[0].value) * 100).toFixed(1)}% of the first value)</p>
              <p><b>Definitions:</b> {c.definitions}</p>
              <p><b>Hypothesis, not established:</b> {c.hypothesis}</p>
              <p><b>Effect on the site:</b> {c.effect}</p>
            </article>
          ))}
        </div>
        <p className="how">Review status: {reg.meta.reviewed}. Register last updated {reg.meta.updated}.</p>
      </section>
      <section className="card" id="gaps" aria-labelledby="open">
        <h2 id="open">Known gaps and open questions</h2>
        <div className="log">
          {OPEN.map((o, i) => (
            <article key={i} className="term-card">
              <p><b>{o.q}</b></p>
              <p>{o.note}</p>
            </article>
          ))}
        </div>
        <p className="how">To report an inaccuracy, open an issue at <a href="https://github.com/PapaDanico/Takwimu/issues">github.com/PapaDanico/Takwimu/issues</a> with the page, the figure and the document that shows the right value.</p>
      </section>
    </main>
  );
}
