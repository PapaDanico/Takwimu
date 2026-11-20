export const SITE_URL = 'https://takwimu.netlify.app';
export const ISSUES_URL = 'https://github.com/PapaDanico/Takwimu/issues/new';
export const CIDP_URL = 'https://maarifa.cog.go.ke/sites/default/files/2024-06/SIAYA%20CIDP-2023-2027.pdf';

// Every public page, in navigation order. Used by the header, the footer and the sitemap.
export const PAGES = [
  { href: '/', label: 'Overview', short: 'Home', blurb: "Siaya's revenue, spending, unpaid bills and audit in one view." },
  { href: '/subcounties/', label: 'Sub-counties', short: 'Areas', blurb: 'Population, area, health services and staffing for each of the six sub-counties.' },
  { href: '/profile/', label: 'County profile', short: 'Profile', blurb: 'Poverty, households and health outcomes, compared with the national average.' },
  { href: '/insights/', label: 'Insights', short: 'Insights', blurb: 'What the numbers add up to, with the arithmetic shown.' },
  { href: '/learn/', label: 'Learn', short: 'Learn', blurb: 'Plain-language explainers for budget, audit and statistics terms.' },
  { href: '/faq/', label: 'FAQ', short: 'FAQ', blurb: 'Common questions about the numbers and how to use them.' },
  { href: '/data/', label: 'Data', short: 'Data', blurb: 'Download the datasets, with a data dictionary and source register.' },
  { href: '/method/', label: 'Method', short: 'Method', blurb: 'How we find, check and label every figure.' },
  { href: '/corrections/', label: 'Corrections', short: 'Fixes', blurb: 'Every error we have found and fixed.' },
];
