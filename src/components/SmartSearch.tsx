'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchSuggestion {
  id: string
  text: string
  type: 'name' | 'category' | 'email' | 'phone' | 'effect' | 'strain'
  highlight: string
  data?: unknown
}

interface SmartSearchProps {
  viewMode: 'products' | 'customers'
  searchQuery: string
  onSearchChange: (query: string) => void
  products?: unknown[]
  customers?: unknown[]
  productCount?: number
}

export default function SmartSearch({ 
  viewMode, 
  searchQuery, 
  onSearchChange, 
  products = [], 
  customers = [],
  productCount = 0
}: SmartSearchProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate smart suggestions based on view mode
  const generateSuggestions = (query: string): SearchSuggestion[] => {
    if (!query || query.length < 2) return []

    const normalizedQuery = query.toLowerCase()
    const suggestions: SearchSuggestion[] = []

    if (viewMode === 'products') {
      // Product name matches
      products.forEach((product: any) => {
        if (product.name.toLowerCase().includes(normalizedQuery)) {
          const index = product.name.toLowerCase().indexOf(normalizedQuery)
          suggestions.push({
            id: `product-${product.id}`,
            text: product.name,
            type: 'name',
            highlight: product.name.substring(index, index + query.length),
            data: product
          })
        }
      })

      // Category matches
      const categories = ['flower', 'vape', 'edible', 'concentrate', 'wax', 'moonwater']
      categories.forEach(category => {
        if (category.includes(normalizedQuery)) {
          suggestions.push({
            id: `category-${category}`,
            text: `All ${category.charAt(0).toUpperCase() + category.slice(1)} Products`,
            type: 'category',
            highlight: category.substring(category.indexOf(normalizedQuery), category.indexOf(normalizedQuery) + query.length)
          })
        }
      })

      // Effect/strain matches (from product metadata)
      const effects = new Set<string>()
      const strains = new Set<string>()
      
      products.forEach((product: any) => {
              const effectsValue = product.meta_data?.find((meta: { key: string; value: unknown }) => meta.key === 'effects')?.value
      const strainValue = product.meta_data?.find((meta: { key: string; value: unknown }) => meta.key === 'strain_type')?.value
        
        if (effectsValue && effectsValue.toLowerCase().includes(normalizedQuery)) {
          effects.add(effectsValue)
        }
        if (strainValue && strainValue.toLowerCase().includes(normalizedQuery)) {
          strains.add(strainValue)
        }
      })

      effects.forEach(effect => {
        suggestions.push({
          id: `effect-${effect}`,
          text: `${effect} Effects`,
          type: 'effect',
          highlight: effect.substring(effect.toLowerCase().indexOf(normalizedQuery), effect.toLowerCase().indexOf(normalizedQuery) + query.length)
        })
      })

      strains.forEach(strain => {
        suggestions.push({
          id: `strain-${strain}`,
          text: `${strain} Strains`,
          type: 'strain',
          highlight: strain.substring(strain.toLowerCase().indexOf(normalizedQuery), strain.toLowerCase().indexOf(normalizedQuery) + query.length)
        })
      })

    } else if (viewMode === 'customers') {
      // Customer name matches
      customers.forEach((customer: any) => {
        if (customer.name.toLowerCase().includes(normalizedQuery)) {
          const index = customer.name.toLowerCase().indexOf(normalizedQuery)
          suggestions.push({
            id: `customer-${customer.id}`,
            text: customer.name,
            type: 'name',
            highlight: customer.name.substring(index, index + query.length),
            data: customer
          })
        }
      })

      // Email matches
      customers.forEach((customer: any) => {
        if (customer.email.toLowerCase().includes(normalizedQuery)) {
          const index = customer.email.toLowerCase().indexOf(normalizedQuery)
          suggestions.push({
            id: `email-${customer.id}`,
            text: customer.email,
            type: 'email',
            highlight: customer.email.substring(index, index + query.length),
            data: customer
          })
        }
      })

      // Phone matches
      customers.forEach((customer: any) => {
        if (customer.phone.includes(query)) {
          const index = customer.phone.indexOf(query)
          suggestions.push({
            id: `phone-${customer.id}`,
            text: `${customer.name} - ${customer.phone}`,
            type: 'phone',
            highlight: customer.phone.substring(index, index + query.length),
            data: customer
          })
        }
      })
    }

    // Limit and sort suggestions
    return suggestions
      .slice(0, 6)
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.text.toLowerCase().startsWith(normalizedQuery)
        const bExact = b.text.toLowerCase().startsWith(normalizedQuery)
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })
  }

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchQuery)
    setSuggestions(newSuggestions)
    setShowSuggestions(newSuggestions.length > 0 && searchQuery.length >= 2)
    setSelectedIndex(-1)
  }, [searchQuery, viewMode, products, customers])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.text)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'name':
        return viewMode === 'products' ? '🌿' : '👤'
      case 'category':
        return '📁'
      case 'email':
        return '📧'
      case 'phone':
        return '📞'
      case 'effect':
        return '✨'
      case 'strain':
        return '🧬'
      default:
        return '🔍'
    }
  }

  // Highlight matching text
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight) return text
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-white/20 text-white rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        placeholder={viewMode === 'products' ? `Search products, categories, effects (${productCount})...` : "Search customers, emails, phones..."}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && searchQuery.length >= 2) {
            setShowSuggestions(true)
          }
        }}
        onBlur={() => {
          // Delay hiding to allow clicking suggestions
          setTimeout(() => setShowSuggestions(false), 150)
        }}
        className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/20 rounded-full text-white placeholder-text-tertiary focus:outline-none focus:border-white/40 focus:bg-[#2a2a2a] transition-all duration-200"
      />

      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex 
                  ? 'bg-white/10 border-l-2 border-white/40' 
                  : 'hover:bg-white/5'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}`}
            >
              <span className="text-sm">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-light truncate">
                  {highlightMatch(suggestion.text, suggestion.highlight)}
                </p>
                <p className="text-white/50 text-xs capitalize">
                  {suggestion.type === 'name' && viewMode === 'products' ? 'Product' : 
                   suggestion.type === 'name' && viewMode === 'customers' ? 'Customer' :
                   suggestion.type}
                </p>
              </div>
              {suggestion.data && viewMode === 'customers' ? (
                <div className="text-right">
                  <p className="text-green-400 text-xs">${(suggestion.data as any).totalSpent?.toFixed(0)}</p>
                  <p className="text-white/50 text-xs">{(suggestion.data as any).totalOrders} orders</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 