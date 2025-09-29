'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { Product } from '../../types';
import { SharedMenuDisplay } from './SharedMenuDisplay';
import { MenuToolbar, useMenuConfig } from './MenuToolbar';

interface MenuViewProps {
  searchQuery?: string;
  categoryFilter?: string;
}

export function MenuView({ searchQuery = '', categoryFilter }: MenuViewProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Window management
  const [openWindows, setOpenWindows] = useState<Map<string, Window>>(new Map());
  
  // Category column configurations
  const [categoryColumnConfigs, setCategoryColumnConfigs] = useState<Map<string, string[]>>(new Map());
  
  // Blueprint fields cache
  const [categoryBlueprintFields, setCategoryBlueprintFields] = useState<Map<string, ProductBlueprintFields[]>>(new Map());

  // Load blueprint fields for a category
  const loadCategoryBlueprintFields = useCallback(async (categorySlug: string) => {
    if (categoryBlueprintFields.has(categorySlug)) return;

    const category = getUniqueCategories().find(c => c.slug === categorySlug);
    if (!category) return;

    try {
      const fields = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, fields));
    } catch (error) {
      console.warn(`Failed to load blueprint fields for ${category.name}:`, error);
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, []));
    }
  }, [categoryBlueprintFields]);
  
  // Use the simplified menu configuration hook
  const menuConfig = useMenuConfig();
  
  // Panda mode (dark theme)
  const [pandaMode, setPandaMode] = useState(false);

  const handlePandaModeToggle = () => {
    setPandaMode(prev => !prev);
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!user?.location_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
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
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} products`);
        setProducts(result.data);
        
        // Load blueprint pricing for all products
        try {
          const productsWithPricing = await Promise.all(
            result.data.map(async (product: Product) => {
              try {
                const pricing = await BlueprintPricingService.getProductPricing(product.id);
                return { ...product, blueprintPricing: pricing };
              } catch (err) {
                console.warn(`Failed to load pricing for product ${product.id}:`, err);
                return product;
              }
            })
          );
          setProducts(productsWithPricing);
        } catch (err) {
          console.warn('Failed to load blueprint pricing:', err);
        }
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

  // Load blueprint fields when menu configurations change
  useEffect(() => {
    const categoriesToLoad = new Set<string>();
    
    // Collect all categories that need blueprint fields loaded
    if (!menuConfig.isDualMode && menuConfig.singleMenu.category) {
      categoriesToLoad.add(menuConfig.singleMenu.category);
    } else if (menuConfig.isDualMode) {
      if (menuConfig.dualMenu.left.category) categoriesToLoad.add(menuConfig.dualMenu.left.category);
      if (menuConfig.dualMenu.right.category) categoriesToLoad.add(menuConfig.dualMenu.right.category);
      if (menuConfig.dualMenu.leftBottom?.category) categoriesToLoad.add(menuConfig.dualMenu.leftBottom.category);
      if (menuConfig.dualMenu.rightBottom?.category) categoriesToLoad.add(menuConfig.dualMenu.rightBottom.category);
    }
    
    // Load blueprint fields for each category
    categoriesToLoad.forEach(categorySlug => {
      loadCategoryBlueprintFields(categorySlug);
    });
  }, [menuConfig.isDualMode, menuConfig.singleMenu.category, menuConfig.dualMenu.left.category, menuConfig.dualMenu.right.category, menuConfig.dualMenu.leftBottom?.category, menuConfig.dualMenu.rightBottom?.category, loadCategoryBlueprintFields]);


  // Get unique categories
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

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      product.categories?.some(cat => cat.slug === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  // Open popout menu window
  const openPopoutMenu = (categorySlug?: string) => {
    const config = menuConfig.isDualMode ? menuConfig.dualMenu.left : menuConfig.singleMenu;
    const windowId = `menu-${Date.now()}`;
    
    const params = new URLSearchParams({
      orientation: menuConfig.orientation,
      viewMode: config.viewMode,
      showImages: config.showImages.toString(),
      backgroundColor: menuConfig.backgroundColor,
      fontColor: menuConfig.fontColor,
      containerColor: menuConfig.containerColor,
      location_id: user?.location_id?.toString() || '20', // Pass location_id for filtering
      _t: Date.now().toString(), // Add timestamp for cache busting
      ...(categorySlug && { category: categorySlug })
    });

    // Add column configurations for the category
    if (categorySlug) {
      const columns = categoryColumnConfigs.get(categorySlug);
      if (columns && columns.length > 0) {
        params.append('columns', columns.join(','));
      }
    }

    const newWindow = window.open(
      `/menu-display?${params.toString()}`,
      windowId,
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
    );

    if (newWindow) {
      setOpenWindows(prev => new Map(prev).set(windowId, newWindow));
    }
  };

  // Launch dual menu
  const launchDualMenu = () => {
    if (!menuConfig.dualMenu.left.category || !menuConfig.dualMenu.right.category) {
      alert('Please select categories for both left and right menus');
      return;
    }

    const windowId = `dual-menu-${Date.now()}`;
    const params = new URLSearchParams({
      dual: 'true',
      orientation: menuConfig.orientation,
      leftCategory: menuConfig.dualMenu.left.category,
      rightCategory: menuConfig.dualMenu.right.category,
      leftViewMode: menuConfig.dualMenu.left.viewMode,
      rightViewMode: menuConfig.dualMenu.right.viewMode,
      leftImages: menuConfig.dualMenu.left.showImages.toString(),
      rightImages: menuConfig.dualMenu.right.showImages.toString(),
      backgroundColor: menuConfig.backgroundColor,
      fontColor: menuConfig.fontColor,
      containerColor: menuConfig.containerColor,
      location_id: user?.location_id?.toString() || '20', // Pass location_id for filtering
      _t: Date.now().toString() // Add timestamp for cache busting
    });

    // Add column configurations for dual menu categories
    if (menuConfig.dualMenu.left.category) {
      const leftColumns = categoryColumnConfigs.get(menuConfig.dualMenu.left.category);
      if (leftColumns && leftColumns.length > 0) {
        params.append('leftColumns', leftColumns.join(','));
      }
    }
    if (menuConfig.dualMenu.right.category) {
      const rightColumns = categoryColumnConfigs.get(menuConfig.dualMenu.right.category);
      if (rightColumns && rightColumns.length > 0) {
        params.append('rightColumns', rightColumns.join(','));
      }
    }

    const newWindow = window.open(
      `/menu-display?${params.toString()}`,
      windowId,
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
    );

    if (newWindow) {
      setOpenWindows(prev => new Map(prev).set(windowId, newWindow));
    }
  };

  // Handle launch button
  const handleLaunch = () => {
    if (menuConfig.isDualMode && menuConfig.dualMenu.left.category && menuConfig.dualMenu.right.category) {
      launchDualMenu();
    } else {
      const categorySlug = menuConfig.isDualMode ? undefined : menuConfig.singleMenu.category || undefined;
      openPopoutMenu(categorySlug);
    }
  };

  // Close all windows
  const closeAllWindows = () => {
    openWindows.forEach(window => {
      if (!window.closed) {
        window.close();
      }
    });
    setOpenWindows(new Map());
  };

  // Clean up closed windows
  useEffect(() => {
    const interval = setInterval(() => {
      setOpenWindows(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        prev.forEach((window, id) => {
          if (window.closed) {
            newMap.delete(id);
            hasChanges = true;
          }
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const categories = getUniqueCategories();
  const openWindowsCount = Array.from(openWindows.values()).filter(w => !w.closed).length;
  const maxWindows = 8;

  const canLaunch = openWindowsCount < maxWindows;
  const launchTitle = menuConfig.isDualMode && menuConfig.dualMenu.left.category && menuConfig.dualMenu.right.category
    ? `Launch dual menu layout (${openWindowsCount}/${maxWindows} windows)`
    : `Launch ${menuConfig.orientation} ${menuConfig.singleMenu.viewMode} menu ${menuConfig.singleMenu.showImages ? 'with' : 'without'} images (${openWindowsCount}/${maxWindows} windows)`;

  return (
    <div className="flex-1 flex flex-col bg-transparent min-h-0 max-h-screen overflow-hidden">
      <MenuToolbar
        orientation={menuConfig.orientation}
        onOrientationChange={menuConfig.setOrientation}
        singleMenu={menuConfig.singleMenu}
        onSingleMenuChange={menuConfig.setSingleMenu}
        dualMenu={menuConfig.dualMenu}
        onDualMenuChange={menuConfig.setDualMenu}
        isDualMode={menuConfig.isDualMode}
        onModeChange={menuConfig.setIsDualMode}
        selectedQuadrant={menuConfig.selectedQuadrant}
        onQuadrantChange={menuConfig.setSelectedQuadrant}
        backgroundColor={menuConfig.backgroundColor}
        fontColor={menuConfig.fontColor}
        containerColor={menuConfig.containerColor}
        onColorsChange={({ backgroundColor, fontColor, containerColor }) => {
          menuConfig.setBackgroundColor(backgroundColor);
          menuConfig.setFontColor(fontColor);
          menuConfig.setContainerColor(containerColor);
        }}
        categories={categories}
        categoryColumnConfigs={categoryColumnConfigs}
        onColumnsChange={(categorySlug, columns) => {
          setCategoryColumnConfigs(prev => new Map(prev).set(categorySlug, columns));
          // Load blueprint fields for this category when columns are configured
          loadCategoryBlueprintFields(categorySlug);
        }}
        onLaunch={handleLaunch}
        canLaunch={canLaunch}
        launchTitle={launchTitle}
        openWindowsCount={openWindowsCount}
        maxWindows={maxWindows}
        pandaMode={pandaMode}
        onPandaModeToggle={handlePandaModeToggle}
      />

      {/* Window Management */}
      {openWindows.size > 0 && (
        <div className="mb-6 px-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                Open Menu Windows
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-300">({openWindowsCount}/{maxWindows})</span>
                {openWindowsCount >= 6 && (
                  <span className="text-xs px-2 py-1 rounded bg-orange-600/20 text-orange-300 border border-orange-500/30">
                    {openWindowsCount >= maxWindows ? 'Max Reached' : `${maxWindows - openWindowsCount} left`}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={closeAllWindows}
              className="flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap bg-transparent text-neutral-400 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-neutral-300"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close All
            </button>
          </div>
        </div>
      )}

      {/* Menu Preview/Live Display */}
      <div className="flex-1 min-h-0 px-2 overflow-hidden">
        <SharedMenuDisplay
          products={filteredProducts}
          categories={categories}
          orientation={menuConfig.orientation}
          viewMode={menuConfig.singleMenu.viewMode}
          showImages={menuConfig.singleMenu.showImages}
          leftMenuImages={menuConfig.dualMenu.left.showImages}
          rightMenuImages={menuConfig.dualMenu.right.showImages}
          categoryFilter={menuConfig.singleMenu.category}
          selectedCategoryName={menuConfig.singleMenu.category ? categories.find(c => c.slug === menuConfig.singleMenu.category)?.name : undefined}
          isDualMenu={menuConfig.isDualMode}
          leftMenuCategory={menuConfig.dualMenu.left.category}
          rightMenuCategory={menuConfig.dualMenu.right.category}
          leftMenuCategory2={menuConfig.dualMenu.leftBottom?.category || null}
          rightMenuCategory2={menuConfig.dualMenu.rightBottom?.category || null}
          leftMenuImages2={menuConfig.dualMenu.leftBottom?.showImages || false}
          rightMenuImages2={menuConfig.dualMenu.rightBottom?.showImages || false}
          leftMenuViewMode={menuConfig.dualMenu.left.viewMode}
          rightMenuViewMode={menuConfig.dualMenu.right.viewMode}
          leftMenuViewMode2={menuConfig.dualMenu.leftBottom?.viewMode || 'auto'}
          rightMenuViewMode2={menuConfig.dualMenu.rightBottom?.viewMode || 'auto'}
          enableLeftStacking={menuConfig.dualMenu.enableLeftStacking}
          enableRightStacking={menuConfig.dualMenu.enableRightStacking}
          backgroundColor={menuConfig.backgroundColor}
          fontColor={menuConfig.fontColor}
          containerColor={menuConfig.containerColor}
          pandaMode={pandaMode}
          categoryColumnConfigs={categoryColumnConfigs}
          categoryBlueprintFields={categoryBlueprintFields}
          selectedSide={menuConfig.selectedQuadrant === 'left' || menuConfig.selectedQuadrant === 'leftBottom' ? 'left' : 
                      menuConfig.selectedQuadrant === 'right' || menuConfig.selectedQuadrant === 'rightBottom' ? 'right' : ''}
          onSideClick={(side) => {
            // Convert side click to quadrant selection
            if (side === 'left') {
              menuConfig.setSelectedQuadrant(menuConfig.selectedQuadrant === 'left' ? 'leftBottom' : 'left');
            } else if (side === 'right') {
              menuConfig.setSelectedQuadrant(menuConfig.selectedQuadrant === 'right' ? 'rightBottom' : 'right');
            }
          }}
          selectedMenuSection={menuConfig.selectedQuadrant === 'left' ? 'L' : 
                           menuConfig.selectedQuadrant === 'leftBottom' ? 'L2' :
                           menuConfig.selectedQuadrant === 'right' ? 'R' :
                           menuConfig.selectedQuadrant === 'rightBottom' ? 'R2' : null}
          onSectionClick={(section) => {
            console.log('Section clicked:', section);
            // Convert section clicks to quadrant selection
            switch (section) {
              case 'L':
                menuConfig.setSelectedQuadrant('left');
                break;
              case 'L2':
                menuConfig.setSelectedQuadrant('leftBottom');
                break;
              case 'R':
                menuConfig.setSelectedQuadrant('right');
                break;
              case 'R2':
                menuConfig.setSelectedQuadrant('rightBottom');
                break;
            }
          }}
          isPreview={true}
        />
      </div>
    </div>
  );
}
