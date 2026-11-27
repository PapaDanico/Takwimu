// Single-hue map scale shared by KenyaMap, WardMap and SiayaMap: five equal steps between the lowest and
// the highest value. bin(v) is 1..steps (null for a missing value); bins are the [low, high] range of each
// step, the last one ending exactly at the maximum. legendItems pairs each step with its label.
const STEPS = 5;
const STEPS_NOTE = 'Five equal steps from the lowest to the highest value';

function equalSteps(vals, steps = STEPS) {
  const ok = (v) => typeof v === 'number' && Number.isFinite(v);
  const xs = vals.filter(ok);
  if (!xs.length) return null;
  const min = Math.min(...xs); const max = Math.max(...xs);
  const step = (max - min) / steps;
  const bin = (v) => (!ok(v) ? null : step === 0 ? steps : Math.min(steps, Math.floor((v - min) / step) + 1));
  const bins = Array.from({ length: steps }, (_, i) => [min + step * i, i === steps - 1 ? max : min + step * (i + 1)]);
  return { min, max, step, steps, bin, bins };
}

// [{ step: 1..n, lo, hi, text: "lo to hi" }] with the map's own value formatter.
const legendItems = (scale, fmtV) => (scale ? scale.bins.map(([lo, hi], i) => ({ step: i + 1, lo, hi, text: `${fmtV(lo)} to ${fmtV(hi)}` })) : []);

module.exports = { STEPS, STEPS_NOTE, equalSteps, legendItems };
