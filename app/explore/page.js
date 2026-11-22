import Moved, { movedMetadata } from '../../components/Moved';

// Moved (owner decision U2/U6, 21 Nov 2026). netlify.toml answers with a 301; this static page is the fallback.
export const metadata = movedMetadata('Explore', '/datasets/');

export default function MovedPage() {
  return <Moved title="Explore" to="/datasets/" label="the dataset catalogue" />;
}
