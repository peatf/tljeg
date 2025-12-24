import { useState, useEffect } from 'react';
import { listEntries } from '../storage/storage';

interface PracticeSession {
    scene: string;
    timestamp: number;
    label?: string;
}

interface ResumePromptProps {
    onResume?: (path: string) => void;
    onStartFresh?: () => void;
}

/**
 * Checks user's last practice and suggests what to do next.
 * Shows for return visitors who have prior session data.
 */
export default function ResumePrompt({ onResume, onStartFresh }: ResumePromptProps) {
    const [lastPractice, setLastPractice] = useState<PracticeSession | null>(null);
    const [suggestedNext, setSuggestedNext] = useState<{ path: string; label: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkHistory() {
            try {
                const entries = await listEntries();
                if (!entries.length) {
                    setLoading(false);
                    return;
                }

                // Find most recent entry
                const sorted = entries.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
                const latest = sorted[0];

                if (latest) {
                    const scene = latest.scene || 'unknown';
                    setLastPractice({
                        scene,
                        timestamp: latest.timestamp,
                        label: latest.content?.selectedTrait || latest.content?.label
                    });

                    // Suggest next step based on last scene
                    const nextSteps: Record<string, { path: string; label: string }> = {
                        safety: { path: '/artifact/clarity', label: 'Continue to Clarity' },
                        clarity: { path: '/artifact/calibration', label: 'Continue to Grounding' },
                        calibration: { path: '/artifact/void', label: 'Continue to VOID' },
                        void: { path: '/artifact/implementation', label: 'Continue to Action' },
                        implementation: { path: '/artifact/safety', label: 'Start a new practice' }
                    };
                    setSuggestedNext(nextSteps[scene] || { path: '/artifact/safety', label: 'Continue your practice' });
                }
            } catch (err) {
                console.error('Failed to load practice history', err);
            } finally {
                setLoading(false);
            }
        }
        checkHistory();
    }, []);

    if (loading) return null;
    if (!lastPractice) return null;

    const daysSince = Math.floor((Date.now() - lastPractice.timestamp) / (1000 * 60 * 60 * 24));
    const timeAgo = daysSince === 0 ? 'earlier today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`;

    return (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800 mb-3">
                Welcome back! You practiced {timeAgo}
                {lastPractice.label && <span className="font-medium"> - {lastPractice.label}</span>}
            </p>
            <div className="flex flex-wrap gap-3">
                {suggestedNext && (
                    <a
                        href={suggestedNext.path}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        onClick={(e) => {
                            if (onResume) {
                                e.preventDefault();
                                onResume(suggestedNext.path);
                            }
                        }}
                    >
                        {suggestedNext.label} →
                    </a>
                )}
                <a
                    href="/artifact/safety"
                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded hover:bg-purple-100"
                    onClick={(e) => {
                        if (onStartFresh) {
                            e.preventDefault();
                            onStartFresh();
                        }
                    }}
                >
                    Start fresh
                </a>
            </div>
        </div>
    );
}

/**
 * Encouraging empty state for first-time users.
 */
export function EmptyState({ scene, message }: { scene: string; message?: string }) {
    const defaultMessages: Record<string, string> = {
        safety: "This is where your journey begins. Take your time.",
        clarity: "Your traits will grow here. Every insight matters.",
        calibration: "Evidence starts small. One moment at a time.",
        void: "This space is for letting go. It will hold what you release.",
        implementation: "Your actions will gather here. Start with something tiny.",
        default: "This is where your evidence will grow."
    };

    return (
        <div className="p-6 text-center bg-bone-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-ink-600 italic">
                {message || defaultMessages[scene] || defaultMessages.default}
            </p>
        </div>
    );
}
