'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  isStreaming = false 
}) => {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 MarkdownMessage update - Content length:', content?.length, 'Streaming:', isStreaming);
    setDisplayedContent(content);
  }, [content]);

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBlock(language);
      setTimeout(() => setCopiedBlock(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="markdown-content max-w-full overflow-hidden">
      {!content && isStreaming ? (
        <span className="text-neutral-700 font-mono text-xs">processing...</span>
      ) : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom renderers for different markdown elements
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            
            return !inline ? (
              <div className="relative group my-3 rounded-lg overflow-hidden border border-neutral-800/50 bg-neutral-950">
                {/* Code block header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/50 border-b border-neutral-800/50">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {language || 'code'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeString, language)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-800/50"
                    title="Copy code"
                  >
                    {copiedBlock === language ? (
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Code content */}
                <div className="overflow-x-auto">
                  <pre className={`${className} !bg-transparent !m-0`} {...props}>
                    <code className={className}>{children}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 bg-neutral-800/60 text-blue-400 font-mono text-[11px] rounded" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed text-[13px] text-neutral-300">
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold mb-3 mt-4 first:mt-0 text-white" style={{ fontFamily: 'Tiempo, serif' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-white" style={{ fontFamily: 'Tiempo, serif' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium mb-2 mt-2 first:mt-0 text-neutral-200" style={{ fontFamily: 'Tiempo, serif' }}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-4 mb-3 space-y-1 text-neutral-300 marker:text-neutral-600">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 mb-3 space-y-1 text-neutral-300 marker:text-neutral-600">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-[13px] pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-blue-500/30 bg-blue-500/5 pl-4 pr-3 py-2 my-3 text-neutral-400 rounded-r">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-400">
              {children}
            </em>
          ),
          hr: () => (
            <hr className="border-neutral-800/50 my-4" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-neutral-800/50">
              <table className="min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-900/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-800/30">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-800/20 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[12px] text-neutral-400">
              {children}
            </td>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-block w-1.5 h-3 bg-neutral-500 animate-pulse ml-1 align-middle" />
      )}

      <style jsx global>{`
        .markdown-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .markdown-content pre {
          background-color: #0a0a0a;
          padding: 0.75rem;
          overflow-x: auto;
          margin: 0;
          border-radius: 0;
        }

        .markdown-content code {
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .markdown-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: #d4d4d8;
        }

        /* Syntax highlighting - Cursor AI style */
        .markdown-content .hljs {
          background: transparent;
          color: #d4d4d8;
        }

        .markdown-content .hljs-comment {
          color: #6b7280;
          font-style: italic;
        }

        .markdown-content .hljs-keyword,
        .markdown-content .hljs-selector-tag {
          color: #c084fc;
          font-weight: 500;
        }

        .markdown-content .hljs-title,
        .markdown-content .hljs-title.class_,
        .markdown-content .hljs-title.function_ {
          color: #60a5fa;
        }

        .markdown-content .hljs-string,
        .markdown-content .hljs-attr {
          color: #34d399;
        }

        .markdown-content .hljs-number,
        .markdown-content .hljs-literal {
          color: #f59e0b;
        }

        .markdown-content .hljs-function {
          color: #60a5fa;
        }

        .markdown-content .hljs-params {
          color: #d4d4d8;
        }

        .markdown-content .hljs-variable,
        .markdown-content .hljs-tag {
          color: #e879f9;
        }

        .markdown-content .hljs-built_in,
        .markdown-content .hljs-name {
          color: #60a5fa;
        }

        .markdown-content .hljs-operator,
        .markdown-content .hljs-punctuation {
          color: #9ca3af;
        }

        .markdown-content .hljs-property,
        .markdown-content .hljs-attribute {
          color: #fbbf24;
        }

        .markdown-content .hljs-meta {
          color: #6b7280;
        }

        .markdown-content .hljs-selector-class,
        .markdown-content .hljs-selector-id {
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
};

