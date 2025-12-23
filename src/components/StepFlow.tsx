import { useNavigate, useLocation } from 'react-router-dom';

interface StepFlowProps {
    nextStep?: {
        path: string;
        label: string;
    };
    alternateStep?: {
        path: string;
        label: string;
    };
    showCompletion?: boolean;
    completionMessage?: string;
}

/**
 * StepFlow provides clear "what's next" guidance at the end of each scene.
 * Eliminates dead ends by always showing the user where to go.
 */
export default function StepFlow({
    nextStep,
    alternateStep,
    showCompletion,
    completionMessage = "You did something real just now."
}: StepFlowProps) {
    const navigate = useNavigate();
    const location = useLocation();

    if (showCompletion) {
        return (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg text-center" role="status" aria-live="polite">
                <p className="text-lg text-purple-800 font-medium mb-3">{completionMessage}</p>
                {nextStep && (
                    <button
                        onClick={() => navigate(nextStep.path)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                        {nextStep.label}
                    </button>
                )}
            </div>
        );
    }

    if (!nextStep && !alternateStep) return null;

    return (
        <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-sm text-ink-600 mb-3">Ready to continue?</p>
            <div className="flex flex-wrap gap-3">
                {nextStep && (
                    <button
                        onClick={() => navigate(nextStep.path)}
                        className="px-4 py-2 bg-ink-900 text-bone-50 rounded hover:bg-ink-800 inline-flex items-center gap-2"
                    >
                        {nextStep.label} <span aria-hidden>→</span>
                    </button>
                )}
                {alternateStep && (
                    <button
                        onClick={() => navigate(alternateStep.path)}
                        className="px-4 py-2 border rounded hover:bg-bone-50"
                    >
                        {alternateStep.label}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Step flow configuration for the main practice path.
 * Maps each scene to its natural next step.
 */
export const PRACTICE_FLOW = {
    safety: {
        next: { path: '/artifact/clarity', label: 'Continue to Clarity' },
        alternate: { path: '/artifact/void', label: 'Drop into VOID first' }
    },
    clarity: {
        next: { path: '/artifact/calibration', label: 'Continue to Grounding' },
        alternate: { path: '/artifact/void', label: 'Take a pause in VOID' }
    },
    calibration: {
        next: { path: '/artifact/void', label: 'Continue to VOID' },
        alternate: { path: '/artifact/implementation', label: 'Skip to Action' }
    },
    void: {
        next: { path: '/artifact/implementation', label: 'Continue to Action' },
        alternate: { path: '/artifact/clarity', label: 'Return to Clarity' }
    },
    implementation: {
        next: { path: '/artifact', label: 'Return to Map' },
        completion: true,
        completionMessage: "You've completed today's practice. Take a breath."
    }
} as const;
