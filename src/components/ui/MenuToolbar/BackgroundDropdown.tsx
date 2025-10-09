'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BackgroundDropdownProps {
  value: string;
  onChange: (code: string) => void;
}

export const BackgroundDropdown: React.FC<BackgroundDropdownProps> = ({
  value,
  onChange
}) => {
  const [mode, setMode] = useState<'chat' | 'code'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [codeInput, setCodeInput] = useState(value);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update codeInput when value changes externally
  useEffect(() => {
    if (value !== codeInput && mode === 'code') {
      setCodeInput(value);
    }
  }, [value]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cleanCode = (rawCode: string): string => {
    // Remove markdown code blocks
    return rawCode
      .replace(/```(?:html|jsx|tsx|javascript|react)?\n?/g, '')
      .replace(/```/g, '')
      .trim();
  };

  const extractCode = (text: string): string | null => {
    const cleaned = cleanCode(text);
    
    // Find <div> tags
    const divMatch = cleaned.match(/<div[\s\S]*<\/div>/);
    if (divMatch) {
      return divMatch[0];
    }
    
    if (cleaned.startsWith('<div')) {
      return cleaned;
    }
    
    return null;
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;

    const userMsg: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversation: messages.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content' && data.content) {
                  fullResponse += data.content;
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = fullResponse;
                    return newMsgs;
                  });
                }
              } catch (e) {
                // Skip
              }
            }
          }
        }
      }

      // Extract and apply code
      const code = extractCode(fullResponse);
      if (code) {
        const cleaned = cleanCode(code);
        setCodeInput(cleaned);
        onChange(cleaned);
        setMode('code');
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error: ${error.message}`
        }]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleApply = () => {
    console.log('🎨 BackgroundDropdown: Apply clicked, raw code length:', codeInput.length);
    const cleaned = cleanCode(codeInput);
    console.log('🧹 BackgroundDropdown: Cleaned code length:', cleaned.length);
    console.log('🎨 BackgroundDropdown: First 100 chars:', cleaned.substring(0, 100));
    onChange(cleaned);
    console.log('✅ BackgroundDropdown: onChange called');
  };

  const handleClear = () => {
    setCodeInput('');
    onChange('');
    setMessages([]);
  };

  return (
    <ToolbarDropdown
      label="Magic BG"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      }
    >
      <div className="w-[600px]">
        {/* Tabs */}
        <div className="border-b border-neutral-700 p-2 flex gap-1 flex-shrink-0">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
              mode === 'chat' ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            🤖 AI Designer
          </button>
          <button
            onClick={() => setMode('code')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
              mode === 'code' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ✏️ Code Editor
          </button>
        </div>

        {mode === 'chat' ? (
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900/50 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-neutral-400 text-sm py-12">
                  <div className="text-4xl mb-3">🎨</div>
                  <div className="font-semibold mb-2">AI Background Designer</div>
                  <div className="text-xs">Ask me to create any background...</div>
                  <div className="mt-4 text-left space-y-2 max-w-sm mx-auto text-xs">
                    <div>• "Purple gradient waves"</div>
                    <div>• "Floating particles with stars"</div>
                    <div>• "Aurora borealis effect"</div>
                    <div>• "Geometric pattern animation"</div>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-neutral-800 text-neutral-200'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-neutral-700 p-4 bg-neutral-900 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isGenerating && sendMessage()}
                  placeholder="Describe your background..."
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {isGenerating ? (
                  <button
                    onClick={() => abortControllerRef.current?.abort()}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!userInput.trim()}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                  >
                    Generate
                  </button>
                )}
              </div>
              
              {value && (
                <button
                  onClick={handleClear}
                  className="w-full mt-3 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg text-sm"
                >
                  Clear Background
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Custom HTML/CSS Background
                </label>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder='<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'
                  className="w-full h-[500px] px-3 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                >
                  Apply Background
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg font-medium text-sm"
                >
                  Clear
                </button>
              </div>
              
              {value && (
                <div className="text-xs text-green-400 text-center bg-green-500/10 py-2 rounded border border-green-500/20">
                  ✓ Background active ({value.length} chars)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolbarDropdown>
  );
};

