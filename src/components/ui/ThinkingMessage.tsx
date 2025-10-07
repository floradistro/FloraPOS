'use client';

import React from 'react';

interface ThinkingMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ 
  content, 
  isStreaming = true 
}) => {
  return (
    <div className="w-full min-w-0">
      {/* Terminal Style Thinking Container */}
      <div className="relative bg-neutral-950 border-l-0 border-r-0 border-t-0 border-b border-neutral-900 pl-4 pr-4 py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-neutral-700 font-mono">
            {isStreaming ? '→ thinking' : '→ thought'}
          </span>

          {/* Live Indicator */}
          {isStreaming && (
            <span className="text-[10px] text-neutral-800 font-mono">
              ...
            </span>
          )}
        </div>

        {/* Thought Content */}
        <div className="relative max-w-full overflow-hidden">
          <div className="text-[10px] font-mono text-neutral-600 leading-relaxed whitespace-pre-wrap italic break-words overflow-wrap-anywhere">
            {content}
            {isStreaming && (
              <span className="inline-block w-1 h-2 bg-neutral-700 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        </div>

        {/* Completion Indicator */}
        {!isStreaming && (
          <div className="mt-1">
            <span className="text-[10px] text-neutral-800 font-mono">
              ✓
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

