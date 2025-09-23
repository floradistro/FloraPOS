'use client';

import React, { useState, useEffect } from 'react';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { Product, Category } from '../../types';

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

  // Get columns for a specific category or default
  const getCategoryColumns = (categorySlug?: string): string[] => {
    if (!categorySlug) return ['name'];
    
    // Get the configured columns for this category
    const configuredColumns = categoryColumnConfigs.get(categorySlug);
    
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
    
    if (urlOrientation === 'vertical' || urlOrientation === 'horizontal') {
      setOrientation(urlOrientation);
    }
    
    if (urlViewMode === 'table' || urlViewMode === 'card' || urlViewMode === 'auto') {
      setViewMode(urlViewMode);
    }
    
    if (urlShowImages === 'true' || urlShowImages === 'false') {
      setShowImages(urlShowImages === 'true');
    } else if (urlShowImages === 'dual') {
      if (urlLeftImages === 'true' || urlLeftImages === 'false') {
        setLeftMenuImages(urlLeftImages === 'true');
      }
      if (urlRightImages === 'true' || urlRightImages === 'false') {
        setRightMenuImages(urlRightImages === 'true');
      }
    }
    
    if (urlCategory) {
      setCategoryFilter(urlCategory);
    }
    
    if (urlDualMenu === 'true') {
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

    // Listen for data from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'MENU_DATA') {
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
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
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
  const renderMenuSection = (categorySlug: string | null, sectionTitle?: string, isLeftSide: boolean = false) => {
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
              <p className="text-2xl mb-3" style={{ color: fontColor }}>
                {sectionTitle 
                  ? `No ${sectionTitle.toLowerCase()} products currently available`
                  : 'No products currently available'
                }
              </p>
              <p className="text-lg text-slate-500 font-medium">Check back soon for updates</p>
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
                {getActualViewMode(category.name) === 'table' ? (
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
                                   style={getTableRowStyle(false, index % 2 === 1)}
                                   onMouseEnter={(e) => {
                                     const hoverStyle = getTableRowStyle(true, index % 2 === 1);
                                     Object.assign(e.currentTarget.style, hoverStyle);
                                   }}
                                   onMouseLeave={(e) => {
                                     const normalStyle = getTableRowStyle(false, index % 2 === 1);
                                     Object.assign(e.currentTarget.style, normalStyle);
                                   }}>
                                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(categorySlug || undefined).length}, 1fr)` }}>
                                  {getCategoryColumns(categorySlug || undefined).map((columnName, colIndex) => {
                                    const value = getColumnValue(product, columnName, categorySlug || undefined);
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
                                            isFirstColumn ? 'block truncate' : ''
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
                                  <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${getCategoryColumns(categorySlug || undefined).length}, 1fr)` }}>
                                    {getCategoryColumns(categorySlug || undefined).map((columnName, colIndex) => {
                                      const value = getColumnValue(product, columnName, categorySlug || undefined);
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
                                              isFirstColumn ? 'block truncate' : ''
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
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-4 pb-4" style={getBackgroundStyle()}>
                    {categoryProducts.map(product => {
                      return (
                        <div key={product.id} 
                             className="rounded-lg overflow-hidden p-2 relative cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                             style={getContainerStyle()}>
                          
                          {/* Product Image - Show based on user preference and view mode */}
                          {currentShowImages && (getActualViewMode(category.name) === 'card' || shouldShowImages(category.name)) && (
                            <div className="flex justify-center mb-3 relative z-10">
                              <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                                {product.image ? (
                                  <img src={product.image} alt={product.name}
                                       className="w-full h-full object-contain rounded-lg" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded-lg" 
                                       style={getContainerStyle()}>
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Product Name - Center */}
                          <h4 className="font-medium leading-relaxed mb-5 relative z-10 text-xl text-center tracking-wide" 
                              style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 2px rgba(0,0,0,0.05)', color: fontColor }}>
                            {product.name}
                          </h4>
                          
                          {/* Product Details - Bottom Centered */}
                          <div className="space-y-3 relative z-10 text-sm">
                            {product.sku && (
                              <div className="text-center pt-3 border-t" 
                                   style={{ borderTopColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)' }}>
                                <div className="mb-1 font-medium tracking-wide" 
                                     style={{ fontFamily: 'Tiempo, serif', color: `${fontColor}cc` }}>SKU</div>
                                <div className="font-mono text-xs" style={{ color: fontColor }}>{product.sku}</div>
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
          <div className="animate-spin rounded-full h-14 w-14 border-b-3 border-slate-600 mx-auto mb-6"></div>
          <p className="text-2xl tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, color: fontColor }}>Loading Menu...</p>
          <p className="text-sm text-slate-500 mt-3 font-medium">Preparing premium display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen text-slate-900 overflow-hidden flex flex-col relative" 
         style={{ background: `linear-gradient(to bottom right, ${backgroundColor}, ${backgroundColor}dd, ${backgroundColor}bb)`, color: fontColor }}>
      
      {/* Header - Hide in dual menu mode */}
      {!isDualMenu && (
        <div className={`backdrop-blur-md border-b px-8 flex-shrink-0 relative z-10 shadow-lg ${
          orientation === 'vertical' ? 'py-4' : 'py-3'
        }`} style={getHeaderStyle()}>
          <div className={`flex flex-col items-center relative z-10 ${
            orientation === 'vertical' ? 'gap-1' : 'gap-0'
          }`}>
            {/* Title - Centered */}
            <div className="text-center">
              <h1 className={`tracking-wide ${
                orientation === 'vertical' ? 'text-8xl' : 'text-7xl'
              }`} style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                {selectedCategoryName ? `${selectedCategoryName} Menu` : 'Flora Menu'}
              </h1>
              {/* Premium title underline effect */}
              <div className="w-40 h-px mx-auto mt-4 opacity-80" 
                   style={{ background: `linear-gradient(to right, transparent, ${fontColor}80, transparent)` }}>
              </div>
              {/* Elegant shimmer effect */}
              <div className="w-24 h-px mx-auto mt-1 opacity-40 animate-pulse" 
                   style={{ background: `linear-gradient(to right, transparent, ${fontColor}60, transparent)`, animationDuration: '3s' }}>
              </div>
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
          /* Dual Menu Layout - Side by Side with Optional Stacking */
          <div className="flex h-full">
            {/* Left Side */}
            <div className="w-1/2 flex flex-col border border-slate-200/40 border-r-1 shadow-xl rounded-l-xl overflow-hidden">
              {enableLeftStacking ? (
                /* Left Side - Stacked Layout */
                <div className="flex flex-col h-full">
                  {/* Top Left Menu */}
                  <div className="flex-1 flex flex-col border-b border-slate-200/40">
                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={getHeaderStyle()}>
                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                        {leftMenuCategory ? categories.find(c => c.slug === leftMenuCategory)?.name || 'Top Left' : 'Top Left'}
                      </h1>
                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                      <div className="w-full flex justify-center mt-1">
                        {renderHeaderPricing(leftMenuCategory ? displayProducts.filter(product => 
                          product.categories?.some(cat => cat.slug === leftMenuCategory)
                        ) : [], orientation)}
                      </div>
                    </div>
                    <div className="flex-1">
                      {renderMenuSection(leftMenuCategory, undefined, true)}
                    </div>
                  </div>
                  
                  {/* Bottom Left Menu */}
                  <div className="flex-1 flex flex-col">
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
                      {renderMenuSection(leftMenuCategory2, undefined, true)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Left Side - Single Layout */
                <>
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
                    {renderMenuSection(leftMenuCategory, undefined, true)}
                  </div>
                </>
              )}
            </div>
            
            {/* Right Side */}
            <div className="w-1/2 flex flex-col border border-slate-200/40 border-l-1 shadow-xl rounded-r-xl overflow-hidden">
              {enableRightStacking ? (
                /* Right Side - Stacked Layout */
                <div className="flex flex-col h-full">
                  {/* Top Right Menu */}
                  <div className="flex-1 flex flex-col border-b border-slate-200/40">
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
                      {renderMenuSection(rightMenuCategory, undefined, false)}
                    </div>
                  </div>
                  
                  {/* Bottom Right Menu */}
                  <div className="flex-1 flex flex-col">
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
                      {renderMenuSection(rightMenuCategory2, undefined, false)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Right Side - Single Layout */
                <>
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
                    {renderMenuSection(rightMenuCategory, undefined, false)}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Single Menu Layout */
          <div className="flex-1 overflow-y-auto pb-8" style={getBackgroundStyle()}>
            {productsByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-2xl mb-3" style={{ color: fontColor }}>
                    {selectedCategoryName 
                      ? `No ${selectedCategoryName.toLowerCase()} products currently available`
                      : 'No products currently available'
                    }
                  </p>
                  <p className="text-lg text-gray-600">Check back soon for updates</p>
                </div>
              </div>
            ) : (
              <div className={`${orientation === 'vertical' ? 'space-y-6' : 'space-y-8'} pb-6 pt-4`} 
                   style={getBackgroundStyle()}>
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category.id}>
                    {/* Category Header - Only show if not filtered to single category */}
                    {!selectedCategoryName && (
                      <div className="backdrop-blur-md px-8 py-4 border-b relative rounded-t-xl shadow-lg" 
                           style={getHeaderStyle()}>
                        <h2 className={`font-medium uppercase tracking-widest relative z-10 ${
                          orientation === 'vertical' ? 'text-lg' : 'text-xl'
                        }`} style={{ fontFamily: 'Tiempo, serif', letterSpacing: '0.15em', color: fontColor }}>
                          {category.name}
                        </h2>
                        <div className="w-28 h-px mt-3" 
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
                          <div className={`grid gap-6 pt-4 pb-4 ${useSingleColumn ? 'grid-cols-1 justify-center' : 'grid-cols-2'}`} 
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
                                                isFirstColumn ? 'block truncate' : ''
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
                                                  isFirstColumn ? 'block truncate' : ''
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
                      <div className={`grid gap-2 px-6 pt-4 pb-4 ${
                        orientation === 'vertical' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      }`} style={getBackgroundStyle()}>
                        {categoryProducts.map(product => (
                          <div key={product.id} 
                               className="rounded-lg overflow-hidden p-2 relative cursor-pointer transition-all duration-200 ease-out border hover:border-slate-400/50 hover:shadow-md"
                               style={getContainerStyle()}>
                            
                            {/* Product Image and Name Row */}
                            <div className="flex gap-4 items-center mb-4">
                              {/* Product Image */}
                              <div className="w-16 h-16 relative overflow-hidden flex-shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt={product.name}
                                       className="w-full h-full object-contain" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded" 
                                       style={getContainerStyle()}>
                                    <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold leading-tight mb-1 truncate ${
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