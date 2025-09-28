'use client';

import React from 'react';
import { Product, Category } from '../../types';
import { ProductBlueprintFields } from '../../services/blueprint-fields-service';

interface SharedMenuDisplayProps {
  products: Product[];
  categories: Category[];
  orientation: 'horizontal' | 'vertical';
  viewMode: 'table' | 'card' | 'auto';
  showImages: boolean;
  leftMenuImages: boolean;
  rightMenuImages: boolean;
  categoryFilter?: string | null;
  selectedCategoryName?: string;
  isDualMenu: boolean;
  leftMenuCategory: string | null;
  rightMenuCategory: string | null;
  leftMenuCategory2: string | null;
  rightMenuCategory2: string | null;
  leftMenuImages2: boolean;
  rightMenuImages2: boolean;
  leftMenuViewMode?: 'table' | 'card' | 'auto';
  rightMenuViewMode?: 'table' | 'card' | 'auto';
  leftMenuViewMode2?: 'table' | 'card' | 'auto';
  rightMenuViewMode2?: 'table' | 'card' | 'auto';
  enableLeftStacking: boolean;
  enableRightStacking: boolean;
  backgroundColor: string;
  fontColor: string;
  containerColor: string;
  pandaMode: boolean;
  categoryColumnConfigs?: Map<string, string[]>;
  categoryBlueprintFields?: Map<string, ProductBlueprintFields[]>;
  selectedSide?: string;
  onSideClick?: (side: string) => void;
  selectedMenuSection?: string | null;
  onSectionClick?: (section: string) => void;
}

