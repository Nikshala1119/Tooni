import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after a delay if installable
    if (isInstallable && !isDismissed && !isInstalled) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isDismissed, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📱</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Install Tooni</h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Add to home screen for quick access!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 sm:gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm sm:text-base"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
