export const SITE_URL = 'https://takwimu.netlify.app';
// Corrections and error reports go to the Danico Ventures WhatsApp chat (owner, 21 Nov 2026); the name is kept for existing imports.
export const ISSUES_URL = 'https://wa.me/message/GPPIKMENXJVWO1';
export const WHATSAPP_URL = ISSUES_URL;
export const CIDP_URL = 'https://maarifa.cog.go.ke/sites/default/files/2024-06/SIAYA%20CIDP-2023-2027.pdf';

// Every public page, in navigation order. Used by the header, the footer and the sitemap.
export const PAGES = [
  { href: '/', label: 'Home', short: 'Home', blurb: "Kenya's 47 counties: public finances and statistics you can check." },
  { href: '/kenya/', label: 'Kenya dashboard and trends', short: 'Kenya', blurb: 'National indicators from 2010 by sector, and a trend explorer for any indicator in nominal or real terms.' },
  { href: '/compare/', label: 'Compare counties', short: 'Compare', blurb: 'All 47 counties on one indicator, on a map and in a table, or two to four side by side.' },
  { href: '/counties/', label: 'Counties', short: 'Counties', blurb: 'All 47 counties and what is published for each.' },
  { href: '/learn/', label: 'Learn', short: 'Learn', blurb: 'Plain-language explainers for budget, audit and statistics terms.' },
  { href: '/datasets/', label: 'Datasets', short: 'Data', blurb: 'Search, filter and download every dataset, with source, unit, coverage and method.' },
  { href: '/method/', label: 'Method', short: 'Method', blurb: 'How we find, check and label every figure.' },
  { href: '/stories/', label: 'Data stories', short: 'Stories', blurb: 'Short, sourced reads built only from the data.' },
  { href: '/reports/', label: 'Publications', short: 'Publications', blurb: 'The Siaya one-page brief, five evidence reports and how to ask for a brief.' },
  // Published county pages; in the Counties section of the navigation.
  { href: '/counties/siaya/', label: 'Siaya County', short: 'Siaya', blurb: "Siaya's revenue, spending, unpaid bills and audit in one view." },
  { href: '/counties/siaya/insights/', label: 'Siaya insights', short: 'Insights', blurb: 'What ten years of reports add up to, in plain language.' },
  { href: '/counties/siaya/people/', label: 'Siaya people', short: 'People', blurb: 'Population, households, age structure and poverty.' },
  { href: '/data/', label: 'Siaya: sources and conflicts', short: 'Series', blurb: 'The Siaya ten-year series with its sources, the conflict register and downloads.' },
  { href: '/faq/', label: 'FAQ', short: 'FAQ', blurb: 'Common questions about the numbers and how to use them.' },
  { href: '/terms/', label: 'Terms of use', short: 'Terms', blurb: 'The terms for using Takwimu Kenya: accuracy, reuse and liability.' },
  { href: '/privacy/', label: 'Privacy notice', short: 'Privacy', blurb: 'We collect no personal data: no forms, accounts, analytics or cookies.' },
];
export const SITE_UPDATED = '2026-11-27';
// The Explore section, in the order shown in the footer.
export const EXPLORE = ['/datasets/', '/kenya/', '/compare/', '/stories/'].map((h) => PAGES.find((p) => p.href === h));
