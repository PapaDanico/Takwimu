// A horizontally scrollable table region. It takes keyboard focus and has a name, so keyboard users can scroll
// it at narrow widths (WCAG 2.1.1, axe scrollable-region-focusable).
export default function TableWrap({ label, children, ...rest }) {
  return <div className="tablewrap" tabIndex={0} role="region" aria-label={`${label} (table, scrolls sideways on small screens)`} {...rest}>{children}</div>;
}
