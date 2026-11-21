import PageHead from '../../components/PageHead';
import { SITE_URL, ISSUES_URL } from '../../lib/site';
import TableWrap from '../../components/TableWrap';
import library from '../../data/source-library.json';

export const metadata = {
  title: 'Terms of use',
  description: 'The terms that apply when you use Takwimu Kenya: purpose, accuracy, reuse, acceptable use, liability and governing law.',
};

const UPDATED = '21 November 2026';

// Per-publisher reuse terms, from data/source-library.json (data_reuse, document_redistribution). One row per publisher
// group; where documents of one group differ, the most restrictive term is shown.
const GROUPS = [
  ['Controller of Budget, Auditor-General, Senate', /Controller of Budget|Auditor-General|Senate of Kenya/],
  ['Kenya National Bureau of Statistics (KNBS)', /Kenya National Bureau of Statistics/],
  ['Central Bank of Kenya', /Central Bank of Kenya/],
  ['IEBC and the Commission on Revenue Allocation', /Independent Electoral|Commission on Revenue Allocation/],
  ['County Government of Siaya', /County Government of Siaya/],
  ['Ministries, NACC/NSDCC, WASREB, Kenya News Agency and other national public bodies', /Ministry of|National AIDS Control|National Syndemic|Water Services Regulatory|Kenya News Agency|climatefinanceken/],
  ['World Bank (World Development Indicators)', /^World Bank$/],
  ['International Monetary Fund (World Economic Outlook and reports)', /International Monetary Fund/],
  ['International Budget Partnership (Open Budget Survey)', /International Budget Partnership/],
  ['APRM Kenya', /APRM/],
  ['Humanitarian Data Exchange and geoBoundaries (Creative Commons or public domain)', /Humanitarian Data Exchange|HDX|geoBoundaries/],
  ['NGOs, UN agencies, research and media publishers', /./],
];
const RANK = { 'permission required': 0, 'link and cite only': 1, 'figures may be reused with citation': 2 };
const REUSE_ROWS = GROUPS.map(([name, re]) => {
  const docs = library.documents.filter((d) => re.test(d.publisher) && !GROUPS.slice(0, GROUPS.findIndex((g) => g[0] === name)).some(([, r]) => r.test(d.publisher)));
  if (!docs.length) return null;
  const terms = [...new Set(docs.map((d) => d.data_reuse))].sort((a, b) => RANK[a] - RANK[b]);
  return { name, n: docs.length, reuse: terms, redistribute: docs.every((d) => d.document_redistribution) ? 'Yes, under the stated licence' : docs.some((d) => d.document_redistribution) ? 'Some, under their stated licence' : 'No', basis: docs.find((d) => d.data_reuse === terms[0]).reuse_basis };
}).filter(Boolean);

