import { LineChart } from '../Charts';

// Ten-year trends for a county from the registry: the Controller of Budget's value for each measure and fiscal year
// (one independent publisher, so the line compares like with like). A year with no CoB value, or with two CoB values
// that differ, is a gap in the line, never filled or chosen. Values printed in KSh million are shown in KSh billion
// (divided by 1,000); the table view and the ledger give every value as printed.
// Own-source revenue and pending bills are not charted: the CoB's revenue basis changes (hospital FIF counted from
// FY 2024/25), and most years print more than one pending-bills figure, so a line would mislead. The ledger shows both.
const MEASURES = [['budget_total', 'Budget'], ['expenditure_total', 'Spending']];
const toBn = (o) => (o.unit === 'KSh billion' ? o.value : o.unit === 'KSh million' ? o.value / 1000 : null);

export function trendSeries(l) {
  const cob = l.kinds.findIndex((k) => k.key === 'controller_of_budget');
  const gaps = [];
  const series = MEASURES.filter(([k]) => l.values[k]).map(([k, name], i) => ({
    name, color: i + 1,
    values: l.years.map((fy) => {
      const row = l.values[k].find((r) => r.fy === fy);
      const vs = row ? row.byKind[cob].filter((o) => !(o.review && o.review.hide)).map(toBn).filter((v) => v != null) : [];
      const uniq = [...new Set(vs.map((v) => Math.round(v * 1000) / 1000))];
      if (uniq.length > 1) gaps.push(`${name}, FY ${fy}: the Controller of Budget prints ${uniq.length} different values; none is chosen (see the ledger)`);
      return uniq.length === 1 ? uniq[0] : null;
    }),
  }));
  return { labels: l.years.map((fy) => `FY ${fy}`), series, gaps };
}

export default function CountyTrends({ l, name }) {
  const { labels, series, gaps } = trendSeries(l);
  return (
    <section className="card" aria-labelledby="led-trend">
      <h2 id="led-trend">Ten-year trend: budget and spending, Controller of Budget</h2>
      <p className="lead">One publisher&rsquo;s figures for each year, so that the line compares like with like. Other sources&rsquo; values for the same years are in the tables below. A break in a line is a year with no value, never a zero.</p>
      <LineChart labels={labels} series={series} yFormat="one" valueFormat="auto" unit="KSh bn" naText="No Controller of Budget value"
        ariaLabel={`${name} County budget and spending by fiscal year, Controller of Budget, KSh billion`}
        caption={`${name}: Controller of Budget values by fiscal year, KSh billion`} />
      <p className="how">Values the report prints in KSh million are divided by 1,000. The budget is the version the report states (often the supplementary budget). Own-source revenue and pending bills are not drawn as lines: the Controller of Budget counts hospital income (FIF) in own-source revenue from FY 2024/25, so the jump that year is partly a change of definition, and most years print more than one pending-bills figure. Both are in the tables below with every source. {gaps.length ? `Gaps: ${gaps.join('; ')}.` : ''}</p>
    </section>
  );
}
