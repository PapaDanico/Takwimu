# Bug sweep log

Running log. Newest first. Each entry: what was found, how, status.

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
- Print stylesheet and share-card images.
- `lib/data.js` and `lib/sheng.js` hold unverified figures and are only used by the held page; delete or migrate when the claims review is done.
