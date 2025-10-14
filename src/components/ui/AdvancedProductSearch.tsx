'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  stock_quantity?: number;
  total_stock?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface AdvancedProductSearchProps {
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedProductSearch({
  selectedProduct,
  onProductSelect,
  isOpen,
  onClose
}: AdvancedProductSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all');
  const [priceSort, setPriceSort] = useState<'default' | 'low-high' | 'high-low'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch(`/api/proxy/flora-im/products/bulk?per_page=100&location_id=${user?.location_id || 20}`),
        apiFetch(`/api/products/categories`)
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const productsList = Array.isArray(data) ? data : (data.data || data.products || []);
        setProducts(productsList);
        
        const recent = productsList.slice(0, 12);
        setRecentProducts(recent);
      }

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.categories?.some(cat => cat.name.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => 
        p.categories?.some(cat => cat.slug === selectedCategory)
      );
    }

    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => (p.total_stock || p.stock_quantity || 0) > 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(p => {
        const stock = p.total_stock || p.stock_quantity || 0;
        return stock > 0 && stock <= 10;
      });
    }

    if (priceSort === 'low-high') {
      filtered.sort((a, b) => parseFloat(a.regular_price || '0') - parseFloat(b.regular_price || '0'));
    } else if (priceSort === 'high-low') {
      filtered.sort((a, b) => parseFloat(b.regular_price || '0') - parseFloat(a.regular_price || '0'));
    }

    return filtered.slice(0, 50);
  }, [products, searchQuery, selectedCategory, stockFilter, priceSort]);

  const displayProducts = searchQuery || selectedCategory || stockFilter !== 'all' 
    ? filteredProducts 
    : recentProducts;

  const handleSelectProduct = async (product: Product) => {
    try {
      const response = await apiFetch(`/api/products/${product.id}`);
      if (response.ok) {
        const fullProduct = await response.json();
        onProductSelect(fullProduct);
      } else {
        onProductSelect(product);
      }
    } catch (error) {
      console.error('Failed to load full product:', error);
      onProductSelect(product);
    }
    
    const recent = [product, ...recentProducts.filter(p => p.id !== product.id)].slice(0, 12);
    setRecentProducts(recent);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>Select Product</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-4 border-b border-white/[0.06] space-y-3">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full px-4 py-3 bg-neutral-800 text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-white/30"
            style={{ fontFamily: 'Tiempos, serif' }}
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              All
            </button>
            {categories.slice(0, 8).map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="px-3 py-2 bg-neutral-800 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
            </select>

            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as typeof priceSort)}
              className="px-3 py-2 bg-neutral-800 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="default">Default Sort</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>

            {(searchQuery || selectedCategory || stockFilter !== 'all' || priceSort !== 'default') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setStockFilter('all');
                  setPriceSort('default');
                }}
                className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded border border-white/10 transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-white/40 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading products...</div>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="text-white/40 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
                {searchQuery ? 'No products found' : 'No products available'}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded transition-colors"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {!searchQuery && !selectedCategory && stockFilter === 'all' && priceSort === 'default' && (
                <div className="mb-4">
                  <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-3" style={{ fontFamily: 'Tiempos, serif' }}>
                    Recent & Popular
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayProducts.map((product) => {
                  const stock = product.total_stock || product.stock_quantity || 0;
                  const isLowStock = stock > 0 && stock <= 10;
                  const price = parseFloat(product.sale_price || product.regular_price || '0');

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="group relative p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-lg transition-all duration-200 text-left"
                    >
                      <div className="flex gap-3">
                        {product.image && (
                          <div className="w-16 h-16 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium mb-1 line-clamp-2" style={{ fontFamily: 'Tiempos, serif' }}>
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-xs text-white/40">
                              SKU: {product.sku || `#${product.id}`}
                            </span>
                            {stock > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                isLowStock 
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                              }`}>
                                {stock} in stock
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-base font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                              ${price.toFixed(2)}
                            </div>
                            {product.categories && product.categories.length > 0 && (
                              <div className="text-xs text-white/30">
                                {product.categories[0].name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selectedProduct?.id === product.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="text-xs text-white/40" style={{ fontFamily: 'Tiempos, serif' }}>
            {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'} shown
          </div>
          {selectedProduct && (
            <button
              onClick={() => {
                onProductSelect(null);
                onClose();
              }}
              className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded border border-white/10 transition-colors"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

