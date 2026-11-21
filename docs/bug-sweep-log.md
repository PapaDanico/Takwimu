# Bug sweep log

Running log. Newest first. Each entry: what was found, how, status.

## 20 Nov 2026, sweep 11 (ten-year history and new pages)
| Finding | How found | Status |
|---|---|---|
| FY 2016/17 report says recurrent spending was KSh 3.9bn in one sentence and 3.65bn in its table; its text also says spending rose 0.4 per cent when 4.93 to 5.63 is 14 per cent | Read the Siaya section, arithmetic | Table value used (adds to the total); both noted on Corrections |
| FY 2015/16 own-source revenue: 127.93 (FY 2016/17 report) against 113.26 (FY 2018/19 chart). FY 2014/15: 143.33 against 142.88 | Compared reports | Both shown as alternates |
| FY 2021/22 report prints 434.38 for both FY 2021/22 and FY 2020/21 | Arithmetic: the stated 30.5 per cent rise only works against 332.88 | Typo noted on the year |
| Pending bills at 30 June 2021: 1,061m (FY 2020/21 report) against 602m (FY 2021/22 report) | Compared reports | Both shown |
| FY 2022/23 approved budget: 8.60bn (its own report) against 8.50bn (quoted in the FY 2023/24 report) | Compared reports | Noted on the year |
| FY 2015/16 report is a scan with no text layer | pdftotext returned nothing | Read pages 273 to 281 with RapidOCR; confidence 3 |
| Validator extended: budget and spending parts add up, absorption recomputed, ten-year revenue series, audit opinions have links, sub-county 2009 population adds to the county census | Added | Passing |
| Accessibility: 0 violations on all nine pages in light and dark. No overflow at 360 or 1280 px. Internal links and anchors resolve | axe-core, Playwright | Passing |
| Open: FY 2019/20 county report (host returned 403), FY 2013/14 report, audit opinions before FY 2020/21 (Auditor-General site under maintenance), FY 2025/26 report, KNBS pages unreachable | Download attempts | Listed in Method and Data pages |

## 20 Nov 2026, sweep 10 (redesign)
| Finding | How found | Status |
|---|---|---|
| New layout made the page 66 px wider than a 360 px phone because grid children took their content's minimum width | Layout check at 360 px, then an element-by-element overflow probe | Fixed: single `minmax(0, 1fr)` column and `min-width: 0` on children |
| Gold wordmark, eyebrow and success tag failed contrast (axe: serious) because translucent header and tinted pills sit on darker backgrounds than the tokens were measured against | axe-core | Fixed: dedicated darker ink tokens for gold and mint text, and darker text on the gold chart bars (4.96 to 1) |
| `aria-label` on the brand link did not match its visible text | axe-core | Fixed |
| Sticky header covered section headings when following nav links (flagged by a review bot, confirmed) | Playwright anchor jump check at 360 and 1280 px | Fixed with `scroll-padding-top: 84px`; all six sections land 15 px below the header |
| Last check: 0 violations in light and dark, no overflow at 360 and 1280 px, logical keyboard order | Full suite | Passing |
| Data from the FY 2025/26 Controller of Budget annual report is not on the site. Press coverage reports Siaya at 26.94 per cent of its own-revenue target for FY 2025/26 | Web search | Open: the report host blocks automated downloads, so the figure could not be read from the document |

## 20 Nov 2026, sweep 9
| Finding | How found | Status |
|---|---|---|
| Recurrent budget was entered as KSh 6.02 billion from one OCR engine. A second engine (RapidOCR on 200 dpi page renders) reads 6.07, and 4.87 + 6.07 = 10.94, the approved total | Independent re-read of pages 474, 476, 478 and 483 of the Controller of Budget FY 2024/25 PDF | Fixed: 6.07 used. The validator now requires category budgets to sum to the approved total. All other key figures (10.94, 4.87, 436.68, 427.95, 47 per cent, 290, 199, 236, 7.75, 2.76, 4.99, 57 and 83 per cent, 1.12, 577.7, 24.28, 3.07) were confirmed by both engines |
| The report states 83 per cent recurrent absorption, but 4.99 of 6.07 is 82.2 per cent | Arithmetic | Noted on the page: the shares are the report's own statements and may use a revised budget |
| Vercel project "takwimu" linked to this repo kept failing ("Account is blocked") | Vercel connector | Preview deployments switched off for that project |
| No live site | Netlify connector | Netlify site "takwimu" created and deployed: https://takwimu.netlify.app (checked: pages, headers, data files, unverified files return 404) |
| GitHub Actions job gets no runner (runner id 0, no steps, 3 second failure), also on the very first commit | GitHub API job record | Cause is account level (billing or Actions settings); cannot be changed from the repo or this environment |

