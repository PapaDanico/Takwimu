// Correction footnote (owner decision, 27 Nov 2026): a superscript mark beside a corrected value and one small line,
// "Corrected <date>: was <original>. <reason>." `notes` comes from lib/correction-notes.js notesFor(); null renders
// nothing. Pure: server and client components.
export function CorrectionMark({ notes }) {
  if (!notes || !notes.length) return null;
  return <sup className="cor-mark" aria-hidden="true" data-correction-mark={notes[0].ref}>†</sup>;
}

export default function CorrectionNote({ notes }) {
  if (!notes || !notes.length) return null;
  return notes.map((n) => <small key={n.id} className="cor-note" data-correction={n.ref}><sup aria-hidden="true">†</sup> {n.text}</small>);
}
