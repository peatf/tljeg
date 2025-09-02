import { useEffect, useState } from 'react';

export default function IntroModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('tja-onboarding-seen');
      if (!seen) setOpen(true);
    } catch {}
  }, []);

  function close() {
    setOpen(false);
    try { localStorage.setItem('tja-onboarding-seen', '1'); } catch {}
  }

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome" className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative z-10 max-w-md w-full bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Welcome</h2>
        <p className="text-sm text-ink-700 mb-2">This guide is self-paced. You can move through Safety → Clarity → Calibration → VOID → Implementation at your own speed.</p>
        <ul className="list-disc pl-5 text-sm text-ink-800 mb-3">
          <li>Tap Save to see Continue prompts.</li>
          <li>Use the top step tracker to navigate.</li>
          <li>Tooltips explain key terms along the way.</li>
        </ul>
        <div className="text-right">
          <button className="px-3 py-1.5 border rounded" onClick={close} aria-label="Got it">Got it</button>
        </div>
      </div>
    </div>
  );
}

