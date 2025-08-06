import { useQuery } from '@tanstack/react-query'

interface ACFField {
  key: string
  label: string
  value: string | number | boolean | object | null
  type: string
}

interface ACFResponse {
  success: boolean
  product_id: number
  acf_fields: ACFField[]
  field_count: number
  error?: string
}

export function useACFFields(productId: number | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['acf-fields', productId],
    queryFn: async (): Promise<ACFField[]> => {
      if (!productId) return []
      
      const response = await fetch(`/api/products/${productId}/acf`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ACFResponse = await response.json()
      
      if (data.success) {
        return data.acf_fields
      } else {
        throw new Error(data.error || 'Failed to fetch ACF fields')
      }
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes - ACF fields don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  return { 
    acfFields: data || [], 
    loading: isLoading, 
    error: error?.message || null 
  }
} 