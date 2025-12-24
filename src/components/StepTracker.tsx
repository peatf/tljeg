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
    <nav aria-label="Progress" className="step-tracker">
      {coreIds.map((id, idx) => {
        const node = getNodeById(id)!;
        const isActive = id === current;
        const isDone = !!complete[id];

        return (
          <>
            <a
              key={id}
              href={node.to}
              className={`step-node ${isActive ? 'step-node--active' : isDone ? 'step-node--completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${node.label} ${isActive ? 'current' : isDone ? 'complete' : 'pending'}`}
              title={node.label}
            />
            {idx < coreIds.length - 1 && (
              <div
                key={`connector-${id}`}
                className={`step-connector ${isDone ? 'step-connector--completed' : ''}`}
                aria-hidden="true"
              />
            )}
          </>
        );
      })}
    </nav>
  );
}
