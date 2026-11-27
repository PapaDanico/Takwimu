import Link from 'next/link';
import OsrNote from '../../../components/OsrNote';
import { notFound } from 'next/navigation';
import ExploreHead from '../../../components/ExploreHead';
import { ColumnChart, LineChart } from '../../../components/Charts';
import DownloadView from '../../../components/DownloadView';
import { STORIES, absorption, population, ownRevenue } from '../../../lib/stories';
import { Provisional } from '../../../components/ObsTable';
import { fmtFixed, fmtInt } from '../../../lib/format';

export const dynamicParams = false;
export function generateStaticParams() { return STORIES.map((s) => ({ slug: s.slug })); }
export function generateMetadata({ params }) {
  const s = STORIES.find((x) => x.slug === params.slug);
  return s ? { title: s.title, description: s.blurb } : {};
}

const n0 = fmtInt;
const n1 = (v) => fmtFixed(v, 1);
const bn = (m) => n1(m / 1000);

function Sources({ items }) {
  return <p className="src">Sources: {items.map((it, i) => <span key={it.href}>{i ? '; ' : ''}<a href={it.href}>{it.label}</a></span>)}.</p>;
}
function DataLinks({ story, extra }) {
  return (
    <p className="ds-links">
      {story.datasets.map((d) => <Link key={d} href={`/datasets/?q=${d}`}>Dataset: {d}</Link>)}
      {extra.map((e) => <Link key={e.href} href={e.href}>{e.label}</Link>)}
    </p>
  );
}

function Absorption({ story }) {
  const a = absorption();
  const bands = [[0, 40, 'Under 40%'], [40, 60, '40 to 59%'], [60, 80, '60 to 79%'], [80, 1000, '80% or more']];
  const count = (sp) => bands.map(([lo, hi]) => sp.rows.filter((r) => r.value !== null && r.value >= lo && r.value < hi).length);
  return (
    <>
      <section className="card story" aria-labelledby="s1">
        <h2 id="s1">The short version</h2>
        <p>In FY {a.latest}, the typical county (the median) spent {n0(a.rec.median)} per cent of its recurrent budget, which pays salaries and running costs, and {n0(a.dev.median)} per cent of its development budget, which pays for projects such as roads, clinics and water.</p>
        <p>Development spending varied widely: from {n0(a.dev.lo.value)} per cent of the budget in {a.dev.lo.name} to {n0(a.dev.hi.value)} per cent in {a.dev.hi.name}. {a.under50} of the {a.dev.n} counties with a figure spent less than half of their development budget.</p>
        <p>The year before, FY {a.prev}, the medians were {n1(a.recPrev.median)} per cent (recurrent) and {n1(a.devPrev.median)} per cent (development).</p>
        <p>A low share is not by itself a sign of waste, and a high share is not by itself a sign of good work. Money can arrive late from the national government, projects can span years, and budgets can be revised. The figures show what was spent, not why.</p>
      </section>
      <section className="card" aria-labelledby="s2">
        <h2 id="s2">Counties by share of development budget spent, FY {a.prev} and FY {a.latest}</h2>
        <p className="lead">Number of counties in each band. {a.dev.of - a.dev.n} counties have no FY {a.latest} figure shown ({a.dev.missing.map((r) => `${r.name}: ${r.status === 'unverified' ? 'not yet verified, the two OCR re-readings did not confirm the printed figure' : 'not read'}`).join('; ')}).</p>
        <ColumnChart labels={bands.map((b) => b[2])} series={[{ name: `FY ${a.prev}`, color: 1, values: count(a.devPrev) }, { name: `FY ${a.latest}`, color: 2, values: count(a.dev) }]} yFormat="int" unit="counties" ariaLabel="Number of counties by share of development budget spent, two years" />
        <div className="toolbar"><DownloadView name="takwimu-story-absorption" label="Download the chart data" meta={{ title: 'Counties by share of development budget spent', source: a.src.title }} rows={[a.prev, a.latest].flatMap((fy) => bands.map((b, i) => ({ fiscal_year: fy, band: b[2], counties: count(fy === a.latest ? a.dev : a.devPrev)[i], measure: 'development_absorption_pct (as printed)' })))} /></div>
      </section>
      <section className="card" aria-labelledby="s3">
        <h2 id="s3">Method and sources</h2>
        <ul className="how">
          <li>Shares are those printed in the Controller of Budget table for each county (absorption rate: spending divided by the approved budget). They were read by OCR from scanned pages; a reading that did not agree with the printed amounts is left out, not replaced.</li>
          <li>The median is the middle county when all counties with a figure are lined up; it is not pulled up or down by a few extreme values. Counts: recurrent {a.rec.n} of 47, development {a.dev.n} of 47 for FY {a.latest}.</li>
          <li>Counties are not ranked. To see every county, use the comparison.</li>
        </ul>
        <Sources items={[{ href: a.src.url, label: `${a.src.title}, ${a.src.tables.bud}` }, { href: a.srcPrev.url, label: `${a.srcPrev.title}, ${a.srcPrev.tables.bud}` }]} />
        <DataLinks story={story} extra={[{ href: '/compare/?i=development_absorption_pct', label: 'Compare counties' }]} />
      </section>
    </>
  );
}

