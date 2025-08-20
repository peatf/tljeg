import { useState, useEffect } from 'react';

interface LabelInsightsProps {
  labels: string[];
  onClusterSuggestion?: (cluster: { theme: string; labels: string[] }) => void;
  showReflectionPrompts?: boolean;
  onReflectionPrompt?: (prompt: string) => void;
}

interface LabelCluster {
  theme: string;
  labels: string[];
  color: string;
}

export default function LabelInsights({ 
  labels, 
  onClusterSuggestion,
  showReflectionPrompts = false,
  onReflectionPrompt 
}: LabelInsightsProps) {
  const [clusters, setClusters] = useState<LabelCluster[]>([]);
  const [reflectionPrompts, setReflectionPrompts] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  // Simple clustering logic based on common themes
  const clusterLabels = (labels: string[]): LabelCluster[] => {
    const themes: { [key: string]: { labels: string[]; color: string } } = {};
    
    const themeKeywords = {
      'self-pressure': ['failure', 'not enough', 'should', 'must', 'behind', 'inadequate', 'insufficient'],
      'overwhelm': ['too much', 'overwhelming', 'stressed', 'busy', 'chaotic', 'heavy'],
      'energy': ['tired', 'exhausted', 'drained', 'low energy', 'fatigued'],
      'worth': ['worthless', 'useless', 'unworthy', 'inadequate', 'not good enough'],
      'fear': ['scared', 'anxious', 'worried', 'afraid', 'nervous', 'uncertain'],
      'productivity': ['lazy', 'procrastinating', 'unproductive', 'slow', 'inefficient']
    };
    
    const themeColors = {
      'self-pressure': 'bg-stone-50 border-l-4 border-l-stone-400',
      'overwhelm': 'bg-zinc-50 border-l-4 border-l-zinc-400',
      'energy': 'bg-slate-50 border-l-4 border-l-slate-400',
      'worth': 'bg-neutral-50 border-l-4 border-l-neutral-400',
      'fear': 'bg-gray-50 border-l-4 border-l-gray-400',
      'productivity': 'bg-stone-50 border-l-4 border-l-stone-500'
    };

    labels.forEach(label => {
      const lowercaseLabel = label.toLowerCase();
      let assigned = false;
      
      for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(keyword => lowercaseLabel.includes(keyword))) {
          if (!themes[theme]) {
            themes[theme] = { labels: [], color: themeColors[theme as keyof typeof themeColors] };
          }
          themes[theme].labels.push(label);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        if (!themes['other']) {
          themes['other'] = { labels: [], color: 'bg-stone-50 border border-stone-200' };
        }
        themes['other'].labels.push(label);
      }
    });

    return Object.entries(themes)
      .filter(([_, data]) => data.labels.length > 0)
      .map(([theme, data]) => ({
        theme: theme === 'other' ? 'Other' : theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' '),
        labels: data.labels,
        color: data.color
      }));
  };

  // Generate reflection prompts based on label themes
  const generateReflectionPrompts = (clusters: LabelCluster[]): string[] => {
    const prompts: string[] = [];
    
    clusters.forEach(cluster => {
      switch (cluster.theme.toLowerCase().replace(' ', '-')) {
        case 'self-pressure':
          prompts.push(`Notice how "${cluster.labels[0]}" feels in your body now. Has the pressure softened?`);
          break;
        case 'overwhelm':
          prompts.push(`Where do you feel spaciousness now that "${cluster.labels[0]}" has dissolved?`);
          break;
        case 'energy':
          prompts.push(`What quality of aliveness is present now, beyond "${cluster.labels[0]}"?`);
          break;
        case 'worth':
          prompts.push(`What truth about your inherent value feels accessible now?`);
          break;
        case 'fear':
          prompts.push(`What possibilities feel safer to consider now that "${cluster.labels[0]}" has melted?`);
          break;
        case 'productivity':
          prompts.push(`What natural motivation wants to emerge from this clearer space?`);
          break;
        default:
          prompts.push(`How has your relationship to "${cluster.labels[0]}" shifted?`);
      }
    });
    
    return prompts;
  };

  useEffect(() => {
    if (labels.length > 1) {
      const newClusters = clusterLabels(labels);
      setClusters(newClusters);
      
      if (showReflectionPrompts) {
        setReflectionPrompts(generateReflectionPrompts(newClusters));
      }
    }
  }, [labels, showReflectionPrompts]);

  if (labels.length < 2) return null;

  return (
    <div className="grid gap-4">
      <button
        onClick={() => setShowInsights(!showInsights)}
        className="text-sm text-stone-600 hover:text-stone-800 text-left font-mono tracking-wide"
      >
        {showInsights ? '▼' : '▶'} insights {clusters.length > 0 && `(${clusters.length} themes)`}
      </button>
      
      {showInsights && clusters.length > 0 && (
        <div className="grid gap-3 p-4 bg-stone-50 border border-stone-200">
          <h4 className="font-medium text-stone-800 tracking-wide">themes</h4>
          <div className="grid gap-2">
            {clusters.map((cluster, index) => (
              <div key={index} className={`p-3 rounded border ${cluster.color}`}>
                <div className="font-medium text-sm mb-1 text-stone-800">{cluster.theme}</div>
                <div className="text-xs text-stone-600 font-mono">
                  {cluster.labels.join(', ')}
                </div>
                {onClusterSuggestion && (
                  <button
                    onClick={() => onClusterSuggestion(cluster)}
                    className="text-xs text-stone-600 hover:text-stone-800 mt-1 underline"
                  >
                    focus on this
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showReflectionPrompts && reflectionPrompts.length > 0 && (
        <div className="grid gap-3 p-4 bg-stone-25 border border-stone-200">
          <h4 className="font-medium text-stone-800 tracking-wide">reflection prompts</h4>
          <div className="grid gap-2">
            {reflectionPrompts.map((prompt, index) => (
              <div key={index} className="text-sm text-stone-700 p-3 bg-white border-l-2 border-l-stone-300">
                {prompt}
                {onReflectionPrompt && (
                  <button
                    onClick={() => onReflectionPrompt(prompt)}
                    className="block text-xs text-stone-600 hover:text-stone-800 mt-2 underline"
                  >
                    use this prompt
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}