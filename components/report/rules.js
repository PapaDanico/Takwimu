// Small rules the report builder and renderer apply to figures, kept pure so scripts/test-review-logic.js can test
// them without a build. CommonJS so Node scripts and Next.js both load it.

// The note under a conflict table, from the review states of the values in it (badges from lib/review-status.js).
function conflictNote(figs) {
  const bs = figs.map((f) => (f && f.review) || null);
  const out = bs.filter((b) => b && b.hide).length;
  const approved = bs.filter((b) => b && b.approved).length;
  const shown = bs.length - out;
  const parts = [];
  if (out) parts.push(`${out} of these values ${out === 1 ? 'was' : 'were'} withdrawn after editorial review.`);
  if (shown) parts.push(approved === shown ? `The ${shown === 1 ? 'value shown is' : 'values shown are'} approved;` : approved ? `${approved} of the values shown ${approved === 1 ? 'is' : 'are'} approved and the rest are provisional: awaiting editorial review;` : `All values shown are provisional: awaiting editorial review;`);
  if (shown) parts.push('none has been chosen over another.');
  return parts.join(' ');
}

// Index of the latest opinion (by fiscal year) for one entity, or -1. Not the last entry of the array.
function latestOpinion(opinions, entity) {
  let best = -1;
  opinions.forEach((o, i) => { if (o.entity === entity && (best < 0 || String(o.fy) > String(opinions[best].fy))) best = i; });
  return best;
}

// The small-cell statement of Report C, from the figures it prints (fig().suppress marks a count below 10).
function smallCountSentence(figs) {
  const n = figs.filter((f) => f && f.suppress).length;
  return `All health figures here are aggregates for the county or a sub-county. Any count of people below 10 is suppressed; ${n ? `${n} ${n === 1 ? 'value is' : 'values are'} suppressed for that reason.` : 'none of the values held is a count of that size.'} No patient-level or facility-level personal data are held.`;
}

module.exports = { conflictNote, latestOpinion, smallCountSentence };
