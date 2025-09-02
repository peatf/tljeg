import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Ctx = {
  announce: (msg: string) => void;
};

const SrCtx = createContext<Ctx | null>(null);

export function SrLiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const timerRef = useRef<number | null>(null);

  const announce = useCallback((msg: string) => {
    setMessage('');
    // Force brief clear to retrigger SR reading successive identical messages
    window.setTimeout(() => setMessage(msg), 30);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(''), 2000) as unknown as number;
  }, []);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  return (
    <SrCtx.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{message}</div>
    </SrCtx.Provider>
  );
}

export function useAnnounce() {
  const ctx = useContext(SrCtx);
  return ctx?.announce ?? (() => {});
}

