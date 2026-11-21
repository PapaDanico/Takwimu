export const SITE_URL = 'https://takwimu.netlify.app';
export const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';
export const CIDP_URL = 'https://maarifa.cog.go.ke/sites/default/files/2024-06/SIAYA%20CIDP-2023-2027.pdf';

// Every public page, in navigation order. Used by the header, the footer and the sitemap.
export const PAGES = [
  { href: '/', label: 'Home', short: 'Home', blurb: "Kenya's 47 counties: public finances and statistics you can check." },
  { href: '/counties/', label: 'Counties', short: 'Counties', blurb: 'All 47 counties and what is published for each.' },
  { href: '/learn/', label: 'Learn', short: 'Learn', blurb: 'Plain-language explainers for budget, audit and statistics terms.' },
  { href: '/data/', label: 'Data', short: 'Data', blurb: 'Download the datasets, with a data dictionary and source register.' },
  { href: '/method/', label: 'Method', short: 'Method', blurb: 'How we find, check and label every figure.' },
  // Published county pages (old URLs kept); in the Counties section of the navigation.
  { href: '/counties/siaya/', label: 'Siaya County', short: 'Siaya', blurb: "Siaya's revenue, spending, unpaid bills and audit in one view." },
  { href: '/subcounties/', label: 'Siaya sub-counties', short: 'Areas', blurb: 'Population, area, health services and staffing for each of the six sub-counties.' },
  { href: '/profile/', label: 'Siaya county profile', short: 'Profile', blurb: 'Poverty, households and health outcomes, compared with the national average.' },
  { href: '/insights/', label: 'Siaya insights', short: 'Insights', blurb: 'What the numbers add up to, with the arithmetic shown.' },
  { href: '/analytics/', label: 'Siaya analytics', short: 'Analytics', blurb: 'Growth rates, per-person views, variability and unspent budget, computed from ten years of data.' },
  { href: '/faq/', label: 'FAQ', short: 'FAQ', blurb: 'Common questions about the numbers and how to use them.' },
  { href: '/terms/', label: 'Terms of use', short: 'Terms', blurb: 'The terms for using Takwimu Kenya: accuracy, reuse and liability.' },
  { href: '/privacy/', label: 'Privacy notice', short: 'Privacy', blurb: 'What personal data is involved (very little) and your rights.' },
];
export const SITE_UPDATED = '2026-11-21';
