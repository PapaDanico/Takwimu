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
const cob = read('counties-cob.json');
// Siaya's row in the 47-county tables (Controller of Budget, chapter 2).
const cobSiaya = (fy, k) => { const y = cob.years.find((x) => x.fy === fy); ok(y, `no ${fy} in counties-cob.json`); const c = y.counties.find((x) => x.slug === 'siaya'); ok(c && c[k], `no Siaya ${k} for ${fy}`); return c[k]; };
const listed = (id, v) => conflict(id).values.some((x) => near(x.value, v, 1e-9));
// Text-valued cases (a label, citation or licence): the value starts with the given text.
const listed2 = (c, text) => c.values.some((x) => typeof x.value === 'string' && x.value.startsWith(text));

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
osrCase('osr-2019-20', '2019/20', 179.43, 184.25);
test('conflict osr-2019-20: the year row uses the Controller of Budget value, not the county paper', () => {
  ok(near(year('2019/20').osr_m, 179.43, 1e-9), 'years 2019/20 osr_m should be 179.43');
});

// FY 2019/20, third source (27 Nov 2026): the County Treasury table in the Auditor-General's Receiver of Revenue reports.
test('conflict osr-2019-20-audited-table: the audited-report table value is listed beside the CoB and county values and is not plotted', () => {
  const c = conflict('osr-2019-20-audited-table');
  const cs = read('siaya-county-series.json');
  const oag = cs.observations.find((o) => o.id === 'CS-ROR25-T1-1920-osr_actual');
  const oag24 = cs.observations.find((o) => o.id === 'CS-ROR24-T1-1920-osr_actual');
  ok(oag && oag.value === 277193698.2 && oag24 && oag24.value === oag.value, 'both Auditor-General tables must print 277,193,698.20');
  ok(oag.second_reading && oag.second_reading.agree, 'the OCR value must be read by two passes');
  ok(listed('osr-2019-20-audited-table', 179.43) && listed('osr-2019-20-audited-table', 184.25) && conflict('osr-2019-20-audited-table').values.some((x) => near(x.value, oag.value / 1e6, 1e-6)), 'all three values must be listed');
  ok(near(osrPoint('2019/20').value, 179.43, 1e-9) && near(year('2019/20').osr_m, 179.43, 1e-9), 'the series keeps the Controller of Budget value');
  ok(!near(osrPoint('2019/20').alternate.value, oag.value / 1e6, 1), 'the audited-report value must not replace the county alternate');
  const t = cs.observations.find((o) => o.id === 'CS-ROR25-T1-1920-osr_target');
  ok(t && near(t.value - oag.value, 142806301.8, 0.01), 'target minus actual must equal the printed variance');
  ok(c.status === 'open' && c.verification_state === 'unresolved_no_reviewer', 'the case stays open with no reviewer');
});

// FY 2019/20 figures from other documents: both values recorded in the supplementary block, none plotted.
const supp =(docId, measure) => {
  const d = (hist.supplementary.documents || []).find((x) => x.id === docId);
  ok(d, `no supplementary document ${docId}`);
  const f = d.figures.find((x) => x.measure === measure);
  ok(f, `${docId} has no ${measure}`);
  return f.value;
};
const listedCase = (id, a, b, notPlotted) => test(`conflict ${id}`, () => {
  const vals = conflict(id).values.map((v) => v.value);
  ok(vals.length >= 2 && near(vals[0], a, 1e-9) && near(vals[1], b, 1e-9), `register values ${vals} should be ${a} and ${b}`);
  ok(a !== b, 'the two values do not differ');
  notPlotted();
});
listedCase('cash-bf-2019-20', 1186.27, 1840.12, () => {
  ok(near(supp('cob-annual-2020-21-comparatives', 'cash_bf'), 1186.27, 1e-9) && near(supp('cob-h1-2020-21', 'cash_bf'), 1840.12, 1e-9), 'both values must be listed');
});
listedCase('final-budget-2019-20', 8881.77, 8106.98, () => {
  ok(near(supp('siaya-brop-2019-20', 'final_budget'), 8881.77, 1e-9) && near(supp('senate-cpac-2019-20', 'final_budget'), 8106.98, 1e-9), 'both values must be listed');
  ok(year('2019/20').approved === undefined, 'FY 2019/20 approved budget must stay a gap (no Controller of Budget figure)');
  ok(near(9223.35 - 341.58, 8881.77, 0.01), 'county paper: original minus cut should be the final budget');
});
test('FY 2019/20 stays a gap except own-source revenue', () => {
  const y = year('2019/20');
  ['approved', 'spent', 'recurrent_absorption_pct', 'development_absorption_pct', 'osr_target_m', 'pending_total_m'].forEach((k) => ok(y[k] === undefined, `${k} must not be filled`));
});

