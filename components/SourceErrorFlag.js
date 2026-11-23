// "Source error in original": an error in the official document itself (an impossible date, or figures the document
// does not reconcile), quoted as printed. The value stays as published; this is not a correction by Takwimu.
// The record's source_error field holds { quote, page, printed_page, issue }. Pure: server and client components.
export default function SourceErrorFlag({ e, id }) {
  if (!e) return null;
  return (
    <small className="source-error" data-source-error-flag={id || ''}>
      {' '}<a className="tag warn" href="/corrections/#source-errors">Source error in original</a> &ldquo;{e.quote}&rdquo; (PDF p. {e.page}{e.printed_page ? `, printed p. ${e.printed_page}` : ''}). {e.issue}
    </small>
  );
}

// "Machine cross-checked": a second machine reading by a different method found the value on the page. Never an
// approval; the tag says so in its title.
export function MachineTag({ m }) {
  if (!m) return null;
  return <span className={`mc-tag${m.result === 'agree' ? '' : ' warn'}`} data-machine-check={m.result} title={m.title}>{m.label}</span>;
}
