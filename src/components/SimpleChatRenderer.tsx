'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import TableScrollWrapper from './TableScrollWrapper'
import TableRenderer from './TableRenderer'
import ChartRenderer from './ChartRenderer'

interface SimpleChatRendererProps {
  content: string
  isStreaming?: boolean
}

// Enhanced markdown components for clean styling
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-semibold text-text-primary mb-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-medium text-text-primary mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-medium text-text-primary mb-2">{children}</h3>,
  p: ({ children }: any) => <p className="text-text-primary leading-relaxed mb-2">{children}</p>,
  ul: ({ children }: any) => <ul className="list-none space-y-1 mb-3">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 mb-3 text-text-primary">{children}</ol>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2">
      <span className="text-blue-400 mt-1 text-xs">•</span>
      <span className="text-text-primary">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => <strong className="font-medium text-blue-200">{children}</strong>,
  code: ({ children, className }: any) => {
    const isCodeBlock = className?.includes('language-')
    
    if (isCodeBlock) {
      // Handle special code blocks
      const language = className?.replace('language-', '') || ''
      const codeContent = String(children).replace(/\n$/, '')
      
      if (language === 'json') {
        try {
          const jsonData = JSON.parse(codeContent)
          return <TableRenderer json={codeContent} />
        } catch (e) {
          // If not valid JSON, render as regular code
          return (
            <pre className="bg-black/40 border border-white/[0.08] rounded-lg p-4 overflow-auto max-h-[400px] code-block-scrollbar">
              <code className="text-blue-300 text-[13px] font-mono">{children}</code>
            </pre>
          )
        }
      }
      
      if (language === 'chart') {
        try {
          return <ChartRenderer json={codeContent} />
        } catch (e) {
          return (
            <pre className="bg-black/40 border border-white/[0.08] rounded-lg p-4 overflow-auto max-h-[400px] code-block-scrollbar">
              <code className="text-blue-300 text-[13px] font-mono">{children}</code>
            </pre>
          )
        }
      }
      
      // Regular code block
      return (
        <div className="relative group mb-3">
          <pre className="bg-black/40 border border-white/[0.08] rounded-lg p-4 overflow-auto max-h-[400px] code-block-scrollbar">
            <code className="text-blue-300 text-[13px] font-mono">{children}</code>
          </pre>
          <button 
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              navigator.clipboard.writeText(String(children))
            }}
          >
            Copy
          </button>
        </div>
      )
    }
    
    // Inline code
    return (
      <code className="px-1.5 py-0.5 bg-black/30 border border-white/[0.08] rounded text-blue-300 text-[13px] font-mono">
        {children}
      </code>
    )
  },
  pre: ({ children }: any) => children, // Let code component handle pre styling
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-blue-500/50 pl-4 py-2 bg-blue-900/10 rounded-r mb-3">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <TableScrollWrapper>
      <table className="min-w-max bg-neutral-900/40 border border-white/[0.04] rounded-lg overflow-hidden">
        {children}
      </table>
    </TableScrollWrapper>
  ),
  th: ({ children }: any) => (
    <th className="border-b border-white/[0.08] px-4 py-3 bg-neutral-800/40 text-left text-sm font-medium text-text-primary whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border-b border-white/[0.04] px-4 py-3 text-sm text-text-primary whitespace-nowrap">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}

export default function SimpleChatRenderer({ content, isStreaming = false }: SimpleChatRendererProps) {
  // Debug log to see if component is being called
  console.log('SimpleChatRenderer rendering:', { content: content.substring(0, 100), isStreaming })
  
  return (
    <div className="prose prose-invert prose-sm max-w-none overflow-x-auto markdown-scroll-container">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <span className="typing-cursor" />}
    </div>
  )
}