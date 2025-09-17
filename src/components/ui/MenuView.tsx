'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { Product, Category } from '../../types';

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
  const [openWindows, setOpenWindows] = useState<Map<string, Window>>(new Map());

  const openPopoutMenu = useCallback((categorySlug?: string, isDual = false) => {
    // Generate unique window name based on timestamp and content
    const windowId = `MenuDisplay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const windowTitle = categorySlug 
      ? `${categorySlug}_${isDual ? 'dual' : 'single'}`
      : `all_${isDual ? 'dual' : 'single'}`;
    
    // Determine window dimensions based on orientation
    const windowFeatures = orientation === 'vertical' 
      ? 'width=1080,height=1920,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
      : 'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
    
    // Build URL with orientation and category parameters
    const urlParams = new URLSearchParams({
      orientation: orientation,
      windowId: windowId,
      ...(categorySlug && { category: categorySlug }),
      ...(isDual && { 
        dual: 'true',
        leftCategory: leftMenuCategory || '',
        rightCategory: rightMenuCategory || ''
      })
    });
    
    const popoutWindow = window.open(
      `/menu-display?${urlParams.toString()}`,
      windowId,
      windowFeatures
    );
    
    if (popoutWindow) {
      // Track the window
      setOpenWindows(prev => new Map(prev).set(windowId, popoutWindow));
      
      // Focus the popout window
      popoutWindow.focus();
      
      // Monitor window close to remove from tracking
      const checkClosed = setInterval(() => {
        if (popoutWindow.closed) {
          setOpenWindows(prev => {
            const newMap = new Map(prev);
            newMap.delete(windowId);
            return newMap;
          });
          clearInterval(checkClosed);
        }
      }, 1000);
      
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
          rightMenuCategory: rightMenuCategory,
          windowId: windowId
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

  // Window management functions
  const closeAllWindows = useCallback(() => {
    openWindows.forEach((window) => {
      if (!window.closed) {
        window.close();
      }
    });
    setOpenWindows(new Map());
  }, [openWindows]);

  const focusWindow = useCallback((windowId: string) => {
    const window = openWindows.get(windowId);
    if (window && !window.closed) {
      window.focus();
    }
  }, [openWindows]);

  const closeWindow = useCallback((windowId: string) => {
    const window = openWindows.get(windowId);
    if (window && !window.closed) {
      window.close();
    }
    setOpenWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(windowId);
      return newMap;
    });
  }, [openWindows]);

  // Live Preview Component
  const LiveMenuPreview = ({ products: previewProducts, categories: previewCategories, orientation: previewOrient, categoryFilter }: {
    products: Product[];
    categories: Category[];
    orientation: 'horizontal' | 'vertical';
    categoryFilter?: string;
  }) => {
    const displayProducts = categoryFilter 
      ? previewProducts.filter(product => 
          product.categories?.some(cat => cat.slug === categoryFilter)
        )
      : previewProducts;

    const displayCategories = categoryFilter
      ? previewCategories.filter(cat => cat.slug === categoryFilter)
      : previewCategories;

    const productsByCategory = displayCategories.map(category => ({
      category,
      products: displayProducts.filter(product => 
        product.categories?.some(cat => cat.id === category.id)
      )
    })).filter(group => group.products.length > 0);

    return (
      <div className="h-full bg-black text-white overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-transparent border-b border-white/[0.06] px-6 flex-shrink-0 relative z-10 ${
          previewOrient === 'vertical' ? 'py-2' : 'py-1'
        }`}>
          <div className={`flex flex-col items-center relative z-10 ${
            previewOrient === 'vertical' ? 'gap-1' : 'gap-0'
          }`}>
            <div className="text-center">
              <h1 className={`font-bold text-white ${
                previewOrient === 'vertical' ? 'text-8xl' : 'text-7xl'
              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                {categoryFilter ? `${previewCategories.find(c => c.slug === categoryFilter)?.name || categoryFilter} Menu` : 'Flora Menu'}
              </h1>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-3 opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {productsByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-2xl text-white mb-3">No products currently available</p>
                <p className="text-lg text-white">Check back soon for updates</p>
              </div>
            </div>
          ) : (
            <div className={`h-full ${previewOrient === 'vertical' ? 'space-y-6' : 'space-y-8'} p-4`}>
              {productsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id} className={isFlowerCategory(category.name) ? '-mt-8' : ''}>
                  {!categoryFilter && (
                    <div className="bg-transparent px-6 py-1 border-b border-white/[0.06] relative">
                      <h2 className={`font-bold text-white uppercase tracking-wider relative z-10 ${
                        previewOrient === 'vertical' ? 'text-lg' : 'text-xl'
                      }`} style={{ fontFamily: 'Tiempo, serif' }}>
                        {category.name}
                      </h2>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-neutral-400/60 to-transparent mt-2"></div>
                    </div>
                  )}
                  
                  {isFlowerCategory(category.name) ? (
                    <div className="flex-1 overflow-hidden relative -mx-4 rounded-lg border border-white/[0.06] bg-transparent">
                      <div className="overflow-x-auto h-full relative z-10">
                        <table className="w-full h-full border-collapse">
                          <thead className="bg-neutral-900/40 border-b border-white/[0.06] sticky top-0 z-20 backdrop-blur-sm">
                            <tr className="border-b border-white/[0.06]">
                              <th className={`text-left text-white font-medium px-2 py-1 ${
                                previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                Product Name
                              </th>
                              <th className={`text-center text-white font-medium px-2 py-1 ${
                                previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                Type
                              </th>
                              <th className={`text-center text-white font-medium px-2 py-1 ${
                                previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                THCA %
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryProducts.slice(0, previewOrient === 'vertical' ? 15 : 10).map((product, index) => {
                              const strainType = getStrainType(product);
                              const thcaPercent = getTHCAPercentage(product);

                              return (
                                <tr 
                                  key={product.id}
                                  className={`border-b border-white/[0.06] hover:bg-neutral-700 transition-all duration-300 ease-out cursor-pointer ${
                                    index % 2 === 0 ? 'bg-black' : 'bg-neutral-900'
                                  }`}
                                >
                                  <td className={`px-2 py-1 text-white font-medium leading-tight ${
                                    previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                                  }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                    {product.name}
                                  </td>
                                  <td className={`px-2 py-1 text-center text-white ${
                                    previewOrient === 'vertical' ? 'text-xs' : 'text-xs'
                                  }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                    {strainType}
                                  </td>
                                  <td className={`px-2 py-1 text-center text-white font-medium ${
                                    previewOrient === 'vertical' ? 'text-xs' : 'text-xs'
                                  }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                    {thcaPercent}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-2 px-6 py-2 ${
                      previewOrient === 'vertical' 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    }`}>
                      {categoryProducts.slice(0, previewOrient === 'vertical' ? 12 : 20).map(product => (
                        <div 
                          key={product.id} 
                          className={`relative rounded-lg overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
                            previewOrient === 'vertical' ? 'p-6' : 'p-5'
                          } border border-white/[0.2] bg-black hover:border-white/[0.4] hover:bg-neutral-900 backdrop-blur-sm`}
                        >
                          {shouldShowImages(category.name) && (
                            <div className="flex justify-center mb-3 relative z-10">
                              <div className={`relative overflow-hidden rounded-lg ${
                                previewOrient === 'vertical' ? 'w-20 h-20' : 'w-16 h-16'
                              }`}>
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-full object-contain rounded-lg"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded-lg">
                                    <svg className={`text-white ${
                                      previewOrient === 'vertical' ? 'w-8 h-8' : 'w-6 h-6'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <h3 className={`font-semibold text-white leading-tight mb-4 relative z-10 text-center ${
                            previewOrient === 'vertical' ? 'text-xl' : 'text-lg'
                          }`} style={{ fontFamily: 'Tiempo, serif' }}>
                            {product.name}
                          </h3>
                          
                          <div className={`space-y-3 relative z-10 ${
                            previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                          }`}>
                            {product.sku && (
                              <div className="text-center pt-2 border-t border-neutral-600">
                                <div className="text-white mb-1" style={{ fontFamily: 'Tiempo, serif' }}>SKU</div>
                                <div className="text-white font-mono text-xs">{product.sku}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
        <div className="text-center text-white font-semibold uppercase tracking-wide text-[10px]">
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
                  className="bg-gradient-to-br from-neutral-500 to-neutral-600 border border-neutral-400 rounded px-2 py-1 text-[9px] "
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
          <p className="text-sm text-white mb-4">{error}</p>
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
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Tiempo, serif' }}>Menu Configuration</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Orientation Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Orientation:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOrientation('horizontal')}
                className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                  orientation === 'horizontal' 
                    ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                    : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                }`}
                title="Horizontal Orientation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
                </svg>
              </button>
              <button
                onClick={() => setOrientation('vertical')}
                className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                  orientation === 'vertical' 
                    ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                    : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                }`}
                title="Vertical Orientation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Category:</span>
              <select
                value={selectedMenuCategory || ''}
                onChange={(e) => setSelectedMenuCategory(e.target.value || null)}
                className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out"
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
              className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-white border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-white"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open {selectedMenuCategory ? `${getUniqueCategories().find(c => c.slug === selectedMenuCategory)?.name} ` : ''}{orientation === 'vertical' ? 'Vertical' : 'Horizontal'} Menu
              </button>
              
              {orientation === 'horizontal' && (
                <button
                  onClick={handleDualMenuLaunch}
                  className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-white border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-white"
                  style={{ fontFamily: 'Tiempo, serif' }}
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
        <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Tiempo, serif' }}>Quick Launch Category Menus</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {getUniqueCategories().map(category => {
            const categoryProducts = filteredProducts.filter(product => 
              product.categories?.some(cat => cat.id === category.id)
            );
            
            return (
              <button
                key={category.id}
                onClick={() => openPopoutMenu(category.slug)}
                className="rounded-lg p-4 text-left transition-all duration-200 ease-out border bg-transparent text-white border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-white group"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm" style={{ fontFamily: 'Tiempo, serif' }}>{category.name}</h4>
                  <svg className="w-4 h-4 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <div className="text-xs text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                  {categoryProducts.length} products • {orientation}
                </div>
                <div className="text-xs text-green-400 mt-1 font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                  Open {category.name} Menu
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multiple Window Management */}
      {openWindows.size > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>Open Menu Windows ({openWindows.size})</h3>
            <button
              onClick={closeAllWindows}
              className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-red-400 border-red-500/30 hover:bg-red-600/10 hover:border-red-400/50 hover:text-red-300"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(openWindows.entries()).map(([windowId, window]) => {
              const urlParams = new URLSearchParams(window.location?.search || '');
              const category = urlParams.get('category');
              const isDual = urlParams.get('dual') === 'true';
              const orientation = urlParams.get('orientation') || 'horizontal';
              
              return (
                <div
                  key={windowId}
                  className="p-4 rounded-lg border bg-transparent border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 transition-all duration-200 ease-out"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                      {category 
                        ? `${getUniqueCategories().find(c => c.slug === category)?.name || category} Menu`
                        : 'All Categories Menu'
                      }
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => focusWindow(windowId)}
                        className="p-1 text-white hover:text-white transition-all duration-200 ease-out"
                        title="Focus Window"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => closeWindow(windowId)}
                        className="p-1 text-red-400 hover:text-red-300 transition-all duration-200 ease-out"
                        title="Close Window"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span className={`px-2 py-1 rounded text-xs ${
                      orientation === 'vertical' ? 'bg-purple-600/20 text-purple-300' : 'bg-blue-600/20 text-blue-300'
                    }`}>
                      {orientation}
                    </span>
                    {isDual && (
                      <span className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-300">
                        Dual
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      window.closed ? 'bg-red-600/20 text-red-300' : 'bg-green-600/20 text-green-300'
                    }`}>
                      {window.closed ? 'Closed' : 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-4 border bg-transparent border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 transition-all duration-200 ease-out">
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
            {selectedMenuCategory 
              ? filteredProducts.filter(p => p.categories?.some(c => c.slug === selectedMenuCategory)).length
              : filteredProducts.length
            }
          </div>
          <div className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>
            {selectedMenuCategory ? 'Category Products' : 'Available Products'}
          </div>
        </div>
        <div className="rounded-lg p-4 border bg-transparent border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 transition-all duration-200 ease-out">
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Tiempo, serif' }}>{productsByCategory.length}</div>
          <div className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Categories</div>
        </div>
        <div className="rounded-lg p-4 border bg-transparent border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 transition-all duration-200 ease-out">
          <div className="text-2xl font-bold text-white capitalize" style={{ fontFamily: 'Tiempo, serif' }}>{orientation}</div>
          <div className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Display Mode</div>
        </div>
        <div className="rounded-lg p-4 border bg-transparent border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 transition-all duration-200 ease-out">
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Tiempo, serif' }}>{user?.location || 'Unknown'}</div>
          <div className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Location</div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 rounded-lg overflow-hidden border border-neutral-500/30 bg-transparent">
        <div className="flex items-center justify-between p-4 border-b border-neutral-500/30">
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>Live Menu Preview</h2>
          <div className="text-xs text-white" style={{ fontFamily: 'Tiempo, serif' }}>
            Both orientations shown side by side
          </div>
        </div>
        
        <div className="relative bg-transparent p-6">
          {productsByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-white" style={{ fontFamily: 'Tiempo, serif' }}>No products available for preview</p>
                <p className="text-sm text-white mt-2" style={{ fontFamily: 'Tiempo, serif' }}>Add products to see live menu previews</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* All Categories Preview */}
              {!selectedMenuCategory && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>All Categories Menu</h3>
                  <div className="flex gap-6 justify-center">
                    {/* Horizontal Preview */}
                    <div className="relative">
                      <div className="absolute -top-6 left-0 text-xs text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                        Horizontal (1920×1080)
                      </div>
                      <div className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300" 
                           style={{ width: '240px', height: '135px' }}>
                        <div 
                          className="origin-top-left"
                          style={{
                            transform: 'scale(0.125)',
                            width: '1920px',
                            height: '1080px',
                          }}
                        >
                          <LiveMenuPreview 
                            products={filteredProducts}
                            categories={getUniqueCategories()}
                            orientation="horizontal"
                            categoryFilter={undefined}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vertical Preview */}
                    <div className="relative">
                      <div className="absolute -top-6 left-0 text-xs text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                        Vertical (1080×1920)
                      </div>
                      <div className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300" 
                           style={{ width: '108px', height: '192px' }}>
                        <div 
                          className="origin-top-left"
                          style={{
                            transform: 'scale(0.1)',
                            width: '1080px',
                            height: '1920px',
                          }}
                        >
                          <LiveMenuPreview 
                            products={filteredProducts}
                            categories={getUniqueCategories()}
                            orientation="vertical"
                            categoryFilter={undefined}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Category Previews */}
              {getUniqueCategories().map(category => {
                const categoryProducts = filteredProducts.filter(product => 
                  product.categories?.some(cat => cat.id === category.id)
                );
                
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                        {category.name} Menu
                      </h3>
                      <span className="text-xs text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                        {categoryProducts.length} products
                      </span>
                    </div>
                    <div className="flex gap-6 justify-center">
                      {/* Horizontal Preview */}
                      <div className="relative">
                        <div className="absolute -top-6 left-0 text-xs text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                          Horizontal
                        </div>
                        <div className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300" 
                             style={{ width: '240px', height: '135px' }}>
                          <div 
                            className="origin-top-left"
                            style={{
                              transform: 'scale(0.125)',
                              width: '1920px',
                              height: '1080px',
                            }}
                          >
                            <LiveMenuPreview 
                              products={filteredProducts}
                              categories={getUniqueCategories()}
                              orientation="horizontal"
                              categoryFilter={category.slug}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Vertical Preview */}
                      <div className="relative">
                        <div className="absolute -top-6 left-0 text-xs text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                          Vertical
                        </div>
                        <div className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300" 
                             style={{ width: '108px', height: '192px' }}>
                          <div 
                            className="origin-top-left"
                            style={{
                              transform: 'scale(0.1)',
                              width: '1080px',
                              height: '1920px',
                            }}
                          >
                            <LiveMenuPreview 
                              products={filteredProducts}
                              categories={getUniqueCategories()}
                              orientation="vertical"
                              categoryFilter={category.slug}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-neutral-500/30">
          <div className="text-xs text-white text-center" style={{ fontFamily: 'Tiempo, serif' }}>
            Live menu previews • Each category shown in both orientations • Updates automatically
          </div>
        </div>
      </div>

      {/* Dual Menu Selector Modal */}
      {showDualMenuSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-xl p-8 max-w-2xl w-full mx-4 border border-neutral-500/30 bg-neutral-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                Configure Dual Menu
              </h2>
              <button
                onClick={() => setShowDualMenuSelector(false)}
                className="text-white hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-white mb-8 text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
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
                  className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out"
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
                  className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out"
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
              <div className="mb-8 p-4 rounded-lg border border-neutral-500/30 bg-transparent">
                <h3 className="text-white font-semibold mb-3" style={{ fontFamily: 'Tiempo, serif' }}>
                  Preview Layout:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded border-r border-neutral-500/30 bg-transparent">
                    <div className="text-green-400 font-medium" style={{ fontFamily: 'Tiempo, serif' }}>Left Side</div>
                    <div className="text-white text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {getUniqueCategories().find(c => c.slug === leftMenuCategory)?.name}
                    </div>
                  </div>
                  <div className="bg-neutral-700 p-3 rounded">
                    <div className="text-blue-400 font-medium" style={{ fontFamily: 'Tiempo, serif' }}>Right Side</div>
                    <div className="text-white text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {getUniqueCategories().find(c => c.slug === rightMenuCategory)?.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDualMenuSelector(false)}
                className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-white border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-white"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={launchDualMenu}
                disabled={!leftMenuCategory || !rightMenuCategory}
                className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-white border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Tiempo, serif' }}
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
