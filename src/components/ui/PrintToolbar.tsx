'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  regular_price: string;
  sale_price?: string;
  sku: string;
  image?: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
  blueprintPricing?: any;
  meta_data?: Array<{
    id: number;
    key: string;
    value: any;
  }>;
}

interface LabelTemplate {
  template_name: string;
  description: string;
  units: string;
  page: {
    size: string;
    width: number;
    height: number;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
  };
  grid: {
    rows: number;
    columns: number;
    label_width: number;
    label_height: number;
    horizontal_pitch: number;
    vertical_pitch: number;
    origin: string;
  };
  label_style: {
    safe_padding: { top: number; right: number; bottom: number; left: number };
    corner_radius: number;
    background: string;
    border: { enabled: boolean };
  };
  text_style: {
    font_family: string;
    font_size_pt: number;
    line_height_em: number;
    color: string;
    align: string;
    vertical_align: string;
    overflow: string;
  };
  data_mapping: {
    records_per_page: number;
    fill_order: string;
  };
}

interface PrintToolbarProps {
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  showBorders: boolean;
  onShowBordersChange: (show: boolean) => void;
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
  onPrint: () => void;
  templates: Array<{ id: string; name: string; description: string }>;
  
  // Field toggles
  showDate: boolean;
  onShowDateChange: (show: boolean) => void;
  showPrice: boolean;
  onShowPriceChange: (show: boolean) => void;
  showSKU: boolean;
  onShowSKUChange: (show: boolean) => void;
  showCategory: boolean;
  onShowCategoryChange: (show: boolean) => void;
  showMargin: boolean;
  onShowMarginChange: (show: boolean) => void;
  
  // Blueprint fields
  showEffect: boolean;
  onShowEffectChange: (show: boolean) => void;
  showLineage: boolean;
  onShowLineageChange: (show: boolean) => void;
  showNose: boolean;
  onShowNoseChange: (show: boolean) => void;
  showTerpene: boolean;
  onShowTerpeneChange: (show: boolean) => void;
  showStrainType: boolean;
  onShowStrainTypeChange: (show: boolean) => void;
  showTHCA: boolean;
  onShowTHCAChange: (show: boolean) => void;
  showSupplier: boolean;
  onShowSupplierChange: (show: boolean) => void;
  
  // Pricing tiers
  selectedTier: string;
  onSelectedTierChange: (tier: string) => void;
  showTierPrice: boolean;
  onShowTierPriceChange: (show: boolean) => void;
  showTierLabel: boolean;
  onShowTierLabelChange: (show: boolean) => void;
  
  template: LabelTemplate;
}

