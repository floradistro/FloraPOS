'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';

export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  regular_price: string;
  sale_price?: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
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
          className="flex items-center gap-2 px-3 h-[30px] bg-neutral-900/80 border border-neutral-700/50 rounded-lg text-neutral-500 cursor-not-allowed text-sm"
        >
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
        className="flex items-center gap-2 px-3 h-[30px] bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600/60 rounded-lg text-neutral-200 transition-all duration-300 ease-out min-w-[160px] justify-between text-sm"
      >
        <span className="truncate">{selectedProductName}</span>
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
          className="fixed bg-neutral-700/95 border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Select Product</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors duration-200 p-1 hover:bg-white/[0.05] rounded"
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
                className="w-full px-3 py-2 bg-transparent border border-white/[0.06] hover:border-white/[0.12] rounded-lg text-sm text-neutral-200 placeholder-neutral-400 focus:bg-neutral-600/5 focus:border-white/[0.12] focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Product Options */}
          <div className="py-1 max-h-96 overflow-y-auto">
            {/* Clear Selection Option */}
            <button
              onClick={() => handleProductSelect(null)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                !selectedProduct
                  ? 'bg-neutral-600/5 text-neutral-300'
                  : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
              }`}
            >
              <span>No Product Selected</span>
              {!selectedProduct && (
                <span className="text-xs">✓</span>
              )}
            </button>

            {/* Product List */}
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                    selectedProduct?.id === product.id
                      ? 'bg-neutral-600/5 text-neutral-300'
                      : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>{product.name}</div>
                      <div className="text-xs text-neutral-500">SKU: {product.sku}</div>
                    </div>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <span className="text-xs ml-2">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-neutral-500 text-center">
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