// FY 2025/26 in-year figures: both reports' values shown side by side; never a full year in the series.
const iy = (period, measure) => {
  const p = hist.in_year.periods.find((x) => x.id === period);
  ok(p, `no in-year period ${period}`);
  const f = p.figures.find((x) => x.measure === measure);
  ok(f, `${period} has no ${measure}`);
  return f;
};
listedCase('in-year-assembly-payables-2025', 39.29, 72, () => {
  ok(near(iy('q1', 'payables_assembly_opening').value, 39.29, 1e-9) && near(iy('h1', 'payables_assembly_opening').value, 72, 1e-9), 'in-year table must carry both values');
  ok(iy('q1', 'payables_assembly_opening').as_of === iy('h1', 'payables_assembly_opening').as_of, 'both values are for the same date');
});
listedCase('in-year-revenue-arrears-2025', 332, 953.73, () => {
  ok(near(iy('q1', 'revenue_arrears_close').value, 332, 1e-9) && near(iy('h1', 'revenue_arrears_close').value, 953.73, 1e-9), 'in-year table must carry both values');
});
test('in-year: FY 2025/26 is not a full year and carries the comparability label', () => {
  ok(!hist.years.some((y) => y.fy === hist.in_year.fy), 'FY 2025/26 must not be in years');
  ok(hist.in_year.comparability === 'In-year, not comparable with full years', 'label changed');
  hist.in_year.conflicts.forEach((id) => conflict(id));
});
test('conflict osr-2023-24: Siaya hub states the later report value as previous year', () => {
  ok(near(siaya.own_source_revenue.previous_year.value, 427.95, 1e-9), 'previous_year should quote the FY 2024/25 report');
});

// Pending bills.
caseTest('pending-2021', 1060.92, 602.08, pendOf(year('2020/21')));
caseTest('pending-2023', 873.38, 761.29, pendOf(year('2022/23')));
caseTest('pending-2024', 303.91, 1120, pendOf(year('2023/24')));
// Own-year rule (sweep D5): each year's stock is the closing stock printed in that year's own report.
test('conflict pending-2023: own-year rule, the FY 2022/23 report closing stock is the series value', () => {
  ok(!(year('2022/23').field_source || {}).pending_total_m && year('2022/23').provenance.pending_total_m.source_id === 'cob-report-2022-23', 'FY 2022/23 pending bills must come from the FY 2022/23 report');
});
test('conflict pending-2024: own-year rule, the FY 2023/24 report closing stock is the series value', () => {
  ok(!(year('2023/24').field_source || {}).pending_total_m && year('2023/24').provenance.pending_total_m.source_id === 'cob-report-2023-24', 'FY 2023/24 pending bills must come from the FY 2023/24 report');
});
test('pending bills: every year in the series follows the own-year rule', () => {
  hist.years.filter((y) => pendOf(y) !== undefined).forEach((y) => {
    const fsrc = y.field_source || {};
    ['pending_total_m', 'pending_recurrent_m', 'pending_development_m'].forEach((k) => ok(!fsrc[k], `${y.fy} ${k} comes from another year's report`));
  });
});

caseTest('pending-2022', 705.38, 840.67, pendOf(year('2021/22')));
caseTest('pending-close-2022', 705.38, 751.99, pendOf(year('2021/22')));
// COR-2026-003: 789.96 is Samburu County's figure (CoB FY 2021/22 report, section 3.37.13); it may not return as Siaya's.
test('pending-close-2022: no Samburu figure in the case or the ledger', () => {
  ok(!listed('pending-close-2022', 789.96), '789.96 (Samburu key observations) is listed again');
  const obs = read('siaya-fiscal-ledger.json').observations;
  ok(!obs.some((o) => o.measure === 'pending_bills_close' && o.value === 789.96), 'Samburu\'s 789.96 is back in the Siaya ledger');
  ok(!obs.some((o) => o.measure === 'wage_bill' && [1120, 1580, 1980].includes(o.value)), 'a Samburu wage-bill figure (1.12, 1.58, 1.98 billion) is back in the Siaya ledger');
});
test('conflict pending-close-2025: both values listed, the year-end stock stays out of the chart', () => {
  const vals = conflict('pending-close-2025').values.map((v) => v.value);
  ok(vals.includes(545.95) && vals.includes(1120), `register values ${vals}`);
  ok(pendOf(year('2024/25')) === undefined, 'FY 2024/25 pending bills must stay a gap in the series');
});
test('conflict pending-2023: the FY 2022/23 report closing stock is listed', () => {
  ok(conflict('pending-2023').values.some((v) => near(v.value, 873.38, 1e-9)), '873.38 should be in the register');
});

// Pending-bills roll-forward: opening + new bills - payments - adjustments = closing, only where every term is published.
const TERMS = ['opening', 'new_bills', 'payments', 'adjustments', 'closing'];
const pub = (t) => typeof t.value === 'number';
const rfRow = (fy) => { const r = hist.pending_rollforward.years.find((x) => x.fy === fy); ok(r, `no roll-forward row ${fy}`); return r; };
hist.pending_rollforward.years.forEach((r) => {
  if (TERMS.every((k) => pub(r[k]))) {
    test(`rollforward ${r.fy}: complete, identity holds`, () => {
      const v = r.opening.value + r.new_bills.value - r.payments.value - r.adjustments.value;
      ok(near(v, r.closing.value, 0.02), `${v.toFixed(2)} vs published closing ${r.closing.value}`);
    });
  } else {
    test(`rollforward ${r.fy}: incomplete, gap shown and not filled`, () => {
      const missing = TERMS.filter((k) => !pub(r[k]));
      missing.forEach((k) => ok(r[k].status === 'not published' && r[k].value === undefined, `${k} must be "not published" with no value`));
      if (pub(r.closing)) ok(Number.isInteger(r.closing.page), 'a closing stock shown for an incomplete year must be the published one, with its page');
    });
  }
});
// Where everything but adjustments is published, check the published terms add up (nothing is filled in).
[['2021/22', 602.08, 598.75, 495.45, 705.38], ['2022/23', 840.67, 543.68, 510.97, 873.38]].forEach(([fy, o, n, p, c]) => test(`rollforward ${fy}: published terms add up with no adjustment reported`, () => {
  const r = rfRow(fy);
  ok(r.opening.value === o && r.new_bills.value === n && r.payments.value === p && r.closing.value === c, 'terms changed');
  ok(near(o + n - p, c, 0.02), `${(o + n - p).toFixed(2)} vs ${c}`);
  ok(r.adjustments.status === 'not published', 'adjustments must stay "not published"');
}));
test('rollforward: closing stocks match the series where both come from the same report', () => {
  ['2015/16', '2016/17', '2017/18', '2018/19', '2020/21', '2021/22', '2022/23', '2023/24'].forEach((fy) => ok(near(rfRow(fy).closing.value, pendOf(year(fy)), 0.011), `${fy}: ${rfRow(fy).closing.value} vs ${pendOf(year(fy))}`));
});

