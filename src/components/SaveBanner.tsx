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
      className="flex items-center justify-between gap-3 p-3 border rounded bg-green-50 text-green-900"
    >
      <div className="flex-1 flex items-center gap-2">
        <span aria-hidden>✓</span>
        <span className="text-sm">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link to={nextHref} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 min-h-[44px]">
          {nextLabel}
        </Link>
        <button onClick={onClose} className="px-3 py-1.5 rounded border min-h-[44px]">Stay here</button>
      </div>
    </div>
  );
}

