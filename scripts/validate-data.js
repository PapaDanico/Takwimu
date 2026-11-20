// Fails the build when a figure lacks provenance. Run: npm run validate
const fs = require('fs');
const path = require('path');
const errors = [];
const fail = (m) => errors.push(m);

const siaya = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'siaya.json'), 'utf8'));
const osr = siaya.own_source_revenue;
if (!osr.observations || osr.observations.length < 1) fail('siaya: no OSR observations');
(osr.observations || []).forEach((o, i) => {
  ['value', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (o[k] === undefined || o[k] === '') fail(`siaya OSR observation ${i}: missing ${k}`);
  });
  if (typeof o.value !== 'number' || o.value <= 0) fail(`siaya OSR observation ${i}: value must be a positive number`);
  if (!(o.confidence >= 1 && o.confidence <= 5)) fail(`siaya OSR observation ${i}: confidence must be 1-5`);
  if (o.source_url && !/^https:\/\//.test(o.source_url)) fail(`siaya OSR observation ${i}: source_url must be https`);
});
if (!Array.isArray(siaya.sub_counties) || siaya.sub_counties.length !== 6) fail('siaya: expected 6 sub-counties');

(osr.other_reports || []).forEach((o, i) => {
  ['description', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (o[k] === undefined || o[k] === '') fail(`siaya other_reports ${i}: missing ${k}`);
  });
});

const audit = siaya.audit;
if (!audit) fail('siaya: missing audit block');
else {
  ['fiscal_year', 'entity', 'opinion', 'source', 'source_url', 'retrieved', 'confidence', 'status'].forEach((k) => {
    if (audit[k] === undefined || audit[k] === '') fail(`siaya audit: missing ${k}`);
  });
  if (!['Unqualified', 'Qualified', 'Adverse', 'Disclaimer'].includes(audit.opinion)) fail('siaya audit: opinion must be Unqualified, Qualified, Adverse or Disclaimer');
  (audit.findings || []).forEach((f, i) => {
    if (!f.label || typeof f.amount_kes !== 'number' || f.amount_kes <= 0) fail(`siaya audit finding ${i}: needs label and positive amount_kes`);
  });
}

if (errors.length) {
  console.error('Data validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Data validation passed.');
