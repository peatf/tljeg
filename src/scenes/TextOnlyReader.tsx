import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePager } from '../hooks/usePager';
// Vite will bundle this local MD as a string
// @ts-ignore
import guide from '../content/guide.md?raw';

type Page = {
  title?: string;
  subtitle?: string;
  body: string;
};
function splitByHeadings(md: string): Page[] | null {
  const headingRegex = /^(#{1,2})\s+(.+)$/gm;
  const matches: { index: number; level: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(md)) !== null) {
    matches.push({ index: m.index, level: m[1].length, text: m[2].trim() });
  }
  if (matches.length === 0) return null;
  const pages: Page[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const slice = md.slice(start, end).trim();
    const lines = slice.split(/\r?\n/).filter(Boolean);
    // First line is a heading like # Title or ## Title
    const headingLine = lines[0] || '';
    const title = headingLine.replace(/^#{1,2}\s+/, '').trim();
    // Subtitle: first paragraph line after heading (until blank)
    let subtitle: string | undefined;
    const restLines = lines.slice(1);
    for (const line of restLines) {
      if (!line.trim()) break;
      // Use the first non-empty non-heading shortish line as subtitle
      if (!/^#/.test(line)) {
        subtitle = line.trim();
        break;
      }
    }
    // Body = content after heading (and not repeating subtitle if present)
    let bodyStart = 1;
    if (subtitle) {
      bodyStart = restLines.findIndex((l) => l.trim() === subtitle) + 2; // skip blank after subtitle if present
      if (bodyStart < 2) bodyStart = 1;
    }
    const body = restLines.slice(bodyStart - 1).join('\n').trim();
    pages.push({ title, subtitle, body });
  }
  return pages;
}

function splitByPageMarkers(raw: string): Page[] {
  // Remove any literal Page XX lines from the content entirely
  const content = raw.replace(/^\s*Page\s*\d+.*$/gim, '').trim();
  // Split by where Page markers used to be, using original as splitter as fallback
  const sections = raw.split(/\n\s*Page\s*\d+.*\n/gi);
  const cleaned = (sections.length > 1 ? sections : [content])
    .map((s) => s.replace(/^\s*Page\s*\d+.*$/gim, '').trim())
    .filter((s) => s.length > 0);
  return cleaned.map(toTitledPage);
}

function toTitledPage(section: string): Page {
  const lines = section.split(/\r?\n/);
  const trimmed = lines.map((l) => l.trim());
  let title: string | undefined;
  let subtitle: string | undefined;
  let i = 0;
  while (i < trimmed.length && trimmed[i] === '') i++;

  const isImageMarkdown = (s: string) => /^!\[[^\]]*\]\([^\)]*\)/.test(s);

  // Only treat the first line as a title if it's not an image
  if (i < trimmed.length && trimmed[i] && !isImageMarkdown(trimmed[i])) {
    title = trimmed[i];
    i++;
    while (i < trimmed.length && trimmed[i] === '') i++;
    // Optional subtitle: short line of text (not an image)
    if (i < trimmed.length && trimmed[i] && trimmed[i].length <= 120 && !isImageMarkdown(trimmed[i])) {
      subtitle = trimmed[i];
      i++;
    }
  }

  // Body starts at the first blank line after the first block if we had a title/subtitle
  const firstBlank = lines.findIndex((l, idx) => idx >= Math.max(0, i - 1) && l.trim() === '');
  const bodyLines = firstBlank >= 0 ? lines.slice(firstBlank + 1) : lines.slice(i);
  const body = bodyLines.join('\n').replace(/^\s*Page\s*\d+.*$/gim, '').trim();
  return { title, subtitle, body };
}

function parseGuideIntoPages(content: string): Page[] {
  // Prefer splitting by top-level headings if present
  const byHeadings = splitByHeadings(content);
  if (byHeadings && byHeadings.length > 0) return byHeadings;
  // Fallback to Page markers, with title/subtitle heuristics
  return splitByPageMarkers(content);
}

export default function TextOnlyReader() {
  const [pages, setPages] = useState<Page[]>([]);
  const { currentPage, totalPages, goNext, goPrev, goToPage, canGoNext, canGoPrev } = usePager(pages.length, 'text-reader-position');

  useEffect(() => {
    const parsedPages = parseGuideIntoPages(guide);
    setPages(parsedPages);
  }, []);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        goPrev();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrev, goNext, goPrev]);

  if (pages.length === 0) {
    return <div>Loading...</div>;
  }

  const page = pages[currentPage];
  const pageTitle = page?.title;
  const pageSubtitle = page?.subtitle;

  return (
    <div className="grid gap-4 max-w-3xl mx-auto px-3 sm:px-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold doto-base doto-700">Timeline Jumping Guide</h1>
        <div className="text-sm text-ink-600" aria-live="polite">
          Page {currentPage + 1} of {totalPages}
        </div>
      </div>

      <header className="grid gap-1">
        {pageTitle && <h2 className="text-lg sm:text-xl font-semibold font-humanist leading-snug">{pageTitle}</h2>}
        {pageSubtitle && <p className="text-ink-700 text-sm sm:text-base">{pageSubtitle}</p>}
      </header>
      
      <article className="max-w-none font-humanist text-[15px] sm:text-base leading-relaxed min-h-[320px]">
        <ReactMarkdown>{page?.body || ''}</ReactMarkdown>
      </article>

      <div className="h-2" />
      <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-slate-200 safe-bottom">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goPrev}
              disabled={!canGoPrev}
              className="px-4 py-3 min-h-[44px] border rounded w-28 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              ← Back
            </button>
            <div className="text-xs sm:text-sm text-ink-600">Use ← → keys to navigate</div>
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="px-4 py-3 min-h-[44px] border rounded w-28 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex gap-1" role="navigation" aria-label="Page indicators">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`w-2.5 h-2.5 rounded-full ${i === currentPage ? 'bg-ink-800' : 'bg-slate-300'}`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
