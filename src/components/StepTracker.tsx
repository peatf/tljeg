import { useEffect, useState } from 'react';
import { artifactNodes, getNodeById } from '../config/artifactFlow';
import { listEntries } from '../storage/storage';

type Props = {
  current: 'safety' | 'clarity' | 'calibration' | 'void' | 'implementation';
};

/**
 * StepTracker renders a compact stepper for the core 5 scenes.
 * A step is considered complete if there is at least one saved entry
 * for that scene. Uses IndexedDB-backed storage if available.
 */
export default function StepTracker({ current }: Props) {
  const coreIds: Props['current'][] = ['safety', 'clarity', 'calibration', 'void', 'implementation'];
  const [complete, setComplete] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, boolean> = {};
      for (const id of coreIds) {
        try {
          const arr = await listEntries(id);
          map[id] = Array.isArray(arr) && arr.length > 0;
        } catch {
          map[id] = false;
        }
      }
      setComplete(map);
    })();
  }, []);

  return (
    <nav aria-label="Progress" className="flex items-center gap-2 overflow-x-auto py-1">
      {coreIds.map((id, idx) => {
        const node = getNodeById(id)!;
        const short: Record<string, string> = {
          safety: 'Safety',
          clarity: 'Clarity',
          calibration: 'Calib.',
          void: 'VOID',
          implementation: 'Impl.'
        };
        const isActive = id === current;
        const isDone = !!complete[id];
        return (
          <a
            key={id}
            href={node.to}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap transition-colors ${
              isActive
                ? 'border-ink-800 bg-ink-800 text-white'
                : isDone
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-slate-300 text-ink-700 hover:bg-bone-50'
            }`}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${node.label} ${isActive ? 'current' : isDone ? 'complete' : 'pending'}`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${isDone ? 'bg-green-500' : isActive ? 'bg-white' : 'bg-slate-300'}`} />
            <span className="font-medium">{short[id] ?? node.label}</span>
            <span className="opacity-60">{idx + 1}</span>
          </a>
        );
      })}
    </nav>
  );
}
