'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface Product {
  id: number;
  name: string;
  sku: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface HeaderProductSelectorProps {
  selectedProduct?: Product | null;
  onProductSelect?: (product: Product | null) => void;
  products?: Product[];
  loading?: boolean;
}

export function HeaderProductSelector({ 
  selectedProduct, 
  onProductSelect,
  products = [],
  loading = false
}: HeaderProductSelectorProps) {
  console.log('HeaderProductSelector: products received:', products?.length);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left - 60, // Offset to make dropdown wider than button
        width: 320 // Fixed width like customer dropdown
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleProductSelect = (product: Product | null) => {
    onProductSelect?.(product);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedProductName = selectedProduct 
    ? selectedProduct.name
    : 'Select Product';

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return !query || 
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="relative">
        <button 
          disabled
          className="flex items-center gap-2 px-3 py-1 bg-neutral-800/80 rounded text-neutral-500 cursor-not-allowed text-sm"
        >
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 bg-neutral-800/80 hover:bg-neutral-700/80 rounded text-neutral-400 transition-colors min-w-[160px] justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="truncate">{selectedProductName}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && dropdownPosition && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-neutral-900/95 backdrop-blur-sm border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.08] bg-neutral-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Select Product</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 hover:bg-white/[0.05] rounded"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 bg-neutral-800/50 border border-white/[0.08] rounded text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                autoFocus
              />
              <svg className="absolute right-3 top-2.5 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Product Options */}
          <div className="py-1 max-h-96 overflow-y-auto">
            {/* Clear Selection Option */}
            <button
              onClick={() => handleProductSelect(null)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group ${
                !selectedProduct
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-700/50 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9l-6 6-6-6" />
                  </svg>
                </div>
                <span>No Product Selected</span>
              </div>
              {!selectedProduct && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Product List */}
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group ${
                    selectedProduct?.id === product.id
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-700/50 rounded overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-xs text-neutral-500">SKU: {product.sku}</div>
                    </div>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-neutral-500 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {searchQuery ? 'No products found' : 'No products available'}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
