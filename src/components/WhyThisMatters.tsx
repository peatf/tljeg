import { useState, ReactNode } from 'react';

interface WhyThisMattersProps {
    children: ReactNode;
    defaultExpanded?: boolean;
}

/**
 * Collapsible callout for "why this matters" explanations.
 * Essential for first-timers, can be collapsed by repeat users.
 * Remembers preference in localStorage.
 */
export default function WhyThisMatters({ children, defaultExpanded = true }: WhyThisMattersProps) {
    const [expanded, setExpanded] = useState(() => {
        const stored = localStorage.getItem('tlja-callouts-expanded');
        return stored !== null ? stored === 'true' : defaultExpanded;
    });

    const toggle = () => {
        const next = !expanded;
        setExpanded(next);
        localStorage.setItem('tlja-callouts-expanded', String(next));
    };

    return (
        <div className="p-4 bg-bone-50 rounded-lg border border-bone-200">
            <button
                onClick={toggle}
                className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 w-full text-left"
                aria-expanded={expanded}
            >
                <span className="text-xs">{expanded ? '▼' : '▶'}</span>
                <span className="font-medium">Why this matters</span>
            </button>
            {expanded && (
                <div className="mt-2 text-sm text-ink-700 leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * Completion celebration - emotional punctuation, not fireworks.
 * Shows after meaningful practice moments.
 */
export function CompletionMoment({
    message = "You did something real just now.",
    subtitle = "Take a breath before moving on."
}: {
    message?: string;
    subtitle?: string;
}) {
    return (
        <div className="text-center py-8" role="status" aria-live="polite">
            <p className="text-3xl mb-2">✨</p>
            <p className="text-lg text-ink-800 font-medium mb-1">{message}</p>
            <p className="text-sm text-ink-500">{subtitle}</p>
        </div>
    );
}

/**
 * Quick action for common next steps.
 */
export function QuickAction({
    label,
    href,
    variant = 'primary'
}: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
}) {
    const baseClasses = "px-4 py-2 rounded transition-colors";
    const variantClasses = variant === 'primary'
        ? "bg-ink-900 text-bone-50 hover:bg-ink-800"
        : "border border-slate-300 hover:bg-bone-50";

    return (
        <a href={href} className={`${baseClasses} ${variantClasses}`}>
            {label}
        </a>
    );
}
