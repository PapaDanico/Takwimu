# Kenya Data Protection Act, 2019: self-review of Takwimu Kenya

**Self-review against the Act, not legal advice.** Section numbers were checked on 21 Nov 2026 against the text of the Act (No. 24 of 2019) published by the ODPC (odpc.go.ke); their interpretation still needs an advocate. Updated 21 Nov 2026 from the Site as built on branch claude/eager-rubin-7bpcgq.

## Owner decision (21 Nov 2026): the Site collects no personal data

The "Request a brief" Netlify form (`brief-request`) and its thank-you page were removed, and Netlify form handling was disabled for the site. `/briefs/request/` now describes the brief service with no form, no input fields and no email address; a direct contact route will be published there later.

## What the Site handles now

- No forms, accounts, analytics, tracking, advertising or cookies (checked by grep of app/, components/ and lib/ on 21 Nov 2026; the smoke test fails if any built page has a Netlify form, a POST form, a text, email, tel, password, hidden or file input, or a textarea). The remaining inputs are search boxes, selects and radios used to filter public data on /datasets/, /explore/, /kenya/ and /compare/; they are never sent anywhere.
- "Save this view": kept only in the visitor's own browser `localStorage` (lib/saved-views.js); never sent to us.
- Technical request data (IP address, time, page, browser): processed by the host, Netlify, to serve and protect the Site under Netlify's own privacy policy. We do not receive or use it.
- "Report an inaccuracy" links to public GitHub issues; GitHub's terms apply. The Site sends GitHub nothing.

## What this means under the Act

With no collection by the Site, its own duties under the Act are minimal: the Privacy notice (version 2.0) states plainly that nothing is collected, explains Saved views, names Netlify and GitHub, and mentions the right to complain to the ODPC (s.56). The earlier consent, retention, data-request and cross-border-transfer arrangements for form data no longer apply and were removed from the notice.

Whether Takwimu Kenya / Danico Ventures Ltd still needs to register with the ODPC as a data controller or processor (s.18 and the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021, whose thresholds turn on turnover, staff numbers and purpose of processing) depends on the business's wider activities, such as client records for paid briefs, not on the Site alone. This is not settled here and must be confirmed by a Kenyan advocate.

## Owner actions

1. **Advocate review.** Have a Kenyan advocate confirm this review, the Privacy notice, the Terms and the ODPC registration question before any paid brief is invoiced.
2. **Contact route.** Before publishing a contact route on /briefs/request/, decide how enquiries will be handled; any route that collects personal data (a form, or a published inbox) brings back notice, consent, retention, security and transfer duties, and this review and the Privacy notice must be updated first.
3. **Netlify.** Keep form handling disabled; turn on two-factor sign-in for the Netlify account.

## Not the Act, kept for credibility

| Point | Where |
|---|---|
| Non-partisan service: same offer to every party and independent candidate; paid work never changes a published figure (docs/monetisation-plan.md) | /briefs/request/ and Terms §6 |
| Third-party data licences (World Bank WDI CC BY 4.0; CoB, OAG, KNBS, CRA, IEBC, CBK under their own terms) | Terms §5; advocate to confirm each body's reuse terms |
| No warranty, corrections policy | Terms §3, §13 |

## Update 21 Nov 2026: WhatsApp for brief requests
Brief requests go to Danico Ventures Ltd by WhatsApp (link on /briefs/request/). The site still collects nothing; chat details reach the business through WhatsApp and are covered by privacy notice section 5 (purpose: reply only; no list, sharing or profiling; deleted when the request closes unless records of a paid service must be kept; access, correction and deletion on request). This makes the business a data controller for those chats, so the ODPC registration question for the business stands; confirm with an advocate.
