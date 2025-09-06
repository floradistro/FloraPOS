'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QuantitySelector } from './QuantitySelector';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';
import ProductCard from './ProductCard';
// import { inventoryEventBus } from '../../utils/inventoryEventBus'; // Disabled to prevent automatic refresh


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
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  isAuditMode?: boolean;
  onAddAdjustment?: (product: Product, adjustment: number) => void;
  // Callbacks for select all functionality
  onFilteredProductsChange?: (products: Product[]) => void;
  onSelectionCountChange?: (count: number) => void;
}

export const ProductGrid = forwardRef<{ refreshInventory: () => Promise<void> }, ProductGridProps>(
  ({ onAddToCart, searchQuery, categoryFilter, onLoadingChange, isAuditMode = false, onAddAdjustment, onFilteredProductsChange, onSelectionCountChange }, ref) => {
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
  
  // Stock editing state - tracks edited stock values in audit mode
  const [editedStockValues, setEditedStockValues] = useState<Record<string, number | string>>({});
  
  // Focus state tracking for stock input fields
  const [focusedStockFields, setFocusedStockFields] = useState<Set<string>>(new Set());
  
  // Selection state for adjust mode - tracks which products are selected for adjustment
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !categoryFilter || 
      product.categories.some(cat => cat.slug === categoryFilter);
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Sort products with variants to the bottom (they are taller)
    const aHasVariants = a.has_variants && a.variants && a.variants.length > 0;
    const bHasVariants = b.has_variants && b.variants && b.variants.length > 0;
    
    if (aHasVariants && !bHasVariants) return 1; // a goes to bottom
    if (!aHasVariants && bHasVariants) return -1; // b goes to bottom
    
    // If both have variants or both don't have variants, maintain original order
    return 0;
  });
  }, [products, searchQuery, categoryFilter]);

  // Notify parent of filtered products and selection count
  React.useEffect(() => {
    if (onFilteredProductsChange) {
      onFilteredProductsChange(filteredProducts);
    }
  }, [filteredProducts, onFilteredProductsChange]);

  React.useEffect(() => {
    if (onSelectionCountChange) {
      const selectedCount = Array.from(selectedProducts).filter(productId => 
        filteredProducts.some(p => p.id === productId)
      ).length;
      onSelectionCountChange(selectedCount);
    }
  }, [selectedProducts, filteredProducts, onSelectionCountChange]);

  // Remove duplicate handlers - already memoized above

  // Handle product card selection for adjust mode
  const handleProductSelection = (product: Product, event?: React.MouseEvent) => {
    // Prevent selection if clicking on input fields or buttons
    if (event?.target && (event.target as HTMLElement).closest('input, button')) {
      return;
    }
    
    if (!isAuditMode) return;
    
    setSelectedProducts(prev => {
      const newSelected = new Set(prev);
      const productKey = product.id;
      
      if (newSelected.has(productKey)) {
        // Deselect - remove from selection only
        newSelected.delete(productKey);
      } else {
        // Select - add to selection and create adjustment item in cart (only if not already in cart)
        newSelected.add(productKey);
        
        // Add to cart as adjustment item with 0 adjustment initially (prevent duplicates)
        if (onAddAdjustment) {
          onAddAdjustment(product, 0);
        }
      }
      
      return newSelected;
    });
  };

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

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshInventory
  }));

  // Removed individual blueprint pricing function - using batch only



  const fetchProducts = useCallback(async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching all products using Flora IM API...`);
      
      // Use the POSV1 proxy endpoint for Flora IM API with optimized caching
      const params = new URLSearchParams({
        per_page: '100',
        page: '1',
        _t: Math.floor(Date.now() / 60000).toString() // Cache for 1 minute
      });

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
          'Cache-Control': 'public, max-age=300', // 5 minute cache
        },
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

      // Filter products by location if user has a specific location
      let filteredProducts = productsWithInventory;
      if (user?.location_id) {
        const userLocationId = parseInt(user.location_id);
        filteredProducts = productsWithInventory.filter((product: any) => 
          product.inventory?.some((inv: any) => 
            parseInt(inv.location_id) === userLocationId && inv.stock > 0
          )
        );
        console.log(`✅ Filtered to ${filteredProducts.length} products for location ${user.location_id}`);
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

      // Process products with variants
      const normalizedProducts: Product[] = await Promise.all(
        baseProducts.map(async (baseProduct: Product) => {
          try {

            // Check if this is a variable product and load variants
            if (baseProduct.type === 'variable') {
              try {
                console.log(`🔍 [POSV1] Loading variants for variable product ${baseProduct.id}`);
                const variants = await loadVariantsForProduct(baseProduct.id);
                
                if (variants && variants.length > 0) {
                  baseProduct.has_variants = true;
                  baseProduct.variants = variants;
                  console.log(`✅ [POSV1] Loaded ${variants.length} variants for product ${baseProduct.id}`);
                } else {
                  console.warn(`⚠️ [POSV1] No variants found for variable product ${baseProduct.id}`);
                }
              } catch (variantError) {
                console.error(`❌ [POSV1] Failed to load variants for product ${baseProduct.id}:`, variantError instanceof Error ? variantError.message : 'Unknown error');
                // Continue without variants
              }
            }

            return baseProduct;
          } catch (productError) {
            console.error(`❌ Failed to process product ${baseProduct.id}:`, productError);
            // Return minimal product structure to prevent complete failure
            return {
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
              has_variants: false,
              variants: undefined
            };
          }
        })
      );
      

      const loadTime = Date.now() - startTime;
      console.log(`✅ Successfully processed ${normalizedProducts.length} products in ${loadTime}ms`);

      // Always replace products since we're loading all at once
      setProducts(normalizedProducts);

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

  // Load products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const handleStockFieldFocus = useCallback((fieldKey: string) => {
    setFocusedStockFields(prev => new Set(prev).add(fieldKey));
  }, []);

  const handleStockFieldBlur = useCallback((fieldKey: string) => {
    setFocusedStockFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldKey);
      return newSet;
    });
  }, []);

  // Enhanced add to cart that handles variants
  const handleAddToCartWithVariant = (product: Product) => {
    if (product.has_variants && product.variants) {
      const selectedVariantId = selectedVariants[product.id];
      const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
      
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

  // Load variants for a variable product
  const loadVariantsForProduct = async (productId: number): Promise<Array<{
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
          'Cache-Control': 'no-cache',
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

      // Process variants and get inventory for each
      const processedVariants = await Promise.all(
        variants.map(async (variant: any) => {
          let inventory: Array<{location_id: number; quantity: number}> = [];
          
          // Get inventory for this variant
          try {
            const inventoryParams = new URLSearchParams({
              product_id: productId.toString(),
              variation_id: variant.id.toString(),
              _t: Date.now().toString()
            });

            if (user?.location_id) {
              inventoryParams.append('location_id', user.location_id);
            }

            const inventoryResponse = await fetch(`/api/proxy/flora-im/inventory?${inventoryParams}`, {
              method: 'GET',
              headers: { 'Cache-Control': 'no-cache' }
            });

            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              if (Array.isArray(inventoryData)) {
                inventory = inventoryData.map((record: any) => ({
                  location_id: parseInt(record.location_id),
                  quantity: parseFloat(record.quantity) || parseFloat(record.available_quantity) || 0
                }));
              }
            }
          } catch (error) {
            console.error(`Failed to load inventory for variant ${variant.id}:`, error);
          }

          const total_stock = inventory.reduce((sum, inv) => sum + inv.quantity, 0);

          return {
            id: variant.id,
            name: variant.attributes?.map((attr: any) => attr.option).filter(Boolean).join(', ') || `Variant #${variant.id}`,
            sku: variant.sku || '',
            regular_price: variant.regular_price || '0',
            sale_price: variant.sale_price,
            inventory,
            total_stock
          };
        })
      );
      
      console.log(`✅ Loaded ${processedVariants.length} variants for product ${productId}`);
      return processedVariants;
    } catch (error) {
      console.error(`❌ Error loading variants for product ${productId}:`, error);
      return null;
    }
  };

  // Remove duplicate handleQuantityChange - already defined above

  // Audit mode inventory adjustment handler
  const handleInventoryAdjustment = async (productId: number, variantId: number | null, adjustment: number, reason: string = 'Manual adjustment') => {
    console.log('🔧 [DEBUG] handleInventoryAdjustment called:', { productId, variantId, adjustment, reason });
    try {
      // Find the product being adjusted
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.error('❌ [DEBUG] Product not found for adjustment:', productId);
        return;
      }
      console.log('✅ [DEBUG] Product found:', product.name);

      // Create adjustment product for cart
      let adjustmentProduct = { ...product };
      
      // If it's a variant, update the product details
      if (variantId && product.has_variants && product.variants) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          adjustmentProduct = {
            ...product,
            id: variantId,
            name: `${product.name} - ${variant.name}`,
            sku: variant.sku,
            regular_price: variant.regular_price,
            sale_price: variant.sale_price,
            inventory: variant.inventory.map(inv => ({
              location_id: inv.location_id.toString(),
              location_name: `Location ${inv.location_id}`,
              stock: inv.quantity,
              manage_stock: true
            })),
            total_stock: variant.total_stock,
            parent_id: product.id
          };
        }
      }

      // Add to cart as adjustment item - no immediate API call
      console.log('🔧 [DEBUG] About to call onAddAdjustment:', { adjustmentProduct: adjustmentProduct.name, adjustment });
      if (onAddAdjustment) {
        onAddAdjustment(adjustmentProduct, adjustment);
        console.log('✅ [DEBUG] onAddAdjustment called successfully');
      } else {
        console.error('❌ [DEBUG] onAddAdjustment is not defined');
      }
      
    } catch (error) {
      console.error('❌ Failed to adjust inventory:', error);
      // You might want to show a toast notification here
    }
  };

  // Handle direct stock value changes in audit mode
  const handleStockValueChange = (productId: number, variantId: number | null, newStock: number | string) => {
    const key = variantId ? `${productId}-${variantId}` : `${productId}`;
    setEditedStockValues(prev => ({
      ...prev,
      [key]: newStock
    }));
  };

  // Apply stock value change (set stock to specific amount)
  const handleStockValueApply = async (productId: number, variantId: number | null, newStock: number, currentStock: number) => {
    try {
      const adjustment = newStock - currentStock;
      
      if (adjustment === 0) {
        return; // No change needed
      }

      // Find the product being adjusted
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.error('Product not found for stock adjustment');
        return;
      }

      // Create adjustment product for cart
      let adjustmentProduct = { ...product };
      
      // If it's a variant, update the product details
      if (variantId && product.has_variants && product.variants) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          adjustmentProduct = {
            ...product,
            id: variantId,
            name: `${product.name} - ${variant.name}`,
            sku: variant.sku,
            regular_price: variant.regular_price,
            sale_price: variant.sale_price,
            inventory: variant.inventory.map(inv => ({
              location_id: inv.location_id.toString(),
              location_name: `Location ${inv.location_id}`,
              stock: inv.quantity,
              manage_stock: true
            })),
            total_stock: variant.total_stock,
            parent_id: product.id
          };
        }
      }

      // Add to cart as adjustment item
      if (onAddAdjustment) {
        onAddAdjustment(adjustmentProduct, adjustment);
      }
      
    } catch (error) {
      console.error('❌ Failed to apply stock adjustment:', error);
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
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-neutral-400">{error}</p>
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
          <div className="text-neutral-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-neutral-400">No products found</p>
          <p className="text-sm text-neutral-600 mt-2">
            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Product Grid */}
      <div className="grid grid-cols-3 gap-2 p-2">
        {filteredProducts.map((product) => {
          const userLocationId = user?.location_id ? parseInt(user.location_id) : undefined;
          
          return (
            <ProductCard
              key={product.id} 
              product={product}
              userLocationId={userLocationId}
              selectedVariants={selectedVariants}
              editedStockValues={editedStockValues}
              focusedStockFields={focusedStockFields}
              selectedProducts={selectedProducts}
              isAuditMode={isAuditMode}
              onVariantSelect={handleVariantSelect}
              onQuantityChange={handleQuantityChange}
              onStockFieldFocus={handleStockFieldFocus}
              onStockFieldBlur={handleStockFieldBlur}
              onStockValueChange={handleStockValueChange}
              onStockValueApply={handleStockValueApply}
              onInventoryAdjustment={handleInventoryAdjustment}
              onProductSelection={handleProductSelection}
              onAddToCartWithVariant={handleAddToCartWithVariant}
            />
                          );
                        })}
                          </div>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
