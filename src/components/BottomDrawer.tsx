'use client'

import { useState } from 'react'
import ChatInput from './ChatInput'
import SiriGlowBorder from './SiriGlowBorder'

interface BottomDrawerProps {
  isOpen: boolean
  onToggle: () => void
}

export default function BottomDrawer({ isOpen, onToggle }: BottomDrawerProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'chat' | 'notifications'>('chat')
  const [isAIWorking, setIsAIWorking] = useState(false)

  const tabs = [
    {
      id: 'ai',
      label: 'AI',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11.613 15.931c-.387-.302-.613-.76-.613-1.262V9.334c0-2.761 2.239-5 5-5h4.613c.387.302.613.76.613 1.262v5.335c0 2.761-2.239 5-5 5h-4.613z" />
        </svg>
      ),
    },
  ]

  const handleOptionClick = (option: 'ai' | 'chat' | 'notifications') => {
    setActiveTab(option)
  }

  return (
    <>
      {/* Siri Ring - Show when AI is working */}
      {isAIWorking && <SiriGlowBorder isLoading={true} />}
      
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/80 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white/80 hover:text-white hover:bg-neutral-900/90 transition-all duration-200"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Full Screen Drawer */}
      <div
        className={`fixed inset-0 bg-black transition-transform duration-300 ease-out z-40 flex flex-col ${
          isOpen ? 'transform translate-y-0' : 'transform translate-y-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 44px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Fixed Tab Navigation Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex justify-center gap-2 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleOptionClick(tab.id as 'ai' | 'chat' | 'notifications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neutral-900/60 border border-white/[0.08] text-text-primary'
                    : 'bg-neutral-900/40 border border-white/[0.04] text-text-secondary hover:bg-neutral-900/60 hover:text-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-4"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="h-full">
              <ChatInput onLoadingChange={setIsAIWorking} />
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatInput onLoadingChange={setIsAIWorking} />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-white font-medium text-lg mb-6">Notifications</h3>
                  <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-red-300 font-medium text-sm">Low Stock Alert</div>
                        <div className="text-red-400/80 text-xs mt-1">Product inventory below threshold</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}