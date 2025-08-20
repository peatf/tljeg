import { useId, useState } from 'react';

type Props = {
  label?: string;
  children: React.ReactNode;
  className?: string;
};

export default function InlineHelp({ label = "What’s this?", children, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <button
        type="button"
        className="text-ink-600 underline decoration-dotted text-xs"
        aria-expanded={open}
        aria-controls={`help-${id}`}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <span
          id={`help-${id}`}
          role="note"
          className="text-xs text-ink-700 bg-bone-50 border border-bone-200 rounded px-2 py-1"
        >
          {children}
        </span>
      )}
    </span>
  );
}

