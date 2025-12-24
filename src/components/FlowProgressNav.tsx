import { Link, useLocation } from 'react-router-dom';

const FLOW_STEPS = [
  { id: 'safety', label: 'Safety', path: '/artifact/safety' },
  { id: 'clarity', label: 'Clarity', path: '/artifact/clarity' },
  { id: 'void', label: 'VOID', path: '/artifact/void' },
  { id: 'calibration', label: 'Grounding', path: '/artifact/calibration' },
  { id: 'implementation', label: 'Action', path: '/artifact/implementation' },
] as const;

function Arrow({ isCompleted }: { isCompleted: boolean }) {
  return (
    <svg
      className={`flow-nav-arrow ${isCompleted ? 'flow-nav-arrow--completed' : ''}`}
      width="16"
      height="10"
      viewBox="0 0 16 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 5h12M10 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FlowProgressNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Find current step index
  const currentIndex = FLOW_STEPS.findIndex(step => currentPath === step.path);

  return (
    <nav className="flow-progress-nav" aria-label="Timeline Jump progress">
      {FLOW_STEPS.map((step, index) => {
        const isCurrent = currentPath === step.path;
        const isCompleted = currentIndex > index;
        const isUpcoming = currentIndex < index && currentIndex !== -1;

        return (
          <div key={step.id} className="flow-nav-item">
            <Link
              to={step.path}
              className={`flow-nav-link ${isCurrent ? 'flow-nav-link--current' : ''} ${isCompleted ? 'flow-nav-link--completed' : ''} ${isUpcoming ? 'flow-nav-link--upcoming' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="flow-nav-dot" />
              <span className="flow-nav-label">{step.label}</span>
            </Link>
            {index < FLOW_STEPS.length - 1 && (
              <Arrow isCompleted={isCompleted} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Compact version for mobile
export function FlowProgressNavCompact({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentIndex = FLOW_STEPS.findIndex(step => currentPath === step.path);

  return (
    <nav className="flow-progress-nav-compact" aria-label="Timeline Jump progress">
      <div className="flow-nav-dots-row">
        {FLOW_STEPS.map((step, index) => {
          const isCurrent = currentPath === step.path;
          const isCompleted = currentIndex > index;

          return (
            <Link
              key={step.id}
              to={step.path}
              onClick={onNavigate}
              className={`flow-nav-dot-link ${isCurrent ? 'flow-nav-dot-link--current' : ''} ${isCompleted ? 'flow-nav-dot-link--completed' : ''}`}
              aria-label={`${step.label}${isCurrent ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="flow-nav-dot-mobile" />
            </Link>
          );
        })}
      </div>
      {currentIndex >= 0 && (
        <div className="flow-nav-current-label">
          {FLOW_STEPS[currentIndex].label}
        </div>
      )}
    </nav>
  );
}
