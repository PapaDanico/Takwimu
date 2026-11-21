import Moved, { movedMetadata } from '../../../components/Moved';

// Moved (owner decision U2/U6, 21 Nov 2026). netlify.toml answers with a 301; this static page is the fallback.
export const metadata = movedMetadata('Request a brief', '/reports/#briefs');

export default function MovedPage() {
  return <Moved title="Request a brief" to="/reports/#briefs" label="Publications: about our briefs" />;
}
