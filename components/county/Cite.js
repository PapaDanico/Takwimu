// One value's citation on a county page: review label, source with a link to the page, publication date, period,
// unit, confidence and page, and a visible "Needs page check" where the reading has not been compared with the page
// image. Pure: server and client components.
import { MachineTag } from '../SourceErrorFlag';

export const pageRef = (pdf, printed) => (pdf ? `PDF p. ${pdf}${printed ? ` (printed p. ${printed})` : ''}` : 'page not recorded');

// The page states "Provisional: awaiting editorial review" once (components/county/CountyProvisional.js); a value
// carries its own review label only when a record has moved it on (approved, withdrawn, disputed, superseded).
export const PENDING = 'Provisional: awaiting editorial review';
export function ValueFlags({ label, needsCheck, machine, tier }) {
  return (
    <>
      {label && label !== PENDING ? <> <span className="tag warn" data-review-label>{label}</span></> : null}
      {tier === 'secondary' ? <> <span className="tag warn" data-tier="secondary">Secondary source</span></> : null}
      {needsCheck ? <> <span className="tag warn" data-needs-page-check>Needs page check</span></> : null}
      {machine ? <> <MachineTag m={machine} /></> : null}
    </>
  );
}

export default function CountyCite({ title, url, published, period, unit, confidence, pdf, printed, table, read }) {
  return (
    <small className="cite">
      {url ? <a href={url} rel="noopener">{title}</a> : title}{table ? `, ${table}` : ''}, {pageRef(pdf, printed)}. Published {published || 'not stated'}; period {period}; unit {unit}{confidence ? `; confidence ${confidence} of 5` : ''}{read ? `; read from the ${read}` : ''}.
    </small>
  );
}
