import React from 'react';
import { ErrorType, ERROR_MESSAGES } from '../types';

interface ErrorModalProps {
  errorType: ErrorType;
  characterName: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export default function ErrorModal({ errorType, characterName, onRetry, onDismiss }: ErrorModalProps) {
  if (errorType === ErrorType.NONE) return null;

  const errorInfo = ERROR_MESSAGES[errorType];
  const canRetry = [
    ErrorType.API_CONNECTION_FAILED,
    ErrorType.NETWORK_ERROR,
    ErrorType.SESSION_ENDED,
    ErrorType.MIC_NOT_FOUND,
    ErrorType.UNKNOWN
  ].includes(errorType);

  const isMicPermissionError = errorType === ErrorType.MIC_PERMISSION_DENIED;

  const handleAction = () => {
    if (isMicPermissionError) {
      // Try to open browser settings or re-request permission
      onRetry();
    } else if (canRetry) {
      onRetry();
    } else {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-in"
        role="alertdialog"
        aria-labelledby="error-title"
        aria-describedby="error-message"
      >
        {/* Header with emoji */}
        <div className="bg-gradient-to-r from-red-400 to-orange-400 p-6 text-center">
          <div className="text-6xl sm:text-7xl mb-2 animate-wiggle">
            {errorInfo.emoji}
          </div>
          <h2
            id="error-title"
            className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm"
          >
            {errorInfo.title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p
            id="error-message"
            className="text-slate-700 text-base sm:text-lg leading-relaxed mb-6"
          >
            {errorInfo.message}
          </p>

          {/* Sad character illustration */}
          <div className="text-4xl mb-6 opacity-60">
            {characterName === 'Bluey' ? '🐕💭' : '👦💭'}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry || isMicPermissionError ? (
              <>
                <button
                  onClick={onDismiss}
                  className="flex-1 px-6 py-3 text-slate-600 font-semibold rounded-full border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={handleAction}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  {errorInfo.action}
                </button>
              </>
            ) : (
              <button
                onClick={onDismiss}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                {errorInfo.action}
              </button>
            )}
          </div>

          {/* Help text for mic permission */}
          {isMicPermissionError && (
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Look for the 🎤 or 🔒 icon in your browser's address bar and click "Allow"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
