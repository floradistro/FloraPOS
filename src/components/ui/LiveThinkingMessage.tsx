'use client';

import React, { useEffect, useState } from 'react';

interface LiveThinkingMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const LiveThinkingMessage: React.FC<LiveThinkingMessageProps> = ({ 
  content, 
  isStreaming = false 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // Typewriter effect
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, isStreaming]);

  return (
    <div className="w-full mb-1 px-4 py-1.5 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-1">
          {isStreaming ? (
            <span className="inline-block w-1 h-1 bg-neutral-500 rounded-full animate-pulse" />
          ) : (
            <span className="inline-block w-1 h-1 bg-neutral-600 rounded-full opacity-30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-neutral-500 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {displayedContent || content}
            {isStreaming && displayedContent.length < content.length && (
              <span className="inline-block w-0.5 h-3 bg-neutral-400 ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

