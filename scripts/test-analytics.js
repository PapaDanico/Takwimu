// Known-answer checks for lib/analytics.js. Run: node scripts/test-analytics.js
const a = require('../lib/analytics.js');
const assert = require('assert');
const close = (x, y, t = 1e-9) => assert.ok(Math.abs(x - y) <= t, `${x} is not within ${t} of ${y}`);

close(a.mean([2, 4, 6]), 4);
close(a.median([1, 3, 2, 10]), 2.5);
close(a.quantile([1, 2, 3, 4, 5], 0.25), 2);
close(a.sd([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7));
close(a.cv([10, 10, 10]), 0);
close(a.cagr(100, 200, 10), 7.177346253629313, 1e-9);
close(a.cagr(100, 100, 5), 0);
const o = a.iqrOutliers([1, 2, 3, 4, 100], (x) => x);
assert.deepStrictEqual(o.outliers, [100]);
close(a.interpolate([{ year: 2000, value: 10 }, { year: 2010, value: 20 }], 2005), 15);
close(a.interpolate([{ year: 2000, value: 10 }, { year: 2010, value: 20 }], 1990), 10);
close(a.pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1);
close(a.pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1);
console.log('Analytics tests passed.');
