'use client'

import { useState } from 'react'
import QuickAddToPreferences from '@/components/QuickAddToPreferences'
import QuickManualPreference from '@/components/QuickManualPreference'
import { Customer, CustomerPreference, PreferenceCategory } from '@/types/auth'

const TEST_CUSTOMER: Customer = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  preferences: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export default function TestButtonsPage() {
  const [messages, setMessages] = useState<string[]>([])

  const handleAddPreference = async (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => {
    try {
      // Call the API to save the preference
      const response = await fetch(`/api/customers/${TEST_CUSTOMER.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      })

      if (!response.ok) {
        throw new Error('Failed to save preference')
      }

      const result = await response.json()
      console.log('Preference saved successfully:', result)
      
      const message = `✅ Added preference: ${preference.category} = ${preference.value}`
      setMessages(prev => [...prev, message])
    } catch (error) {
      console.error('Failed to add preference:', error)
      const message = `❌ Failed to add preference: ${error}`
      setMessages(prev => [...prev, message])
    }
  }

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, msg])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Button Test Page</h1>
        
        <div className="space-y-8">
          {/* Simple Test Button */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Simple Test Button</h2>
            <button
              onClick={() => {
                console.log('Simple button clicked!')
                addMessage('Simple button clicked!')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Click Me (Simple Test)
            </button>
          </div>

          {/* Manual Preference Button */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Manual Preference Button</h2>
            <QuickManualPreference
              customer={TEST_CUSTOMER}
              onAddPreference={handleAddPreference}
            />
          </div>

          {/* Quick Add Button (with mock product) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Add Preferences Button</h2>
            <QuickAddToPreferences
              customer={TEST_CUSTOMER}
              productId={123}
              productName="Test Product"
              onAddPreference={handleAddPreference}
            />
          </div>

          {/* Messages Log */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Messages Log</h2>
            <div className="space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages yet...</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded text-sm">
                    {msg}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setMessages([])}
              className="mt-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 