# Kenya Data Protection Act, 2019: self-review of Takwimu Kenya

**Self-review against the Act, not legal advice.** Section numbers were checked on 21 Nov 2026 against the text of the Act (No. 24 of 2019) published by the ODPC (odpc.go.ke); their interpretation still needs an advocate. Prepared 21 Nov 2026 from the Site as built on branch claude/eager-rubin-7bpcgq. It records where each requirement is met on the Site and what remains for the owner. A Kenyan advocate should confirm it before any paid service starts.

## What personal data the Site handles

- Browsing: technical request data (IP address, time, page, user agent, referrer), processed by Netlify to serve the Site. The code has no analytics, tracking, advertising or cookies (checked by grep on 21 Nov 2026; the `/analytics/` pages are calculations from public budget data, not visitor analytics).
- "Save this view": stored only in the visitor's own browser `localStorage` (lib/saved-views.js); never sent to us.
- "Request a brief" form (`/briefs/request/`, Netlify Forms `brief-request`): request type, name, organisation (optional for data requests), role (optional), email, county or constituency (optional for data requests), free-text need, consent, plus an empty honeypot field. Stored by Netlify; notifications go to the owner's private inbox. No email address is published on the Site (smoke test checks every built page).

## Checklist

| Requirement | Section of the Act | Where it is met on the Site | Status |
|---|---|---|---|
| Identify the data controller and how to contact it | s.29(e) (duty to notify) | Privacy notice §1: Takwimu Kenya, a service of Danico Ventures Ltd | Met |
| Lawful basis for processing | s.30 | Privacy §3: consent for form data; legitimate interest for technical logs | Met |
| Valid, recorded, withdrawable consent | s.32 | Required consent checkbox linking to /privacy/; submission stores consent; Privacy §3 explains withdrawal | Met |
| Inform data subjects before collection (purpose, recipients, transfers, rights, retention) | s.29 | Privacy §2–§8, linked from the form's consent box and the form footnote | Met |
| Purpose limitation | s.25(c) | Privacy §3: used only to reply; no mailing list, marketing, sharing or profiling | Met |
| Data minimisation | s.25(d) | Form asks only for reply details; role optional; organisation and place optional for data requests; no ID, phone or political affiliation fields | Met |
| Accuracy | s.25(f) | Correction right offered via data request option | Met |
| Storage limitation / retention | s.25(g), s.39 | Privacy §4: 24 months, then deletion from Netlify and inbox | Met on paper; owner must apply it (see actions) |
| Security of personal data | s.41–42 | HTTPS, static site, access limited to the team's accounts; Privacy §10 | Partly met: owner to confirm 2FA on Netlify and email accounts |
| Breach notification | s.43 | Privacy §10 commits to notify the ODPC and, where required, the data subject | Met on paper; owner needs a breach procedure |
| Data subject rights: informed, access, object, correction, deletion | s.26, s.40 | Privacy §8; form option "A data request" | Met |
| Data portability | s.38 | Privacy §8 offers a copy in a usable format | Met |
| No automated decision-making / profiling | s.35 | Privacy "In short" and §3: none | Met |
| Use of a processor on our behalf | s.25, s.41 (safeguards apply to processors) | Privacy §5 names Netlify as processor; relies on Netlify's standard terms | Partly met: owner to accept Netlify's Data Processing Addendum |
| Cross-border transfer | s.25(h), s.48–50 | Privacy §5: transfer to the US stated; safeguards stated honestly (consent plus provider's standard terms; no adequacy decision; no negotiated terms) | Partly met: see actions |
| Sensitive personal data (incl. political opinion) | s.44–47 | Not requested; form asks visitors not to include details about other people. Note: a request from a party office may reveal affiliation; it is used only to reply | Met; keep under review |
| Children's data | s.33 | Privacy §9: form meant for adults; no knowing collection from children | Met |
| Right to complain to the regulator | s.56 | Privacy §8: ODPC, odpc.go.ke | Met |
| No sale of personal data | s.37 (commercial use) | Privacy "In short" and §5 | Met |
| Cookies / tracking statement consistent with the code | s.29 | Privacy §6 matches the code (no cookies, no analytics; localStorage only for Saved views) | Met |
| Registration as data controller/processor | s.18–19; Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021 | Not on the Site | Open: owner action |
| Non-partisan service, paid work does not change figures | Not the Act (credibility safeguard; docs/monetisation-plan.md) | /briefs/request/ and Terms §6 | Met |
| Third-party data licences | Not the Act (copyright) | Terms §5: World Bank WDI CC BY 4.0; CoB, OAG, KNBS, CRA, IEBC, CBK public documents under their own terms | Met; advocate to confirm each body's reuse terms |
| No warranty, corrections policy | Not the Act (consumer and contract law) | Terms §3 (no warranty), §13 (corrections policy) | Met |

## Owner actions

1. **ODPC registration.** Check whether Takwimu Kenya / Danico Ventures Ltd must register as a data controller (and, if relevant, processor) under the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021. The thresholds depend on turnover, staff numbers and the purpose of processing; register before charging for briefs if required. Register at odpc.go.ke.
2. **Lawyer sign-off before charging.** Have a Kenyan advocate review the Privacy notice, the Terms, this checklist and the client terms for paid briefs before any invoice is sent.
3. **Netlify setup.** Enable form detection for the site (deploys are CLI uploads; Netlify detects the `brief-request` form from the uploaded HTML at deploy time), set the form notification to the private inbox (never published on the Site), and accept Netlify's Data Processing Addendum. Turn on two-factor sign-in for Netlify and the inbox.
4. **Retention.** Put a recurring reminder to delete submissions (Netlify and inbox) older than 24 months.
5. **Breach procedure.** Write a short internal note: who checks, how to notify the ODPC within 72 hours, and how to tell affected people.
6. **Data requests.** Answer data requests within the time the Act and the Data Protection (General) Regulations, 2021 set; keep a simple log of each request and reply.
