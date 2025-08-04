'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Disclosure } from '@headlessui/react'
import { useReactToPrint } from 'react-to-print'
import SimpleChartRenderer from './SimpleChartRenderer'
import TableRenderer from './TableRenderer'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatInputProps {
  onLoadingChange?: (isLoading: boolean) => void
}

interface ContentSection {
  type: 'markdown' | 'collapsible' | 'chart' | 'table' | 'tool-status'
  content: string
  title?: string
  icon?: string
  defaultOpen?: boolean
  lineIndex?: number
}



// Enhanced markdown renderer with collapsible sections and custom components
function renderEnhancedContent(content: string, isStreaming: boolean): React.ReactNode {
  // Handle streaming animation for tool actions
  const lines = content.split('\n')
  let lastActionIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('🔧') || lines[i].startsWith('Using tool:') || lines[i].startsWith('Trying ')) {
      lastActionIndex = i
      break
    }
  }

  // Split content into sections for collapsible areas
  const sections = parseContentSections(content)
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (section.type === 'collapsible') {
          return (
            <Disclosure key={index} defaultOpen={section.defaultOpen}>
              {({ open }) => (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-text-primary bg-neutral-900/40 hover:bg-neutral-900/60 transition-colors">
                    <span className="flex items-center gap-2">
                      {section.icon}
                      {section.title}
                    </span>
                    <svg
                      className={`${open ? 'rotate-180' : ''} h-4 w-4 text-text-secondary transition-transform`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 py-3 bg-neutral-900/20">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={markdownComponents}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          )
        } else if (section.type === 'chart') {
          return (
            <div key={index} className="my-3 w-full">
              <SimpleChartRenderer json={section.content} />
            </div>
          )
        } else if (section.type === 'table') {
          return (
            <div key={index} className="my-3 w-full">
              <TableRenderer json={section.content} />
            </div>
          )
        } else if (section.type === 'tool-status') {
          const shouldAnimate = section.lineIndex === lastActionIndex && isStreaming
          return (
            <div key={index} className="text-sm mb-1 text-blue-400">
              {shouldAnimate ? (
                <span className="animate-dots">🔧 {section.content}</span>
              ) : (
                <span>✓ {section.content}</span>
              )}
            </div>
          )
        } else {
          // Regular markdown content
          return (
            <div key={index} className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {section.content}
              </ReactMarkdown>
            </div>
          )
        }
      })}
      {isStreaming && <span className="typing-cursor" />}
    </div>
  )
}

// Parse content into sections for better organization
function parseContentSections(content: string): ContentSection[] {
  const lines = content.split('\n')
  const sections: ContentSection[] = []
  let currentSection: ContentSection = { type: 'markdown', content: '', title: '', icon: '', defaultOpen: true, lineIndex: -1 }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect structured data blocks
    if (line.trim().startsWith('```json')) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      const blockContent = extractCodeBlock(lines, i, 'json')
      sections.push({ type: 'table', content: blockContent.content })
      i = blockContent.endIndex
      currentSection = { type: 'markdown', content: '', title: '', icon: '', defaultOpen: true, lineIndex: -1 }
      continue
    }
    
    if (line.trim().startsWith('```chart')) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      const blockContent = extractCodeBlock(lines, i, 'chart')
      sections.push({ type: 'chart', content: blockContent.content })
      i = blockContent.endIndex
      currentSection = { type: 'markdown', content: '', title: '', icon: '', defaultOpen: true, lineIndex: -1 }
      continue
    }
    
    // Detect tool status
    if (line.includes('🔧')) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      const toolName = line.replace('🔧', '').replace('...', '').trim()
      sections.push({ type: 'tool-status', content: toolName, lineIndex: i })
      currentSection = { type: 'markdown', content: '', title: '', icon: '', defaultOpen: true, lineIndex: -1 }
      continue
    }
    
    // Detect collapsible sections (technical details, logs, etc.)
    if (line.includes('Performance Metrics') || line.includes('Debug Info') || line.includes('Technical Details') || 
        line.includes('Full Report') || line.includes('Raw Data')) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      currentSection = {
        type: 'collapsible',
        content: '',
        title: line.replace(/[#*:]/g, '').trim(),
        icon: getIconForSection(line),
        defaultOpen: false,
        lineIndex: i
      }
      continue
    }
    
    currentSection.content += line + '\n'
  }
  
  if (currentSection.content.trim()) {
    sections.push(currentSection)
  }
  
  return sections
}

