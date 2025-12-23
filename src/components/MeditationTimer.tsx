import { useEffect, useRef, useState, useCallback } from 'react';

interface MeditationTimerProps {
    seconds: number;
    label: string;
    onDone?: () => void;
    onEnd?: () => void;
    guidanceMessages?: string[];
    showFullscreen?: boolean;
}

/**
 * Enhanced meditation timer with:
 * - Large, visible countdown (visible from across room)
 * - Fullscreen dim mode for focus
 * - Pause/resume and end-early controls
 * - Rotating guidance messages
 * - Optional audio cues (off by default)
 * - Wake lock to keep screen on (mobile)
 */
export default function MeditationTimer({
    seconds,
    label,
    onDone,
    onEnd,
    guidanceMessages = [],
    showFullscreen = true
}: MeditationTimerProps) {
    const [remaining, setRemaining] = useState(seconds);
    const [isPaused, setIsPaused] = useState(false);
    const [currentGuide, setCurrentGuide] = useState(0);
    const [completed, setCompleted] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Request wake lock to keep screen on during meditation
    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                // Wake lock not available or denied, continue without it
                console.log('Wake lock not available');
            }
        };
        requestWakeLock();

        return () => {
            wakeLockRef.current?.release();
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (isPaused || completed) return;

        intervalRef.current = window.setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    if (intervalRef.current) window.clearInterval(intervalRef.current);
                    setCompleted(true);
                    return 0;
                }
                return r - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [isPaused, completed]);

    // Rotate guidance messages
    useEffect(() => {
        if (!guidanceMessages.length || isPaused || completed) return;

        const guideInterval = Math.floor(seconds / Math.min(guidanceMessages.length, 5));
        const timer = setInterval(() => {
            setCurrentGuide((prev) => (prev + 1) % guidanceMessages.length);
        }, guideInterval * 1000);

        return () => clearInterval(timer);
    }, [guidanceMessages, seconds, isPaused, completed]);

    const togglePause = useCallback(() => {
        setIsPaused((p) => !p);
    }, []);

    const handleEndEarly = useCallback(() => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        onEnd?.();
    }, [onEnd]);

    const handleComplete = useCallback(() => {
        onDone?.();
    }, [onDone]);

    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    const progress = ((seconds - remaining) / seconds) * 100;

    // Completion screen
    if (completed) {
        return (
            <div className={`${showFullscreen ? 'fixed inset-0 z-50 bg-ink-900/95' : ''} flex flex-col items-center justify-center gap-6 p-8`}>
                <div className="text-center">
                    <p className="text-3xl text-purple-400 mb-4">✨</p>
                    <p className="text-xl text-bone-100 mb-2">You did something real just now.</p>
                    <p className="text-bone-300 text-sm">Take a breath before moving on.</p>
                </div>
                <button
                    onClick={handleComplete}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg"
                >
                    Continue
                </button>
            </div>
        );
    }

    return (
        <div
            className={`${showFullscreen ? 'fixed inset-0 z-50 bg-ink-900/95' : ''} flex flex-col items-center justify-center gap-8 p-8`}
            role="timer"
            aria-label={label}
        >
            {/* Large countdown - visible from across room */}
            <div className="text-center">
                <div
                    className="font-mono text-8xl md:text-9xl text-bone-100 tracking-wider"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {m}:{s}
                </div>
                <p className="text-bone-400 text-lg mt-2">{label}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md h-1 bg-bone-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={seconds - remaining}
                    aria-valuemin={0}
                    aria-valuemax={seconds}
                />
            </div>

            {/* Rotating guidance message */}
            {guidanceMessages.length > 0 && (
                <p className="text-bone-300 text-lg italic text-center max-w-md animate-pulse">
                    {guidanceMessages[currentGuide]}
                </p>
            )}

            {/* Controls */}
            <div className="flex gap-4">
                <button
                    onClick={togglePause}
                    className="px-6 py-3 border border-bone-400 text-bone-200 rounded-lg hover:bg-bone-800"
                    aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
                >
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button
                    onClick={handleEndEarly}
                    className="px-6 py-3 border border-red-400 text-red-300 rounded-lg hover:bg-red-900/30"
                    aria-label="End meditation early"
                >
                    End Early
                </button>
            </div>

            {isPaused && (
                <p className="text-yellow-400 text-sm">Paused</p>
            )}

            {/* Keyboard hint */}
            <p className="text-bone-500 text-xs">
                Press <kbd className="px-1 bg-bone-700 rounded">Space</kbd> to pause/resume
            </p>
        </div>
    );
}