// Budget, spending and absorption.
caseTest('budget-2022-23', 8.6, 8.5, year('2022/23').approved);
caseTest('recurrent-spend-2016-17', 3.65, 3.9, year('2016/17').recurrent_spent);
caseTest('recurrent-absorption-2024-25', 83, 82.2, year('2024/25').recurrent_absorption_pct, 1e-9);
test('conflict recurrent-absorption-2024-25: recomputed value matches the register', () => {
  const y = year('2024/25');
  ok(near((y.recurrent_spent / y.recurrent_budget) * 100, 82.2, 0.05), 'recomputed share is not 82.2');
});
caseTest('development-absorption-2022-23', 53.8, 53.4, year('2022/23').development_absorption_pct, 1e-9);
caseTest('recurrent-absorption-2023-24', 86.8, 85.8, year('2023/24').recurrent_absorption_pct, 1e-9);
caseTest('development-absorption-2023-24', 64.6, 64.5, year('2023/24').development_absorption_pct, 1e-9);
// Re-readings (21 Nov 2026): both methods agree on what is printed; the misread text-layer values stay in the register.
test('re-read development-absorption-2023-24: every printed place reads 64.6, so the case is resolved by the source', () => {
  const c = conflict('development-absorption-2023-24');
  ok(c.status === 'resolved' && c.verification_state === 'resolved_by_source' && c.page_image_checked === false, 'state should be resolved_by_source, page image not checked');
  c.reread.readings.filter((r) => /pct|text|Table 2\.3|table total,/.test(r.where) && !/budget|expenditure/.test(r.where)).forEach((r) => ok(/64\.6/.test(r.method_a) && /64\.6/.test(r.method_b), `${r.where}: both readings should give 64.6`));
  ok(near((2487.20 / 3851.88) * 100, 64.6, 0.05), 'amounts should give 64.6');
  ok(year('2023/24').development_absorption_pct === 64.6 && listed('development-absorption-2023-24', 64.5), 'series shows 64.6, register keeps 64.5');
});
// Equitable share received FY 2023/24 (correction check, 21 Nov 2026): the text layer reads 5.68bn, the page prints 6.68bn.
test('conflict equitable-share-received-2023-24: the ledger holds the printed 6.68bn, never the text-layer 5.68bn', () => {
  const c = conflict('equitable-share-received-2023-24');
  ok(c.status === 'resolved' && c.verification_state === 'resolved_by_source' && listed(c.id, 5680) && listed(c.id, 6680) && listed(c.id, 6681.98), 'register must keep 5680, 6680 and 6681.98, resolved by source');
  const ledger = read('siaya-fiscal-ledger.json');
  const es = ledger.observations.filter((o) => o.measure === 'equitable_share_received' && o.fy === '2023/24');
  const l094 = es.find((o) => o.id === 'L094');
  ok(l094 && l094.value === 6680 && /6\.68 billion/.test(l094.original_text), 'L094 must hold 6,680 as printed');
  ok(es.every((o) => !near(o.unit === 'KSh billion' ? o.value * 1000 : o.value, 5680, 1)), 'no ledger value may be the text-layer 5,680');
  ok(near(6681978904 + 477543935 + 610737745 + 864091625, 8634352209, 0) && near((6681978904 / 7263019559) * 100, 92.0, 0.05), 'Table 3.258 sums and the printed 92.0 per cent');
});
test('re-read recurrent-absorption-2023-24: 85.8 is a misreading, the report prints 86.8 and 87.0, so the case stays open', () => {
  const c = conflict('recurrent-absorption-2023-24');
  ok(c.status === 'open' && c.verification_state === 'unresolved_no_reviewer', 'two printed values: case must stay open');
  const text = c.reread.readings.find((r) => /text/.test(r.where));
  ok(/86\.8/.test(text.method_a) && /86\.8/.test(text.method_b) && !/85\.8/.test(text.method_a + text.method_b), 'both readings of the line should give 86.8');
  ok(year('2023/24').recurrent_absorption_pct === 86.8 && listed('recurrent-absorption-2023-24', 85.8) && listed('recurrent-absorption-2023-24', 87), 'series shows 86.8; 85.8 and 87.0 stay listed');
});
test('re-read development-absorption-2022-23: text 53.4 and table 53.8 are both printed, so the case stays open', () => {
  const c = conflict('development-absorption-2022-23');
  const [text, table] = ['text', 'Table 2.4, Siaya row, PDF p. 34'].map((w) => c.reread.readings.find((r) => r.where.includes(w)));
  ok(/53\.4/.test(text.method_a) && /53\.4/.test(text.method_b) && table.method_a === '53.8' && table.method_b === '53.8', 'readings changed');
  ok(c.status === 'open' && year('2022/23').development_absorption_pct === 53.8, 'case open, series keeps the table total');
  // Locator (23 Nov 2026): 53.8 is printed in Table 2.4 (PDF p. 34); the county chapter's department table has no total row.
  const pv = year('2022/23').provenance.development_absorption_pct;
  ok(pv.page === 34 && pv.printed_page === 8 && /Table 2\.4/.test(pv.page_note), '2022/23 development absorption must cite Table 2.4, PDF p. 34');
});
test('conflict recurrent-absorption-2023-24: provenance points the reader to the register', () => {
  ['recurrent_absorption_pct', 'development_absorption_pct'].forEach((k) => ok(/See conflict/.test(year('2023/24').provenance[k].page_note || ''), `${k} page_note should name the conflict`));
  ok(/See conflict development-absorption-2022-23/.test(year('2022/23').provenance.development_absorption_pct.page_note || ''), '2022/23 page_note should name the conflict');
});
caseTest('budget-financing-osr-2024-25', 1043, 929, siaya.own_source_revenue.target.value, 1e-9);
test('conflict budget-financing-osr-2024-25: stated 47 per cent is quoted, not recomputed', () => {
  ok(siaya.own_source_revenue.share_of_annual_target_pct === 47, 'share_of_annual_target_pct should be the stated 47');
  ok(near(436.68 / 0.47, 929, 1), '436.68 / 0.47 should be about 929');
});

