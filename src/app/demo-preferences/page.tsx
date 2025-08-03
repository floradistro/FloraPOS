'use client'

import { useState } from 'react'
import CustomerPreferences from '@/components/CustomerPreferences'
import CustomerPreferenceQuickView from '@/components/CustomerPreferenceQuickView'
import { Customer, CustomerPreference, PreferenceCategory } from '@/types/auth'

// Demo customer data
const DEMO_CUSTOMER: Customer = {
  id: '123',
  email: 'sarah.johnson@example.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  phone: '555-0123',
  loyaltyPoints: 1250,
  totalSpent: 2800,
  orderCount: 15,
  lastOrderDate: '2024-01-25',
  preferences: [
    {
      id: '2',
      customerId: '123',
      category: PreferenceCategory.STRAIN_TYPE,
      value: 'Indica-dominant hybrids',
      notes: 'Prefers evening use, works night shifts',
      addedBy: 'staff-2',
      addedAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: '3',
      customerId: '123',
      category: PreferenceCategory.THCA_PERCENT,
      value: '18-22%',
      notes: 'Moderate to high potency preferred',
      addedBy: 'staff-1',
      addedAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-18T11:00:00Z'
    },
    {
      id: '4',
      customerId: '123',
      category: PreferenceCategory.EFFECTS,
      value: 'Relaxing, Sleep-inducing',
      notes: 'Uses for insomnia and stress relief',
      addedBy: 'staff-3',
      addedAt: '2024-01-20T16:00:00Z',
      updatedAt: '2024-01-20T16:00:00Z'
    }
  ],
  notes: 'Regular customer, very knowledgeable about cannabis. Prefers evening strains for sleep.',
  createdAt: '2023-08-15T09:00:00Z',
  updatedAt: '2024-01-25T18:00:00Z'
}

export default function DemoPreferencesPage() {
  const [customer, setCustomer] = useState<Customer>(DEMO_CUSTOMER)
  const [showQuickView, setShowQuickView] = useState(true)

  const handleUpdatePreferences = async (preferences: CustomerPreference[]) => {
    // In a real app, this would call the API
    console.log('Updating preferences:', preferences)
    setCustomer({ ...customer, preferences })
    // Simulate API call
    return new Promise<void>((resolve) => setTimeout(resolve, 500))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Preferences Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Full Preference Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff View - Customer Profile</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h3 className="font-semibold text-lg mb-2">{customer.firstName} {customer.lastName}</h3>
              <p className="text-gray-600 text-sm mb-1">{customer.email}</p>
              <p className="text-gray-600 text-sm mb-1">Phone: {customer.phone}</p>
              <p className="text-gray-600 text-sm mb-1">Loyalty Points: {customer.loyaltyPoints}</p>
              <p className="text-gray-600 text-sm">Total Orders: {customer.orderCount}</p>
            </div>
            
            <CustomerPreferences
              customer={customer}
              onUpdatePreferences={handleUpdatePreferences}
              canEdit={true}
            />
          </div>

          {/* Right Column - Checkout Quick View */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Checkout View - Quick Reference</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Point of Sale Screen</h3>
                <button
                  onClick={() => setShowQuickView(!showQuickView)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showQuickView ? 'Hide' : 'Show'} Preferences
                </button>
              </div>
              
              {showQuickView && (
                <CustomerPreferenceQuickView customer={customer} />
              )}
              
              <div className="mt-6 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Staff Action Items:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Recommend indica-dominant hybrids for evening</li>
                  <li>Show products with 18-22% THCa</li>
                  <li>Focus on relaxing, sleep-inducing effects</li>
                  <li>Perfect for night shift workers</li>
                </ul>
              </div>
            </div>

            {/* Example Product Matches */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold mb-4">Recommended Products (Based on Preferences)</h3>
              <div className="space-y-3">
                <div className="p-3 border border-green-200 rounded bg-green-50">
                  <p className="font-medium text-green-800">✓ Blueberry Kush (Indica)</p>
                  <p className="text-sm text-green-700">18% THC • Fruity/Berry • Organic</p>
                </div>
                <div className="p-3 border border-green-200 rounded bg-green-50">
                  <p className="font-medium text-green-800">✓ Purple Punch (Indica-dominant)</p>
                  <p className="text-sm text-green-700">17% THC • Grape/Berry • Great for sleep</p>
                </div>
                <div className="p-3 border border-red-200 rounded bg-red-50">
                  <p className="font-medium text-red-800">✗ Chocolate Chip Cookies (Edible)</p>
                  <p className="text-sm text-red-700">Contains: Tree nuts (almonds)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Implementation Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Preferences are stored as WooCommerce user metadata</li>
            <li>Staff can add/edit preferences from customer profiles</li>
            <li>Allergies and medical needs are highlighted for safety</li>
            <li>Quick view appears automatically during checkout</li>
            <li>System can be extended to auto-match products to preferences</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 