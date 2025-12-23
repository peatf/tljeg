import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    duration?: number;
    onClose?: () => void;
}

/**
 * Toast notification component for save confirmations and feedback.
 * Auto-dismisses after duration (default 2000ms).
 */
export default function Toast({ message, duration = 2000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setExiting(true);
        }, duration - 300);

        const hideTimer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(hideTimer);
        };
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-ink-900 text-bone-50 rounded-lg shadow-lg z-50 transition-all duration-300 ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
        >
            {message}
        </div>
    );
}