// Extract code block content
function extractCodeBlock(lines: string[], startIndex: number, type: string) {
  const blockLines = []
  let i = startIndex + 1 // Skip opening ```
  
  while (i < lines.length && !lines[i].trim().startsWith('```')) {
    blockLines.push(lines[i])
    i++
  }
  
  return {
    content: blockLines.join('\n'),
    endIndex: i
  }
}

// Get appropriate icon for section type
function getIconForSection(title: string) {
  if (title.includes('Performance')) return '📊'
  if (title.includes('Debug')) return '🔧' 
  if (title.includes('Technical')) return '⚙️'
  if (title.includes('Report')) return '📋'
  if (title.includes('Data')) return '💾'
  return '📄'
}

// Custom markdown components for clean styling
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
  code: ({ children }: any) => (
    <code className="px-2 py-1 bg-neutral-800/60 border border-white/10 rounded text-green-300 text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-neutral-900/60 border border-white/10 rounded-lg p-4 overflow-x-auto mb-3">
      {children}
    </pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-blue-500/50 pl-4 py-2 bg-blue-900/10 rounded-r mb-3">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full border-collapse border border-white/20 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-white/20 px-3 py-2 bg-neutral-800/60 text-left font-medium text-text-primary">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-white/20 px-3 py-2 text-text-primary">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}

export default function ChatInput({ onLoadingChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // PDF Export functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `AI Chat Export - ${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `
  })

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-history')
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
  }, [])

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    
    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    // Add placeholder assistant message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/chat-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversation_history: conversationHistory
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
                          try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'text' && parsed.content) {
                  accumulatedContent += parsed.content
                  
                  // Update the assistant message with accumulated content
                  setMessages(prev => 
                    prev.map((msg, index) => 
                      index === prev.length - 1 && msg.role === 'assistant'
                        ? { ...msg, content: accumulatedContent, isStreaming: true }
                        : msg
                    )
                  )
                  
                  // Auto-scroll as content streams in
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                } else if (parsed.type === 'done') {
                  // Mark streaming as complete
                  setMessages(prev => 
                    prev.map((msg, index) => 
                      index === prev.length - 1 && msg.role === 'assistant'
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  )
                  break
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue
              }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        console.log('Request cancelled')
      } else {
        console.error('Error sending message:', error)
        // Update the last message with error
        setMessages(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}` }
              : msg
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem('chat-history')
  }

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {messages.length === 0 ? (
        /* Centered Input - No messages state */
        <div className="h-full flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">
                          <div className="text-center mb-8">
                <div className="text-2xl font-light text-text-primary mb-3">Start a conversation</div>
                <div className="text-text-secondary">Ask about inventory, orders, or sales...</div>
                <div className="text-xs text-text-tertiary mt-2">✨ Enhanced with bulk API endpoints for faster responses</div>
              </div>
            
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about inventory, orders, sales, or bulk operations..."
                  rows={1}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-neutral-900/40 border border-white/[0.04] rounded-3xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/30 hover:bg-neutral-900/60 text-base resize-none shadow-lg transition-all disabled:opacity-50"
                  style={{
                    minHeight: '52px',
                    maxHeight: '200px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                  }}
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4 text-xs text-neutral-500">
              Claude AI • Powered by Anthropic
            </div>
          </div>
        </div>
      ) : (
        /* Chat Layout - With messages */
        <div className="w-full max-w-5xl mx-auto flex flex-col h-full p-6">
          {/* Header with Clear Button */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="text-sm text-text-secondary">
              {messages.length} messages
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const testMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'Here is a test chart:\n\n```chart\n{\n  "type": "bar",\n  "title": "Test Chart",\n  "data": [\n    {"name": "Mon", "value": 100},\n    {"name": "Tue", "value": 150}\n  ]\n}\n```\n\nChart test complete.',
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, testMessage])
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-900/20"
              >
                Test Chart
              </button>
              <button
                onClick={() => {
                  const testMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'Here is a test pie chart:\n\n```chart\n{\n  "type": "pie",\n  "title": "Sales by Category",\n  "data": [\n    {"name": "Flower", "value": 450},\n    {"name": "Edibles", "value": 320},\n    {"name": "Concentrates", "value": 180},\n    {"name": "Accessories", "value": 50}\n  ]\n}\n```\n\nPie chart test complete.',
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, testMessage])
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-900/20"
              >
                Test Pie
              </button>
              <button
                onClick={() => {
                  const testMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'Here is a test comparison chart:\n\n```chart\n{\n  "type": "bar",\n  "title": "Location Sales Comparison",\n  "data": [\n    {"name": "Week 1", "Charlotte": 2400, "Salisbury": 1800, "Bon Air": 1200},\n    {"name": "Week 2", "Charlotte": 2800, "Salisbury": 2100, "Bon Air": 1400},\n    {"name": "Week 3", "Charlotte": 3200, "Salisbury": 1900, "Bon Air": 1600}\n  ]\n}\n```\n\nComparison chart test complete.',
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, testMessage])
                }}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-orange-900/20"
              >
                Test Compare
              </button>
              <button
                onClick={() => {
                  const testMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'Here is a test table:\n\n```json\n[\n  {"product": "Lemon Runtz", "category": "Flower", "stock": 45, "price": 32.99, "sales": 124},\n  {"product": "Wedding Cake", "category": "Flower", "stock": 23, "price": 29.99, "sales": 87},\n  {"product": "Gummy Bears", "category": "Edibles", "stock": 67, "price": 24.99, "sales": 156},\n  {"product": "Live Resin Cart", "category": "Concentrates", "stock": 34, "price": 45.99, "sales": 78}\n]\n```\n\nTable test complete.',
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, testMessage])
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded hover:bg-emerald-900/20"
              >
                Test Table
              </button>
              <button
                onClick={() => {
                  const testMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'Daily Sales Trend - Last 7 Days:\n\nDec 22: name: DEvalue: 524.91\nDec 21: name: DEvalue: 389.54\nDec 20: name: DEvalue: 234.97\nDec 19: name: DEvalue: 456.12\nDec 18: name: DEvalue: 678.23\n\nThis shows the daily pattern for testing.',
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, testMessage])
                }}
                className="text-xs text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded hover:bg-green-900/20"
              >
                Test Auto-Detect
              </button>
              <button
                onClick={handlePrint}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded hover:bg-indigo-900/20"
                title="Export conversation as PDF"
              >
                📄 Export PDF
              </button>
              <button
                onClick={clearConversation}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* Chat Messages - Fixed height scrollable area */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 min-h-0">
            <div ref={printRef} className="space-y-4">
              {messages.map((msg, index) => (
              <div key={index}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[90%] bg-neutral-900/60 border border-white/[0.08] rounded-2xl px-4 py-3">
                      <div className="text-sm text-text-primary whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[90%]">
                      <div className="text-sm text-text-primary ai-response">
                        {renderEnhancedContent(msg.content, msg.isStreaming ?? false)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              ))}
            </div>
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-center space-x-2 text-text-tertiary no-print">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs">Claude is thinking...</span>
                <button
                  onClick={cancelRequest}
                  className="text-xs text-red-400 hover:text-red-300 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-shrink-0">
            <div className="w-full">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about inventory, orders, sales, or bulk operations..."
                    rows={1}
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 bg-neutral-900/40 border border-white/[0.04] rounded-3xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/30 hover:bg-neutral-900/60 text-base resize-none shadow-lg transition-all disabled:opacity-50"
                    style={{
                      minHeight: '52px',
                      maxHeight: '200px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-4 text-xs text-neutral-500">
                Claude AI • Powered by Anthropic
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}