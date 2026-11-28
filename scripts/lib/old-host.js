// The retired host, now a Netlify alias of SITE_URL. Kept out of lib/ so it never reaches the client bundle;
// used by scripts/check-host.js, scripts/check-redirects.js and the smoke test.
module.exports = { OLD_HOST: 'takwimu.netlify.app' };
