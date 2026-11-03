import type { CSSProperties } from 'react';

type Props = {
  text: string;
  /** Seconds before this word starts to come apart, so several words don't move in lockstep. */
  delay?: number;
};

// Small fixed offsets per letter, so a word comes apart the same way on every render.
function scatter(i: number, seed: number) {
  const a = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  const b = Math.sin((i + 1) * 39.3468 + seed * 11.135) * 24634.6345;
  return { x: (a - Math.floor(a)) * 2 - 1, y: (b - Math.floor(b)) * 2 - 1, lag: a - Math.floor(a) };
}

/** A label in the VOID: the letters slowly drift apart until the word is only letters,
    then each letter dissolves on its own. Timed to finish inside a 90-second hold. */
export default function LetterDrift({ text, delay = 0 }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  // The spread is capped in CSS by the longest word, so each line stays on screen.
  const longest = Math.max(1, ...words.map((w) => Array.from(w).length));
  let n = 0;

  return (
    <p className="drift-word" aria-label={text} style={{ '--n': longest, '--delay': `${delay}s` } as CSSProperties}>
      {words.map((word, w) => (
        <span key={w} className="drift-group" aria-hidden>
          {Array.from(word).map((ch) => {
            const s = scatter(n++, text.length);
            return (
              <span
                key={n}
                className="drift-letter"
                style={{ '--dx': `${(s.x * 1.4).toFixed(2)}em`, '--dy': `${(s.y * 1.1).toFixed(2)}em`, '--lag': `${(s.lag * 8).toFixed(1)}s` } as CSSProperties}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
