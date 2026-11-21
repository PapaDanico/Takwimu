// Reconciliation tests: one explicit test per known disagreement in data/conflicts.json, plus the
// arithmetic identities the pages rely on. Each conflict test asserts that both values are recorded,
// that they differ, and that the data the pages read uses the value the register says is plotted.
// Run: node scripts/test-reconciliation.js (also part of npm run validate and npm run build).
const fs = require('fs');
const path = require('path');
const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const hist = read('history.json');
const reg = read('conflicts.json');
const siaya = read('siaya.json');

const results = [];
const test = (name, fn) => {
  try { fn(); results.push([true, name]); } catch (e) { results.push([false, `${name}: ${e.message}`]); }
};
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const year = (fy) => { const y = hist.years.find((x) => x.fy === fy); ok(y, `no year ${fy} in history.json`); return y; };
const osrPoint = (fy) => { const p = hist.osr_series.points.find((x) => x.fy === fy); ok(p, `no OSR point ${fy}`); return p; };
// Same rule as app/insights/page.js: a stated total wins, otherwise recurrent plus development.
const pendOf = (y) => y.pending_total_m ?? (y.pending_development_m !== undefined && y.pending_recurrent_m !== undefined ? y.pending_development_m + y.pending_recurrent_m : undefined);
const conflict = (id) => { const c = reg.conflicts.find((x) => x.id === id); ok(c, `${id} is not in the register`); return c; };

// Common checks for one register case: two values, they differ, and `plotted` is the one the pages use.
// `plotted` is transcribed from each case's `effect` text in the register (the register is prose, not a field).
function caseTest(id, plotted, other, pageValue, tol = 0.005) {
  test(`conflict ${id}`, () => {
    const c = conflict(id);
    const vals = c.values.map((v) => v.value);
    ok(vals.length >= 2, 'fewer than two values');
    ok(vals.some((v) => near(v, plotted, 1e-9)), `plotted value ${plotted} is not in the register`);
    ok(vals.some((v) => near(v, other, 1e-9)), `other value ${other} is not in the register`);
    ok(plotted !== other, 'the two values do not differ');
    ok(pageValue !== undefined, 'page-facing value is missing');
    ok(near(pageValue, plotted, tol), `page data uses ${pageValue}, register says ${plotted} is plotted`);
    ok(!near(pageValue, other, tol), `page data uses the other value ${other}`);
  });
}

// Own-source revenue: main value plotted, the other report's value kept as the alternate.
const osrCase = (id, fy, plotted, other) => {
  caseTest(id, plotted, other, osrPoint(fy).value);
  test(`conflict ${id}: alternate kept`, () => {
    const p = osrPoint(fy);
    ok(p.alternate && near(p.alternate.value, other, 1e-9), `OSR ${fy} alternate should be ${other}`);
  });
};
osrCase('osr-2013-14', '2013/14', 99.77, 99.78);
osrCase('osr-2014-15', '2014/15', 143.33, 142.88);
osrCase('osr-2015-16', '2015/16', 127.93, 113.26);
osrCase('osr-2023-24', '2023/24', 610.74, 427.95);
test('conflict osr-2023-24: Siaya hub states the later report value as previous year', () => {
  ok(near(siaya.own_source_revenue.previous_year.value, 427.95, 1e-9), 'previous_year should quote the FY 2024/25 report');
});

// Pending bills.
caseTest('pending-2021', 1060.92, 602.08, pendOf(year('2020/21')));
caseTest('pending-2023', 761.29, 741.56, pendOf(year('2022/23')));
caseTest('pending-2024', 1120, 303.91, pendOf(year('2023/24')));
test('conflict pending-2023: figure is sourced from the FY 2023/24 report', () => {
  const fs = year('2022/23').field_source || {};
  ok(fs.pending_recurrent_m === '2023/24' && fs.pending_development_m === '2023/24', 'field_source should point to 2023/24');
});
test('conflict pending-2024: figure is sourced from the FY 2024/25 report', () => {
  ok((year('2023/24').field_source || {}).pending_total_m === '2024/25', 'field_source should point to 2024/25');
});

// Budget, spending and absorption.
caseTest('budget-2022-23', 8.6, 8.5, year('2022/23').approved);
caseTest('recurrent-spend-2016-17', 3.65, 3.9, year('2016/17').recurrent_spent);
caseTest('recurrent-absorption-2024-25', 83, 82.2, year('2024/25').recurrent_absorption_pct, 1e-9);
test('conflict recurrent-absorption-2024-25: recomputed value matches the register', () => {
  const y = year('2024/25');
  ok(near((y.recurrent_spent / y.recurrent_budget) * 100, 82.2, 0.05), 'recomputed share is not 82.2');
});
caseTest('budget-financing-osr-2024-25', 1043, 929, siaya.own_source_revenue.target.value, 1e-9);
test('conflict budget-financing-osr-2024-25: stated 47 per cent is quoted, not recomputed', () => {
  ok(siaya.own_source_revenue.share_of_annual_target_pct === 47, 'share_of_annual_target_pct should be the stated 47');
  ok(near(436.68 / 0.47, 929, 1), '436.68 / 0.47 should be about 929');
});

// Every register case has a test above, and no test points at a case that was removed.
test('every conflict in the register has a test', () => {
  const tested = new Set(results.map(([, n]) => (n.match(/^conflict ([a-z0-9-]+)/) || [])[1]).filter(Boolean));
  const missing = reg.conflicts.map((c) => c.id).filter((id) => !tested.has(id));
  ok(missing.length === 0, `untested: ${missing.join(', ')}`);
});

// Arithmetic identities.
hist.years.filter((y) => y.approved !== undefined).forEach((y) => {
  test(`identity ${y.fy}: budget = recurrent + development`, () => ok(near(y.recurrent_budget + y.development_budget, y.approved, 0.02), `${y.recurrent_budget} + ${y.development_budget} vs ${y.approved}`));
  test(`identity ${y.fy}: spent = recurrent + development`, () => ok(near(y.recurrent_spent + y.development_spent, y.spent, 0.02), `${y.recurrent_spent} + ${y.development_spent} vs ${y.spent}`));
  test(`identity ${y.fy}: development absorption recomputes`, () => {
    if (y.development_absorption_pct === undefined) return;
    const v = (y.development_spent / y.development_budget) * 100;
    ok(near(v, y.development_absorption_pct, 1.5), `stated ${y.development_absorption_pct}, arithmetic ${v.toFixed(1)}`);
  });
  test(`identity ${y.fy}: recurrent absorption recomputes or is caveated`, () => {
    if (y.recurrent_absorption_pct === undefined) return;
    const v = (y.recurrent_spent / y.recurrent_budget) * 100;
    ok(near(v, y.recurrent_absorption_pct, 1.5) || y.caveat, `stated ${y.recurrent_absorption_pct}, arithmetic ${v.toFixed(1)}, no caveat`);
  });
});
test('identity FY 2024/25 hub: category budgets and spending sum to totals', () => {
  const b = siaya.budget;
  ok(near(b.categories.reduce((s, c) => s + c.budget, 0), b.approved_total, 0.02), 'category budgets do not sum');
  ok(near(b.categories.reduce((s, c) => s + c.spent, 0), b.total_spent, 0.05), 'category spending does not sum');
});

const failed = results.filter(([pass]) => !pass);
if (failed.length) {
  console.error(`Reconciliation tests failed (${failed.length} of ${results.length}):\n- ` + failed.map(([, m]) => m).join('\n- '));
  process.exit(1);
}
console.log(`Reconciliation tests passed (${results.length} tests, ${reg.conflicts.length} register cases).`);
