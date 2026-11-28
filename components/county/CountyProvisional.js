// Page label for a county page from the registry: the same short form as components/ObsTable.js Provisional (the
// label, the page's review counts, a link to the one explanation of editorial review), with the county's own counts
// (lib/county-review.js counts) passed in, because Siaya's counts come from lib/review-status.js.
import { countsSentence } from '../../lib/review-status';
import { REVIEW_HREF } from '../ObsTable';

export default function CountyProvisional({ counts, datasets }) {
  return (
    <p className="provisional">
      {counts.approved < counts.total ? <span className="tag warn">Provisional: awaiting editorial review</span> : null}
      <small className="review-counts" data-review-counts={datasets.join(' ')}> {countsSentence(counts)}{counts.needs_page_check ? ` ${counts.needs_page_check} ${counts.needs_page_check === 1 ? 'value is' : 'values are'} marked "Needs page check": the reading has not yet been compared with the page image.` : ''}</small>
      {' '}<a href={REVIEW_HREF}>What this means</a>
    </p>
  );
}
