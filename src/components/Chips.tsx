type Chip = {
  id: string;
  text: string;
  source?: 'seed' | 'user';
  method?: 'embedding' | 'fuzzy';
};

function getSourceLabel(source: 'seed' | 'user' | undefined): string {
  // Hide source labels from regular users - only visible in debug mode
  // Previously showed "(anchor)" and "(user)" which added visual noise
  return '';
}

export function ChipList({ chips, onSelect, selected }: { chips: Chip[]; onSelect?: (c: Chip) => void; selected?: string | null }) {
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('mlDebug') === 'true';

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const sourceLabel = getSourceLabel(c.source);
        const isAnchor = c.source === 'seed';
        const methodLabel = debugMode && c.method ? c.method : '';

        const isSelected = selected != null && selected === c.text;

        return (
          <button
            key={c.id}
            onClick={() => onSelect?.(c)}
            className={`chip ${isSelected ? 'chip-interactive' : 'chip-suggestion'}`}
            aria-pressed={selected !== undefined ? isSelected : undefined}
            aria-label={`Suggestion ${c.text}${sourceLabel ? ` (${sourceLabel})` : ''}${methodLabel ? ` [${methodLabel}]` : ''}`}
            title={isAnchor ? "Anchor = the first trait or identity shift you want to ground in." : undefined}
          >
            {c.text}
            {sourceLabel ? <span className="text-ink-400"> ({sourceLabel})</span> : null}
            {debugMode && methodLabel ? <span className="text-cobalt-500"> [{methodLabel}]</span> : null}
          </button>
        );
      })}
    </div>
  );
}
