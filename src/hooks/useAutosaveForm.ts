import { useEffect, useRef } from 'react';

export function useAutosaveForm<T extends Record<string, any>>(key: string, data: T, delay = 400) {
  const prev = useRef<string>('');
  useEffect(() => {
    const json = JSON.stringify(data);
    if (prev.current === json) return;
    prev.current = json;
    const t = window.setTimeout(() => {
      try { localStorage.setItem(`autosave:${key}`, json); } catch {}
    }, delay);
    return () => window.clearTimeout(t);
  }, [key, data, delay]);
}

export function loadAutosave<T = any>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`autosave:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

