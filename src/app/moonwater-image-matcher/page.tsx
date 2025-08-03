'use client'

import { useState, useEffect } from 'react'
// Using native button elements with custom styling
import Image from 'next/image'

interface ProductMatch {
  product: {
    id: number
    name: string
    slug: string
    current_images: Array<{ id: number; src: string; alt: string }>
    has_existing_image: boolean
  }
  suggested_image: {
    id: number
    url: string
    filename: string
    title: string
    similarity: number
  } | null
  confidence: number
  status: 'high_confidence' | 'low_confidence' | 'no_match'
}

interface MatchingSummary {
  total_products: number
  total_images: number
  high_confidence_matches: number
  low_confidence_matches: number
  no_matches: number
  products_with_existing_images: number
}

export default function MoonwaterImageMatcherPage() {
  const [matches, setMatches] = useState<ProductMatch[]>([])
  const [summary, setSummary] = useState<MatchingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load matches on component mount
  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/moonwater-image-matcher')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load matches')
      }
      
      setMatches(data.matches)
      setSummary(data.summary)
      
      // Auto-select high confidence matches
      const highConfidenceIds = data.matches
        .filter((match: ProductMatch) => match.status === 'high_confidence')
        .map((match: ProductMatch) => match.product.id)
      setSelectedMatches(new Set(highConfidenceIds))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMatchToggle = (productId: number) => {
    const newSelected = new Set(selectedMatches)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedMatches(newSelected)
  }

  const applySelectedMatches = async () => {
    if (selectedMatches.size === 0) {
      setError('Please select at least one match to apply')
      return
    }
    
    setApplying(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const matchesToApply = matches
        .filter(match => selectedMatches.has(match.product.id) && match.suggested_image)
        .map(match => ({
          product_id: match.product.id,
          image_id: match.suggested_image!.id,
          image_url: match.suggested_image!.url
        }))
      
      const response = await fetch('/api/moonwater-image-matcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matches_to_apply: matchesToApply
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to apply matches')
      }
      
      setSuccessMessage(`Successfully updated ${data.summary.successful} products! ${data.summary.failed > 0 ? `(${data.summary.failed} failed)` : ''}`)
      
      // Reload matches to see updated state
      await loadMatches()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setApplying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high_confidence': return 'text-green-400'
      case 'low_confidence': return 'text-yellow-400'
      case 'no_match': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high_confidence': return '✅'
      case 'low_confidence': return '⚠️'
      case 'no_match': return '❌'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-light">Analyzing moonwater products...</div>
          <div className="text-sm text-white/60 mt-2">Matching products with uploaded images</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wide">Moonwater Image Matcher</h1>
              <p className="text-white/60 text-sm mt-1">Match product names with uploaded images</p>
            </div>
            
            {summary && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-white/80">
                  <span className="font-medium">{summary.total_products}</span> products
                </div>
                <div className="text-white/80">
                  <span className="font-medium">{summary.total_images}</span> images
                </div>
                <div className="text-green-400">
                  <span className="font-medium">{summary.high_confidence_matches}</span> high confidence
                </div>
                <div className="text-yellow-400">
                  <span className="font-medium">{summary.low_confidence_matches}</span> low confidence
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={loadMatches}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🔄 Refresh Analysis
            </button>
            
            <div className="text-sm text-white/60">
              {selectedMatches.size} of {matches.filter(m => m.suggested_image).length} matches selected
            </div>
          </div>
          
          <button
            onClick={applySelectedMatches}
            disabled={applying || selectedMatches.size === 0}
            className="bg-white text-black hover:bg-white/90 font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {applying ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full mr-2"></div>
                Applying...
              </>
            ) : (
              `Apply ${selectedMatches.size} Selected Matches`
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            <div className="font-medium">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-6">
            <div className="font-medium">Success</div>
            <div className="text-sm mt-1">{successMessage}</div>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid gap-6">
          {matches.map((match) => (
            <div
              key={match.product.id}
              className={`bg-white/5 border rounded-lg p-6 transition-all duration-300 ${
                match.suggested_image && selectedMatches.has(match.product.id)
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-6">
                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-medium">{match.product.name}</h3>
                    <span className={`text-sm ${getStatusColor(match.status)}`}>
                      {getStatusIcon(match.status)} {match.status.replace('_', ' ')}
                    </span>
                    {match.confidence > 0 && (
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                        {Math.round(match.confidence * 100)}% match
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-white/60 mb-3">
                    Product ID: {match.product.id} • Slug: {match.product.slug}
                  </div>
                  
                  {match.product.has_existing_image && (
                    <div className="text-xs text-yellow-400 mb-3">
                      ⚠️ This product already has an image that will be replaced
                    </div>
                  )}
                </div>

                {/* Current Image */}
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-2">Current</div>
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                    {match.product.current_images?.[0]?.src ? (
                      <Image
                        src={match.product.current_images[0].src}
                        alt="Current image"
                        width={80}
                        height={80}
                        className="object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-white/40 text-xs">No image</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                {match.suggested_image && (
                  <div className="flex items-center">
                    <div className="text-white/40">→</div>
                  </div>
                )}

                {/* Suggested Image */}
                {match.suggested_image && (
                  <div className="text-center">
                    <div className="text-xs text-white/60 mb-2">Suggested</div>
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                      <Image
                        src={match.suggested_image.url}
                        alt="Suggested image"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="text-xs text-white/60 mt-1 max-w-20 truncate">
                      {match.suggested_image.filename}
                    </div>
                  </div>
                )}

                {/* Checkbox */}
                {match.suggested_image && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMatches.has(match.product.id)}
                      onChange={() => handleMatchToggle(match.product.id)}
                      className="w-5 h-5 rounded border-white/20 bg-white/10 text-white focus:ring-white/20"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/40 text-lg mb-2">No moonwater products found</div>
            <div className="text-white/60 text-sm">Make sure moonwater products exist in category 16</div>
          </div>
        )}
      </div>
    </div>
  )
} 