const SECTIONS = [
  { id: 'about', title: '1. About these terms', body: [
    'Takwimu Kenya ("Takwimu", "we", "us") is a free civic-education website that explains the budget, audit and statistics reports of Kenya\'s 47 counties in plain language, publishing each county once its data meets the same evidence standard. It is a product of Danico Ventures Ltd, a company in Kenya.',
    `By opening or using ${SITE_URL.replace('https://', '')} or any page, file or feature on it (the "Site"), you agree to these terms. If you do not agree, please do not use the Site.`,
    'We may change these terms. The date at the top of this page shows the latest version. Using the Site after a change means you accept the new version.',
  ] },
  { id: 'purpose', title: '2. What the Site is for', body: [
    'The Site is for public education and information. It reads published official documents, shows the figures in context, and tells you where each figure came from so that you can check it yourself.',
    'It is not a government website and is not run by, affiliated with, or endorsed by the Controller of Budget, the Office of the Auditor-General, the Kenya National Bureau of Statistics, the Commission on Revenue Allocation, the National Treasury, Siaya County Government, or any other public body or officeholder.',
  ] },
  { id: 'disclaimer', title: '3. No advice and no guarantee of accuracy', body: [
    'Nothing on the Site is legal, financial, investment, tax, accounting or audit advice, and nothing on the Site is a finding of wrongdoing by any person or body. Do not make decisions, allegations or investments only because of something you read here.',
    'We take care to read figures from primary documents and we give a source, a retrieval date and a confidence score for each series in the data tables, the data files and the notes beside charts; headline tiles and summary charts draw on those same series. Even so, many source documents are scanned images that must be read by text-recognition software, official reports sometimes disagree with each other, and our own work can contain mistakes. Figures may be delayed, rounded, restated by the publisher, or misread.',
    'The Site and its data are provided "as is" and "as available", without warranty of any kind, express or implied, including any warranty of accuracy, completeness or fitness for a particular purpose. To the fullest extent the law allows, we do not promise that it is complete, current, error-free or uninterrupted. Always check a number against the source document before you rely on it. If you find a mistake, tell us (section 13) and we will check it and fix it.',
    'Analytics, per-person figures, price-adjusted ("real") figures and charts are our own calculations from published data. They are estimates and are labelled as such. Explainers marked as drafts have not yet been reviewed by a subject specialist.',
  ] },
  { id: 'people', title: '4. People and organisations named on the Site', body: [
    'The Site reports what official documents say about public bodies, such as an audit opinion on a county executive. It does not label named individuals as dishonest, corrupt or guilty, and it does not publish claims about individuals without a primary document and a legal check.',
    'If you believe something on the Site is inaccurate or unfair to you or your organisation, contact us (section 13) with the page, the figure and the document you rely on. We will review it promptly.',
  ] },
  { id: 'copyright', title: '5. Copyright, reuse and attribution', body: [
    'Our original text, charts, explainers, layout, logo and the Takwimu name belong to Danico Ventures Ltd or its licensors. The Danico Ventures Ltd name and logo belong to that company and may not be used without its permission.',
    'You may reuse our own original text, explanations and calculations (figures labelled "Calculated by Takwimu Kenya from published figures"), including commercially, provided you (a) credit "Takwimu Kenya (takwimu.netlify.app), based on [the original publisher]" and (b) do not suggest that we or the original publishers endorse you or your use. If you change the material, say so. This grant covers only our own work.',
    'There is no blanket grant, commercial or otherwise, for third-party data. The figures and documents behind the Site stay under their publishers\' own terms, set out publisher by publisher in the table below. Kenyan public statistics (Controller of Budget, Auditor-General, KNBS, CBK, IEBC, CRA, the National Treasury and county governments) may be reused as figures with the body and report named, but the documents themselves are not republished here. World Bank World Development Indicators are CC BY 4.0: credit "World Bank, World Development Indicators".',
    'IMF World Economic Outlook figures are excluded from any reuse grant on this Site: the IMF\'s terms are link and cite only. They are shown on /kenya/#imf with the vintage and a link, "Source: IMF World Economic Outlook, © IMF", and no CSV or JSON copy is offered. To reuse them, go to the IMF.',
    'Bulk downloads (CSV and JSON on the datasets page) are offered only for datasets whose publishers allow the figures to be reused with citation. Citing a figure from our Data page does not replace citing the original report, which you should also name.',
    'Do not copy the Site in a way that hides its sources, confidence scores, caveats or corrections, or that presents our estimates as official statistics.',
  ], table: true },
  { id: 'nonpartisan', title: '6. Non-partisan use and briefs', body: [
    'Takwimu Kenya is strictly non-partisan. It does not support or oppose any party, candidate, officeholder or campaign, and the same briefs and services are offered on the same terms to every party, independent candidate, public office and organisation.',
    'Paid work never changes a published figure, ranking or caveat, and no client has a say over what the Site publishes. A brief prepared for a client uses the same sources and method as the Site, and the same corrections policy (section 13).',
    'You are welcome to quote the Site in debate, campaigns and reporting. When you do, please quote figures accurately with their source, date and caveats, and do not suggest that Takwimu Kenya endorses you, your party or your argument.',
  ] },
  { id: 'use', title: '7. Acceptable use', body: [
    'You agree not to: attack, overload or probe the Site or its hosting; try to gain unauthorised access to any system; use automated tools in a way that harms the Site\'s availability (reasonable, polite use of the downloadable data files is welcome); use the Site to break any law; use the Site to harass, defame or mislead anyone; or present our content in a way that misrepresents it.',
    'We may block access or remove content if we believe these terms are being broken or the Site is at risk.',
  ] },
  { id: 'links', title: '8. Links and third-party material', body: [
    'The Site links to documents and websites run by others, such as the Parliament of Kenya library, the Controller of Budget, the Auditor-General, KNBS, the World Bank, GitHub and the Demographic and Health Surveys programme. We do not control those sites and are not responsible for their content, availability or privacy practices. A link is not an endorsement.',
    'Share buttons open another app (for example WhatsApp or your email program) with a pre-written message. What happens after that is governed by that app\'s own terms.',
  ] },
  { id: 'liability', title: '9. Limit of liability', body: [
    'We provide the Site free of charge. To the fullest extent permitted by Kenyan law, Danico Ventures Ltd, its directors, staff and contributors are not liable for any loss or damage (including indirect or consequential loss, loss of profit, or loss from decisions made using the Site) arising from your use of, or inability to use, the Site or from any error or omission in it.',
    'Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, or affects your rights as a consumer under Kenyan law.',
  ] },
  { id: 'accessibility', title: '10. Accessibility', body: [
    'We want everyone to be able to use the Site, including people who use screen readers, keyboards, magnifiers or small, low-cost phones and slow connections. The Site is built to meet WCAG 2.2 level AA as far as we can test: every chart has a table view with exact values, charts use a legend and, on wide screens, direct labels, and pages work in light and dark display modes and print without menus. Some chart colours are not high contrast against the page, so use the table view if you cannot tell series apart.',
    'We test with automated tools, which cannot find every problem. If you meet a barrier, tell us (section 13) and we will work to fix it.',
  ] },
  { id: 'availability', title: '11. Availability and changes to the Site', body: [
    'We may change, suspend or stop any part of the Site at any time, for example to correct data, add reports, or because a data source becomes unavailable. We do not promise that any particular figure, page or file will always be there; where we can, we keep old versions in our public repository.',
  ] },
  { id: 'law', title: '12. Governing law', body: [
    'These terms are governed by the laws of Kenya. Subject to any right you have that cannot be excluded, the courts of Kenya have exclusive jurisdiction over any dispute about them or the Site.',
    'If any part of these terms is found unenforceable, the rest stays in force.',
  ] },
  { id: 'contact', title: '13. Contact and corrections', body: [
    'The quickest way to reach us is a WhatsApp message to Danico Ventures Ltd, through the "Report an inaccuracy" link. Please give the page address, the figure or text concerned, and a link to the document that shows the right value.',
    'Corrections policy: we check every report of a mistake against the source document. If a figure is wrong, we correct it, note the change and the date in the public repository, and keep the conflict register on the Data page up to date. Where official reports disagree, the Data page lists each case with both values and their sources, rather than choosing one silently. Corrections apply equally to the free Site and to briefs prepared for clients.',
    'The Site has no form and collects no personal data. Briefs are requested by WhatsApp message to Danico Ventures Ltd, linked from /briefs/request/. We do not publish a contact email address.',
  ] },
];

