'use client';
import { useEffect } from 'react';

// Keeps the query string, and the hash unless the new address names its own section.
export default function MovedRedirect({ to }) {
  useEffect(() => {
    const [path, hash] = to.split('#');
    window.location.replace(`${path}${window.location.search}${window.location.hash || (hash ? `#${hash}` : '')}`);
  }, [to]);
  return null;
}
