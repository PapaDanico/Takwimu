// Four separate facts about a page's data, as the editorial protocol requires:
// the period it covers, when it was checked, when the page last changed, and how complete it is.
export default function DataStamp({ period, checked, updated, completeness }) {
  const cells = [
    { k: 'Period covered', v: period },
    { k: 'Data checked', v: checked },
    { k: 'Page last updated', v: updated },
    { k: 'Completeness', v: completeness },
  ];
  return (
    <dl className="datastamp" aria-label="Data coverage">
      {cells.map((c) => (
        <div key={c.k}>
          <dt>{c.k}</dt>
          <dd>{c.v}</dd>
        </div>
      ))}
    </dl>
  );
}
