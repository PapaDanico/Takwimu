import Moved, { movedMetadata } from '../../components/Moved';

// Moved (owner decision U2/U6, 21 Nov 2026). netlify.toml answers with a 301; this static page is the fallback.
export const metadata = movedMetadata('Siaya analytics', '/counties/siaya/analysis/');

export default function MovedPage() {
  return <Moved title="Siaya analytics" to="/counties/siaya/analysis/" label="Siaya analysis" />;
}
