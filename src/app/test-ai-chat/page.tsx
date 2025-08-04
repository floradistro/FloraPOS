'use client'

import { useState } from 'react'
import ChatInput from '@/components/ChatInput'

export default function TestAIChat() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">AI Chat Test Page</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mb-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          {isOpen ? 'Hide' : 'Show'} Chat
        </button>
      </div>

      {isOpen && (
        <div className="h-[600px] bg-neutral-900 border border-white/10 mx-4 rounded-lg">
          <ChatInput />
        </div>
      )}

      <div className="p-4 mt-8 bg-neutral-900 mx-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Examples:</h2>
        <ul className="space-y-1 text-sm text-gray-400">
          <li>• "Show me all products"</li>
          <li>• "What are my low stock items?"</li>
          <li>• "List recent orders"</li>
          <li>• "Show inventory locations"</li>
          <li>• "Get sales report for today"</li>
        </ul>
      </div>
    </div>
  )
}