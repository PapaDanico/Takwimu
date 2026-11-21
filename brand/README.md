# Takwimu Kenya brand assets

Source: Takwimu Kenya Brand Suite v1.0 (21 Nov 2026) and the approved raster concept (`reference-*.png`).
Tagline, exactly: **Turning Data into Progress.**

## Status

Owner direction (21 Nov 2026): use the supplied artwork as given, cropped or resized, not rebuilt. The site uses the owner's horizontal and full logos, crops of the approved concept, and the Danico logo. The SVG files from `scripts/make-brand-mark.js` are drafts and are not used on the site.

| Asset | File | Status |
|---|---|---|
| Site icon and favicons | `takwimu-emblem-crop.png`, `public/logo.png`, `public/favicon-*.png`, `icon-*.png` | Cropped from the approved concept emblem; in use |
| Draft vector mark (Kenya silhouette, ascending bars, black-red-green ribbon, orange arc) | `takwimu-mark.svg` | Genuine vector, built by `scripts/make-brand-mark.js` from the geoBoundaries ADM0 outline. Provisional: needs brand-owner visual sign-off against the concept |
| Small icon for favicons (silhouette, bars, arc; no ribbon) | `takwimu-mark-small.svg`, `public/favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png` | Provisional; simplified per the suite's small-size rule |
| One-colour mark | `takwimu-mark-mono.svg` | Provisional |
| Horizontal lockup (symbol, TAKWIMU, KENYA; no tagline) | master `takwimu-logo-horizontal.png` (1800 x 535); web `public/brand/takwimu-horizontal-96.png` and `-192.png` | In use: site header from 768 px, shown 162 x 48 px. In the dark theme it sits on a light rounded panel (#FDFBF5); the artwork is not recoloured |
| Full stacked logo with the tagline | master `takwimu-logo-full-v2.png` (1054 x 997); web `public/brand/takwimu-logo.png` (720 x 681) | In use: footer (200 px wide on a light rounded panel, because the dark green does not read on the dark footer) and the PDF brief header (21 mm) |
| Narrow-screen header (below 768 px) | `public/logo.png` symbol plus the name "Takwimu Kenya" as text | In use. At 360 px the lockup's KENYA line would be about 5 px tall, so the symbol and name replace it. Dark theme: symbol on a light rounded tile |
| CSS "wordmark" (typed TAKWIMU / KENYA) | removed 21 Nov 2026 | Replaced by the owner's artwork above |
| Open Graph 1200 x 630 | `public/og.png` | Cropped from the supplied social landscape mockup |
| Danico Ventures Ltd logo (new, 21 Nov 2026) | `danico-ventures-full.png`; footer uses the DV emblem crop `danico-ventures-emblem.png` as `public/brand/danico-ventures*.webp` | Cropped from the supplied artwork; in use |
| Reference artwork | `reference-*.png` | Raster references only, not masters |

## Rules carried into the site
- Tokens in `app/globals.css` (`--brand-forest`, `--brand-green`, `--brand-red`, `--brand-charcoal`, `--brand-orange`) are the suite's proposed values, not measured samples. They feed semantic tokens: `--accent` (links, eyebrows, current nav item, buttons, focus ring, headings on the brief), `--accent-line` (header rule, section accent bars), `--on-accent`, `--accent-soft`, `--brand-panel` (light panel behind artwork in the dark theme). Dark theme uses #7DDB9C / #4CB872 for accents so text stays AA. Footer is `--brand-charcoal` with a `--brand-green` top rule; footer hovers and the takeaway bar use `--brand-orange`. Warning tags and chart colours keep their own palettes; `--s1..--s6` is unchanged.
- Alt text is "Takwimu Kenya". In the header only one of the lockup and the symbol-plus-name is displayed at a time, so the link's accessible name is "Takwimu Kenya" once (the lockup's alt, or the visible name); a separate sr-only copy would make screen readers say it twice. The footer keeps the tagline "Turning Data into Progress." as sr-only text, since the logo artwork shows it.
- Transparency check (21 Nov 2026) of `takwimu-logo-horizontal.png` against the source image: it is a 1:1 crop at (124, 56). Compared with a flood fill from the image edges, it differs only in 2,215 anti-aliased near-white edge pixels (min channel 227 to 235, all but 36 touching the background) and 298 px of enclosed letter counters, which should be transparent. No holes in white parts of the artwork, so it was not regenerated. The flag-inspired ribbon and Kenya outline must not imply government endorsement; the footer states independence.
- Brown theme (owner, 21 Nov 2026): the footer's `--brand-charcoal` (#17191C) is the page background for every visitor; the light and dark preferences now get the same theme. Cards are slightly lighter warm panels (#24221F, hover #2E2B27, rules #3E3A34), text is cream (#F4EFE3, muted #B5AD9C, at least 5.7:1 on cards), accents are #7DDB9C / #4CB872 green and the orange #F7931E (at least 6.3:1). Both logos sit on their light rounded panel (#FDFBF5) in the header and footer. Chart series use the validated dark set (each at least 4:1 on cards; the light --s6 measured 2.75:1, below the 3:1 for marks). Print and the PDF brief keep the light tokens: dark text on white.
- Fonts: the site keeps self-hosted Plus Jakarta Sans until Manrope is tested for fit.

## Changelog
- 2026-11-21: v1 integration (mark, favicons, OG, header and footer lockups, tagline, manifest colours).
- 2026-11-21: v3: brown theme (brand charcoal page background, warm panels, logos on light panels).
- 2026-11-21: v2: owner's horizontal lockup in the header, full logo in the footer and on the PDF brief, brand tokens applied across the design system, CSS wordmark removed. `public/og.png` left as is: it is already a crop of the supplied social artwork, and neither logo crops to 1200 x 630 without padding.