## 20 Nov 2026, sweep 8
| Finding | How found | Status |
|---|---|---|
| FY 2023/24 conflict: 610.74 million appears in the FY 2023/24 report and, per search summaries, in the county's plan and a Dawan Africa article, with the target of 760 million giving 80.4 per cent. 427.95 million appears only in the FY 2024/25 report (and a Nation article repeating it) | Web search plus reading both reports | Recorded in `data/siaya.json` as corroboration; 610.74 stays the plotted value, 427.95 shown as the alternate. Neither corroborating source was read directly |
| County plan PDF link on siayaassembly.go.ke returns a not-found page | curl | Open |
| The national county tables in both reports are not searchable for Siaya (names garbled in OCR) | grep | Open: needs a manual read |

## 20 Nov 2026, sweep 7
| Finding | How found | Status |
|---|---|---|
| The published trend takeaway ("nearly flat, KSh 428 to 508 million") was wrong. The FY 2023/24 Controller of Budget report gives KSh 610.74 million for FY 2023/24, while the FY 2024/25 report quotes KSh 427.95 million for the same year | Downloaded and read the FY 2023/24 report, Siaya section | Fixed: the chart now shows both values for FY 2023/24 (solid and hollow markers), the tag reads "Reports disagree", and the takeaway describes the conflict instead of a trend |
| FY 2024/25 exhibit note said revenue was "up 2 per cent" without the conflict | Same | Fixed: note now says the report calls it up 2 per cent on 427.95, but the previous report gave 610.74 |
| In the reports' own breakdowns, health facility financing fell from KSh 388.53 million (FY 2023/24 report) to KSh 199 million (FY 2024/25 report); ordinary own-source revenue rose from KSh 222.10 million to KSh 236 million | Same | Added to the takeaway as reported facts |
| Escaped apostrophes rendered as backslashes in JSX text | Source review after a scripted edit | Fixed |
| FY 2023/24 parts add to 610.63 million against a stated 610.74 million | Arithmetic | Noted on the page; the report does not explain it |

## 20 Nov 2026, sweep 6
| Finding | How found | Status |
|---|---|---|
| A four-year revenue line could imply a real fall from FY 2022/23 to FY 2023/24, but FY 2022/23 is a total that includes appropriations-in-aid (KSh 402.23M own-source plus KSh 105.81M) | Read the FY 2022/23 Controller of Budget report, Siaya section | Handled: the exhibit carries a "Definitions differ" tag, a caveat, and a takeaway that says part of the fall may be a change in what is counted |
| Validator now also checks trend points: years increase, components sum to the total, last point equals the headline figure, a comparability caveat is present | Added | Done |
| FY 2021/22 value (KSh 434.38M) read from OCR as the prior-year comparator | Read | Confidence 3 of 5; check the printed page |

## 20 Nov 2026, sweep 5
| Finding | How found | Status |
|---|---|---|
| Open question on 47 per cent versus 42 per cent | Read the revenue sentence in section 3.38: the county generated KSh 436.68 million including FIF, up 2 per cent on KSh 427.95 million in FY 2023/24, and 47 per cent of the annual target | Resolved: 47 per cent is of the annual target, which implies about KSh 929 million. The KSh 1,043 million is the own-source figure in budget financing. The report does not explain why they differ |
| Previous page note said the solid figure was KSh 436 million (rounded) | Same reading | Fixed: exact 436.68, confidence 5 (OCR text matches press) |
| County's KSh 946 million is close to the implied target (about KSh 929 million) | Arithmetic | Noted on the page as a possible explanation, not established |
| Report also says OSR included KSh 290 million of arrears | Same reading | Open: how this splits the total is unclear |

