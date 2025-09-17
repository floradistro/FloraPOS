'use client';

import React, { useState, useEffect } from 'react';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { Product, Category } from '../../types';

export default function MenuDisplayPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isDualMenu, setIsDualMenu] = useState(false);
  const [leftMenuCategory, setLeftMenuCategory] = useState<string | null>(null);
  const [rightMenuCategory, setRightMenuCategory] = useState<string | null>(null);

  useEffect(() => {
    // Get orientation and category from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrientation = urlParams.get('orientation');
    const urlCategory = urlParams.get('category');
    const urlDualMenu = urlParams.get('dual');
    const urlLeftCategory = urlParams.get('leftCategory');
    const urlRightCategory = urlParams.get('rightCategory');
    
    if (urlOrientation === 'vertical' || urlOrientation === 'horizontal') {
      setOrientation(urlOrientation);
    }
    
    if (urlCategory) {
      setCategoryFilter(urlCategory);
    }
    
    if (urlDualMenu === 'true') {
      setIsDualMenu(true);
      setLeftMenuCategory(urlLeftCategory);
      setRightMenuCategory(urlRightCategory);
    }

    // Listen for data from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'MENU_DATA') {
        setProducts(event.data.products || []);
        setCategories(event.data.categories || []);
        if (event.data.orientation) {
          setOrientation(event.data.orientation);
        }
        if (event.data.categoryFilter) {
          setCategoryFilter(event.data.categoryFilter);
        }
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Fallback: fetch data if not received from parent
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        fetchMenuData();
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(fallbackTimeout);
    };
  }, [loading]);

  const fetchMenuData = async () => {
    try {
      const response = await fetch(`/api/proxy/flora-im/products?per_page=100&_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const availableProducts = result.data.filter((product: Product) => {
            const hasStock = product.inventory?.some(inv => inv.stock > 0);
            return hasStock;
          });
          
          // Load blueprint pricing for all products
          try {
            console.log(`🔍 [Menu Display] Batch fetching blueprint pricing for ${availableProducts.length} products`);
            const productsWithCategories = availableProducts.map((product: Product) => ({
              id: product.id,
              categoryIds: product.categories?.map(cat => cat.id) || []
            }));

            const batchPricingResponse = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories);
            
            // Apply batch pricing results to products
            availableProducts.forEach((product: Product) => {
              const pricingData = batchPricingResponse[product.id];
              if (pricingData) {
                product.blueprintPricing = pricingData;
              }
            });
            
            console.log(`✅ [Menu Display] Applied blueprint pricing to ${Object.keys(batchPricingResponse).length}/${availableProducts.length} products`);
          } catch (pricingError) {
            console.warn(`⚠️ [Menu Display] Failed to get batch blueprint pricing:`, pricingError instanceof Error ? pricingError.message : 'Unknown error');
            // Continue without pricing
          }
          
          setProducts(availableProducts);
          
          // Extract unique categories
          const categoryMap = new Map();
          availableProducts.forEach((product: Product) => {
            product.categories?.forEach(cat => {
              if (!categoryMap.has(cat.id)) {
                categoryMap.set(cat.id, cat);
              }
            });
          });
          setCategories(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
    } finally {
      setLoading(false);
    }
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

  // Render tiered pricing for header - compact horizontal layout
  const renderHeaderPricing = (allProducts: Product[], orientation: 'horizontal' | 'vertical') => {
    // Debug logging
    console.log(`🔍 [Menu Display] Rendering header pricing for ${allProducts.length} products`);
    
    // Get all unique pricing tiers from all products
    const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
    
    allProducts.forEach(product => {
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

    console.log(`🔍 [Menu Display] Found ${pricingTiers.size} header pricing tiers`);
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
      <div className={`flex justify-center items-center ${
        orientation === 'vertical' ? 'flex-col gap-4' : 'flex-wrap gap-6'
      }`}>
        {Array.from(tiersByRule.entries()).map(([ruleName, tiers]) => (
          <div key={ruleName} className={`flex items-center gap-3 ${
            orientation === 'vertical' ? 'flex-col text-center' : ''
          }`}>
            <div className={`text-white font-medium uppercase tracking-wider ${
              orientation === 'vertical' ? 'text-base mb-2' : 'text-sm'
            }`} style={{ fontFamily: 'Tiempo, serif' }}>
              {ruleName}
            </div>
            <div className={`flex gap-3 ${
              orientation === 'vertical' ? 'flex-wrap justify-center' : ''
            }`}>
              {tiers.map((tier, index) => (
                <div
                  key={`${ruleName}-${index}`}
                  className={`relative rounded-lg px-4 py-3 transition-all duration-300 ease-out cursor-pointer border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02]  hover:scale-105 ${
                    orientation === 'vertical' ? 'text-sm' : 'text-xs'
                  }`}
                >
                  
                  <div className="text-white font-medium text-center relative z-10" style={{ fontFamily: 'Tiempo, serif' }}>
                    {tier.label}
                  </div>
                  <div className="text-white font-bold text-center mt-1 relative z-10 " style={{ fontFamily: 'Tiempo, serif' }}>
                    ${tier.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Update selected category name when categoryFilter changes
  useEffect(() => {
    if (categoryFilter && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.slug === categoryFilter);
      setSelectedCategoryName(selectedCategory?.name || '');
    } else {
      setSelectedCategoryName('');
    }
  }, [categoryFilter, categories]);

  // Render a single menu section (for dual menu support)
  const renderMenuSection = (categorySlug: string | null, sectionTitle?: string) => {
    const sectionProducts = categorySlug 
      ? displayProducts.filter(product => 
          product.categories?.some(cat => cat.slug === categorySlug)
        )
      : displayProducts;

    const sectionCategories = categorySlug
      ? categories.filter(cat => cat.slug === categorySlug)
      : categories;

    const productsByCategory = sectionCategories.map(category => ({
      category,
      products: sectionProducts.filter(product => 
        product.categories?.some(cat => cat.id === category.id)
      )
    })).filter(group => group.products.length > 0);

    return (
      <div className="flex-1 h-full overflow-y-auto">
        {sectionTitle && (
          <div className="bg-transparent px-6 py-4 border-b border-white/[0.06] relative">
            <h2 className="font-bold text-white uppercase tracking-wider  relative z-10 text-xl text-center" style={{ fontFamily: 'Tiempo, serif' }}>
              {sectionTitle}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-neutral-400/60 to-transparent mt-2 mx-auto"></div>
          </div>
        )}
        
        {productsByCategory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl text-white mb-3">
                {sectionTitle 
                  ? `No ${sectionTitle.toLowerCase()} products currently available`
                  : 'No products currently available'
                }
              </p>
              <p className="text-lg text-white">Check back soon for updates</p>
            </div>
          </div>
        ) : (
          <div className="h-full space-y-6 p-4">
            {productsByCategory.map(({ category, products: categoryProducts }) => (
              <div key={category.id} className={isFlowerCategory(category.name) ? '-mt-4' : ''}>
                {/* Category Header - Only show if not in dual mode or if multiple categories */}
                {(!isDualMenu || productsByCategory.length > 1) && (
                  <div className="bg-transparent px-6 py-4 border-b border-white/[0.06] relative mb-4">
                    <h3 className="font-bold text-white uppercase tracking-wider  relative z-10 text-lg" style={{ fontFamily: 'Tiempo, serif' }}>
                      {category.name}
                    </h3>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-neutral-400/60 to-transparent mt-2"></div>
                  </div>
                )}
                
                {/* Products Display */}
                {isFlowerCategory(category.name) ? (
                    /* Table Layout for Flower Products - Edge to Edge */
                    <div className="bg-transparent overflow-hidden relative -mx-4">
                    
                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full border-collapse">
                        <thead className="bg-neutral-900/40 border-b border-white/[0.06] sticky top-0 z-20 backdrop-blur-sm">
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left text-white font-medium px-3 py-2 text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                              Product Name
                            </th>
                            <th className="text-center text-white font-medium px-3 py-2 text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                              Type
                            </th>
                            <th className="text-center text-white font-medium px-3 py-2 text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                              THCA %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryProducts.map((product, index) => {
                            const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.stock, 0) || 0;
                            const strainType = getStrainType(product);
                            const thcaPercent = getTHCAPercentage(product);

                            return (
                              <tr 
                                key={product.id}
                                className={`border-b border-white/[0.06] hover:bg-white/[0.02] transition-all duration-300 ease-out cursor-pointer ${
                                  index % 2 === 0 
                                    ? 'bg-transparent' 
                                    : 'bg-white/[0.01]'
                                }`}
                              >
                                <td className="px-3 py-2 text-white font-medium leading-tight text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                                  {product.name}
                                </td>
                                <td className="px-3 py-2 text-center text-white text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                                  {strainType}
                                </td>
                                <td className="px-3 py-2 text-center text-white font-medium text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
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
                  /* Grid Layout for Non-Flower Products */
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {categoryProducts.map(product => {
                      const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.stock, 0) || 0;
                      const strainType = getStrainType(product);
                      const thcaPercent = getTHCAPercentage(product);

                      return (
                        <div 
                          key={product.id} 
                          className="relative rounded-lg overflow-hidden p-4 transition-all duration-300 ease-out cursor-pointer border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02] "
                        >
                          
                          
                          {/* Product Image - Only for specific categories */}
                          {shouldShowImages(category.name) && (
                            <div className="flex justify-center mb-3 relative z-10">
                              <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-full object-contain  rounded-lg"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center  rounded-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Product Name - Center */}
                          <h4 className="font-semibold text-white leading-tight mb-4 relative z-10 text-xl text-center" style={{ fontFamily: 'Tiempo, serif' }}>
                            {product.name}
                          </h4>
                          
                          {/* Product Details - Bottom Centered */}
                          <div className="space-y-3 relative z-10 text-sm">
                            {product.sku && (
                              <div className="text-center pt-2 border-t border-neutral-600">
                                <div className="text-white mb-1" style={{ fontFamily: 'Tiempo, serif' }}>SKU</div>
                                <div className="text-white font-mono text-xs">{product.sku}</div>
                              </div>
                            )}
                          </div>
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
    );
  };

  // Filter products and categories based on category filter
  const displayProducts = categoryFilter 
    ? products.filter(product => 
        product.categories?.some(cat => cat.slug === categoryFilter)
      )
    : products;

  const displayCategories = categoryFilter
    ? categories.filter(cat => cat.slug === categoryFilter)
    : categories;

  const productsByCategory = displayCategories.map(category => ({
    category,
    products: displayProducts.filter(product => 
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
    return (
      <div className="min-h-screen bg-neutral-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-medium">Loading Menu...</p>
          <p className="text-sm text-white mt-2">Preparing display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-700 text-white overflow-hidden flex flex-col relative">
      {/* Subtle 3D Wave Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-neutral-700"></div>
        <svg 
          className="absolute inset-0 w-full h-full object-cover"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          style={{ filter: 'contrast(1.5) brightness(0.8)' }}
        >
          <defs>
            <pattern id="wave" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0,10 Q5,0 10,10 T20,10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave)"/>
        </svg>
      </div>
      
      {/* Header - Hide in dual menu mode */}
      {!isDualMenu && (
        <div className={`bg-transparent border-b border-white/[0.06] px-6 flex-shrink-0 relative z-10 ${
          orientation === 'vertical' ? 'py-6' : 'py-5'
        }`}>
        
        <div className={`flex flex-col items-center gap-4 relative z-10 ${
          orientation === 'vertical' ? 'gap-6' : 'gap-5'
        }`}>
          {/* Title - Centered */}
          <div className="text-center">
            <h1 className={`font-bold bg-gradient-to-r from-white via-neutral-100 to-white bg-clip-text text-transparent  ${
              orientation === 'vertical' ? 'text-4xl' : 'text-3xl'
            }`} style={{ fontFamily: 'Tiempo, serif' }}>
              {selectedCategoryName ? `${selectedCategoryName} Menu` : 'Flora Menu'}
            </h1>
            {/* Title underline effect */}
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-3 opacity-60"></div>
          </div>
          
          {/* Tiered Pricing in Header - Centered */}
          <div className="w-full flex justify-center">
            {renderHeaderPricing(displayProducts, orientation)}
          </div>
        </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isDualMenu && orientation === 'horizontal' ? (
          /* Dual Menu Layout - Side by Side */
          <div className="flex h-full">
            {/* Left Menu with Header */}
            <div className="w-1/2 flex flex-col">
              {/* Left Header */}
              <div className="bg-transparent px-6 py-4 border-b border-white/[0.06] relative">
                <h1 className="font-bold bg-gradient-to-r from-white via-neutral-100 to-white bg-clip-text text-transparent  text-2xl text-center relative z-10" style={{ fontFamily: 'Tiempo, serif' }}>
                  {leftMenuCategory ? categories.find(c => c.slug === leftMenuCategory)?.name || 'Left Menu' : 'Left Menu'}
                </h1>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-3 opacity-60"></div>
                
                {/* Left Menu Pricing */}
                <div className="w-full flex justify-center mt-4">
                  {renderHeaderPricing(leftMenuCategory ? displayProducts.filter(product => 
                    product.categories?.some(cat => cat.slug === leftMenuCategory)
                  ) : [], orientation)}
                </div>
              </div>
              
              {/* Left Content */}
              <div className="flex-1">
                {renderMenuSection(leftMenuCategory)}
              </div>
            </div>
            
            {/* Right Menu with Header */}
            <div className="w-1/2 flex flex-col border-l border-white/[0.06]">
              {/* Right Header */}
              <div className="bg-transparent px-6 py-4 border-b border-white/[0.06] relative">
                <h1 className="font-bold bg-gradient-to-r from-white via-neutral-100 to-white bg-clip-text text-transparent  text-2xl text-center relative z-10" style={{ fontFamily: 'Tiempo, serif' }}>
                  {rightMenuCategory ? categories.find(c => c.slug === rightMenuCategory)?.name || 'Right Menu' : 'Right Menu'}
                </h1>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mt-3 opacity-60"></div>
                
                {/* Right Menu Pricing */}
                <div className="w-full flex justify-center mt-4">
                  {renderHeaderPricing(rightMenuCategory ? displayProducts.filter(product => 
                    product.categories?.some(cat => cat.slug === rightMenuCategory)
                  ) : [], orientation)}
                </div>
              </div>
              
              {/* Right Content */}
              <div className="flex-1">
                {renderMenuSection(rightMenuCategory)}
              </div>
            </div>
          </div>
        ) : (
          /* Single Menu Layout */
          <div className="h-full overflow-y-auto">
            {productsByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-2xl text-white mb-3">
                    {selectedCategoryName 
                      ? `No ${selectedCategoryName.toLowerCase()} products currently available`
                      : 'No products currently available'
                    }
                  </p>
                  <p className="text-lg text-white">Check back soon for updates</p>
                </div>
              </div>
            ) : (
              <div className={`h-full ${orientation === 'vertical' ? 'space-y-6' : 'space-y-8'}`}>
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category.id} className={isFlowerCategory(category.name) ? '-mt-8' : ''}>
                    {/* Category Header - Only show if not filtered to single category */}
                    {!selectedCategoryName && (
                      <div className="bg-transparent px-6 py-4 border-b border-white/[0.06] relative">
                        {/* Header inner glow */}
                        
                        <h2 className={`font-bold text-white uppercase tracking-wider  relative z-10 ${
                          orientation === 'vertical' ? 'text-lg' : 'text-xl'
                        }`} style={{ fontFamily: 'Tiempo, serif' }}>
                          {category.name}
                        </h2>
                        
                        {/* Elegant underline */}
                        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-neutral-400/60 to-transparent mt-2"></div>
                      </div>
                    )}
                    
                    {/* Conditional Layout: Table for Flower, Grid for Others */}
                    {isFlowerCategory(category.name) ? (
                        /* Table Layout for Flower Products - Edge to Edge */
                        <div className="bg-transparent flex-1 overflow-hidden relative -mx-4">
                        
                        <div className="overflow-x-auto h-full relative z-10">
                          <table className="w-full h-full border-collapse">
                            <thead className="bg-neutral-900/40 border-b border-white/[0.06] sticky top-0 z-20 backdrop-blur-sm">
                              <tr className="border-b border-white/[0.06]">
                                <th className={`text-left text-white font-medium px-2 py-1 ${
                                  orientation === 'vertical' ? 'text-sm' : 'text-xs'
                                }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                  Product Name
                                </th>
                                <th className={`text-center text-white font-medium px-2 py-1 ${
                                  orientation === 'vertical' ? 'text-sm' : 'text-xs'
                                }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                  Type
                                </th>
                                <th className={`text-center text-white font-medium px-2 py-1 ${
                                  orientation === 'vertical' ? 'text-sm' : 'text-xs'
                                }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                  THCA %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryProducts.map((product, index) => {
                                const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.stock, 0) || 0;
                                const price = product.sale_price || product.regular_price;
                                const strainType = getStrainType(product);
                                const thcaPercent = getTHCAPercentage(product);

                                return (
                                  <tr 
                                    key={product.id}
                              className={`border-b border-white/[0.06] hover:bg-white/[0.02] transition-all duration-300 ease-out cursor-pointer ${
                                index % 2 === 0 
                                  ? 'bg-transparent' 
                                  : 'bg-white/[0.01]'
                              }`}
                                  >
                                    <td className={`px-2 py-1 text-white font-medium leading-tight ${
                                      orientation === 'vertical' ? 'text-sm' : 'text-xs'
                                    }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                      {product.name}
                                    </td>
                                    <td className={`px-2 py-1 text-center text-white ${
                                      orientation === 'vertical' ? 'text-xs' : 'text-xs'
                                    }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                      {strainType}
                                    </td>
                                    <td className={`px-2 py-1 text-center text-white font-medium ${
                                      orientation === 'vertical' ? 'text-xs' : 'text-xs'
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
                      /* Grid Layout for Non-Flower Products */
                      <div className={`grid gap-4 px-6 py-4 ${
                        orientation === 'vertical' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      }`}>
                        {categoryProducts.map(product => {
                          const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.stock, 0) || 0;
                          const price = product.sale_price || product.regular_price;
                          const strainType = getStrainType(product);
                          const thcaPercent = getTHCAPercentage(product);

                          return (
                            <div 
                              key={product.id} 
                              className={`relative rounded-lg overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
                                orientation === 'vertical' ? 'p-6' : 'p-5'
                              } border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02] `}
                            >
                              
                              
                              {/* Product Image - Only for specific categories */}
                              {shouldShowImages(category.name) && (
                                <div className="flex justify-center mb-3 relative z-10">
                                  <div className={`relative overflow-hidden rounded-lg ${
                                    orientation === 'vertical' ? 'w-20 h-20' : 'w-16 h-16'
                                  }`}>
                                    {product.image ? (
                                      <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="w-full h-full object-contain  rounded-lg"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center  rounded-lg">
                                        <svg className={`text-white ${
                                          orientation === 'vertical' ? 'w-8 h-8' : 'w-6 h-6'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Product Name - Center */}
                              <h3 className={`font-semibold text-white leading-tight mb-4 relative z-10 text-center ${
                                orientation === 'vertical' ? 'text-xl' : 'text-lg'
                              }`} style={{ fontFamily: 'Tiempo, serif' }}>
                                {product.name}
                              </h3>
                              
                              {/* Product Details - Bottom Centered */}
                              <div className={`space-y-3 relative z-10 ${
                                orientation === 'vertical' ? 'text-sm' : 'text-xs'
                              }`}>
                                {product.sku && (
                                  <div className="text-center pt-2 border-t border-neutral-600">
                                    <div className="text-white mb-1" style={{ fontFamily: 'Tiempo, serif' }}>SKU</div>
                                    <div className="text-white font-mono text-xs">{product.sku}</div>
                                  </div>
                                )}
                              </div>
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
        )}
      </div>

    </div>
  );
}
