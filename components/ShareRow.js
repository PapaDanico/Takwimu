import { SITE_URL } from '../lib/site';

// Share by WhatsApp using a plain link, so it works without scripts and in low-bandwidth browsers.
export default function ShareRow({ path, text }) {
  const url = `${SITE_URL}${path}`;
  const msg = encodeURIComponent(`${text}\n${url}`);
  return (
    <div className="share" role="group" aria-label="Share this page">
      <span>Share</span>
      <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a href={`mailto:?subject=${encodeURIComponent(text)}&body=${msg}`}>Email</a>
      <code>{url}</code>
    </div>
  );
}
