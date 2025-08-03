'use client'

import { useState } from 'react'
import { FloraProduct } from '../lib/woocommerce'
import { createWooHeaders } from '../lib/woocommerce'

const FLORA_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'

export function useVirtualPrerolls() {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertToPrerolls = async (
    productId: number, 
    prerollCount: number,
    locationId?: string
  ) => {
    setIsConverting(true)
    setError(null)

    try {
      // Use the new float product conversion endpoint
      const response = await fetch(`${FLORA_API_URL}/wp-json/addify-mli/v1/float-products/convert`, {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          product_id: productId,
          quantity: prerollCount,
          location_id: locationId ? parseInt(locationId) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to convert pre-rolls')
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Conversion successful:', data)
        return data
      } else {
        throw new Error(data.message || 'Conversion failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Conversion error:', err)
      throw err
    } finally {
      setIsConverting(false)
    }
  }

  const checkVirtualInventory = async (productId: number, locationId?: string) => {
    try {
      // Use the new float product info endpoint
      const url = locationId 
        ? `${FLORA_API_URL}/wp-json/addify-mli/v1/float-products/${productId}?location_id=${locationId}`
        : `${FLORA_API_URL}/wp-json/addify-mli/v1/float-products/${productId}`
        
      const response = await fetch(url, {
        headers: createWooHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to check inventory')
      }

      return await response.json()
    } catch (err) {
      console.error('Inventory check error:', err)
      return null
    }
  }

  const createFloatProductLink = async (productId: number) => {
    try {
      const response = await fetch(`${FLORA_API_URL}/wp-json/addify-mli/v1/float-products/create-link`, {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          product_id: productId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create float product link')
      }

      return await response.json()
    } catch (err) {
      console.error('Float product creation error:', err)
      throw err
    }
  }

  return {
    convertToPrerolls,
    checkVirtualInventory,
    createFloatProductLink,
    isConverting,
    error,
  }
} 