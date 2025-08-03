'use client'

import { useState } from 'react'
import CustomerPreferenceQuickView from '@/components/CustomerPreferenceQuickView'
import QuickAddToPreferences from '@/components/QuickAddToPreferences'
import { Customer, CustomerPreference, PreferenceCategory } from '@/types/auth'

// Demo customer with ACF-based preferences
const DEMO_CUSTOMER: Customer = {
  id: '456',
  email: 'john.smith@example.com',
  firstName: 'John',
  lastName: 'Smith',
  phone: '555-0456',
  loyaltyPoints: 2500,
  totalSpent: 4200,
  orderCount: 22,
  lastOrderDate: '2024-01-20',
  preferences: [
    {
      id: '1',
      customerId: '456',
      category: PreferenceCategory.STRAIN_TYPE,
      value: 'Indica',
      notes: 'From Blue Dream purchase',
      addedBy: 'staff-1',
      addedAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      acfFieldKey: 'strain_type',
      productId: 123
    },
    {
      id: '2',
      customerId: '456',
      category: PreferenceCategory.EFFECTS,
      value: 'Relaxing, Euphoric',
      notes: 'From OG Kush purchase',
      addedBy: 'staff-2',
      addedAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      acfFieldKey: 'effects',
      productId: 124
    },
    {
      id: '3',
      customerId: '456',
      category: PreferenceCategory.THCA_PERCENT,
      value: '22%',
      addedBy: 'staff-1',
      addedAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-18T11:00:00Z',
      acfFieldKey: 'thca_%',
      productId: 125
    },
    {
      id: '4',
      customerId: '456',
      category: PreferenceCategory.NOSE,
      value: 'Earthy, Pine',
      notes: 'Really enjoyed the aroma profile',
      addedBy: 'staff-3',
      addedAt: '2024-01-20T16:00:00Z',
      updatedAt: '2024-01-20T16:00:00Z',
      acfFieldKey: 'nose',
      productId: 126
    }
  ],
  notes: 'Prefers evening strains, works night shifts. Very knowledgeable about terpenes.',
  createdAt: '2023-10-15T09:00:00Z',
  updatedAt: '2024-01-20T18:00:00Z'
}

// Mock product data with ACF fields
const MOCK_PRODUCT = {
  id: 127,
  name: 'Purple Punch',
  acfFields: [
    { key: 'strain_type', label: 'Strain Type', value: 'Indica', type: 'text' },
    { key: 'effects', label: 'Effects', value: 'Sleepy, Happy, Relaxed', type: 'text' },
    { key: 'thca_%', label: 'THCA %', value: '24%', type: 'text' },
    { key: 'terpene', label: 'Dominant Terpene', value: 'Myrcene', type: 'text' },
    { key: 'nose', label: 'Aroma', value: 'Sweet grape with earthy undertones', type: 'text' },
    { key: 'lineage', label: 'Lineage', value: 'Larry OG x Granddaddy Purple', type: 'text' }
  ]
}

export default function DemoACFPreferencesPage() {
  const [customer, setCustomer] = useState<Customer>(DEMO_CUSTOMER)
  const [addedPreferences, setAddedPreferences] = useState<string[]>([])

  const handleAddPreference = async (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => {
    try {
      // Call the API to save the preference
      const response = await fetch(`/api/customers/${customer.id}/preferences`, {
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
      
      // Update the local customer data
      const newPreference: CustomerPreference = {
        ...preference,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setCustomer(prev => ({
        ...prev,
        preferences: [...(prev.preferences || []), newPreference]
      }))
      
      // Add to our tracking list
      setAddedPreferences(prev => [...prev, `${preference.category}:${preference.value}`])
      
      // Show success message
      alert(`✅ Added preference: ${preference.category} = ${preference.value}`)
    } catch (error) {
      console.error('Failed to add preference:', error)
      alert(`❌ Failed to add preference: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ACF-Based Customer Preferences Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Customer Profile & Preferences */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Profile</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h3 className="font-semibold text-lg mb-2">{customer.firstName} {customer.lastName}</h3>
              <p className="text-gray-600 text-sm mb-1">{customer.email}</p>
              <p className="text-gray-600 text-sm mb-1">Phone: {customer.phone}</p>
              <p className="text-gray-600 text-sm mb-1">Loyalty Points: {customer.loyaltyPoints}</p>
              <p className="text-gray-600 text-sm">Total Orders: {customer.orderCount}</p>
            </div>
            
                         {/* Customer Preferences Display */}
             <CustomerPreferenceQuickView 
               customer={customer} 
               onAddPreference={handleAddPreference}
             />
          </div>

          {/* Right Column - Product & Quick Add */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Item - Quick Add Preferences</h2>
            
            {/* Mock Cart Item */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{MOCK_PRODUCT.name}</h3>
                  <p className="text-gray-600 text-sm">Product ID: {MOCK_PRODUCT.id}</p>
                  <p className="text-green-600 font-medium">$45.00</p>
                </div>
                
                {/* Quick Add to Preferences Button */}
                <div className="ml-4">
                  <QuickAddToPreferences
                    customer={customer}
                    productId={MOCK_PRODUCT.id}
                    productName={MOCK_PRODUCT.name}
                    onAddPreference={handleAddPreference}
                  />
                </div>
              </div>

              {/* ACF Fields Preview */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Product Details (ACF Fields)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_PRODUCT.acfFields.map((field) => (
                    <div key={field.key} className="bg-gray-50 p-3 rounded border">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {field.label}
                      </div>
                      <div className="text-sm text-gray-900">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recently Added Preferences */}
            {addedPreferences.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Recently Added Preferences</h3>
                <div className="space-y-1">
                  {addedPreferences.map((pref, index) => (
                    <div key={index} className="text-sm text-green-700">
                      • {pref.replace(':', ': ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">How ACF-Based Preferences Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">1. Product ACF Fields</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Products have ACF fields like strain_type, effects, thca_%</li>
                <li>These map directly to preference categories</li>
                <li>Staff can quickly save any ACF field as a customer preference</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">2. Quick Add from Cart</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>When customer has items in cart, "Save Preferences" button appears</li>
                <li>Shows available ACF fields that can be saved as preferences</li>
                <li>Automatically excludes preferences customer already has</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">3. Smart Display</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Allergies and medical needs highlighted in red</li>
                <li>ACF-based preferences organized by category</li>
                <li>Shows which product the preference came from</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">4. Integration Benefits</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>No manual data entry - preferences learned from purchases</li>
                <li>Consistent with your existing ACF field structure</li>
                <li>Staff can match future products to learned preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Integration Steps</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Add <code className="bg-gray-200 px-1 rounded">CustomerPreferenceQuickView</code> to your checkout flow</li>
            <li>Add <code className="bg-gray-200 px-1 rounded">QuickAddToPreferences</code> to cart items when customer is assigned</li>
            <li>Connect the API endpoints to save preferences to WooCommerce user metadata</li>
            <li>Train staff to use the quick-add feature when customers find products they like</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 