import PageHead from '../../components/PageHead';
import hist from '../../data/history.json';

export const metadata = {
  title: 'Data downloads and sources',
  description: 'Download the JSON data behind Takwimu Counties, with the source and confidence of each file.',
};

const FILES = [
  { file: 'history.json', what: 'Ten-year Siaya series: budget, spending, absorption, own-source revenue, pending bills, audit opinions, population, health and poverty', source: 'Controller of Budget annual county reports; Auditor-General reports; KNBS census as reproduced in county plans; Kenya DHS 2014 and 2022', conf: '3 to 4' },
  { file: 'history.csv', what: 'The ten-year series in one long table: indicator, fiscal year, value, unit, basis (reported, derived or alternate), source report, source link and caveat', source: 'Built from history.json and cpi.json', conf: '3 to 4' },
  { file: 'conflicts.json', what: 'Source conflict register: where two reports disagree, with both values, definitions, hypotheses and status', source: 'Controller of Budget annual reports', conf: '3 to 4' },
  { file: 'siaya.json', what: 'Latest-year fiscal context: FY 2024/25 revenue, budget, spending, pending bills and audit', source: 'Controller of Budget FY 2023/24 and 2024/25 reports', conf: '3 to 5' },
  { file: 'subcounties.json', what: 'Six sub-counties: population 2019 to 2027, area, density, facilities, health workers, voters', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'county.json', what: 'County population, households, urban centres, age groups, poverty and health indicators', source: 'Siaya County Integrated Development Plan 2023 to 2027', conf: '4' },
  { file: 'cpi.json', what: 'Kenya consumer price index, calendar and fiscal-year averages', source: 'World Bank, series FP.CPI.TOTL', conf: '4' },
  { file: 'sources.json', what: 'Source register', source: 'Takwimu', conf: 'n/a' },
];

export default function DataPage() {
  const rows = hist.years.length;
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Data" title="Data downloads and sources" sub="Every file is plain JSON. Each figure carries its source and confidence, so you can check it or reuse it. Please cite the original publisher as well as Takwimu." path="/data/" shareText="Takwimu Counties open data" />
      <section className="card" aria-labelledby="f-h">
        <h2 id="f-h">Files</h2>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">Data files</caption>
            <thead><tr><th scope="col">File</th><th scope="col">Contents</th><th scope="col">Source</th><th scope="col">Confidence</th></tr></thead>
            <tbody>
              {FILES.map((f) => (
                <tr key={f.file}>
                  <th scope="row"><a className="file" href={`/data/${f.file}`} download>{f.file}</a></th>
                  <td>{f.what}</td><td>{f.source}</td><td>{f.conf}</td>
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
    </main>
  );
}
