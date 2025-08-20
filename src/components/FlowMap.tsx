import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

const nodes = [
  { key: 'safety', label: 'Safety', to: '/artifact/safety' },
  { key: 'clarity', label: 'Clarity', to: '/artifact/clarity' },
  { key: 'calibration', label: 'Calibration', to: '/artifact/calibration' },
  { key: 'void', label: 'VOID', to: '/artifact/void' },
  { key: 'implementation', label: 'Implementation', to: '/artifact/implementation' },
  { key: 'resets', label: 'Resets', to: '/artifact/resets' }
];

export default function FlowMap() {
  const prefersReduced = useReducedMotion();
  return (
  <div className="grid gap-6 flowmap-reserve">
      <div className="text-center text-ink-600 text-sm mb-2">
        <p className="mb-2">Tap any node to navigate. VOID anchors the flow.</p>
        <div className="flex justify-center items-center gap-1 text-xs">
          <span>1. Safety</span>
          <span className="text-slate-400">→</span>
          <span>2. Clarity</span>
          <span className="text-slate-400">→</span>
          <span>3. Calibration</span>
          <span className="text-slate-400">→</span>
          <span>4. VOID</span>
          <span className="text-slate-400">→</span>
          <span>5. Implementation</span>
          <span className="text-slate-400">→</span>
          <span>6. Resets</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-center relative">
        {nodes.map((n) =>
          n.key === 'void' ? (
            <motion.div
              key={n.key}
              className="col-span-2 md:col-span-3 flex justify-center"
              initial={false}
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { opacity: [0.9, 1, 0.9], scale: [1, 1.04, 1] }
              }
              transition={{ repeat: prefersReduced ? 0 : Infinity, duration: 4 }}
            >
              <Link
                to={n.to}
                className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-ink-800 text-bone-50 flex items-center justify-center text-lg md:text-xl"
                aria-label="VOID scene"
              >
                {n.label}
              </Link>
            </motion.div>
          ) : (
            <Link
              key={n.key}
              to={n.to}
              className="border border-slate-300 rounded-lg p-4 md:p-4 text-center min-h-[56px] flex items-center justify-center"
              aria-label={`Go to ${n.label}`}
            >
              {n.label}
            </Link>
          )
        )}
      </div>
      
    </div>
  );
}
