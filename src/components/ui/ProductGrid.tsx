'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QuantitySelector } from './QuantitySelector';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';
import ProductCard from './ProductCard';
// import { inventoryEventBus } from '../../utils/inventoryEventBus'; // Disabled to prevent automatic refresh

// Category Header Component with smooth animations
const CategoryHeader = ({ categoryName, productCount }: { categoryName: string; productCount: number }) => (
  <div className="col-span-full px-6 py-4 sticky top-0 z-20 category-header-animate">
    <div className="flex items-center justify-start gap-4">
      <h2 className="text-4xl font-dongraffiti font-thin text-neutral-300 tracking-widest text-left category-title-animate transform transition-all duration-700 ease-out hover:scale-105 hover:text-neutral-100 hover:tracking-wider drop-shadow-lg">
        {categoryName}
      </h2>
      <span className="text-lg font-medium text-neutral-400 px-3 py-1 rounded-full drop-shadow-md">
        {productCount}
      </span>
    </div>
  </div>
);


export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  regular_price: string;
  sale_price?: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
  meta_data?: Array<{
    id: number;
    key: string;
    value: any;
  }>;
  // Blueprint pricing data from Portal2
  blueprintPricing?: BlueprintPricingData | null;
  selected_quantity?: number;
  selected_price?: number;
  selected_category?: string;
  parent_id?: number;  // For variant products
  // Variant support
  has_variants?: boolean;
  variants?: Array<{
    id: number;
    name: string;
    sku: string;
    regular_price: string;
    sale_price?: string;
    inventory: Array<{ location_id: number; quantity: number }>;
    total_stock: number;
  }>;
}

interface ProductGridProps {
  onAddToCart?: (product: Product) => void;
  searchQuery?: string;
  categoryFilter?: string;
  selectedBlueprintField?: string | null;
  blueprintFieldValue?: string | null;
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  onProductsChange?: (products: Product[]) => void;
}

