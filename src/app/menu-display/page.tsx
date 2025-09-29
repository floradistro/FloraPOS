'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlueprintPricingService } from '../../services/blueprint-pricing-service';
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { Product, Category } from '../../types';
import { SharedMenuDisplay } from '../../components/ui/SharedMenuDisplay';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

function MenuDisplayContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryBlueprintFields, setCategoryBlueprintFields] = useState<Map<string, ProductBlueprintFields[]>>(new Map());
  const [categoryColumnConfigs, setCategoryColumnConfigs] = useState<Map<string, string[]>>(new Map());
  const [showExitButton, setShowExitButton] = useState(false);
  const [exitButtonTimeout, setExitButtonTimeout] = useState<NodeJS.Timeout | null>(null);

  // Parse URL parameters
  const orientation = (searchParams.get('orientation') as 'horizontal' | 'vertical') || 'horizontal';
  const viewMode = (searchParams.get('viewMode') as 'table' | 'card' | 'auto') || 'auto';
  const showImages = searchParams.get('showImages') === 'true';
  const backgroundColor = searchParams.get('backgroundColor') || '#f5f5f4';
  const fontColor = searchParams.get('fontColor') || '#1f2937';
  const containerColor = searchParams.get('containerColor') || '#d1d5db';
  const categoryFilter = searchParams.get('category');
  const isDualMenu = searchParams.get('dual') === 'true';
  
  // Dual menu parameters
  const leftCategory = searchParams.get('leftCategory');
  const rightCategory = searchParams.get('rightCategory');
  const leftViewMode = (searchParams.get('leftViewMode') as 'table' | 'card' | 'auto') || 'auto';
  const rightViewMode = (searchParams.get('rightViewMode') as 'table' | 'card' | 'auto') || 'auto';
  const leftImages = searchParams.get('leftImages') === 'true';
  const rightImages = searchParams.get('rightImages') === 'true';

  // Parse column configuration
  const columnsParam = searchParams.get('columns');
  const categoryColumns = columnsParam ? columnsParam.split(',') : [];
  const leftColumnsParam = searchParams.get('leftColumns');
  const rightColumnsParam = searchParams.get('rightColumns');
  const leftCategoryColumns = leftColumnsParam ? leftColumnsParam.split(',') : [];
  const rightCategoryColumns = rightColumnsParam ? rightColumnsParam.split(',') : [];

  // Get selected category name
  const selectedCategoryName = categories.find(cat => cat.slug === categoryFilter)?.name;

  // Handle screen interaction to show exit button
  const handleScreenInteraction = () => {
    setShowExitButton(true);
    
    // Clear existing timeout
    if (exitButtonTimeout) {
      clearTimeout(exitButtonTimeout);
    }
    
    // Hide button after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      setShowExitButton(false);
    }, 5000);
    
    setExitButtonTimeout(timeout);
  };

  // Handle mouse movement to show exit button on desktop
  const handleMouseMove = () => {
    if (!showExitButton) {
      handleScreenInteraction();
    }
  };

  // Handle exit button click
  const handleExit = () => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (exitButtonTimeout) {
        clearTimeout(exitButtonTimeout);
      }
    };
  }, [exitButtonTimeout]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        per_page: '1000',
        _t: Date.now().toString()
      });
      
      // Add location_id parameter to filter by location (same as preview)
      const locationId = searchParams.get('location_id') || '20'; // Default to location 20
      params.append('location_id', locationId);

      const response = await fetch(`/api/proxy/flora-im/products?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
        const result = await response.json();
        
        if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} products for menu display`);
        setProducts(result.data);
        
        // Extract unique categories
          const categoryMap = new Map();
        result.data.forEach((product: Product) => {
            product.categories?.forEach(cat => {
              if (!categoryMap.has(cat.id)) {
                categoryMap.set(cat.id, cat);
              }
            });
          });
          setCategories(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        
        // Load blueprint pricing for all products
        try {
          const productsWithPricing = await Promise.all(
            result.data.map(async (product: Product) => {
              try {
                const categoryIds = product.categories?.map(cat => cat.id) || [];
                const pricing = await BlueprintPricingService.getBlueprintPricing(product.id, categoryIds);
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
  };

  // Load blueprint fields for a category
  const loadCategoryBlueprintFields = async (categorySlug: string) => {
    if (categoryBlueprintFields.has(categorySlug)) return;

    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return;

    try {
      const fields = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, fields));
    } catch (error) {
      console.warn(`Failed to load blueprint fields for ${category.name}:`, error);
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, []));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Set up column configuration if provided
  useEffect(() => {
    if (categoryFilter && categoryColumns.length > 0) {
      setCategoryColumnConfigs(prev => new Map(prev).set(categoryFilter, categoryColumns));
    }
    if (leftCategory && leftCategoryColumns.length > 0) {
      setCategoryColumnConfigs(prev => new Map(prev).set(leftCategory, leftCategoryColumns));
    }
    if (rightCategory && rightCategoryColumns.length > 0) {
      setCategoryColumnConfigs(prev => new Map(prev).set(rightCategory, rightCategoryColumns));
    }
  }, [categoryFilter, categoryColumns, leftCategory, leftCategoryColumns, rightCategory, rightCategoryColumns]);

  // Load blueprint fields for active categories
  useEffect(() => {
    const categoriesToLoad = new Set<string>();
    
    if (isDualMenu) {
      if (leftCategory) categoriesToLoad.add(leftCategory);
      if (rightCategory) categoriesToLoad.add(rightCategory);
    } else if (categoryFilter) {
      categoriesToLoad.add(categoryFilter);
    }
    
    categoriesToLoad.forEach(categorySlug => {
      loadCategoryBlueprintFields(categorySlug);
    });
  }, [categories, isDualMenu, leftCategory, rightCategory, categoryFilter]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor, color: fontColor }}>
        <div className="text-center">
          <p className="text-2xl font-medium mb-4">Failed to load menu</p>
          <p className="text-lg mb-6">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Create live display configuration from URL parameters
  const liveDisplayConfig = {
    orientation,
    viewMode,
    showImages,
    backgroundColor,
    fontColor,
    containerColor,
    isDualMenu,
    leftCategory,
    rightCategory,
    leftViewMode,
    rightViewMode,
    leftImages,
    rightImages
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onTouchStart={handleScreenInteraction}
    >
      <div className="menu-display-container h-full w-full">
        <SharedMenuDisplay
          products={products}
          categories={categories}
          orientation={orientation}
          viewMode={viewMode}
          showImages={showImages}
          leftMenuImages={leftImages}
          rightMenuImages={rightImages}
          categoryFilter={categoryFilter}
          selectedCategoryName={selectedCategoryName}
          isDualMenu={isDualMenu}
          leftMenuCategory={leftCategory}
          rightMenuCategory={rightCategory}
          leftMenuCategory2={null}
          rightMenuCategory2={null}
          leftMenuImages2={false}
          rightMenuImages2={false}
          leftMenuViewMode={leftViewMode}
          rightMenuViewMode={rightViewMode}
          leftMenuViewMode2="auto"
          rightMenuViewMode2="auto"
          enableLeftStacking={false}
          enableRightStacking={false}
          backgroundColor={backgroundColor}
          fontColor={fontColor}
          containerColor={containerColor}
          pandaMode={false}
          categoryColumnConfigs={categoryColumnConfigs}
          categoryBlueprintFields={categoryBlueprintFields}
          selectedSide=""
          selectedMenuSection={null}
          isPreview={false}
        />
      </div>
      
      {/* Hidden Exit Button */}
      {showExitButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExit();
          }}
          className={`
            fixed top-4 right-4 z-50
            w-12 h-12 
            bg-red-600 hover:bg-red-700 
            text-white 
            rounded-full 
            shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-200 ease-in-out
            transform hover:scale-105
            border-2 border-white/20
            backdrop-blur-sm
            ${showExitButton ? 'animate-fade-in' : ''}
          `}
          title="Close Menu"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function MenuDisplayPage() {
                                  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-900">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MenuDisplayContent />
    </Suspense>
  );
}
