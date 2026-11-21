# Editorial review: standard operating procedure

This is how a reviewer checks values in the repository and records a decision. It needs no account, no login and no personal data. Reviewers are identified by **role only** (for example "fiscal reviewer"), never by name, in line with `docs/data-protection-policy.md`.

## What review means here

Every value Takwimu transcribed, read by OCR or calculated starts in the state `REVIEW_PENDING`. It is public, labelled **"Provisional: awaiting editorial review"**. The full chain (handover section 5) is:

`DISCOVERED -> ACCESS_CHECKED -> ACQUIRED -> PARSED -> EXTRACTED -> RECONCILED -> REVIEW_PENDING -> APPROVED -> PUBLISHED`

with the side states `INACCESSIBLE`, `LICENCE_RESTRICTED`, `DISPUTED`, `SUPERSEDED`, `RETRACTED` and `REJECTED`. The build checks (schemas, sums, reconciliation tests) take a value as far as `RECONCILED`. Nothing moves past `REVIEW_PENDING` without a record in `data/reviews.json`. There is no direct step from extracted to approved.

The state of each value is worked out by `lib/review-status.js`; nobody types it into the data files. A value shows **"Approved"** only when an `approved` record names it **and** the `source_sha256` in that record equals the hash of the source document as the repository holds it now. If the document is replaced, an approved value returns to the queue on its own. A rejection holds whatever the hash: a changed or missing source never brings a withdrawn value back. A calculation, or a value derived from others (recurrent budget, absorption rates), is approved only when every input is approved, and is withheld when any input is rejected.

| Decision | What the site does |
|---|---|
| `approved` | Shows the value with an "Approved" tag. |
| `rejected` | Hides the value and shows "Withdrawn after editorial review" with the rationale. |
| `disputed` | Keeps the value, tags it "Disputed" and links the conflict register (`/data/#conflicts`). Name the case in `conflict_id`. |
| `superseded` | Keeps the value for reference, tagged "Superseded". |

## Independence rule

The reviewer must not be the person who extracted or calculated the values being reviewed. Each record carries `"reviewer_is_not_extractor": true`; do not add a record if that is not true. If only the extractor is available, leave the value pending.

## Roles

Use one role from `meta.reviewer_roles` in `data/reviews.json`: fiscal reviewer, audit reviewer, health reviewer, statistics reviewer, education reviewer, agriculture reviewer, climate reviewer, governance reviewer, projects reviewer, geography reviewer, legal reviewer, editor. Material health, legal and fiscal claims need the specialist role (handover section 5, step 8). Findings about named people also need legal review and a primary document (project rule).

Never write a name, initials, e-mail address, phone number or signature anywhere in the record, including the rationale. `scripts/test-reviews.js` fails the build if it finds an honorific followed by a name, "... by <Name>", a contact detail, or a pair of capitalised words that look like a personal name.

## Procedure

1. **Pick work from the queue.** Open `docs/editorial/REVIEW_QUEUE.md`. Work from the top: priority 1 is fiscal discrepancies, then audit findings, then health indicators. For a full list of one dataset run `node scripts/review-queue.js --dataset <dataset>`.
2. **Find the value.** Look the record id up in its data file (`data/<dataset>.json`). Note its `source_id` (or `doc_id`), table and page.
3. **Open the source at the page.** Find the document in `data/source-library.json` or `data/source-manifest.json`. Open the stored copy, check its SHA-256 (`sha256sum <file>`) equals the hash recorded there, and go to the PDF page given (the printed page may differ; the data file says how).
4. **Check.** Compare the value, unit, period, geography and the row or column heading with the page. For OCR values compare digit by digit. For calculations, check each input against its own source and redo the arithmetic.
5. **Add a record** to `decisions` in `data/reviews.json`. One record may cover several values from the same source document.
6. **Run the tests**: `node scripts/test-reviews.js`, then `node scripts/review-queue.js` to refresh the queue, then the full build (`npm run build`). Fix anything they report.
7. **Commit** only the files you changed (`git add data/reviews.json docs/editorial/REVIEW_QUEUE.md`), with a message that says what was reviewed, for example `Review: 12 ledger values, FY 2023/24 (fiscal reviewer)`.

To change a decision, never edit or delete the old record: add a new record whose `supersedes` lists the old id.

## Record fields

| Field | Meaning |
|---|---|
| `id` | `REV-<year>-<number>`, e.g. `REV-2026-001`; never reused. |
| `dataset` | Data file stem: `siaya-fiscal-ledger`, `siaya-audits`, `siaya-health`, `siaya-projects`, `counties-cob`, `history`, `siaya-analysis`, `siaya-economy`, `siaya-governance`, `siaya-education`, `siaya-agriculture`, `siaya-climate`, `siaya-programmes`, `imf`. |
| `record_ids` | The observation ids as listed in the queue. |
| `source_document_id` | The document checked; it must be a source of every listed value. |
| `source_sha256` | The SHA-256 of the document version checked. `null` is allowed only for a rejection, dispute or supersession of a value whose source has no stored copy; an approval always needs the hash. |
| `pages_checked` | Optional: PDF pages opened. |
| `reviewer_role` | A role from the vocabulary. |
| `reviewer_is_not_extractor` | Always `true` (see the independence rule). |
| `decision` | `approved`, `rejected`, `disputed` or `superseded`. |
| `rationale` | Plain words: what was compared and what was found. Shown publicly for rejected values. |
| `conflict_id` | For `disputed`: the case id in `data/conflicts.json` or the ledger's discrepancy list. |
| `date` | `YYYY-MM-DD`. |
| `supersedes` | Ids of earlier records this one replaces (empty list if none). |

## Example (not real: do not copy into the data file)

> **EXAMPLE ONLY.** No review has taken place. This record is illustrative; the id, hash and rationale are placeholders and `data/reviews.json` must not contain it.

```json
{
  "id": "REV-2026-001",
  "dataset": "siaya-fiscal-ledger",
  "record_ids": ["L025"],
  "source_document_id": "cob-report-2023-24",
  "source_sha256": "<64 hex characters: the hash of the copy you opened>",
  "pages_checked": [510],
  "reviewer_role": "fiscal reviewer",
  "reviewer_is_not_extractor": true,
  "decision": "approved",
  "rationale": "Approved budget total on PDF page 510 matches the stored value and unit (KSh billion) for FY 2023/24.",
  "date": "2026-12-01",
  "supersedes": []
}
```

## Stop conditions (handover section 17)

Stop, record nothing as approved, and escalate to the editor when:

- (a) source ownership or deployment is uncertain;
- (b) a material statistic lacks a verifiable source anchor (the queue marks these "unanchored": no stored document hash, so they cannot be approved);
- (c) financial series use incompatible accounting bases;
- (d) health data create disclosure risk;
- (e) licences prohibit redistribution;
- (f) project completion cannot be substantiated;
- (g) an automated extraction has low table confidence or ambiguous units;
- (h) an external site blocks access;
- (i) a proposed monetisation feature undermines public access to basic evidence.

In cases (c) and (g) a `disputed` or `rejected` record with the reason is usually right; in the others leave the value pending and note the escalation in the commit message.
