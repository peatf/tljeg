type Chip = {
  id: string;
  text: string;
  source?: 'seed' | 'user';
  method?: 'embedding' | 'fuzzy';
};

function getSourceLabel(source: 'seed' | 'user' | undefined): string {
  if (source === 'seed') return 'anchor';
  if (source === 'user') return 'user';
  return '';
}

export function ChipList({ chips, onSelect }: { chips: Chip[]; onSelect?: (c: Chip) => void }) {
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('mlDebug') === 'true';
  
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const sourceLabel = getSourceLabel(c.source);
        const isAnchor = c.source === 'seed';
        const methodLabel = debugMode && c.method ? c.method : '';
        
        return (
          <button
            key={c.id}
            onClick={() => onSelect?.(c)}
            className="px-3 py-2 min-h-[44px] rounded-full border border-slate-300 text-sm"
            aria-label={`Suggestion ${c.text}${sourceLabel ? ` (${sourceLabel})` : ''}${methodLabel ? ` [${methodLabel}]` : ''}`}
            title={isAnchor ? "Anchor = the first trait or identity shift you want to ground in." : undefined}
          >
            {c.text}
            {sourceLabel ? <span className="text-slate-400"> ({sourceLabel})</span> : null}
            {debugMode && methodLabel ? <span className="text-purple-500"> [{methodLabel}]</span> : null}
          </button>
        );
      })}
    </div>
  );
}
