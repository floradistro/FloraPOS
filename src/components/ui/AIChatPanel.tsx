'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ApiConfig } from '../../lib/api-config';
import { useAuth } from '../../contexts/AuthContext';
import { AICanvasRef } from './SimpleAICanvas';
import { AgentConfigPanel } from '../ai/AgentConfigPanel';

// Import artifact language type from renderer
import { ArtifactLanguage } from './SimpleArtifactRenderer';
import { CodeArtifact } from './CodeArtifact';
import { MarkdownMessage } from './MarkdownMessage';
import { ThinkingMessage } from './ThinkingMessage';
import { LiveThinkingMessage } from './LiveThinkingMessage';
import { ToolExecutionMessage } from './ToolExecutionMessage';
import { TypewriterMarkdown } from './TypewriterMarkdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'thinking' | 'tool';
  content: string;
  timestamp: Date;
  hasCode?: boolean;
  codeType?: 'react' | 'html' | 'javascript' | 'css' | 'typescript' | 'threejs' | 'svg' | 'mermaid';
  codeContent?: string;
  showArtifact?: boolean;
  isStreaming?: boolean;
  toolName?: string;
  toolStatus?: 'running' | 'complete' | 'error';
  contentWithoutCode?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
}

interface AIChatPanelProps {
  onSendMessage?: (message: string) => void;
  canvasRef?: React.RefObject<AICanvasRef>;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ onSendMessage, canvasRef }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Flora AI - your senior full-stack developer and technical expert.\n\n**I CAN HELP WITH:**\n\n**💻 Code & Development**\n• Write production-ready code (React, TypeScript, JavaScript, Three.js)\n• Build visualizations, dashboards, and UI components\n• Debug, optimize, and refactor existing code\n• Explain technical concepts and best practices\n\n**📊 Data & Analytics**\n• Query your inventory, products, and sales data\n• Generate analytics reports and insights\n• Identify trends and optimization opportunities\n• Create data visualizations\n\n**🤝 Technical Partnership**\n• Answer questions and provide expert guidance\n• Review code and suggest improvements\n• Architect solutions and plan roadmaps\n• Engage in technical discussions\n\nI intelligently route requests between code generation and data analysis. Just ask naturally - I\'ll understand what you need!\n\nWhat can I help you with today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [temperature, setTemperature] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversationDropdown, setShowConversationDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  /**
   * INTELLIGENT ROUTING MODE:
   * - Data/Analytics queries → WordPress endpoint (has database tools)
   * - Code generation → Direct Claude endpoint (faster, optimized for artifacts)
   * - Hybrid requests → WordPress endpoint (can fetch data + generate code)
   * 
   * Both endpoints have comprehensive system prompts for full AI capabilities.
   */

  // Smooth auto-scroll when messages update (throttled)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Debounce scroll to avoid jank
    scrollTimeoutRef.current = setTimeout(() => {
      scrollToBottom(true);
    }, 50); // 50ms debounce for smooth scrolling
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages]);

  // Load conversation history and agent config on mount
  useEffect(() => {
    fetchConversations();
    fetchAgentConfig();
  }, []);

  const fetchAgentConfig = async () => {
    try {
      const apiEnv = ApiConfig.getEnvironment();
      const response = await fetch('/api/ai/config', {
        headers: {
          'x-api-environment': apiEnv,
        },
      });
      const data = await response.json();
      if (data.success && data.agent) {
        setAgentConfig(data.agent);
        setTemperature(data.agent.temperature || 0.9);
        setMaxTokens(data.agent.max_tokens || 8192);
      }
    } catch (error) {
      console.error('❌ Failed to load agent config:', error);
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowConversationDropdown(false);
      }
    };

    if (showConversationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConversationDropdown]);

  const fetchConversations = async () => {
    if (!user?.id) {
      console.log('No user logged in, skipping conversation fetch');
      return;
    }

    try {
      const apiEnv = ApiConfig.getEnvironment();
      const response = await fetch('/api/ai/history', {
        headers: {
          'x-user-id': user.id,
          'x-api-environment': apiEnv
        }
      });
      const data = await response.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !currentConversationId && data.conversations[0].id) {
          setCurrentConversationId(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const createNewConversation = async () => {
    if (!user?.id) {
      console.error('❌ No user logged in');
      alert('Please log in to create a new conversation');
      return;
    }

    try {
      const apiEnv = ApiConfig.getEnvironment();
      const response = await fetch('/api/ai/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          'x-api-environment': apiEnv
        },
        body: JSON.stringify({
          title: `Conversation ${new Date().toLocaleDateString()}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to create conversation: ${response.status}`);
      }

      if (data.success && data.conversation && data.conversation.id) {
        setConversations([data.conversation, ...conversations]);
        setCurrentConversationId(data.conversation.id);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hello! I\'m Flora AI - your lead developer and analytics expert. What should we build or analyze today?',
          timestamp: new Date(),
        }]);
        setShowConversationDropdown(false);
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server - missing conversation data');
      }
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      alert(`Failed to create conversation: ${error.message}`);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: Load messages from conversation
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Conversation loaded. Continue where we left off!',
      timestamp: new Date(),
    }]);
    setShowConversationDropdown(false);
  };

  const getCurrentConversationTitle = () => {
    if (!conversations || conversations.length === 0) {
      return 'New Chat';
    }
    const current = conversations.find(c => c && c.id === currentConversationId);
    return current?.title || 'New Chat';
  };

  // Extract and execute code from AI responses
  const extractAndExecuteCode = (content: string) => {
    
    if (!content || !content.includes('```')) {
      return {
        hasCode: false,
        codeType: undefined,
        codeContent: undefined,
        showArtifact: false,
        contentWithoutCode: content
      };
    }
    
    // Ultra-strict regex - only matches proper markdown code fences
    // Must have ``` at start of line, language on same line, newline, then code
    const codeBlockRegex = /^```(\w+)\s*$\n([\s\S]*?)^```\s*$/gm;
    const matches = Array.from(content.matchAll(codeBlockRegex));
    
    // If no matches with strict regex, try looser version
    if (matches.length === 0) {
      const looseRegex = /```(\w+)\s*\n([\s\S]*?)\n```/g;
      const looseMatches = Array.from(content.matchAll(looseRegex));
      if (looseMatches.length > 0) {
        matches.push(...looseMatches);
      }
    }
    
    
    if (matches.length === 0) {
      return {
        hasCode: false,
        codeType: undefined,
        codeContent: undefined,
        showArtifact: false,
        contentWithoutCode: content
      };
    }
    
    
    // Use the LAST code block (most likely the final/complete version)
    // AI often generates examples first, then the real code
    const match = matches[matches.length - 1];
    const language = match[1].toLowerCase().trim();
    let code = match[2];
    
    
    
    // CRITICAL: Validate that code actually starts with expected patterns
    // If it contains AI explanation text, it means extraction failed
    const codeStartPatterns = {
      html: ['<!DOCTYPE', '<html', '<HTML', '<!doctype'],
      javascript: ['function', 'const', 'let', 'var', 'class', '//', '/*', 'import', 'export'],
      react: ['function', 'const', 'import', 'export', 'class'],
      jsx: ['function', 'const', 'import', 'export', 'class'],
      css: ['.', '#', '@', '*', 'body', 'html', ':root'],
      svg: ['<svg', '<SVG'],
      typescript: ['function', 'const', 'let', 'var', 'class', 'interface', 'type', 'import', 'export']
    };
    
    // Check if code starts with valid pattern
    const trimmedCode = code.trim();
    const firstWord = trimmedCode.split(/[\s\n]/)[0];
    
    
    // If code contains obvious AI phrases at the start, it's corrupted
    const corruptionPhrases = ["I'll", "Here's", "Let me", "This is", "I made", "create a"];
    const isCorrupted = corruptionPhrases.some(phrase => 
      trimmedCode.substring(0, 150).includes(phrase)
    );
    
    if (isCorrupted) {
      console.error('❌ [Extraction] Code appears corrupted with AI text');
      console.error('❌ First 200 chars:', trimmedCode.substring(0, 200));
      
      // Try to find where actual code starts
      const patterns = codeStartPatterns[language as keyof typeof codeStartPatterns] || [];
      for (const pattern of patterns) {
        const idx = trimmedCode.indexOf(pattern);
        if (idx > 0) {
          code = trimmedCode.substring(idx);
          break;
        }
      }
    }
    
    code = code.trim();
    
    
    if (!code || code.length === 0) {
      return {
        hasCode: false,
        codeType: undefined,
        codeContent: undefined,
        showArtifact: false,
        contentWithoutCode: content
      };
    }
    
    // Strip ALL code blocks from content (for display in chat)
    // This removes the code fences and the code itself
    const contentWithoutCode = content.replace(/```[\w]*\s*\n[\s\S]*?\n```/g, '').trim();
    
    return processCode(language, code, contentWithoutCode, false);
  };
  
  const processCode = (language: string, code: string, contentWithoutCode: string, isStreaming = false) => {
    
    if (!code || code.trim().length === 0) {
      console.error('❌ Empty code');
      return { hasCode: false, codeType: undefined, codeContent: undefined, showArtifact: false, contentWithoutCode };
    }
    
    // Map language to artifact type
    let artifactLang: ArtifactLanguage = 'javascript';
    
    if (language === 'svg' || code.trim().startsWith('<svg')) {
      artifactLang = 'svg';
    } else if (language === 'mermaid') {
      artifactLang = 'mermaid';
    } else if (['react', 'jsx', 'tsx'].includes(language) || code.includes('useState') || code.includes('useEffect')) {
      artifactLang = 'react';
    } else if (['typescript', 'ts'].includes(language)) {
      artifactLang = 'typescript';
    } else if (language === 'html' || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) {
      artifactLang = 'html';
    } else if (language === 'css') {
      artifactLang = 'css';
    } else {
      artifactLang = 'javascript';
    }
    
    
    // Send to canvas
    if (!canvasRef) {
      console.error('❌❌❌ canvasRef is NULL/UNDEFINED');
      console.error('❌ This means the ref prop was not passed to AIChatPanel');
      return {
        hasCode: true,
        codeType: artifactLang,
        codeContent: code,
        showArtifact: false,
        contentWithoutCode
      };
    }
    
    if (!canvasRef.current) {
      console.error('❌❌❌ canvasRef.current is NULL/UNDEFINED');
      console.error('❌ Make sure you are in AI View (not Products view)');
      console.error('❌ The AICanvas component must be mounted for this to work');
      return {
        hasCode: true,
        codeType: artifactLang,
        codeContent: code,
        showArtifact: false,
        contentWithoutCode
      };
    }
    
    try {
      const title = `${artifactLang.charAt(0).toUpperCase() + artifactLang.slice(1)} Artifact`;
      console.log('Setting artifact:', {
        codeLength: code.length, 
        language: artifactLang, 
        title,
        isStreaming 
      });
      
      canvasRef.current.setArtifact(code, artifactLang, title, isStreaming);
      
    } catch (error) {
      console.error('❌❌❌ Error setting artifact:', error);
      console.error('Error details:', error);
    }
    
    return {
      hasCode: true,
      codeType: artifactLang,
      codeContent: code,
      showArtifact: false,  // Artifacts only appear in dedicated window, not inline in chat
      contentWithoutCode
    };
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // If currently generating, stop instead
    if (isGenerating) {
      handleStop();
      return;
    }

    setIsGenerating(true);

    // Check if there's a current artifact to edit
    const currentArtifact = canvasRef?.current?.getCurrentArtifact();
    
    let messageContent = inputValue;
    
    // If editing existing artifact, add context with artifact ID for temp storage lookup
    if (currentArtifact) {
      console.log('Editing existing artifact:', {
        id: currentArtifact.id,
        language: currentArtifact.language,
        codeLength: currentArtifact.code.length,
        title: currentArtifact.title
      });
      
      // Reference the temporary artifact so AI can fetch and edit it
      messageContent = `[EDITING EXISTING ARTIFACT]

USER REQUEST: ${inputValue}

ARTIFACT INFO:
- ID: ${currentArtifact.id}
- Type: ${currentArtifact.language}
- Title: ${currentArtifact.title}

CRITICAL INSTRUCTIONS:
1. You are EDITING existing code, NOT creating new code
2. The COMPLETE current code is provided below
3. Apply ONLY the changes requested by the user
4. Keep ALL other functionality intact
5. Return the COMPLETE updated version with ALL code
6. DO NOT regenerate from scratch
7. DO NOT describe what you changed - just provide the full updated code

CURRENT COMPLETE CODE:
\`\`\`${currentArtifact.language}
${currentArtifact.code}
\`\`\``;

    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue, // Store original user message
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Check conversation length
    if (messages.length > 20) {
      console.warn('⚠️ Long conversation detected:', messages.length, 'messages');
      console.warn('💡 Consider starting a new conversation if you encounter errors');
    }

    // Call parent callback if provided
    if (onSendMessage) {
      onSendMessage(inputValue);
    }

    // Add thinking message with unique ID
    const thinkingMessageId = `thinking_${Date.now()}`;
    const streamingMessageId = `stream_${Date.now()}`;
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      role: 'thinking',
      content: 'Analyzing request',
      timestamp: new Date(),
      isStreaming: true,
    };
    
    setMessages((prev) => [...prev, thinkingMessage]);
    setIsTyping(false); // Turn off typing indicator since we're streaming
    

    try {
      // INTELLIGENT ROUTING: Analyze request and route to appropriate endpoint
      
      // Keywords that require WordPress tools (data queries AND inventory actions)
      const dataKeywords = [
        // Read operations
        'show me', 'list', 'find', 'search', 'get', 'fetch', 'retrieve',
        'product', 'inventory', 'stock', 'sales', 'analytics', 'trends',
        'low stock', 'best seller', 'category', 'categories', 'report',
        // Write operations
        'transfer', 'move', 'update', 'set', 'adjust', 'change', 'modify',
        'add inventory', 'reduce', 'increase', 'decrease', 'restock'
      ];
      
      const messageLower = messageContent.toLowerCase();
      const needsTools = dataKeywords.some(kw => messageLower.includes(kw));
      
      // Route based on request type
      const endpoint = needsTools ? '/api/ai/wordpress-proxy' : '/api/ai/direct';
      
      
      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const timeout = setTimeout(() => {
        controller.abort();
        console.warn('⚠️ Stream timeout - request aborted');
        setIsGenerating(false);
      }, 120000); // 120 second timeout for complex tool chains

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          temperature: temperature,
          max_tokens: maxTokens,
          conversation: messages
            .filter(m => m.role === 'user' || m.role === 'assistant') // Only send user/assistant to API, not tool/thinking
            .map(m => ({
              role: m.role,
              content: m.content
            })),
          // Include location context for the AI
          user_location: user?.location_id ? {
            id: user.location_id,
            name: user.location || 'Unknown Location'
          } : null
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let accumulatedThinking = '';
      let lastUpdateTime = Date.now();
      let lastContentRenderTime = 0;
      let lastThinkingRenderTime = 0;
      let lastArtifactRenderTime = 0;
      const RENDER_THROTTLE = 100; // Update UI every 100ms max for smooth streaming
      const ARTIFACT_THROTTLE = 300; // Update artifacts every 300ms to prevent glitching
      let isComplete = false; // Flag to prevent duplicate processing

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        // Check for stale stream (no updates for 30 seconds - increased timeout)
        if (Date.now() - lastUpdateTime > 30000) {
          console.warn('⚠️ Stream appears stale (30s timeout), finishing...');
          
          if (!isComplete && accumulatedContent) {
            isComplete = true;
            setIsGenerating(false);
            abortControllerRef.current = null;
            
            const codeInfo = extractAndExecuteCode(accumulatedContent);
            
            if (codeInfo.hasCode && codeInfo.codeContent && codeInfo.codeType && canvasRef?.current) {
              const title = `${codeInfo.codeType.charAt(0).toUpperCase() + codeInfo.codeType.slice(1)} Artifact`;
              canvasRef.current.setArtifact(codeInfo.codeContent, codeInfo.codeType as ArtifactLanguage, title, false);
            }
            
            setMessages((prev) =>
              prev
                .filter((msg) => msg.id !== thinkingMessageId)
                .map((msg) =>
                  msg.id === streamingMessageId
                    ? { ...msg, content: codeInfo.contentWithoutCode || accumulatedContent, isStreaming: false, ...codeInfo }
                    : msg
                )
            );
          } else if (!isComplete && !accumulatedContent) {
            // Stream stalled before any content
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== thinkingMessageId)
            );
          }
          break;
        }

        const { done, value } = await reader.read();
        
        if (done) {
          
          // Only process if not already complete (prevent duplicates)
          if (!isComplete && accumulatedContent) {
            isComplete = true;
            setIsGenerating(false);
            abortControllerRef.current = null;
            
            const codeInfo = extractAndExecuteCode(accumulatedContent);
            
            // Send final artifact with isStreaming=false
            if (codeInfo.hasCode && codeInfo.codeContent && codeInfo.codeType && canvasRef?.current) {
              const title = `${codeInfo.codeType.charAt(0).toUpperCase() + codeInfo.codeType.slice(1)} Artifact`;
              canvasRef.current.setArtifact(codeInfo.codeContent, codeInfo.codeType as ArtifactLanguage, title, false);
            }
            
            setMessages((prev) =>
              prev
                .filter((msg) => msg.id !== thinkingMessageId)
                .map((msg) =>
                  msg.id === streamingMessageId
                    ? { ...msg, content: codeInfo.contentWithoutCode || accumulatedContent, isStreaming: false, ...codeInfo }
                    : msg
                )
            );
          }
          break;
        }

        lastUpdateTime = Date.now(); // Reset timeout
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // Only log every 10th content event to reduce console spam
              if (data.type !== 'content' || accumulatedContent.split(' ').length % 10 === 0) {
              }

              if (data.type === 'thinking') {
                // Show ALL thinking - Claude's extended reasoning with typewriter effect
                const thinkingText = data.content || data.data || '';
                
                // Check if this is status message or extended thinking
                const isExtendedThinking = thinkingText.length > 50 && !(/^[🧠🔌🔄💭🛠️✓⚡]/.test(thinkingText));
                
                if (isExtendedThinking) {
                  // Extended thinking - replace accumulated thinking
                  accumulatedThinking = thinkingText;
                } else {
                  // Status message - keep as is
                  accumulatedThinking = thinkingText;
                }
                
                // Update immediately for smooth typewriter effect
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === thinkingMessageId
                      ? { ...msg, content: accumulatedThinking, isStreaming: true }
                      : msg
                  )
                );
              } else if (data.type === 'tool_call') {
                // Display tool calls in real-time - ADD to messages, don't replace
                const toolText = data.content || data.data || '';
                const toolId = `tool_${Date.now()}_${Math.random()}`;
                
                
                setMessages((prev) => [
                  ...prev,
                  {
                    id: toolId,
                    role: 'tool' as const,
                    content: toolText,
                    timestamp: new Date(),
                    toolName: 'tool_call',
                    toolStatus: 'running' as const,
                  }
                ]);
              } else if (data.type === 'tool_result') {
                // Update the last tool message with result
                const resultText = data.content || data.data || '';
                
                
                setMessages((prev) => {
                  const lastToolIndex = [...prev].reverse().findIndex(msg => msg.role === 'tool' && msg.toolStatus === 'running');
                  const actualIndex = lastToolIndex >= 0 ? prev.length - 1 - lastToolIndex : -1;
                  if (actualIndex >= 0) {
                    return prev.map((msg, idx) =>
                      idx === actualIndex
                        ? { ...msg, content: msg.content + ' → ' + resultText, toolStatus: 'complete' as const }
                        : msg
                    );
                  }
                  return prev;
                });
              } else if (data.type === 'content') {
                // WordPress sends 'data', /api/ai/direct sends 'content'
                const contentText = data.content || data.data || '';
                
                // If this is a large chunk (> 100 chars), it's from iteration 2 (full response)
                // Show it immediately without word-by-word animation
                if (contentText.length > 100 && contentText.length > accumulatedContent.length * 1.5) {
                  accumulatedContent = contentText; // Replace with full content
                } else {
                  accumulatedContent += contentText; // Append for real streaming
                }
                
                // Throttle UI updates for smooth streaming (like Cursor)
                const now = Date.now();
                const shouldUpdate = (now - lastContentRenderTime) >= RENDER_THROTTLE;
                
                if (shouldUpdate) {
                  lastContentRenderTime = now;
                  
                  // Strip code blocks from content for display in chat
                  // Handle both complete (```...```) and incomplete (```...) code blocks
                  let contentForChat = accumulatedContent;
                  
                  // Remove complete code blocks
                  contentForChat = contentForChat.replace(/```[\w]*\s*\n[\s\S]*?\n```/g, '');
                  
                  // Remove incomplete code blocks (opening ``` without closing)
                  // This handles streaming where code block isn't complete yet
                  contentForChat = contentForChat.replace(/```[\w]*\s*\n[\s\S]*$/g, '');
                  
                  contentForChat = contentForChat.trim();
                  
                  // Update the streaming message (create if doesn't exist)
                  setMessages((prev) => {
                    const exists = prev.some(msg => msg.id === streamingMessageId);
                    
                    if (!exists) {
                      // First content - add the message and remove thinking
                      const withoutThinking = prev.filter(msg => msg.id !== thinkingMessageId);
                      return [
                        ...withoutThinking,
                        {
                          id: streamingMessageId,
                          role: 'assistant' as const,
                          content: contentForChat,  // Show only text, no code
                          timestamp: new Date(),
                          isStreaming: true,
                        }
                      ];
                    } else {
                      // Update existing message only
                      return prev.map((msg) =>
                        msg.id === streamingMessageId
                          ? { ...msg, content: contentForChat }  // Show only text, no code
                          : msg
                      );
                    }
                  });
                  
                  // Check if code blocks exist and send to canvas while streaming
                  // Throttle artifact updates to prevent glitching (300ms between updates)
                  const shouldUpdateArtifact = (now - lastArtifactRenderTime) >= ARTIFACT_THROTTLE;
                  
                  if (accumulatedContent.includes('```') && canvasRef?.current && shouldUpdateArtifact) {
                    lastArtifactRenderTime = now;
                    // Extract code and send live updates to canvas
                    try {
                      // Try to match complete code blocks first
                      let codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)\n```/g;
                      let matches = Array.from(accumulatedContent.matchAll(codeBlockRegex));
                      
                      // If no complete blocks, try to match incomplete blocks (still streaming)
                      if (matches.length === 0) {
                        codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)$/;
                        const match = accumulatedContent.match(codeBlockRegex);
                        if (match) {
                          matches = [match as RegExpExecArray];
                        }
                      }
                      
                      if (matches.length > 0) {
                        const match = matches[0];
                        const language = match[1].toLowerCase().trim();
                        const code = match[2].trim();
                        
                        if (language) {  // Even if code is empty/short, show it
                          // Map to artifact language
                          let artifactLang: ArtifactLanguage = 'javascript';
                          if (language === 'html' || code.startsWith('<!DOCTYPE') || code.startsWith('<html')) {
                            artifactLang = 'html';
                          } else if (['react', 'jsx', 'tsx'].includes(language)) {
                            artifactLang = 'react';
                          } else if (['typescript', 'ts'].includes(language)) {
                            artifactLang = 'typescript';
                          } else if (language === 'css') {
                            artifactLang = 'css';
                          } else if (language === 'svg') {
                            artifactLang = 'svg';
                          }
                          
                          const title = `${artifactLang.charAt(0).toUpperCase() + artifactLang.slice(1)} Artifact`;
                          canvasRef.current.setArtifact(code || '// Generating code...', artifactLang, title, true);  // isStreaming = true
                        }
                      }
                    } catch (err) {
                      console.error('❌ Error updating artifact during streaming:', err);
                    }
                  }
                }
              } else if (data.type === 'done') {
                // Prevent duplicate processing
                if (isComplete) {
                  break; // Exit immediately instead of continue
                }
                isComplete = true;
                setIsGenerating(false);
                abortControllerRef.current = null;
                
                
                // Process accumulated content
                const codeInfo = extractAndExecuteCode(accumulatedContent);
                
                // Send final artifact if code exists
                if (codeInfo.hasCode && codeInfo.codeContent && codeInfo.codeType && canvasRef?.current) {
                  const title = `${codeInfo.codeType.charAt(0).toUpperCase() + codeInfo.codeType.slice(1)} Artifact`;
                  canvasRef.current.setArtifact(codeInfo.codeContent, codeInfo.codeType as ArtifactLanguage, title, false);
                }
                
                // Mark response as complete and remove thinking message
                setMessages((prev) => {
                  const withoutThinking = prev.filter((msg) => msg.id !== thinkingMessageId);
                  
                  return withoutThinking.map((msg) =>
                    msg.id === streamingMessageId
                      ? { 
                          ...msg, 
                          content: codeInfo.contentWithoutCode || accumulatedContent,
                          isStreaming: false, 
                          ...codeInfo 
                        }
                      : msg
                  );
                });
                
                // Break out of loop after completion
                break;
              } else if (data.type === 'error') {
                console.error('❌ API Error:', data.error);
                console.error('❌ Error details:', data);
                
                // Check if it's a rate limit or overload error
                const isRateLimit = data.error?.includes('overloaded') || data.error?.includes('rate limit');
                
                // Remove thinking message and show error as assistant message
                setMessages((prev) => [
                  ...prev.filter((msg) => msg.id !== thinkingMessageId),
                  {
                    id: `error_${Date.now()}`,
                    role: 'assistant',
                    content: isRateLimit 
                      ? `⚠️ **API Overloaded**\n\nClaude API is currently overloaded or rate limited.\n\n**Try:**\n- Wait 30 seconds and retry\n- Your request: "${inputValue.substring(0, 100)}..."\n\nClick retry below or just resend your message.`
                      : `⚠️ **Error**\n\n${data.error}\n\n**Suggestion:** Wait a moment and try again.`,
                    timestamp: new Date(),
                    isStreaming: false,
                  }
                ]);
                
                break; // Stop processing stream
              }
            } catch (parseError) {
              console.error('❌ Error parsing SSE data:', parseError, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setIsGenerating(false);
      abortControllerRef.current = null;
      
      // Remove thinking message and show error
      setMessages((prev) => {
        const withoutThinking = prev.filter((msg) => msg.id !== thinkingMessageId);
        const hasStreamingMsg = withoutThinking.some(msg => msg.id === streamingMessageId);
        
        if (hasStreamingMsg) {
          // Update existing streaming message
          return withoutThinking.map((msg) =>
            msg.id === streamingMessageId
              ? {
                  ...msg,
                  content: 'Sorry, I encountered an error processing your request. Please try again.',
                  isStreaming: false,
                }
              : msg
          );
        } else {
          // Add error message
          return [
            ...withoutThinking,
            {
              id: `error_${Date.now()}`,
              role: 'assistant' as const,
              content: 'Sorry, I encountered an error processing your request. Please try again.',
              timestamp: new Date(),
              isStreaming: false,
            }
          ];
        }
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // If config is open, show config panel instead of chat
  if (showAgentConfig) {
    return (
      <div className="w-full h-full bg-transparent flex flex-col border-l border-white/[0.06] overflow-hidden">
        <AgentConfigPanel
          isOpen={showAgentConfig}
          onClose={() => setShowAgentConfig(false)}
          onAgentUpdated={(agent) => {
            setTemperature(parseFloat(agent.temperature.toString()));
            setMaxTokens(parseInt(agent.max_tokens.toString()));
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent flex flex-col border-l border-white/[0.06] overflow-hidden">
      {/* Unified Toolbar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.06] bg-transparent">
        <div className="flex items-center justify-between gap-2">
          {/* Left side - History Icon */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowConversationDropdown(!showConversationDropdown)}
              className="p-1.5 rounded-lg transition-all duration-300 ease-out bg-transparent hover:bg-neutral-600/10 border border-transparent hover:border-neutral-500/30"
              title={getCurrentConversationTitle()}
            >
              <svg 
                className="w-4 h-4 text-neutral-400 hover:text-neutral-200 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>

            {/* Dropdown Menu - Terminal Style */}
            {showConversationDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-neutral-900/95 backdrop-blur-sm border border-white/[0.06] z-50 max-h-96 overflow-hidden flex flex-col rounded-lg shadow-lg min-w-[280px]">
                {/* New Conversation Button */}
                <button
                  onClick={createNewConversation}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-600/10 transition-all duration-300 ease-out border-b border-white/[0.06]"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  <span className="text-neutral-600">+</span>
                  <span>new conversation</span>
                </button>

                {/* Conversation List */}
                <div className="overflow-y-auto flex-1 max-h-80">
                  {conversations.length === 0 ? (
                    <div className="px-3 py-8 text-center text-neutral-600 text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                      <span className="block mb-1">—</span>
                      <span>No conversations</span>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => loadConversation(conversation.id)}
                        className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-neutral-600/10 transition-all duration-300 ease-out text-sm ${
                          currentConversationId === conversation.id ? 'bg-neutral-600/10 text-neutral-300' : 'text-neutral-500'
                        }`}
                        style={{ fontFamily: 'Tiempo, serif' }}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {currentConversationId === conversation.id ? '•' : ' '}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {conversation.title}
                            </span>
                            <span className="text-[10px] text-neutral-700 flex-shrink-0">
                              [{conversation.message_count}]
                            </span>
                          </div>
                          {conversation.last_message && (
                            <p className="text-[10px] text-neutral-700 truncate mt-0.5">
                              {conversation.last_message.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-1">
            {/* Temperature Control */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-2 py-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors font-mono"
              title="Temperature"
            >
              t={temperature}
            </button>

            {/* Clear Chat */}
            <button
              onClick={() => setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Chat cleared.',
                timestamp: new Date(),
              }])}
              className="px-2 py-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors font-mono"
              title="Clear Chat"
            >
              clear
            </button>

            {/* Agent Configuration */}
            <button
              onClick={() => setShowAgentConfig(true)}
              className="px-2 py-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors font-mono"
              title="Agent Configuration"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-2 py-1 text-[10px] transition-colors font-mono ${
                showSettings 
                  ? 'text-neutral-400' 
                  : 'text-neutral-600 hover:text-neutral-400'
              }`}
              title="Settings"
            >
              {showSettings ? '−' : '+'}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-2">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>Temperature</label>
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-900 appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #404040 0%, #404040 ${temperature * 100}%, #0a0a0a ${temperature * 100}%, #0a0a0a 100%)`
                }}
              />
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>Max Tokens</label>
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>{maxTokens}</span>
              </div>
              <select
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 bg-transparent text-neutral-300 text-sm border border-white/[0.06] focus:border-neutral-400 focus:outline-none rounded-lg transition-all duration-300 ease-out"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                <option value="1024">1024</option>
                <option value="2048">2048</option>
                <option value="4096">4096</option>
                <option value="8192">8192</option>
              </select>
            </div>

            {/* Model Info */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>Model</span>
                <span className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>claude-sonnet-4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>API</span>
                <span className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>flora-im</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>MCP</span>
                <span className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-3 space-y-0"
        style={{ 
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up px-0`}
          >
            {/* Chain-of-Thought / Thinking Message */}
            {message.role === 'thinking' ? (
              <LiveThinkingMessage 
                content={message.content} 
                isStreaming={message.isStreaming}
              />
            ) : message.role === 'tool' ? (
              /* Tool Execution Message */
              <ToolExecutionMessage
                toolName={message.content}
                status={message.toolStatus || 'running'}
                result={message.toolStatus === 'complete' ? '✓' : undefined}
              />
            ) : (
              <div className={`${message.showArtifact ? 'w-full' : 'w-full'} ${message.role === 'user' ? 'order-2' : 'order-1'} min-w-0`}>
                {/* Text Message */}
                <div
                  className={`pl-4 pr-4 py-2 border-l-0 border-r-0 border-t-0 ${
                    message.role === 'user'
                      ? 'bg-transparent text-neutral-300 border-b border-white/[0.06]'
                      : 'bg-transparent text-neutral-300 border-b border-white/[0.06]'
                  }`}
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                {message.hasCode && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-800/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                        {message.codeType} artifact
                      </span>
                      <span className="text-xs text-neutral-600">•</span>
                      <span className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempo, serif' }}>
                        view in canvas →
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMessages(prev => prev.map(msg => 
                          msg.id === message.id 
                            ? { ...msg, showArtifact: !msg.showArtifact }
                            : msg
                        ));
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-0.5 rounded-lg hover:bg-neutral-600/10"
                      style={{ fontFamily: 'Tiempo, serif' }}
                    >
                      {message.showArtifact ? 'Hide' : 'Expand'}
                    </button>
                  </div>
                )}
                {message.role === 'assistant' ? (
                  // Show with typewriter animation for immersive experience
                  <div className="break-words overflow-wrap-anywhere max-w-full">
                    <TypewriterMarkdown 
                      content={message.content} 
                      isStreaming={message.isStreaming}
                      speed={5} // 5 characters at a time for smooth animation
                    />
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono break-words overflow-wrap-anywhere">
                    {message.content}
                  </p>
                )}
              </div>
              
              {/* Code Artifact */}
              {message.showArtifact && message.codeContent && message.codeType && (
                <div className="mt-3 h-[500px]">
                  <CodeArtifact
                    code={message.codeContent}
                    language={message.codeType}
                    title={`${message.codeType.charAt(0).toUpperCase() + message.codeType.slice(1)} Artifact`}
                    conversationId={currentConversationId ? parseInt(currentConversationId) : undefined}
                    messageId={parseInt(message.id)}
                    isStreaming={message.isStreaming}
                    onClose={() => {
                      setMessages(prev => prev.map(msg => 
                        msg.id === message.id 
                          ? { ...msg, showArtifact: false }
                          : msg
                      ));
                    }}
                  />
                </div>
              )}
              
                <div className={`mt-0.5 pl-4 pr-4 text-[10px] text-neutral-600 ${message.role === 'user' ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tiempo, serif' }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in-up px-0">
            <div className="bg-transparent border-b border-white/[0.06] pl-4 pr-4 py-2">
              <span className="text-[10px] text-neutral-600" style={{ fontFamily: 'Tiempo, serif' }}>processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - matches app style */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/[0.06] bg-transparent">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full px-3 py-2 bg-transparent text-neutral-300 border border-white/[0.06] hover:border-white/[0.12] focus:border-neutral-400 focus:outline-none resize-none text-sm placeholder-neutral-600 rounded-lg transition-all duration-300 ease-out"
              style={{ maxHeight: '120px', fontFamily: 'Tiempo, serif' }}
            />
          </div>
          <button
            onClick={isGenerating ? handleStop : handleSend}
            disabled={!isGenerating && !inputValue.trim()}
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ease-out border flex-shrink-0 ${
              isGenerating
                ? 'bg-transparent hover:bg-neutral-600/10 text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-400/50'
                : inputValue.trim()
                ? 'bg-transparent hover:bg-neutral-600/10 text-neutral-300 hover:text-neutral-200 border-neutral-500/30 hover:border-neutral-400/50'
                : 'bg-transparent text-neutral-700 border-neutral-500/10 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Tiempo, serif' }}
            title={isGenerating ? 'Stop generating' : 'Send message'}
          >
            {isGenerating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>


      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

