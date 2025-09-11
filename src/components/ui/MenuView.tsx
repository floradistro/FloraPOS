'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { Product } from '../../types';

interface MenuViewProps {
  searchQuery?: string;
  categoryFilter?: string;
}

export function MenuView({ searchQuery = '', categoryFilter }: MenuViewProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [showDualMenuSelector, setShowDualMenuSelector] = useState(false);
  const [leftMenuCategory, setLeftMenuCategory] = useState<string | null>(null);
  const [rightMenuCategory, setRightMenuCategory] = useState<string | null>(null);

  const openPopoutMenu = useCallback((categorySlug?: string, isDual = false) => {
    // Determine window dimensions based on orientation
    const windowFeatures = orientation === 'vertical' 
      ? 'width=1080,height=1920,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
      : 'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
    
    // Build URL with orientation and category parameters
    const urlParams = new URLSearchParams({
      orientation: orientation,
      ...(categorySlug && { category: categorySlug }),
      ...(isDual && { 
        dual: 'true',
        leftCategory: leftMenuCategory || '',
        rightCategory: rightMenuCategory || ''
      })
    });
    
    const popoutWindow = window.open(
      `/menu-display?${urlParams.toString()}`,
      'MenuDisplay',
      windowFeatures
    );
    
    if (popoutWindow) {
      // Focus the popout window
      popoutWindow.focus();
      
      // Pass the products data to the popout window
      popoutWindow.addEventListener('load', () => {
        popoutWindow.postMessage({
          type: 'MENU_DATA',
          products: products,
          categories: getUniqueCategories(),
          orientation: orientation,
          categoryFilter: categorySlug,
          isDual: isDual,
          leftMenuCategory: leftMenuCategory,
          rightMenuCategory: rightMenuCategory
        }, window.location.origin);
      });
    } else {
      alert('Please allow popups for this site to open the TV menu display.');
    }
  }, [products, orientation, leftMenuCategory, rightMenuCategory]);

  const handleDualMenuLaunch = () => {
    if (orientation !== 'horizontal') {
      alert('Dual menu is only available in horizontal orientation.');
      return;
    }
    setShowDualMenuSelector(true);
  };

  const launchDualMenu = () => {
    if (!leftMenuCategory || !rightMenuCategory) {
      alert('Please select categories for both left and right menus.');
      return;
    }
    setShowDualMenuSelector(false);
    openPopoutMenu(undefined, true);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/flora-im/products?per_page=100&_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Filter products that have inventory at current location
        const locationId = user?.location_id?.toString() || '0';
        const filteredProducts = result.data.filter((product: Product) => {
          const locationInventory = product.inventory?.find(inv => 
            inv.location_id === locationId
          );
          return locationInventory && locationInventory.stock > 0;
        });

        // Load blueprint pricing for all products
        try {
          console.log(`🔍 [MenuView] Batch fetching blueprint pricing for ${filteredProducts.length} products`);
          const productsWithCategories = filteredProducts.map((product: Product) => ({
            id: product.id,
            categoryIds: product.categories?.map(cat => cat.id) || []
          }));

          const batchPricingResponse = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories);
          
          // Apply batch pricing results to products
          filteredProducts.forEach((product: Product) => {
            const pricingData = batchPricingResponse[product.id];
            if (pricingData) {
              product.blueprintPricing = pricingData;
            }
          });
          
          console.log(`✅ [MenuView] Applied blueprint pricing to ${Object.keys(batchPricingResponse).length}/${filteredProducts.length} products`);
        } catch (pricingError) {
          console.warn(`⚠️ [MenuView] Failed to get batch blueprint pricing:`, pricingError instanceof Error ? pricingError.message : 'Unknown error');
          // Continue without pricing
        }

        setProducts(filteredProducts);
      } else {
        throw new Error(result.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.location_id]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getUniqueCategories = () => {
    const categoryMap = new Map();
    products.forEach(product => {
      product.categories?.forEach(cat => {
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, cat);
        }
      });
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getMetaValue = (product: Product, key: string): string => {
    const meta = product.meta_data?.find(m => m.key === key);
    return meta?.value || '';
  };

  const getStrainType = (product: Product): string => {
    return getMetaValue(product, 'strain_type') || getMetaValue(product, '_strain_type') || 'N/A';
  };

  const getTHCAPercentage = (product: Product): string => {
    const thca = getMetaValue(product, 'thca_percentage') || getMetaValue(product, '_thca_percentage');
    return thca ? `${thca}%` : 'N/A';
  };

  // Render tiered pricing for a category
  const renderCategoryPricing = (categoryProducts: Product[]) => {
    // Get all unique pricing tiers from products in this category
    const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
    
    categoryProducts.forEach(product => {
      if (product.blueprintPricing?.ruleGroups) {
        product.blueprintPricing.ruleGroups.forEach((ruleGroup: any) => {
          ruleGroup.tiers.forEach((tier: any) => {
            const key = `${ruleGroup.ruleName}-${tier.label}`;
            if (!pricingTiers.has(key)) {
              pricingTiers.set(key, {
                label: tier.label,
                price: tier.price,
                ruleName: ruleGroup.ruleName
              });
            }
          });
        });
      }
    });

    if (pricingTiers.size === 0) return null;

    // Group tiers by rule name
    const tiersByRule = new Map<string, Array<{ label: string; price: number }>>();
    pricingTiers.forEach(tier => {
      if (!tiersByRule.has(tier.ruleName)) {
        tiersByRule.set(tier.ruleName, []);
      }
      tiersByRule.get(tier.ruleName)!.push({ label: tier.label, price: tier.price });
    });

    // Sort tiers within each rule by price
    tiersByRule.forEach(tiers => {
      tiers.sort((a, b) => a.price - b.price);
    });

    return (
      <div className="bg-neutral-800/40 rounded-lg p-2 space-y-2 border border-neutral-600/20 mt-3 text-xs">
        <div className="text-center text-neutral-200 font-semibold uppercase tracking-wide text-[10px]">
          Pricing
        </div>
        {Array.from(tiersByRule.entries()).map(([ruleName, tiers]) => (
          <div key={ruleName} className="space-y-1">
            <div className="text-center text-yellow-400 font-medium uppercase tracking-wider text-[9px]">
              {ruleName}
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {tiers.map((tier, index) => (
                <div
                  key={`${ruleName}-${index}`}
                  className="bg-gradient-to-br from-neutral-500 to-neutral-600 border border-neutral-400 rounded px-2 py-1 text-[9px] shadow-sm"
                >
                  <div className="text-white font-medium text-center">{tier.label}</div>
                  <div className="text-green-400 font-bold text-center">${tier.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getStrainType(product).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      product.categories?.some(cat => cat.slug === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  const productsByCategory = getUniqueCategories().map(category => ({
    category,
    products: filteredProducts.filter(product => 
      product.categories?.some(cat => cat.id === category.id)
    )
  })).filter(group => group.products.length > 0);

  // Check if we're displaying flower products (for table view)
  const isFlowerCategory = (categoryName: string) => {
    const flowerKeywords = ['flower', 'bud', 'strain'];
    return flowerKeywords.some(keyword => 
      categoryName.toLowerCase().includes(keyword)
    );
  };

  // Check if category should display product images
  const shouldShowImages = (categoryName: string) => {
    const imageCategories = ['edible', 'concentrate', 'vape', 'cartridge', 'extract', 'dab', 'wax', 'shatter', 'rosin', 'live resin'];
    return imageCategories.some(keyword => 
      categoryName.toLowerCase().includes(keyword)
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Menu Products" subText="Preparing TV display data..." />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-lg font-medium mb-2">Failed to load products</p>
          <p className="text-sm text-neutral-400 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-600/10 hover:border-neutral-400/40 rounded-lg text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">TV Menu Display</h1>
          <p className="text-neutral-400">
            Manage the full-screen menu display for TV behind sales desk
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Orientation Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Orientation:</span>
            <div className="flex bg-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setOrientation('horizontal')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  orientation === 'horizontal' 
                    ? 'bg-neutral-600 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
                </svg>
                Horizontal
              </button>
              <button
                onClick={() => setOrientation('vertical')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  orientation === 'vertical' 
                    ? 'bg-neutral-600 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} />
                </svg>
                Vertical
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Category:</span>
              <select
                value={selectedMenuCategory || ''}
                onChange={(e) => setSelectedMenuCategory(e.target.value || null)}
                className="bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm border border-neutral-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => openPopoutMenu(selectedMenuCategory || undefined)}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open {selectedMenuCategory ? `${getUniqueCategories().find(c => c.slug === selectedMenuCategory)?.name} ` : ''}{orientation === 'vertical' ? 'Vertical' : 'Horizontal'} Menu
              </button>
              
              {orientation === 'horizontal' && (
                <button
                  onClick={handleDualMenuLaunch}
                  className="flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
                  </svg>
                  Dual Menu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Categories */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Quick Launch Category Menus</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {getUniqueCategories().map(category => {
            const categoryProducts = filteredProducts.filter(product => 
              product.categories?.some(cat => cat.id === category.id)
            );
            
            return (
              <button
                key={category.id}
                onClick={() => openPopoutMenu(category.slug)}
                className="bg-neutral-600 hover:bg-neutral-600/10 hover:border-neutral-400/40 text-white rounded-lg p-4 text-left transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{category.name}</h4>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <div className="text-xs text-neutral-400">
                  {categoryProducts.length} products • {orientation}
                </div>
                <div className="text-xs text-green-400 mt-1 font-medium">
                  Open {category.name} Menu
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-transparent border border-neutral-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">
            {selectedMenuCategory 
              ? filteredProducts.filter(p => p.categories?.some(c => c.slug === selectedMenuCategory)).length
              : filteredProducts.length
            }
          </div>
          <div className="text-sm text-neutral-400">
            {selectedMenuCategory ? 'Category Products' : 'Available Products'}
          </div>
        </div>
        <div className="bg-transparent border border-neutral-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{productsByCategory.length}</div>
          <div className="text-sm text-neutral-400">Categories</div>
        </div>
        <div className="bg-transparent border border-neutral-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-white capitalize">{orientation}</div>
          <div className="text-sm text-neutral-400">Display Mode</div>
        </div>
        <div className="bg-transparent border border-neutral-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{user?.location || 'Unknown'}</div>
          <div className="text-sm text-neutral-400">Location</div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-neutral-700 rounded-lg p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Menu Preview</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>Layout:</span>
            <span className="capitalize text-white font-medium">{orientation}</span>
            {orientation === 'vertical' ? (
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
              </svg>
            )}
          </div>
        </div>
        
        {productsByCategory.length === 0 ? (
          <div className="text-center text-neutral-400 py-8">
            <p>No products available for display</p>
          </div>
        ) : (
          <div className="space-y-6">
            {productsByCategory.map(({ category, products: categoryProducts }) => (
              <div key={category.id} className={`border-b border-neutral-600 pb-6 last:border-b-0 ${isFlowerCategory(category.name) ? '-mt-6' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                      {category.name}
                    </h3>
                    {/* Tiered Pricing Display */}
                    {renderCategoryPricing(categoryProducts)}
                  </div>
                  {isFlowerCategory(category.name) && (
                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                      Table View
                    </span>
                  )}
                </div>
                
                {isFlowerCategory(category.name) ? (
                  /* Table Preview for Flower Products - Edge to Edge */
                  <div className="bg-transparent overflow-hidden -mx-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-neutral-700/20 border-b border-neutral-500/30">
                          <tr>
                            <th className="text-left text-white font-medium px-2 py-1">Product</th>
                            <th className="text-center text-white font-medium px-2 py-1">Type</th>
                            <th className="text-center text-white font-medium px-2 py-1">THCA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryProducts.slice(0, 5).map((product, index) => {
                            const strainType = getStrainType(product);
                            const thcaPercent = getTHCAPercentage(product);

                            return (
                              <tr key={product.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-neutral-700/10'}>
                                <td className="px-2 py-1 text-white font-medium text-xs leading-tight" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)' }}>{product.name}</td>
                                <td className="px-2 py-1 text-center text-neutral-200 text-xs">{strainType}</td>
                                <td className="px-2 py-1 text-center text-neutral-200 text-xs">{thcaPercent}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {categoryProducts.length > 5 && (
                      <div className="bg-neutral-700/20 border-b border-neutral-500/30 px-3 py-2 text-center text-xs text-neutral-300">
                        +{categoryProducts.length - 5} more products in TV display
                      </div>
                    )}
                  </div>
                ) : (
                  /* Grid Preview for Non-Flower Products */
                  <div className={`grid gap-3 ${
                    orientation === 'vertical' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' 
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {categoryProducts.map(product => {
                      const strainType = getStrainType(product);
                      const thcaPercent = getTHCAPercentage(product);

                      return (
                        <div key={product.id} className="bg-transparent border border-neutral-500/30 rounded-lg p-3 hover:bg-neutral-600/10 hover:border-neutral-400/40 transition-colors">
                          {/* Product Image - Only for specific categories */}
                          {shouldShowImages(category.name) && (
                            <div className="flex justify-center mb-2">
                              <div className="w-12 h-12 relative overflow-hidden rounded">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-full object-contain  rounded"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center  rounded">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <h4 className="font-medium text-white text-sm leading-tight text-center" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)' }}>
                              {product.name}
                            </h4>
                          </div>
                          
                          
                          {product.sku && (
                            <div className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-500">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dual Menu Selector Modal */}
      {showDualMenuSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-800/90 backdrop-blur-sm rounded-xl p-8 max-w-2xl w-full mx-4 border border-neutral-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                Configure Dual Menu
              </h2>
              <button
                onClick={() => setShowDualMenuSelector(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-neutral-300 mb-8 text-lg">
              Select which categories to display on each side of the dual menu layout.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Menu Selection */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                  Left Menu Category
                </label>
                <select
                  value={leftMenuCategory || ''}
                  onChange={(e) => setLeftMenuCategory(e.target.value || null)}
                  className="w-full bg-neutral-600 text-white px-4 py-3 rounded-lg text-base border border-neutral-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {getUniqueCategories().map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Right Menu Selection */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                  Right Menu Category
                </label>
                <select
                  value={rightMenuCategory || ''}
                  onChange={(e) => setRightMenuCategory(e.target.value || null)}
                  className="w-full bg-neutral-600 text-white px-4 py-3 rounded-lg text-base border border-neutral-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {getUniqueCategories().map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Preview */}
            {leftMenuCategory && rightMenuCategory && (
              <div className="mb-8 p-4 bg-neutral-800 rounded-lg border border-neutral-600">
                <h3 className="text-white font-semibold mb-3" style={{ fontFamily: 'Tiempo, serif' }}>
                  Preview Layout:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-neutral-700 p-3 rounded border-r border-neutral-500">
                    <div className="text-green-400 font-medium">Left Side</div>
                    <div className="text-white text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {getUniqueCategories().find(c => c.slug === leftMenuCategory)?.name}
                    </div>
                  </div>
                  <div className="bg-neutral-700 p-3 rounded">
                    <div className="text-blue-400 font-medium">Right Side</div>
                    <div className="text-white text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {getUniqueCategories().find(c => c.slug === rightMenuCategory)?.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowDualMenuSelector(false)}
                className="px-6 py-3 bg-neutral-600 hover:bg-neutral-600/10 hover:border-neutral-400/40 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={launchDualMenu}
                disabled={!leftMenuCategory || !rightMenuCategory}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Launch Dual Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
