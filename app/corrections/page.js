import Moved, { movedMetadata } from '../../components/Moved';

// The corrections register was retired (owner decision, 27 Nov 2026): each correction and source-document error is now a
// small footnote beside the value it concerns, and /method/#corrections says how. netlify.toml answers with a 301;
// this static page is the fallback.
export const metadata = movedMetadata('Corrections', '/method/#corrections');

export default function MovedPage() {
  return <Moved title="Corrections" to="/method/#corrections" label="How we handle numbers: corrections" />;
}
