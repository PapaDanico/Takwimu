// Fiscal years of the Siaya ten-year series, read from data/history.json so a new year
// (FY 2025/26 when the annual report lands) is added in one place: the data file.
// Shared helpers for the pages that tabulate the series (brief, insights, analysis, ledger), held once here
// (duplication sweep 2, 27 Nov 2026).
const hist = require('../data/history.json');

const SIAYA_FYS = hist.years.map((y) => y.fy).sort();
// Short labels for chart axes: '2013/14' -> '13/14'.
const SIAYA_FY_SHORT = SIAYA_FYS.map((fy) => fy.slice(2));
// Own-source revenue points of the ten-year series, by fiscal year.
const SIAYA_OSR_BY_FY = Object.fromEntries(hist.osr_series.points.map((p) => [p.fy, p]));
// Year-end pending bills: a stated total wins, otherwise recurrent plus development; undefined when neither is held.
const pendingTotal = (y) => (y ? y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined) : undefined);
// Inclusive range of calendar years.
const yearsBetween = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

module.exports = { SIAYA_FYS, SIAYA_FY_SHORT, SIAYA_OSR_BY_FY, pendingTotal, yearsBetween };
