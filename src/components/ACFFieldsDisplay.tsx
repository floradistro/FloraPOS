import React from 'react'
import Image from 'next/image'
import { useACFFields } from '../hooks/useACFFields'

interface ACFField {
  key: string
  label: string
  value: string | number | boolean | object | null
  type: string
}

interface ACFFieldsDisplayProps {
  productId: number
  productName: string
}

export function ACFFieldsDisplay({ productId, productName }: ACFFieldsDisplayProps) {
  const { acfFields, loading, error } = useACFFields(productId)

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-white/[0.02] rounded-md">
        <div className="text-xs text-text-tertiary font-mono animate-pulse">
          Loading product details...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-white/[0.02] rounded-md">
        <div className="text-xs text-text-tertiary font-mono">
          Error: Failed to load product details
        </div>
      </div>
    )
  }

  if (!acfFields || acfFields.length === 0) {
    return null
  }

  const renderFieldValue = (field: ACFField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <span className="px-2 py-1 bg-white/[0.05] rounded text-xs font-mono">
            {field.value === 'Yes' ? 'true' : 'false'}
          </span>
        )
      
      case 'image':
        if (field.value && typeof field.value === 'object' && 'url' in field.value) {
          return (
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12 rounded overflow-hidden bg-white/[0.05]">
                <Image
                  src={(field.value as any).url}
                  alt={(field.value as any).alt || field.label}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs font-mono text-text-secondary">
                {(field.value as any).url.split('/').pop()}
              </span>
            </div>
          )
        }
        return <span className="text-text-tertiary text-xs font-mono">null</span>
      
      case 'url':
        return (
          <a 
            href={field.value as string} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary text-xs font-mono underline decoration-dotted"
          >
            {String(field.value)}
          </a>
        )
      
      case 'array':
        return (
          <div className="flex flex-wrap gap-1">
            {String(field.value || '').split(', ').map((item: string, index: number) => (
              <span 
                key={index}
                className="px-2 py-1 bg-white/[0.05] text-text-primary rounded text-xs font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <span className="font-mono text-text-primary text-sm">
            {typeof field.value === 'number' ? field.value.toLocaleString() : String(field.value || '')}
          </span>
        )
      
      case 'object':
        return (
          <details className="cursor-pointer">
            <summary className="text-xs text-text-tertiary hover:text-text-secondary font-mono">
              {"{ ... }"}
            </summary>
            <pre className="text-xs text-text-secondary mt-2 p-3 bg-white/[0.05] rounded overflow-auto max-h-32 font-mono">
              {JSON.stringify(field.value, null, 2)}
            </pre>
          </details>
        )
      
      default:
        return (
          <span className="text-text-primary text-sm font-mono">
            {String(field.value)}
          </span>
        )
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {acfFields.filter((field: ACFField) => {
          // Fields shown in other components
          const excludedFields = [
            'lineage',           // Shown under product name
            'category',          // Shown under product name (when no lineage)
            'thca_%',           // Shown next to product name
            'strain_type',      // Shown next to product name
            // Priority fields shown in ProductCharacteristics
            'nose', 'effects', 'terpene', 'strength_mg', 'acf_effects',
            'flavor', 'potency', 'type',
            'brand', 'strength'
          ]
          return !excludedFields.includes(field.key)
        }).map((field: ACFField) => (
          <div 
            key={field.key}
            className="flex items-center justify-between p-3 bg-white/[0.02] rounded-md"
          >
            <div className="text-sm text-text-secondary font-mono min-w-0 flex-1">
              {field.label}:
            </div>
            <div className="flex-shrink-0 ml-3">
              {renderFieldValue(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 