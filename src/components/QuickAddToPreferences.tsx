'use client'

import { useState } from 'react'
import { Heart, Plus, Check, X } from 'lucide-react'
import { Customer, CustomerPreference, PreferenceCategory, ACF_PREFERENCE_MAPPING } from '@/types/auth'
import { useACFFields } from '@/hooks/useACFFields'

interface ACFField {
  key: string
  label: string
  value: any
  type: string
}

interface QuickAddToPreferencesProps {
  customer: Customer
  productId: number
  productName: string
  onAddPreference: (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => Promise<void>
  className?: string
}

export default function QuickAddToPreferences({ 
  customer, 
  productId, 
  productName, 
  onAddPreference,
  className = ''
}: QuickAddToPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [addingFields, setAddingFields] = useState<Set<string>>(new Set())
  const { acfFields, loading } = useACFFields(productId)

  if (loading || !acfFields) {
    return null
  }

  // Filter ACF fields that can be added as preferences
  const preferenceFields = acfFields.filter((field: ACFField) => {
    return ACF_PREFERENCE_MAPPING[field.key] && 
           field.value && 
           field.value !== '' && 
           field.value !== 'N/A'
  })

  // Check which preferences customer already has
  const existingPreferenceValues = new Set(
    customer.preferences?.map(p => `${p.category}:${p.value}`) || []
  )

  // Filter out preferences customer already has
  const availableFields = preferenceFields.filter((field: ACFField) => {
    const category = ACF_PREFERENCE_MAPPING[field.key]
    const preferenceKey = `${category}:${field.value}`
    return !existingPreferenceValues.has(preferenceKey)
  })

  if (availableFields.length === 0) {
    return null
  }

  const handleAddPreference = async (field: ACFField) => {
    const fieldKey = `${field.key}:${field.value}`
    setAddingFields(prev => new Set(Array.from(prev).concat(fieldKey)))

    try {
      const category = ACF_PREFERENCE_MAPPING[field.key]
      const preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'> = {
        customerId: customer.id,
        category,
        value: String(field.value),
        notes: `From ${productName}`,
        addedBy: 'current-user', // Would come from auth context
        acfFieldKey: field.key,
        productId: productId
      }

      await onAddPreference(preference)
      
      // Remove from available fields by closing and reopening
      setIsOpen(false)
      setTimeout(() => setIsOpen(true), 100)
    } catch (error) {
      console.error('Failed to add preference:', error)
    } finally {
      setAddingFields(prev => {
        const next = new Set(Array.from(prev))
        next.delete(fieldKey)
        return next
      })
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('QuickAddToPreferences button clicked, isOpen:', isOpen)
          setIsOpen(!isOpen)
        }}
        className="flora-btn-secondary group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-luxury-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-flora hover:shadow-flora-lg focus:outline-none focus:ring-0 select-none overflow-hidden"
        title="Add product attributes to customer preferences"
      >
        <Heart className="h-4 w-4" />
        <span>Save Preferences</span>
        <span className="flora-glass px-2 py-0.5 rounded text-xs font-medium">{availableFields.length}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop - make it less intrusive */}
          <div 
            className="fixed inset-0 bg-black/20 z-50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          
          {/* Modal - use Flora design system with less transparency */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-background-secondary border border-border-default rounded-lg shadow-flora-xl z-50 max-h-96 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-text-primary text-luxury-base">Add Preferences</h3>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  className="p-1 flora-glass hover:bg-background-tertiary rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 text-text-secondary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-luxury-sm text-text-secondary mb-4">
                Save from <strong className="text-text-primary">{productName}</strong>:
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableFields.length === 0 ? (
                  <div className="text-center py-4 text-text-tertiary">
                    <p>No new preferences available</p>
                    <p className="text-xs mt-1">All product attributes already saved</p>
                  </div>
                ) : (
                  availableFields.map((field: ACFField) => {
                    const category = ACF_PREFERENCE_MAPPING[field.key]
                    const fieldKey = `${field.key}:${field.value}`
                    const isAdding = addingFields.has(fieldKey)

                    return (
                      <div
                        key={fieldKey}
                        className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg border border-border-default hover:shadow-flora transition-all duration-300"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary truncate text-luxury-sm">
                            {field.label}
                          </div>
                          <div className="text-text-secondary truncate text-luxury-xs">
                            {String(field.value)}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddPreference(field)
                          }}
                          disabled={isAdding}
                          className="ml-3 flora-btn-primary group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-luxury-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-flora hover:shadow-flora-lg focus:outline-none focus:ring-0 select-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 