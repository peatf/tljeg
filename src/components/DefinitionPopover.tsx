import { useEffect, useId, useRef, useState } from 'react';

type Props = {
  term: string;
  children: React.ReactNode;
  className?: string;
};

export default function DefinitionPopover({ term, children, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (open && popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <span className={`inline-flex items-center relative ${className}`}>
      <button
        type="button"
        className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`def-${id}`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <div
          ref={popRef}
          id={`def-${id}`}
          role="dialog"
          aria-label={`${term} definition`}
          className="z-20 absolute mt-8 max-w-xs p-3 border rounded bg-white shadow"
        >
          <div className="text-xs text-ink-800">
            <strong className="block mb-1">{term}</strong>
            <div>{children}</div>
          </div>
          <div className="mt-2 text-right">
            <button className="text-xs underline" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </span>
  );
}
