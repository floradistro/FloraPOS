'use client';

import React from 'react';

interface ToolExecutionMessageProps {
  toolName: string;
  status: 'running' | 'complete' | 'error';
  result?: string;
  duration?: number;
}

export const ToolExecutionMessage: React.FC<ToolExecutionMessageProps> = ({ 
  toolName, 
  status,
  result,
  duration
}) => {
  return (
    <div className="w-full mb-1 px-4 py-1 opacity-50 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {status === 'running' ? (
            <span className="inline-block w-1 h-1 bg-neutral-400 rounded-full animate-pulse" />
          ) : status === 'complete' ? (
            <span className="text-neutral-500 text-[10px]">✓</span>
          ) : (
            <span className="text-neutral-500 text-[10px]">✗</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-neutral-500 font-mono">
            {toolName}
          </span>
          {result && (
            <span className="text-[10px] text-neutral-600 ml-2">
              {result}
            </span>
          )}
        </div>
        {duration && (
          <span className="text-[9px] text-neutral-700 font-mono">
            {duration}ms
          </span>
        )}
      </div>
    </div>
  );
};

