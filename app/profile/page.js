import Moved, { movedMetadata } from '../../components/Moved';

// Moved (owner decision U2/U6, 21 Nov 2026). netlify.toml answers with a 301; this static page is the fallback.
export const metadata = movedMetadata('Siaya county profile', '/counties/siaya/people/');

export default function MovedPage() {
  return <Moved title="Siaya county profile" to="/counties/siaya/people/" label="Siaya people (health results are on Siaya health)" />;
}
