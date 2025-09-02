import { Link } from 'react-router-dom';

type Props = {
  onSave?: () => void;
  saveLabel?: string;
  continueHref: string;
  continueLabel?: string;
  disabled?: boolean;
};

/** Sticky bottom action bar for mobile (Save / Continue). */
export default function MobileActions({ onSave, saveLabel = 'Save', continueHref, continueLabel = 'Continue', disabled }: Props) {
  return (
    <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t border-slate-200 safe-bottom px-3 py-2">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <button onClick={onSave} disabled={disabled} className="flex-1 px-4 py-2 border rounded touch-target disabled:opacity-50" aria-label={saveLabel}>
          {saveLabel}
        </button>
        <Link to={continueHref} className="flex-1 px-4 py-2 bg-ink-800 text-white rounded touch-target text-center" aria-label={continueLabel}>
          {continueLabel}
        </Link>
      </div>
    </div>
  );
}

