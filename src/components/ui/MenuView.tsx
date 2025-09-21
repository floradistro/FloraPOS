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
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'auto'>('auto'); // 'auto' uses category-based logic
  const [showImages, setShowImages] = useState<boolean>(true); // Toggle for showing product images
  const [leftMenuImages, setLeftMenuImages] = useState<boolean>(true); // Images for left dual menu
  const [rightMenuImages, setRightMenuImages] = useState<boolean>(true); // Images for right dual menu
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [showDualMenuSelector, setShowDualMenuSelector] = useState(false);
  const [leftMenuCategory, setLeftMenuCategory] = useState<string | null>(null);
  const [rightMenuCategory, setRightMenuCategory] = useState<string | null>(null);
  // Vertical stacking support
  const [leftMenuCategory2, setLeftMenuCategory2] = useState<string | null>(null);
  const [rightMenuCategory2, setRightMenuCategory2] = useState<string | null>(null);
  const [leftMenuImages2, setLeftMenuImages2] = useState<boolean>(true);
  const [rightMenuImages2, setRightMenuImages2] = useState<boolean>(true);
  const [enableLeftStacking, setEnableLeftStacking] = useState<boolean>(false);
  const [enableRightStacking, setEnableRightStacking] = useState<boolean>(false);
  // Color customization
  const [backgroundColor, setBackgroundColor] = useState<string>('#f5f5f4'); // stone-100
  const [fontColor, setFontColor] = useState<string>('#1f2937'); // gray-800
  const [containerColor, setContainerColor] = useState<string>('#d1d5db'); // gray-300
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
    
    // Build URL with orientation, view mode, images, colors, and category parameters
    const urlParams = new URLSearchParams({
      orientation: orientation,
      viewMode: viewMode,
      showImages: isDual ? 'dual' : showImages.toString(),
      backgroundColor: encodeURIComponent(backgroundColor),
      fontColor: encodeURIComponent(fontColor),
      containerColor: encodeURIComponent(containerColor),
      windowId: windowId,
      ...(categorySlug && { category: categorySlug }),
      ...(isDual && { 
        dual: 'true',
        leftCategory: leftMenuCategory || '',
        rightCategory: rightMenuCategory || '',
        leftImages: leftMenuImages.toString(),
        rightImages: rightMenuImages.toString(),
        leftCategory2: enableLeftStacking ? (leftMenuCategory2 || '') : '',
        rightCategory2: enableRightStacking ? (rightMenuCategory2 || '') : '',
        leftImages2: enableLeftStacking ? leftMenuImages2.toString() : 'false',
        rightImages2: enableRightStacking ? rightMenuImages2.toString() : 'false',
        leftStacking: enableLeftStacking.toString(),
        rightStacking: enableRightStacking.toString()
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
          viewMode: viewMode,
          showImages: isDual ? 'dual' : showImages,
          backgroundColor: backgroundColor,
          fontColor: fontColor,
          containerColor: containerColor,
          leftMenuImages: leftMenuImages,
          rightMenuImages: rightMenuImages,
          leftMenuImages2: leftMenuImages2,
          rightMenuImages2: rightMenuImages2,
          categoryFilter: categorySlug,
          isDual: isDual,
          leftMenuCategory: leftMenuCategory,
          rightMenuCategory: rightMenuCategory,
          leftMenuCategory2: enableLeftStacking ? leftMenuCategory2 : null,
          rightMenuCategory2: enableRightStacking ? rightMenuCategory2 : null,
          enableLeftStacking: enableLeftStacking,
          enableRightStacking: enableRightStacking,
          windowId: windowId
        }, window.location.origin);
      });
    } else {
      alert('Please allow popups for this site to open the TV menu display.');
    }
  }, [products, orientation, viewMode, showImages, backgroundColor, fontColor, containerColor, leftMenuImages, rightMenuImages, leftMenuImages2, rightMenuImages2, leftMenuCategory, rightMenuCategory, leftMenuCategory2, rightMenuCategory2, enableLeftStacking, enableRightStacking]);

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
    if (enableLeftStacking && !leftMenuCategory2) {
      alert('Please select a category for the second left menu.');
      return;
    }
    if (enableRightStacking && !rightMenuCategory2) {
      alert('Please select a category for the second right menu.');
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
  const LiveMenuPreview = ({ products: previewProducts, categories: previewCategories, orientation: previewOrient, viewMode: previewViewMode, showImages: previewShowImages, categoryFilter }: {
    products: Product[];
    categories: Category[];
    orientation: 'horizontal' | 'vertical';
    viewMode: 'table' | 'card' | 'auto';
    showImages: boolean;
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

    // Determine actual view mode to use
    const getActualViewMode = (categoryName: string) => {
      if (previewViewMode === 'auto') {
        return isFlowerCategory(categoryName) ? 'table' : 'card';
      }
      return previewViewMode;
    };

    return (
      <div className="h-full bg-gray-50 text-black overflow-hidden flex flex-col border-2 border-gray-200">
        {/* Header */}
        <div className={`bg-white/95 border-b border-gray-200 px-6 flex-shrink-0 relative z-10 ${
          previewOrient === 'vertical' ? 'py-3' : 'py-2'
        }`}>
          <div className={`flex flex-col items-center relative z-10 ${
            previewOrient === 'vertical' ? 'gap-1' : 'gap-0'
          }`}>
            <div className="text-center">
              <h1 className={`font-bold text-black ${
                previewOrient === 'vertical' ? 'text-8xl' : 'text-7xl'
              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                {categoryFilter ? `${previewCategories.find(c => c.slug === categoryFilter)?.name || categoryFilter} Menu` : 'Flora Menu'}
              </h1>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mt-3 opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {productsByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-2xl text-black mb-3">No products currently available</p>
                <p className="text-lg text-gray-600">Check back soon for updates</p>
              </div>
            </div>
          ) : (
            <div className={`h-full ${previewOrient === 'vertical' ? 'space-y-6' : 'space-y-8'} p-4`}>
              {productsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id} className={isFlowerCategory(category.name) ? '-mt-8' : ''}>
                  {!categoryFilter && (
                    <div className="bg-white/95 px-6 py-3 border-b border-gray-200 relative rounded-t-lg">
                      <h2 className={`font-bold text-black uppercase tracking-wider relative z-10 ${
                        previewOrient === 'vertical' ? 'text-lg' : 'text-xl'
                      }`} style={{ fontFamily: 'Tiempo, serif' }}>
                        {category.name}
                      </h2>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-400/60 to-transparent mt-2"></div>
                    </div>
                  )}
                  
                  {getActualViewMode(category.name) === 'table' ? (
                    <div className="flex-1 overflow-hidden relative -mx-4 rounded-lg border border-gray-200 bg-white/95 shadow-sm">
                      <div className="overflow-x-auto h-full relative z-10">
                        <table className="w-full h-full border-collapse">
                          <thead className="bg-gray-50/90 border-b border-gray-200 sticky top-0 z-20 backdrop-blur-sm">
                            <tr className="border-b border-gray-200">
                              <th className={`text-left text-black font-medium px-2 py-1 ${
                                previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                Product Name
                              </th>
                              <th className={`text-center text-black font-medium px-2 py-1 ${
                                previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                Type
                              </th>
                              <th className={`text-center text-black font-medium px-2 py-1 ${
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
                                  className={`border-b border-gray-200 hover:bg-gray-50 transition-all duration-300 ease-out cursor-pointer ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                  }`}
                                >
                                  <td className={`px-2 py-1 text-black font-medium leading-tight ${
                                    previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                                  }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                    {product.name}
                                  </td>
                                  <td className={`px-2 py-1 text-center text-gray-700 ${
                                    previewOrient === 'vertical' ? 'text-xs' : 'text-xs'
                                  }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                    {strainType}
                                  </td>
                                  <td className={`px-2 py-1 text-center text-black font-medium ${
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
                          className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
                            previewOrient === 'vertical' ? 'p-6' : 'p-5'
                          } border border-gray-200 bg-white/95 hover:border-gray-300 hover:bg-white hover:scale-105 shadow-sm hover:shadow-md backdrop-blur-sm`}
                        >
                          {previewShowImages && (getActualViewMode(category.name) === 'card' || shouldShowImages(category.name)) && (
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
                                    <svg className={`text-gray-400 ${
                                      previewOrient === 'vertical' ? 'w-8 h-8' : 'w-6 h-6'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <h3 className={`font-semibold text-black leading-tight mb-4 relative z-10 text-center ${
                            previewOrient === 'vertical' ? 'text-xl' : 'text-lg'
                          }`} style={{ fontFamily: 'Tiempo, serif' }}>
                            {product.name}
                          </h3>
                          
                          <div className={`space-y-3 relative z-10 ${
                            previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                          }`}>
                            {product.sku && (
                              <div className="text-center pt-2 border-t border-gray-200">
                                <div className="text-gray-600 mb-1" style={{ fontFamily: 'Tiempo, serif' }}>SKU</div>
                                <div className="text-black font-mono text-xs">{product.sku}</div>
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
        <div className="text-center text-black font-semibold uppercase tracking-wide text-[10px]">
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
                  <div className="text-black font-medium text-center">{tier.label}</div>
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
      {/* Compact Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-2">
        {/* Left Side - Mode Controls */}
        <div className="flex items-center gap-1">
          {/* Orientation Toggle */}
          <div className="flex items-center border-r border-neutral-700/50 pr-2 mr-2">
            <button
              onClick={() => setOrientation('horizontal')}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                orientation === 'horizontal' 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Horizontal"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
              </svg>
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                orientation === 'vertical' 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Vertical"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border-r border-neutral-700/50 pr-2 mr-2">
            <button
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                viewMode === 'auto' 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                viewMode === 'table' 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Table"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-18-8v8a2 2 0 002 2h16a2 2 0 002-2v-8M5 6V4a2 2 0 012-2h10a2 2 0 012 2v2" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                viewMode === 'card' 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Card"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>

          {/* Image Toggle */}
          <div className="flex items-center border-r border-neutral-700/50 pr-2 mr-2">
            <button
              onClick={() => setShowImages(true)}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                showImages 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Show Images"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowImages(false)}
              className={`p-1.5 rounded transition-all duration-200 ease-out ${
                !showImages 
                  ? 'text-white bg-neutral-700/80 border border-neutral-500' 
                  : 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/40'
              }`}
              title="Hide Images"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            </button>
          </div>

          {/* Color Pickers */}
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-6 h-6 rounded border border-neutral-600/50 bg-transparent cursor-pointer"
              title="Background Color"
            />
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="w-6 h-6 rounded border border-neutral-600/50 bg-transparent cursor-pointer"
              title="Font Color"
            />
            <input
              type="color"
              value={containerColor}
              onChange={(e) => setContainerColor(e.target.value)}
              className="w-6 h-6 rounded border border-neutral-600/50 bg-transparent cursor-pointer"
              title="Container Color"
            />
          </div>
        </div>

        {/* Right Side - Category & Actions */}
        <div className="flex items-center gap-2">
          {/* Category Selector */}
          <select
            value={selectedMenuCategory || ''}
            onChange={(e) => setSelectedMenuCategory(e.target.value || null)}
            className="px-2 h-[28px] bg-transparent hover:bg-neutral-600/10 border border-neutral-600/50 hover:border-neutral-500/70 rounded text-white text-xs focus:bg-neutral-600/10 focus:border-neutral-400 focus:outline-none transition-all duration-200 ease-out"
          >
            <option value="">All Categories</option>
            {getUniqueCategories().map(category => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          
          {/* Launch Button */}
          <button
            onClick={() => openPopoutMenu(selectedMenuCategory || undefined)}
            className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-neutral-600/50 hover:bg-neutral-600/10 hover:border-neutral-500/70"
            title={`Launch ${orientation} ${viewMode} menu ${showImages ? 'with' : 'without'} images`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Launch
          </button>
          
          {/* Dual Menu Button */}
          {orientation === 'horizontal' && (
            <button
              onClick={handleDualMenuLaunch}
              className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-neutral-600/50 hover:bg-neutral-600/10 hover:border-neutral-500/70"
              title="Configure dual menu layout"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
              </svg>
              Dual
            </button>
          )}
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
                <p className="text-sm text-gray-400 mt-2" style={{ fontFamily: 'Tiempo, serif' }}>Add products to see live menu previews</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* All Categories Preview */}
              {!selectedMenuCategory && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>All Categories Menu</h3>
                  <div className="flex gap-8 justify-center">
                    {/* Horizontal Preview */}
                    <div className="relative group">
                      <div className="absolute -top-8 left-0 text-sm text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                        Horizontal (1920×1080)
                      </div>
                      <button
                        onClick={() => openPopoutMenu(undefined)}
                        className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300 hover:border-neutral-400/60 hover:bg-neutral-800/60 hover:scale-105 hover:shadow-2xl group-hover:shadow-neutral-700/20" 
                        style={{ width: '360px', height: '202px' }}
                      >
                        <div 
                          className="origin-top-left pointer-events-none"
                          style={{
                            transform: 'scale(0.1875)',
                            width: '1920px',
                            height: '1080px',
                          }}
                        >
                          <LiveMenuPreview 
                            products={filteredProducts}
                            categories={getUniqueCategories()}
                            orientation="horizontal"
                            viewMode={viewMode}
                            showImages={showImages}
                            categoryFilter={undefined}
                          />
                        </div>
                        {/* Launch Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="text-black font-medium text-sm" style={{ fontFamily: 'Tiempo, serif' }}>Launch Menu</span>
                          </div>
                        </div>
                      </button>
                      <div className="mt-2 text-center">
                        <div className="text-xs text-gray-400" style={{ fontFamily: 'Tiempo, serif' }}>
                          {filteredProducts.length} products • {viewMode === 'auto' ? 'Auto' : viewMode === 'table' ? 'Table' : 'Card'} • {showImages ? 'Images' : 'No Images'}
                        </div>
                      </div>
                    </div>

                    {/* Vertical Preview */}
                    <div className="relative group">
                      <div className="absolute -top-8 left-0 text-sm text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                        Vertical (1080×1920)
                      </div>
                      <button
                        onClick={() => {
                          setOrientation('vertical');
                          setTimeout(() => openPopoutMenu(undefined), 100);
                        }}
                        className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300 hover:border-neutral-400/60 hover:bg-neutral-800/60 hover:scale-105 hover:shadow-2xl group-hover:shadow-neutral-700/20" 
                        style={{ width: '162px', height: '288px' }}
                      >
                        <div 
                          className="origin-top-left pointer-events-none"
                          style={{
                            transform: 'scale(0.15)',
                            width: '1080px',
                            height: '1920px',
                          }}
                        >
                          <LiveMenuPreview 
                            products={filteredProducts}
                            categories={getUniqueCategories()}
                            orientation="vertical"
                            viewMode={viewMode}
                            showImages={showImages}
                            categoryFilter={undefined}
                          />
                        </div>
                        {/* Launch Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="text-black font-medium text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Launch</span>
                          </div>
                        </div>
                      </button>
                      <div className="mt-2 text-center">
                        <div className="text-xs text-gray-400" style={{ fontFamily: 'Tiempo, serif' }}>
                          {filteredProducts.length} products • {viewMode === 'auto' ? 'Auto' : viewMode === 'table' ? 'Table' : 'Card'} • {showImages ? 'Images' : 'No Images'}
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
                  <div key={category.id} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                        {category.name} Menu
                      </h3>
                      <span className="text-sm text-gray-400" style={{ fontFamily: 'Tiempo, serif' }}>
                        {categoryProducts.length} products
                      </span>
                    </div>
                    <div className="flex gap-8 justify-center">
                      {/* Horizontal Preview */}
                      <div className="relative group">
                        <div className="absolute -top-8 left-0 text-sm text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                          Horizontal
                        </div>
                        <button
                          onClick={() => openPopoutMenu(category.slug)}
                          className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300 hover:border-neutral-400/60 hover:bg-neutral-800/60 hover:scale-105 hover:shadow-2xl group-hover:shadow-neutral-700/20" 
                          style={{ width: '360px', height: '202px' }}
                        >
                          <div 
                            className="origin-top-left pointer-events-none"
                            style={{
                              transform: 'scale(0.1875)',
                              width: '1920px',
                              height: '1080px',
                            }}
                          >
                            <LiveMenuPreview 
                              products={filteredProducts}
                              categories={getUniqueCategories()}
                              orientation="horizontal"
                              viewMode={viewMode}
                              showImages={showImages}
                              categoryFilter={category.slug}
                            />
                          </div>
                          {/* Launch Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="text-black font-medium text-sm" style={{ fontFamily: 'Tiempo, serif' }}>Launch {category.name}</span>
                            </div>
                          </div>
                        </button>
                        <div className="mt-2 text-center">
                          <div className="text-xs text-gray-600" style={{ fontFamily: 'Tiempo, serif' }}>
                            {categoryProducts.length} products • {viewMode === 'auto' ? 'Auto' : viewMode === 'table' ? 'Table' : 'Card'} • {showImages ? 'Images' : 'No Images'}
                          </div>
                        </div>
                      </div>

                      {/* Vertical Preview */}
                      <div className="relative group">
                        <div className="absolute -top-8 left-0 text-sm text-white font-medium" style={{ fontFamily: 'Tiempo, serif' }}>
                          Vertical
                        </div>
                        <button
                          onClick={() => {
                            setOrientation('vertical');
                            setTimeout(() => openPopoutMenu(category.slug), 100);
                          }}
                          className="relative bg-neutral-800/40 rounded-lg border border-neutral-500/30 overflow-hidden transition-all duration-300 hover:border-neutral-400/60 hover:bg-neutral-800/60 hover:scale-105 hover:shadow-2xl group-hover:shadow-neutral-700/20" 
                          style={{ width: '162px', height: '288px' }}
                        >
                          <div 
                            className="origin-top-left pointer-events-none"
                            style={{
                              transform: 'scale(0.15)',
                              width: '1080px',
                              height: '1920px',
                            }}
                          >
                            <LiveMenuPreview 
                              products={filteredProducts}
                              categories={getUniqueCategories()}
                              orientation="vertical"
                              viewMode={viewMode}
                              showImages={showImages}
                              categoryFilter={category.slug}
                            />
                          </div>
                          {/* Launch Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="text-black font-medium text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Launch</span>
                            </div>
                          </div>
                        </button>
                        <div className="mt-2 text-center">
                          <div className="text-xs text-gray-600" style={{ fontFamily: 'Tiempo, serif' }}>
                            {categoryProducts.length} products • {viewMode === 'auto' ? 'Auto' : viewMode === 'table' ? 'Table' : 'Card'} • {showImages ? 'Images' : 'No Images'}
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
            Interactive menu previews • Click any preview to launch TV menu • Updates automatically
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
              Select which categories to display on each side of the dual menu layout. You can enable vertical stacking to show multiple menus per side.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Menu Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-white font-semibold text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                    Left Side Menus
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Stack Vertically</span>
                    <button
                      onClick={() => setEnableLeftStacking(!enableLeftStacking)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableLeftStacking ? 'bg-green-600' : 'bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableLeftStacking ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                  Top Menu Category
                </label>
                <select
                  value={leftMenuCategory || ''}
                  onChange={(e) => setLeftMenuCategory(e.target.value || null)}
                  className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out mb-4"
                >
                  <option value="">Select Category</option>
                  {getUniqueCategories().map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {/* Left Menu Images Toggle */}
                <div>
                  <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                    Show Images (Top)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeftMenuImages(true)}
                      className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                        leftMenuImages 
                          ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                          : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                      }`}
                      title="Show Images"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setLeftMenuImages(false)}
                      className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                        !leftMenuImages 
                          ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                          : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                      }`}
                      title="Hide Images"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </button>
                    <span className="text-sm text-white ml-2" style={{ fontFamily: 'Tiempo, serif' }}>
                      {leftMenuImages ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Second Left Menu (if stacking enabled) */}
                {enableLeftStacking && (
                  <>
                    <label className="block text-white font-medium mb-2 mt-4" style={{ fontFamily: 'Tiempo, serif' }}>
                      Bottom Menu Category
                    </label>
                    <select
                      value={leftMenuCategory2 || ''}
                      onChange={(e) => setLeftMenuCategory2(e.target.value || null)}
                      className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out mb-4"
                    >
                      <option value="">Select Category</option>
                      {getUniqueCategories().map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    <div>
                      <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                        Show Images (Bottom)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLeftMenuImages2(true)}
                          className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                            leftMenuImages2 
                              ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                              : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                          }`}
                          title="Show Images"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setLeftMenuImages2(false)}
                          className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                            !leftMenuImages2 
                              ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                              : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                          }`}
                          title="Hide Images"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        </button>
                        <span className="text-sm text-white ml-2" style={{ fontFamily: 'Tiempo, serif' }}>
                          {leftMenuImages2 ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Right Menu Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-white font-semibold text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                    Right Side Menus
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white" style={{ fontFamily: 'Tiempo, serif' }}>Stack Vertically</span>
                    <button
                      onClick={() => setEnableRightStacking(!enableRightStacking)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableRightStacking ? 'bg-green-600' : 'bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableRightStacking ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                  Top Menu Category
                </label>
                <select
                  value={rightMenuCategory || ''}
                  onChange={(e) => setRightMenuCategory(e.target.value || null)}
                  className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out mb-4"
                >
                  <option value="">Select Category</option>
                  {getUniqueCategories().map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {/* Right Menu Images Toggle */}
                <div>
                  <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                    Show Images (Top)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightMenuImages(true)}
                      className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                        rightMenuImages 
                          ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                          : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                      }`}
                      title="Show Images"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setRightMenuImages(false)}
                      className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                        !rightMenuImages 
                          ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                          : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                      }`}
                      title="Hide Images"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </button>
                    <span className="text-sm text-white ml-2" style={{ fontFamily: 'Tiempo, serif' }}>
                      {rightMenuImages ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Second Right Menu (if stacking enabled) */}
                {enableRightStacking && (
                  <>
                    <label className="block text-white font-medium mb-2 mt-4" style={{ fontFamily: 'Tiempo, serif' }}>
                      Bottom Menu Category
                    </label>
                    <select
                      value={rightMenuCategory2 || ''}
                      onChange={(e) => setRightMenuCategory2(e.target.value || null)}
                      className="w-full px-4 py-3 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-white text-base focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out mb-4"
                    >
                      <option value="">Select Category</option>
                      {getUniqueCategories().map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    <div>
                      <label className="block text-white font-medium mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                        Show Images (Bottom)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRightMenuImages2(true)}
                          className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                            rightMenuImages2 
                              ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                              : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                          }`}
                          title="Show Images"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setRightMenuImages2(false)}
                          className={`p-2 rounded-lg transition-all duration-200 ease-out ${
                            !rightMenuImages2 
                              ? 'text-white bg-neutral-800/90 border border-neutral-500' 
                              : 'text-white hover:text-white bg-transparent border border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                          }`}
                          title="Hide Images"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        </button>
                        <span className="text-sm text-white ml-2" style={{ fontFamily: 'Tiempo, serif' }}>
                          {rightMenuImages2 ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
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
                    <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                      Images: {leftMenuImages ? 'On' : 'Off'}
                    </div>
                    {enableLeftStacking && leftMenuCategory2 && (
                      <>
                        <div className="text-white text-sm mt-2 pt-2 border-t border-neutral-600/30" style={{ fontFamily: 'Tiempo, serif' }}>
                          {getUniqueCategories().find(c => c.slug === leftMenuCategory2)?.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                          Images: {leftMenuImages2 ? 'On' : 'Off'}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-neutral-700 p-3 rounded">
                    <div className="text-blue-400 font-medium" style={{ fontFamily: 'Tiempo, serif' }}>Right Side</div>
                    <div className="text-white text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {getUniqueCategories().find(c => c.slug === rightMenuCategory)?.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                      Images: {rightMenuImages ? 'On' : 'Off'}
                    </div>
                    {enableRightStacking && rightMenuCategory2 && (
                      <>
                        <div className="text-white text-sm mt-2 pt-2 border-t border-neutral-600/30" style={{ fontFamily: 'Tiempo, serif' }}>
                          {getUniqueCategories().find(c => c.slug === rightMenuCategory2)?.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Tiempo, serif' }}>
                          Images: {rightMenuImages2 ? 'On' : 'Off'}
                        </div>
                      </>
                    )}
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
