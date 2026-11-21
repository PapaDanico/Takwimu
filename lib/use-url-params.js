'use client';
// Read view choices from the address and write them back without a reload, so any view can be shared or saved.
// Next.js 14.2 keeps useSearchParams in step with window.history.replaceState.
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export default function useUrlParams() {
  const sp = useSearchParams();
  const set = useCallback((patch) => {
    const p = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) p.delete(k);
      else p.set(k, Array.isArray(v) ? v.join(',') : String(v));
    });
    const qs = p.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, []);
  return [sp, set];
}
