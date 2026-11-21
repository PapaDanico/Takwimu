// Plain statistics used by the Analytics page. CommonJS so both Next.js and the test script can load it.

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const quantile = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};

const median = (xs) => quantile(xs, 0.5);

// Sample standard deviation (n - 1).
const sd = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

const cv = (xs) => sd(xs) / mean(xs);

// Compound annual growth rate, as a percentage.
const cagr = (start, end, years) => (Math.pow(end / start, 1 / years) - 1) * 100;

// Tukey fences: values beyond 1.5 x IQR from the quartiles.
const iqrOutliers = (items, get) => {
  const xs = items.map(get);
  const q1 = quantile(xs, 0.25);
  const q3 = quantile(xs, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return { q1, q3, iqr, lo, hi, outliers: items.filter((i) => get(i) < lo || get(i) > hi) };
};

// Linear interpolation of a series of {year, value} points at a given (possibly fractional) year.
const interpolate = (points, year) => {
  const s = [...points].sort((a, b) => a.year - b.year);
  if (year <= s[0].year) return s[0].value;
  if (year >= s[s.length - 1].year) return s[s.length - 1].value;
  for (let i = 1; i < s.length; i += 1) {
    if (year <= s[i].year) {
      const a = s[i - 1];
      const b = s[i];
      return a.value + ((b.value - a.value) * (year - a.year)) / (b.year - a.year);
    }
  }
  return s[s.length - 1].value;
};

// Pearson correlation. Only used to describe, never to claim cause, and only with a stated sample size.
const pearson = (xs, ys) => {
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    dx += (x - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  });
  return num / Math.sqrt(dx * dy);
};

module.exports = { mean, median, quantile, sd, cv, cagr, iqrOutliers, interpolate, pearson };