## 20 Nov 2026, sweep 4
| Finding | How found | Status |
|---|---|---|
| axe could not compute contrast for chart text over the hatch pattern | Computed WCAG contrast by hand for every text and background pair used: white on chart blue 6.27, dark ink on dark-theme blue 6.11, muted text 5.96 to 8.03, tags 4.95 to 7.34. All at least 4.5:1 | Closed (manual measurement) |
| New spending exhibit could hide a data entry error | Validator now checks that each share spent matches spent/budget and that category spending sums to the total | Added |
| Spending figures come from OCR text of the Controller of Budget PDF | Read the section and cross-checked totals | Open: confidence 4/5; confirm against the printed table |

## 20 Nov 2026, sweep 3
| Finding | How found | Status |
|---|---|---|
| The site described a Nation-reported figure of about KSh 1.04 billion as a third "total" for Siaya's own revenue. The Controller of Budget report shows KSh 1.04 billion is the **budgeted target**, not collections. Published error. | Downloaded and read the Controller of Budget FY 2024/25 report, section 3.38 | Fixed: the figure is now shown as the target, from the primary document. |
| Headline revenue figure was labelled press-attributed | Same reading | Fixed: KSh 436 million now sourced to the Controller of Budget report itself (KSh 199 million health facility financing plus KSh 236 million other), confidence 4/5 because it was read from OCR text |
| Controller of Budget states 47 per cent performance for Siaya, but 436 of 1,043 is 42 per cent | Arithmetic check | Open: shown on the page as unresolved |

## 20 Nov 2026, sweep 2
| Finding | How found | Status |
|---|---|---|
| Build published 13 JSON files of unverified national figures at `/data/*.json` (soko, counties, eac, imf, macro and others) even though no page showed them. Contradicts the rule that untraceable figures stay hidden. | Listed `public/data` after build | Fixed: `scripts/build-data.js` now publishes only `sources.json` and `siaya.json`, and deletes stale files first |
| Hero headline said "two reported numbers" while a third press report existed | Re-read after adding the Nation figure | Fixed |
| Headline revenue bar was labelled "primary report" but its source is a press article attributed to the Controller of Budget | Re-checked the source chain | Fixed: relabelled "as reported by press", confidence 3/5, status `press-attributed` |
| Chart bars had no clear keyboard focus style | Keyboard walk-through (Tab order) | Fixed: 2px gold focus outline; walk-through shows a logical order and a visible ring on every stop |
| Nav lacked a link to the new audit section | Review | Fixed |
| No Node version constraint | Review | Fixed: `engines` set to Node 18.17 or later (Next 14 requirement) |
| Source links return 403 to this sandbox for Eastleigh Voice, Nation and GitHub; K24 and the Parliament library return 200 | curl from sandbox | Open: probably bot blocking, not confirmed. Re-check from a normal browser |
| CI job fails in seconds with no logs; same steps pass locally | GitHub Actions API | Open: needs the run page or Actions settings (account level) |
| Vercel and Cloudflare Workers statuses fail on every commit | PR status | Open: integrations must be disconnected by the repo owner |
| axe "needs review" on SVG axis labels (background cannot be computed through the hatch pattern) | axe-core scan | Open: contrast not measured separately |

## 20 Nov 2026, sweep 1
| Finding | Status |
|---|---|
| Source files in repo root while config expected `app/`, `lib/`, `scripts/` (build broken) | Fixed |
| `assetPrefix: '.'` and absolute manifest icon paths would break nested routes | Fixed |
| Stale Cloudflare, Vercel and npm-publish config; no Netlify config | Fixed |
| Next 14.2.0 behind on security patches | Fixed (14.2.35) |
| Truth Gap page names people and labels claims "disputed" with no primary-document check | Held out of the build (`app/_held/`) |
| Two groups with `aria-label` and no role (axe) | Fixed |

## Still to sweep
- Manual screen-reader pass.
- Real-device check on a low-end Android phone and a throttled connection.
- Share-card images per page (one default card exists). Print stylesheet done: navigation hidden, links spelled out, cards kept whole; checked by rendering Insights, Analytics and Sub-counties to PDF.
- `lib/data.js` and `lib/sheng.js` hold unverified figures and are only used by the held page; delete or migrate when the claims review is done.
