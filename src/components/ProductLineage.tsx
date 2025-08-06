import React from 'react'
import { useACFFields } from '../hooks/useACFFields'
import { FloraProduct } from '../lib/woocommerce'

interface ProductLineageProps {
  productId: number
  product?: FloraProduct
}

export function ProductLineage({ productId, product }: ProductLineageProps) {
  const { acfFields, loading } = useACFFields(productId)

  if (loading) {
    return null // Don't show loading state for lineage
  }

  // Find the lineage, nose, and strength fields
  const lineageField = acfFields.find(field => field.key === 'lineage')
  const noseField = acfFields.find(field => field.key === 'nose')
  const strengthField = acfFields.find(field => field.key === 'strength_mg')
  
  // Helper function to format additional fields
  const getAdditionalFields = () => {
    const fields = []
    if (noseField && noseField.value) fields.push(noseField.value)
    if (strengthField && strengthField.value) fields.push(`${strengthField.value}mg`)
    return fields.join(' • ')
  }
  
  // If lineage exists, show it with additional fields if available
  if (lineageField && lineageField.value) {
    const additionalFields = getAdditionalFields()
    return (
      <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
        <span>{String(lineageField.value || '')}</span>
        {additionalFields && (
          <span className="ml-2 opacity-75">• {additionalFields}</span>
        )}
      </div>
    )
  }

  // If no lineage but other fields exist, show with category
  const categoryField = acfFields.find(field => field.key === 'category')
  
  if (categoryField && categoryField.value) {
    const additionalFields = getAdditionalFields()
    return (
      <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1 capitalize">
        <span>{String(categoryField.value || '')}</span>
        {additionalFields && (
          <span className="ml-2 opacity-75">• {additionalFields}</span>
        )}
      </div>
    )
  }

  // If no ACF category, check WooCommerce categories
  if (product && product.categories && product.categories.length > 0) {
    const categoryName = product.categories[0].name
    const additionalFields = getAdditionalFields()
    return (
      <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1 capitalize">
        <span>{categoryName}</span>
        {additionalFields && (
          <span className="ml-2 opacity-75">• {additionalFields}</span>
        )}
      </div>
    )
  }

  // If only additional fields exist, show them
  const additionalFields = getAdditionalFields()
  if (additionalFields) {
    return (
      <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
        {additionalFields}
      </div>
    )
  }

  return null
} 