// The 47-county tables (data/counties-cob.json) give further values for Siaya; each is listed in its case, and the
// ten-year series is unchanged.
caseTest('budget-2024-25', 10.94, 10.94813, year('2024/25').approved, 1e-9);
test('conflict budget-2024-25: Table 2.5 amount is listed and the series keeps the chapter figure', () => {
  ok(near(cobSiaya('2024/25', 'approved_budget_total').value, 10948.13, 1e-9), 'Table 2.5 should read 10,948.13');
  ok(listed('budget-2024-25', cobSiaya('2024/25', 'approved_budget_total').value / 1000), 'Table 2.5 amount not in the case');
  ok(Number((10948.13 / 1000).toFixed(2)) === 10.95 && year('2024/25').approved === 10.94, 'rounding difference changed');
});
test('conflict recurrent-absorption-2024-25: Table 2.5 value 82 is listed, the series keeps 83', () => {
  ok(cobSiaya('2024/25', 'recurrent_absorption_pct').value === 82 && listed('recurrent-absorption-2024-25', 82), 'Table 2.5 82 must be in the case');
  ok(year('2024/25').recurrent_absorption_pct === 83, 'series must keep 83');
});
test('conflict recurrent-absorption-2023-24: Table 2.3 value 87.0 is listed, the series shows the chapter value 86.8', () => {
  ok(cobSiaya('2023/24', 'recurrent_absorption_pct').value === 87 && listed('recurrent-absorption-2023-24', 87), 'Table 2.3 87.0 must be in the case');
  ok(near((5138.67 / 5909.25) * 100, 87.0, 0.05), 'Table 2.3 amounts should give 87.0');
  ok(year('2023/24').recurrent_absorption_pct === 86.8, 'series must show 86.8');
});
test('conflict development-absorption-2023-24: Table 2.3 value 64.6 equals the series', () => {
  ok(cobSiaya('2023/24', 'development_absorption_pct').value === 64.6 && listed('development-absorption-2023-24', 64.6), 'Table 2.3 64.6 must be in the case');
  ok(year('2023/24').development_absorption_pct === 64.6, 'series must show 64.6');
});
test('conflict pending-close-2025: Table 2.9 value 1,890.0 is a third value; still no series value', () => {
  const pb = cobSiaya('2024/25', 'pb_grand_total').value;
  ok(pb === 1890 && listed('pending-close-2025', 1890), 'Table 2.9 1,890.0 must be in the case');
  ok(near(cobSiaya('2024/25', 'pb_exec_recurrent').value + cobSiaya('2024/25', 'pb_exec_development').value, pb, 0.15), 'Executive parts (832.9 + 1,057.0 = 1,889.9, printed rounding) should add to 1,890.0');
  ok(conflict('pending-close-2025').values.length === 3, 'the case should hold three values');
  ok(pendOf(year('2024/25')) === undefined, 'FY 2024/25 pending bills must stay a gap in the series');
});
test('conflict pending-2023: FY 2022/23 Table 2.6 value 873.37 is listed; the series keeps the chapter 873.38', () => {
  const pb = cobSiaya('2022/23', 'pb_grand_total').value;
  ok(near(pb, 873.37, 0.005) && listed('pending-2023', 873.37), 'Table 2.6 873.37 must be in the case');
  const parts = ['pb_exec_recurrent', 'pb_exec_development', 'pb_assembly_recurrent', 'pb_assembly_development'].reduce((t, k) => t + cobSiaya('2022/23', k).value, 0);
  ok(near(parts, pb, 0.01), 'the four printed parts should add to the grand total');
  ok(near(pendOf(year('2022/23')), 873.38, 0.005), 'series value changed');
});
test('conflict pending-close-2022: FY 2021/22 Table 2.6 value 751.99 is listed; the series keeps 705.38', () => {
  ok(near(cobSiaya('2021/22', 'pb_grand_total').value, 751.99, 0.005) && listed('pending-close-2022', 751.99), 'Table 2.6 751.99 must be in the case');
  ok(near(year('2021/22').pending_recurrent_m + year('2021/22').pending_development_m, 705.38, 0.005), 'series parts changed');
});
test('47-county FY 2022/23 and 2021/22: Siaya budget, spending, absorption and own-source revenue equal the series', () => {
  [['2022/23', 'ordinary_osr_actual'], ['2021/22', 'total_osr_actual']].forEach(([fy, osr]) => {
    const y = year(fy);
    ok(Number((cobSiaya(fy, 'approved_budget_total').value / 1000).toFixed(2)) === y.approved, `${fy} approved`);
    ok(Number((cobSiaya(fy, 'expenditure_total').value / 1000).toFixed(2)) === y.spent, `${fy} spent`);
    ok(cobSiaya(fy, 'recurrent_absorption_pct').value === y.recurrent_absorption_pct && cobSiaya(fy, 'development_absorption_pct').value === y.development_absorption_pct, `${fy} absorption`);
    ok(Number(cobSiaya(fy, osr).value.toFixed(2)) === osrPoint(fy).value, `${fy} own-source revenue`);
  });
  ok(cobSiaya('2022/23', 'total_osr_actual').status === 'not_in_table', 'FY 2022/23 total OSR (with FIF) is not printed and must stay empty');
});
// National and electoral sources (21 Nov 2026).
const xpol = require('../data/political.json'); const xder = require('../data/derived.json');
test('conflict registered-voters-2022: the constituency file adds to 22,102,532; 22,120,458 is listed beside it', () => {
  const v = xpol.iebc_registered_voters_2022_by_constituency;
  ok(v.rows.reduce((t, r) => t + r.registered_voters, 0) === 22102532, 'the 290 rows should add to 22,102,532');
  ok(listed('registered-voters-2022', 22102532) && listed('registered-voters-2022', 22120458), 'both totals must be in the case');
  ok(22120458 - 22102532 === 17926, 'gap changed');
});
test('conflict deposit-rate-cbk-wdi: CBK annual mean and World Bank deposit rate for 2024 are both listed, lending rates agree', () => {
  const d = xder.side_by_side_conflicts.deposit_rate_annual.rows['2024'];
  ok(listed('deposit-rate-cbk-wdi', d.a) && listed('deposit-rate-cbk-wdi', Number(d.b.toFixed(2))), 'both 2024 values must be listed');
  const monthly = Object.entries(require('../data/cbk.json').series.deposit_rate.monthly).filter(([k]) => k.startsWith('2024-')).map(([, v]) => v);
  ok(monthly.length === 12 && near(monthly.reduce((t, v) => t + v, 0) / 12, d.a, 0.001), 'CBK annual mean should be the mean of 12 months');
  const gaps = Object.values(xder.side_by_side_conflicts.deposit_rate_annual.rows).map((r) => r.diff_a_minus_b).filter((x) => x !== null);
  ok(near(Math.max(...gaps.map(Math.abs)), 3.665, 0.001), 'largest gap should be 3.67 points (2012)');
  const lend = Object.values(xder.side_by_side_conflicts.lending_rate_annual.rows).map((r) => r.diff_a_minus_b).filter((x) => x !== null);
  ok(Math.max(...lend.map(Math.abs)) < 0.08, 'lending rates should agree within 0.08 points');
});
test('conflict candidates-2022-woman-member: printed parts add to one less than the printed totals', () => {
  const rows = xpol.iebc_candidates_2022_by_position.rows; const w = rows.find((r) => /Woman/.test(r.position)); const t = rows.find((r) => r.position === 'Total');
  ok(w.party_sponsored + w.independent === 360 && w.total === 361 && listed('candidates-2022-woman-member', 361) && listed('candidates-2022-woman-member', 360), 'woman member row changed');
  ok(t.party_sponsored + t.independent === 16105 && t.total === 16106, 'total row changed');
  ok(rows.filter((r) => r !== t).reduce((s, r) => s + r.total, 0) === t.total, 'column of totals should add to the printed total');
});
test('conflict pending-2024: Table 2.5 of the FY 2023/24 report matches the listed 303.91', () => {
  ok(near(cobSiaya('2023/24', 'pb_grand_total').value, 303.91, 0.005) && listed('pending-2024', 303.91), 'Table 2.5 should read 303.91');
});
test('conflict budget-financing-osr-2024-25: Table 2.1 target 927.34 is listed and gives the printed 47 per cent', () => {
  ok(cobSiaya('2024/25', 'total_osr_target').value === 927.34 && listed('budget-financing-osr-2024-25', 927.34), 'Table 2.1 target must be in the case');
  ok(cobSiaya('2024/25', 'osr_performance_pct').value === 47 && near((436.68 / 927.34) * 100, 47.1, 0.05), 'Table 2.1 should print 47');
  ok(siaya.own_source_revenue.target.value === 1043, 'the Siaya hub keeps the budget financing target');
});
// FY 2024/25 own-source revenue: the county statement (Kenya News Agency, MEDIA-01) and the county's Q4 report beside the
// Controller of Budget figure. Nothing from the county side is plotted; the series and the hub keep 436.68.
caseTest('osr-2024-25-county-statement', 436.68, 946.8934404, osrPoint('2024/25').value, 1e-9);
test('conflict osr-2024-25-county-statement: Controller of Budget Table 2.1 total, county report and hub agree on what is listed and shown', () => {
  const c = conflict('osr-2024-25-county-statement');
  ok(c.status === 'open' && c.verification_state === 'unresolved_no_reviewer', 'case must stay open with no reviewer');
  ok(cobSiaya('2024/25', 'total_osr_actual').value === 436.68 && near(siaya.own_source_revenue.observations[0].value, 436.68, 1e-9), 'Table 2.1 and the hub should read 436.68');
  ok(listed('osr-2024-25-county-statement', 757.570621) && near(236.502391 + 521.068230, 757.570621, 1e-6), 'county Q4 report: CRF plus A-i-A should be listed as 757.57');
  const rep = siaya.own_source_revenue.observations.find((o) => /Table 4/.test(o.source));
  ok(rep && rep.source_url === 'https://siaya.go.ke/?cgdp_download=31530' && near(rep.value, 757.570621, 1e-9) && /page 6/.test(rep.page), 'the hub should show the county Q4 report total beside the Controller of Budget figure, with its page');
  // The fifteen revenue streams in the Kenya News Agency article add up to the stated total (KSh).
  const streams = [19150691, 3439365, 151563105.5, 4701280, 10248810, 6169641, 11671066, 25608268, 33462668.4, 17629219, 14243660, 643174553, 2063050, 2128550, 1639513.5];
  ok(near(streams.reduce((t, v) => t + v, 0), 946893440.4, 0.01), 'article streams should add to KSh 946,893,440.40');
  ok(near((946893440.4 / 1044061306) * 100, 90.7, 0.05) && /90\.6%/.test(c.definitions) && /47%/.test(c.definitions), 'the stated 90.6 and 47 per cent are quoted, not recomputed');
  ok(/the county government/.test(c.definitions) && !/secretary|governor|official/i.test(JSON.stringify(c)), 'the case attributes the statement to the county government, not to a person or office holder');
});

