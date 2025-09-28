'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { ColumnSelector } from './ColumnSelector';
import { Product, Category } from '../../types';

// VSCode-style Dropdown Component
const ToolbarDropdown = ({ 
  label, 
  icon, 
  isActive = false, 
  children, 
  className = "" 
}: { 
  label: string; 
  icon: React.ReactNode; 
  isActive?: boolean; 
  children: React.ReactNode; 
  className?: string; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative z-10 ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ease-out ${
          isActive || isOpen
            ? 'bg-neutral-700/90 text-white border border-neutral-500/70'
            : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-transparent hover:border-neutral-600/50'
        }`}
        title={label}
      >
        {icon}
        <span className="whitespace-nowrap font-medium">{label}</span>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-neutral-800/95 backdrop-blur-sm border border-neutral-600/50 rounded-lg shadow-xl z-[9999] min-w-56 max-h-96 overflow-y-auto ${
          className?.includes('dropdown-right') ? 'right-0' : 'left-0'
        }`}>
          <div className="py-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// Dropdown Menu Item Component
const DropdownItem = ({ 
  icon, 
  label, 
  isActive = false, 
  onClick, 
  disabled = false,
  description
}: { 
  icon?: React.ReactNode; 
  label: string; 
  isActive?: boolean; 
  onClick: () => void; 
  disabled?: boolean;
  description?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ease-out ${
      disabled
        ? 'text-neutral-500 cursor-not-allowed'
        : isActive
        ? 'bg-neutral-700/80 text-white border-l-2 border-blue-500'
        : 'text-neutral-300 hover:text-white hover:bg-neutral-700/60'
    }`}
  >
    {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
    <div className="flex-1 text-left">
      <div className="font-medium">{label}</div>
      {description && <div className="text-xs text-neutral-400 mt-0.5">{description}</div>}
    </div>
    {isActive && (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </button>
);

// Dropdown Separator
const DropdownSeparator = () => (
  <div className="h-px bg-neutral-600/50 my-2 mx-2" />
);

// Color Picker Component for Dropdowns
const ColorPickerItem = ({ 
  label, 
  value, 
  onChange,
  description
}: { 
  label: string; 
  value: string; 
  onChange: (color: string) => void;
  description?: string;
}) => (
  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-700/60 transition-colors">
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-8 h-8 rounded-md border border-neutral-600/50 bg-transparent cursor-pointer"
    />
    <div className="flex-1">
      <div className="text-sm font-medium text-neutral-300">{label}</div>
      {description && <div className="text-xs text-neutral-400 mt-0.5">{description}</div>}
    </div>
  </div>
);

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
  const [leftMenuCategory, setLeftMenuCategory] = useState<string | null>(null);
  const [rightMenuCategory, setRightMenuCategory] = useState<string | null>(null);
  // Vertical stacking support
  const [leftMenuCategory2, setLeftMenuCategory2] = useState<string | null>(null);
  const [rightMenuCategory2, setRightMenuCategory2] = useState<string | null>(null);
  const [leftMenuImages2, setLeftMenuImages2] = useState<boolean>(true);
  const [rightMenuImages2, setRightMenuImages2] = useState<boolean>(true);
  const [enableLeftStacking, setEnableLeftStacking] = useState<boolean>(false);
  const [enableRightStacking, setEnableRightStacking] = useState<boolean>(false);
  
  // Dual menu configuration mode
  const [dualMenuConfigSide, setDualMenuConfigSide] = useState<'left' | 'right' | null>(null);
  
  // Preview section selection for editing - Canva-style interaction
  const handlePreviewSectionClick = (section: 'left' | 'right' | 'left-bottom' | 'right-bottom') => {
    switch (section) {
      case 'left':
      case 'left-bottom':
        setDualMenuConfigSide('left');
        break;
      case 'right':
      case 'right-bottom':
        setDualMenuConfigSide('right');
        break;
    }
  };
  
  // Independent configurations for each side
  const [leftMenuViewMode, setLeftMenuViewMode] = useState<'table' | 'card' | 'auto'>('auto');
  const [rightMenuViewMode, setRightMenuViewMode] = useState<'table' | 'card' | 'auto'>('auto');
  const [leftMenuColumns, setLeftMenuColumns] = useState<Map<string, string[]>>(new Map());
  const [rightMenuColumns, setRightMenuColumns] = useState<Map<string, string[]>>(new Map());
  // Color customization
  const [backgroundColor, setBackgroundColor] = useState<string>('#f5f5f4'); // stone-100
  const [fontColor, setFontColor] = useState<string>('#1f2937'); // gray-800
  const [containerColor, setContainerColor] = useState<string>('#d1d5db'); // gray-300
  const [pandaMode, setPandaMode] = useState<boolean>(false); // Panda mode for white font/black background
  const [openWindows, setOpenWindows] = useState<Map<string, Window>>(new Map());
  // Per-category column selection state
  const [categoryColumnConfigs, setCategoryColumnConfigs] = useState<Map<string, string[]>>(new Map());
  const [categoryBlueprintFields, setCategoryBlueprintFields] = useState<Map<string, ProductBlueprintFields[]>>(new Map());

  // Get columns for the current selected category or default
  const getCurrentCategoryColumns = (categorySlug?: string): string[] => {
    if (!categorySlug) return ['name'];
    
    // Get the configured columns for this category
    const configuredColumns = categoryColumnConfigs.get(categorySlug);
    
    if (configuredColumns && configuredColumns.length > 0) {
      return configuredColumns;
    }
    
    // Default - just show product name, user must explicitly select other columns
    return ['name'];
  };

  // Handle panda mode toggle
  const handlePandaModeToggle = () => {
    const newPandaMode = !pandaMode;
    setPandaMode(newPandaMode);
    
    if (newPandaMode) {
      // Panda mode: pure black and white with subtle borders
      setBackgroundColor('#000000'); // Pure Black
      setFontColor('#ffffff'); // Pure White
      setContainerColor('#000000'); // Pure Black containers with white borders
    } else {
      // Normal mode: dark font, light backgrounds
      setBackgroundColor('#f5f5f4'); // Stone-100
      setFontColor('#1f2937'); // Gray-800
      setContainerColor('#d1d5db'); // Gray-300
    }
  };

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
    
    // Build URL with orientation, view mode, images, colors, table styling, column selection, and category parameters
    const urlParams = new URLSearchParams({
      orientation: orientation,
      viewMode: viewMode,
      showImages: isDual ? 'dual' : showImages.toString(),
      backgroundColor: encodeURIComponent(backgroundColor),
      fontColor: encodeURIComponent(fontColor),
      containerColor: encodeURIComponent(containerColor),
      pandaMode: pandaMode.toString(),
      categoryColumnConfigs: encodeURIComponent(JSON.stringify(Object.fromEntries(categoryColumnConfigs))),
      windowId: windowId,
      ...(categorySlug && { category: categorySlug }),
      ...(isDual && { 
        dual: 'true',
        leftCategory: leftMenuCategory || '',
        rightCategory: rightMenuCategory || '',
        leftImages: leftMenuImages.toString(),
        rightImages: rightMenuImages.toString(),
        leftViewMode: leftMenuViewMode,
        rightViewMode: rightMenuViewMode,
        leftColumns: encodeURIComponent(JSON.stringify(Object.fromEntries(leftMenuColumns))),
        rightColumns: encodeURIComponent(JSON.stringify(Object.fromEntries(rightMenuColumns))),
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
        // Prepare blueprint fields data for the category
        const blueprintFieldsData: Record<string, ProductBlueprintFields[]> = {};
        if (categorySlug && categoryBlueprintFields.has(categorySlug)) {
          blueprintFieldsData[categorySlug] = categoryBlueprintFields.get(categorySlug)!;
        } else {
          // Include all loaded blueprint fields for dual menus or all categories view
          categoryBlueprintFields.forEach((fields, slug) => {
            blueprintFieldsData[slug] = fields;
          });
        }

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
          pandaMode: pandaMode,
          categoryColumnConfigs: Object.fromEntries(categoryColumnConfigs),
          categoryBlueprintFields: blueprintFieldsData,
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
  }, [products, orientation, viewMode, showImages, backgroundColor, fontColor, containerColor, pandaMode, leftMenuImages, rightMenuImages, leftMenuImages2, rightMenuImages2, leftMenuCategory, rightMenuCategory, leftMenuCategory2, rightMenuCategory2, enableLeftStacking, enableRightStacking]);


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
  const LiveMenuPreview = ({ products: previewProducts, categories: previewCategories, orientation: previewOrient, viewMode: previewViewMode, showImages: previewShowImages, backgroundColor: previewBg, fontColor: previewFont, containerColor: previewContainer, pandaMode: previewPanda, categoryFilter, hideHeaders = false }: {
    products: Product[];
    categories: Category[];
    orientation: 'horizontal' | 'vertical';
    viewMode: 'table' | 'card' | 'auto';
    showImages: boolean;
    backgroundColor: string;
    fontColor: string;
    containerColor: string;
    pandaMode: boolean;
    categoryFilter?: string;
    hideHeaders?: boolean;
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
      <div 
        className="h-full overflow-hidden flex flex-col border-2"
        style={{ 
          background: `linear-gradient(to bottom right, ${previewBg}, ${previewBg}dd, ${previewBg}bb)`,
          color: previewFont,
          borderColor: previewPanda ? '#ffffff33' : '#e5e7eb'
        }}
      >
        {/* Header */}
        {!hideHeaders && (
          <div 
            className={`border-b px-6 flex-shrink-0 relative z-10 ${
              previewOrient === 'vertical' ? 'py-3' : 'py-2'
            }`}
            style={{
              background: previewPanda 
                ? 'linear-gradient(to right, #000000, #000000, #000000)'
                : `linear-gradient(to right, ${previewContainer}f2, ${previewContainer}e6, ${previewContainer}f2)`,
              borderBottomColor: previewPanda ? '#ffffff33' : '#e5e7eb'
            }}
          >
            <div className={`flex flex-col items-center relative z-10 ${
              previewOrient === 'vertical' ? 'gap-1' : 'gap-0'
            }`}>
              <div className="text-center">
                <h1 
                  className={`font-bold ${
                    previewOrient === 'vertical' ? 'text-8xl' : 'text-7xl'
                  }`} 
                  style={{ fontFamily: 'Tiempo, serif', color: previewFont }}
                >
                  {categoryFilter ? `${previewCategories.find(c => c.slug === categoryFilter)?.name || categoryFilter} Menu` : 'Flora Menu'}
                </h1>
                <div 
                  className="w-32 h-0.5 mx-auto mt-3 opacity-60"
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${previewFont}66, transparent)` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 h-full overflow-y-auto pb-8" style={{ backgroundColor: previewPanda ? '#000000' : previewBg }}>
          {productsByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-2xl mb-3" style={{ color: previewFont }}>No products currently available</p>
                <p className="text-lg text-gray-600">Check back soon for updates</p>
              </div>
            </div>
          ) : (
            <div className={`${previewOrient === 'vertical' ? 'space-y-6' : 'space-y-8'} p-4 pb-8 pt-4`} style={{ backgroundColor: previewPanda ? '#000000' : previewBg }}>
              {productsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category.id}>
                    {!categoryFilter && !hideHeaders && (
                      <div 
                        className="px-6 py-3 border-b relative rounded-t-lg"
                        style={{
                          background: previewPanda 
                            ? 'linear-gradient(to right, #000000, #000000, #000000)'
                            : `linear-gradient(to right, ${previewContainer}f2, ${previewContainer}e6, ${previewContainer}f2)`,
                          borderBottomColor: previewPanda ? '#ffffff33' : '#e5e7eb'
                        }}
                      >
                        <h2 
                          className={`font-bold uppercase tracking-wider relative z-10 ${
                            previewOrient === 'vertical' ? 'text-lg' : 'text-xl'
                          }`} 
                          style={{ fontFamily: 'Tiempo, serif', color: previewFont }}
                        >
                          {category.name}
                        </h2>
                        <div 
                          className="w-24 h-0.5 mt-2"
                          style={{ 
                            background: `linear-gradient(to right, transparent, ${previewFont}60, transparent)` 
                          }}
                        ></div>
                      </div>
                    )}
                  
                  {getActualViewMode(category.name) === 'table' ? (
                    /* Table Layout - Match actual TV menu structure */
                    (() => {
                      const categoryColumns = getCurrentCategoryColumns(categoryFilter);
                      // Don't limit products too much - we need to show 2 columns when appropriate
                      const limitedProducts = categoryProducts.slice(0, previewOrient === 'vertical' ? 30 : 20);
                      const { leftColumn, rightColumn } = (() => {
                        const totalProducts = limitedProducts.length;
                        if (totalProducts <= 13) {
                          return { leftColumn: limitedProducts, rightColumn: [] };
                        }
                        const leftColumnCount = Math.ceil(totalProducts / 2);
                        return {
                          leftColumn: limitedProducts.slice(0, leftColumnCount),
                          rightColumn: limitedProducts.slice(leftColumnCount)
                        };
                      })();
                      const useSingleColumn = rightColumn.length === 0;
                      
                      return (
                        <div className={`grid gap-6 pt-4 pb-4 ${useSingleColumn ? 'grid-cols-1 justify-center' : 'grid-cols-2'}`} 
                             style={{ backgroundColor: previewPanda ? '#000000' : previewBg }}>
                          {/* Left Column */}
                          <div className="space-y-2">
                            {leftColumn.map((product, index) => (
                              <div key={product.id} 
                                   className="overflow-visible cursor-pointer transition-all duration-200 ease-out hover:shadow-md"
                                   style={{
                                     backgroundColor: previewPanda ? '#000000' : (index % 2 === 1 ? '#ffffff' : previewContainer),
                                     border: previewPanda ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${previewContainer}`,
                                     borderRadius: '8px',
                                     padding: '8px',
                                     color: previewFont,
                                     transition: 'all 0.2s ease-out'
                                   }}>
                                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${categoryColumns.length}, 1fr)` }}>
                                  {categoryColumns.map((columnName, colIndex) => {
                                    const value = getColumnValue(product, columnName, categoryFilter);
                                    const isFirstColumn = colIndex === 0;
                                    return (
                                      <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                        {isFirstColumn && previewShowImages && (
                                          <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                            {product.image ? (
                                              <img src={product.image} alt={product.name}
                                                   className="w-full h-full object-contain rounded" loading="lazy" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center rounded" 
                                                   style={{ backgroundColor: previewPanda ? '#000000' : previewContainer }}>
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
                                            color: isFirstColumn ? previewFont : `${previewFont}dd` 
                                          }}>
                                            {value || 'N/A'}
                                          </span>
                                          {isFirstColumn && columnName === 'name' && product.sku && (
                                            <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${previewFont}cc` }}>
                                              {product.sku}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Right Column - Only render if not single column */}
                          {!useSingleColumn && (
                            <div className="space-y-2">
                              {rightColumn.map((product, index) => (
                                <div key={product.id} 
                                     className="overflow-visible cursor-pointer transition-all duration-200 ease-out hover:shadow-md"
                                     style={{
                                       backgroundColor: previewPanda ? '#000000' : (index % 2 === 1 ? '#ffffff' : previewContainer),
                                       border: previewPanda ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${previewContainer}`,
                                       borderRadius: '8px',
                                       padding: '8px',
                                       color: previewFont,
                                       transition: 'all 0.2s ease-out'
                                     }}>
                                  <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${categoryColumns.length}, 1fr)` }}>
                                    {categoryColumns.map((columnName, colIndex) => {
                                      const value = getColumnValue(product, columnName, categoryFilter);
                                      const isFirstColumn = colIndex === 0;
                                      return (
                                        <div key={columnName} className={`${isFirstColumn ? 'flex items-center gap-4' : 'text-center'}`}>
                                          {isFirstColumn && previewShowImages && (
                                            <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                                              {product.image ? (
                                                <img src={product.image} alt={product.name}
                                                     className="w-full h-full object-contain rounded" loading="lazy" />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center rounded" 
                                                     style={{ backgroundColor: previewPanda ? '#000000' : previewContainer }}>
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
                                              color: isFirstColumn ? previewFont : `${previewFont}dd` 
                                            }}>
                                              {value || 'N/A'}
                                            </span>
                                            {isFirstColumn && columnName === 'name' && product.sku && (
                                              <p className="text-xs mt-1" style={{ fontFamily: 'Tiempo, serif', color: `${previewFont}cc` }}>
                                                {product.sku}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className={`grid gap-2 px-6 pt-4 pb-4 ${
                      previewOrient === 'vertical' 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    }`}>
                      {categoryProducts.slice(0, previewOrient === 'vertical' ? 12 : 20).map(product => (
                        <div 
                          key={product.id} 
                          className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
                            previewOrient === 'vertical' ? 'p-6' : 'p-5'
                          } border hover:scale-105 shadow-sm hover:shadow-md backdrop-blur-sm`}
                          style={{
                            backgroundColor: previewPanda ? '#000000' : '#ffffff95',
                            borderColor: previewPanda ? '#ffffff33' : '#e5e7eb'
                          }}
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
                          
                          <h3 className={`font-semibold leading-tight mb-4 relative z-10 text-center ${
                            previewOrient === 'vertical' ? 'text-xl' : 'text-lg'
                          }`} style={{ fontFamily: 'Tiempo, serif', color: previewFont }}>
                            {product.name}
                          </h3>
                          
                          <div className={`space-y-3 relative z-10 ${
                            previewOrient === 'vertical' ? 'text-sm' : 'text-xs'
                          }`}>
                            {product.sku && (
                              <div 
                                className="text-center pt-2 border-t"
                                style={{ borderTopColor: previewPanda ? '#ffffff33' : '#e5e7eb' }}
                              >
                                <div className="mb-1" style={{ fontFamily: 'Tiempo, serif', color: `${previewFont}cc` }}>SKU</div>
                                <div className="font-mono text-xs" style={{ color: previewFont }}>{product.sku}</div>
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

  // Load blueprint fields for a category
  const loadCategoryBlueprintFields = useCallback(async (categorySlug: string) => {
    if (categoryBlueprintFields.has(categorySlug)) {
      return; // Already loaded
    }

    const category = getUniqueCategories().find(cat => cat.slug === categorySlug);
    if (!category) return;

    try {
      console.log(`🔍 [MenuView] Loading blueprint fields for category: ${category.name}`);
      const fields = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
      
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, fields));
      console.log(`✅ [MenuView] Loaded ${fields.length} products with blueprint fields for ${category.name}`);
    } catch (error) {
      console.warn(`⚠️ [MenuView] Failed to load blueprint fields for ${category.name}:`, error);
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, []));
    }
  }, [categoryBlueprintFields]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with location ID for stock filtering
      const params = new URLSearchParams({
        per_page: '1000',
        _t: Date.now().toString()
      });
      
      if (user?.location_id) {
        params.append('location_id', user.location_id);
      }

      const response = await fetch(`/api/proxy/flora-im/products?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Products are already filtered by stock at API level
        const filteredProducts = result.data;

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

  // Load blueprint fields for all categories when products are loaded
  useEffect(() => {
    const loadAllCategoryFields = async () => {
      const categories = getUniqueCategories();
      
      // Load blueprint fields for all categories in parallel
      const loadPromises = categories.map(async (category) => {
        if (!categoryBlueprintFields.has(category.slug)) {
          try {
            console.log(`🔍 [MenuView] Loading blueprint fields for category: ${category.name}`);
            const fields = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
            setCategoryBlueprintFields(prev => new Map(prev).set(category.slug, fields));
            console.log(`✅ [MenuView] Loaded ${fields.length} products with blueprint fields for ${category.name}`);
          } catch (error) {
            console.warn(`⚠️ [MenuView] Failed to load blueprint fields for ${category.name}:`, error);
            setCategoryBlueprintFields(prev => new Map(prev).set(category.slug, []));
          }
        }
      });
      
      await Promise.all(loadPromises);
    };

    if (products.length > 0) {
      loadAllCategoryFields();
    }
  }, [products]);

  // Load blueprint fields when category selection changes (for immediate feedback)
  useEffect(() => {
    if (selectedMenuCategory) {
      loadCategoryBlueprintFields(selectedMenuCategory);
    }
  }, [selectedMenuCategory, loadCategoryBlueprintFields]);

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
    return <LoadingSpinner size="lg" />;
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
      {/* VSCode-Style Toolbar */}
      <div className="mb-6 relative z-50">
        <div className="flex items-center justify-between bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/50 rounded-lg px-4 py-3">
          {/* Left Side - Dropdown Menus */}
          <div className="flex items-center gap-3">
            
            {/* Layout Dropdown */}
            <ToolbarDropdown
              label="Layout"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              }
              isActive={orientation === 'horizontal' || viewMode !== 'auto'}
            >
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} /></svg>}
                label="Horizontal"
                description="Wide landscape layout"
                isActive={orientation === 'horizontal'}
                onClick={() => setOrientation('horizontal')}
              />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} /></svg>}
                label="Vertical"
                description="Tall portrait layout"
                isActive={orientation === 'vertical'}
                onClick={() => setOrientation('vertical')}
              />
              <DropdownSeparator />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                label="Auto View"
                description="Smart view based on content"
                isActive={viewMode === 'auto'}
                onClick={() => setViewMode('auto')}
              />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-18-8v8a2 2 0 002 2h16a2 2 0 002-2v-8M5 6V4a2 2 0 012-2h10a2 2 0 012 2v2" /></svg>}
                label="Table View"
                description="Structured data layout"
                isActive={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                label="Card View"
                description="Visual card layout"
                isActive={viewMode === 'card'}
                onClick={() => setViewMode('card')}
              />
            </ToolbarDropdown>

            {/* Display Dropdown */}
            <ToolbarDropdown
              label="Display"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
              }
              isActive={showImages || pandaMode}
            >
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" /></svg>}
                label="Show Images"
                description="Display product images"
                isActive={showImages}
                onClick={() => setShowImages(true)}
              />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>}
                label="Hide Images"
                description="Text-only display"
                isActive={!showImages}
                onClick={() => setShowImages(false)}
              />
              <DropdownSeparator />
              <DropdownItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                label="Dark Theme"
                description="High contrast dark mode"
                isActive={pandaMode}
                onClick={handlePandaModeToggle}
              />
            </ToolbarDropdown>

            {/* Colors Dropdown */}
            <ToolbarDropdown
              label="Colors"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h2a2 2 0 012 2v12a4 4 0 01-4 4h-2a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
              }
            >
              <ColorPickerItem
                label="Background"
                description="Menu background color"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
              <ColorPickerItem
                label="Text Color"
                description="Primary text color"
                value={fontColor}
                onChange={setFontColor}
              />
              <ColorPickerItem
                label="Container"
                description="Card container color"
                value={containerColor}
                onChange={setContainerColor}
              />
            </ToolbarDropdown>

            {/* Dual Menu Config Dropdown - Only show when horizontal */}
            {orientation === 'horizontal' && (
              <ToolbarDropdown
                label="Dual Config"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                }
                isActive={!!dualMenuConfigSide}
              >
                {/* Side Selection */}
                <div className="px-4 py-2 border-b border-neutral-600/30">
                  <div className="text-xs text-neutral-400 font-medium mb-2">CONFIGURE SIDE</div>
                  <DropdownItem
                    icon={<svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" /></svg>}
                    label="Configure Left Menu"
                    description="Set left side options"
                    isActive={dualMenuConfigSide === 'left'}
                    onClick={() => setDualMenuConfigSide('left')}
                  />
                  <DropdownItem
                    icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" /></svg>}
                    label="Configure Right Menu"
                    description="Set right side options"
                    isActive={dualMenuConfigSide === 'right'}
                    onClick={() => setDualMenuConfigSide('right')}
                  />
                  <DropdownItem
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                    label="Clear Selection"
                    description="Deselect all preview sections"
                    isActive={!dualMenuConfigSide}
                    onClick={() => setDualMenuConfigSide(null)}
                  />
            </div>

                {/* View Mode Configuration for Selected Side */}
                {dualMenuConfigSide && (
                  <div className="px-4 py-2 border-b border-neutral-600/30">
                    <div className={`text-xs font-medium mb-2 ${
                      dualMenuConfigSide === 'left' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {dualMenuConfigSide.toUpperCase()} MENU VIEW MODE
                    </div>
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      label="Auto View"
                      description="Smart view based on content"
                      isActive={dualMenuConfigSide === 'left' ? leftMenuViewMode === 'auto' : rightMenuViewMode === 'auto'}
                onClick={() => {
                    if (dualMenuConfigSide === 'left') {
                      setLeftMenuViewMode('auto');
                    } else {
                      setRightMenuViewMode('auto');
                        }
                      }}
                    />
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-18-8v8a2 2 0 002 2h16a2 2 0 002-2v-8M5 6V4a2 2 0 012-2h10a2 2 0 012 2v2" /></svg>}
                      label="Table View"
                      description="Structured data layout"
                      isActive={dualMenuConfigSide === 'left' ? leftMenuViewMode === 'table' : rightMenuViewMode === 'table'}
                onClick={() => {
                    if (dualMenuConfigSide === 'left') {
                      setLeftMenuViewMode('table');
                    } else {
                      setRightMenuViewMode('table');
                        }
                      }}
                    />
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                      label="Card View"
                      description="Visual card layout"
                      isActive={dualMenuConfigSide === 'left' ? leftMenuViewMode === 'card' : rightMenuViewMode === 'card'}
                onClick={() => {
                    if (dualMenuConfigSide === 'left') {
                      setLeftMenuViewMode('card');
                    } else {
                      setRightMenuViewMode('card');
                        }
                      }}
                    />
            </div>
                )}

                {/* Image Configuration for Selected Side */}
                {dualMenuConfigSide && (
                  <div className="px-4 py-2 border-b border-neutral-600/30">
                    <div className={`text-xs font-medium mb-2 ${
                      dualMenuConfigSide === 'left' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {dualMenuConfigSide.toUpperCase()} MENU IMAGES
                    </div>
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" /></svg>}
                      label="Show Images"
                      description="Display product images"
                      isActive={dualMenuConfigSide === 'left' ? leftMenuImages : rightMenuImages}
                onClick={() => {
                    if (dualMenuConfigSide === 'left') {
                      setLeftMenuImages(true);
                      if (enableLeftStacking) setLeftMenuImages2(true);
                    } else {
                      setRightMenuImages(true);
                      if (enableRightStacking) setRightMenuImages2(true);
                        }
                      }}
                    />
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>}
                      label="Hide Images"
                      description="Text-only display"
                      isActive={dualMenuConfigSide === 'left' ? !leftMenuImages : !rightMenuImages}
                onClick={() => {
                    if (dualMenuConfigSide === 'left') {
                      setLeftMenuImages(false);
                      if (enableLeftStacking) setLeftMenuImages2(false);
                    } else {
                      setRightMenuImages(false);
                      if (enableRightStacking) setRightMenuImages2(false);
                        }
                      }}
                    />
            </div>
                )}

                {/* Launch Dual Menu */}
                <div className="px-4 py-2">
                  <div className="text-xs text-neutral-400 font-medium mb-2">LAUNCH</div>
                  <DropdownItem
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" /></svg>}
                    label="Launch Dual Menu"
                    description="Split screen dual category menu"
                    isActive={!!(orientation === 'horizontal' && leftMenuCategory && rightMenuCategory)}
                    disabled={!(orientation === 'horizontal' && leftMenuCategory && rightMenuCategory)}
                onClick={() => {
                  const isDualEnabled = orientation === 'horizontal' && leftMenuCategory && rightMenuCategory;
                  if (isDualEnabled) {
                    launchDualMenu();
                  } else {
                    if (orientation !== 'horizontal') {
                      alert('Dual menu requires horizontal orientation');
                    } else {
                      alert('Please select categories for both left and right menus');
                    }
                  }
                }}
                  />
            </div>
              </ToolbarDropdown>
            )}

            </div>

          {/* Right Side - Categories Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Categories Dropdown */}
            <ToolbarDropdown
              label="Categories"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
              isActive={!!(selectedMenuCategory || leftMenuCategory || rightMenuCategory)}
              className="dropdown-right"
            >
              {/* Main Category Selection */}
              <div className="px-4 py-2 border-b border-neutral-600/30">
                <div className="text-xs text-neutral-400 font-medium mb-2">SINGLE MENU</div>
                <DropdownItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                  label="All Categories"
                  description="Show all products"
                  isActive={!selectedMenuCategory}
                  onClick={() => setSelectedMenuCategory(null)}
                />
                {getUniqueCategories().map(category => (
                  <DropdownItem
                    key={category.id}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                    label={category.name}
                    description={`${filteredProducts.filter(p => p.categories?.some(c => c.slug === category.slug)).length} products`}
                    isActive={selectedMenuCategory === category.slug}
                    onClick={() => setSelectedMenuCategory(category.slug)}
                  />
                ))}
          </div>

            {/* Dual Menu Configuration - Only show when horizontal */}
            {orientation === 'horizontal' && (
                <div className="px-4 py-2">
                  <div className="text-xs text-neutral-400 font-medium mb-2">DUAL MENU SETUP</div>

                {/* Left Menu Category */}
                  <div className="mb-3">
                    <div className="text-xs text-green-400 font-medium mb-1">Left Menu</div>
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" /></svg>}
                      label="None Selected"
                      description="Choose left category"
                      isActive={!leftMenuCategory}
                      onClick={() => setLeftMenuCategory(null)}
                    />
                  {getUniqueCategories().map(category => (
                      <DropdownItem
                        key={`left-${category.id}`}
                        icon={<svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                        label={category.name}
                        description="Left menu category"
                        isActive={leftMenuCategory === category.slug}
                        onClick={() => setLeftMenuCategory(category.slug)}
                      />
                    ))}
                  </div>

                {/* Right Menu Category */}
                  <div className="mb-3">
                    <div className="text-xs text-blue-400 font-medium mb-1">Right Menu</div>
                    <DropdownItem
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" /></svg>}
                      label="None Selected"
                      description="Choose right category"
                      isActive={!rightMenuCategory}
                      onClick={() => setRightMenuCategory(null)}
                    />
                  {getUniqueCategories().map(category => (
                      <DropdownItem
                        key={`right-${category.id}`}
                        icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                        label={category.name}
                        description="Right menu category"
                        isActive={rightMenuCategory === category.slug}
                        onClick={() => setRightMenuCategory(category.slug)}
                      />
                    ))}
                  </div>

                  {/* Stacking Options */}
                  <DropdownSeparator />
                  <div className="text-xs text-neutral-400 font-medium mb-2">STACKING OPTIONS</div>
                  <DropdownItem
                    icon={<svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7M4 12h7M4 18h7M15 9l3-3 3 3M15 15l3 3 3-3" /></svg>}
                    label="Enable Left Stacking"
                    description="Stack two categories on left"
                    isActive={enableLeftStacking}
                  onClick={() => setEnableLeftStacking(!enableLeftStacking)}
                  />
                  <DropdownItem
                    icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6h7M13 12h7M13 18h7M6 9l-3-3-3 3M6 15l-3 3-3-3" /></svg>}
                    label="Enable Right Stacking"
                    description="Stack two categories on right"
                    isActive={enableRightStacking}
                  onClick={() => setEnableRightStacking(!enableRightStacking)}
                  />

                  {/* Secondary Categories */}
                {enableLeftStacking && (
                    <div className="mt-3">
                      <div className="text-xs text-green-400 font-medium mb-1">Left Bottom Category</div>
                    {getUniqueCategories().map(category => (
                        <DropdownItem
                          key={`left2-${category.id}`}
                          icon={<svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                          label={category.name}
                          description="Left bottom category"
                          isActive={leftMenuCategory2 === category.slug}
                          onClick={() => setLeftMenuCategory2(category.slug)}
                        />
                      ))}
                    </div>
                  )}

                {enableRightStacking && (
                    <div className="mt-3">
                      <div className="text-xs text-blue-400 font-medium mb-1">Right Bottom Category</div>
                    {getUniqueCategories().map(category => (
                        <DropdownItem
                          key={`right2-${category.id}`}
                          icon={<svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                          label={category.name}
                          description="Right bottom category"
                          isActive={rightMenuCategory2 === category.slug}
                          onClick={() => setRightMenuCategory2(category.slug)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ToolbarDropdown>
            
            {/* Column Selector - Context Aware for Dual Menu */}
            <ColumnSelector
              categories={
                orientation === 'horizontal' && dualMenuConfigSide
                  ? getUniqueCategories().filter(c => 
                      c.slug === (dualMenuConfigSide === 'left' 
                        ? (enableLeftStacking && leftMenuCategory2 ? leftMenuCategory2 : leftMenuCategory)
                        : (enableRightStacking && rightMenuCategory2 ? rightMenuCategory2 : rightMenuCategory))
                    )
                  : getUniqueCategories()
              }
              selectedCategory={
                orientation === 'horizontal' && dualMenuConfigSide
                  ? (dualMenuConfigSide === 'left' 
                      ? (leftMenuCategory || undefined)
                      : (rightMenuCategory || undefined))
                  : (selectedMenuCategory || undefined)
              }
              categoryColumnConfigs={
                orientation === 'horizontal' && dualMenuConfigSide
                  ? (dualMenuConfigSide === 'left' ? leftMenuColumns : rightMenuColumns)
                  : categoryColumnConfigs
              }
              onColumnsChange={(categorySlug: string, columns: string[]) => {
                if (orientation === 'horizontal' && dualMenuConfigSide) {
                  if (dualMenuConfigSide === 'left') {
                    setLeftMenuColumns(prev => new Map(prev).set(categorySlug, columns));
                  } else {
                    setRightMenuColumns(prev => new Map(prev).set(categorySlug, columns));
                  }
                } else {
                  setCategoryColumnConfigs(prev => new Map(prev).set(categorySlug, columns));
                }
              }}
            />
            
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
          </div>
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
                        ? `${getUniqueCategories().find(c => c.slug === category)?.name || category}`
                        : 'All Categories'
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
      <div className="flex-1 rounded-lg overflow-hidden border border-neutral-500/30 bg-transparent relative z-0">
        
        <div className="relative bg-transparent p-6">
          {productsByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-white" style={{ fontFamily: 'Tiempo, serif' }}>No products available for preview</p>
                <p className="text-sm text-gray-400 mt-2" style={{ fontFamily: 'Tiempo, serif' }}>Add products to see live menu previews</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                {/* Single Preview - Switches to Dual Menu when configured */}
                <div className="relative group">
                  <button
                    onClick={() => {
                      // For single menu, set it as "left" configuration for consistency
                      // For dual menu setup, this will show the dual menu preview
                      setDualMenuConfigSide('left');
                    }}
                    className={`relative bg-neutral-800/40 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer ${
                      dualMenuConfigSide === 'left'
                        ? 'border-green-500/50 ring-2 ring-green-400/50 bg-green-50/5'
                        : 'border-neutral-500/30 hover:border-green-400/40 hover:bg-green-50/5 hover:ring-1 hover:ring-green-400/30'
                    }`}
                    style={orientation === 'horizontal' ? { width: '1200px', height: '675px' } : { width: '540px', height: '960px' }}
                    title="Click to select and configure this menu preview"
                  >
                    <div 
                      className="origin-top-left pointer-events-none"
                      style={orientation === 'horizontal' ? {
                        transform: 'scale(0.625)',
                        width: '1920px',
                        height: '1080px',
                      } : {
                        transform: 'scale(0.5)',
                        width: '1080px',
                        height: '1920px',
                      }}
                    >
                      {orientation === 'horizontal' && leftMenuCategory && rightMenuCategory ? (
                        /* Dual Menu Preview - Exact TV Menu Layout */
                        <div className="h-screen text-slate-900 overflow-hidden flex flex-col relative" 
                             style={{ background: `linear-gradient(to bottom right, ${backgroundColor}, ${backgroundColor}dd, ${backgroundColor}bb)`, color: fontColor }}>
                          
                          {/* Dual Menu Content */}
                          <div className="flex-1 overflow-hidden">
                            <div className="flex h-full">
                              {/* Left Side */}
                              <div className="w-1/2 flex flex-col border border-slate-200/40 border-r-1 shadow-xl rounded-l-xl overflow-hidden">
                                {enableLeftStacking ? (
                                  /* Left Side - Stacked Layout */
                                  <div className="flex flex-col h-full">
                                    {/* Top Left Menu */}
                                    <div 
                                      className={`flex-1 flex flex-col border-b border-slate-200/40 cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                        dualMenuConfigSide === 'left' ? 'ring-2 ring-green-400/50 bg-green-50/10' : ''
                                      }`}
                                      onClick={() => handlePreviewSectionClick('left')}
                                      title="Click to configure left menu"
                                    >
                                      <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                        background: pandaMode 
                                          ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                          : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                        borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                        color: fontColor
                                      }}>
                                        <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                            style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                          {leftMenuCategory ? getUniqueCategories().find(c => c.slug === leftMenuCategory)?.name || 'Top Left' : 'Top Left'}
                                        </h1>
                                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                        <div className="w-full flex justify-center mt-1">
                                          {/* Render pricing for left category */}
                                          {(() => {
                                            const leftProducts = filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory));
                                            const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                            
                                            leftProducts.forEach(product => {
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
                                              <div className="flex justify-center items-center flex-wrap gap-2">
                                                {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                  <div key={ruleName} className="flex items-center gap-1">
                                                    <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                      {ruleName}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {tiers.map((tier, index) => (
                                                        <div
                                                          key={`${ruleName}-${index}`}
                                                          className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                          style={{
                                                            backgroundColor: pandaMode ? '#000000' : containerColor,
                                                            border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                      <div className="w-px h-6 bg-gray-300 mx-2" />
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <LiveMenuPreview 
                                          products={filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory))}
                                          categories={getUniqueCategories().filter(c => c.slug === leftMenuCategory)}
                                          orientation={orientation}
                                          viewMode={leftMenuViewMode}
                                          showImages={leftMenuImages}
                                          backgroundColor={backgroundColor}
                                          fontColor={fontColor}
                                          containerColor={containerColor}
                                          pandaMode={pandaMode}
                                          categoryFilter={leftMenuCategory}
                                          hideHeaders={true}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Bottom Left Menu */}
                                    <div 
                                      className={`flex-1 flex flex-col cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                        dualMenuConfigSide === 'left' ? 'ring-2 ring-green-400/50 bg-green-50/10' : ''
                                      }`}
                                      onClick={() => handlePreviewSectionClick('left-bottom')}
                                      title="Click to configure left bottom menu"
                                    >
                                      <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                        background: pandaMode 
                                          ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                          : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                        borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                        color: fontColor
                                      }}>
                                        <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                            style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                          {leftMenuCategory2 ? getUniqueCategories().find(c => c.slug === leftMenuCategory2)?.name || 'Bottom Left' : 'Bottom Left'}
                                        </h1>
                                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                        {leftMenuCategory2 && (
                                          <div className="w-full flex justify-center mt-1">
                                            {/* Render pricing for left category 2 */}
                                            {(() => {
                                              const leftProducts2 = filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory2));
                                              const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                              
                                              leftProducts2.forEach(product => {
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
                                                <div className="flex justify-center items-center flex-wrap gap-2">
                                                  {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                    <div key={ruleName} className="flex items-center gap-1">
                                                      <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                        {ruleName}
                                                      </div>
                                                      <div className="flex gap-1">
                                                        {tiers.map((tier, index) => (
                                                          <div
                                                            key={`${ruleName}-${index}`}
                                                            className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                            style={{
                                                              backgroundColor: pandaMode ? '#000000' : containerColor,
                                                              border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                        <div className="w-px h-6 bg-gray-300 mx-2" />
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        {leftMenuCategory2 ? (
                                          <LiveMenuPreview 
                                            products={filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory2))}
                                            categories={getUniqueCategories().filter(c => c.slug === leftMenuCategory2)}
                                            orientation={orientation}
                                            viewMode={leftMenuViewMode}
                                            showImages={leftMenuImages2}
                                            backgroundColor={backgroundColor}
                                            fontColor={fontColor}
                                            containerColor={containerColor}
                                            pandaMode={pandaMode}
                                            categoryFilter={leftMenuCategory2}
                                            hideHeaders={true}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                              <p className="text-xl mb-3" style={{ color: fontColor }}>No category selected</p>
                                              <p className="text-sm text-gray-500">Select a bottom category for stacking</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Left Side - Single Layout */
                                  <div 
                                    className={`cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                      dualMenuConfigSide === 'left' ? 'ring-2 ring-green-400/50 bg-green-50/10' : ''
                                    }`}
                                    onClick={() => handlePreviewSectionClick('left')}
                                    title="Click to configure left menu"
                                  >
                                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                      background: pandaMode 
                                        ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                        : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                      borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                      color: fontColor
                                    }}>
                                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                        {leftMenuCategory ? getUniqueCategories().find(c => c.slug === leftMenuCategory)?.name || 'Left Menu' : 'Left Menu'}
                                      </h1>
                                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                      <div className="w-full flex justify-center mt-1">
                                        {/* Render pricing for left category */}
                                        {(() => {
                                          const leftProducts = filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory));
                                          const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                          
                                          leftProducts.forEach(product => {
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
                                            <div className="flex justify-center items-center flex-wrap gap-2">
                                              {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                <div key={ruleName} className="flex items-center gap-1">
                                                  <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                    {ruleName}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    {tiers.map((tier, index) => (
                                                      <div
                                                        key={`${ruleName}-${index}`}
                                                        className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                        style={{
                                                          backgroundColor: pandaMode ? '#000000' : containerColor,
                                                          border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                    <div className="w-px h-6 bg-gray-300 mx-2" />
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="flex-1" style={{ backgroundColor: pandaMode ? '#000000' : backgroundColor }}>
                                      <LiveMenuPreview 
                                        products={filteredProducts.filter(p => p.categories?.some(c => c.slug === leftMenuCategory))}
                                        categories={getUniqueCategories().filter(c => c.slug === leftMenuCategory)}
                                        orientation={orientation}
                                        viewMode={leftMenuViewMode}
                                        showImages={leftMenuImages}
                                        backgroundColor={backgroundColor}
                                        fontColor={fontColor}
                                        containerColor={containerColor}
                                        pandaMode={pandaMode}
                                        categoryFilter={leftMenuCategory}
                                        hideHeaders={true}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Side - Similar structure with right category pricing */}
                              <div className="w-1/2 flex flex-col border border-slate-200/40 border-l-1 shadow-xl rounded-r-xl overflow-hidden">
                                {enableRightStacking ? (
                                  /* Right Side - Stacked Layout */
                                  <div className="flex flex-col h-full">
                                    {/* Top Right Menu */}
                                    <div 
                                      className={`flex-1 flex flex-col border-b border-slate-200/40 cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                        dualMenuConfigSide === 'right' ? 'ring-2 ring-blue-400/50 bg-blue-50/10' : ''
                                      }`}
                                      onClick={() => handlePreviewSectionClick('right')}
                                      title="Click to configure right menu"
                                    >
                                      <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                        background: pandaMode 
                                          ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                          : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                        borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                        color: fontColor
                                      }}>
                                        <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                            style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                          {rightMenuCategory ? getUniqueCategories().find(c => c.slug === rightMenuCategory)?.name || 'Top Right' : 'Top Right'}
                                        </h1>
                                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                        <div className="w-full flex justify-center mt-1">
                                          {/* Render pricing for right category */}
                                          {(() => {
                                            const rightProducts = filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory));
                                            const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                            
                                            rightProducts.forEach(product => {
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
                                              <div className="flex justify-center items-center flex-wrap gap-2">
                                                {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                  <div key={ruleName} className="flex items-center gap-1">
                                                    <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                      {ruleName}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {tiers.map((tier, index) => (
                                                        <div
                                                          key={`${ruleName}-${index}`}
                                                          className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                          style={{
                                                            backgroundColor: pandaMode ? '#000000' : containerColor,
                                                            border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                      <div className="w-px h-6 bg-gray-300 mx-2" />
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      <div className="flex-1" style={{ backgroundColor: pandaMode ? '#000000' : backgroundColor }}>
                                        <LiveMenuPreview 
                                          products={filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory))}
                                          categories={getUniqueCategories().filter(c => c.slug === rightMenuCategory)}
                                          orientation={orientation}
                                          viewMode={rightMenuViewMode}
                                          showImages={rightMenuImages}
                                          backgroundColor={backgroundColor}
                                          fontColor={fontColor}
                                          containerColor={containerColor}
                                          pandaMode={pandaMode}
                                          categoryFilter={rightMenuCategory}
                                          hideHeaders={true}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Bottom Right Menu */}
                                    <div 
                                      className={`flex-1 flex flex-col cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                        dualMenuConfigSide === 'right' ? 'ring-2 ring-blue-400/50 bg-blue-50/10' : ''
                                      }`}
                                      onClick={() => handlePreviewSectionClick('right-bottom')}
                                      title="Click to configure right bottom menu"
                                    >
                                      <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                        background: pandaMode 
                                          ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                          : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                        borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                        color: fontColor
                                      }}>
                                        <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                            style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                          {rightMenuCategory2 ? getUniqueCategories().find(c => c.slug === rightMenuCategory2)?.name || 'Bottom Right' : 'Bottom Right'}
                                        </h1>
                                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                        {rightMenuCategory2 && (
                                          <div className="w-full flex justify-center mt-1">
                                            {/* Render pricing for right category 2 */}
                                            {(() => {
                                              const rightProducts2 = filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory2));
                                              const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                              
                                              rightProducts2.forEach(product => {
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
                                                <div className="flex justify-center items-center flex-wrap gap-2">
                                                  {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                    <div key={ruleName} className="flex items-center gap-1">
                                                      <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                        {ruleName}
                                                      </div>
                                                      <div className="flex gap-1">
                                                        {tiers.map((tier, index) => (
                                                          <div
                                                            key={`${ruleName}-${index}`}
                                                            className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                            style={{
                                                              backgroundColor: pandaMode ? '#000000' : containerColor,
                                                              border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                        <div className="w-px h-6 bg-gray-300 mx-2" />
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        {rightMenuCategory2 ? (
                                          <LiveMenuPreview 
                                            products={filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory2))}
                                            categories={getUniqueCategories().filter(c => c.slug === rightMenuCategory2)}
                                            orientation={orientation}
                                            viewMode={rightMenuViewMode}
                                            showImages={rightMenuImages2}
                                            backgroundColor={backgroundColor}
                                            fontColor={fontColor}
                                            containerColor={containerColor}
                                            pandaMode={pandaMode}
                                            categoryFilter={rightMenuCategory2}
                                            hideHeaders={true}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                              <p className="text-xl mb-3" style={{ color: fontColor }}>No category selected</p>
                                              <p className="text-sm text-gray-500">Select a bottom category for stacking</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Right Side - Single Layout */
                                  <div 
                                    className={`cursor-pointer transition-all duration-200 hover:bg-black/5 ${
                                      dualMenuConfigSide === 'right' ? 'ring-2 ring-blue-400/50 bg-blue-50/10' : ''
                                    }`}
                                    onClick={() => handlePreviewSectionClick('right')}
                                    title="Click to configure right menu"
                                  >
                                    <div className="backdrop-blur-md px-8 py-3 border-b border-slate-200/60 relative shadow-lg" style={{
                                      background: pandaMode 
                                        ? 'linear-gradient(to right, #000000, #000000, #000000)'
                                        : `linear-gradient(to right, ${containerColor}90, ${containerColor}85, ${containerColor}90)`,
                                      borderBottomColor: pandaMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.6)',
                                      color: fontColor
                                    }}>
                                      <h1 className="text-center relative z-10 tracking-wide text-6xl" 
                                          style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: 200, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: fontColor }}>
                                        {rightMenuCategory ? getUniqueCategories().find(c => c.slug === rightMenuCategory)?.name || 'Right Menu' : 'Right Menu'}
                                      </h1>
                                      <div className="w-32 h-px bg-gradient-to-r from-transparent via-slate-400/80 to-transparent mx-auto mt-3 opacity-70"></div>
                                      <div className="w-full flex justify-center mt-1">
                                        {/* Render pricing for right category */}
                                        {(() => {
                                          const rightProducts = filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory));
                                          const pricingTiers = new Map<string, { label: string; price: number; ruleName: string }>();
                                          
                                          rightProducts.forEach(product => {
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
                                            <div className="flex justify-center items-center flex-wrap gap-2">
                                              {Array.from(tiersByRule.entries()).map(([ruleName, tiers], ruleIndex) => (
                                                <div key={ruleName} className="flex items-center gap-1">
                                                  <div className="font-medium uppercase tracking-wider text-sm" style={{ fontFamily: 'Tiempo, serif', color: fontColor }}>
                                                    {ruleName}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    {tiers.map((tier, index) => (
                                                      <div
                                                        key={`${ruleName}-${index}`}
                                                        className="relative rounded-2xl px-4 py-3 transition-all duration-500 ease-out cursor-pointer border backdrop-blur-md hover:scale-105 shadow-lg hover:shadow-2xl group text-xs"
                                                        style={{
                                                          backgroundColor: pandaMode ? '#000000' : containerColor,
                                                          border: pandaMode ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${containerColor}`,
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
                                                    <div className="w-px h-6 bg-gray-300 mx-2" />
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <LiveMenuPreview 
                                        products={filteredProducts.filter(p => p.categories?.some(c => c.slug === rightMenuCategory))}
                                        categories={getUniqueCategories().filter(c => c.slug === rightMenuCategory)}
                                        orientation={orientation}
                                        viewMode={rightMenuViewMode}
                                        showImages={rightMenuImages}
                                        backgroundColor={backgroundColor}
                                        fontColor={fontColor}
                                        containerColor={containerColor}
                                        pandaMode={pandaMode}
                                        categoryFilter={rightMenuCategory}
                                        hideHeaders={true}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Single Menu Preview */
                        <LiveMenuPreview 
                          products={filteredProducts}
                          categories={getUniqueCategories()}
                          orientation={orientation}
                          viewMode={viewMode}
                          showImages={showImages}
                          backgroundColor={backgroundColor}
                          fontColor={fontColor}
                          containerColor={containerColor}
                          pandaMode={pandaMode}
                          categoryFilter={selectedMenuCategory || undefined}
                        />
                      )}
                    </div>
                    {/* Launch Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 ${
                        orientation === 'horizontal' && leftMenuCategory && rightMenuCategory
                          ? 'bg-green-500/90'
                          : 'bg-white/90'
                      }`}>
                        <svg className={`w-5 h-5 ${orientation === 'horizontal' && leftMenuCategory && rightMenuCategory ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {orientation === 'horizontal' && leftMenuCategory && rightMenuCategory ? (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
                            </>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          )}
                        </svg>
                        <span className={`font-medium text-sm ${orientation === 'horizontal' && leftMenuCategory && rightMenuCategory ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Tiempo, serif' }}>
                          {orientation === 'horizontal' && leftMenuCategory && rightMenuCategory
                            ? 'Launch Dual Menu'
                            : `Launch ${selectedMenuCategory 
                                ? getUniqueCategories().find(c => c.slug === selectedMenuCategory)?.name || 'Category'
                                : 'Menu'
                              }`
                          }
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-neutral-500/30">
          <div className="text-xs text-white text-center" style={{ fontFamily: 'Tiempo, serif' }}>
            Interactive menu preview • Click preview to launch TV menu • Updates automatically
          </div>
        </div>
      </div>

    </div>
  );
}