export function SharedMenuDisplay({
  products,
  categories,
  orientation,
  viewMode,
  showImages,
  leftMenuImages,
  rightMenuImages,
  categoryFilter,
  selectedCategoryName,
  isDualMenu,
  leftMenuCategory,
  rightMenuCategory,
  leftMenuCategory2,
  rightMenuCategory2,
  leftMenuImages2,
  rightMenuImages2,
  leftMenuViewMode = 'auto',
  rightMenuViewMode = 'auto',
  leftMenuViewMode2 = 'auto',
  rightMenuViewMode2 = 'auto',
  enableLeftStacking,
  enableRightStacking,
  backgroundColor,
  fontColor,
  containerColor,
  pandaMode,
  categoryColumnConfigs = new Map(),
  categoryBlueprintFields = new Map(),
  selectedSide = '',
  onSideClick,
  selectedMenuSection = null,
  onSectionClick
}: SharedMenuDisplayProps) {
  console.log('🚨 SharedMenuDisplay RENDERING with:', {
    leftMenuViewMode,
    leftMenuViewMode2,
    rightMenuViewMode,
    rightMenuViewMode2,
    isDualMenu,
    enableLeftStacking,
    enableRightStacking
  });

  // Get columns for a specific category or default
  const getCategoryColumns = (categorySlug?: string): string[] => {
    if (!categorySlug) return ['name'];
    
    const configuredColumns = categoryColumnConfigs.get(categorySlug);
    if (configuredColumns && configuredColumns.length > 0) {
      return configuredColumns;
    }
    
    return ['name'];
  };

  const getMetaValue = (product: Product, key: string): string => {
    const meta = product.meta_data?.find(m => m.key === key);
    return meta?.value || '';
  };

  // Get blueprint field value for a product
  const getBlueprintFieldValue = (product: Product, fieldName: string, categorySlug?: string): string => {
    if (!categorySlug) return '';
    
    const categoryFields = categoryBlueprintFields.get(categorySlug);
    if (!categoryFields) return '';
    
    const productFields = categoryFields.find(pf => pf.product_id === product.id);
    if (!productFields) return '';
    
    const field = productFields.fields.find(f => f.field_name === fieldName);
    return field?.field_value?.toString() || '';
  };

  // Get display value for any column
  const getColumnValue = (product: Product, columnName: string, categorySlug?: string): string => {
    if (columnName === 'name') {
      return product.name;
    }
    
    const blueprintValue = getBlueprintFieldValue(product, columnName, categorySlug);
    if (blueprintValue) return blueprintValue;
    
    const metaValue = getMetaValue(product, columnName) || getMetaValue(product, `_${columnName}`);
    if (metaValue) return metaValue;
    
    switch (columnName) {
      case 'sku':
        return product.sku || '';
      default:
        return '';
    }
  };

  // Determine which image setting to use for dual menus
  const getImageSetting = (isLeftSide: boolean = false, categorySlug: string | null = null) => {
    if (isDualMenu) {
      if (isLeftSide) {
        if (enableLeftStacking && categorySlug === leftMenuCategory2) {
          return leftMenuImages2;
        }
        return leftMenuImages;
      } else {
        if (enableRightStacking && categorySlug === rightMenuCategory2) {
          return rightMenuImages2;
        }
        return rightMenuImages;
      }
    }
    return showImages;
  };

  // Determine which view mode to use for dual menus
  const getViewModeSetting = (isLeftSide: boolean = false, categorySlug: string | null = null, quadrant?: 'L' | 'L2' | 'R' | 'R2') => {
    if (isDualMenu) {
      // If quadrant is specified, use it directly
      if (quadrant) {
        switch (quadrant) {
          case 'L':
            console.log(`🔧 getViewModeSetting: Quadrant L -> ${leftMenuViewMode}`);
            return leftMenuViewMode;
          case 'L2':
            console.log(`🔧 getViewModeSetting: Quadrant L2 -> ${leftMenuViewMode2}`);
            return leftMenuViewMode2;
          case 'R':
            console.log(`🔧 getViewModeSetting: Quadrant R -> ${rightMenuViewMode}`);
            return rightMenuViewMode;
          case 'R2':
            console.log(`🔧 getViewModeSetting: Quadrant R2 -> ${rightMenuViewMode2}`);
            return rightMenuViewMode2;
        }
      }
      
      // Fallback to category-based logic if no quadrant specified
      if (isLeftSide) {
        // Check if this is the stacked (L2) category
        if (enableLeftStacking && categorySlug === leftMenuCategory2) {
          console.log(`🔧 getViewModeSetting: LEFT stacked category '${categorySlug}' -> ${leftMenuViewMode2}`);
          return leftMenuViewMode2;
        }
        // Otherwise it's the main left (L) category
        console.log(`🔧 getViewModeSetting: LEFT main category '${categorySlug}' -> ${leftMenuViewMode}`);
        return leftMenuViewMode;
      } else {
        // Check if this is the stacked (R2) category
        if (enableRightStacking && categorySlug === rightMenuCategory2) {
          console.log(`🔧 getViewModeSetting: RIGHT stacked category '${categorySlug}' -> ${rightMenuViewMode2}`);
          return rightMenuViewMode2;
        }
        // Otherwise it's the main right (R) category
        console.log(`🔧 getViewModeSetting: RIGHT main category '${categorySlug}' -> ${rightMenuViewMode}`);
        return rightMenuViewMode;
      }
    }
    return viewMode;
  };

  // Check if we're displaying flower products (for table view)
  const isFlowerCategory = (categoryName: string) => {
    const flowerKeywords = ['flower', 'bud', 'strain'];
    return flowerKeywords.some(keyword => 
      categoryName.toLowerCase().includes(keyword)
    );
  };

  // Determine actual view mode to use
  const getActualViewMode = (categoryName: string, isLeftSide: boolean = false, categorySlug: string | null = null, quadrant?: 'L' | 'L2' | 'R' | 'R2') => {
    const currentViewMode = getViewModeSetting(isLeftSide, categorySlug, quadrant);
    const result = currentViewMode === 'auto' 
      ? (isFlowerCategory(categoryName) ? 'table' : 'card')
      : currentViewMode;
    
    console.log(`🎯 getActualViewMode for '${categoryName}' (${isLeftSide ? 'LEFT' : 'RIGHT'}, slug: ${categorySlug}, quadrant: ${quadrant}):`, {
      selectedMenuSection,
      currentViewMode,
      result,
      isLeftSide,
      categorySlug,
      quadrant,
      leftMenuCategory,
      leftMenuCategory2,
      rightMenuCategory,
      rightMenuCategory2
    });
    
    return result;
  };

  // Check if category should display product images
  const shouldShowImages = (categoryName: string) => {
    const imageCategories = ['edible', 'concentrate', 'vape', 'cartridge', 'extract', 'dab', 'wax', 'shatter', 'rosin', 'live resin'];
    return imageCategories.some(keyword => 
      categoryName.toLowerCase().includes(keyword)
    );
  };

  // Auto-balance table products between columns (2 columns if > 13 products)
  const balanceTableProducts = (products: Product[]) => {
    const totalProducts = products.length;
    
    if (totalProducts <= 13) {
      return {
        leftColumn: products,
        rightColumn: []
      };
    }
    
    const leftColumnCount = Math.ceil(totalProducts / 2);
    return {
      leftColumn: products.slice(0, leftColumnCount),
      rightColumn: products.slice(leftColumnCount)
    };
  };

  // Get consistent styles
  const getBackgroundStyle = () => ({
    backgroundColor: pandaMode ? '#000000' : backgroundColor
  });

  const getContainerStyle = () => ({
    backgroundColor: pandaMode ? '#000000' : containerColor,
    border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
    color: fontColor
  });

  const getHeaderStyle = () => ({
    background: pandaMode 
      ? 'linear-gradient(to right, #000000, #000000, #000000)'
      : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
    borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
    color: fontColor
  });

  // Render tiered pricing for header
  const renderHeaderPricing = (allProducts: Product[], orientation: 'horizontal' | 'vertical') => {
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

    if (pricingTiers.size === 0) return null;

    const tiersByRule = new Map<string, Array<{ label: string; price: number }>>();
    pricingTiers.forEach(tier => {
      if (!tiersByRule.has(tier.ruleName)) {
        tiersByRule.set(tier.ruleName, []);
      }
      tiersByRule.get(tier.ruleName)!.push({ label: tier.label, price: tier.price });
    });

    tiersByRule.forEach(tiers => {
      tiers.sort((a, b) => a.price - b.price);
    });

    return (
      <div className={`flex justify-center items-center ${
        orientation === 'vertical' ? 'flex-col gap-1' : 'flex-wrap gap-2'
      }`}>
        {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
          <div key={ruleName} className={`flex items-center gap-1 ${
            orientation === 'vertical' ? 'flex-col text-center' : ''
          }`}>
            <div className={`font-medium uppercase tracking-wider ${
              orientation === 'vertical' ? 'text-base mb-2' : 'text-sm'
            }`} style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
              {ruleName}
            </div>
            <div className={`flex gap-1 ${
              orientation === 'vertical' ? 'flex-wrap justify-center' : ''
            }`}>
              {tiers.map((tier, index) => (
                <div
                  key={`${ruleName}-${index}`}
                  className={`relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group ${
                    orientation === 'vertical' ? 'text-sm' : 'text-xs'
                  }`}
                  style={{
                    ...getContainerStyle(),
                    boxShadow: pandaMode 
                      ? '0 8px 25px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : '0 8px 25px rgba(0,0,0,0.1), inset 0 1px 0 rgba(156,163,175,0.2)'
                  }}
                >
                  <div className="font-semibold text-center relative z-10 tracking-wide transition-colors duration-300" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}dd` }}>
                    {tier.label}
                  </div>
                  <div className="font-bold text-center mt-1 relative z-10 transition-colors duration-300" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                    ${tier.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            {ruleIndex < Array.from(tiersByRule.entries()).length - 1 && (
              <div className={`${
                orientation === 'vertical' 
                  ? 'w-16 h-px bg-gray-300 my-2' 
                  : 'w-px h-6 bg-gray-300 mx-2'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render a single menu section
  const renderMenuSection = (categorySlug: string | null, sectionTitle?: string, isLeftSide: boolean = false, quadrant?: 'L' | 'L2' | 'R' | 'R2') => {
    console.log(`🎨 renderMenuSection called:`, {
      categorySlug,
      isLeftSide,
      quadrant,
      leftMenuCategory,
      leftMenuCategory2,
      rightMenuCategory,
      rightMenuCategory2,
      leftMenuViewMode,
      leftMenuViewMode2,
      rightMenuViewMode,
      rightMenuViewMode2,
      enableLeftStacking,
      enableRightStacking
    });
    const displayProducts = categorySlug 
      ? products.filter(product => 
          product.categories?.some(cat => cat.slug === categorySlug)
        )
      : products;

    const displayCategories = categorySlug
      ? categories.filter(cat => cat.slug === categorySlug)
      : categories;

    const productsByCategory = displayCategories.map(category => ({
      category,
      products: displayProducts.filter(product => 
        product.categories?.some(cat => cat.id === category.id)
      )
    })).filter(group => group.products.length > 0);

    const currentShowImages = getImageSetting(isLeftSide, categorySlug);

    return (
      <div className="flex-1 h-full overflow-y-auto pb-8" style={getBackgroundStyle()}>
        {sectionTitle && (
          <div className="backdrop-blur-md px-8 py-4 border-b relative shadow-sm" style={getHeaderStyle()}>
            <h2 className="uppercase tracking-widest relative z-10 text-xl text-center" 
                style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, letterSpacing: '0.15em', color: fontColor }}>
              {sectionTitle}
            </h2>
            <div className="w-28 h-px mt-3 mx-auto" 
                 style={{ background: `linear-gradient(to right, transparent, ${fontColor}70, transparent)` }}>
            </div>
          </div>
        )}
        
        {productsByCategory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl mb-3" style={{ color: fontColor, fontFamily: 'Tiempo, serif' }}>
                {sectionTitle 
                  ? `No ${sectionTitle.toLowerCase()} products currently available`
                  : 'No products currently available'
                }
              </p>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Tiempo, serif' }}>Check back soon for updates</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-4 pb-8 pt-4" style={getBackgroundStyle()}>
            {productsByCategory.map(({ category, products: categoryProducts }) => (
              <div key={category.id}>
                {(!isDualMenu || productsByCategory.length > 1) && (
                  <div className="backdrop-blur-md px-8 py-4 border-b relative mb-4 rounded-t-xl shadow-sm" 
                       style={getHeaderStyle()}>
                    <h3 className="uppercase tracking-widest relative z-10 text-lg" 
                        style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, letterSpacing: '0.15em', color: fontColor }}>
                      {category.name}
                    </h3>
                    <div className="w-28 h-px mt-3" 
                         style={{ background: `linear-gradient(to right, transparent, ${fontColor}70, transparent)` }}>
                    </div>
                  </div>
                )}
                
                {/* Products Display */}
                {getActualViewMode(category.name, isLeftSide, categorySlug, quadrant) === 'table' ? (
                  /* Table Layout - Single column if ≤ 13 products, 2-column if 14+ */
                  (() => {
                    const { leftColumn, rightColumn } = balanceTableProducts(categoryProducts);
                    const useSingleColumn = rightColumn.length === 0;
                    return (
                      <div className={`grid gap-6 pt-4 pb-4 ${useSingleColumn ? 'grid-cols-1 justify-center' : 'grid-cols-2'}`} 
                           style={getBackgroundStyle()}>
                        {/* Left Column */}
                        <div className="space-y-2">
                          {leftColumn.map((product, index) => {
                            return (
                              <div key={product.id} 
                                   className="overflow-visible cursor-pointer transition-all duration-200 ease-out hover:shadow-md"
                                   style={{
                                     backgroundColor: pandaMode ? '#000000' : containerColor,
                                     border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
                                     borderRadius: '8px',
                                     padding: '8px',
                                     color: fontColor,
                                     transition: 'all 0.2s ease-out'
                                   }}>
                                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(category.slug).length}, 1fr)` }}>
                                  {getCategoryColumns(category.slug).map((columnName, colIndex) => {
                                    const value = getColumnValue(product, columnName, category.slug);
                                    const isFirstColumn = colIndex === 0;
                                    return (
                                      <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                        {isFirstColumn && currentShowImages && (
                                          <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                            {product.image ? (
                                              <img src={product.image} alt={product.name}
                                                   className="w-full h-full object-contain rounded" loading="lazy" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center rounded" 
                                                   style={getContainerStyle()}>
                                                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                                </svg>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className={isFirstColumn ? 'flex-1 min-w-0' : ''}>
                                          <span className={`${isFirstColumn ? 'font-semibold' : 'font-medium'} text-sm leading-tight ${
                                            isFirstColumn ? 'block' : ''
                                          }`} style={{ 
                                            fontFamily: 'Tiempo, serif', 
                                            textShadow: isFirstColumn ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            color: isFirstColumn ? fontColor : `${fontColor}dd` 
                                          }}>
                                            {value || 'N/A'}
                                          </span>
                                          {isFirstColumn && columnName === 'name' && product.sku && (
                                            <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                                              {product.sku}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Right Column - Only render if not single column */}
                        {!useSingleColumn && (
                          <div className="space-y-2">
                            {rightColumn.map((product, index) => {
                              return (
                                <div key={product.id} 
                                     className="rounded-lg overflow-visible p-2 cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                                     style={getContainerStyle()}>
                                  <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(category.slug).length}, 1fr)` }}>
                                    {getCategoryColumns(category.slug).map((columnName, colIndex) => {
                                      const value = getColumnValue(product, columnName, category.slug);
                                      const isFirstColumn = colIndex === 0;
                                      return (
                                        <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                          {isFirstColumn && currentShowImages && (
                                            <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                              {product.image ? (
                                                <img src={product.image} alt={product.name}
                                                     className="w-full h-full object-contain rounded" loading="lazy" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center rounded" 
                                                     style={getContainerStyle()}>
                                                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <div className={isFirstColumn ? 'flex-1 min-w-0' : ''}>
                                            <span className={`${isFirstColumn ? 'font-semibold' : 'font-medium'} text-sm leading-tight ${
                                              isFirstColumn ? 'block' : ''
                                            }`} style={{ 
                                              fontFamily: 'Tiempo, serif', 
                                              textShadow: isFirstColumn ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                              color: isFirstColumn ? fontColor : `${fontColor}dd` 
                                            }}>
                                              {value || 'N/A'}
                                            </span>
                                            {isFirstColumn && columnName === 'name' && product.sku && (
                                              <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                                                {product.sku}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Grid Layout for Non-Flower Products */
                  <div className={`grid gap-2 px-6 pt-4 pb-4 ${
                    orientation === 'vertical' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  }`} style={getBackgroundStyle()}>
                    {categoryProducts.map(product => (
                      <div key={product.id} 
                           className="rounded-lg overflow-hidden p-2 relative cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                           style={getContainerStyle()}>
                        
                        {/* Product Image - Top Center */}
                        <div className="flex justify-center mb-3">
                          <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                            {product.image ? (
                              <img src={product.image} alt={product.name}
                                   className="w-full h-full object-contain rounded-lg" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center rounded-lg" 
                                   style={getContainerStyle()}>
                                <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Product Name and Info - Below Image */}
                        <div className="text-center">
                          <h3 className={`font-semibold leading-tight mb-1 ${
                            orientation === 'vertical' ? 'text-base' : 'text-sm'
                          }`} style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 2px rgba(0,0,0,0.1)', color: fontColor }}>
                            {product.name}
                          </h3>
                          {product.sku && (
                            <p className="text-xs" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                              {product.sku}
                            </p>
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

  return (
    <div className="h-full w-full text-slate-900 overflow-hidden flex flex-col relative" 
         style={{ background: `linear-gradient(to bottom right, ${backgroundColor}, ${backgroundColor}dd, ${backgroundColor}bb)`, color: fontColor }}>
      
      {/* Header - Hide in dual menu mode */}
      {!isDualMenu && (
        <div className={`backdrop-blur-md border-b px-2 sm:px-4 md:px-8 flex-shrink-0 relative z-10 shadow-lg ${
          orientation === 'vertical' ? 'py-2 sm:py-4' : 'py-1 sm:py-3'
        }`} style={getHeaderStyle()}>
          <div className={`flex flex-col items-center relative z-10 ${
            orientation === 'vertical' ? 'gap-1' : 'gap-0'
          }`}>
            {/* Title - Centered with responsive sizing */}
            <div className="text-center">
              <h1 className={`tracking-wide ${
                orientation === 'vertical' 
                  ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' 
                  : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
              }`} style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                {selectedCategoryName ? `${selectedCategoryName} Menu` : 'Flora Menu'}
              </h1>
              {/* Premium title underline effect */}
              <div className="w-20 sm:w-32 md:w-40 h-px mx-auto mt-2 md:mt-4 opacity-80" 
                   style={{ background: `linear-gradient(to right, transparent, ${fontColor}80, transparent)` }}>
              </div>
              {/* Elegant shimmer effect */}
              <div className="w-12 sm:w-20 md:w-24 h-px mx-auto mt-1 opacity-40 animate-pulse" 
                   style={{ background: `linear-gradient(to right, transparent, ${fontColor}60, transparent)`, animationDuration: '3s' }}>
              </div>
            </div>
            
            {/* Tiered Pricing in Header - Centered */}
            <div className="w-full flex justify-center px-2">
              {renderHeaderPricing(displayProducts, orientation)}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isDualMenu && orientation === 'horizontal' ? (
          /* Dual Menu Layout - Side by Side with Optional Stacking */
          <div className="flex h-full w-full">
            {/* Left Side */}
            <div className="w-1/2 flex flex-col border border-slate-200/40 shadow-xl rounded-l-xl overflow-hidden relative border-r-2 border-r-slate-300/30">
              {enableLeftStacking ? (
                /* Left Side - Stacked Layout */
                <div className="flex flex-col h-full">
                  {/* Top Left Menu */}
                  <div 
                    className="flex-1 flex flex-col min-h-0 relative cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionClick && onSectionClick('L');
                    }}
                    style={{
                      border: selectedMenuSection === 'L' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                      backgroundColor: selectedMenuSection === 'L' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: '6px',
                      margin: '2px',
                      position: 'relative',
                      zIndex: selectedMenuSection === 'L' ? 10 : 1
                    }}
                  >
                    <div className="backdrop-blur-md px-2 sm:px-4 md:px-8 py-1 sm:py-2 md:py-3 border-b border-slate-200/60 relative shadow-lg flex-shrink-0" style={getHeaderStyle()}>
                      <h1 className="text-center relative z-10 tracking-wide text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl" 
                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                        {leftMenuCategory ? categories.find(c => c.slug === leftMenuCategory)?.name || 'Top Left' : 'Top Left'}
                      </h1>
                      <div className="w-16 sm:w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-1 sm:mt-2 md:mt-3 opacity-70"></div>
                      <div className="w-full flex justify-center mt-1 px-1">
                        {renderHeaderPricing(leftMenuCategory ? displayProducts.filter(product => 
                          product.categories?.some(cat => cat.slug === leftMenuCategory)
                        ) : [], orientation)}
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {renderMenuSection(leftMenuCategory, undefined, true, 'L')}
                    </div>
                  </div>
                  
                  {/* Bottom Left Menu */}
                  <div 
                    className="flex-1 flex flex-col relative cursor-pointer hover:bg-white/5 transition-colors border-t-2 border-slate-300/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionClick && onSectionClick('L2');
                    }}
                    style={{
                      border: selectedMenuSection === 'L2' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                      backgroundColor: selectedMenuSection === 'L2' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: '6px',
                      margin: '2px',
                      position: 'relative',
                      zIndex: selectedMenuSection === 'L2' ? 10 : 1
                    }}
                  >
                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                        {leftMenuCategory2 ? categories.find(c => c.slug === leftMenuCategory2)?.name || 'Bottom Left' : 'Bottom Left'}
                      </h1>
                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                      <div className="w-full flex justify-center mt-1">
                        {renderHeaderPricing(leftMenuCategory2 ? displayProducts.filter(product => 
                          product.categories?.some(cat => cat.slug === leftMenuCategory2)
                        ) : [], orientation)}
                      </div>
                    </div>
                    <div className="flex-1">
                      {renderMenuSection(leftMenuCategory2, undefined, true, 'L2')}
                    </div>
                  </div>
                </div>
              ) : (
                /* Left Side - Single Layout */
                <div 
                  className="flex flex-col h-full relative cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick && onSectionClick('L');
                  }}
                  style={{
                    border: selectedMenuSection === 'L' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                    backgroundColor: selectedMenuSection === 'L' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '6px',
                    margin: '2px',
                    position: 'relative',
                    zIndex: selectedMenuSection === 'L' ? 10 : 1
                  }}
                >
                  <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                    <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                        style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                      {leftMenuCategory ? categories.find(c => c.slug === leftMenuCategory)?.name || 'Left Menu' : 'Left Menu'}
                    </h1>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                    <div className="w-full flex justify-center mt-1">
                      {renderHeaderPricing(leftMenuCategory ? displayProducts.filter(product => 
                        product.categories?.some(cat => cat.slug === leftMenuCategory)
                      ) : [], orientation)}
                    </div>
                  </div>
                  <div className="flex-1" style={getBackgroundStyle()}>
                    {renderMenuSection(leftMenuCategory, undefined, true, 'L')}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Side */}
            <div className="w-1/2 flex flex-col border border-slate-200/40 shadow-xl rounded-r-xl overflow-hidden relative border-l-2 border-l-slate-300/30">
              {enableRightStacking ? (
                /* Right Side - Stacked Layout */
                <div className="flex flex-col h-full">
                  {/* Top Right Menu */}
                  <div 
                    className="flex-1 flex flex-col relative cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionClick && onSectionClick('R');
                    }}
                    style={{
                      border: selectedMenuSection === 'R' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                      backgroundColor: selectedMenuSection === 'R' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: '6px',
                      margin: '2px',
                      position: 'relative',
                      zIndex: selectedMenuSection === 'R' ? 10 : 1
                    }}
                  >
                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                        {rightMenuCategory ? categories.find(c => c.slug === rightMenuCategory)?.name || 'Top Right' : 'Top Right'}
                      </h1>
                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                      <div className="w-full flex justify-center mt-1">
                        {renderHeaderPricing(rightMenuCategory ? displayProducts.filter(product => 
                          product.categories?.some(cat => cat.slug === rightMenuCategory)
                        ) : [], orientation)}
                      </div>
                    </div>
                    <div className="flex-1" style={getBackgroundStyle()}>
                      {renderMenuSection(rightMenuCategory, undefined, false, 'R')}
                    </div>
                  </div>
                  
                  {/* Bottom Right Menu */}
                  <div 
                    className="flex-1 flex flex-col relative cursor-pointer hover:bg-white/5 transition-colors border-t-2 border-slate-300/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionClick && onSectionClick('R2');
                    }}
                    style={{
                      border: selectedMenuSection === 'R2' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                      backgroundColor: selectedMenuSection === 'R2' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: '6px',
                      margin: '2px',
                      position: 'relative',
                      zIndex: selectedMenuSection === 'R2' ? 10 : 1
                    }}
                  >
                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                        {rightMenuCategory2 ? categories.find(c => c.slug === rightMenuCategory2)?.name || 'Bottom Right' : 'Bottom Right'}
                      </h1>
                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                      <div className="w-full flex justify-center mt-1">
                        {renderHeaderPricing(rightMenuCategory2 ? displayProducts.filter(product => 
                          product.categories?.some(cat => cat.slug === rightMenuCategory2)
                        ) : [], orientation)}
                      </div>
                    </div>
                    <div className="flex-1">
                      {renderMenuSection(rightMenuCategory2, undefined, false, 'R2')}
                    </div>
                  </div>
                </div>
              ) : (
                /* Right Side - Single Layout */
                <div 
                  className="flex flex-col h-full relative cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick && onSectionClick('R');
                  }}
                  style={{
                    border: selectedMenuSection === 'R' ? '1px solid rgba(255,255,255,0.6)' : 'none',
                    backgroundColor: selectedMenuSection === 'R' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '6px',
                    margin: '2px',
                    position: 'relative',
                    zIndex: selectedMenuSection === 'R' ? 10 : 1
                  }}
                >
                  <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                    <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                        style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                      {rightMenuCategory ? categories.find(c => c.slug === rightMenuCategory)?.name || 'Right Menu' : 'Right Menu'}
                    </h1>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                    <div className="w-full flex justify-center mt-1">
                      {renderHeaderPricing(rightMenuCategory ? displayProducts.filter(product => 
                        product.categories?.some(cat => cat.slug === rightMenuCategory)
                      ) : [], orientation)}
                    </div>
                  </div>
                  <div className="flex-1">
                    {renderMenuSection(rightMenuCategory, undefined, false, 'R')}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single Menu Layout */
          <div className="flex-1 overflow-y-auto pb-4 md:pb-8 px-2 md:px-4" style={getBackgroundStyle()}>
            {productsByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <p className="text-lg sm:text-xl md:text-2xl mb-3" style={{ color: fontColor, fontFamily: 'Tiempo, serif' }}>
                    {selectedCategoryName 
                      ? `No ${selectedCategoryName.toLowerCase()} products currently available`
                      : 'No products currently available'
                    }
                  </p>
                  <p className="text-sm sm:text-base md:text-lg text-gray-600" style={{ fontFamily: 'Tiempo, serif' }}>Check back soon for updates</p>
                </div>
              </div>
            ) : (
              <div className={`${orientation === 'vertical' ? 'space-y-4 md:space-y-6' : 'space-y-6 md:space-y-8'} pb-4 md:pb-6 pt-2 md:pt-4`} 
                   style={getBackgroundStyle()}>
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category.id}>
                    {/* Category Header - Only show if not filtered to single category */}
                    {!selectedCategoryName && (
                      <div className="backdrop-blur-md px-4 md:px-8 py-2 md:py-4 border-b relative rounded-t-xl shadow-lg" 
                           style={getHeaderStyle()}>
                        <h2 className={`font-medium uppercase tracking-widest relative z-10 ${
                          orientation === 'vertical' ? 'text-base md:text-lg' : 'text-lg md:text-xl'
                        }`} style={{ fontFamily: 'Tiempo, serif', letterSpacing: '0.15em', color: fontColor }}>
                          {category.name}
                        </h2>
                        <div className="w-20 md:w-28 h-px mt-2 md:mt-3" 
                             style={{ background: `linear-gradient(to right, transparent, ${fontColor}70, transparent)` }}>
                        </div>
                      </div>
                    )}
                    
                    {/* Conditional Layout: Table for Flower, Grid for Others */}
                    {getActualViewMode(category.name, false, null, undefined) === 'table' ? (
                      /* Table Layout - Single column if ≤ 13 products, 2-column if 14+ */
                      (() => {
                        const { leftColumn, rightColumn } = balanceTableProducts(categoryProducts);
                        const useSingleColumn = rightColumn.length === 0;
                        return (
                          <div className={`grid gap-3 md:gap-6 pt-2 md:pt-4 pb-2 md:pb-4 ${useSingleColumn ? 'grid-cols-1 justify-center' : 'grid-cols-1 lg:grid-cols-2'}`} 
                               style={getBackgroundStyle()}>
                            {/* Left Column */}
                            <div className="space-y-2">
                              {leftColumn.map((product, index) => {
                                return (
                                  <div key={product.id} 
                                       className="rounded-lg overflow-visible p-2 cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                                       style={getContainerStyle()}>
                                    <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(categoryFilter || undefined).length}, 1fr)` }}>
                                      {getCategoryColumns(categoryFilter || undefined).map((columnName, colIndex) => {
                                        const value = getColumnValue(product, columnName, categoryFilter || undefined);
                                        const isFirstColumn = colIndex === 0;
                                        return (
                                          <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                            {isFirstColumn && showImages && (
                                              <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                                {product.image ? (
                                                  <img src={product.image} alt={product.name}
                                                       className="w-full h-full object-contain rounded" loading="lazy" />
                                                ) : (
                                                  <div className="w-full h-full flex items-center justify-center rounded" 
                                                       style={getContainerStyle()}>
                                                    <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            <div className={isFirstColumn ? 'flex-1 min-w-0' : ''}>
                                              <span className={`${isFirstColumn ? 'font-semibold' : 'font-medium'} leading-tight ${
                                                isFirstColumn ? 'block' : ''
                                              } ${
                                                orientation === 'vertical' ? 'text-base' : 'text-sm'
                                              }`} style={{ 
                                                fontFamily: 'Tiempo, serif', 
                                                textShadow: isFirstColumn ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                color: isFirstColumn ? fontColor : `${fontColor}dd` 
                                              }}>
                                                {value || 'N/A'}
                                              </span>
                                              {isFirstColumn && columnName === 'name' && product.sku && (
                                                <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                                                  {product.sku}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Right Column - Only render if not single column */}
                            {!useSingleColumn && (
                              <div className="space-y-2">
                                {rightColumn.map((product, index) => {
                                  return (
                                    <div key={product.id} 
                                         className="rounded-lg overflow-visible p-2 cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                                         style={getContainerStyle()}>
                                      <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(categoryFilter || undefined).length}, 1fr)` }}>
                                        {getCategoryColumns(categoryFilter || undefined).map((columnName, colIndex) => {
                                          const value = getColumnValue(product, columnName, categoryFilter || undefined);
                                          const isFirstColumn = colIndex === 0;
                                          return (
                                            <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                              {isFirstColumn && showImages && (
                                                <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                                  {product.image ? (
                                                    <img src={product.image} alt={product.name}
                                                         className="w-full h-full object-contain rounded" loading="lazy" />
                                                  ) : (
                                                    <div className="w-full h-full flex items-center justify-center rounded" 
                                                         style={getContainerStyle()}>
                                                      <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                                      </svg>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                              <div className={isFirstColumn ? 'flex-1 min-w-0' : ''}>
                                                <span className={`${isFirstColumn ? 'font-semibold' : 'font-medium'} leading-tight ${
                                                  isFirstColumn ? 'block' : ''
                                                } ${
                                                  orientation === 'vertical' ? 'text-base' : 'text-sm'
                                                }`} style={{ 
                                                  fontFamily: 'Tiempo, serif', 
                                                  textShadow: isFirstColumn ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                                  color: isFirstColumn ? fontColor : `${fontColor}dd` 
                                                }}>
                                                  {value || 'N/A'}
                                                </span>
                                                {isFirstColumn && columnName === 'name' && product.sku && (
                                                  <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                                                    {product.sku}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      /* Grid Layout for Non-Flower Products */
                      <div className={`grid gap-2 px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-2 md:pb-4 ${
                        orientation === 'vertical' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      }`} style={getBackgroundStyle()}>
                        {categoryProducts.map(product => (
                          <div key={product.id} 
                               className="rounded-lg overflow-hidden p-2 relative cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                               style={getContainerStyle()}>
                            
                            {/* Product Image - Top Center */}
                            <div className="flex justify-center mb-3">
                              <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                                {product.image ? (
                                  <img src={product.image} alt={product.name}
                                       className="w-full h-full object-contain rounded-lg" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded-lg" 
                                       style={getContainerStyle()}>
                                    <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Product Name and Info - Below Image */}
                            <div className="text-center">
                              <h3 className={`font-semibold leading-tight mb-1 ${
                                orientation === 'vertical' ? 'text-base' : 'text-sm'
                              }`} style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 2px rgba(0,0,0,0.1)', color: fontColor }}>
                                {product.name}
                              </h3>
                              {product.sku && (
                                <p className="text-xs" style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>
                                  {product.sku}
                                </p>
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
        )}
      </div>
    </div>
  );
}
