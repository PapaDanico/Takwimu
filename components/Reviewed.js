// One value as the editorial review register allows it to be shown (lib/review-status.js badge()). Pure, so server
// and client components can both use it; it receives the badge, never the register. The wrapper carries
// data-obs="<dataset>:<id>" and data-obs-state, which scripts/test-reviews.js uses to prove that a rejected value is
// withheld on every page. Children may be a function, called only when the value may be shown (a rejected value is
// already null in the masked data, so formatting it is never attempted).
//   rejected  -> the value is replaced by "Withdrawn after editorial review: <rationale>"
//   approved  -> the value with an "Approved" tag (only with a record in force)
//   disputed  -> the value with a link to the conflict register (with a record)
//   otherwise -> the value; the page label says "Provisional: awaiting editorial review"
export function Withheld({ b }) {
  return <span className="muted withheld">{b.label}: {b.reason}</span>;
}

export default function Reviewed({ b, children, as: Tag = 'span', className, ...rest }) {
  const show = () => (typeof children === 'function' ? children() : children);
  if (!b) return Tag === 'span' && !className && !Object.keys(rest).length ? <>{show()}</> : <Tag className={className} {...rest}>{show()}</Tag>;
  const attrs = { ...rest, 'data-obs': b.key, 'data-obs-state': b.state, className };
  if (b.hide) return <Tag {...attrs}><Withheld b={b} /></Tag>;
  if (!b.fromRecord) return <Tag {...attrs}>{show()}</Tag>;
  if (b.approved) return <Tag {...attrs}>{show()} <span className="tag good" data-review="approved" data-record={b.key}>{b.label}</span></Tag>;
  if (b.href) return <Tag {...attrs}>{show()} <a className="tag warn" href={b.href} data-review="disputed" data-record={b.key}>{b.label}</a></Tag>;
  return <Tag {...attrs}>{show()} <span className="tag warn" data-review={b.state} data-record={b.key}>{b.label}</span></Tag>;
}

// Text for places that cannot hold markup (chart labels, CSV): the value, or the withheld label.
export const reviewedText = (b, text) => (b && b.hide ? `${b.label}: ${b.reason}` : text);
