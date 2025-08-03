import React from 'react'
import Image from 'next/image'
import { useACFFields } from '../hooks/useACFFields'

interface ACFField {
  key: string
  label: string
  value: any
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
      <div className="mt-3 p-3 bg-black/40 rounded-lg border border-gray-600/30 font-mono backdrop-blur-sm">
        <div className="text-xs text-gray-400 animate-pulse">
          // Loading product details...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30 font-mono backdrop-blur-sm">
        <div className="text-xs text-red-400">
          // Error: Failed to load product details
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
          <span className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${
            field.value === 'Yes' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {field.value === 'Yes' ? 'true' : 'false'}
          </span>
        )
      
      case 'image':
        if (field.value?.url) {
          return (
            <div className="relative w-16 h-16 rounded overflow-hidden">
              <Image
                src={field.value.url}
                alt={field.value.alt || field.label}
                fill
                className="object-cover"
              />
            </div>
          )
        }
        return <span className="text-gray-500 text-xs font-mono">null</span>
      
      case 'url':
        return (
          <a 
            href={field.value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs font-mono underline decoration-dotted hover:decoration-solid transition-all duration-200"
          >
            {field.value}
          </a>
        )
      
      case 'array':
        return (
          <div className="flex flex-wrap gap-1">
            {field.value.split(', ').map((item: string, index: number) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-700/50 text-cyan-300 rounded-md text-xs font-mono border border-gray-600/40 hover:border-cyan-400/40 transition-all duration-200"
              >
                "{item}"
              </span>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <span className="font-mono text-orange-400 text-sm font-semibold">
            {typeof field.value === 'number' ? field.value.toLocaleString() : field.value}
          </span>
        )
      
      case 'object':
        return (
          <details className="cursor-pointer">
            <summary className="text-xs text-gray-400 hover:text-gray-300 font-mono transition-colors duration-200">
              &#123;...&#125;
            </summary>
            <pre className="text-xs text-gray-300 mt-2 p-3 bg-black/60 rounded-md overflow-auto max-h-32 border border-gray-600/30 font-mono">
              {field.value}
            </pre>
          </details>
        )
      
      default:
        return (
          <span className="text-gray-200 text-sm font-mono">
            "{String(field.value)}"
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
            'nose', 'effects', 'terpene',
            'strength_mg', 'acf_effects', 
            'flavor', 'potency', 'type',
            'brand', 'strength'
          ]
          return !excludedFields.includes(field.key)
        }).map((field: ACFField) => (
          <div 
            key={field.key}
            className="flex flex-col gap-1 p-3 bg-black/40 rounded-lg border border-gray-600/30 font-mono text-sm backdrop-blur-sm hover:border-gray-500/40 transition-all duration-300"
          >
            <div className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
              {field.label.replace(/_/g, ' ')}
            </div>
            <div className="flex-1 text-gray-200">
              {renderFieldValue(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 