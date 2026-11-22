// Audit findings (/counties/siaya/audits/): Auditor-General reports on the County Executive and the County Assembly
// of Siaya, from data/siaya-audits.json. Opinions are shown as printed; findings keep their report, page and amounts as
// printed. Nothing is summed across findings, and no individual is named. Server and build only.
// Read through lib/review-status.js: a value rejected in editorial review is already removed (masked) here.
const rs = require('./review-status');
const aud = rs.masked('siaya-audits');
const manifest = require('../data/source-manifest.json');

const ENTITY = { county_executive: 'County Executive', county_assembly: 'County Assembly', county_government: 'County Government (whole county, FY 2013/14 audit)' };
const CATEGORY = {
  payroll: 'Payroll and staff', projects: 'Projects and contracts', unsupported_expenditure: 'Spending not fully supported',
  assets: 'Assets', financial_reporting: 'Financial statements', procurement: 'Procurement', budget_control: 'Budget control',
  pending_bills: 'Pending bills', transfers: 'Transfers and funds', governance: 'Governance', imprest: 'Imprest',
  cash_and_bank: 'Cash and bank', revenue: 'Revenue', ict: 'ICT systems', other: 'Other',
};
const SECTION = {
  basis_for_disclaimer: 'Basis for disclaimer of opinion', financial_operations: 'Financial operations review',
  financial_statements: 'Basis for opinion (financial statements)', emphasis_of_matter: 'Emphasis of matter', other_matter: 'Other matter',
  lawfulness: 'Lawfulness and effectiveness in use of public resources', internal_controls: 'Internal controls, risk management and governance',
};
// Fiscal years the tracker covers for each entity (FY 2013/14 to FY 2024/25).
const YEARS = Array.from({ length: 12 }, (_, i) => `${2013 + i}/${String(14 + i).padStart(2, '0')}`);
// Audit reports are in the tracker's own document list; the Senate compilation used for two opinions is in the manifest.
const docOf = (id) => aud.documents.find((d) => d.doc_id === id) || (({ title, url }) => ({ doc_id: id, title, url }))(manifest.documents.find((d) => d.id === id) || {});
const ksh = (v) => `KSh ${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const amountText = (f) => f.amounts.map((a) => `${a.label}: ${ksh(a.value)}`).join('; ');

// A finding withdrawn in editorial review: its title and category are the value, so neither is shown or counted;
// pages say how many were withdrawn instead ("1 finding withdrawn after review").
const WITHDRAWN_TITLE = 'Finding withdrawn after editorial review';
const isWithdrawn = (f) => rs.review('siaya-audits', f.id).hide;
const withdrawnText = (n) => (n ? `${n} finding${n === 1 ? '' : 's'} withdrawn after review` : '');
const kept = (list) => list.filter((f) => !isWithdrawn(f));

function findingRow(f) {
  const d = docOf(f.doc_id);
  const out = isWithdrawn(f);
  return {
    id: f.id, entity: f.entity, fy: f.fy, category: out ? null : f.category, section: SECTION[f.section] || f.section, title: out ? WITHDRAWN_TITLE : f.title, withdrawn: out,
    paragraph: f.paragraph, page: f.page, doc: d.title, url: d.url, amounts: f.amounts.map((a) => `${a.label}: ${ksh(a.value)}`),
    heading: f.report_heading && f.report_heading.quoted ? f.report_heading.text : null,
    prior: f.unresolved_prior_year.flag ? f.unresolved_prior_year.basis : null, next: !!f.listed_unresolved_next_year, note: f.note || '',
    review: rs.badge('siaya-audits', f.id),
  };
}

function audits() {
  const opinion = (entity, fy) => aud.opinions.find((o) => o.entity === entity && o.fy === fy) || null;
  const gap = (entity, fy) => aud.gaps.find((g) => g.entity === entity && g.fy === fy) || null;
  const cell = (entity, fy) => {
    const o = opinion(entity, fy); const g = gap(entity, fy);
    const d = o && o.doc_id ? docOf(o.doc_id) : null;
    return { opinion: o ? o.opinion : null, note: o ? o.opinion_note || '' : '', page: o ? o.page : null, doc: d ? d.title : null, url: d ? d.url : null,
      confidence: o ? o.confidence : null, gap: g ? g.status : null, reason: g ? g.reason : null, findings: kept(aud.findings.filter((f) => f.entity === entity && f.fy === fy)).length,
      withdrawn: aud.findings.filter((f) => f.entity === entity && f.fy === fy && isWithdrawn(f)).length,
      review: o ? rs.badge('siaya-audits', `opinion:${entity}:${fy}`) : null };
  };
  const opinions = YEARS.map((fy) => ({ fy, executive: cell('county_executive', fy), assembly: cell('county_assembly', fy) }));
  const whole = aud.opinions.filter((o) => o.entity === 'county_government').map((o) => ({ fy: o.fy, opinion: o.opinion, review: rs.badge('siaya-audits', `opinion:${o.entity}:${o.fy}`), page: o.page, doc: docOf(o.doc_id).title, url: docOf(o.doc_id).url, findings: kept(aud.findings.filter((f) => f.entity === 'county_government' && f.fy === o.fy)).length, withdrawn: aud.findings.filter((f) => f.entity === 'county_government' && f.fy === o.fy && isWithdrawn(f)).length }));
  const missing = aud.gaps.filter((g) => g.status === 'missing');
  const findings = aud.findings.map(findingRow);
  const carried = {
    prior: findings.filter((f) => f.prior),
    next: ['county_executive', 'county_assembly'].map((e) => ({ entity: e, groups: YEARS.map((fy) => ({ fy, items: findings.filter((f) => f.entity === e && f.fy === fy && f.next) })).filter((g) => g.items.length) })),
    same: aud.same_items.map((s) => ({ ...s, items: s.finding_ids.map((id) => findings.find((f) => f.id === id)) })),
  };
  // matrix: masked (lib/review-status.js), so a withdrawn finding is not in the counts.
  return { meta: aud.meta, opinions, whole, missing, findings, carried, caveats: aud.caveats, documents: aud.documents, matrix: aud.recurrence_by_category, withdrawn: aud.findings.filter(isWithdrawn).length };
}

// Dataset rows for the catalogue CSV: one row per finding, with its report, PDF page and the amounts as printed.
function datasetRows() {
  return aud.findings.map((f) => {
    const d = docOf(f.doc_id);
    return {
      finding_id: f.id, entity: ENTITY[f.entity], fiscal_year: f.fy, report: d.title, report_url: d.url, pdf_page: f.page, paragraph: f.paragraph,
      section: SECTION[f.section] || f.section, category: isWithdrawn(f) ? '' : CATEGORY[f.category] || f.category, title: isWithdrawn(f) ? '' : f.title, amounts_as_printed: amountText(f),
      unresolved_from_prior_year_per_report: f.unresolved_prior_year.flag ? f.unresolved_prior_year.basis : '', listed_unresolved_in_next_report: f.listed_unresolved_next_year ? 'yes' : '',
      same_item: f.same_item || '', confidence: d.confidence, note: f.note || '',
      review_status: rs.review('siaya-audits', f.id).label, review_note: rs.review('siaya-audits', f.id).hide ? rs.review('siaya-audits', f.id).reason : '',
    };
  });
}

module.exports = { withdrawnText, audits, datasetRows, aud, ENTITY, CATEGORY, SECTION, YEARS };
