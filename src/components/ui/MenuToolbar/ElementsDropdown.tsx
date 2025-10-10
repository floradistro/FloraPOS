/**
 * Elements Dropdown - Canva Style
 * Everything structure-related: Backgrounds, Containers, Borders, Effects
 */

'use client'

import React, { useState } from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface ElementsDropdownProps {
  // Background Colors
  backgroundColor: string
  containerColor: string
  imageBackgroundColor: string
  onBackgroundColorsChange: (colors: {
    backgroundColor: string
    containerColor: string
    imageBackgroundColor: string
  }) => void
  
  // Opacity & Effects
  containerOpacity: number
  borderWidth: number
  borderOpacity: number
  imageOpacity: number
  blurIntensity: number
  glowIntensity: number
  onEffectsChange: (values: {
    containerOpacity: number
    borderWidth: number
    borderOpacity: number
    imageOpacity: number
    blurIntensity: number
    glowIntensity: number
  }) => void
  
  // Custom Background
  customBackground: string
  onCustomBackgroundChange: (code: string) => void
}

export function ElementsDropdown({
  backgroundColor,
  containerColor,
  imageBackgroundColor,
  onBackgroundColorsChange,
  containerOpacity,
  borderWidth,
  borderOpacity,
  imageOpacity,
  blurIntensity,
  glowIntensity,
  onEffectsChange,
  customBackground,
  onCustomBackgroundChange
}: ElementsDropdownProps) {
  const [activeTab, setActiveTab] = useState<'backgrounds' | 'opacity' | 'effects' | 'magic'>('backgrounds')
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const codeBlockRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll code block when content updates
  React.useEffect(() => {
    if (isGenerating && codeBlockRef.current) {
      codeBlockRef.current.scrollTop = codeBlockRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  const sendMessage = async () => {
    if (!userInput.trim() || isGenerating) return

    const prompt = userInput
    const userMsg = { role: 'user' as const, content: prompt }
    setMessages(prev => [...prev, userMsg])
    setUserInput('')
    setIsGenerating(true)

    try {
      const systemPrompt = `Generate ONLY pure HTML/CSS code for a background effect: "${prompt}"

STRICT RULES:
1. NO Three.js, NO JavaScript, NO canvas
2. ONLY HTML <div> elements with inline CSS styles
3. Use CSS: gradients, animations, transforms, filters
4. Format: <div style="position: absolute; inset: 0; ...">nested divs</div>
5. Add @keyframes in <style> tag if needed
6. Must be SIMPLE and WORKING

Example:
\`\`\`html
<div style="position: absolute; inset: 0; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);">
  <div style="position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 50%); animation: pulse 4s ease-in-out infinite;"></div>
</div>
<style>
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
</style>
\`\`\`

Generate for: ${prompt}`

      const response = await fetch('/api/ai/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: systemPrompt, conversation: [] })
      })

      if (!response.ok) throw new Error('Failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'content' && data.content) {
                  fullResponse += data.content
                  setMessages(prev => {
                    const newMsgs = [...prev]
                    newMsgs[newMsgs.length - 1].content = fullResponse
                    return newMsgs
                  })
                }
              } catch (e) {}
            }
          }
        }
      }

      // Extract and apply - keep code visible but formatted
      const codeMatch = fullResponse.match(/```(?:html|jsx|javascript|css)?\n?([\s\S]*?)```/)
      if (codeMatch) {
        onCustomBackgroundChange(codeMatch[1].trim())
        // Don't replace the message - keep it showing the code
      } else if (fullResponse.trim() && !fullResponse.includes('```')) {
        // No code found - show error
        setMessages(prev => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1].content = '❌ No code generated - try again'
          return newMsgs
        })
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error - try again' }])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ToolbarDropdown
        icon={<></>}
        trigger={
          <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
            </svg>
            <span className="text-xs font-medium">Elements</span>
          </div>
        }
      >
      <div className={`${activeTab === 'magic' ? 'w-[520px]' : 'w-[400px]'} transition-all duration-300`} style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'backgrounds'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Colors
          </button>
          <button
            onClick={() => setActiveTab('opacity')}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'opacity'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Opacity
          </button>
          <button
            onClick={() => setActiveTab('effects')}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'effects'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Effects
          </button>
          <button
            onClick={() => setActiveTab('magic')}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-all relative overflow-hidden ${
              activeTab === 'magic'
                ? 'text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
            style={{
              background: activeTab === 'magic' 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)'
                : 'transparent'
            }}
          >
            <span className="relative z-10">Magic</span>
            {activeTab === 'magic' && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-wave" />
            )}
          </button>
        </div>

        {/* Backgrounds Tab */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-3 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {/* Main Background */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Main Background</label>
              <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor: e.target.value, containerColor, imageBackgroundColor })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: 'none' }}
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor: e.target.value, containerColor, imageBackgroundColor })}
                  className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Container Background */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Container/Card</label>
              <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                <input
                  type="color"
                  value={containerColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor, containerColor: e.target.value, imageBackgroundColor })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: 'none' }}
                />
                <input
                  type="text"
                  value={containerColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor, containerColor: e.target.value, imageBackgroundColor })}
                  className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="#1a1a1a"
                />
              </div>
            </div>

            {/* Image Background */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Image Background</label>
              <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                <input
                  type="color"
                  value={imageBackgroundColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor, containerColor, imageBackgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: 'none' }}
                />
                <input
                  type="text"
                  value={imageBackgroundColor}
                  onChange={(e) => onBackgroundColorsChange({ backgroundColor, containerColor, imageBackgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="#230000"
                />
              </div>
            </div>

          </div>
        )}

        {/* Opacity Tab */}
        {activeTab === 'opacity' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Container</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{containerOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={containerOpacity}
                onChange={(e) => onEffectsChange({ containerOpacity: parseInt(e.target.value), borderWidth, borderOpacity, imageOpacity, blurIntensity, glowIntensity })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Border</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{borderOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={borderOpacity}
                onChange={(e) => onEffectsChange({ containerOpacity, borderWidth, borderOpacity: parseInt(e.target.value), imageOpacity, blurIntensity, glowIntensity })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Images</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{imageOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={imageOpacity}
                onChange={(e) => onEffectsChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity: parseInt(e.target.value), blurIntensity, glowIntensity })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Blur Intensity</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{blurIntensity}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={blurIntensity}
                onChange={(e) => onEffectsChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity, blurIntensity: parseInt(e.target.value), glowIntensity })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Glow</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{glowIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={glowIntensity}
                onChange={(e) => onEffectsChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity, blurIntensity, glowIntensity: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Border Width</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={borderWidth}
                onChange={(e) => onEffectsChange({ containerOpacity, borderWidth: parseInt(e.target.value), borderOpacity, imageOpacity, blurIntensity, glowIntensity })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        )}

        {/* Magic Tab - AI Chat Designer */}
        {activeTab === 'magic' && (
          <div className="flex flex-col h-[500px] animate-fade-in">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 min-h-0" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}>
              {messages.length === 0 ? (
                <div className="relative h-full flex flex-col items-center justify-center py-6 px-3">
                  {/* Subtle Geometric Background */}
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
                      backgroundSize: '30px 30px',
                      backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                      `
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '200%',
                      height: '200%',
                      transform: 'translate(-50%, -50%)',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
                      animation: 'pulse 8s ease-in-out infinite'
                    }} />
                  </div>
                  
                  {/* Logo */}
                  <div className="relative z-10 mb-6">
                    <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  
                  <div className="relative z-10 space-y-1.5 text-xs w-full">
                    <button
                      onClick={async () => {
                        const prompt = 'Aurora gradient waves'
                        const userMsg = { role: 'user' as const, content: prompt }
                        setMessages([userMsg])
                        setIsGenerating(true)
                        
                        try {
                          const systemPrompt = `Generate ONLY pure HTML/CSS code for: "${prompt}"

STRICT RULES:
1. NO Three.js, NO JavaScript, NO canvas
2. ONLY HTML <div> with inline CSS styles
3. Use CSS: gradients, animations, transforms
4. Format: <div style="position: absolute; inset: 0; ...">
5. Add @keyframes if needed
6. SIMPLE and WORKING

Output ONLY the code block.`
                          const response = await fetch('/api/ai/background', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: systemPrompt, conversation: [] })
                          })
                          
                          if (response.ok) {
                            const reader = response.body?.getReader()
                            const decoder = new TextDecoder()
                            let fullResponse = ''
                            setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                            
                            if (reader) {
                              while (true) {
                                const { done, value } = await reader.read()
                                if (done) break
                                const chunk = decoder.decode(value)
                                const lines = chunk.split('\n')
                                for (const line of lines) {
                                  if (line.startsWith('data: ')) {
                                    try {
                                      const data = JSON.parse(line.slice(6))
                                      if (data.type === 'content' && data.content) {
                                        fullResponse += data.content
                                        setMessages(prev => {
                                          const newMsgs = [...prev]
                                          newMsgs[newMsgs.length - 1].content = fullResponse
                                          return newMsgs
                                        })
                                      }
                                    } catch (e) {}
                                  }
                                }
                              }
                            }
                            const codeMatch = fullResponse.match(/```(?:html|jsx|javascript|css)?\n?([\s\S]*?)```/)
                            if (codeMatch) {
                              onCustomBackgroundChange(codeMatch[1].trim())
                            } else if (!fullResponse.includes('```')) {
                              setMessages(prev => {
                                const newMsgs = [...prev]
                                newMsgs[newMsgs.length - 1].content = '❌ No code'
                                return newMsgs
                              })
                            }
                          }
                        } catch (e) {
                          setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error' }])
                        } finally {
                          setIsGenerating(false)
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg transition-all text-left"
                      disabled={isGenerating}
                    >
                      Aurora gradient waves
                    </button>
                    <button
                      onClick={async () => {
                        const prompt = 'Animated grid pattern'
                        const userMsg = { role: 'user' as const, content: prompt }
                        setMessages([userMsg])
                        setIsGenerating(true)
                        
                        try {
                          const systemPrompt = `Generate ONLY pure HTML/CSS code for: "${prompt}"

STRICT RULES:
1. NO Three.js, NO JavaScript, NO canvas
2. ONLY HTML <div> with inline CSS styles
3. Use CSS: gradients, animations, transforms
4. Format: <div style="position: absolute; inset: 0; ...">
5. Add @keyframes if needed
6. SIMPLE and WORKING

Output ONLY the code block.`
                          const response = await fetch('/api/ai/background', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: systemPrompt, conversation: [] })
                          })
                          
                          if (response.ok) {
                            const reader = response.body?.getReader()
                            const decoder = new TextDecoder()
                            let fullResponse = ''
                            setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                            
                            if (reader) {
                              while (true) {
                                const { done, value } = await reader.read()
                                if (done) break
                                const chunk = decoder.decode(value)
                                const lines = chunk.split('\n')
                                for (const line of lines) {
                                  if (line.startsWith('data: ')) {
                                    try {
                                      const data = JSON.parse(line.slice(6))
                                      if (data.type === 'content' && data.content) {
                                        fullResponse += data.content
                                        setMessages(prev => {
                                          const newMsgs = [...prev]
                                          newMsgs[newMsgs.length - 1].content = fullResponse
                                          return newMsgs
                                        })
                                      }
                                    } catch (e) {}
                                  }
                                }
                              }
                            }
                            const codeMatch = fullResponse.match(/```(?:html|jsx|javascript|css)?\n?([\s\S]*?)```/)
                            if (codeMatch) {
                              onCustomBackgroundChange(codeMatch[1].trim())
                            } else if (!fullResponse.includes('```')) {
                              setMessages(prev => {
                                const newMsgs = [...prev]
                                newMsgs[newMsgs.length - 1].content = '❌ No code'
                                return newMsgs
                              })
                            }
                          }
                        } catch (e) {
                          setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error' }])
                        } finally {
                          setIsGenerating(false)
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg transition-all text-left"
                      disabled={isGenerating}
                    >
                      Animated grid pattern
                    </button>
                    <button
                      onClick={async () => {
                        const prompt = 'Flowing gradient waves'
                        const userMsg = { role: 'user' as const, content: prompt }
                        setMessages([userMsg])
                        setIsGenerating(true)
                        
                        try {
                          const systemPrompt = `Generate ONLY pure HTML/CSS code for: "${prompt}"

STRICT RULES:
1. NO Three.js, NO JavaScript, NO canvas
2. ONLY HTML <div> with inline CSS styles
3. Use CSS: gradients, animations, transforms
4. Format: <div style="position: absolute; inset: 0; ...">
5. Add @keyframes if needed
6. SIMPLE and WORKING

Output ONLY the code block.`
                          const response = await fetch('/api/ai/background', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: systemPrompt, conversation: [] })
                          })
                          
                          if (response.ok) {
                            const reader = response.body?.getReader()
                            const decoder = new TextDecoder()
                            let fullResponse = ''
                            setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                            
                            if (reader) {
                              while (true) {
                                const { done, value } = await reader.read()
                                if (done) break
                                const chunk = decoder.decode(value)
                                const lines = chunk.split('\n')
                                for (const line of lines) {
                                  if (line.startsWith('data: ')) {
                                    try {
                                      const data = JSON.parse(line.slice(6))
                                      if (data.type === 'content' && data.content) {
                                        fullResponse += data.content
                                        setMessages(prev => {
                                          const newMsgs = [...prev]
                                          newMsgs[newMsgs.length - 1].content = fullResponse
                                          return newMsgs
                                        })
                                      }
                                    } catch (e) {}
                                  }
                                }
                              }
                            }
                            const codeMatch = fullResponse.match(/```(?:html|jsx|javascript|css)?\n?([\s\S]*?)```/)
                            if (codeMatch) {
                              onCustomBackgroundChange(codeMatch[1].trim())
                            } else if (!fullResponse.includes('```')) {
                              setMessages(prev => {
                                const newMsgs = [...prev]
                                newMsgs[newMsgs.length - 1].content = '❌ No code'
                                return newMsgs
                              })
                            }
                          }
                        } catch (e) {
                          setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error' }])
                        } finally {
                          setIsGenerating(false)
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg transition-all text-left"
                      disabled={isGenerating}
                    >
                      Flowing gradient waves
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // Check if this message is currently streaming
                  const isStreamingMsg = idx === messages.length - 1 && isGenerating
                  
                  // For AI messages, always show code block if it contains backticks
                  const hasCodeStart = msg.role === 'assistant' && msg.content.includes('```')
                  
                  // Extract code - simple and reliable
                  let codeContent = ''
                  if (hasCodeStart) {
                    const parts = msg.content.split('```')
                    if (parts.length >= 2) {
                      const codeWithLang = parts[1] || ''
                      codeContent = codeWithLang.replace(/^(html|css|javascript|jsx|tsx)?\n?/, '')
                    }
                  }
                  
                  return (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed bg-white/10 text-white border border-white/20">
                          {msg.content}
                        </div>
                      ) : msg.content.startsWith('✅') ? (
                        <div className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed bg-white/10 text-white border border-white/20 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {msg.content}
                        </div>
                      ) : msg.content.startsWith('❌') ? (
                        <div className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed bg-white/5 text-white/60 border border-white/10">
                          {msg.content}
                        </div>
                      ) : (
                        // Code block - appears instantly, streams content
                        <div className="w-full">
                          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                            <div className="px-3 py-1.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isStreamingMsg ? 'bg-white/60 animate-pulse' : 'bg-white/30'}`} />
                                <span className="text-[10px] text-white/50 font-mono">
                                  {isStreamingMsg ? 'Generating' : 'Code'}
                                </span>
                              </div>
                              {!isStreamingMsg && codeContent && (
                                <button
                                  onClick={() => onCustomBackgroundChange(codeContent)}
                                  className="px-2 py-1 bg-white/10 hover:bg-white/15 text-white rounded text-[10px] font-medium transition-all flex items-center gap-1"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Apply
                                </button>
                              )}
                            </div>
                            
                            <div 
                              ref={isStreamingMsg ? codeBlockRef : null}
                              className="p-3 bg-[#0a0a0a] overflow-x-auto" 
                              style={{
                                maxHeight: '240px',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
                                scrollBehavior: 'smooth'
                              }}
                            >
                              <pre className="font-mono text-[10px] leading-[1.5] text-white/70" style={{
                                fontFamily: 'SF Mono, Monaco, Menlo, monospace'
                              }}>{codeContent || msg.content}{isStreamingMsg && <span className="inline-block w-1 h-3 bg-white/50 ml-0.5 animate-pulse">▊</span>}</pre>
                            </div>
                            
                            {!isStreamingMsg && codeContent && (
                              <div className="px-3 py-1 bg-white/[0.02] border-t border-white/10">
                                <span className="text-[9px] text-white/30 font-mono">
                                  {codeContent.split('\n').length} lines
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Area */}
            <div className="px-2 pb-2 pt-3 border-t border-white/10 flex-shrink-0">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isGenerating && sendMessage()}
                  placeholder="Describe your background..."
                  disabled={isGenerating}
                  className="flex-1 px-3 py-2 bg-white/5 border-0 rounded-lg text-xs text-white placeholder-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isGenerating}
                  className="px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                >
                  {isGenerating ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {customBackground && (
                <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white flex items-center justify-between border border-white/20">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Background Active
                  </div>
                  <button
                    onClick={() => {
                      onCustomBackgroundChange('')
                      setMessages([])
                    }}
                    className="text-xs text-white/60 hover:text-white transition-colors px-2 py-0.5 bg-white/5 rounded"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <style jsx>{`
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            transition: all 0.15s ease-out;
          }
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
          }
          .slider-thumb::-webkit-slider-thumb:active {
            transform: scale(1.05);
          }
          
          @keyframes gradient-wave {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          
        .animate-gradient-wave {
          background-size: 200% 200%;
          animation: gradient-wave 3s ease infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        /* Webkit scrollbar for code blocks */
        pre::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        pre::-webkit-scrollbar-track {
          background: transparent;
        }
        
        pre::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        pre::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.5;
          }
        }
      `}</style>
      </div>
    </ToolbarDropdown>
  )
}

