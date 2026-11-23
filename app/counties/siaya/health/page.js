import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import ProfileHealth from '../../../../components/siaya/ProfileHealth';
import { ColumnChart } from '../../../../components/Charts';
import ObsTable, { Provisional } from '../../../../components/ObsTable';
import { source } from '../../../../lib/siaya-sources';
import { masked } from '../../../../lib/review-status';
const h = masked('siaya-health');

export const metadata = {
  title: 'Health in Siaya',
  description: 'Siaya health indicators by source: HIV estimates by model round, TB, malaria, maternal care, immunisation, stunting and health workforce, with page, period and confidence for every value and disagreements side by side.',
};

const obs = h.observations;
const byId = Object.fromEntries(obs.map((o) => [o.id, o]));
const SECONDARY_ONLY = (o) => o.status === 'secondary report' && o.confidence === 1;
const tagOf = (o) => (o.sentinel_site ? { tag: 'Sentinel site: not county-representative' } : SECONDARY_ONLY(o) ? { tag: 'Secondary report: original not named' } : o.status === 'secondary report' ? { tag: 'Quoted by another document', tagTone: 'plain' } : {});
const row = (o, label) => ({
  key: o.id, label: label || o.label, value: o.value, unit: o.unit, period: `${o.period}${o.age_group && o.age_group !== 'not stated' ? `; ages ${o.age_group}` : ''}`,
  source_id: o.source_id, table: o.table, pdf_page: o.pdf_page, printed_page: o.printed_page, page_note: o.page_note, confidence: o.confidence, source_error: o.source_error || null,
  note: [o.vintage ? `Round or vintage: ${o.vintage}.` : '', o.original_source ? `Original named: ${o.original_source}.` : '', o.note || ''].filter(Boolean).join(' '), ...tagOf(o),
});
const short = (id) => ({ 'SCASP-2015': 'county HIV plan', 'KHE-2015': 'KHE 2015', 'KHE-2018': 'KHE 2018', 'CIDP-2023': 'CIDP', 'NSDCC-POSTER-2022': 'NSDCC 2022', 'NSDCC-PROFILES-2026': 'NSDCC 2026' }[id] || id);

// HIV prevalence: one bar per estimate round (county modelled estimates only); press and sentinel values are listed apart.
const hivAll = obs.filter((o) => o.measure === 'hiv-prevalence');
const hivRounds = hivAll.filter((o) => o.geography === 'county' && o.confidence > 1);
const hivRoundIds = new Set(hivRounds.map((o) => o.id));
const hivOther = hivAll.filter((o) => !hivRoundIds.has(o.id));
const hivMeasures = ['hiv-incidence', 'hiv-new-infections', 'art-coverage-adults', 'art-coverage-children', 'art-patients', 'hiv-cascade-1st-95', 'hiv-cascade-2nd-95', 'hiv-viral-suppression', 'hiv-mtct-rate'];

// KDHS 2014 and 2022: same survey programme, four indicators with the same definition in both rounds.
const KDHS = [['skilled-anc', 'Skilled antenatal care'], ['skilled-delivery', 'Skilled birth attendance'], ['facility-delivery', 'Births in a facility'], ['stunting', 'Children under 5 stunted']];
const kd = (m, src) => obs.find((o) => o.measure === m && o.source_id === src);
const hw = ['population-per-doctor', 'population-per-nurse', 'population-per-clinical-officer'];
const subs = [...new Set(obs.filter((o) => o.measure === 'population-per-nurse').map((o) => o.geography_detail))];

