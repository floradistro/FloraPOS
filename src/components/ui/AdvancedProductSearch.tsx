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
  selectedProducts: Set<number>;
  onSelectedProductsChange: (products: Set<number>) => void;
  bulkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedProductSearch({
  selectedProduct,
  onProductSelect,
  selectedProducts,
  onSelectedProductsChange,
  bulkMode,
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
    if (bulkMode) {
      const newSelection = new Set(selectedProducts);
      if (newSelection.has(product.id)) {
        newSelection.delete(product.id);
      } else {
        newSelection.add(product.id);
      }
      onSelectedProductsChange(newSelection);
      return;
    }
    
    console.log('🔍 Fetching full product with meta_data for:', product.id);
    
    try {
      const response = await fetch(`/api/proxy/woocommerce/products?include=${product.id}&per_page=1`);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to load full product from WooCommerce');
        onProductSelect(product);
      } else {
        const wcProducts = await response.json();
        if (wcProducts && wcProducts.length > 0) {
          const fullProduct = wcProducts[0];
          console.log('✅ Full product loaded:', fullProduct.name, 'meta_data:', fullProduct.meta_data?.length || 0);
          console.log('📦 Meta keys:', fullProduct.meta_data?.map((m: any) => m.key).slice(0, 20));
          onProductSelect(fullProduct);
        } else {
          console.warn('⚠️ No product data returned');
          onProductSelect(product);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load full product:', error);
      onProductSelect(product);
    }
    
    const recent = [product, ...recentProducts.filter(p => p.id !== product.id)].slice(0, 12);
    setRecentProducts(recent);
    
    if (!bulkMode) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-white/90" style={{ fontFamily: 'Tiempos, serif' }}>Select Products</h2>
            {bulkMode && selectedProducts.size > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                {selectedProducts.size} selected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filters - Single Row */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="flex-1 px-3 py-1.5 bg-white/5 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-white/30"
              style={{ fontFamily: 'Tiempos, serif' }}
            />
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '__bulk__' && bulkMode && selectedCategory) {
                  const categoryProducts = filteredProducts.filter(p => 
                    p.categories?.some(c => c.slug === selectedCategory)
                  );
                  const newSelection = new Set(selectedProducts);
                  categoryProducts.forEach(p => newSelection.add(p.id));
                  onSelectedProductsChange(newSelection);
                  setSelectedCategory(null);
                } else {
                  setSelectedCategory(value || null);
                }
              }}
              className="px-3 py-1.5 bg-white/5 text-white/90 text-[10px] rounded border border-white/10 focus:outline-none focus:border-white/20"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
              {bulkMode && selectedCategory && (
                <option value="__bulk__">✓ Select all in {categories.find(c => c.slug === selectedCategory)?.name}</option>
              )}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="px-3 py-1.5 bg-white/5 text-white/90 text-[10px] rounded border border-white/10 focus:outline-none focus:border-white/20"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
            </select>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as typeof priceSort)}
              className="px-3 py-1.5 bg-white/5 text-white/90 text-[10px] rounded border border-white/10 focus:outline-none focus:border-white/20"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="default">Default</option>
              <option value="low-high">Price ↑</option>
              <option value="high-low">Price ↓</option>
            </select>
            {(searchQuery || selectedCategory || stockFilter !== 'all' || priceSort !== 'default') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setStockFilter('all');
                  setPriceSort('default');
                }}
                className="px-2.5 py-1.5 text-[10px] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 rounded transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {displayProducts.map((product) => {
                  const stock = product.total_stock || product.stock_quantity || 0;
                  const isLowStock = stock > 0 && stock <= 10;
                  const price = parseFloat(product.sale_price || product.regular_price || '0');

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="group relative p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded transition-all duration-200 text-left"
                    >
                      <div>
                        <div className="text-xs text-white/90 font-medium mb-1.5 line-clamp-2" style={{ fontFamily: 'Tiempos, serif' }}>
                          {product.name}
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                            ${price.toFixed(2)}
                          </div>
                          {stock > 0 && (
                            <span className="text-[10px] text-white/40">
                              {stock}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {product.sku || `#${product.id}`}
                        </div>
                      </div>
                      
                      {(selectedProduct?.id === product.id || selectedProducts.has(product.id)) && (
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
            {bulkMode && selectedProducts.size > 0 
              ? `${selectedProducts.size} products selected • ${displayProducts.length} shown`
              : `${displayProducts.length} ${displayProducts.length === 1 ? 'product' : 'products'} shown`
            }
            {bulkMode && <span className="ml-2 text-white/30">(Double-click category to select all)</span>}
          </div>
          <div className="flex items-center gap-2">
            {bulkMode && selectedProducts.size > 0 && (
              <button
                onClick={() => onSelectedProductsChange(new Set())}
                className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded border border-white/10 transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Clear Selection
              </button>
            )}
            {bulkMode && selectedProducts.size > 0 && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Done ({selectedProducts.size})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

