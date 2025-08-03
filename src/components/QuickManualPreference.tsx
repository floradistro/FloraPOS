'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Customer, CustomerPreference } from '@/types/auth'

interface QuickManualPreferenceProps {
  customer: Customer
  onAddPreference: (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => Promise<void>
  className?: string
  onCancel?: () => void
  compact?: boolean
}

// Updated categories for cannabis products
const QUICK_CATEGORIES = [
  { value: 'strain_preference', label: 'Strain Preference' },
  { value: 'consumption_method', label: 'Consumption Method' },
  { value: 'potency_level', label: 'Potency Level' },
  { value: 'flavor_profile', label: 'Flavor Profile' },
  { value: 'effect_preference', label: 'Effect Preference' },
  { value: 'price_range', label: 'Price Range' },
  { value: 'brand_preference', label: 'Brand Preference' },
  { value: 'product_type', label: 'Product Type' },
  { value: 'thca_%', label: 'THCa %' },
  { value: 'nose', label: 'Nose/Aroma' },
  { value: 'effects', label: 'Effects' },
  { value: 'terpene', label: 'Terpene' },
  { value: 'strain_type', label: 'Strain Type' },
  { value: 'lineage', label: 'Lineage' },
  { value: 'custom', label: 'Custom' }
]

// Quick selections for different categories
const CATEGORY_QUICK_VALUES: Record<string, string[]> = {
  'strain_preference': ['Indica Dominant', 'Sativa Dominant', 'Hybrid', 'Pure Indica', 'Pure Sativa'],
  'consumption_method': ['Flower', 'Edibles', 'Concentrates', 'Vape Cartridges', 'Pre-Rolls', 'Beverages'],
  'potency_level': ['Low (5-15% THC)', 'Medium (15-20% THC)', 'High (20-25% THC)', 'Very High (25%+ THC)'],
  'flavor_profile': ['Citrus', 'Berry', 'Pine', 'Earthy', 'Sweet', 'Diesel', 'Floral', 'Spicy'],
  'effect_preference': ['Relaxing', 'Energizing', 'Euphoric', 'Sleepy', 'Happy', 'Focused', 'Creative', 'Pain Relief'],
  'price_range': ['Budget ($10-20)', 'Mid-Range ($20-40)', 'Premium ($40-60)', 'Luxury ($60+)'],
  'product_type': ['Flower', 'Edibles', 'Concentrates', 'Topicals', 'Beverages', 'Pre-Rolls'],
  'thca_%': ['Low (10%-18%)', 'Medium (18%-22.5%)', 'High (22.5%-30%)'],
  'nose': ['Candy', 'Cake', 'Earthy', 'Pine', 'Citrus', 'Floral', 'Diesel', 'Sweet', 'Fruity'],
  'effects': ['Energize', 'Relax', 'Balance', 'Euphoric', 'Focus', 'Sleepy', 'Happy', 'Creative', 'Calm'],
  'terpene': ['Limonene', 'Caryophyllene', 'Myrcene', 'Pinene', 'Linalool', 'Humulene', 'Terpinolene'],
  'strain_type': ['Sativa', 'Indica', 'Hybrid', 'Indica-dominant', 'Sativa-dominant'],
  'lineage': [],
  'custom': []
}

export default function QuickManualPreference({ 
  customer, 
  onAddPreference,
  className = '',
  onCancel,
  compact = false
}: QuickManualPreferenceProps) {
  const [isOpen, setIsOpen] = useState(compact) // Start open if compact mode
  const [category, setCategory] = useState('strain_preference')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!value.trim()) return

    setIsAdding(true)
    try {
      await onAddPreference({
        customerId: customer.id,
        category,
        value: value.trim(),
        notes: notes.trim() || undefined,
        addedBy: 'current-user'
      })

      // Reset form
      setValue('')
      setNotes('')
      if (compact && onCancel) {
        onCancel()
      } else {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to add preference:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setValue('')
    setNotes('')
    if (compact && onCancel) {
      onCancel()
    } else {
      setIsOpen(false)
    }
  }

  // In compact mode, don't show the toggle button, just the form
  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2 py-1.5 border border-white/[0.04] rounded bg-background-tertiary text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-platinum/50 focus:border-platinum/50 transition-all duration-300"
            >
              {QUICK_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value..."
              className="px-2 py-1.5 border border-white/[0.04] rounded bg-background-tertiary text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-platinum/50 focus:border-platinum/50 transition-all duration-300 placeholder:text-text-secondary"
            />
          </div>

          {/* Quick selection buttons for the selected category */}
          {category && CATEGORY_QUICK_VALUES[category]?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {CATEGORY_QUICK_VALUES[category].slice(0, 4).map((quickValue) => (
                <button
                  key={quickValue}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setValue(quickValue)
                  }}
                  className="px-2 py-1 text-xs bg-background-tertiary border border-white/[0.04] rounded text-text-secondary hover:bg-background-primary hover:text-text-primary hover:border-white/[0.08] transition-all duration-200"
                >
                  {quickValue.length > 12 ? quickValue.substring(0, 12) + '...' : quickValue}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!value.trim() || isAdding}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {isAdding ? (
                <>
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-background-tertiary border border-white/[0.04] text-text-secondary hover:text-text-primary rounded hover:bg-background-primary hover:border-white/[0.08] transition-all duration-200 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('QuickManualPreference button clicked, isOpen:', isOpen)
          setIsOpen(!isOpen)
        }}
        className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-platinum/20 hover:border-platinum/30 text-platinum rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
        title="Add manual preference"
      >
        <Plus className="h-4 w-4" />
        <span>Add New Preference</span>
      </button>

      {/* Inline form that expands within the preference box */}
      {isOpen && (
        <div className="mt-3 p-4 bg-[#0f0f0f] border border-platinum/10 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-platinum text-sm">Add Preference</h4>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-all duration-300 hover:scale-105 active:scale-95 text-platinum/60 hover:text-platinum"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-platinum/20 rounded-lg bg-[#1a1a1a] text-platinum text-sm focus:outline-none focus:ring-2 focus:ring-platinum/50 focus:border-platinum/50 transition-all duration-300"
              >
                <option value="">Select category...</option>
                {QUICK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter preference value..."
                className="w-full px-3 py-2 border border-platinum/20 rounded-lg bg-[#1a1a1a] text-platinum text-sm focus:outline-none focus:ring-2 focus:ring-platinum/50 focus:border-platinum/50 transition-all duration-300 placeholder:text-platinum/40"
              />
              
              {/* Quick selection buttons for the selected category */}
              {category && CATEGORY_QUICK_VALUES[category]?.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_QUICK_VALUES[category].map((quickValue) => (
                      <button
                        key={quickValue}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setValue(quickValue)
                        }}
                        className="px-2 py-1 text-xs bg-[#2a2a2a] border border-platinum/20 rounded text-platinum/60 hover:bg-platinum/10 hover:text-platinum hover:border-platinum/40 transition-all duration-300"
                      >
                        {quickValue}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)..."
                className="w-full px-3 py-2 border border-platinum/20 rounded-lg bg-[#1a1a1a] text-platinum text-sm focus:outline-none focus:ring-2 focus:ring-platinum/50 focus:border-platinum/50 transition-all duration-300 placeholder:text-platinum/40"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={!value.trim() || isAdding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-[#2a2a2a] border border-platinum/20 text-platinum/60 hover:text-platinum rounded-lg hover:bg-[#3a3a3a] hover:border-platinum/30 transition-all duration-300 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 