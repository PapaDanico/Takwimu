'use client';
import { useEffect } from 'react';

export default function TrendsRedirect() {
  useEffect(() => { window.location.replace(`/kenya/${window.location.search}#trends`); }, []);
  return null;
}
