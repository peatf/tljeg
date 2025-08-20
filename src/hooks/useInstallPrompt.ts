import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Navigator interface for iOS standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

interface UseInstallPromptReturn {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  dismissed: boolean;
  isStandalone: boolean;
  installed: boolean;
  dismiss: () => void;
}

const DISMISSAL_KEY = 'tja_install_prompt_dismissed_v1';

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Check if already dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    if (dismissed) {
      setDismissed(true);
    }
  }, []);

  // Check if app is already installed/standalone
  useEffect(() => {
    const checkStandalone = () => {
      // Tauri (native wrapper) — treat as standalone
      if ((window as any).__TAURI__ || (window as any).__TAURI_IPC__) {
        setIsStandalone(true);
        return;
      }

      // iOS Safari
      if ((window.navigator as any).standalone) {
        setIsStandalone(true);
        return;
      }
      
      // Other browsers
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsStandalone(true);
        return;
      }
      
      // Check if running in a PWA window
      if (window.matchMedia('(display-mode: window-controls-overlay)').matches) {
        setIsStandalone(true);
        return;
      }
    };

    checkStandalone();
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstalled(true);
        setCanInstall(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error prompting install:', error);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSAL_KEY, 'true');
  };

  return {
    canInstall,
    promptInstall,
    dismissed,
    isStandalone,
    installed,
    dismiss
  };
}
