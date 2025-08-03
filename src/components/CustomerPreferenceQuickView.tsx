'use client'

import { useState, useEffect } from 'react'
import { Tag, Heart, AlertCircle, Leaf, Zap, Star, Plus, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { Customer, CustomerPreference } from '@/types/auth'
import QuickManualPreference from './QuickManualPreference'

interface CustomerPreferenceQuickViewProps {
  customer: Customer
  onAddPreference?: (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => Promise<void>
}

// Updated category mappings for cannabis products with dark theme colors
const CATEGORY_LABELS: Record<string, string> = {
  'strain_preference': 'Strain',
  'consumption_method': 'Method',
  'potency_level': 'Potency',
  'flavor_profile': 'Flavor',
  'effect_preference': 'Effects',
  'price_range': 'Price',
  'brand_preference': 'Brand',
  'product_type': 'Type',
  'thca_%': 'THCa',
  'nose': 'Aroma',
  'effects': 'Effects',
  'terpene': 'Terpene',
  'strain_type': 'Strain',
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

// Subtle, minimal colors for compact display
const CATEGORY_COLORS: Record<string, string> = {
  'strain_preference': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'consumption_method': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'potency_level': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'flavor_profile': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'effect_preference': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'price_range': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'brand_preference': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'product_type': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'thca_%': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'nose': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'effects': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'terpene': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'strain_type': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'lineage': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]',
  'custom': 'bg-white/[0.03] text-platinum/70 border-white/[0.06]'
}

export default function CustomerPreferenceQuickView({ customer, onAddPreference }: CustomerPreferenceQuickViewProps) {
  const [preferences, setPreferences] = useState<CustomerPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch preferences from Flora API
  const fetchPreferences = async () => {
    if (!customer?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/customers/${customer.id}/preferences`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.status}`)
      }
      
      const data = await response.json()
      setPreferences(data.preferences || [])
      
    } catch (err) {
      console.error('❌ Error fetching preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
      setPreferences([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch preferences on component mount and when customer changes
  useEffect(() => {
    fetchPreferences()
  }, [customer?.id])

  // Handle adding a new preference
  const handleAddPreference = async (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => {
    if (!onAddPreference) return

    try {
      await onAddPreference(preference)
      await fetchPreferences()
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add preference:', error)
    }
  }

  // Get display preferences (show first 3, or all if expanded)
  const displayPreferences = isExpanded ? preferences : preferences.slice(0, 3)
  const hasMorePreferences = preferences.length > 3

  return (
    <div className="bg-background-secondary rounded-lg border border-white/[0.04]">
      {/* Header - always visible */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-platinum/60" />
          <span className="text-sm font-medium text-text-primary">Preferences</span>
          {preferences.length > 0 && (
            <span className="text-xs text-text-secondary bg-background-tertiary px-2 py-0.5 rounded-full">
              {preferences.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isLoading && (
            <button
              onClick={() => fetchPreferences()}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors rounded hover:bg-background-tertiary"
              title="Refresh preferences"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
          {preferences.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors rounded hover:bg-background-tertiary"
              title={isExpanded ? "Show less" : "Show all"}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 text-text-secondary">
            <div className="animate-spin rounded-full h-3 w-3 border border-platinum/30 border-t-platinum/60"></div>
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="px-3 pb-3">
          <div className="text-xs text-error bg-error/10 px-2 py-1 rounded border border-error/20">
            Failed to load preferences
          </div>
        </div>
      )}

      {/* Preferences Display */}
      {!isLoading && !error && (
        <>
          {preferences.length > 0 ? (
            <div className="px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {displayPreferences.map((pref) => {
                  const Icon = CATEGORY_ICONS[pref.category] || Tag
                  const colorClass = CATEGORY_COLORS[pref.category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  const label = CATEGORY_LABELS[pref.category] || pref.category
                  
                  return (
                    <div
                      key={pref.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${colorClass} transition-all duration-200 hover:scale-105`}
                      title={`${label}: ${pref.value}${pref.notes ? ` (${pref.notes})` : ''}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="font-medium">{label}:</span>
                      <span className="truncate max-w-[60px]">{pref.value}</span>
                    </div>
                  )
                })}
                {hasMorePreferences && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-white/[0.06] text-platinum/60 hover:text-platinum/80 hover:border-white/[0.12] transition-all duration-200"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{preferences.length - 3} more</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-3 pb-3">
              <div className="text-center py-2">
                <p className="text-xs text-text-secondary">No preferences saved</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Preference Button */}
      {onAddPreference && !isLoading && (
        <div className="border-t border-white/[0.04] p-3">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-all duration-200"
            >
              <Plus className="h-3 w-3" />
              <span>Add Preference</span>
            </button>
          ) : (
            <QuickManualPreference
              customer={customer}
              onAddPreference={handleAddPreference}
              onCancel={() => setShowAddForm(false)}
              compact={true}
            />
          )}
        </div>
      )}
    </div>
  )
} 