import Link from 'next/link';
import PageHead from '../../../../components/PageHead';
import CountyNav from '../../../../components/county/CountyNav';
import TableWrap from '../../../../components/TableWrap';
import { paramsFor } from '../../../../components/county/params';
import * as cp from '../../../../lib/county-pages';
import { pageMeta } from '../../../../lib/page-meta';

export const dynamicParams = false;
export const generateStaticParams = () => paramsFor('sources');
export function generateMetadata({ params }) {
  const m = cp.meta(params.slug);
  return pageMeta(`/counties/${params.slug}/sources/`, { title: `${m.name}: sources`, description: `Every document cited on the ${m.name} County pages: publisher, publication date, period, link, licence and SHA-256 hash where held.` });
}

const USED = { ledger: 'Fiscal reconciliation', audits: 'Audit opinions', people: 'Population', indicators: 'Indicators' };
const HREF = { ledger: 'ledger', audits: 'audits', people: 'people', indicators: 'indicators' };

export default function CountySources({ params }) {
  const { slug } = params;
  const m = cp.meta(slug);
  const list = cp.sources(slug);
  return (<>
    <main id="main" className="wrap page">
      <PageHead county={{ slug, name: m.name }} eyebrow="Sources" title="Sources"
        sub={`Every document cited on the ${m.name} County pages, with its publisher, date, link, licence and, where the file is held, its SHA-256 hash so that anyone can check they have the same copy.`}
        path={`/counties/${slug}/sources/`} shareText={`${m.name}: sources`} />
      <section className="card" aria-labelledby="src-list">
        <h2 id="src-list">{list.length} documents</h2>
        <p className="lead">The documents are linked, not copied: most publishers do not license redistribution. A hash identifies the exact file read; &ldquo;not held&rdquo; means the figure was read from a copy whose hash was not recorded.</p>
        <TableWrap label={`${m.name}: documents cited`}>
          <table className="data" id="sources">
            <caption className="sr-only">Documents cited on the {m.name} County pages, with publisher, publication date, period, pages that use them, licence and hash</caption>
            <thead><tr><th scope="col">Document</th><th scope="col">Publisher</th><th scope="col">Published</th><th scope="col">Used on</th><th scope="col">Licence and hash</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} id={`src-${s.id}`}>
                  <th scope="row">{s.url ? <a href={s.url} rel="noopener">{s.title}</a> : s.title}{s.period ? <><br /><small>{s.period}</small></> : null}</th>
                  <td>{s.publisher || 'Not stated'}</td>
                  <td>{s.published || 'Not stated'}</td>
                  <td>{s.used_on.map((u, i) => <span key={u}>{i ? ', ' : ''}<Link href={`/counties/${slug}/${HREF[u]}/`}>{USED[u]}</Link></span>)}</td>
                  <td><small>{s.licence || 'Licence not stated: cite and link.'}</small><br /><small className="hash">SHA-256: {s.sha256 ? <code>{s.sha256}</code> : 'not held'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </main>
    <CountyNav name={m.name} links={cp.nav(slug)} current={`/counties/${slug}/sources/`} />
  </>);
}