// Corrections of 21 Nov 2026 (label, citation and licence cases; text values, resolved by the source).
test('conflict hiv-2025-age-label: the 2025 HIV point is labelled Overall, not 15 to 49, and cites its page', () => {
  const c = conflict('hiv-2025-age-label');
  ok(c.status === 'resolved' && c.verification_state === 'resolved_by_source' && listed2(c, 'ages 15 to 49') && listed2(c, 'Overall'), 'register must keep both labels, resolved by source');
  const hiv = hist.health.hiv;
  const p = hiv.points.find((x) => x.year === 2025);
  ok(p && p.value === 10.3 && /^Overall/.test(p.age_group) && /PDF page 84 \(printed page 79\)/.test(p.document) && /Nsdcc-County-Profiles-2026/.test(p.url), '2025 point: Overall, PDF p. 84 (printed p. 79), profiles URL');
  ok(!/15 to 49|15-49/.test(hiv.label), 'the series label must not say 15 to 49 for every point');
  ok(hiv.points.every((x) => x.age_group), 'every HIV point names its age band');
  const h = read('siaya-health.json').observations.find((o) => o.id === 'hiv-prev-2025-profiles');
  ok(h && h.value === p.value && h.pdf_page === 84 && h.printed_page === 79, 'matches the health dataset reading');
});
test('conflict hiv-scasp-printed-page: Table 1 of the HIV strategic plan is PDF page 16, printed page 4', () => {
  const c = conflict('hiv-scasp-printed-page');
  ok(c.status === 'resolved' && listed2(c, 'printed page 3') && listed2(c, 'printed page 4'), 'register must keep both page labels');
  hist.health.hiv.points.filter((x) => x.year === 2013 || x.year === 2015).forEach((x) => ok(/PDF page 16 \(printed page 4\)/.test(x.document) && !/printed page 3/.test(x.document), `${x.year}: should cite printed page 4`));
  const lib = read('source-library.json').documents.find((d) => d.document_id === 'nacc-siaya-hiv-plan');
  ok(lib && !/printed page 3\)/.test(lib.cited_by), 'library record should not cite printed page 3');
});
test('conflict kenya-counties-map-licence: the county map states the ADM1 licence (Public Domain), not the ADM2 one', () => {
  const c = conflict('kenya-counties-map-licence');
  ok(c.status === 'resolved' && listed2(c, 'CC BY 3.0 IGO') && listed2(c, 'Public Domain'), 'register must keep both licences');
  const m = read('kenya-counties-map.json').meta;
  ok(m.licence === 'Public Domain' && /KEN-ADM1-32016919/.test(m.source) && /RCMRD/.test(m.source) && !/OCHA/.test(m.source), 'map meta must state Public Domain and the RCMRD upstream');
  const layer = read('siaya-geography.json').spatial_layers.find((l) => l.file === 'data/kenya-counties-map.json');
  ok(layer && layer.licence === m.licence, 'geography registry and map meta must agree');
  ok(/licence: 'Public Domain'/.test(fs.readFileSync(path.join(__dirname, 'make-kenya-map.js'), 'utf8')), 'the map generator must write the same licence');
});

