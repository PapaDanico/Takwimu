// Correction footnote (owner decision, 27 Nov 2026): a superscript mark beside a corrected value and one small line,
// "Corrected <date>: was <original>. <reason>." `notes` comes from lib/correction-notes.js notesFor(); null renders
// nothing. `b` is the value's review badge (lib/review-status.js badge()): a value withheld after review takes its
// footnote with it, wherever the line sits (scripts/test-reviews.js --synthetic, check 1b). Pure: server and client.
const withheld = (b) => Boolean(b && b.hide);

export function CorrectionMark({ notes, b }) {
  if (!notes || !notes.length || withheld(b)) return null;
  return <sup className="cor-mark" aria-hidden="true" data-correction-mark={notes[0].ref}>†</sup>;
}

export default function CorrectionNote({ notes, b }) {
  if (!notes || !notes.length || withheld(b)) return null;
  return notes.map((n) => <small key={n.id} className="cor-note" data-correction={n.ref}><sup aria-hidden="true">†</sup> {n.text}</small>);
}