function Population({ story }) {
  const p = population();
  const labels = p.pop.series.map((x) => String(x.year));
  const total = p.pop.series.map((x) => (x.value === null ? null : x.value / 1e6));
  const urban = p.pop.series.map((x, i) => { const u = p.urb.series[i]; return x.value === null || !u || u.value === null ? null : (x.value * u.value) / 100 / 1e6; });
  return (
    <>
      <section className="card story" aria-labelledby="s1">
        <h2 id="s1">The short version</h2>
        <p>Kenya had about {n1(p.p0.value / 1e6)} million people in {p.p0.year} and about {n1(p.p1.value / 1e6)} million in {p.p1.year}, by the World Bank&apos;s mid-year estimates. That is {n1((p.p1.value - p.p0.value) / 1e6)} million more people, or growth of about {n1(p.cagr)} per cent a year.</p>
        <p>The share living in urban areas changed little on these estimates: {n1(p.u0.value)} per cent in {p.u0.year} and {n1(p.u1.value)} per cent in {p.u1.year}. Because the whole population grew, the number of people in urban areas still rose, from about {n1(p.urban0 / 1e6)} million to about {n1(p.urban1 / 1e6)} million.</p>
        <p>Both series are modelled by United Nations agencies between censuses, so they move smoothly and can differ from Kenya&apos;s own census counts and projections.</p>
      </section>
      <section className="card" aria-labelledby="s2">
        <h2 id="s2">Total and urban population, million people</h2>
        <p className="lead">Urban population is derived here: total population multiplied by the urban share.</p>
        <LineChart labels={labels} series={[{ name: 'Total', color: 1, values: total }, { name: 'Urban (derived)', color: 2, dash: true, values: urban }]} yFormat="int" valueFormat="auto" unit="million" naText="Not available" ariaLabel={`Kenya total and urban population, ${labels[0]} to ${labels[labels.length - 1]}, million people`} />
        <div className="toolbar"><DownloadView name="takwimu-story-population" label="Download the chart data" meta={{ title: 'Kenya total and urban population', source: 'World Bank WDI SP.POP.TOTL and SP.URB.TOTL.IN.ZS' }} rows={labels.map((y, i) => ({ year: y, population: p.pop.series[i].value, urban_share_pct: p.urb.series[i] ? p.urb.series[i].value : null, urban_population_derived: urban[i] === null ? null : urban[i] * 1e6, unit: 'people; per cent' }))} /></div>
      </section>
      <section className="card" aria-labelledby="s3">
        <h2 id="s3">Method and sources</h2>
        <ul className="how">
          <li>Population: World Bank {p.pop.code}, mid-year estimates from the UN World Population Prospects; recent years are estimates and projections, not census counts.</li>
          <li>Urban share: World Bank {p.urb.code}, from the UN World Urbanization Prospects; modelled. What counts as urban follows national definitions.</li>
          <li>Growth a year is the compound rate between the first and last years. Urban population is total times share, computed here and labelled derived.</li>
        </ul>
        <Sources items={[{ href: p.pop.api_url, label: `World Bank WDI ${p.pop.code} (last updated ${p.pop.last_updated})` }, { href: p.urb.api_url, label: `World Bank WDI ${p.urb.code}` }]} />
        <DataLinks story={story} extra={[{ href: '/kenya/?i=population#trends', label: 'Trend' }, { href: '/kenya/#people', label: 'Kenya dashboard' }]} />
      </section>
    </>
  );
}

