// "Source error in original": an error in the official document itself (an impossible date, or figures the document
// does not reconcile), quoted as printed, in one small line beside the value. The value stays as published; this is
// not a correction by Takwimu. The record's source_error field holds { quote, page, printed_page, issue }; `refId` is
// "dataset:record" (scripts/test-corrections.js finds every source error on a built page by it). Pure: server and
// client components.
export default function SourceErrorFlag({ e, id, refId }) {
  if (!e) return null;
  return (
    <small className="source-error" data-source-error-flag={id || ''} data-source-error={refId || undefined}>
      {' '}<b>Source error in original:</b> &ldquo;{e.quote}&rdquo; (PDF p. {e.page}{e.printed_page ? `, printed p. ${e.printed_page}` : ''}). {e.issue}
    </small>
  );
}

// "Machine cross-checked": a second machine reading by a different method found the value on the page. Never an
// approval; the tag says so in its title.
export function MachineTag({ m }) {
  if (!m) return null;
  return <span className={`mc-tag${m.result === 'agree' ? '' : ' warn'}`} data-machine-check={m.result} title={m.title}>{m.label}</span>;
}
