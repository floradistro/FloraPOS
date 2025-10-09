'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ToolbarDropdown } from './ToolbarDropdown';
import { threeSceneCategories, isThreeJsScene } from '@/lib/three-scenes';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  extractedCode?: string;
}

interface BackgroundDropdownProps {
  value: string;
  onChange: (code: string) => void;
}

export const BackgroundDropdown: React.FC<BackgroundDropdownProps> = ({
  value,
  onChange
}) => {
  const [mode, setMode] = useState<'chat' | 'code' | 'threejs'>('chat');
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
      .replace(/```(?:html|jsx|tsx|javascript|react|json)?\n?/g, '')
      .replace(/```/g, '')
      .trim();
  };

  const extractCode = (text: string): string | null => {
    const cleaned = cleanCode(text);
    
    // Check for CUSTOM Three.js scene (AI-generated code)
    if (cleaned.includes('CUSTOM_THREE_SCENE')) {
      // Extract everything from CUSTOM_THREE_SCENE onwards
      // Need to match the entire function including all nested braces
      const startIndex = cleaned.indexOf('CUSTOM_THREE_SCENE');
      if (startIndex !== -1) {
        // Find the function and capture all of it
        const fromStart = cleaned.substring(startIndex);
        const funcMatch = fromStart.match(/function\s+\w+\s*\([^)]*\)\s*\{/);
        
        if (funcMatch && funcMatch.index !== undefined) {
          const funcStart = funcMatch.index;
          let braceCount = 0;
          let inFunction = false;
          let endIndex = -1;
          
          // Parse through to find matching closing brace
          for (let i = funcStart; i < fromStart.length; i++) {
            if (fromStart[i] === '{') {
              braceCount++;
              inFunction = true;
            } else if (fromStart[i] === '}') {
              braceCount--;
              if (inFunction && braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
          
          if (endIndex !== -1) {
            const extracted = fromStart.substring(0, endIndex).trim();
            console.log('✅ Extracted custom Three.js scene, length:', extracted.length);
            return extracted;
          }
        }
      }
      console.warn('⚠️ Could not extract custom scene function');
    }
    
    // Check for pre-built Three.js scene configuration
    if (cleaned.includes('THREE_JS_SCENE')) {
      // Extract the Three.js scene configuration
      const sceneMatch = cleaned.match(/THREE_JS_SCENE[\s\S]*?\{[\s\S]*?\}/);
      if (sceneMatch) {
        console.log('✅ Extracted pre-built Three.js scene');
        return sceneMatch[0].trim();
      }
    }
    
    // Find <div> tags for HTML/CSS backgrounds
    const divMatch = cleaned.match(/<div[\s\S]*<\/div>/);
    if (divMatch) {
      console.log('✅ Extracted HTML/CSS background');
      return divMatch[0];
    }
    
    if (cleaned.startsWith('<div')) {
      return cleaned;
    }
    
    console.warn('⚠️ No valid code pattern found');
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

      // Extract code but don't auto-apply - let user confirm
      const code = extractCode(fullResponse);
      if (code) {
        const cleaned = cleanCode(code);
        console.log('🎨 Extracted code:', cleaned.substring(0, 200));
        setCodeInput(cleaned);
        
        // Update the last message with extracted code
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].extractedCode = cleaned;
          return newMsgs;
        });
        
        console.log('✅ Code extracted and ready to apply');
      } else {
        console.warn('⚠️ No code extracted from AI response');
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
    
    // Don't clean custom Three.js scenes - they need to stay as-is
    const isCustomScene = codeInput.includes('CUSTOM_THREE_SCENE');
    const cleaned = isCustomScene ? codeInput.trim() : cleanCode(codeInput);
    
    console.log('🧹 BackgroundDropdown: Cleaned code length:', cleaned.length);
    console.log('🎨 BackgroundDropdown: Type:', isCustomScene ? 'CUSTOM' : 'OTHER');
    console.log('🎨 BackgroundDropdown: First 100 chars:', cleaned.substring(0, 100));
    
    onChange(cleaned);
    console.log('✅ BackgroundDropdown: onChange called with cleaned code');
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
            onClick={() => setMode('threejs')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
              mode === 'threejs' ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            🎮 3D Scenes
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

        {mode === 'threejs' ? (
          <div className="flex flex-col h-[600px] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Three.js Scene Selector */}
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🎮</div>
                <div className="font-semibold text-white mb-1">Three.js 3D Backgrounds</div>
                <div className="text-xs text-neutral-400">Select a WebGL-powered animated background</div>
              </div>

              {Object.entries(threeSceneCategories).map(([category, scenes]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider px-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {scenes.map((scene) => (
                      <button
                        key={scene.name}
                        onClick={() => {
                          onChange(scene.code);
                          setCodeInput(scene.code);
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          value === scene.code
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600 hover:bg-neutral-750'
                        }`}
                      >
                        <div className="font-medium text-sm text-white mb-1">
                          {scene.name}
                        </div>
                        <div className="text-xs text-neutral-400">
                          Click to apply
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {value && isThreeJsScene(value) && (
                <button
                  onClick={handleClear}
                  className="w-full mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg text-sm"
                >
                  Clear Background
                </button>
              )}
            </div>
          </div>
        ) : mode === 'chat' ? (
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900/50 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-neutral-400 text-sm py-8">
                  <div className="text-5xl mb-4">🎨✨</div>
                  <div className="font-bold text-white text-lg mb-2">AI Background Designer</div>
                  <div className="text-sm mb-4 text-neutral-300">I create custom Three.js 3D scenes from scratch!</div>
                  
                  <div className="mt-6 text-left space-y-3 max-w-md mx-auto">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <div className="font-semibold text-cyan-300 mb-2 text-xs">🎮 Three.js Examples:</div>
                      <div className="space-y-1 text-xs text-neutral-300">
                        <div>• "Create a Halloween vortex with pumpkins"</div>
                        <div>• "Build a DNA helix made of glowing orbs"</div>
                        <div>• "Make a fractal tree of particles"</div>
                        <div>• "Create a kaleidoscope effect"</div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="font-semibold text-purple-300 mb-2 text-xs">🎨 HTML/CSS Examples:</div>
                      <div className="space-y-1 text-xs text-neutral-300">
                        <div>• "Purple gradient with animated waves"</div>
                        <div>• "Aurora borealis effect"</div>
                        <div>• "Neon grid background"</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-neutral-800 text-neutral-200'
                  }`}>
                    <ReactMarkdown
                      className="text-sm prose prose-invert prose-sm max-w-none"
                      components={{
                        code: ({node, inline, className, children, ...props}) => {
                          const content = String(children).replace(/\n$/, '');
                          if (inline) {
                            return <code className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300" {...props}>{content}</code>
                          }
                          const isThreeJs = content.includes('CUSTOM_THREE_SCENE') || content.includes('THREE_JS_SCENE');
                          return (
                            <pre className={`${isThreeJs ? 'bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border border-cyan-500/30' : 'bg-neutral-900'} p-3 rounded-lg text-xs overflow-x-auto my-2 shadow-lg`}>
                              <code className="font-mono text-cyan-100" {...props}>{content}</code>
                            </pre>
                          )
                        },
                        p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2 ml-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>,
                        li: ({children}) => <li className="text-neutral-300">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-neutral-300">{children}</em>,
                        h1: ({children}) => <h1 className="text-xl font-bold text-white mb-2 mt-3">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold text-white mb-2 mt-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-bold text-white mb-1 mt-2">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Show apply button if code was extracted */}
                  {msg.role === 'assistant' && msg.extractedCode && (
                    <div className="mt-2 space-y-2">
                      <button
                        onClick={() => {
                          onChange(msg.extractedCode!);
                          setCodeInput(msg.extractedCode!);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        {msg.extractedCode.includes('CUSTOM_THREE_SCENE') ? 'Apply Custom 3D Scene' : 
                         msg.extractedCode.includes('THREE_JS_SCENE') ? 'Apply 3D Scene' : 
                         'Apply Background'}
                      </button>
                      <div className="text-xs text-neutral-400 px-2">
                        {msg.extractedCode.includes('CUSTOM_THREE_SCENE') && '🎮 Custom Three.js scene ready'}
                        {msg.extractedCode.includes('THREE_JS_SCENE') && '🎮 Three.js scene configuration ready'}
                        {!msg.extractedCode.includes('THREE') && '🎨 HTML/CSS background ready'}
                      </div>
                    </div>
                  )}
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
                  {codeInput.includes('CUSTOM_THREE_SCENE') ? '🎮 Custom Three.js Scene Code' : 
                   codeInput.includes('THREE_JS_SCENE') ? '🎮 Three.js Scene Config' : 
                   '✏️ Custom HTML/CSS Background'}
                </label>
                <div className="text-xs text-neutral-400 mb-2">
                  {codeInput.includes('CUSTOM_THREE_SCENE') ? 
                    'Paste your AI-generated custom Three.js scene here' :
                    codeInput.includes('THREE_JS_SCENE') ?
                    'Pre-built scene configuration' :
                    'Paste HTML/CSS code or custom Three.js scene'}
                </div>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={`Paste your code here:

For Custom Three.js Scene:
CUSTOM_THREE_SCENE
function MyScene() {
  // Your Three.js code...
}

For HTML/CSS:
<div style="...">
  <!-- Your HTML -->
</div>`}
                  className="w-full h-[500px] px-3 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  disabled={!codeInput.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {codeInput.includes('CUSTOM_THREE_SCENE') ? 'Apply Custom Scene' : 
                   codeInput.includes('THREE_JS_SCENE') ? 'Apply Scene Config' :
                   'Apply Background'}
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg font-medium text-sm"
                >
                  Clear
                </button>
              </div>
              
              {value && (
                <div className={`text-xs text-center py-2 rounded border ${
                  value.includes('CUSTOM_THREE_SCENE') ? 
                    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                  value.includes('THREE_JS_SCENE') ?
                    'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                    'text-green-400 bg-green-500/10 border-green-500/20'
                }`}>
                  ✓ Background active ({value.length} chars) {
                    value.includes('CUSTOM_THREE_SCENE') ? '🎮 Custom Scene' :
                    value.includes('THREE_JS_SCENE') ? '🎮 Pre-built Scene' :
                    '🎨 HTML/CSS'
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolbarDropdown>
  );
};