function OwnRevenue({ story }) {
  const o = ownRevenue();
  return (
    <>
      <section className="card story" aria-labelledby="s1">
        <h2 id="s1">The short version</h2>
        <p>Together, the 47 counties collected KSh {bn(o.actual)} billion of their own revenue in FY {o.latest}, against combined targets of KSh {bn(o.target)} billion: about {n0(o.share)} per cent of target. In FY {o.prev} they collected KSh {bn(o.actualPrev)} billion, about {n0(o.sharePrev)} per cent of that year&apos;s targets.</p>
        <p>Own revenue is a small part of county money: it equals about {n0((o.actual / o.budget) * 100)} per cent of the counties&apos; combined approved budgets of KSh {bn(o.budget)} billion. Most of the rest comes from the national government&apos;s equitable share.</p>
        <p>Collection is concentrated. Nairobi City alone collected about {n0(o.nairobiShare)} per cent of the total, and the five largest collectors together about {n0((o.top5 / o.actual) * 100)} per cent. About {n0(o.fif)} per cent of the total came from Facility Improvement Financing (<Link href="/learn/#fif">FIF</Link>, money health facilities collect) and appropriations-in-aid rather than ordinary revenue such as rates, fees and licences.</p>
        <p>Of the {o.perf.n} counties with a readable figure, {o.atTarget} collected their full target or more; the typical county collected {n0(o.perf.median)} per cent. Targets are set by each county, so the share says as much about the target as about collection.</p>
      </section>
      <section className="card" aria-labelledby="s2">
        <h2 id="s2">All 47 counties: own-source revenue collected and targeted, KSh billion</h2>
        <ColumnChart labels={[`FY ${o.prev}`, `FY ${o.latest}`]} series={[{ name: 'Collected', color: 1, values: [o.actualPrev / 1000, o.actual / 1000] }, { name: 'Target', color: 4, values: [o.targetPrev / 1000, o.target / 1000] }]} yFormat="int" valueFormat="auto" unit="KSh bn" ariaLabel="Own-source revenue collected and targeted, all 47 counties, KSh billion, two years" />
        <div className="toolbar"><DownloadView name="takwimu-story-own-source-revenue" label="Download the chart data" meta={{ title: 'Own-source revenue, all 47 counties (printed totals)', source: o.src.title }} rows={[{ fiscal_year: o.prev, collected_ksh_m: o.actualPrev, target_ksh_m: o.targetPrev }, { fiscal_year: o.latest, collected_ksh_m: o.actual, target_ksh_m: o.target }]} /></div>
      </section>
      <section className="card" aria-labelledby="s3">
        <h2 id="s3">Method and sources</h2>
        <ul className="how">
          <li>Totals are the printed total rows of the Controller of Budget tables; the 47 county rows add up to them within rounding. Values were read by OCR from scanned pages.</li>
          <li>The share of target for all counties is computed here from the printed totals (collected divided by target). The table&apos;s own printed percentage for the total {o.printedTotalPct.value === null ? (o.printedTotalPct.status === 'unverified' ? `is not yet verified. ${o.printedTotalPct.note}` : o.printedTotalPct.note ? `is not used. ${o.printedTotalPct.note}` : 'could not be read reliably.') : `is ${o.printedTotalPct.value}.`}</li>
          <li>County shares are as printed; {o.perf.of - o.perf.n} counties ({o.perf.missing.map((r) => r.name).join(', ')}) are left out because their reading did not agree with the printed amounts.</li>
          <li>Nominal shillings; the two years are not adjusted for prices here.</li>
        </ul>
        <Sources items={[{ href: o.src.url, label: `${o.src.title}, ${o.src.tables.osr} and ${o.src.tables.bud}` }, { href: o.srcPrev.url, label: `${o.srcPrev.title}, ${o.srcPrev.tables.osr}` }]} />
        <DataLinks story={story} extra={[{ href: '/compare/?i=total_osr_actual', label: 'Compare counties' }]} />
      </section>
    </>
  );
}

// The provisional banner counts the Controller of Budget values Takwimu transcribed (review register counties-cob)
// when the story uses them; each figure names its own source, and the datasets are listed at the foot of the story.
const bannerDataset = (story) => (story.datasets.some((id) => id.startsWith('counties-')) ? ['counties-cob'] : undefined);

const BODY = { 'county-budget-absorption': Absorption, 'population-and-towns': Population, 'own-source-revenue': OwnRevenue };

export default function StoryPage({ params }) {
  const story = STORIES.find((x) => x.slug === params.slug);
  if (!story) notFound();
  const Body = BODY[story.slug];
  return (
    <main id="main" className="wrap page">
      <ExploreHead trail={[{ href: '/', label: 'Home' }, { href: '/stories/', label: 'Data stories' }]} current={story.title} title={story.title} sub={story.blurb} />
      <Provisional dataset={bannerDataset(story)} />
      <Body story={story} />
      {story.slug === 'own-source-revenue' ? <OsrNote /> : null}
    </main>
  );
}
