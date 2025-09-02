import { useEffect, useMemo, useState } from 'react';
import { listEntries } from '../storage/storage';

type SceneId = 'safety' | 'clarity' | 'calibration' | 'void' | 'implementation' | 'resets';

export default function ProgressSummary() {
  const [last, setLast] = useState<{ scene: SceneId; ts: number } | null>(null);

  useEffect(() => {
    (async () => {
      const scenes: SceneId[] = ['safety', 'clarity', 'calibration', 'void', 'implementation', 'resets'];
      let best: { scene: SceneId; ts: number } | null = null;
      for (const s of scenes) {
        try {
          const arr = await listEntries(s);
          const ts = Math.max(0, ...arr.map((e: any) => e.timestamp || 0));
          if (ts && (!best || ts > best.ts)) best = { scene: s, ts };
        } catch {}
      }
      setLast(best);
    })();
  }, []);

  const resumeHref = useMemo(() => (last ? `/artifact/${last.scene}` : '/artifact/safety'), [last]);
  const lastDate = last ? new Date(last.ts).toLocaleString() : '';

  return (
    <div className="p-3 border rounded bg-bone-50 text-sm flex items-center justify-between">
      <div>
        <p className="font-medium">{last ? 'Resume where you left off' : 'Start your journey'}</p>
        <p className="text-ink-600">{last ? `Last saved: ${lastDate}` : 'Begin at Safety and move at your pace.'}</p>
      </div>
      <a href={resumeHref} className="px-3 py-1.5 rounded bg-ink-800 text-white">
        {last ? 'Resume' : 'Start'}
      </a>
    </div>
  );
}

