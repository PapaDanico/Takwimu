import Moved, { movedMetadata } from '../../components/Moved';

// The trend explorer moved into the Kenya dashboard (/kenya/#trends). Netlify redirects /trends/ there with a 301 that
// keeps the query string; this static page does the same where the redirect rules do not run.
export const metadata = movedMetadata('Trends', '/kenya/');

export default function TrendsMoved() {
  return <Moved title="The trend explorer" to="/kenya/#trends" label="the Kenya dashboard trend explorer" />;
}
