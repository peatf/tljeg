import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallPrompt() {
  const { canInstall, promptInstall, dismissed, isStandalone, installed, dismiss } = useInstallPrompt();

  // Don't show if already installed, standalone, or dismissed
  if (isStandalone || installed || dismissed) {
    return null;
  }

  // Check if iOS Safari (no beforeinstallprompt support)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isIOSSafari = isIOS && isSafari;

  // If neither A2HS nor iOS hint applies, hide the prompt
  if (!canInstall && !isIOSSafari) return null;

  return (
    <div className="bg-bone-100 border border-slate-300 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-ink-800 mb-1">
            Add to Home Screen
          </h3>
          <p className="text-sm text-ink-600 mb-3">
            {isIOSSafari 
              ? "Tap the Share button and select 'Add to Home Screen' for quick access."
              : "Add this app to your Home Screen for quick access."
            }
          </p>
          {canInstall && !isIOSSafari && (
            <button
              onClick={promptInstall}
              className="bg-ink-800 text-bone-50 px-4 py-2 rounded text-sm font-medium hover:bg-ink-700 transition-colors"
            >
              Install App
            </button>
          )}
          {isIOSSafari && (
            <div className="text-xs text-ink-500 bg-ink-50 px-3 py-2 rounded border border-ink-200">
              <strong>iOS Instructions:</strong> Tap the Share button (📤) in Safari's toolbar, then scroll down and tap "Add to Home Screen"
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-ink-400 hover:text-ink-600 p-1 rounded transition-colors"
          aria-label="Dismiss install prompt"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
