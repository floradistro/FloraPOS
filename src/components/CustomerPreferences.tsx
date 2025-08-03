'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Tag, Heart, AlertCircle, Leaf, Zap, Star } from 'lucide-react'
import { Customer, CustomerPreference, PreferenceCategory } from '@/types/auth'

interface CustomerPreferencesProps {
  customer: Customer
  onUpdatePreferences: (preferences: CustomerPreference[]) => Promise<void>
  canEdit?: boolean
}

// Updated categories for cannabis products
const CATEGORY_LABELS: Record<string, string> = {
  'strain_preference': 'Strain Preference',
  'consumption_method': 'Consumption Method',
  'potency_level': 'Potency Level',
  'flavor_profile': 'Flavor Profile',
  'effect_preference': 'Effect Preference',
  'price_range': 'Price Range',
  'brand_preference': 'Brand Preference',
  'product_type': 'Product Type',
  'thca_%': 'THCa %',
  'nose': 'Nose/Aroma',
  'effects': 'Effects',
  'terpene': 'Terpene',
  'strain_type': 'Strain Type',
  'lineage': 'Lineage',
  'custom': 'Custom'
}

const CATEGORY_ICONS: Record<string, any> = {
  'strain_preference': Leaf,
  'consumption_method': Zap,
  'potency_level': AlertCircle,
  'flavor_profile': Heart,
  'effect_preference': Star,
  'price_range': Tag,
  'brand_preference': Tag,
  'product_type': Tag,
  'thca_%': AlertCircle,
  'nose': Heart,
  'effects': Star,
  'terpene': Leaf,
  'strain_type': Leaf,
  'lineage': Tag,
  'custom': Tag
}

const CATEGORY_COLORS: Record<string, string> = {
  'strain_preference': 'bg-green-100 text-green-800 border-green-200',
  'consumption_method': 'bg-blue-100 text-blue-800 border-blue-200',
  'potency_level': 'bg-purple-100 text-purple-800 border-purple-200',
  'flavor_profile': 'bg-pink-100 text-pink-800 border-pink-200',
  'effect_preference': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'price_range': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'brand_preference': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'product_type': 'bg-amber-100 text-amber-800 border-amber-200',
  'thca_%': 'bg-purple-100 text-purple-800 border-purple-200',
  'nose': 'bg-pink-100 text-pink-800 border-pink-200',
  'effects': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'terpene': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'strain_type': 'bg-green-100 text-green-800 border-green-200',
  'lineage': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'custom': 'bg-gray-100 text-gray-800 border-gray-200'
}

// Predefined options for quick selection
const PREFERENCE_OPTIONS: Record<string, string[]> = {
  'strain_preference': ['Indica Dominant', 'Sativa Dominant', 'Hybrid', 'Pure Indica', 'Pure Sativa'],
  'consumption_method': ['Flower', 'Edibles', 'Concentrates', 'Vape Cartridges', 'Pre-Rolls', 'Beverages'],
  'potency_level': ['Low (5-15% THC)', 'Medium (15-20% THC)', 'High (20-25% THC)', 'Very High (25%+ THC)'],
  'flavor_profile': ['Citrus', 'Berry', 'Pine', 'Earthy', 'Sweet', 'Diesel', 'Floral', 'Spicy'],
  'effect_preference': ['Relaxing', 'Energizing', 'Euphoric', 'Sleepy', 'Happy', 'Focused', 'Creative', 'Pain Relief'],
  'price_range': ['Budget ($10-20)', 'Mid-Range ($20-40)', 'Premium ($40-60)', 'Luxury ($60+)'],
  'product_type': ['Flower', 'Edibles', 'Concentrates', 'Topicals', 'Beverages', 'Pre-Rolls'],
  'strain_type': ['Indica', 'Sativa', 'Hybrid', 'Indica-dominant', 'Sativa-dominant'],
  'effects': ['Relaxing', 'Energizing', 'Euphoric', 'Sleepy', 'Happy', 'Focused', 'Creative'],
  'terpene': ['Myrcene', 'Limonene', 'Pinene', 'Linalool', 'Caryophyllene', 'Humulene']
}

export default function CustomerPreferences({ customer, onUpdatePreferences, canEdit = true }: CustomerPreferencesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('strain_preference')
  const [newValue, setNewValue] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [preferences, setPreferences] = useState<CustomerPreference[]>(customer.preferences || [])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch preferences from Flora API
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!customer.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/customers/${customer.id}/preferences`)
        if (response.ok) {
          const data = await response.json()
          setPreferences(data.preferences || [])
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [customer.id])

  const handleAddPreference = async () => {
    if (!newValue.trim()) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${customer.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCategory,
          value: newValue.trim(),
          notes: newNotes.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || [])
        await onUpdatePreferences(data.preferences || [])
        
        // Reset form
        setNewValue('')
        setNewNotes('')
        setIsAdding(false)
      } else {
        console.error('Failed to add preference')
      }
    } catch (error) {
      console.error('Error adding preference:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePreference = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${customer.id}/preferences?preferenceId=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || [])
        await onUpdatePreferences(data.preferences || [])
      } else {
        console.error('Failed to remove preference')
      }
    } catch (error) {
      console.error('Error removing preference:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Preferences</h3>
        {canEdit && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Preference
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Display existing preferences */}
      <div className="space-y-2 mb-4">
        {preferences.length === 0 && !isLoading ? (
          <p className="text-gray-500 text-sm">No preferences set</p>
        ) : (
          preferences.map((pref) => {
            const Icon = CATEGORY_ICONS[pref.category] || Tag
            const colorClass = CATEGORY_COLORS[pref.category] || 'bg-gray-100 text-gray-800 border-gray-200'
            
            return (
              <div key={pref.id} className={`flex items-start gap-2 p-3 rounded-md border ${colorClass}`}>
                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{CATEGORY_LABELS[pref.category] || pref.category}:</span>
                    <span className="text-sm">{pref.value}</span>
                  </div>
                  {pref.notes && (
                    <p className="text-xs mt-1 opacity-75">{pref.notes}</p>
                  )}
                  <p className="text-xs mt-1 opacity-50">
                    Added: {new Date(pref.addedAt || pref.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleRemovePreference(pref.id)}
                    disabled={isLoading}
                    className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add new preference form */}
      {isAdding && (
        <div className="border-t pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {PREFERENCE_OPTIONS[newCategory] ? (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a preference...</option>
                {PREFERENCE_OPTIONS[newCategory].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter preference..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddPreference}
              disabled={isLoading || !newValue.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Preference'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewValue('')
                setNewNotes('')
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 