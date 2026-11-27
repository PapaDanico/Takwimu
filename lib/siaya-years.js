// Fiscal years of the Siaya ten-year series, read from data/history.json so a new year
// (FY 2025/26 when the annual report lands) is added in one place: the data file.
const hist = require('../data/history.json');

const SIAYA_FYS = hist.years.map((y) => y.fy).sort();

module.exports = { SIAYA_FYS };
