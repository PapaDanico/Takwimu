// County table cells that the two-method OCR re-read could not confirm (21 Nov 2026). Their source readings stay in
// data/counties-cob.json (value null, status "doubtful", raw reading and both re-readings kept); the site shows them
// as "Not yet verified" with the reason, never as a number. scripts/test-explore.js checks that this list equals
// the cells the data marks as doubtful with a re-read that was not accepted, and that every view and download
// shows each one as not yet verified. A cell leaves this list only when a reviewer checks it against the page image.
// CommonJS so the build scripts, the tests and the client views share it.
// Empty since 21 Nov 2026: a third reading with a different OCR engine confirmed six cells (full printed rows consistent),
// and the printed own-source revenue total was confirmed as printed (4,145, a publication error shown beside the computed
// 76.8 per cent). The machinery stays for any future cell that two re-readings cannot confirm.
const UNVERIFIED = [];
const LABEL = 'Not yet verified';
// True for a stored cell that the re-read did not confirm (the rule the list above is checked against).
const isUnverifiedCell = (c) => !!(c && c.value === null && c.status === 'doubtful' && c.reread && /^not accepted/.test(c.reread.outcome || ''));
const unverifiedText = (note) => `${LABEL}: ${note ? note.charAt(0).toLowerCase() + note.slice(1) : 'the two OCR re-readings did not confirm the printed figure'}`;

module.exports = { UNVERIFIED, LABEL, isUnverifiedCell, unverifiedText };
