'use client';

import React, { useState, useEffect } from 'react';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { Product, Category } from '../../types';
import { SharedMenuDisplay } from '../../components/ui/SharedMenuDisplay';

export default function MenuDisplayPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'auto'>('auto');
  const [showImages, setShowImages] = useState<boolean>(true);
  const [leftMenuImages, setLeftMenuImages] = useState<boolean>(true);
  const [rightMenuImages, setRightMenuImages] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isDualMenu, setIsDualMenu] = useState(false);
  const [leftMenuCategory, setLeftMenuCategory] = useState<string | null>(null);
  const [rightMenuCategory, setRightMenuCategory] = useState<string | null>(null);
  const [leftMenuCategory2, setLeftMenuCategory2] = useState<string | null>(null);
  const [rightMenuCategory2, setRightMenuCategory2] = useState<string | null>(null);
  const [leftMenuImages2, setLeftMenuImages2] = useState<boolean>(true);
  const [rightMenuImages2, setRightMenuImages2] = useState<boolean>(true);
  const [leftMenuViewMode, setLeftMenuViewMode] = useState<'table' | 'card' | 'auto'>('auto');
  const [rightMenuViewMode, setRightMenuViewMode] = useState<'table' | 'card' | 'auto'>('auto');
  const [leftMenuViewMode2, setLeftMenuViewMode2] = useState<'table' | 'card' | 'auto'>('auto');
  const [rightMenuViewMode2, setRightMenuViewMode2] = useState<'table' | 'card' | 'auto'>('auto');
  const [selectedMenuSection, setSelectedMenuSection] = useState<string | null>(null);
  const [enableLeftStacking, setEnableLeftStacking] = useState<boolean>(false);
  const [enableRightStacking, setEnableRightStacking] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#f5f5f4');
  const [fontColor, setFontColor] = useState<string>('#1f2937');
  const [containerColor, setContainerColor] = useState<string>('#d1d5db');
  const [pandaMode, setPandaMode] = useState<boolean>(false);
  // Table styling states
  const [tableBorderColor, setTableBorderColor] = useState<string>('#e5e7eb');
  const [tableBorderWidth, setTableBorderWidth] = useState<number>(1);
  const [tableRowHoverColor, setTableRowHoverColor] = useState<string>('#f3f4f6');
  const [tableHeaderColor, setTableHeaderColor] = useState<string>('#f9fafb');
  const [tableAlternateRowColor, setTableAlternateRowColor] = useState<string>('#ffffff');
  const [tableBorderRadius, setTableBorderRadius] = useState<number>(8);
  const [tablePadding, setTablePadding] = useState<number>(8);
  // Per-category column selection state
  const [categoryColumnConfigs, setCategoryColumnConfigs] = useState<Map<string, string[]>>(new Map());
  const [categoryBlueprintFields, setCategoryBlueprintFields] = useState<Map<string, ProductBlueprintFields[]>>(new Map());
  // Separate column configs for dual menu left and right sides
  const [leftColumnConfigs, setLeftColumnConfigs] = useState<Map<string, string[]>>(new Map());
  const [rightColumnConfigs, setRightColumnConfigs] = useState<Map<string, string[]>>(new Map());

  // Get columns for a specific category or default
  const getCategoryColumns = (categorySlug?: string, isLeftSide?: boolean): string[] => {
    if (!categorySlug) return ['name'];
    
    // In dual menu mode, use separate configs for left and right
    let configuredColumns;
    if (isDualMenu) {
      // In dual menu, we MUST know which side we're rendering for
      // If isLeftSide is undefined in dual mode, try to determine it from the category
      if (isLeftSide === undefined) {
        // Check if this category matches left or right menu categories
        if (categorySlug === leftMenuCategory || categorySlug === leftMenuCategory2) {
          isLeftSide = true;
        } else if (categorySlug === rightMenuCategory || categorySlug === rightMenuCategory2) {
          isLeftSide = false;
        } else {
          console.warn(`⚠️ Unable to determine side for category '${categorySlug}' in dual menu mode`);
          return ['name'];
        }
      }
      
      const configMap = isLeftSide ? leftColumnConfigs : rightColumnConfigs;
      configuredColumns = configMap.get(categorySlug);
      
      // Debug logging for dual menu
      console.log(`🔍 Getting columns for ${isLeftSide ? 'LEFT' : 'RIGHT'} category '${categorySlug}':`);
      console.log('  - Config map:', Array.from(configMap.entries()));
      console.log('  - Found columns:', configuredColumns);
    } else {
      configuredColumns = categoryColumnConfigs.get(categorySlug);
    }
    
    if (configuredColumns && configuredColumns.length > 0) {
      return configuredColumns;
    }
    
    // Default - just show product name, user must explicitly select other columns
    return ['name'];
  };

  useEffect(() => {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrientation = urlParams.get('orientation');
    const urlViewMode = urlParams.get('viewMode');
    const urlShowImages = urlParams.get('showImages');
    const urlLeftImages = urlParams.get('leftImages');
    const urlRightImages = urlParams.get('rightImages');
    const urlCategory = urlParams.get('category');
    const urlDualMenu = urlParams.get('dual');
    const urlLeftCategory = urlParams.get('leftCategory');
    const urlRightCategory = urlParams.get('rightCategory');
    const urlLeftCategory2 = urlParams.get('leftCategory2');
    const urlRightCategory2 = urlParams.get('rightCategory2');
    const urlLeftImages2 = urlParams.get('leftImages2');
    const urlRightImages2 = urlParams.get('rightImages2');
    const urlLeftStacking = urlParams.get('leftStacking');
    const urlRightStacking = urlParams.get('rightStacking');
    const urlBackgroundColor = urlParams.get('backgroundColor');
    const urlFontColor = urlParams.get('fontColor');
    const urlContainerColor = urlParams.get('containerColor');
    const urlPandaMode = urlParams.get('pandaMode');
    const urlTableBorderColor = urlParams.get('tableBorderColor');
    const urlTableBorderWidth = urlParams.get('tableBorderWidth');
    const urlTableRowHoverColor = urlParams.get('tableRowHoverColor');
    const urlTableHeaderColor = urlParams.get('tableHeaderColor');
    const urlTableAlternateRowColor = urlParams.get('tableAlternateRowColor');
    const urlTableBorderRadius = urlParams.get('tableBorderRadius');
    const urlTablePadding = urlParams.get('tablePadding');
    const urlCategoryColumnConfigs = urlParams.get('categoryColumnConfigs');
    const urlLeftColumns = urlParams.get('leftColumns');
    const urlRightColumns = urlParams.get('rightColumns');
    const urlLeftViewMode = urlParams.get('leftViewMode');
    const urlRightViewMode = urlParams.get('rightViewMode');
    
    if (urlOrientation === 'vertical' || urlOrientation === 'horizontal') {
      setOrientation(urlOrientation);
    }
    
    if (urlViewMode === 'table' || urlViewMode === 'card' || urlViewMode === 'auto') {
      setViewMode(urlViewMode);
    }
    
    if (urlShowImages === 'true' || urlShowImages === 'false') {
      setShowImages(urlShowImages === 'true');
    } else if (urlShowImages === 'dual') {
      console.log('🖼️ DUAL MODE - Image settings from URL:');
      console.log('  - urlLeftImages:', urlLeftImages);
      console.log('  - urlRightImages:', urlRightImages);
      if (urlLeftImages === 'true' || urlLeftImages === 'false') {
        const leftVal = urlLeftImages === 'true';
        console.log('  - Setting leftMenuImages to:', leftVal);
        setLeftMenuImages(leftVal);
      }
      if (urlRightImages === 'true' || urlRightImages === 'false') {
        const rightVal = urlRightImages === 'true';
        console.log('  - Setting rightMenuImages to:', rightVal);
        setRightMenuImages(rightVal);
      }
    }
    
    if (urlCategory) {
      setCategoryFilter(urlCategory);
    }
    
    if (urlDualMenu === 'true') {
      console.log('🔍 DUAL MENU MODE DETECTED');
      console.log('  - leftCategory:', urlLeftCategory);
      console.log('  - rightCategory:', urlRightCategory);
      setIsDualMenu(true);
      setLeftMenuCategory(urlLeftCategory);
      setRightMenuCategory(urlRightCategory);
      setLeftMenuCategory2(urlLeftCategory2);
      setRightMenuCategory2(urlRightCategory2);
      
      if (urlLeftImages2 === 'true' || urlLeftImages2 === 'false') {
        setLeftMenuImages2(urlLeftImages2 === 'true');
      }
      if (urlRightImages2 === 'true' || urlRightImages2 === 'false') {
        setRightMenuImages2(urlRightImages2 === 'true');
      }
      if (urlLeftStacking === 'true' || urlLeftStacking === 'false') {
        setEnableLeftStacking(urlLeftStacking === 'true');
      }
      if (urlRightStacking === 'true' || urlRightStacking === 'false') {
        setEnableRightStacking(urlRightStacking === 'true');
      }
    }

    if (urlBackgroundColor) {
      setBackgroundColor(decodeURIComponent(urlBackgroundColor));
    }
    if (urlFontColor) {
      setFontColor(decodeURIComponent(urlFontColor));
    }
    if (urlContainerColor) {
      setContainerColor(decodeURIComponent(urlContainerColor));
    }
    if (urlPandaMode === 'true' || urlPandaMode === 'false') {
      setPandaMode(urlPandaMode === 'true');
    }

    // Set table styling from URL params
    if (urlTableBorderColor) {
      setTableBorderColor(decodeURIComponent(urlTableBorderColor));
    }
    if (urlTableBorderWidth) {
      setTableBorderWidth(Number(urlTableBorderWidth));
    }
    if (urlTableRowHoverColor) {
      setTableRowHoverColor(decodeURIComponent(urlTableRowHoverColor));
    }
    if (urlTableHeaderColor) {
      setTableHeaderColor(decodeURIComponent(urlTableHeaderColor));
    }
    if (urlTableAlternateRowColor) {
      setTableAlternateRowColor(decodeURIComponent(urlTableAlternateRowColor));
    }
    if (urlTableBorderRadius) {
      setTableBorderRadius(Number(urlTableBorderRadius));
    }
    if (urlTablePadding) {
      setTablePadding(Number(urlTablePadding));
    }
    if (urlCategoryColumnConfigs) {
      try {
        const configs = JSON.parse(decodeURIComponent(urlCategoryColumnConfigs));
        if (typeof configs === 'object' && configs !== null) {
          const configMap = new Map<string, string[]>();
          Object.entries(configs).forEach(([categorySlug, columns]) => {
            if (Array.isArray(columns)) {
              configMap.set(categorySlug, columns);
            }
          });
          setCategoryColumnConfigs(configMap);
        }
      } catch (error) {
        console.warn('Failed to parse categoryColumnConfigs from URL:', error);
      }
    }
    
    // Handle dual menu column configurations
    if (urlDualMenu === 'true') {
      console.log('🔍 DUAL MENU DEBUG - Starting column configuration parsing');
      console.log('🔍 leftColumns param:', urlLeftColumns);
      console.log('🔍 rightColumns param:', urlRightColumns);
      
      // Parse left columns into leftColumnConfigs
      if (urlLeftColumns) {
        try {
          const leftConfigs = JSON.parse(decodeURIComponent(urlLeftColumns));
          console.log('🔍 Parsed leftConfigs:', leftConfigs);
          if (typeof leftConfigs === 'object' && leftConfigs !== null) {
            const newMap = new Map<string, string[]>();
            Object.entries(leftConfigs).forEach(([categorySlug, columns]) => {
              if (Array.isArray(columns)) {
                console.log(`🔍 Setting columns for LEFT category ${categorySlug}:`, columns);
                newMap.set(categorySlug, columns);
              }
            });
            setLeftColumnConfigs(newMap);
            console.log('🔍 Set leftColumnConfigs:', Array.from(newMap.entries()));
          }
        } catch (error) {
          console.warn('Failed to parse leftColumns from URL:', error);
        }
      } else {
        console.log('🔍 No leftColumns param found');
        // If no columns specified, initialize with default columns for the selected categories
        if (urlLeftCategory) {
          console.log('🔍 Initializing default LEFT columns for:', urlLeftCategory);
          setLeftColumnConfigs(new Map([[urlLeftCategory, ['name']]]));
        }
      }
      
      // Parse right columns into rightColumnConfigs
      if (urlRightColumns) {
        try {
          const rightConfigs = JSON.parse(decodeURIComponent(urlRightColumns));
          console.log('🔍 Parsed rightConfigs:', rightConfigs);
          if (typeof rightConfigs === 'object' && rightConfigs !== null) {
            const newMap = new Map<string, string[]>();
            Object.entries(rightConfigs).forEach(([categorySlug, columns]) => {
              if (Array.isArray(columns)) {
                console.log(`🔍 Setting columns for RIGHT category ${categorySlug}:`, columns);
                newMap.set(categorySlug, columns);
              }
            });
            setRightColumnConfigs(newMap);
            console.log('🔍 Set rightColumnConfigs:', Array.from(newMap.entries()));
          }
        } catch (error) {
          console.warn('Failed to parse rightColumns from URL:', error);
        }
      } else {
        console.log('🔍 No rightColumns param found');
        // If no columns specified, initialize with default columns for the selected categories
        if (urlRightCategory) {
          console.log('🔍 Initializing default RIGHT columns for:', urlRightCategory);
          setRightColumnConfigs(new Map([[urlRightCategory, ['name']]]));
        }
      }
    }

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
                orientation === 'vertical' ? 'flex-col' : 'items-center'
              }`}>
                {tiers.map((tier, tierIndex) => (
                  <React.Fragment key={`${ruleName}-${tier.label}`}>
                    <div className={`flex items-center gap-1 ${
                      orientation === 'vertical' ? 'justify-center' : ''
                    }`}>
                      <span className="font-bold" style={{ 
                        fontSize: orientation === 'vertical' ? '14px' : '13px', 
                        color: fontColor,
                        fontFamily: 'Tiempo, serif'
                      }}>
                        {tier.label}
                      </span>
                      <span style={{ 
                        fontSize: orientation === 'vertical' ? '13px' : '12px', 
                        color: fontColor,
                        fontFamily: 'Tiempo, serif'
                      }}>
                        ${tier.price}
                      </span>
                    </div>
                    {tierIndex < tiers.length - 1 && orientation === 'horizontal' && (
                      <span className="mx-1 text-gray-400" style={{ fontSize: '10px' }}>|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {ruleIndex < tiersByRule.size - 1 && orientation === 'horizontal' && (
                <span className="mx-2 text-gray-500" style={{ fontSize: '12px' }}>•</span>
              )}
            </div>
          ))}
        </div>
      );
    };

    // Listen for data from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.log('🔒 [Menu Display] Ignoring message from different origin:', event.origin);
        return;
      }
      
      if (event.data.type === 'MENU_DATA') {
        console.log('📨 [Menu Display] Received MENU_DATA message:', { 
          productsCount: event.data.products?.length, 
          categoriesCount: event.data.categories?.length,
          leftMenuViewMode2: event.data.leftMenuViewMode2,
          rightMenuViewMode2: event.data.rightMenuViewMode2,
          selectedMenuSection: event.data.selectedMenuSection,
          isDual: event.data.isDual,
          categoryFilter: event.data.categoryFilter,
          leftMenuCategory: event.data.leftMenuCategory,
          rightMenuCategory: event.data.rightMenuCategory
        });
        setProducts(event.data.products || []);
        setCategories(event.data.categories || []);
        if (event.data.orientation) {
          setOrientation(event.data.orientation);
        }
        if (event.data.viewMode) {
          setViewMode(event.data.viewMode);
        }
        if (typeof event.data.showImages === 'boolean') {
          setShowImages(event.data.showImages);
        } else if (event.data.showImages === 'dual') {
          if (typeof event.data.leftMenuImages === 'boolean') {
            setLeftMenuImages(event.data.leftMenuImages);
          }
          if (typeof event.data.rightMenuImages === 'boolean') {
            setRightMenuImages(event.data.rightMenuImages);
          }
          if (typeof event.data.leftMenuImages2 === 'boolean') {
            setLeftMenuImages2(event.data.leftMenuImages2);
          }
          if (typeof event.data.rightMenuImages2 === 'boolean') {
            setRightMenuImages2(event.data.rightMenuImages2);
          }
        }
        
        if (typeof event.data.enableLeftStacking === 'boolean') {
          setEnableLeftStacking(event.data.enableLeftStacking);
        }
        if (typeof event.data.enableRightStacking === 'boolean') {
          setEnableRightStacking(event.data.enableRightStacking);
        }
        if (event.data.leftMenuCategory2) {
          setLeftMenuCategory2(event.data.leftMenuCategory2);
        }
        if (event.data.rightMenuCategory2) {
          setRightMenuCategory2(event.data.rightMenuCategory2);
        }
        
        // Handle quadrant-specific view modes
        if (event.data.leftMenuViewMode) {
          console.log('🔧 Setting leftMenuViewMode to:', event.data.leftMenuViewMode);
          setLeftMenuViewMode(event.data.leftMenuViewMode);
        }
        if (event.data.rightMenuViewMode) {
          console.log('🔧 Setting rightMenuViewMode to:', event.data.rightMenuViewMode);
          setRightMenuViewMode(event.data.rightMenuViewMode);
        }
        if (event.data.leftMenuViewMode2 !== undefined) {
          console.log('🔧 Setting leftMenuViewMode2 to:', event.data.leftMenuViewMode2);
          setLeftMenuViewMode2(event.data.leftMenuViewMode2);
        }
        if (event.data.rightMenuViewMode2 !== undefined) {
          console.log('🔧 Setting rightMenuViewMode2 to:', event.data.rightMenuViewMode2);
          setRightMenuViewMode2(event.data.rightMenuViewMode2);
        }
        
        // Handle selected menu section
        if (event.data.selectedMenuSection) {
          console.log('🎯 Setting selectedMenuSection to:', event.data.selectedMenuSection);
          setSelectedMenuSection(event.data.selectedMenuSection);
        }
        
        if (event.data.backgroundColor) {
          setBackgroundColor(event.data.backgroundColor);
        }
        if (event.data.fontColor) {
          setFontColor(event.data.fontColor);
        }
        if (event.data.containerColor) {
          setContainerColor(event.data.containerColor);
        }
        if (typeof event.data.pandaMode === 'boolean') {
          setPandaMode(event.data.pandaMode);
        }
        
        // Handle table styling settings
        if (event.data.tableBorderColor) {
          setTableBorderColor(event.data.tableBorderColor);
        }
        if (typeof event.data.tableBorderWidth === 'number') {
          setTableBorderWidth(event.data.tableBorderWidth);
        }
        if (event.data.tableRowHoverColor) {
          setTableRowHoverColor(event.data.tableRowHoverColor);
        }
        if (event.data.tableHeaderColor) {
          setTableHeaderColor(event.data.tableHeaderColor);
        }
        if (event.data.tableAlternateRowColor) {
          setTableAlternateRowColor(event.data.tableAlternateRowColor);
        }
        if (typeof event.data.tableBorderRadius === 'number') {
          setTableBorderRadius(event.data.tableBorderRadius);
        }
        if (typeof event.data.tablePadding === 'number') {
          setTablePadding(event.data.tablePadding);
        }
        
        // Handle per-category column configurations
        if (event.data.categoryColumnConfigs && typeof event.data.categoryColumnConfigs === 'object') {
          const configMap = new Map<string, string[]>();
          Object.entries(event.data.categoryColumnConfigs).forEach(([categorySlug, columns]) => {
            if (Array.isArray(columns)) {
              configMap.set(categorySlug, columns as string[]);
            }
          });
          setCategoryColumnConfigs(configMap);
        }
        
        // Handle dual menu column configurations from message
        if (event.data.leftColumnConfigs && typeof event.data.leftColumnConfigs === 'object') {
          console.log('🔍 Received leftColumnConfigs from message:', event.data.leftColumnConfigs);
          const leftMap = new Map<string, string[]>();
          Object.entries(event.data.leftColumnConfigs).forEach(([categorySlug, columns]) => {
            if (Array.isArray(columns)) {
              console.log(`🔍 Setting LEFT columns for ${categorySlug}:`, columns);
              leftMap.set(categorySlug, columns as string[]);
            }
          });
          setLeftColumnConfigs(leftMap);
        }
        
        if (event.data.rightColumnConfigs && typeof event.data.rightColumnConfigs === 'object') {
          console.log('🔍 Received rightColumnConfigs from message:', event.data.rightColumnConfigs);
          const rightMap = new Map<string, string[]>();
          Object.entries(event.data.rightColumnConfigs).forEach(([categorySlug, columns]) => {
            if (Array.isArray(columns)) {
              console.log(`🔍 Setting RIGHT columns for ${categorySlug}:`, columns);
              rightMap.set(categorySlug, columns as string[]);
            }
          });
          setRightColumnConfigs(rightMap);
        }
        
        // Handle blueprint fields data
        if (event.data.categoryBlueprintFields) {
          const fieldsMap = new Map<string, ProductBlueprintFields[]>();
          Object.entries(event.data.categoryBlueprintFields).forEach(([slug, fields]) => {
            fieldsMap.set(slug, fields as ProductBlueprintFields[]);
          });
          setCategoryBlueprintFields(fieldsMap);
        }
        
        if (event.data.categoryFilter) {
          setCategoryFilter(event.data.categoryFilter);
        }
        
        // Handle dual menu flag
        if (typeof event.data.isDual === 'boolean') {
          console.log('🔍 Setting dual menu mode from message:', event.data.isDual);
          setIsDualMenu(event.data.isDual);
          
          // Also set the left and right menu categories if in dual mode
          if (event.data.isDual) {
            if (event.data.leftMenuCategory) {
              setLeftMenuCategory(event.data.leftMenuCategory);
            }
            if (event.data.rightMenuCategory) {
              setRightMenuCategory(event.data.rightMenuCategory);
            }
          }
        }
        
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Fallback timeout triggered - fetching menu data directly');
        fetchMenuData();
      }
    }, 1000); // Reduced timeout to 1 second for faster fallback

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(fallbackTimeout);
    };
  }, [loading]);
  
  // Debug function to check column configurations
  useEffect(() => {
    if (isDualMenu) {
      console.log('🔍 DUAL MENU STATE CHECK:');
      console.log('  - leftMenuCategory:', leftMenuCategory);
      console.log('  - rightMenuCategory:', rightMenuCategory);
      console.log('  - leftColumnConfigs Map:', Array.from(leftColumnConfigs.entries()));
      console.log('  - rightColumnConfigs Map:', Array.from(rightColumnConfigs.entries()));
      console.log('  - categoryBlueprintFields Map size:', categoryBlueprintFields.size);
      console.log('  - categories loaded:', categories.map(c => c.slug));
    }
  }, [isDualMenu, leftMenuCategory, rightMenuCategory, leftColumnConfigs, rightColumnConfigs, categoryBlueprintFields, categories]);

  const fetchMenuData = async () => {
    try {
      console.log('🔄 [Menu Display] Starting data fetch...');
      
      // Build URL with location ID for stock filtering
      const params = new URLSearchParams({
        per_page: '1000',
        _t: Date.now().toString()
      });
      
      // Get location from URL params or use default
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get('location') || '1'; // Default to location 1
      params.append('location_id', locationId);
      
      console.log('🔄 [Menu Display] Fetching from API with params:', params.toString());

      const response = await fetch(`/api/proxy/flora-im/products?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      console.log('🔄 [Menu Display] API Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('🔄 [Menu Display] API Response:', { success: result.success, dataLength: result.data?.length });
        
        if (result.success && result.data) {
          // Products are already filtered by stock at API level
          const availableProducts = result.data;
          
          try {
            console.log(`🔍 [Menu Display] Batch fetching blueprint pricing for ${availableProducts.length} products`);
            const productsWithCategories = availableProducts.map((product: Product) => ({
              id: product.id,
              categoryIds: product.categories?.map(cat => cat.id) || []
            }));

            const batchPricingResponse = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories);
            
            availableProducts.forEach((product: Product) => {
              const pricingData = batchPricingResponse[product.id];
              if (pricingData) {
                product.blueprintPricing = pricingData;
              }
            });
            
            console.log(`✅ [Menu Display] Applied blueprint pricing to ${Object.keys(batchPricingResponse).length}/${availableProducts.length} products`);
          } catch (pricingError) {
            console.warn(`⚠️ [Menu Display] Failed to get batch blueprint pricing:`, pricingError instanceof Error ? pricingError.message : 'Unknown error');
          }
          
          setProducts(availableProducts);
          
          const categoryMap = new Map();
          availableProducts.forEach((product: Product) => {
            product.categories?.forEach(cat => {
              if (!categoryMap.has(cat.id)) {
                categoryMap.set(cat.id, cat);
              }
            });
          });
          setCategories(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
          console.log('✅ [Menu Display] Data loaded successfully:', { products: availableProducts.length, categories: Array.from(categoryMap.values()).length });
        } else {
          console.error('❌ [Menu Display] API response missing data:', result);
        }
      } else {
        console.error('❌ [Menu Display] API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ [Menu Display] Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ [Menu Display] Failed to fetch menu data:', error);
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
    // Handle special case for product name
    if (columnName === 'name') {
      return product.name;
    }
    
    // For all other fields, try blueprint fields first, then meta_data
    const blueprintValue = getBlueprintFieldValue(product, columnName, categorySlug);
    if (blueprintValue) return blueprintValue;
    
    // Fallback to meta_data
    const metaValue = getMetaValue(product, columnName) || getMetaValue(product, `_${columnName}`);
    if (metaValue) return metaValue;
    
    // Final fallback for common WooCommerce fields
    switch (columnName) {
      case 'sku':
        return product.sku || '';
      default:
        return '';
    }
  };

  // Get column label
  const getColumnLabel = (columnName: string, categorySlug?: string): string => {
    // Special case for product name
    if (columnName === 'name') return 'Product Name';
    
    // Try to get label from blueprint fields first
    if (categorySlug) {
      const categoryFields = categoryBlueprintFields.get(categorySlug);
      if (categoryFields && categoryFields.length > 0) {
        const field = categoryFields[0].fields.find(f => f.field_name === columnName);
        if (field?.field_label) return field.field_label;
      }
    }
    
    // Common WooCommerce field labels
    const commonLabels: Record<string, string> = {
      'sku': 'SKU',
      'price': 'Price',
      'regular_price': 'Regular Price',
      'sale_price': 'Sale Price',
      'stock_quantity': 'Stock',
      'weight': 'Weight',
      'length': 'Length',
      'width': 'Width',
      'height': 'Height'
    };
    
    if (commonLabels[columnName]) return commonLabels[columnName];
    
    // Fallback to formatted field name
    return columnName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Determine which image setting to use for dual menus
  const getImageSetting = (isLeftSide: boolean = false, categorySlug: string | null = null) => {
    if (isDualMenu) {
      if (isLeftSide) {
        if (enableLeftStacking && categorySlug === leftMenuCategory2) {
          console.log(`🖼️ getImageSetting for LEFT stacked category '${categorySlug}': ${leftMenuImages2}`);
          return leftMenuImages2;
        }
        console.log(`🖼️ getImageSetting for LEFT category '${categorySlug}': ${leftMenuImages}`);
        return leftMenuImages;
      } else {
        if (enableRightStacking && categorySlug === rightMenuCategory2) {
          console.log(`🖼️ getImageSetting for RIGHT stacked category '${categorySlug}': ${rightMenuImages2}`);
          return rightMenuImages2;
        }
        console.log(`🖼️ getImageSetting for RIGHT category '${categorySlug}': ${rightMenuImages}`);
        return rightMenuImages;
      }
    }
    return showImages;
  };

  // Check if we're displaying flower products (for table view)
  const isFlowerCategory = (categoryName: string) => {
    const flowerKeywords = ['flower', 'bud', 'strain'];
    return flowerKeywords.some(keyword => 
      categoryName.toLowerCase().includes(keyword)
    );
  };

  // Determine actual view mode to use
  const getActualViewMode = (categoryName: string) => {
    if (viewMode === 'auto') {
      return isFlowerCategory(categoryName) ? 'table' : 'card';
    }
    return viewMode;
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
    
    // Use single column if 13 or fewer products
    if (totalProducts <= 13) {
      return {
        leftColumn: products,
        rightColumn: []
      };
    }
    
    // Use 2-column layout for 14+ products
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

  const getTableRowStyle = (isHover: boolean = false, isAlternate: boolean = false) => ({
    backgroundColor: pandaMode ? '#000000' : (isHover ? tableRowHoverColor : (isAlternate ? tableAlternateRowColor : containerColor)),
    border: pandaMode ? `${tableBorderWidth}px solid rgba(255, 255, 255, 0.2)` : `${tableBorderWidth}px solid ${tableBorderColor}`,
    borderRadius: `${tableBorderRadius}px`,
    padding: `${tablePadding}px`,
    color: fontColor,
    transition: 'all 0.2s ease-out'
  });

  const getHeaderStyle = () => ({
    background: pandaMode 
      ? 'linear-gradient(to right, #000000, #000000, #000000)'
      : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
    borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
    color: fontColor
  });


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

  // Update selected category name when categoryFilter changes
  useEffect(() => {
    if (categoryFilter && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.slug === categoryFilter);
      setSelectedCategoryName(selectedCategory?.name || '');
    } else {
      setSelectedCategoryName('');
    }
  }, [categoryFilter, categories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getBackgroundStyle()}>
        <div className="text-center">
          <img src="/logo123.png" alt="Flora Logo" className="w-20 h-20 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen text-slate-900 overflow-hidden flex flex-col relative group" 
         style={{ background: `linear-gradient(to bottom right, ${backgroundColor}, ${backgroundColor}dd, ${backgroundColor}bb)`, color: fontColor }}>
      
      {/* Hidden Close Button - Shows on hover/touch */}
      <button
        onClick={() => window.close()}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-red-600/80 transition-all duration-300 ease-out flex items-center justify-center touch-manipulation"
        style={{ 
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        title="Close Menu"
        onTouchStart={(e) => {
          // Show button on touch for tablets
          e.currentTarget.style.opacity = '1';
        }}
        onTouchEnd={(e) => {
          // Keep button visible for a moment after touch
          setTimeout(() => {
            if (!e.currentTarget.matches(':hover')) {
              e.currentTarget.style.opacity = '0';
            }
          }, 3000);
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
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
        {(() => {
          console.log(`🖼️ RENDERING MODE - isDualMenu: ${isDualMenu}, orientation: ${orientation}`);
          console.log(`🖼️ Image settings - leftMenuImages: ${leftMenuImages}, rightMenuImages: ${rightMenuImages}, showImages: ${showImages}`);
          return null;
        })()}
        {isDualMenu ? (
          <SharedMenuDisplay
            products={displayProducts}
            categories={displayCategories}
            orientation={orientation}
            viewMode={viewMode}
            showImages={showImages}
            leftMenuImages={leftMenuImages}
            rightMenuImages={rightMenuImages}
            categoryFilter={categoryFilter}
            selectedCategoryName={selectedCategoryName}
            isDualMenu={isDualMenu}
            leftMenuCategory={leftMenuCategory}
            rightMenuCategory={rightMenuCategory}
            leftMenuCategory2={leftMenuCategory2}
            rightMenuCategory2={rightMenuCategory2}
            leftMenuImages2={leftMenuImages2}
            rightMenuImages2={rightMenuImages2}
            leftMenuViewMode={leftMenuViewMode}
            rightMenuViewMode={rightMenuViewMode}
            leftMenuViewMode2={leftMenuViewMode2}
            rightMenuViewMode2={rightMenuViewMode2}
            selectedMenuSection={selectedMenuSection}
            enableLeftStacking={enableLeftStacking}
            enableRightStacking={enableRightStacking}
            backgroundColor={backgroundColor}
            fontColor={fontColor}
            containerColor={containerColor}
            pandaMode={pandaMode}
            categoryColumnConfigs={categoryColumnConfigs}
            categoryBlueprintFields={categoryBlueprintFields}
          />
        ) : (
          /* Single Menu Layout */
          <div className="flex-1 overflow-y-auto pb-4 md:pb-8 px-4 md:px-8 lg:px-16 xl:px-24" style={getBackgroundStyle()}>
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
              <div className="max-w-6xl mx-auto">
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
                    {getActualViewMode(category.name) === 'table' ? (
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
                                    <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(category.slug, false).length}, 1fr)` }}>
                                      {getCategoryColumns(category.slug, false).map((columnName, colIndex) => {
                                        const value = getColumnValue(product, columnName, category.slug);
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
                                      <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(category.slug, false).length}, 1fr)` }}>
                                        {getCategoryColumns(category.slug, false).map((columnName, colIndex) => {
                                          const value = getColumnValue(product, columnName, category.slug);
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
                              {/* Product Image */}
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}