import React from 'react'
import { useACFFields } from '../hooks/useACFFields'

interface ProductNameSideInfoProps {
  productId: number
}

export function ProductNameSideInfo({ productId }: ProductNameSideInfoProps) {
  const { acfFields, loading } = useACFFields(productId)

  if (loading) {
    return null
  }

  // Find THCA% and strain type fields
  const thcaField = acfFields.find(field => field.key === 'thca_%')
  const strainTypeField = acfFields.find(field => field.key === 'strain_type')

  // Only show if we have at least one of these fields
  if (!thcaField && !strainTypeField) {
    return null
  }

  return (
    <div className="flex flex-col items-end text-xs text-text-tertiary ml-2 flex-shrink-0">
      {thcaField && thcaField.value && (
        <span className="font-medium">{String(thcaField.value || '')}% THCA</span>
      )}
      {strainTypeField && strainTypeField.value && (
        <span className="capitalize">{String(strainTypeField.value || '')}</span>
      )}
    </div>
  )
} 