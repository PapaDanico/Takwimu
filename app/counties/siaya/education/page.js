import Link from 'next/link';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import { ColumnChart } from '../../../../components/Charts';
import ObsTable, { Provisional } from '../../../../components/ObsTable';
import { source } from '../../../../lib/siaya-sources';
import { masked } from '../../../../lib/review-status';
import { pageMeta } from '../../../../lib/page-meta';
const e = masked('siaya-education');

export const metadata = pageMeta('/counties/siaya/education/', {
  title: 'Education in Siaya',
  description: 'Siaya education by source: pre-primary (ECDE), vocational training and county bursaries (county functions) kept apart from primary, secondary and teachers (national functions), with ten source inconsistencies side by side.',
});

const obs = e.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const SRC = { 'MOE-BESB-2019': 'Ministry booklet 2019', 'MOE-BESB-2014': 'Ministry booklet 2014', 'KNBS-ABS-2015': 'KNBS abstract 2015', 'CIDP-2023-2027': 'CIDP 2023-2027', 'KDHS-2022': 'KDHS 2022', 'KDHS-2014': 'KDHS 2014', 'CBIRR-FY2025-26-Q4': 'County Q4 report FY 2025/26', 'BROP-FY2024-25': 'CBROP FY 2024/25' };
const TYPE = { plan_target: 'Plan target, not achieved', projection: 'Projection, not counted', approved_estimate: 'Budget plan, not spending', baseline: 'Plan baseline', provisional: 'Provisional (source marks *)', survey_estimate: 'Survey estimate', unclear: 'Unclear: equals the projected 3-5 population, not shown as enrolment' };
const label = (o) => [o.indicator.replace(/_/g, ' '), o.level && o.level !== o.indicator ? o.level : '', o.sector && o.sector !== 'all' ? o.sector : '', o.sex && o.sex !== 'total' ? o.sex : ''].filter(Boolean).join(', ');
const row = (o) => ({
  key: o.id, label: label(o), value: o.value, value_text: o.value === null ? 'not printed (shown as a gap)' : null, unit: o.unit, period: o.period, source_id: o.source_id, table: o.table,
  pdf_page: o.pdf_page, printed_page: o.printed_page, confidence: o.confidence, note: o.note || '', ...(TYPE[o.value_type] ? { tag: TYPE[o.value_type], tagTone: o.value_type === 'provisional' || o.value_type === 'survey_estimate' || o.value_type === 'baseline' ? 'plain' : 'warn' } : {}),
});
const sorted = (fn) => obs.filter((o) => o.function === fn).sort((a, b) => a.indicator.localeCompare(b.indicator) || String(a.period).localeCompare(String(b.period)));
// Pre-primary enrolment, all pupils (public and private), one bar per source and year as printed.
const ppTotal = obs.filter((o) => o.indicator === 'pre_primary_enrolment' && o.sex === 'total' && o.sector === 'all' && o.value_type !== 'projection' && o.value_type !== 'unclear');
const enrol = (ind, src) => obs.find((o) => o.indicator === ind && o.sex === 'total' && o.sector === 'all' && o.source_id === src);
const fnCount = (fn) => obs.filter((o) => o.function === fn).length;

