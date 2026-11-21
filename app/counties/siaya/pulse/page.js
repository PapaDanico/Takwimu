import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import { LineChart } from '../../../../components/Charts';
import { insights } from '../../../../lib/pulse';

export const metadata = {
  title: 'Siaya Fiscal Pulse',
  description: 'Three findings on Siaya County spending from the Controller of Budget reports, FY 2014/15 to FY 2024/25, each with its document, page, period, unit and confidence.',
};

const p = insights();
const readText = (r) => (r === 'RapidOCR' ? 'read by OCR (RapidOCR)' : `read from the ${r}`);
const pageRef = (f) => `PDF p. ${f.page}${f.printed_page ? ` (printed p. ${f.printed_page})` : ''}`;

export default function SiayaPulse() {
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Fiscal Pulse" title="Siaya Fiscal Pulse"
        sub={`Three findings on county spending, FY ${p.first} to FY ${p.latest}, read from the Controller of Budget annual reports. Each figure names its document and page. Nominal shillings; fiscal years run July to June.`}
        path="/counties/siaya/pulse/" shareText="Siaya Fiscal Pulse: three findings on county spending" />

      {p.items.map((it, i) => (
        <section key={it.id} className="card" aria-labelledby={`pulse-${it.id}`}>
          <p className="eyebrow">Finding {i + 1} of {p.items.length}</p>
          <h2 id={`pulse-${it.id}`}>{it.title}</h2>
          <p>{it.text}</p>
          <ul className="how">
            {it.figures.map((f) => (
              <li key={`${f.fy}-${f.key}`}>
                <b>{f.label}, {f.period}:</b> KSh {f.value.toFixed(2)} billion. Unit: {f.unit}. Source: <a href={f.pdf_url}>{f.report} (PDF)</a>, chapter &ldquo;{f.section}&rdquo;, {pageRef(f)}, {readText(f.read)}. Confidence {f.confidence} of 5 (<Link href="/method/">what this means</Link>).
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card" aria-labelledby="pulse-chart">
        <h2 id="pulse-chart">Spending by fiscal year</h2>
        <p className="lead">Total, recurrent and development spending, KSh billion, nominal.{p.gaps.length ? ` FY ${p.gaps.join(' and FY ')} has no figure: that year’s report was not found, and the gap is left open.` : ''} The table view gives every value.</p>
        <LineChart labels={p.chart.labels} unit="KSh bn" yFormat="one" naText="No figure in the source reports"
          ariaLabel={`Siaya County total, recurrent and development spending, FY ${p.first} to FY ${p.latest}, KSh billion`}
          series={p.chart.series.map((s, i) => ({ name: s.name, color: i + 1, dash: i === 2, values: s.values }))} />
        <p className="src">Source: Controller of Budget, County Governments Budget Implementation Review Reports, Siaya chapter of each year; the page for every year is on the <Link href="/data/">Data page</Link> and in <a href="/data/history.csv">history.csv</a>.</p>
      </section>

      <section className="card" aria-labelledby="pulse-how">
        <h2 id="pulse-how">How to read this</h2>
        <ul className="how">
          <li>Only spending amounts are used here. None of them has an open case in the <Link href="/data/#conflicts">conflict register</Link>; figures where documents disagree, such as the approved budget for FY 2024/25, are on the Insights and Data pages with both values.</li>
          <li>The findings describe what was spent. They are not a judgement of the county government or of any person.</li>
          <li>Confidence (1 to 5) describes the quality of the source and of the reading, not a probability that a figure is right.</li>
        </ul>
        <p className="src">More: the <Link href="/counties/siaya/brief/">one-page Siaya fiscal brief</Link> (<a href="/briefs/siaya-fiscal-brief.pdf" download>PDF</a>), <Link href="/insights/">ten-year insights</Link> and <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
