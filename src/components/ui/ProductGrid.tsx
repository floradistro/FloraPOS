'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QuantitySelector } from './QuantitySelector';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';
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

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !categoryFilter || 
      product.categories.some(cat => cat.slug === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

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

  // Helper functions for focus state management
  const handleStockFieldFocus = (fieldKey: string) => {
    setFocusedStockFields(prev => new Set(prev).add(fieldKey));
  };

  const handleStockFieldBlur = (fieldKey: string) => {
    setFocusedStockFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldKey);
      return newSet;
    });
  };

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

  // Portal2 pricing logic - get blueprint pricing for products
  const getBlueprintPricingForProduct = async (product: any): Promise<BlueprintPricingData | null> => {
    try {
      console.log(`🔍 Getting blueprint pricing for product ${product.id}`);
      
      // Extract category IDs from product
      const categoryIds = product.categories ? product.categories.map((cat: any) => parseInt(cat.id)) : [];
      const pricingData = await BlueprintPricingService.getBlueprintPricingForProduct(product.id, categoryIds);
      
      if (pricingData) {
        console.log(`✅ Found blueprint pricing for product ${product.id}:`, pricingData);
      } else {
        console.log(`❌ No blueprint pricing found for product ${product.id}`);
      }
      
      return pricingData;
    } catch (error) {
      console.error(`❌ Error getting blueprint pricing for product ${product.id}:`, error);
      return null;
    }
  };



  const fetchProducts = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching all products using Flora IM API...`);
      
      // Use the POSV1 proxy endpoint for Flora IM API
      const params = new URLSearchParams({
        per_page: '100',
        page: '1',
        _t: Date.now().toString()
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
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
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

      // Process products and add blueprint pricing
      const normalizedProducts: Product[] = await Promise.all(
        filteredProducts.map(async (product: any) => {
          try {
            // Ensure inventory is in the right format
            const inventory = product.inventory?.map((inv: any) => ({
              location_id: inv.location_id?.toString() || '0',
              location_name: inv.location_name || `Location ${inv.location_id}`,
              stock: parseFloat(inv.stock) || parseFloat(inv.quantity) || 0,
              manage_stock: true
            })) || [];

            const baseProduct: Product = {
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

            // Try to get blueprint pricing, but don't fail if it doesn't work
            try {
              console.log(`🔍 [POSV1] Getting blueprint pricing for product ${product.id}`);
              const blueprintPricing = await getBlueprintPricingForProduct(baseProduct);
              if (blueprintPricing) {
                baseProduct.blueprintPricing = blueprintPricing;
              }
              
              if (blueprintPricing) {
                console.log(`✅ Found blueprint pricing for product ${product.id}`);
              }
            } catch (pricingError) {
              console.warn(`⚠️ [POSV1] Failed to get blueprint pricing for product ${product.id}:`, pricingError instanceof Error ? pricingError.message : 'Unknown error');
              // Continue without pricing
            }

            // Check if this is a variable product and load variants
            if (baseProduct.type === 'variable') {
              try {
                console.log(`🔍 [POSV1] Loading variants for variable product ${product.id}`);
                const variants = await loadVariantsForProduct(product.id);
                
                if (variants && variants.length > 0) {
                  baseProduct.has_variants = true;
                  baseProduct.variants = variants;
                  console.log(`✅ [POSV1] Loaded ${variants.length} variants for product ${product.id}`);
                } else {
                  console.warn(`⚠️ [POSV1] No variants found for variable product ${product.id}`);
                }
              } catch (variantError) {
                console.error(`❌ [POSV1] Failed to load variants for product ${product.id}:`, variantError instanceof Error ? variantError.message : 'Unknown error');
                // Continue without variants
              }
            }

            return baseProduct;
          } catch (productError) {
            console.error(`❌ Failed to process product ${product.id}:`, productError);
            // Return minimal product structure to prevent complete failure
            return {
              id: product.id,
              name: product.name || 'Unknown Product',
              sku: product.sku || '',
              type: product.type || 'simple',
              status: product.status || 'publish',
              regular_price: product.regular_price || '0',
              sale_price: product.sale_price,
              image: product.image,
              categories: product.categories || [],
              inventory: product.inventory || [],
              total_stock: product.total_stock || 0,
              meta_data: product.meta_data || [],
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
  };

  // Load products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categoryFilter]);

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

  // Handle variant selection inline
  const handleVariantSelect = (productId: number, variantId: number) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantId
    }));
  };

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

  // Portal2 style quantity change handler - update product selection state
  const handleQuantityChange = (productId: number, quantity: number, price: number, category?: string) => {
    console.log(`🔄 Quantity selected for product ${productId}: ${quantity} @ $${price} (${category || 'no category'})`);
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId 
          ? { ...p, selected_quantity: quantity, selected_price: price, selected_category: category }
          : p
      )
    );
  };

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

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`;
  };

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
          
          // Stock display logic that accounts for selected variants
          let stockDisplay = 0;
          let totalStock = product.total_stock || 0;
          let displayPrice = product.regular_price;
          let isInStock = false;

          if (product.has_variants && product.variants) {
            const selectedVariantId = selectedVariants[product.id];
            const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
            
            if (selectedVariant) {
              // Show selected variant stock and price
              if (userLocationId) {
                const locationInventory = selectedVariant.inventory.find(inv => 
                  inv.location_id === userLocationId
                );
                stockDisplay = locationInventory?.quantity || 0;
              } else {
                stockDisplay = selectedVariant.total_stock;
              }
              displayPrice = selectedVariant.sale_price || selectedVariant.regular_price;
              isInStock = stockDisplay > 0;
            } else {
              // No variant selected, show aggregate info
              stockDisplay = product.variants.reduce((sum, variant) => {
                if (userLocationId) {
                  const locationInventory = variant.inventory.find(inv => inv.location_id === userLocationId);
                  return sum + (locationInventory?.quantity || 0);
                } else {
                  return sum + variant.total_stock;
                }
              }, 0);
              isInStock = stockDisplay > 0;
            }
          } else {
            // Simple product logic
            if (userLocationId) {
              const locationInventory = product.inventory.find(inv => 
                parseInt(inv.location_id) === userLocationId
              );
              stockDisplay = locationInventory?.stock || 0;
            } else {
              stockDisplay = totalStock;
            }
            isInStock = stockDisplay > 0;
          }

          
          const isSelected = isAuditMode && selectedProducts.has(product.id);
          
          return (
            <div 
              key={product.id} 
              onClick={(e) => handleProductSelection(product, e)}
              className={`bg-transparent rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out cursor-pointer shadow-sm ${
                isAuditMode 
                  ? isSelected
                    ? 'border border-white/[0.15] bg-neutral-800/30 hover:bg-neutral-800/40'
                    : 'border border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20'
                  : 'border border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20 hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {/* Product Image and Name Row */}
              <div className="flex gap-3 items-start mb-3">
                {/* Product Image */}
                <div className="w-16 h-16 relative overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Name and Category */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-neutral-400 font-medium text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.categories.length > 0 && (
                    <p className="text-neutral-500 text-xs mb-1">
                      {product.categories[0].name}
                    </p>
                  )}
                </div>

                {/* Quantity Selector for Non-Variant Products in Adjustment Mode */}
                {isAuditMode && !product.has_variants && (
                  <div className="flex items-center">
                    <div className="relative flex items-center">
                      {/* Decrease Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInventoryAdjustment(product.id, null, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                        }}
                        className="absolute left-1 z-10 w-6 h-6 text-neutral-500 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                        title={product.blueprintPricing ? "Decrease by 0.1" : "Decrease by 1"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        step={product.blueprintPricing ? "0.1" : "1"}
                        value={(() => {
                          const key = `${product.id}`;
                          const value = editedStockValues[key] !== undefined ? editedStockValues[key] : stockDisplay;
                          return typeof value === 'string' ? value : (typeof value === 'number' ? (product.blueprintPricing ? value.toFixed(2) : Math.floor(value).toString()) : value);
                        })()}
                        onChange={(e) => {
                          handleStockValueChange(product.id, null, e.target.value);
                        }}
                        onFocus={() => handleStockFieldFocus(`${product.id}`)}
                        onBlur={() => {
                          const key = `${product.id}`;
                          const newStock = editedStockValues[key];
                          
                          handleStockFieldBlur(`${product.id}`);
                          if (newStock !== undefined && newStock !== stockDisplay) {
                            const numericValue = typeof newStock === 'string' ? parseFloat(newStock) || 0 : newStock;
                            handleStockValueApply(product.id, null, numericValue, stockDisplay);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-32 h-8 text-sm text-center bg-neutral-700/50 border border-neutral-600 rounded text-neutral-300 focus:border-neutral-500 focus:outline-none font-medium pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      
                      {/* Increase Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInventoryAdjustment(product.id, null, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                        }}
                        className="absolute right-1 z-10 w-6 h-6 text-neutral-500 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                        title={product.blueprintPricing ? "Increase by 0.1" : "Increase by 1"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Variant Selector and Quantity Selector / Audit Controls */}
              <div className="mb-4">
                {isAuditMode ? (
                  /* Audit Mode - Stacked Quantity Editors for Variants */
                  <div className="space-y-2">
                    {product.has_variants && product.variants ? (
                      /* Variant Products - Stacked Quantity Editors */
                      <div className="space-y-1">
                        {product.variants.slice(0, 4).map((variant) => {
                          const variantStock = userLocationId 
                            ? variant.inventory.find(inv => inv.location_id === userLocationId)?.quantity || 0
                            : variant.total_stock;
                          
                          const editKey = `${product.id}-${variant.id}`;
                          const editedValue = editedStockValues[editKey];
                          const displayStock = editedValue !== undefined ? editedValue : variantStock;

                          return (
                            <div key={variant.id} className="flex items-center justify-between py-2 px-3 bg-transparent border-b border-neutral-800/30 last:border-b-0">
                              {/* Variant Name */}
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="text-xs font-medium text-neutral-300 truncate">
                                  {variant.name}
                                </div>
                              </div>
                              
                                                            {/* Integrated Quantity Editor */}
                              <div className="relative flex items-center">
                                {/* Decrease Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                                  }}
                                  className="absolute left-0.5 z-10 w-5 h-5 text-neutral-500 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                                  title={product.blueprintPricing ? "Decrease by 0.1" : "Decrease by 1"}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                {/* Stock Display/Input */}
                                <input
                                  type="number"
                                  min="0"
                                  step={product.blueprintPricing ? "0.1" : "1"}
                                  value={typeof displayStock === 'string' ? displayStock : (typeof displayStock === 'number' ? (product.blueprintPricing ? displayStock.toFixed(2) : Math.floor(displayStock).toString()) : displayStock)}
                                  onChange={(e) => {
                                    handleStockValueChange(product.id, variant.id, e.target.value);
                                  }}
                                  onFocus={() => handleStockFieldFocus(`${product.id}-${variant.id}`)}
                                  onBlur={() => {
                                    handleStockFieldBlur(`${product.id}-${variant.id}`);
                                    if (editedValue !== undefined && editedValue !== variantStock) {
                                      const numericValue = typeof editedValue === 'string' ? parseFloat(editedValue) || 0 : editedValue;
                                      handleStockValueApply(product.id, variant.id, numericValue, variantStock);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-40 h-6 text-sm text-center bg-neutral-700/50 border border-neutral-600 rounded text-neutral-300 focus:border-neutral-500 focus:outline-none pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                
                                {/* Increase Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                                  }}
                                  className="absolute right-0.5 z-10 w-5 h-5 text-neutral-500 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                                  title={product.blueprintPricing ? "Increase by 0.1" : "Increase by 1"}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {product.variants.length > 4 && (
                          <div className="text-xs text-neutral-600 text-center py-1 border-t border-dashed border-neutral-800/20">
                            +{product.variants.length - 4} more variants
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Normal Mode - Full Quantity Selector */
                  product.has_variants && product.variants ? (
                    <div className="space-y-2">
                      {/* Variant options - Clean theme-consistent design */}
                      <div className="grid grid-cols-2 gap-1">
                        {product.variants.slice(0, 6).map((variant) => {
                          const selectedVariantId = selectedVariants[product.id];
                          const isSelected = selectedVariantId === variant.id;
                          const variantStock = userLocationId 
                            ? variant.inventory.find(inv => inv.location_id === userLocationId)?.quantity || 0
                            : variant.total_stock;
                          const variantInStock = variantStock > 0;

                          return (
                            <button
                              key={variant.id}
                              onClick={() => handleVariantSelect(product.id, variant.id)}
                              disabled={!variantInStock}
                              className={`w-full px-2 py-2 text-xs rounded transition-colors text-left ${
                                isSelected
                                  ? 'bg-transparent border border-neutral-600 text-neutral-200'
                                  : variantInStock
                                  ? 'bg-transparent border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 hover:bg-neutral-800/10'
                                  : 'bg-transparent border border-neutral-800/40 text-neutral-600 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="truncate font-medium">{variant.name}</div>
                              <div className="mt-1">
                                <span className={`text-xs ${variantInStock ? 'text-neutral-500' : 'text-red-400'}`}>
                                  {variantInStock ? `${variantStock} in stock` : 'Out of stock'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        {product.variants.length > 6 && (
                          <div className="text-xs text-neutral-500 text-center py-2 col-span-2 border border-dashed border-neutral-800 rounded">
                            +{product.variants.length - 6} more variants
                          </div>
                        )}
                      </div>

                      {/* Show quantity selector ONLY after variant is selected and NOT in audit mode */}
                      {!isAuditMode && selectedVariants[product.id] && (
                        <div className="mt-3 pt-3 border-t border-neutral-800">
                          <QuantitySelector
                            productId={selectedVariants[product.id]} // Use variant ID
                            basePrice={parseFloat(
                              product.variants.find(v => v.id === selectedVariants[product.id])?.sale_price ||
                              product.variants.find(v => v.id === selectedVariants[product.id])?.regular_price ||
                              '0'
                            )}
                            blueprintPricing={product.blueprintPricing}
                            onQuantityChange={(quantity, price, category) => 
                              handleQuantityChange(product.id, quantity, price, category)
                            }
                            disabled={false}
                          />
                        </div>
                      )}
                    </div>
                  ) : !isAuditMode ? (
                    <QuantitySelector
                      productId={product.id}
                      basePrice={parseFloat(product.regular_price) || 0}
                      blueprintPricing={product.blueprintPricing}
                      onQuantityChange={(quantity, price, category) => handleQuantityChange(product.id, quantity, price, category)}
                      disabled={false}
                    />
                  ) : null
                )}
              </div>

              {/* Stock Info */}
              <div className="text-center mb-2 h-4 flex items-center justify-center">
                {isAuditMode ? (
                  /* Audit Mode - Show current stock only when field is focused */
                  <span className={`text-xs text-neutral-500 transition-opacity duration-200 ${
                    focusedStockFields.has(`${product.id}`) || (product.has_variants && selectedVariants[product.id] && focusedStockFields.has(`${product.id}-${selectedVariants[product.id]}`))
                      ? 'opacity-100' 
                      : 'opacity-0'
                  }`}>
                    {product.has_variants && product.variants
                      ? `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`
                      : `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`}
                  </span>
                ) : (
                  /* Normal Mode - Display Only */
                  <span className="text-xs text-neutral-500">
                    {product.has_variants && !selectedVariants[product.id] 
                      ? `${stockDisplay} total stock` 
                      : `${stockDisplay} in stock`}
                  </span>
                )}
              </div>

              {/* Selected Price - Bottom Left - Only show in normal mode */}
              {!isAuditMode && (
                <div className="absolute bottom-2 left-2 text-xs text-neutral-500">
                  {product.has_variants && selectedVariants[product.id] ? (
                    product.selected_price ? formatPrice(product.selected_price) : (
                      <span className="text-neutral-600">Select quantity</span>
                    )
                  ) : product.selected_price ? (
                    formatPrice(product.selected_price)
                  ) : (
                    formatPrice(displayPrice)
                  )}
                </div>
              )}

              {/* Action Buttons - Add to Cart */}
              {!isAuditMode && (
                /* Normal Mode - Add to Cart Button */
                ((product.has_variants && selectedVariants[product.id] && product.selected_quantity && product.selected_price) || 
                  (!product.has_variants && ((product.selected_quantity && product.selected_price) || !product.blueprintPricing))) ? (
                  <button
                    onClick={() => handleAddToCartWithVariant(product)}
                    disabled={!isInStock}
                    className="absolute bottom-2 right-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                    title={isInStock ? 'Add to Cart' : 'Out of Stock'}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ) : null
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