export default function SiayaHealth() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Health" title="Health in Siaya"
        sub="What published sources say about health in Siaya County: HIV, TB and malaria, care for mothers and children, and the health workforce. Each figure is shown with the document, page and period it comes from; where documents differ, both are shown."
        path="/counties/siaya/health/" shareText="Health in Siaya: indicators by source" />

      <nav aria-label="Sections on this page"><ul className="toc">
        <li><a href="#hl-hiv">HIV estimates</a></li><li><a href="#hl-hivp">Infections and treatment</a></li><li><a href="#hl-kdhs">Mothers and children</a></li><li><a href="#hl-tb">TB and malaria</a></li><li><a href="#hl-hw">Workforce</a></li><li><a href="#hl-press">News reports</a></li><li><a href="#profile-health">2014 to 2022 and older HIV estimates</a></li><li><a href="#hl-conf">Where sources disagree</a></li><li><a href="#hl-gaps">Not yet found</a></li>
      </ul></nav>

      <section className="card gold" aria-labelledby="hl-read">
        <h2 id="hl-read">How to read this page</h2>
        <Provisional dataset="siaya-health">Values were transcribed by Takwimu from the source documents and have not yet been checked by a reviewer.</Provisional>
        <ul className="how">
          <li><b>Estimates are not measurements.</b> County HIV figures are modelled estimates. The national HIV council says estimates from different model rounds are not directly comparable, so each round is shown on its own and no trend line is drawn across them.</li>
          <li><b>Surveys are samples.</b> KDHS county values rest on small samples and carry a margin of error; small differences should not be over-read.</li>
          <li><b>Secondary reports are labelled.</b> A county news article or plan that quotes a figure without naming its original is shown as a secondary report, with low confidence.</li>
          <li>Aggregates only: county, sub-county or surveillance-area values. No individual or patient-level data is used. Confidence runs from 1 (secondary, original not named) to 5 (primary official table).</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="hl-hiv">
        <h2 id="hl-hiv">HIV prevalence: each estimate round kept separate</h2>
        <p className="lead">One bar per estimate round, as each document prints it. The rounds use different models and, in some cases, different age bands, so the bars are not a trend. Most of the fall between the 2015 and 2025 rounds reflects re-modelling, not a measured drop.</p>
        <ColumnChart labels={hivRounds.map((o) => `${o.period.split(' ')[0]} (${short(o.source_id)})`)} unit="%" yFormat="one"
          ariaLabel="Siaya HIV prevalence by estimate round, per cent; each bar is a separate round, not a trend"
          series={[{ name: 'HIV prevalence, per cent', color: 1, values: hivRounds.map((o) => o.value) }]} />
        <ObsTable dataset="siaya-health" caption="Siaya HIV prevalence by estimate round" id="hiv-rounds" rows={hivRounds.map((o) => row(o))} />
        <h3>Values that are not county estimate rounds</h3>
        <p className="lead">The sentinel-site value describes a surveillance area inside Siaya in 2003-04, for ages 13 to 34; it is not representative of the county. The press figure names no source and matches no round held.</p>
        <ObsTable dataset="siaya-health" caption="Siaya HIV prevalence: sentinel-site and press values" id="hiv-other" rows={hivOther.map((o) => row(o))} />
      </section>

      <section className="card" aria-labelledby="hl-hivp">
        <h2 id="hl-hivp">New infections, treatment and mother-to-child transmission</h2>
        <p className="lead">Each value with its round or data system. Counts of new infections from different rounds are not comparable either.</p>
        <ObsTable dataset="siaya-health" caption="Siaya HIV incidence, new infections, treatment and transmission" rows={obs.filter((o) => hivMeasures.includes(o.measure)).map((o) => row(o))} />
      </section>

      <section className="card" aria-labelledby="hl-kdhs">
        <h2 id="hl-kdhs">Mothers and children: KDHS 2014 and 2022</h2>
        <p className="lead">The same national survey in two rounds. 2014 maternal indicators cover births in the five years before the survey, 2022 those in the two years before; county samples are small. Per cent.</p>
        <ColumnChart labels={KDHS.map(([, l]) => l)} unit="%" yFormat="one"
          ariaLabel="Siaya maternal and child health indicators, KDHS 2014 and KDHS 2022, per cent"
          series={[{ name: 'KDHS 2014', color: 1, values: KDHS.map(([m]) => (kd(m, 'KDHS-2014') || {}).value ?? null) }, { name: 'KDHS 2022', color: 2, values: KDHS.map(([m]) => (kd(m, 'KDHS-2022-KIR') || {}).value ?? null) }]} />
        <ObsTable dataset="siaya-health" caption="Siaya maternal care, immunisation and stunting, all sources" rows={obs.filter((o) => ['skilled-anc', 'skilled-delivery', 'facility-delivery', 'immunisation-full', 'immunisation-basic', 'immunisation-coverage-admin', 'stunting', 'itn-use-under5', 'iptp3'].includes(o.measure)).map((o) => row(o))} />
        <p className="src">Immunisation is not charted: KDHS 2014 &ldquo;fully vaccinated&rdquo; and KDHS 2022 &ldquo;national schedule&rdquo; cover different antigens.</p>
      </section>

      <section className="card" aria-labelledby="hl-tb">
        <h2 id="hl-tb">TB and malaria</h2>
        <p className="lead">No survey has measured malaria prevalence for Siaya since KDHS 2022 dropped malaria testing; the figures below are plan and press figures with their named originals.</p>
        <ObsTable dataset="siaya-health" caption="Siaya TB and malaria indicators by source" rows={obs.filter((o) => /^tb-|^malaria/.test(o.measure)).map((o) => row(o))} />
      </section>

      <section className="card" aria-labelledby="hl-hw">
        <h2 id="hl-hw">Health workforce by sub-county</h2>
        <p className="lead">People per health worker as printed in the county plan&rsquo;s fact sheet (&ldquo;as at 2022&rdquo;). The plan gives no staff counts or population base, so no county total is derived. People per nurse is charted; doctors and clinical officers are in the table.</p>
        <ColumnChart labels={subs} unit="people per nurse" yFormat="int"
          ariaLabel="People per nurse by Siaya sub-county, 2022, as printed in the CIDP 2023-2027"
          series={[{ name: 'People per nurse', color: 1, values: subs.map((s) => obs.find((o) => o.measure === 'population-per-nurse' && o.geography_detail === s).value) }]} />
        <ObsTable dataset="siaya-health" caption="People per health worker by Siaya sub-county" rows={obs.filter((o) => hw.includes(o.measure)).map((o) => row(o, `${o.label}, ${o.geography_detail}`))} />
      </section>

      <section className="card" aria-labelledby="hl-press">
        <h2 id="hl-press">Figures reported in county news articles</h2>
        <p className="lead">These are secondary reports: the articles name no dataset, and one could not be retrieved (it is quoted from the research programme). They are leads to check, not established figures.</p>
        <ObsTable dataset="siaya-health" caption="Siaya health figures from county news articles (secondary reports)" id="press" rows={obs.filter(SECONDARY_ONLY).map((o) => row(o))} />
      </section>

      <ProfileHealth />

      <section className="card" aria-labelledby="hl-conf">
        <h2 id="hl-conf">Where sources disagree</h2>
        <p className="lead">{h.conflicts.length} sets of values for the same measure that differ. All values are kept; none is chosen.</p>
        {h.conflicts.map((c) => (
          <div key={c.measure} className="conflict">
            <h3>{c.measure.replace(/-/g, ' ')}</h3>
            <p>{c.note}</p>
            <ObsTable dataset="siaya-health" caption={`${c.measure}: values side by side`} rows={c.observation_ids.map((id) => row(byId[id]))} showNote={false} />
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="hl-gaps">
        <h2 id="hl-gaps">What is not published or not yet found</h2>
        <ul className="how">{h.gaps.map((g) => <li key={g.measure}><b>{g.measure}:</b> {g.reason}{g.next_step ? ` Next step: ${g.next_step}` : ''}</li>)}</ul>
        <p className="src">Sources: {h.sources.map((s, i) => { const r = source(s.id); return <span key={s.id}>{i ? '; ' : ''}{r.url ? <a href={r.url} rel="noopener">{s.title}</a> : s.title}</span>; })}. Every value is in the <Link href="/datasets/?q=siaya-health">dataset catalogue</Link> and in <a href="/data/siaya-health.json">siaya-health.json</a>. See also the <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
