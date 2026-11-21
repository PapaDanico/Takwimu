// County table cells that the two-method OCR re-read could not confirm (21 Nov 2026). Their source readings stay in
// data/counties-cob.json (value null, status "doubtful", raw reading and both re-readings kept); the site shows them
// as "Not yet verified" with the reason, never as a number. scripts/test-explore.js checks that this list equals
// the cells the data marks as doubtful with a re-read that was not accepted, and that every view and download
// shows each one as not yet verified. A cell leaves this list only when a reviewer checks it against the page image.
// CommonJS so the build scripts, the tests and the client views share it.
const UNVERIFIED = [
  { fy: '2024/25', county: 'Total (as printed)', key: 'osr_performance_pct' },
  { fy: '2024/25', county: 'Makueni', key: 'development_absorption_pct' },
  { fy: '2024/25', county: "Murang'a", key: 'development_absorption_pct' },
  { fy: '2024/25', county: 'Samburu', key: 'development_absorption_pct' },
  { fy: '2024/25', county: 'Trans Nzoia', key: 'development_absorption_pct' },
  { fy: '2024/25', county: 'Mombasa', key: 'overall_absorption_pct' },
  { fy: '2021/22', county: 'Kilifi', key: 'development_absorption_pct' },
];
const LABEL = 'Not yet verified';
// True for a stored cell that the re-read did not confirm (the rule the list above is checked against).
const isUnverifiedCell = (c) => !!(c && c.value === null && c.status === 'doubtful' && c.reread && /^not accepted/.test(c.reread.outcome || ''));
const unverifiedText = (note) => `${LABEL}: ${note ? note.charAt(0).toLowerCase() + note.slice(1) : 'the two OCR re-readings did not confirm the printed figure'}`;

module.exports = { UNVERIFIED, LABEL, isUnverifiedCell, unverifiedText };
