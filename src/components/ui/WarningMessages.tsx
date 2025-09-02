'use client';

import React from 'react';

interface WarningMessagesProps {
  warnings: string[];
  onDismiss: () => void;
}

export const WarningMessages: React.FC<WarningMessagesProps> = ({ warnings, onDismiss }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="mb-3 p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg mx-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          {warnings.map((warning, index) => (
            <p key={index} className="text-amber-200 text-sm">{warning}</p>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto text-amber-400 hover:text-amber-300 transition-colors"
          title="Dismiss warnings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
