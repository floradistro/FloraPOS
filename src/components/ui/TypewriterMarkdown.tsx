'use client';

import React, { useEffect, useState } from 'react';
import { MarkdownMessage } from './MarkdownMessage';

interface TypewriterMarkdownProps {
  content: string;
  isStreaming?: boolean;
  speed?: number; // characters per update
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({ 
  content, 
  isStreaming = false,
  speed = 3 // Show 3 chars at a time
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If not streaming, show immediately
    if (!isStreaming) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
      return;
    }

    // Smooth typewriter effect - show full content immediately but with fade-in
    setDisplayedContent(content);
    setCurrentIndex(content.length);
  }, [content, isStreaming]);

  // Reset when content changes
  useEffect(() => {
    if (content !== displayedContent.slice(0, content.length)) {
      setCurrentIndex(0);
      setDisplayedContent('');
    }
  }, [content]);

  return (
    <div className={`relative ${isStreaming ? 'animate-fade-in' : ''}`}>
      <MarkdownMessage 
        content={displayedContent || content}
        isStreaming={isStreaming}
      />
    </div>
  );
};

// Add fade-in animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }
  `;
  if (!document.head.querySelector('style[data-typewriter]')) {
    style.setAttribute('data-typewriter', 'true');
    document.head.appendChild(style);
  }
}

