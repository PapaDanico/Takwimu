# Editorial operations: reviews, corrections and source changes

The review procedure itself (states, roles, the independence rule, record fields) is in [docs/editorial/review-sop.md](../editorial/review-sop.md); the work list is [docs/editorial/REVIEW_QUEUE.md](../editorial/REVIEW_QUEUE.md). This page covers what happens around it: corrections from readers, conflicting sources, and documents that change at the publisher.

Rules that apply throughout: every figure keeps its source, publication date, period, unit and confidence; conflicting sources are shown side by side, never averaged; gaps are listed, never filled; no verdict labels on named individuals without a primary document and legal review; no personal data (`docs/data-protection-policy.md`).

## 1. Corrections from readers (WhatsApp)

Readers report errors through the WhatsApp link on `/data/` and the error page (wa.me/message/GPPIKMENXJVWO1). There is no form, by design.

1. **Log without personal data.** Record the report in the commit or issue as: date, page URL, figure, the document the reader cites. Never copy the reader's name, number or chat text into the repository. Reply in the chat only; delete the chat when the case closes (data-protection policy, "the one remaining personal-data touchpoint").
2. **Acknowledge** in the chat within 2 working days: say it will be checked, with no promise about the outcome.
3. **Triage** within 5 working days:
   - transcription or OCR slip (our value differs from our own cited page): go to step 4;
   - the reader cites a different document with a different value: go to section 2 (conflict);
   - interpretation or opinion, not a value: reply with the method note; no change.
4. **Fix a slip.** Correct the value in `data/<dataset>.json` against the page, run `npm run build`, and add a review record in `data/reviews.json` (`rejected` for the old value if it was public, then the corrected value enters the queue as `REVIEW_PENDING`). A different reviewer from the person who made the fix approves it. The commit message names the dataset, record id and page, e.g. `Correction: siaya-health H012, KDHS 2022 p.48`.
5. **Close.** Reply in the chat with the outcome and the date it goes live (next release; see `docs/ops/release-checklist.md`). Material fiscal, health or legal corrections are listed in the release notes in `docs/production-provenance.md`.

## 2. Conflicting sources (the conflict register)

1. Add a case to `data/conflicts.json` with both values, each with its document, page, unit and period, plus `definitions` and a `hypothesis` labelled as a hypothesis. Do not pick a winner without evidence.
2. Add the matching test case to `scripts/test-reconciliation.js` (one test per conflict case is a build gate).
3. Values involved are tagged `disputed` in `data/reviews.json` with the `conflict_id`; the site links them to `/data/#conflicts`.
4. Resolve only when a reviewer has read both original pages: record the finding, set the case status, and supersede (never delete) the earlier review records.

## 3. A source document changed at the publisher

`scripts/ops/check-sources.js` reports a **changed** document when its SHA-256 differs from the one recorded (`docs/ops/source-health.md`, "Changed documents"). The script never edits data; an editor does:

1. Download the new version into a new empty directory, check it is a valid file of the stated type, and keep the old hash: versions are never overwritten.
2. Add the new version as a new record (or new hash fields) in `data/source-library.json` / `data/source-manifest.json`, with the retrieval date and a note of what changed (amendment, re-issue, corrected table).
3. Values read from the old version keep their old `source_sha256`, so `lib/review-status.js` returns them to the review queue automatically. Re-read the affected pages; where the value changed, treat it as a correction (section 1, step 4) and, if both versions stay relevant, as a conflict (section 2).
4. **Moved** URLs: update the address in the data file after confirming the new page holds the same document (same hash). **Broken** URLs: if the record was `downloaded`, keep the hash and note the failure in `retrieval_note`; look for the document in the Parliament library or another official mirror. **Blocked**: check by hand in a browser; never get round a bot check.

## 4. Cadence

| When | What |
|---|---|
| Weekly | Read new WhatsApp reports; triage. |
| Monthly | Work the review queue from the top; run `check-sources.js` and act on changed, moved and broken. |
| Each release | Corrections and resolved conflicts listed in `docs/production-provenance.md`. |
| Quarterly | Run `freshness.js`; open research tasks for overdue datasets. |

See `docs/ops/monitoring.md` for the full schedule.