export default function Terms() {
  return (
    <main id="main" className="wrap page">
      <PageHead eyebrow="Legal" title="Terms of use" sub={`Plain-language terms for using Takwimu Kenya. Version 1.2, last updated ${UPDATED}.`} path="/terms/" shareText="Takwimu Kenya: terms of use" />
      <nav aria-label="Sections on this page"><ul className="toc">
        {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s/, '')}</a></li>)}
      </ul></nav>
      <section className="card legal" aria-label="Summary">
        <h2>In short</h2>
        <ul className="steps">
          <li>Takwimu explains public documents. It is not advice and not an official source. Check numbers against the original report.</li>
          <li>You may reuse our own text and calculations with credit to Takwimu and the original publisher. Third-party data stays under each publisher&apos;s terms (table in section 5); there is no blanket grant for it.</li>
          <li>Please use the Site lawfully and gently. Tell us about mistakes so we can fix and log them.</li>
          <li>Takwimu is non-partisan: the same service is open to everyone, and paid work never changes a published figure.</li>
          <li>IMF World Economic Outlook figures are link and cite only and are not covered by any reuse grant here; World Bank data are CC BY 4.0.</li>
          <li>These terms are governed by Kenyan law. The full text follows.</li>
        </ul>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="card legal" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{s.title}</h2>
          {s.body.map((para, i) => <p key={i}>{para}</p>)}
          {s.table ? (
            <TableWrap label="Reuse terms by publisher">
              <table className="data" id="reuse-by-publisher">
                <caption>Reuse terms by publisher, from the source library ({library.documents.length} documents)</caption>
                <thead><tr><th scope="col">Publisher</th><th scope="col">The figures</th><th scope="col">The documents</th><th scope="col">Basis</th></tr></thead>
                <tbody>{REUSE_ROWS.map((r) => <tr key={r.name}><th scope="row">{r.name}<small style={{ display: 'block', fontWeight: 400 }}>{r.n} documents</small></th><td>{r.reuse.join('; ')}</td><td>{r.redistribute}</td><td>{r.basis}</td></tr>)}</tbody>
              </table>
            </TableWrap>
          ) : null}
        </section>
      ))}
    </main>
  );
}