export const PrintToolbar: React.FC<PrintToolbarProps> = ({
  selectedProduct,
  onProductSelect,
  selectedTemplate,
  onTemplateChange,
  showBorders,
  onShowBordersChange,
  showLogo,
  onShowLogoChange,
  onPrint,
  templates,
  showDate,
  onShowDateChange,
  showPrice,
  onShowPriceChange,
  showSKU,
  onShowSKUChange,
  showCategory,
  onShowCategoryChange,
  showMargin,
  onShowMarginChange,
  showEffect,
  onShowEffectChange,
  showLineage,
  onShowLineageChange,
  showNose,
  onShowNoseChange,
  showTerpene,
  onShowTerpeneChange,
  showStrainType,
  onShowStrainTypeChange,
  showTHCA,
  onShowTHCAChange,
  showSupplier,
  onShowSupplierChange,
  selectedTier,
  onSelectedTierChange,
  showTierPrice,
  onShowTierPriceChange,
  showTierLabel,
  onShowTierLabelChange,
  template
}) => {
  const { user } = useAuth();
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowProductSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    if (!searchQuery || !showProductSearch) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsSearching(true);
      try {
        // Use optimized bulk endpoint
        const response = await apiFetch(
          `/api/proxy/flora-im/products/bulk?per_page=50&search=${encodeURIComponent(searchQuery)}&location_id=${user?.location_id || 20}`
        );
        if (response.ok) {
          const data = await response.json();
          const products = Array.isArray(data) ? data : (data.data || data.products || []);
          setSearchResults(products);
        }
      } catch (error) {
        console.error('Product search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, showProductSearch, user?.location_id]);

  return (
    <div className="flex-shrink-0 w-full bg-neutral-950/80 backdrop-blur-xl border-b border-white/[0.06]" style={{ zIndex: 100 }}>
      <div className="flex items-center justify-between px-6 py-3 w-full">
        {/* Left Side - Product Selection */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-neutral-900/40 backdrop-blur-md border border-white/[0.06] rounded-2xl px-3 py-2 shadow-lg">
            {/* Product Selector */}
            <div className="relative" ref={searchRef} style={{ zIndex: 9999 }}>
              <button
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="flex items-center gap-2 px-4 h-7 text-xs font-medium transition-all duration-300 rounded-full bg-neutral-800/60 hover:bg-neutral-700/60 text-neutral-300 hover:text-white border border-white/[0.08]"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{selectedProduct ? selectedProduct.name.substring(0, 20) + (selectedProduct.name.length > 20 ? '...' : '') : 'Select Product'}</span>
              </button>

              {/* Product Search Dropdown */}
              {showProductSearch && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
                  {/* Search Input */}
                  <div className="p-3 border-b border-white/[0.06]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg border border-white/[0.08] focus:outline-none focus:border-blue-400/50"
                      style={{ fontFamily: 'Tiempos, serif' }}
                      autoFocus
                    />
                  </div>

                  {/* Results */}
                  <div className="max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center text-neutral-500 text-sm">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            onProductSelect(product);
                            setShowProductSearch(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-3 hover:bg-white/[0.04] transition-colors flex items-center gap-3 text-left"
                        >
                          {product.image && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                              {product.name}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {product.sku || `#${product.id}`} • ${parseFloat(product.regular_price || '0').toFixed(2)}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : searchQuery ? (
                      <div className="p-8 text-center text-neutral-500 text-sm">No products found</div>
                    ) : (
                      <div className="p-8 text-center text-neutral-500 text-sm">Type to search products</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedProduct && (
              <button
                onClick={() => {
                  onProductSelect(null);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 px-3 h-7 text-xs font-medium transition-all duration-300 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-400/20"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear</span>
              </button>
            )}

            <div className="w-px h-5 bg-white/[0.08]" />

            {/* Template Selector */}
            <select
              value={selectedTemplate}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="px-4 h-7 text-xs font-medium bg-neutral-800/60 hover:bg-neutral-700/60 text-white rounded-full border border-white/[0.08] focus:outline-none focus:border-blue-400/50 appearance-none cursor-pointer"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center - Display Options */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-neutral-900/40 backdrop-blur-md border border-white/[0.06] rounded-2xl px-2 py-1.5 shadow-lg">
            <button
              onClick={() => onShowBordersChange(!showBorders)}
              className={`flex items-center gap-1.5 px-3 h-7 text-xs font-medium transition-all duration-300 rounded-full ${
                showBorders
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-neutral-800/60 text-neutral-400 hover:text-white border border-white/[0.08]'
              }`}
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>Borders</span>
            </button>

            <button
              onClick={() => onShowLogoChange(!showLogo)}
              className={`flex items-center gap-1.5 px-3 h-7 text-xs font-medium transition-all duration-300 rounded-full ${
                showLogo
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-neutral-800/60 text-neutral-400 hover:text-white border border-white/[0.08]'
              }`}
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Logo</span>
            </button>
          </div>
        </div>

        {/* Right Side - Print Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-neutral-900/40 backdrop-blur-md border border-white/[0.06] rounded-2xl px-2 py-1.5 shadow-lg">
            {/* Template Info */}
            <div className="px-3 text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
              {template.grid.rows}×{template.grid.columns} • {template.data_mapping.records_per_page} labels
            </div>

            <div className="w-px h-5 bg-white/[0.08]" />

            {/* Print Button */}
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-5 h-7 text-xs font-medium transition-all duration-300 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-400/50 hover:shadow-lg hover:scale-105 active:scale-95"
              style={{ 
                fontFamily: 'Tiempos, serif',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

