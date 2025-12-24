import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  message?: string;
  nextHref: string;
  nextLabel?: string;
  onClose?: () => void;
};

/** Inline success banner with CTA to continue to next scene. */
export default function SaveBanner({ message = 'Saved. Ready for the next step?', nextHref, nextLabel = 'Continue', onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Move focus to the banner for SR users
    const el = ref.current;
    if (el) {
      el.focus();
    }
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl section-card--elevated"
      style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.7) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="save-confirmation" aria-hidden>
          <svg className="save-confirmation-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,8 7,12 13,4" />
          </svg>
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{message}</span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Link
          to={nextHref}
          className="btn-flow flex-1 sm:flex-none text-center flex items-center justify-center"
          style={{
            background: 'var(--color-accent-organic)',
            color: 'white',
            borderColor: 'var(--color-accent-organic)',
          }}
        >
          {nextLabel}
        </Link>
        <button
          onClick={onClose}
          className="btn-quiet flex items-center justify-center"
        >
          Stay here
        </button>
      </div>
    </div>
  );
}

