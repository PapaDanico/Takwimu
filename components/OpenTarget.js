'use client';
// Opens any closed <details> that holds the element named in the address (#id), on load and when the hash changes, so
// a link to a row or block inside a collapsed section lands on it. Nothing is rendered; the content is already static.
import { useEffect } from 'react';

export default function OpenTarget() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      let d = el.closest('details');
      let opened = false;
      while (d) { if (!d.open) { d.open = true; opened = true; } d = d.parentElement && d.parentElement.closest('details'); }
      if (opened) el.scrollIntoView();
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
  return null;
}
