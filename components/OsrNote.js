import Link from 'next/link';

// One line linking the explainer of own-source revenue, hospital income (FIF) and A-i-A (owner item 5): on every page
// or report that shows own-source revenue or FIF (scripts/check-osr-links.js checks the built site).
export default function OsrNote({ className = 'how osr-note' }) {
  return <p className={className}>Why own-source revenue totals differ: <Link href="/learn/#own-source-revenue">OSR, FIF and A-i-A explained</Link>.</p>;
}
