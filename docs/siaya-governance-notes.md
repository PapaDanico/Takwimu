# Siaya transparency and participation: extraction notes

Data: `data/siaya-governance.json`. Schema: `schemas/siaya-governance.schema.json`. Check: `node scripts/test-governance.js` (not wired into package.json). Extracted 21 Nov 2026 from the library copies of IBP-02, IBP-01 and APRM-01. SHA-256 values match `data/source-library.json`.

## What was extracted

**IBP Kenya CBTS 2021 (IBP-02, all-county summaries, cover dated May 2022; Siaya on PDF pp. 77-78).** Transparency index 45/100. 7 of 10 documents published. Table 1 gives the status by document type and the comprehensiveness scores: implementation report 67, Finance Act 60, Programme-Based Budget 56, Annual Development Plan 55; the CBROP, CFSP and Citizens Budget were not published. Figure 1 charts the share of documents available, CBTS 2017-2021 (44, 20, 29, 27, 70 percent). On participation, the two evaluated documents that were published had no participation information. No Siaya participation score is printed (see caveats). The county's response to the draft results and the recommendation on participation feedback are also recorded.

**IBP Kenya CBTS 2022 (IBP-01, two-page Siaya summary).** Transparency index 48/100 against a national average of 41, ranked 20th. 8 of 10 documents published. Not published: the CBROP and the Q4 implementation report. Comprehensiveness: ADP 42, CFSP 50, PBB 50, Citizens Budget 19, Finance Act 60, implementation report 21. Public participation 0/100, with no participation information in the CFSP, ADP or approved PBB. The edition also reprints earlier rounds (index 23 in 2020 and 45 in 2021, plus the availability grid). These reprints stay inside the 2022 block and are marked as reprinted.

**APRM Siaya County Review Report 2024 (APRM-01, section 3.14 pp. 63-68, Annex 2 pp. 123-124).** The findings cover participation, civic education, feedback and transparency. Each is quoted briefly with its printed and PDF page and attributed to the report. The material includes:
- the county's own progress account: the 2015 Act, the directorate, the complaint register, and 48 civic education sessions;
- ward perception scores out of 10;
- areas of concern: turnout, the civic education gap, no operational civic education programme, weak mechanisms, the perception that public input is not considered, limited feedback mechanisms, access to information, civic space, and newspaper-only announcements;
- the recommendations;
- three planned targets from the County Programme of Action. These are plans, not results.

No individuals are named. Ward names are places.

## Methods

**CBTS (IBP Kenya).** This is an annual desk survey of each county's official website. First it records whether ten key budget documents that the PFM Act requires counties to publish are available. Then it scores the content of the documents it finds against a checklist covering revenue, expenditure and its breakdown, budget performance, non-financial information and public participation. Scores run from 0 to 100 and are graded A (81-100) to E (0-20). Participation is scored only in the ADP, the CFSP and the approved PBB, and it looks for who took part, at what level, what input came in and how it was used. The 2021 round covers FY 2020/21 documents. The 2022 round covers documents due in FY 2021/22. Counties see the draft results and can respond before they are final.

**APRM County Peer Review Mechanism.** This is a county review of the 14 devolved functions. A county research team led it with the NEPAD/APRM Kenya Secretariat. It used a desk review of county documents from 2013 to 2022 and focus groups in all wards on 24-25 July 2023. Self-assessment questionnaires went to County Assembly committee chairs and executive offices. KNBS helped with the analysis, and the results were validated in two sub-counties in April 2024. The ward scores are participants' perceptions out of 10. The "County progress report" subsections are the county's own account. The findings and areas of concern come from the engagements.

## Caveats

- **Survey timing vs publication.** A CBTS round counts what is on the county website when IBP checks. A document posted later is "not published" for that round. In 2021 the county made five more documents public after seeing the draft results (IBP-02 p. 78), so a round's figures partly reflect documents published in response to the survey. Neither edition gives the check dates for Siaya.
- **Editions are separate.** The 2022 index (48) is the latest score in hand; no score is carried forward. Reprinted earlier-round figures are labelled as such.
- **Conflicts, shown side by side and not resolved** (`ibp_cbts.conflicts`):
  - Whether the CBROP was published in CBTS 2020. The 2021 text says yes; the 2021 table and the 2022 edition say no.
  - The 2020 PBB score cell in IBP-01. It overlaps "46" and "Not Published".
  - The 27 percent shown for 2020 in Figure 1 against the two-of-ten documents in the grids.
- **Template artefacts.**
  - IBP-02 prints "40/100 points ... 60/100 points" under "Documentation of public participation" on many county pages; it is not used as a Siaya figure.
  - The Siaya page also contains a stray sentence about Baringo.
  - IBP-01 prints an unexplained "70/100" beside a heading; it is not used.
- **Reading method.** The 2022 availability grid uses coloured icons. Status was read by sampling icon colour against the legend (medium confidence). The result matches the printed count and text. Table cells were matched by position in the PDF text layer.
- **APRM printing errors, recorded as printed.**
  - "FY 2018/2029" for the civic education sessions.
  - The text cites Figure 11, but the chart is captioned Figure 17.
  - A finalisation workshop is dated April 2014.
- **APRM perspective.** The review is a county-led self-assessment. Its findings are attributed to the report and are not verified by Takwimu. The finding on challenges faced by civil society names no office or case.
- **CBTS 2023 and later editions** were not in the library and have not been extracted.
