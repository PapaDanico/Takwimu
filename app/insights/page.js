import Moved, { movedMetadata } from '../../components/Moved';

// Moved (owner decision U2/U6, 21 Nov 2026). netlify.toml answers with a 301; this static page is the fallback.
export const metadata = movedMetadata('Siaya insights', '/counties/siaya/insights/');

export default function MovedPage() {
  return <Moved title="Siaya insights" to="/counties/siaya/insights/" label="Siaya insights" />;
}
