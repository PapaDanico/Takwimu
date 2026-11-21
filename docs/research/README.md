# Research deliverables

These files are the research registers from section 16 of the Siaya handover. The export script builds them from the files in `data/`. Do not edit them by hand: change the data, then regenerate.

```
node scripts/export-research-deliverables.js    # rewrites the six files below
node scripts/test-research-deliverables.js      # checks them (exit 1 on failure)
```

The export only reads `data/` and gives the same bytes on every run. Rows are sorted and no timestamps are written. When a data file changes, the test fails until the export is run again and its output is committed.

## Files

| File | One row per | Built from |
|---|---|---|
| `SOURCE_REGISTER.csv` | document in the source library | `data/source-library.json`, joined to `data/source-manifest.json` by SHA-256 |
| `COVERAGE_MATRIX.csv` | sector × year × geography × source type (× dataset) | observations and gaps in `data/siaya-*.json`, `data/history.json`, `data/counties-cob.json` |
| `INDICATOR_DICTIONARY.md` | measure or indicator key, per data file | the same files as the coverage matrix |
| `RECONCILIATION_LEDGER.csv` | discrepancy case, open or resolved | `data/siaya-fiscal-ledger.json` (discrepancies) and `data/conflicts.json` |
| `NGO_PROGRAMME_REGISTER.csv` | programme record | `data/siaya-programmes.json` |
| `PROJECT_REGISTER.csv` | project | `data/siaya-projects.json` |

### SOURCE_REGISTER.csv
This file lists each document with its URL (`source_url`, plus `file_url` where the manifest records the file itself), retrieval status and note, `last_checked_at`, the date the manifest retrieved and hashed the file, SHA-256, size, licence, `redistribution_allowed` and review status. `source_type` is a publisher class derived from the publisher name, for example `controller_of_budget`, `auditor_general`, `county_government` or `national_statistics`. `cited_in` lists the data files that refer to the document by ID or hash.

### COVERAGE_MATRIX.csv
`observations` counts non-null values. `gaps` counts the items the data files record as missing: `gaps` lists, missing cells in the ledger's completeness matrix, null cells in `counties-cob.json` (each keeps its reason in the source file), analysis records with status `gap`, and pending-bill terms marked "not published". Gaps have no source, so their `source_type` is `gap (no source)`.

`year` is normalised from the printed period:
- `FY yyyy/yy` for a fiscal year
- `yyyy` for a calendar year or date
- `yyyy-yyyy` for a multi-year range or plan period
- `not stated` when the period is missing or cannot be read

`geography` is `county: Siaya` unless the data says otherwise. Other values are the ward or sub-county level, `county: <name>` for the 47-county Controller of Budget table, the location level for projects, and the geography class for programmes. `subsector` holds the project or programme sector, the analysis family (A1-A7), the audited entity or the GVA activity.

The reference layers (`siaya-geography.json`, `siaya-boundaries.json`, `siaya-wards-geo.json`) hold no indicators and are not counted.

### INDICATOR_DICTIONARY.md
Each key has these columns:
- **Name** and **Definition as used:** the definition comes from the data file itself, such as measure definitions, `meta.definitions` or field notes. Where the file gives none, the tables the values were read from are named instead. No definition is written in from outside the data.
- **Unit**
- **Denominator:** the population, age band or ratio roles recorded with the value.
- **Period type**
- **Method:** the read method, value type, evidence type or calculation.
- **Function:** devolved or national. It is filled only where the data records it, which is currently education.
- **Source datasets / ids**
- **Obs:** the number of observations.

### RECONCILIATION_LEDGER.csv
This file has every ledger discrepancy (difference above 1 per cent, values in KSh million) and every entry in the conflict register. Each row gives both claims with their source and page or URL, all values for conflicts that have more than two, the difference and the stated explanation or hypothesis. It also gives the status, the verification state and the resolution or effect. `is_osr_case` marks own-source-revenue cases. The open FY 2023/24 dispute (610.74 against 427.95) is `osr-2023-24`.

### NGO_PROGRAMME_REGISTER.csv
Each record has its implementing organisation, funder, sector, geography class, period, status, `evidence_type` (planned, self_reported, independently_evaluated) and tier. `pooled` is `true` when any amount or beneficiary count is a pooled multi-county or national total. Such a total must never be attributed to Siaya or added to Siaya figures. `outcomes_attributable_to_siaya` counts the outcome statements the source reports for Siaya itself.

### PROJECT_REGISTER.csv
Each project has its status (one of the states in `meta.status_states`) and `verification_type`:
- `independent: completion verified`
- `independent: physical verification`
- `independent: documentary review`
- `county-reported only`
- `plan only`

It also has the status source, last evidence date, evidence counts, location, contract dates, the amounts as printed and the audit finding IDs. **Contractor fields are not exported.** This is an owner decision: they are withheld pending review. The test fails if a contractor column, a withheld name or a contractor note appears in the file.

## CSV format and safeguards
- RFC 4180: CRLF line endings, a header row, and fields quoted with doubled quotes when they contain a comma, a quote or a line break. UTF-8 without a BOM.
- Lists inside a cell are joined with `; `. An empty cell means null or not recorded. It never means zero.
- Formula injection guard: a cell that would start with `=`, `+`, `-`, `@`, tab or carriage return is prefixed with an apostrophe (`'`). Negative numbers therefore appear as `'-12.5`; strip the apostrophe before doing arithmetic.
- Personal data: the test scans every output for honorifics before a name, e-mail addresses and Kenyan phone numbers (see `docs/data-protection-policy.md`). The registers name organisations and documents only.
