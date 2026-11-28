import Link from 'next/link';
import Abbrs from '../../../../components/Abbrs';
import PageToc from '../../../../components/PageToc';
import PageHead from '../../../../components/PageHead';
import TableWrap from '../../../../components/TableWrap';
import { governance, aprmPage } from '../../../../lib/governance';
import Reviewed from '../../../../components/Reviewed';
import { Provisional } from '../../../../components/ObsTable';
import { pageMeta } from '../../../../lib/page-meta';

export const metadata = pageMeta('/counties/siaya/governance/', {
  title: 'Budget transparency and public participation',
  description: 'Siaya County in the IBP Kenya County Budget Transparency Survey 2021 and 2022, shown as separate editions, and the APRM Siaya County Review Report 2024 findings on public participation, civic education and feedback, each with its page.',
});

const g = governance();
const Src = ({ item, doc }) => (
  <small className="cite">{doc.publisher}, <a href={doc.url}>{doc.edition}</a>, PDF p. {item.page_pdf}{item.confidence ? `, confidence ${item.confidence}` : ''}</small>
);
const List = ({ items }) => (items && items.length ? <ul className="plain">{items.map((x) => <li key={x}>{x}</li>)}</ul> : <>None</>);

export default function SiayaGovernance() {
  const [e21, e22] = g.editions;
  const rows = [
    ['Documents assessed', (e) => <>{e.doc.period_assessed}. Cover date: {e.doc.cover_date}.</>],
    ['Transparency index', (e) => <><Reviewed b={e.index.review}><b>{e.index.value} out of 100</b></Reviewed><br /><Src item={e.index} doc={e.doc} />{e.nationalAverage ? <><br />National average <Reviewed b={e.nationalAverage.review}>{e.nationalAverage.value}</Reviewed>; Siaya ranked <Reviewed b={e.rank.review}>{e.rank.value}th of {e.rank.of}</Reviewed> (<Src item={e.rank} doc={e.doc} />)</> : null}</>],
    ['Key documents published', (e) => <><Reviewed b={e.count.review}><b>{e.count.value} of {e.count.of}</b></Reviewed><br /><Src item={e.count} doc={e.doc} /></>],
    ['Published', (e) => <><Reviewed b={e.list.review} as="div"><List items={e.list.published} /></Reviewed><Src item={e.list} doc={e.doc} /></>],
    ['Not published', (e) => <><Reviewed b={e.list.review} as="div"><List items={e.list.not_published} /></Reviewed><Src item={e.list} doc={e.doc} /></>],
    ['Content score by document', (e) => <><Reviewed b={e.comp.review} as="div"><ul className="plain">{e.comp.scores.map((s) => <li key={s.document}>{s.document}: {s.value == null ? s.reason.toLowerCase() : `${s.value} of 100`}</li>)}</ul></Reviewed><Src item={e.comp} doc={e.doc} /></>],
    ['Public participation score', (e) => <Reviewed b={e.participation.review}>{() => (e.participation.value == null
      ? <><b>No score printed for Siaya in this edition.</b> The survey notes: &ldquo;{e.participation.quote}&rdquo;<br /><Src item={e.participation} doc={e.doc} /></>
      : <><b>{e.participation.value} out of 100</b>{e.participationFinding ? <> &ldquo;{e.participationFinding.quote}&rdquo;</> : null}<br /><Src item={e.participation} doc={e.doc} /></>)}</Reviewed>],
    ['Survey recommendation', (e) => (e.recommendation ? <><Reviewed b={e.recommendation.review}>&ldquo;{e.recommendation.quote}&rdquo;</Reviewed><br /><Src item={e.recommendation} doc={e.doc} /></> : <>None printed</>)],
  ];
  return (
    <main id="main" className="wrap page">
      <PageHead county={{ slug: 'siaya', name: 'Siaya' }} eyebrow="Transparency" title="Budget transparency and public participation"
        sub="How many of Siaya County’s key budget documents were publicly available, how much they said about public participation, and what a county peer review found about participation, civic education and feedback."
        path="/counties/siaya/governance/" shareText="Siaya: budget transparency and public participation" />
      <Provisional dataset={'siaya-governance'} />
      <Abbrs list={['CBTS']} />

      <PageToc items={[['gov-cbts', 'Budget transparency survey'], ['gov-conf', 'Where editions disagree'], ['gov-aprm', 'County peer review'], ['gov-cav', 'Caveats']]} />
      <section className="card gold" aria-labelledby="gov-read">
        <h2 id="gov-read">How to read this page</h2>
        <ul className="how">
          <li id="survey-date"><b>Survey scores describe document availability at the survey date, not current practice.</b> The County Budget Transparency Survey (CBTS) checks the county website at one point after the year it covers. A document posted later counts as not published for that round, and practice may have changed since.</li>
          <li id="not-verdicts"><b>Findings are not verdicts.</b> The scores and the review findings below are attributed to the organisations that published them. Takwimu has not verified them, and they are not a judgement of the county government or of any person. No individual is named.</li>
          <li>The two survey editions are shown side by side as separate editions. No score is carried from one edition to the other, and where they disagree both readings are kept.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="gov-cbts">
        <h2 id="gov-cbts">County Budget Transparency Survey, 2021 and 2022 editions</h2>
        <p className="lead">{g.method}</p>
        <TableWrap label="Siaya in CBTS 2021 and CBTS 2022, side by side">
          <table className="data" id="cbts">
            <caption className="sr-only">Siaya County in the IBP Kenya County Budget Transparency Survey, 2021 and 2022 editions</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">{e21.edition}</th><th scope="col">{e22.edition}</th></tr></thead>
            <tbody>
              {rows.map(([label, cell]) => <tr key={label}><th scope="row">{label}</th><td>{cell(e21)}</td><td>{cell(e22)}</td></tr>)}
            </tbody>
          </table>
        </TableWrap>
        {e21.response ? <p className="src">After seeing the draft 2021 results, the survey records: &ldquo;{e21.response.quote}&rdquo; (<Src item={e21.response} doc={e21.doc} />). The 2021 figures may therefore partly reflect documents published in response to the survey.</p> : null}
      </section>

      <section className="card" aria-labelledby="gov-conf">
        <h2 id="gov-conf">Where the survey editions disagree</h2>
        <p className="lead">Three points on which the IBP Kenya documents do not agree with each other. Each reading is shown as printed. None is resolved here.</p>
        {g.conflicts.map((c) => (
          <div key={c.id} id={c.id} className="conflict">
            <h3>{c.topic}</h3>
            <TableWrap label={c.topic}>
              <table className="data">
                <caption className="sr-only">{c.topic}: what each document says</caption>
                <thead><tr><th scope="col">Document</th><th scope="col">What it says</th></tr></thead>
                <tbody>
                  {c.positions.map((p) => <tr key={p.says}><th scope="row">{p.doc.edition}, PDF p. {p.page_pdf}</th><td>{p.says}</td></tr>)}
                </tbody>
              </table>
            </TableWrap>
            <p className="src">Status: {c.resolution}</p>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="gov-aprm">
        <h2 id="gov-aprm">County peer review, 2024: what participants and the county reported</h2>
        <p className="lead">Brief quotations from the <a href={g.aprm.doc.url}>{g.aprm.doc.title}</a> ({g.aprm.doc.publisher}), section 3.14 and Annex 2. {g.aprm.method_note} Passages marked as the county’s own account are the county’s report of its progress.</p>
        {g.aprm.groups.map((grp) => (
          <div key={grp.key} id={`aprm-${grp.key}`}>
            <h3>{grp.title}</h3>
            <ul className="how">
              {grp.findings.map((f) => (
                <li key={f.id}>
                  <Reviewed b={f.review}>{() => <>{f.quote ? <>&ldquo;{f.quote}&rdquo;</> : <b>{f.measure}:</b>}
                  {f.rows ? <> {f.rows.map((r) => `${r.output} (${Object.entries(r.targets).map(([y, v]) => `${v} in ${y}`).join(', ')})`).join('; ')}.</> : null}
                  {f.also ? <> {f.also}</> : null}</>}</Reviewed>
                  {f.note ? <> Note: {f.note}</> : null}
                  <br /><small className="cite">{f.section}, {aprmPage(f)}</small>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="gov-cav">
        <h2 id="gov-cav">Caveats</h2>
        <ul className="how">{g.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="src">Sources: {g.sources.map((s, i) => <span key={s.source_id}>{i ? '; ' : ''}{s.publisher}, <a href={s.url}>{s.title}</a> ({s.cover_date})</span>)}. Records for each document are in the <Link href="/counties/siaya/sources/">source library</Link>; every item is in the <Link href="/datasets/?q=siaya-governance">dataset catalogue</Link> and in <a href="/data/siaya-governance.json">siaya-governance.json</a>. See also <Link href="/counties/siaya/">Siaya County hub</Link>.</p>
      </section>
    </main>
  );
}
