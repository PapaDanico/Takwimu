# Takwimu Kenya brand assets

Source: Takwimu Kenya Brand Suite v1.0 (21 Nov 2026) and the approved raster concept (`reference-*.png`).
Tagline, exactly: **Turning Data into Progress.**

## Status
| Asset | File | Status |
|---|---|---|
| Icon mark (Kenya silhouette, ascending bars, black-red-green ribbon, orange arc) | `takwimu-mark.svg` | Genuine vector, built by `scripts/make-brand-mark.js` from the geoBoundaries ADM0 outline. Provisional: needs brand-owner visual sign-off against the concept |
| Small icon for favicons (silhouette, bars, arc; no ribbon) | `takwimu-mark-small.svg`, `public/favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png` | Provisional; simplified per the suite's small-size rule |
| One-colour mark | `takwimu-mark-mono.svg` | Provisional |
| Wordmark (TAKWIMU / KENYA with red rules, orange I) | HTML and CSS in `SiteHeader` and `SiteFooter` | Interim typed treatment. The custom glyphs (triangular orange A counter, angular K and W) still need hand-built vector paths and sign-off |
| Open Graph 1200 x 630 | `public/og.png` | Cropped from the supplied social landscape mockup |
| Danico Ventures Ltd logo (new, 21 Nov 2026) | `danico-ventures-master.png`, `public/brand/danico-ventures*.webp` | The supplied PDF holds a 2048 px raster image, not vector paths, so this is a raster asset with its dark background. A vector master is still needed for print |
| Reference artwork | `reference-*.png` | Raster references only, not masters |

## Rules carried into the site
- Tokens in `app/globals.css` (`--brand-forest`, `--brand-green`, `--brand-red`, `--brand-charcoal`, `--brand-orange`) are the suite's proposed values, not measured samples. Chart palette `--s1..--s6` is unchanged.
- Alt text is "Takwimu Kenya". The flag-inspired ribbon and Kenya outline must not imply government endorsement; the footer states independence.
- Fonts: the site keeps self-hosted Plus Jakarta Sans until Manrope is tested for fit.

## Changelog
- 2026-11-21: v1 integration (mark, favicons, OG, header and footer lockups, tagline, manifest colours).
