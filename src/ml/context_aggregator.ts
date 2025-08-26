import traitSynonyms from './trait_synonyms.json';

export type ContextBundle = {
  inspiration?: string;
  working?: string;
  recurringThought?: string;
  jealousy?: string;
  recentMoment?: string;
  feltNatural?: string;
};

export type ContextWeights = Record<keyof ContextBundle, number>;

export const DEFAULT_CONTEXT_WEIGHTS: ContextWeights = {
  inspiration: 0.4,
  working: 0.2,
  recurringThought: 0.2,
  jealousy: 0.2,
  recentMoment: 0.05,
  feltNatural: 0.05,
};

export function aggregateContext(
  context: ContextBundle,
  weights: ContextWeights = DEFAULT_CONTEXT_WEIGHTS
): string {
  const contextParts: string[] = [];
  
  Object.entries(context).forEach(([key, value]) => {
    if (value?.trim()) {
      const weight = weights[key as keyof ContextBundle] || 0.1;
      const repeats = Math.ceil(weight * 10);
      for (let i = 0; i < repeats; i++) {
        contextParts.push(value.trim());
      }
    }
  });
  
  return contextParts.join(' ');
}

export function checkSynonymMatch(traitText: string, contextBundle: ContextBundle): boolean {
  const traitLower = traitText.toLowerCase();
  const synonymsData = (traitSynonyms as any).traits[traitLower];
  
  if (!synonymsData) return false;

  const allSynonyms = [
    synonymsData.canonical,
    ...synonymsData.synonyms,
    ...synonymsData.aliases
  ];

  const contextText = Object.values(contextBundle)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return allSynonyms.some(synonym =>
    contextText.includes(synonym.toLowerCase())
  );
}

export function getContextFields(context: ContextBundle): string[] {
  return Object.entries(context)
    .filter(([_, value]) => value?.trim())
    .map(([key, _]) => key);
}

export function calculateContextLength(context: ContextBundle): number {
  return Object.values(context)
    .filter(Boolean)
    .join(' ')
    .length;
}