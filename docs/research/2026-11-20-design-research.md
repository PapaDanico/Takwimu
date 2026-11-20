# Design research and decisions (20 Nov 2026)

## Owner direction
Premium, consulting-grade, international standard; benchmark against USAFacts and similar platforms. The owner asked for a design "identical to USAFacts". Decision: adopt USAFacts' documented patterns, not its look. I have only read its text pages, not seen its visual design, and a copy could mislead readers about who runs Takwimu. Takwimu keeps its own identity (navy ink, gold accent, serif headlines).

## What the research says
- **USAFacts** (state-of-the-union page read): question-led section links, a units line under each chart title (for example "Adjusted for inflation"), "Source: agency" under every chart, an "Updated" date, and plain notes on missing data. No corrections policy or methodology link appeared in the text I read.
- **Consulting chart conventions** (third-party guides, not official firm standards): the title states the conclusion; every exhibit has a source line; footnotes carry definitions, exclusions and time periods; log owner, date range, units and transformations per chart.
- **Urban Institute data visualization style guide**: defines each chart part and pairs style rules with accessibility guidance; its specific rules were not read.
- **IBP "The Power of Making It Simple" (2012)**: publishing documents is not enough, accessibility matters. Kenya county citizens-budget practice not found.
- **Kenya connectivity** (Communications Authority data via press): about 48.7M smartphones of 78.3M mobile phones in Dec 2025, 24.6M feature phones; 98.2% of internet users go online by smartphone in Q1 2026 (press report). Data prices and low-end device share not found. Keep pages light.
- **Chart colour validation** (dataviz skill validator): the original navy and gold pairing failed lightness and chroma checks as chart colours. A single blue passes: #2B5FAE on light, #5B93E0 on dark. Gold is now an accent only, never a data colour.

## Changes made
- Chart is a horizontal bar chart: 24px bars, 4px rounded data end, single hue, direct value labels, hairline grid.
- The unverified figure uses a hatched texture of the same hue instead of a second colour, so meaning does not depend on colour.
- Units line, "Source:" line, retrieval date and a note under the exhibit, as in the USAFacts and consulting conventions.
- Question-style section headings, a three-step "how to read this chart", and a "View as table" fallback.
- Native hover tooltips, keyboard focus on bars, skip link, reduced layout shift.

## Checks run (automated, built site)
No horizontal overflow, no SVG text outside the viewBox or overlapping, no console errors at 1280px and 360px in light and dark. Screenshots could not be opened in this session, so no visual review by eye.

## Not yet done
- Direct read of USAFacts and Our World in Data chart visuals.
- Time-series (trend) charts: no verified series yet.
- Accessibility tooling run (axe or similar).
