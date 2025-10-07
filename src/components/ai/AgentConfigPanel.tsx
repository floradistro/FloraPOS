'use client';

import React, { useState, useEffect } from 'react';
import { Agent, agentsService, UpdateAgentData } from '../../services/agents-service';

interface AgentConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentUpdated?: (agent: Agent) => void;
}

const MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Fast, balanced' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Slower, highest quality' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous generation' },
];

export function AgentConfigPanel({ isOpen, onClose, onAgentUpdated }: AgentConfigPanelProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);

  useEffect(() => {
    if (isOpen) {
      loadAgent();
    }
  }, [isOpen]);

  const loadAgent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const activeAgent = await agentsService.getActiveAgent();
      setAgent(activeAgent);
      setName(activeAgent.name);
      setModel(activeAgent.model);
      setSystemPrompt(activeAgent.system_prompt);
      setTemperature(parseFloat(activeAgent.temperature.toString()));
      setMaxTokens(parseInt(activeAgent.max_tokens.toString()));
    } catch (err) {
      console.error('Failed to load agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updates: UpdateAgentData = {
        name,
        model,
        system_prompt: systemPrompt,
        temperature,
        max_tokens: maxTokens
      };
      
      const updatedAgent = await agentsService.updateAgent(agent.id, updates);
      
      if (onAgentUpdated) {
        onAgentUpdated(updatedAgent);
      }
      
      onClose();
    } catch (err) {
      console.error('Failed to save agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header - matches chat style */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.06] bg-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-neutral-300 flex items-center gap-2" style={{ fontFamily: 'Tiempo, serif' }}>
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Agent Configuration
          </h3>
          {!saving && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all duration-300 ease-out bg-transparent hover:bg-neutral-600/10 border border-transparent hover:border-neutral-500/30"
            >
              <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-5 h-5 text-neutral-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm mb-4" style={{ fontFamily: 'Tiempo, serif' }}>{error}</p>
            <button
              onClick={loadAgent}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Agent Name */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5" style={{ fontFamily: 'Tiempo, serif' }}>
                Agent Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-transparent border border-white/[0.06] hover:border-white/[0.12] focus:border-neutral-400 rounded-lg text-neutral-300 focus:outline-none transition-all duration-300 ease-out disabled:opacity-50"
                style={{ fontFamily: 'Tiempo, serif' }}
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5" style={{ fontFamily: 'Tiempo, serif' }}>
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-transparent border border-white/[0.06] hover:border-white/[0.12] focus:border-neutral-400 rounded-lg text-neutral-300 focus:outline-none transition-all duration-300 ease-out disabled:opacity-50"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-neutral-900">
                    {m.name} - {m.description}
                  </option>
                ))}
              </select>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5" style={{ fontFamily: 'Tiempo, serif' }}>
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                disabled={saving}
                rows={10}
                className="w-full px-3 py-2 bg-transparent border border-white/[0.06] hover:border-white/[0.12] focus:border-neutral-400 rounded-lg text-neutral-300 text-xs focus:outline-none transition-all duration-300 ease-out resize-none disabled:opacity-50"
                style={{ fontFamily: 'Monaco, Menlo, monospace' }}
                placeholder="Define how the AI should behave..."
              />
              <p className="text-[10px] text-neutral-500 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                {systemPrompt.length} characters
              </p>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                  Temperature
                </label>
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={saving}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #525252 0%, #525252 ${temperature * 100}%, #262626 ${temperature * 100}%, #262626 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-neutral-600 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                  Max Tokens
                </label>
                <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>{maxTokens.toLocaleString()}</span>
              </div>
              <select
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-transparent border border-white/[0.06] hover:border-white/[0.12] focus:border-neutral-400 rounded-lg text-neutral-300 focus:outline-none transition-all duration-300 ease-out disabled:opacity-50"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                <option value="1024" className="bg-neutral-900">1,024 - Short</option>
                <option value="2048" className="bg-neutral-900">2,048 - Medium</option>
                <option value="4096" className="bg-neutral-900">4,096 - Standard</option>
                <option value="8192" className="bg-neutral-900">8,192 - Long (Artifacts ✓)</option>
                <option value="16384" className="bg-neutral-900">16,384 - Extended</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-transparent border border-white/[0.06] rounded-lg p-3">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-neutral-400 leading-relaxed" style={{ fontFamily: 'Tiempo, serif' }}>
                    Agent optimized for code artifacts with high creativity (1.0) and extended tokens (8192). 
                    Lower temperature for data analysis, higher for creative coding.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - matches chat style */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/[0.06] bg-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {agent && (
              <span>Updated: {new Date(agent.updated_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg transition-all duration-300 ease-out disabled:opacity-50"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-3 py-1.5 text-xs text-neutral-200 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg transition-all duration-300 ease-out disabled:opacity-50 flex items-center gap-1.5"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