export const ProductGrid = forwardRef<{ 
  refreshInventory: () => Promise<void>;
  updateProductQuantities: (updates: Array<{ productId: number; variantId?: number; newQuantity: number }>) => void;
}, ProductGridProps>(
  ({ onAddToCart, searchQuery, categoryFilter, selectedBlueprintField, blueprintFieldValue, onLoadingChange, onProductsChange }, ref) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Simple refresh state - no more instant inventory complexity
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading, products.length > 0);
    }, [loading, products.length, onLoadingChange]);
    
  // Selected variants state - tracks which variant is selected for each product
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  
  // Selected product state for highlighting in sales view
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  // Ref for the grid container
  const gridRef = useRef<HTMLDivElement>(null);

  // Clear quantity selections when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node)) {
        // Clear quantity selections for all products
        setProducts(prevProducts => 
          prevProducts.map(product => ({
            ...product,
            selected_quantity: undefined,
            selected_price: undefined,
            selected_category: undefined
          }))
        );
        
        // Also clear selected variants to reset everything
        setSelectedVariants({});
        
        // Force re-render of QuantitySelector components by triggering a state change
        // This will cause QuantitySelector useEffect to reset its internal state
        const event = new CustomEvent('clearQuantitySelections');
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Store blueprint field data for filtering
  const [productBlueprintFields, setProductBlueprintFields] = useState<Record<number, any>>({});

  // Fetch blueprint field data when filtering is active
  useEffect(() => {
    if (selectedBlueprintField && blueprintFieldValue && products.length > 0) {
      console.log('🔍 Fetching blueprint fields for filtering...');
      
      const fetchBlueprintFields = async () => {
        const promises = products.map(async (product) => {
          try {
            const response = await fetch(
              `https://api.floradistro.com/wp-json/wc/v3/products/${product.id}?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678`
            );
            
            if (!response.ok) return { productId: product.id, meta_data: [] };
            
            const productData = await response.json();
            return { productId: product.id, meta_data: productData.meta_data || [] };
          } catch (error) {
            console.error(`Error fetching blueprint fields for product ${product.id}:`, error);
            return { productId: product.id, meta_data: [] };
          }
        });
        
        const results = await Promise.all(promises);
        const blueprintFieldsMap: Record<number, any> = {};
        results.forEach(result => {
          blueprintFieldsMap[result.productId] = result.meta_data;
        });
        
        setProductBlueprintFields(blueprintFieldsMap);
        console.log('✅ Loaded blueprint fields for filtering');
      };
      
      fetchBlueprintFields();
    }
  }, [selectedBlueprintField, blueprintFieldValue, products]);

  // Memoized filtered and grouped products for performance
  const { filteredProducts, groupedByCategory } = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !categoryFilter || 
        product.categories.some(cat => cat.slug === categoryFilter);
      
      // Blueprint field filtering - use fetched blueprint field data
      const matchesBlueprintField = !selectedBlueprintField || !blueprintFieldValue || (() => {
        const blueprintMeta = productBlueprintFields[product.id];
        if (!blueprintMeta || !Array.isArray(blueprintMeta)) return false;
        
        const fieldMeta = blueprintMeta.find((meta: any) => {
          const fieldName = meta.key.startsWith('_') ? meta.key.substring(1) : meta.key;
          return fieldName === selectedBlueprintField;
        });
        
        if (!fieldMeta || !fieldMeta.value) return false;
        
        // Exact match for blueprint field values
        const matches = fieldMeta.value.toString().trim() === blueprintFieldValue.trim();
        if (matches) {
          console.log(`✅ Product ${product.name} matches ${selectedBlueprintField}: ${fieldMeta.value}`);
        }
        return matches;
      })();
      
      return matchesSearch && matchesCategory && matchesBlueprintField;
    });

    // Group products by category
    const categoryGroups = new Map<string, { category: { id: number; name: string; slug: string }, products: Product[] }>();
    
    filtered.forEach((product) => {
      // Handle products with multiple categories - use the first category as primary
      const primaryCategory = product.categories?.[0];
      if (primaryCategory) {
        const categoryKey = primaryCategory.slug;
        if (!categoryGroups.has(categoryKey)) {
          categoryGroups.set(categoryKey, {
            category: primaryCategory,
            products: []
          });
        }
        categoryGroups.get(categoryKey)!.products.push(product);
      } else {
        // Handle products without categories
        const uncategorizedKey = 'uncategorized';
        if (!categoryGroups.has(uncategorizedKey)) {
          categoryGroups.set(uncategorizedKey, {
            category: { id: 0, name: 'Uncategorized', slug: 'uncategorized' },
            products: []
          });
        }
        categoryGroups.get(uncategorizedKey)!.products.push(product);
      }
    });

    // Sort products within each category
    categoryGroups.forEach((group) => {
      group.products.sort((a, b) => {
        // Primary sort: Products with variants go to the bottom (they are taller cards)
        const aHasVariants = (a.has_variants && a.variants && a.variants.length > 0) || a.type === 'variable';
        const bHasVariants = (b.has_variants && b.variants && b.variants.length > 0) || b.type === 'variable';
        
        if (aHasVariants && !bHasVariants) return 1; // a goes to bottom
        if (!aHasVariants && bHasVariants) return -1; // b goes to bottom
        
        // Secondary sort: Within each group (with/without variants), sort alphabetically
        return a.name.localeCompare(b.name);
      });
    });

    // Convert to array and sort categories with custom priority order
    const priorityOrder = ['flower', 'vape', 'concentrate', 'edible', 'moonwater'];
    
    const groupedArray = Array.from(categoryGroups.values()).sort((a, b) => {
      // Put uncategorized at the end
      if (a.category.slug === 'uncategorized') return 1;
      if (b.category.slug === 'uncategorized') return -1;
      
      // Check priority order (case-insensitive matching)
      const aSlugLower = a.category.slug.toLowerCase();
      const bSlugLower = b.category.slug.toLowerCase();
      const aNameLower = a.category.name.toLowerCase();
      const bNameLower = b.category.name.toLowerCase();
      
      const aPriority = priorityOrder.findIndex(priority => 
        aSlugLower.includes(priority) || aNameLower.includes(priority)
      );
      const bPriority = priorityOrder.findIndex(priority => 
        bSlugLower.includes(priority) || bNameLower.includes(priority)
      );
      
      // If both have priority, sort by priority order
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      
      // If only one has priority, prioritize it
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // If neither has priority, sort alphabetically
      return a.category.name.localeCompare(b.category.name);
    });

    return {
      filteredProducts: filtered,
      groupedByCategory: groupedArray
    };
  }, [products, searchQuery, categoryFilter, selectedBlueprintField, blueprintFieldValue, productBlueprintFields]);

  // Notify parent when filtered products change (for blueprint field extraction)
  useEffect(() => {
    onProductsChange?.(filteredProducts);
  }, [filteredProducts, onProductsChange]);


  // Simple refresh method - just reload the products
  const refreshInventory = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 [POSV1] Refreshing products and inventory...');
      
      // Just reload the products - this will get fresh inventory data
      await fetchProducts();
      
      console.log('✅ [POSV1] Inventory refresh completed');
    } catch (error) {
      console.error('❌ [POSV1] Failed to refresh inventory:', error);
      // Don't rethrow - prevent crashes
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update specific product quantities without full reload
  const updateProductQuantities = useCallback((updates: Array<{ productId: number; variantId?: number; newQuantity: number }>) => {
    console.log('🎯 [POSV1] Updating specific product quantities:', updates);
    
    setProducts(prevProducts => 
      prevProducts.map(product => {
        const update = updates.find(u => u.productId === product.id);
        if (!update) return product;

        if (update.variantId && product.variants) {
          // Update variant quantity
          return {
            ...product,
            variants: product.variants.map(variant => {
              if (variant.id === update.variantId) {
                return {
                  ...variant,
                  inventory: variant.inventory?.map(inv => ({
                    ...inv,
                    stock: update.newQuantity
                  })) || [],
                  total_stock: update.newQuantity
                };
              }
              return variant;
            })
          };
        } else {
          // Update main product quantity
          return {
            ...product,
            inventory: product.inventory.map(inv => ({
              ...inv,
              stock: update.newQuantity
            })),
            total_stock: update.newQuantity
          };
        }
      })
    );
    
    console.log('✅ [POSV1] Product quantities updated in state');
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    refreshInventory,
    updateProductQuantities
  }));

  // Removed individual blueprint pricing function - using batch only



  const fetchProducts = useCallback(async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching all products using Flora IM API...`);
      
      // NO CACHING IN DEVELOPMENT
      const params = new URLSearchParams({
        per_page: '1000',  // Fetch all products (increased from 100)
        page: '1',
        _t: Math.floor(Date.now() / 300000).toString() // Cache for 5 minutes
      });

      // Add location ID for stock filtering
      if (user?.location_id) {
        params.append('location_id', user.location_id);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Note: Flora IM API might not support category filtering
      // We'll filter client-side after fetching the products

      const floraApiUrl = `/api/proxy/flora-im/products?${params}`;
      console.log('🔄 Fetching from Flora IM API via POSV1 proxy...');
      
      const response = await fetch(floraApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Flora IM API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from Flora IM API');
      }

      const productsWithInventory = result.data;
      console.log(`✅ Fetched ${productsWithInventory.length} products from Flora IM API`);

      // Don't filter products by location - show ALL products with stock > 0 anywhere
      // The user's location will still be used for display purposes
      let filteredProducts = productsWithInventory.filter((product: any) => {
        // Show products that have total stock > 0 (stock at any location)
        const totalStock = product.total_stock || 
          (product.inventory?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.stock) || parseFloat(inv.quantity) || 0), 0) || 0);
        return totalStock > 0;
      });
      console.log(`✅ Showing ${filteredProducts.length} products with stock > 0 (from ${productsWithInventory.length} total)`);
      
      if (user?.location_id) {
        console.log(`📍 User location: ${user.location_id} - will display location-specific stock in UI`);
      }

      // Filter by category if categoryFilter is set (client-side filtering)
      if (categoryFilter) {
        filteredProducts = filteredProducts.filter((product: any) => 
          product.categories && product.categories.some((cat: any) => cat.slug === categoryFilter)
        );
        console.log(`✅ Filtered to ${filteredProducts.length} products for category ${categoryFilter}`);
      }

      // Process products first without blueprint pricing
      const baseProducts: Product[] = filteredProducts.map((product: any) => {
            const inventory = product.inventory?.map((inv: any) => ({
              location_id: inv.location_id?.toString() || '0',
              location_name: inv.location_name || `Location ${inv.location_id}`,
              stock: parseFloat(inv.stock) || parseFloat(inv.quantity) || 0,
              manage_stock: true
            })) || [];

        return {
              id: product.id,
              name: product.name,
              sku: product.sku || '',
              type: product.type || 'simple',
              status: product.status || 'publish',
              regular_price: product.regular_price || '0',
              sale_price: product.sale_price,
              image: product.image,
              categories: product.categories || [],
              inventory,
              total_stock: product.total_stock || 0,
              meta_data: product.meta_data || [],
              selected_quantity: undefined,
              selected_price: undefined,
              selected_category: undefined,
              blueprintPricing: null,
              has_variants: false,
              variants: undefined
            };
      });

      // Batch blueprint pricing for all products
      try {
        console.log(`🔍 [POSV1] Batch fetching blueprint pricing for ${baseProducts.length} products`);
        const productsWithCategories = baseProducts.map(product => ({
          id: product.id,
          categoryIds: product.categories ? product.categories.map((cat: any) => parseInt(cat.id)) : []
        }));

        const batchPricingResponse = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories);
        
        // Apply batch pricing results to products
        baseProducts.forEach(product => {
          const pricingData = batchPricingResponse[product.id];
          if (pricingData) {
            product.blueprintPricing = pricingData;
          }
        });
        
        console.log(`✅ Applied blueprint pricing to ${Object.keys(batchPricingResponse).length}/${baseProducts.length} products`);
            } catch (pricingError) {
        console.warn(`⚠️ [POSV1] Failed to get batch blueprint pricing:`, pricingError instanceof Error ? pricingError.message : 'Unknown error');
              // Continue without pricing
            }

      // Process products - PRE-LOAD variants for immediate display
      const normalizedProducts: Product[] = [];
      
      for (const baseProduct of baseProducts) {
        try {
          // Pre-load variants for variable products
          if (baseProduct.type === 'variable') {
            console.log(`🔄 [POSV1] Pre-loading variants for variable product ${baseProduct.id}`);
            baseProduct.has_variants = true;
            
            try {
              const variants = await loadVariantsForProduct(baseProduct.id);
              baseProduct.variants = variants || [];
              console.log(`✅ Pre-loaded ${baseProduct.variants.length} variants for product ${baseProduct.id}`);
            } catch (variantError) {
              console.warn(`⚠️ Failed to pre-load variants for product ${baseProduct.id}:`, variantError);
              baseProduct.variants = [];
            }
          }

          normalizedProducts.push(baseProduct);
        } catch (productError) {
          console.error(`❌ Failed to process product ${baseProduct.id}:`, productError);
          // Add minimal product structure to prevent complete failure
          normalizedProducts.push({
            id: baseProduct.id,
            name: baseProduct.name || 'Unknown Product',
            sku: baseProduct.sku || '',
            type: baseProduct.type || 'simple',
            status: baseProduct.status || 'publish',
            regular_price: baseProduct.regular_price || '0',
            sale_price: baseProduct.sale_price,
            image: baseProduct.image,
            categories: baseProduct.categories || [],
            inventory: baseProduct.inventory || [],
            total_stock: baseProduct.total_stock || 0,
            meta_data: baseProduct.meta_data || [],
            selected_quantity: undefined,
            selected_price: undefined,
            selected_category: undefined,
            blueprintPricing: null,
            has_variants: baseProduct.type === 'variable',
            variants: []
          });
        }
      }
      

      const loadTime = Date.now() - startTime;
      console.log(`✅ Successfully processed ${normalizedProducts.length} products in ${loadTime}ms`);

      // Always replace products since we're loading all at once
      setProducts(normalizedProducts);
      
      // Notify parent of products change for blueprint field extraction
      onProductsChange?.(normalizedProducts);

    } catch (err) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ Failed to fetch products after ${loadTime}ms:`, err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      
      // Set empty products on error
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, user?.location_id]);

  // Stabilize the fetchProducts dependency to prevent infinite loops
  const stableFetchProducts = useMemo(() => fetchProducts, [fetchProducts]);

  // Load products on mount and when filters change
  useEffect(() => {
    stableFetchProducts();
  }, [stableFetchProducts]);

  // Listen for inventory change events - DISABLED to prevent automatic refresh
  // useEffect(() => {
  //   const unsubscribe = inventoryEventBus.subscribe(async () => {
  //     console.log('🔄 [POSV1] Inventory event received, refreshing ProductGrid...');
  //     try {
  //       await refreshInventory();
  //     } catch (error) {
  //       console.error('❌ [POSV1] Error during inventory refresh:', error);
  //       // Don't throw - just log the error to prevent crashes
  //     }
  //   });
  //
  //   return unsubscribe;
  // }, []);



  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };


  // Memoized handlers for performance
  const handleVariantSelect = useCallback((productId: number, variantId: number) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantId
    }));
  }, []);

  const handleQuantityChange = useCallback((productId: number, quantity: number, price: number, category?: string) => {
    console.log(`🔄 Quantity selected for product ${productId}: ${quantity} @ $${price} (${category || 'no category'})`);
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId 
          ? { ...p, selected_quantity: quantity, selected_price: price, selected_category: category }
          : p
      )
    );
  }, []);

  // Load variants for a variable product
  const loadVariantsForProduct = useCallback(async (productId: number): Promise<Array<{
    id: number;
    name: string;
    sku: string;
    regular_price: string;
    sale_price?: string;
    inventory: Array<{ location_id: number; quantity: number }>;
    total_stock: number;
  }> | null> => {
    try {
      console.log(`🔍 Loading variants for variable product ${productId}`);
      
      // Get variants from WooCommerce API
      const variantsUrl = `/api/proxy/woocommerce/products/${productId}/variations?per_page=100&_t=${Date.now()}`;
      const variantsResponse = await fetch(variantsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!variantsResponse.ok) {
        console.warn(`❌ Failed to fetch variants for product ${productId}: ${variantsResponse.status}`);
        return null;
      }

      const variants = await variantsResponse.json();
      if (!variants || variants.length === 0) {
        console.warn(`❌ No variants found for product ${productId}`);
        return null;
      }

      // OPTIMIZATION: Batch fetch inventory for all variants at once
      console.log(`📦 Batch fetching inventory for ${variants.length} variants of product ${productId}`);
      const inventoryItems = variants.map((v: any) => ({
        product_id: productId,
        variation_id: v.id
      }));

      const batchInventoryResponse = await fetch('/api/inventory/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          items: inventoryItems,
          location_id: user?.location_id ? parseInt(user.location_id) : undefined
        })
      });

      let inventoryMap: Record<string, any> = {};
      if (batchInventoryResponse.ok) {
        const batchResult = await batchInventoryResponse.json();
        if (batchResult.success && batchResult.data) {
          // Handle both array and object responses
          if (Array.isArray(batchResult.data)) {
            inventoryMap = batchResult.data.reduce((map: Record<string, any>, item: any) => {
              const key = `${item.product_id}_${item.variation_id}`;
              map[key] = item;
              return map;
            }, {});
          } else {
            // If data is already a keyed object, use it directly
            inventoryMap = batchResult.data;
          }
        }
      }

      // Transform variants with inventory data
      const transformedVariants = variants.map((variant: any) => {
        const inventoryKey = `${productId}_${variant.id}`;
        const inventoryData = inventoryMap[inventoryKey];
        
        // Extract variant name from attributes
        const variantName = variant.attributes?.map((attr: any) => attr.option).filter(Boolean).join(', ') || 
                           variant.name || 
                           `Variant #${variant.id}`;
        
        
        return {
          id: variant.id,
          name: variantName,
          sku: variant.sku || '',
          regular_price: variant.regular_price || '0',
          sale_price: variant.sale_price || undefined,
          inventory: inventoryData?.inventory || [],
          total_stock: inventoryData?.total_stock || 0
        };
      });

      console.log(`✅ Loaded ${transformedVariants.length} variants for product ${productId}`);
      return transformedVariants;

    } catch (error) {
      console.error(`❌ Error loading variants for product ${productId}:`, error);
      return null;
    }
  }, [user?.location_id]);

  // Handle product selection for highlighting
  const handleProductSelection = useCallback((product: Product) => {
    if (selectedProduct === product.id) {
      // Deselect if clicking the same product
      setSelectedProduct(null);
    } else {
      // Select new product (variants are already pre-loaded)
      setSelectedProduct(product.id);
    }
  }, [selectedProduct]);

  // Enhanced add to cart that handles variants (now pre-loaded)
  const handleAddToCartWithVariant = (product: Product) => {
    if (product.has_variants) {
      // Variants are already pre-loaded during initial fetch
      
      const selectedVariantId = selectedVariants[product.id];
      const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
      
      if (!selectedVariant) {
        // No variant selected yet, do nothing
        return;
      }

      // Create a product object with variant data
      const variantProduct: Product = {
        ...product,
        id: selectedVariant.id, // Use variant ID
        name: `${product.name} - ${selectedVariant.name}`,
        sku: selectedVariant.sku,
        regular_price: selectedVariant.regular_price,
        sale_price: selectedVariant.sale_price,
        // Use variant inventory instead of parent inventory
        inventory: selectedVariant.inventory.map(inv => ({
          location_id: inv.location_id.toString(),
          location_name: `Location ${inv.location_id}`,
          stock: inv.quantity,
          manage_stock: true
        })),
        total_stock: selectedVariant.total_stock,
        // Keep parent product info for reference
        parent_id: product.id
      };

      handleAddToCart(variantProduct);
    } else {
      // Simple product - use existing logic
      handleAddToCart(product);
    }
  };


  // formatPrice moved to ProductCard component

  if (loading && products.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="text-center">
          <div className="text-red-400 text-base font-normal mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-neutral-400 text-xs" style={{ fontFamily: 'Tiempos, serif' }}>{error}</p>
          <button 
            onClick={() => {
              console.log('🔄 Manual retry triggered by user');
              setError(null);
              fetchProducts();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="text-center">
          <div className="text-neutral-300 text-base font-normal mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-neutral-400 text-xs" style={{ fontFamily: 'Tiempos, serif' }}>No products found</p>
          <p className="text-xs text-neutral-500 mt-2" style={{ fontFamily: 'Tiempos, serif' }}>
            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative smooth-scroll">
      {/* Organized Grid View by Category */}
      <div ref={gridRef} className="grid grid-cols-3 max-[1024px]:grid-cols-2 product-grid scrollable-container">
        {groupedByCategory.map((categoryGroup, groupIndex) => {
          const userLocationId = user?.location_id ? parseInt(user.location_id) : undefined;
          
          return (
            <React.Fragment key={categoryGroup.category.slug}>
              {/* Category Header */}
              <CategoryHeader 
                categoryName={categoryGroup.category.name} 
                productCount={categoryGroup.products.length}
              />
              
              {/* Products in this category */}
              {categoryGroup.products.map((product, productIndex) => {
                // Calculate global index for staggered animations
                const globalIndex = groupedByCategory
                  .slice(0, groupIndex)
                  .reduce((sum, group) => sum + group.products.length, 0) + productIndex;
                
                // Calculate grid column position within this category
                const columnPosition = productIndex % 3; // 0, 1, 2 for 3-column grid
                const columnPositionMobile = productIndex % 2; // 0, 1 for 2-column grid
                
                return (
                  <div 
                    key={product.id} 
                    className={`product-grid-cell border-b border-neutral-500/20 relative group hover:bg-neutral-800/10 apple-smooth card-hover${
                      columnPosition !== 0 ? ' border-l border-neutral-500/20' : ''
                    }${columnPositionMobile !== 0 ? ' max-[1024px]:border-l' : ''}`}
                    style={{
                      animation: `fadeInUpEnhanced 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${globalIndex * 0.05}s both`,
                      animationFillMode: 'both',
                    }}
                  >
                    <ProductCard
                      product={product}
                      userLocationId={userLocationId}
                      selectedVariants={selectedVariants}
                      isAuditMode={false}
                      isSalesView={false}
                      onVariantSelect={handleVariantSelect}
                      onQuantityChange={handleQuantityChange}
                      onAddToCartWithVariant={handleAddToCartWithVariant}
                      onProductSelection={handleProductSelection}
                      isSelected={selectedProduct === product.id}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes categoryHeaderSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            backdrop-filter: blur(8px);
          }
        }

        @keyframes categoryTitleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-1px) scale(1.01);
          }
        }

        @keyframes underlineExpand {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        .category-header-animate {
          animation: categoryHeaderSlideIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          will-change: transform, opacity, backdrop-filter;
        }

        .category-title-animate {
          animation: categoryTitleFloat 4s ease-in-out infinite;
          will-change: transform;
        }

        .category-underline-animate {
          animation: underlineExpand 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
          will-change: transform, opacity;
        }

        .product-grid {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .product-grid::-webkit-scrollbar {
          display: none;
        }

        .product-grid-cell {
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .product-grid-cell:hover {
          transform: translateY(-2px) translateZ(0);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Apple-style smooth scrolling momentum */
        @supports (scroll-behavior: smooth) {
          .scrollable-container {
            scroll-behavior: smooth;
            scroll-snap-type: y proximity;
          }
        }

        /* Enhanced stagger animation with better easing */
        @keyframes fadeInUpEnhanced {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95) rotateX(10deg);
          }
          50% {
            opacity: 0.7;
            transform: translateY(15px) scale(0.98) rotateX(5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
          }
        }
      `}</style>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