export default function SiayaEducation() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Education" title="Education in Siaya"
        sub="Schools, pupils, teachers, vocational training and bursaries in Siaya County, from the Ministry of Education, KNBS, the county government and national surveys. What the county runs is shown apart from what the national government runs."
        path="/counties/siaya/education/" shareText="Education in Siaya: by source and by level of government" />

      <PageToc items={[['ed-dev', 'County functions'], ['ed-nat', 'National functions'], ['ed-conf', 'Inconsistencies'], ['ed-gaps', 'Not published']]} />
      <section className="card gold" aria-labelledby="ed-read">
        <h2 id="ed-read">How to read this page</h2>
        <Provisional dataset="siaya-education" />
        <ul className="how">
          <li id="devolved-vs-national"><b>Two levels of government.</b> Under the Constitution&rsquo;s Fourth Schedule the county runs pre-primary education (ECDE), village polytechnics (vocational training centres) and its own bursary fund. Primary and secondary schools, teachers employed by the Teachers Service Commission, national technical institutes and CDF bursaries are national functions. The two are shown in separate sections.</li>
          <li><b>Each source is its own vintage.</b> The Ministry&rsquo;s 2014 and 2019 booklets, the KNBS abstract and the county plan are never merged; where they differ, both values are shown.</li>
          <li><b>Plans are not results.</b> Targets, projections and budget plans are labelled; a printed &ldquo;-&rdquo; is a gap, never a zero.</li>
          <li>Aggregates only: no school-, learner- or person-level data.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="ed-dev">
        <h2 id="ed-dev">County (devolved) functions</h2>
        <p className="lead">Pre-primary education, vocational training centres, the county bursary fund and the county education budget: {fnCount('devolved')} values. Pre-primary enrolment, all pupils, one bar per source and year as printed.</p>
        <ColumnChart labels={ppTotal.map((o) => `${o.period.split(' ')[0]} ${SRC[o.source_id] || o.source_id}`)} unit="pupils" yFormat="int"
          ariaLabel="Siaya pre-primary (ECDE) enrolment by source and year, pupils"
          series={[{ name: 'Pre-primary enrolment, pupils', color: 1, values: ppTotal.map((o) => o.value) }]} />
        <p className="src">The CIDP&rsquo;s end-2022 figure (81,771) equals its own projected population aged 3 to 5 for 2022, so it may not be an enrolment count (inconsistency 7 below).</p>
        <ObsTable dataset="siaya-education" caption="Siaya county (devolved) education functions, every value" id="devolved" rows={sorted('devolved').map(row)} />
      </section>

      <section className="card" aria-labelledby="ed-nat">
        <h2 id="ed-nat">National functions in Siaya</h2>
        <p className="lead">Primary and secondary schools, teachers, national technical institutes, CDF bursaries, KDHS attendance and attainment, and population context: {fnCount('national')} values. Primary and secondary enrolment from the two Ministry booklets, all pupils.</p>
        <ColumnChart labels={['Primary', 'Secondary']} unit="pupils" yFormat="int"
          ariaLabel="Siaya primary and secondary enrolment, Ministry of Education booklets 2014 and 2019, pupils"
          series={[{ name: 'Ministry booklet 2014', color: 1, values: [enrol('primary_enrolment', 'MOE-BESB-2014'), enrol('secondary_enrolment', 'MOE-BESB-2014')].map((o) => (o ? o.value : null)) },
            { name: 'Ministry booklet 2019', color: 2, values: [enrol('primary_enrolment', 'MOE-BESB-2019'), enrol('secondary_enrolment', 'MOE-BESB-2019')].map((o) => (o ? o.value : null)) }]} />
        <ObsTable dataset="siaya-education" caption="National education functions in Siaya, every value" id="national" rows={sorted('national').map(row)} />
      </section>

      <section className="card" aria-labelledby="ed-conf">
        <h2 id="ed-conf">Ten inconsistencies between and within sources</h2>
        <p className="lead">Each is shown with the values involved. None is resolved by choosing one value.</p>
        <ol className="conflicts">
          {e.conflicts.map((c) => (
            <li key={c.id} className="conflict" id={c.id}>
              <p><b>{c.description}</b></p>
              <p>How it is handled: {c.handling}</p>
              <ObsTable dataset="siaya-education" caption={`${c.id}: values side by side`} rows={c.observations.map((id) => row(byId[id]))} showNote={false} />
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="ed-gaps">
        <h2 id="ed-gaps">What is not published or not yet found</h2>
        <ul className="how">{e.gaps.map((g) => <li key={g.indicator}><b>{g.indicator.replace(/_/g, ' ')} ({g.function}):</b> {g.reason}</li>)}</ul>
        <p className="src">The ten-year rule is not met for education: values exist for 2013, 2014, 2019, 2022 and plan baselines only. Sources: {e.sources.map((s, i) => { const r = source(s.source_id); return <span key={s.source_id}>{i ? '; ' : ''}{r.url ? <a href={r.url} rel="noopener">{s.title}</a> : s.title}</span>; })}. Every value is in the <Link href="/datasets/?q=siaya-education">dataset catalogue</Link> and in <a href="/data/siaya-education.json">siaya-education.json</a>.</p>
      </section>
    </main>
  );
}