// IMF World Economic Outlook against CBK (data/imf.json comparisons, latest vintage, actual years only): the two
// debt ratios and the end-of-period inflation rate that differ by more than 0.5 points. Definitional differences
// (GDP per capita, revenue and expenditure against the World Bank) are notes in docs/imf-notes.md, not cases.
const imf = read('imf.json');
const imfCase = (id, ind, yr) => test(`conflict ${id}: IMF ${ind} ${yr} and the comparison value are both listed and differ by more than 0.5 (points or per cent)`, () => {
  const c = imf.comparisons.find((x) => x.imf_indicator === ind && x.year === yr && x.vintage === imf.vintages[0].vintage);
  ok(c && c.candidate_conflict && c.imf_type === 'actual', `${ind} ${yr} is no longer a candidate in data/imf.json`);
  ok(listed(id, c.imf_value) && listed(id, c.other_value), 'both values must be in the case');
  const diff = c.difference_basis === 'percent' ? ((c.imf_value - c.other_value) / c.other_value) * 100 : c.imf_value - c.other_value;
  ok(near(diff, c.difference, 1e-3) && Math.abs(c.difference) > 0.5, `difference changed (${diff} vs ${c.difference})`);
  const v = imf.vintages[0].values.find((x) => x.indicator === ind && x.year === yr);
  ok(v && near(v.value, c.imf_value, 1e-9) && v.type === 'actual', 'the IMF series value must equal the listed value');
});
imfCase('imf-debt-cbk-2023', 'GGXWDG_NGDP', 2023);
imfCase('imf-debt-cbk-2025', 'GGXWDG_NGDP', 2025);
imfCase('imf-inflation-eop-cbk-2019', 'PCPIEPCH', 2019);
// IMF against the World Bank (sweep D13): the substantive definitional differences are register cases, labelled as
// definitional, and shown side by side on /kenya/.
imfCase('imf-wb-gdp-per-capita-2025', 'NGDPDPC', 2025);
imfCase('imf-wb-revenue-gdp-2023', 'GGR_NGDP', 2023);
imfCase('imf-wb-expense-gdp-2023', 'GGX_NGDP', 2023);
imfCase('imf-wb-gdp-usd-2024', 'NGDPD', 2024);
test('IMF against World Bank cases are labelled definitional, open, and name both measures', () => {
  ['imf-wb-gdp-per-capita-2025', 'imf-wb-revenue-gdp-2023', 'imf-wb-expense-gdp-2023', 'imf-wb-gdp-usd-2024'].forEach((id) => {
    const c = conflict(id);
    ok(c.status === 'open' && /IMF/.test(c.values[0].label) && /World Bank WDI/.test(c.values[1].label), `${id}: labels`);
    ok(/Definitional|Hypothesis/.test(c.hypothesis) && /\/kenya\//.test(c.effect), `${id}: must be labelled definitional (or a hypothesis) and point to /kenya/`);
  });
});

// Data-integrity corrections of 21 Nov 2026 (sweep D6, D15, D16, D12): each checked against the printed page.
const ledgerX = read('siaya-fiscal-ledger.json');
const obsX = (id) => { const o = ledgerX.observations.find((x) => x.id === id); ok(o, `no ledger observation ${id}`); return o; };
test('conflict fif-2023-24-reading: the FY 2023/24 health FIF is 388.63 (printed), never the text-layer 388.53', () => {
  const c = conflict('fif-2023-24-reading');
  ok(c.status === 'resolved' && c.verification_state === 'resolved_by_source' && listed(c.id, 388.53) && listed(c.id, 388.63) && listed(c.id, 388.626776), 'register must keep 388.53, 388.63 and 388.626776, resolved by source');
  ok(/600 dpi/.test(c.reread.method_b) && c.reread.readings.some((r) => /388\.63/.test(r.method_b)), 'the 600 dpi reading must be recorded');
  ok(near(obsX('L151').value, 388.626776, 1e-9) && near(obsX('L160').value, 388.626776, 1e-9), 'CoB Table 2.1 and county Q4 Table 4 agree on 388,626,776');
  ok(near(388.626776 + 222.110969, 610.737745, 1e-6), 'Table 2.1 parts add to the printed total');
  const txt = JSON.stringify(siaya) + JSON.stringify(reg.conflicts.filter((x) => x.id !== c.id));
  ok(!/388\.53/.test(txt) && !/0\.11 million difference/.test(txt), 'no page-facing text may carry 388.53 or the 0.11 million difference claim');
  ok(/610\.74 minus 388\.63 is 222\.11/.test(conflict('osr-2023-24').hypothesis), 'osr-2023-24 hypothesis arithmetic must use 388.63');
});
test('conflict pending-2024-table-2-5-scope: Table 2.5 grand total for Siaya is the County Executive only (Assembly cells "-")', () => {
  const c = conflict('pending-2024-table-2-5-scope');
  ok(c.status === 'resolved' && listed2(c, 'county government (executive and assembly)') && listed2(c, 'county executive'), 'register must keep both scope labels');
  const l249 = obsX('L249'); const l255 = obsX('L255');
  ok(l249.scope === 'county executive' && l255.scope === 'county executive', 'L249 and L255 must both be county executive');
  ok(/'-'/.test(l255.note || '') && /12\.67/.test(l255.note || ''), 'L255 note must say the Assembly cells are shown as "-" and the Assembly reported 12.67m separately');
});
test('conflict q1-2025-26-development-spending: the printed text says no development spending; 0 is kept with the quote', () => {
  const c = conflict('q1-2025-26-development-spending');
  ok(c.status === 'resolved' && listed2(c, '0 KSh million') && listed2(c, 'There was no spending on development'), 'register must keep the held 0 and the printed sentence');
  const f = iy('q1', 'spending_development');
  ok(f.value === 0 && /no spending on development/.test(f.as_printed || ''), 'Q1 development spending must carry the printed sentence');
});
test('in-year money figures are all in KSh million (no KSh bn beside KSh m in one row)', () => {
  hist.in_year.periods.forEach((p) => p.figures.forEach((f) => ok(f.unit === 'KSh m' || f.unit === '%', `${p.id} ${f.measure}: unit ${f.unit}`)));
  ok(iy('q1', 'approved_budget').value === 12790 && iy('h1', 'spending_total').value === 2500, 'converted values wrong');
});

test('conflict osr-2024-25-county-statement: the case explains the gap part by part from the analysis records (sweep D24)', () => {
  const c = conflict('osr-2024-25-county-statement');
  const an = read('siaya-analysis.json').records; const r = (id) => an.find((x) => x.calc_id === id);
  ok(r('SIA-A8-2024-25-difference-fif').result === 321.23 && r('SIA-A8-2024-25-difference-ordinary').result === -0.34 && r('SIA-A8-2024-25-difference-total').result === 320.89, 'analysis differences changed');
  ok(/236\.50/.test(c.definitions) && /236\.84/.test(c.definitions) && /521\.07/.test(c.definitions) && /199\.84/.test(c.definitions) && /#an-a8/.test(c.definitions), 'case must give the ordinary and FIF parts and link the analysis');
});

test('conflict iebc-president-independent-dash: the printed dash is null, not 0', () => {
  const c = conflict('iebc-president-independent-dash');
  const r = xpol.iebc_candidates_2022_by_position.rows.find((x) => x.position === 'President');
  ok(c.status === 'resolved' && r.independent === null && /shown as '-'/.test(r.note), 'President independent must be null with the note');
});
test('conflict ecde-enrolment-2022-value-type: the end-2022 ECE figure is labelled unclear', () => {
  const c = conflict('ecde-enrolment-2022-value-type');
  const o = read('siaya-education.json').observations.find((x) => x.id === 'cidp-ecde-enrol-end');
  ok(c.status === 'resolved' && listed2(c, 'actual') && listed2(c, 'unclear') && o.value_type === 'unclear', 'value_type must be unclear');
});
test('conflict subcounty-voters-term: sub-county voters use the IEBC term and match the register', () => {
  const c = conflict('subcounty-voters-term');
  const sc = read('subcounties.json').sub_counties;
  ok(c.status === 'resolved' && sc.every((x) => Number.isInteger(x.registered_voters_2022) && !('eligible_voters_2022' in x)), 'field must be registered_voters_2022');
  const reg41 = xpol.iebc_registered_voters_2022_by_constituency.rows.filter((r) => r.county_code === '041').reduce((s, r) => s + r.registered_voters, 0);
  ok(sc.reduce((s, x) => s + x.registered_voters_2022, 0) === reg41, 'sub-county voters must add to the IEBC register for Siaya');
});

test('conflict analytics-per-person-2022-23: per-person spending has one home (A1 on /counties/siaya/analysis/), never an interpolated population', () => {
  const c = conflict('analytics-per-person-2022-23');
  const a1 = read('siaya-analysis.json').records.find((x) => x.calc_id === 'SIA-A1-2022-23-cob-report-2022-23');
  ok(c.status === 'resolved' && a1.result === 7224 && listed(c.id, 7224) && listed(c.id, 7096), 'A1 value and the withdrawn value must be listed');
  // /analytics/ moved into /counties/siaya/analysis/ (owner decision U2, 21 Nov 2026); its fallback page only redirects.
  const moved = fs.readFileSync(path.join(__dirname, '..', 'app', 'analytics', 'page.js'), 'utf8');
  const src = ['app/counties/siaya/analysis/page.js', 'components/siaya/AnalysisTrends.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n');
  ok(/to="\/counties\/siaya\/analysis\/"/.test(moved) && !/interpolate\(/.test(src) && /an-a1/.test(src), '/analytics/ must redirect to Siaya analysis, which must not interpolate population and must hold the A1 section');
});

// GOV-03 (County Budget Review and Outlook Paper): development spending FY 2024/25, Tables 9 and 11 against the text.
test('conflict cbrop-development-spending-2024-25: the table figure adds to the printed total; the text figure does not', () => {
  const c = conflict('cbrop-development-spending-2024-25');
  const led = read('siaya-fiscal-ledger.json');
  const o = (id) => { const x = led.observations.find((y) => y.id === id); ok(x, `no ledger ${id}`); return x; };
  ok(c.status === 'resolved' && c.register === 'source_error' && c.ledger_case === 'D-L231-L232', 'case must be resolved, a source error, and name ledger case D-L231-L232');
  ok(listed('cbrop-development-spending-2024-25', o('L231').value) && listed('cbrop-development-spending-2024-25', o('L232').value), 'both printed values must be listed');
  ok(near(o('L230').value + o('L231').value, o('L229').value, 1e-6), 'recurrent + development (tables) must equal the printed total');
  ok(!near(o('L230').value + o('L232').value, o('L229').value, 1), 'the text figure must not add to the printed total');
  ok(o('L232').source_error && /2,674,325,435/.test(o('L232').source_error.quote), 'L232 must carry the source_error flag quoting the text');
  const cls = read('ledger-classes.json').cases.find((x) => x.case_id === 'D-L231-L232');
  ok(cls && cls.classification === 'resolved by source', 'ledger case D-L231-L232 must be classed resolved by source');
});

// Resolved cases: each says whether it is our correction, a source error or no change; our corrections carry the record.
test('resolved register cases are classed for the corrections register', () => {
  reg.conflicts.filter((c) => c.status === 'resolved').forEach((c) => {
    ok(['our_correction', 'source_error', 'no_change'].includes(c.register), `${c.id}: resolved without register`);
    if (c.register === 'our_correction') ok(c.correction && c.correction.original && c.correction.corrected && c.correction.affected_pages.length, `${c.id}: our correction without its record`);
  });
  reg.conflicts.filter((c) => c.status === 'open').forEach((c) => ok(!c.register && !c.correction, `${c.id}: an open case cannot be on the corrections register`));
  // Every ledger case classed "resolved by source" is logged as a resolved register case.
  read('ledger-classes.json').cases.filter((x) => x.classification === 'resolved by source').forEach((x) => ok(reg.conflicts.some((c) => c.ledger_case === x.case_id && c.status === 'resolved'), `${x.case_id}: resolved by source but not in the register`));
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
