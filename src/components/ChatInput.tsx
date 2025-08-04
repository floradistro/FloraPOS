'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatInputProps {
  onLoadingChange?: (isLoading: boolean) => void
}

export default function ChatInput({ onLoadingChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
          <div className="w-full max-w-2xl">
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
        <div className="w-full max-w-3xl mx-auto flex flex-col h-full p-6">
          {/* Header with Clear Button */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="text-sm text-text-secondary">
              {messages.length} messages
            </div>
            <button
              onClick={clearConversation}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Clear Chat
            </button>
          </div>

          {/* Chat Messages - Fixed height scrollable area */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 min-h-0">
            {messages.map((msg, index) => (
              <div key={index}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-neutral-900/60 border border-white/[0.08] rounded-2xl px-4 py-3">
                      <div className="text-sm text-text-primary whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="text-sm text-text-primary whitespace-pre-wrap ai-response">
                        {(() => {
                          const lines = msg.content.split('\n')
                          const processedLines = []
                          
                          for (let i = 0; i < lines.length; i++) {
                            const line = lines[i]
                            const nextLine = lines[i + 1]
                            
                            // Check if this tool line is completed (next line has ✓)
                            const isCompleted = nextLine && (nextLine.trim() === '✓' || nextLine.startsWith('✓'))
                            
                            if (line.startsWith('Using tool:')) {
                              const toolName = line.replace('Using tool: ', '').replace('...', '')
                              if (isCompleted) {
                                // Show completed state
                                processedLines.push(
                                  <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-green-500/5 rounded-lg border border-green-500/20 animate-fade-in">
                                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <span className="text-green-300 text-sm font-medium">{toolName}</span>
                                  </div>
                                )
                                i++ // Skip the ✓ line since we handled it
                              } else {
                                // Show loading state
                                processedLines.push(
                                  <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                      <div className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                    </div>
                                    <span className="text-blue-300 text-sm font-medium animate-flash">{toolName}</span>
                                  </div>
                                )
                              }
                            } else if (line.startsWith('Trying ')) {
                              const toolName = line.replace('Trying ', '').replace('...', '')
                              if (isCompleted) {
                                // Show completed state
                                processedLines.push(
                                  <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-green-500/5 rounded-lg border border-green-500/20 animate-fade-in">
                                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <span className="text-green-300 text-sm font-medium">{toolName}</span>
                                  </div>
                                )
                                i++ // Skip the ✓ line
                              } else {
                                processedLines.push(
                                  <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                    <span className="text-blue-300 text-sm animate-flash">Trying {toolName}</span>
                                  </div>
                                )
                              }
                            } else if (line.startsWith('Analyzing results') || line.startsWith('Reviewing results')) {
                              processedLines.push(
                                <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-gray-500/5 rounded-lg">
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-gray-300 text-sm animate-pulse">{line}</span>
                                </div>
                              )
                            } else if (line.startsWith('Executing') && line.includes('adaptive')) {
                              processedLines.push(
                                <div key={i} className="flex items-center gap-3 mb-2 p-2 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-yellow-300 text-sm animate-pulse">Adapting strategy...</span>
                                </div>
                              )
                            } else if (line.includes('completed')) {
                              processedLines.push(
                                <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-green-500/5 rounded-lg border border-green-500/20">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-green-300 text-sm">{line}</span>
                                </div>
                              )
                            } else if (line.includes('bulk_get_inventory') || line.includes('bulk_update_stock')) {
                              processedLines.push(<div key={i} className="text-blue-400 text-xs opacity-60 font-mono bg-blue-500/10 px-2 py-1 rounded">{line}</div>)
                            } else if (line.startsWith('✓') || line.startsWith('❌')) {
                              // Skip standalone checkmarks/x marks since they're handled above
                              continue
                            } else if (line.trim() === '') {
                              processedLines.push(<div key={i} className="h-1"></div>)
                            } else {
                              processedLines.push(<div key={i} className="text-text-primary leading-relaxed">{line || '\u00A0'}</div>)
                            }
                          }
                          
                          return processedLines
                        })()}
                        {msg.isStreaming && (
                          <span className="typing-cursor" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-center space-x-2 text-text-tertiary">
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