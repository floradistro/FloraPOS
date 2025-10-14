'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, useRef } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';
import { QuantitySelector } from './QuantitySelector';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';
import ProductCard from './ProductCard';
// import { inventoryEventBus } from '../../utils/inventoryEventBus'; // Disabled to prevent automatic refresh

// Category Header Component with smooth animations
const CategoryHeader = ({ categoryName, productCount }: { categoryName: string; productCount: number }) => (
  <div className="col-span-full px-6 py-4 sticky top-0 z-20 category-header-animate">
    <div className="flex items-center justify-center gap-4">
      <h2 className="text-2xl font-mono font-medium text-neutral-300 tracking-wider text-center category-title-animate transform transition-all duration-700 ease-out hover:scale-105 hover:text-neutral-100 lowercase">
        {categoryName}
      </h2>
      <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
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
  blueprintFieldValues?: string[] | undefined;
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  onProductsChange?: (products: Product[]) => void;
  onUnfilteredProductsChange?: (products: Product[]) => void;
  viewMode?: 'grid' | 'list';
  showImages?: boolean;
  sortOrder?: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'default';
}

export const ProductGrid = forwardRef<{ 
  refreshInventory: () => Promise<void>;
  updateProductQuantities: (updates: Array<{ productId: number; variantId?: number; newQuantity: number }>) => void;
}, ProductGridProps>(
  ({ onAddToCart, searchQuery, categoryFilter, selectedBlueprintField, blueprintFieldValues, onLoadingChange, onProductsChange, onUnfilteredProductsChange, viewMode = 'grid', showImages = true, sortOrder = 'default' }, ref) => {
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

  // Pre-fetch blueprint field data when products load - USE BULK ENDPOINT DATA
  useEffect(() => {
    if (products.length > 0) {
      // OPTIMIZATION: Bulk endpoint already includes meta_data, just extract it
      const blueprintFieldsMap: Record<number, any> = {};
      
      products.forEach((product) => {
        if (product.meta_data && Array.isArray(product.meta_data)) {
          // Extract ALL blueprint-related meta from bulk endpoint data
          blueprintFieldsMap[product.id] = product.meta_data.filter((meta: any) => 
            meta.key && (
              meta.key.startsWith('_blueprint_') || 
              meta.key.startsWith('blueprint_') ||
              meta.key === 'effect' ||
              meta.key === 'lineage' ||
              meta.key === 'nose' ||
              meta.key === 'terpene' ||
              meta.key === 'strain_type' ||
              meta.key === 'thca_percentage' ||
              meta.key === 'supplier' ||
              meta.key === '_effect' ||
              meta.key === '_lineage' ||
              meta.key === '_nose' ||
              meta.key === '_terpene' ||
              meta.key === '_strain_type' ||
              meta.key === '_thca_percentage' ||
              meta.key === '_supplier' ||
              meta.key === 'effects' ||
              meta.key === '_effects' ||
              meta.key === 'thc_percentage' ||
              meta.key === '_thc_percentage'
            )
          );
        }
      });
      
      const totalFields = Object.values(blueprintFieldsMap).reduce((sum: number, fields: any) => sum + fields.length, 0);
      console.log(`⚡ [ProductGrid] Extracted ${totalFields} blueprint fields from ${Object.keys(blueprintFieldsMap).length} products (from bulk endpoint)`);
      
      setProductBlueprintFields(blueprintFieldsMap);
    }
  }, [products]);

  // Memoized filtered and grouped products for performance
  const { filteredProducts, groupedByCategory } = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !categoryFilter || 
        product.categories.some(cat => cat.slug === categoryFilter);
      
      // Blueprint field filtering - supports multiple values
      const matchesBlueprintField = !selectedBlueprintField || !blueprintFieldValues || blueprintFieldValues.length === 0 || (() => {
        // If blueprint data hasn't loaded yet, don't filter (show all products)
        if (Object.keys(productBlueprintFields).length === 0) {
          console.log('⏳ Blueprint data not loaded yet, showing all products');
          return true;
        }
        
        const blueprintMeta = productBlueprintFields[product.id];
        if (!blueprintMeta || !Array.isArray(blueprintMeta)) {
          console.log(`❌ No blueprint meta for product ${product.id}`);
          return false;
        }
        
        // Look for field with various possible formats (same as UnifiedSearchInput)
        const possibleKeys = [
          selectedBlueprintField,
          `_${selectedBlueprintField}`,
          `blueprint_${selectedBlueprintField}`,
          `_blueprint_${selectedBlueprintField}`,
          // Special cases for known field name variations
          selectedBlueprintField === 'effect' ? '_blueprint_effects' : null,
          selectedBlueprintField === 'effect' ? 'effects' : null,
          selectedBlueprintField === 'effect' ? '_effects' : null,
          selectedBlueprintField === 'thca_percentage' ? '_blueprint_thc_percentage' : null,
          selectedBlueprintField === 'thca_percentage' ? 'thc_percentage' : null,
          selectedBlueprintField === 'thca_percentage' ? '_thc_percentage' : null
        ].filter(Boolean);
        
        const fieldMeta = blueprintMeta.find((meta: any) => possibleKeys.includes(meta.key));
        
        if (!fieldMeta || !fieldMeta.value) {
          console.log(`❌ Product ${product.id} missing field ${selectedBlueprintField}. Checked keys: ${possibleKeys.join(', ')}`);
          return false;
        }
        
        // Check if ANY selected value matches (support comma-separated values in product)
        const fieldValue = fieldMeta.value.toString().trim();
        const productValueParts = fieldValue.split(',').map((v: string) => v.trim());
        
        // Product matches if it has ANY of the selected filter values
        const matches = blueprintFieldValues.some(filterValue => 
          productValueParts.some((productValue: string) => productValue === filterValue.trim())
        );
        
        if (matches) {
          console.log(`✅ Product ${product.id} (${product.name}) matches ${selectedBlueprintField} with values: ${blueprintFieldValues.join(', ')} (key: ${fieldMeta.key})`);
        } else {
          console.log(`❌ Product ${product.id} field value "${fieldValue}" doesn't match any of: ${blueprintFieldValues.join(', ')}`);
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
        // Apply custom sort order if not default
        if (sortOrder !== 'default') {
          switch (sortOrder) {
            case 'name-asc':
              return a.name.localeCompare(b.name);
            case 'name-desc':
              return b.name.localeCompare(a.name);
            case 'price-asc': {
              const priceA = parseFloat(a.sale_price || a.regular_price || '0');
              const priceB = parseFloat(b.sale_price || b.regular_price || '0');
              return priceA - priceB;
            }
            case 'price-desc': {
              const priceA = parseFloat(a.sale_price || a.regular_price || '0');
              const priceB = parseFloat(b.sale_price || b.regular_price || '0');
              return priceB - priceA;
            }
            case 'stock-asc':
              return a.total_stock - b.total_stock;
            case 'stock-desc':
              return b.total_stock - a.total_stock;
            default:
              break;
          }
        }
        
        // Default sorting behavior
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
  }, [products, searchQuery, categoryFilter, selectedBlueprintField, blueprintFieldValues, productBlueprintFields, sortOrder]);

  // Notify parent when filtered products change
  useEffect(() => {
    onProductsChange?.(filteredProducts);
  }, [filteredProducts, onProductsChange]);
  
  // Notify parent when unfiltered products change (for blueprint field extraction)
  useEffect(() => {
    onUnfilteredProductsChange?.(products);
  }, [products, onUnfilteredProductsChange]);


  // Simple refresh method - just reload the products
  const refreshInventory = async () => {
    try {
      setIsRefreshing(true);
      
      // Just reload the products - this will get fresh inventory data
      await fetchProducts();
      
    } catch (error) {
      console.error('❌ [POSV1] Failed to refresh inventory:', error);
      // Don't rethrow - prevent crashes
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update specific product quantities without full reload
  const updateProductQuantities = useCallback((updates: Array<{ productId: number; variantId?: number; newQuantity: number }>) => {
    
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

      // Use optimized bulk endpoint
      const params = new URLSearchParams({
        per_page: '1000',
        page: '1',
      });

      // Add location ID for stock filtering
      if (user?.location_id) {
        params.append('location_id', user.location_id);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      // Use BULK API endpoint - 1 call vs 300+
      const floraApiUrl = `/api/proxy/flora-im/products/bulk?${params}`;
      
      const response = await apiFetch(floraApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Flora IM Bulk API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`⚡ Bulk API loaded ${result.data?.length || 0} products in ${result.meta?.load_time_ms || 0}ms (${result.meta?.queries_executed || 0} queries)`);
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from Flora IM API');
      }

      const productsWithInventory = result.data;

      // Bulk API already handles filtering, just process the products
      const baseProducts: Product[] = productsWithInventory.map((product: any) => {
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

      // OPTIMIZATION: Show products immediately, load pricing in background
      // This makes initial render INSTANT (~100ms) instead of waiting for pricing (~2s)
      const normalizedProducts: Product[] = baseProducts.map(baseProduct => {
        // Initially null pricing - will be loaded in background
        baseProduct.blueprintPricing = null;
        
        if (baseProduct.type === 'variable') {
          baseProduct.has_variants = true;
          baseProduct.variants = []; // Load on-demand when selected
        }
        return baseProduct;
      });

      const loadTime = Date.now() - startTime;
      console.log(`⚡ Products loaded in ${loadTime}ms (bulk endpoint only - INSTANT)`);

      // Show products immediately
      setProducts(normalizedProducts);
      
      // Load blueprint pricing in background (non-blocking)
      console.log(`🔄 Loading pricing tiers in background for ${baseProducts.length} products...`);
      BlueprintPricingService.getBlueprintPricingBatch(
        baseProducts.map(p => ({
          id: p.id,
          categoryIds: p.categories?.map(cat => cat.id) || []
        }))
      ).then(batchPricingResponse => {
        // Update products with pricing data
        setProducts(prevProducts => 
          prevProducts.map(product => {
            const pricingData = batchPricingResponse[product.id];
            return pricingData ? { ...product, blueprintPricing: pricingData } : product;
          })
        );
        const successCount = Object.values(batchPricingResponse).filter(p => p !== null).length;
        console.log(`✅ Pricing tiers loaded in background: ${successCount}/${baseProducts.length} products`);
      }).catch(error => {
        console.error('❌ Background pricing load failed:', error);
        // Products already visible, just without pricing tiers
      });
      
      // Notify parent of UNFILTERED products for blueprint field extraction
      onUnfilteredProductsChange?.(normalizedProducts);

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
      
      // Get variants from WooCommerce API
      const variantsUrl = `/api/proxy/woocommerce/products/${productId}/variations?per_page=100`;
      const variantsResponse = await fetch(variantsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      const inventoryItems = variants.map((v: any) => ({
        product_id: productId,
        variation_id: v.id
      }));

      const batchInventoryResponse = await fetch('/api/inventory/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
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

      return transformedVariants;

    } catch (error) {
      console.error(`❌ Error loading variants for product ${productId}:`, error);
      return null;
    }
  }, [user?.location_id]);

  // Handle product selection for highlighting
  const handleProductSelection = useCallback(async (product: Product) => {
    if (selectedProduct === product.id) {
      // Deselect if clicking the same product
      setSelectedProduct(null);
    } else {
      // Select new product
      setSelectedProduct(product.id);
      
      // Load variants if this is a variable product and variants aren't loaded yet
      if (product.has_variants && (!product.variants || product.variants.length === 0)) {
        console.log(`🔄 Loading variants for product ${product.id}...`);
        const loadedVariants = await loadVariantsForProduct(product.id);
        
        if (loadedVariants && loadedVariants.length > 0) {
          console.log(`✅ Loaded ${loadedVariants.length} variants for product ${product.id}`);
          // Update the product in state with loaded variants
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p.id === product.id 
                ? { ...p, variants: loadedVariants }
                : p
            )
          );
        } else {
          console.warn(`⚠️ No variants loaded for product ${product.id}`);
        }
      }
    }
  }, [selectedProduct, loadVariantsForProduct]);

  // Enhanced add to cart that handles variants (loaded on-demand)
  const handleAddToCartWithVariant = (product: Product) => {
    if (product.has_variants) {
      // Variants are loaded when product is selected
      
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
        <p className="text-sm font-mono text-neutral-500 lowercase">
          {searchQuery ? `no results found` : 'no products available'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative smooth-scroll">
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div ref={gridRef} className="grid grid-cols-3 max-[1024px]:grid-cols-2 gap-3 py-3 product-grid scrollable-container">
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
                  
                  return (
                    <div 
                      key={product.id} 
                      className="product-grid-cell relative group bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 apple-smooth card-hover"
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
                      showImage={showImages}
                    />
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div ref={gridRef} className="py-3">
          {groupedByCategory.map((categoryGroup, groupIndex) => {
            const userLocationId = user?.location_id ? parseInt(user.location_id) : undefined;
            
            return (
              <div key={categoryGroup.category.slug} className="mb-6">
                {/* Category Header for List View */}
                <div className="px-6 py-4 backdrop-blur-xl bg-white/[0.02] rounded-xl mb-2">
                  <div className="flex items-center justify-center gap-4">
                    <h2 className="text-2xl font-mono font-medium text-neutral-300 tracking-wider text-center lowercase">
                      {categoryGroup.category.name}
                    </h2>
                    <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
                      {categoryGroup.products.length}
                    </span>
                  </div>
                </div>
                
                {/* Products in List View */}
                {categoryGroup.products.map((product, productIndex) => {
                  const globalIndex = groupedByCategory
                    .slice(0, groupIndex)
                    .reduce((sum, group) => sum + group.products.length, 0) + productIndex;
                  
                  const locationInventory = userLocationId 
                    ? product.inventory?.find(inv => inv.location_id === userLocationId.toString())
                    : product.inventory?.[0];
                  
                  const stock = locationInventory ? locationInventory.stock : product.total_stock;
                  const hasVariants = product.has_variants || (product.variants && product.variants.length > 0);
                  const selectedVariantId = hasVariants ? selectedVariants[product.id] : undefined;
                  const selectedVariant = selectedVariantId 
                    ? product.variants?.find(v => v.id === selectedVariantId)
                    : null;

                  // Determine price and stock based on selection
                  let displayPrice = product.sale_price || product.regular_price;
                  let displayStock = stock;
                  
                  if (hasVariants && selectedVariant) {
                    displayPrice = selectedVariant.sale_price || selectedVariant.regular_price;
                    const variantInv = userLocationId
                      ? selectedVariant.inventory?.find((inv: any) => inv.location_id === userLocationId)
                      : selectedVariant.inventory?.[0];
                    displayStock = variantInv?.quantity || selectedVariant.total_stock || 0;
                  }

                  const isProductSelected = selectedProduct === product.id;
                  
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelection(product)}
                      className={`group transition-all duration-300 cursor-pointer border-l-[3px] rounded-xl my-1 ${
                        isProductSelected 
                          ? 'bg-white/[0.04] border-l-white/40 shadow-lg' 
                          : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-neutral-600/30'
                      }`}
                      style={{
                        animation: `slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${globalIndex * 0.03}s both`,
                      }}
                    >
                      <div className="px-4 py-4 flex items-center gap-6">
                        {/* Product Image */}
                        {showImages && (
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/30">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Product Name & SKU */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-neutral-200 truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {product.sku}
                          </p>
                          {!isProductSelected && (
                            <p className="text-[10px] text-neutral-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Click to select
                            </p>
                          )}
                        </div>

                        {/* Variant Selector - Only show when selected */}
                        {isProductSelected && hasVariants && product.variants && product.variants.length > 0 && (
                          <div className="flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-200">
                            <select
                              value={selectedVariantId || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                const variantId = parseInt(e.target.value);
                                if (variantId) {
                                  handleVariantSelect(product.id, variantId);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-neutral-800/50 text-neutral-200 text-xs rounded-lg px-3 py-2 border border-neutral-700/40 focus:outline-none focus:ring-2 focus:ring-neutral-600 backdrop-blur-sm"
                            >
                              <option value="">Select variant</option>
                              {product.variants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quantity Selector - Only show when selected */}
                        {isProductSelected && (
                          <div className="flex-shrink-0 min-w-[280px] animate-in fade-in slide-in-from-right-4 duration-200">
                            <QuantitySelector
                              productId={hasVariants && selectedVariantId ? selectedVariantId : product.id}
                              basePrice={parseFloat(displayPrice || '0')}
                              blueprintPricing={product.blueprintPricing}
                              onQuantityChange={(quantity, price, category) => 
                                handleQuantityChange(product.id, quantity, price, category)
                              }
                              disabled={false}
                              compact={true}
                            />
                          </div>
                        )}

                        {/* Stock Display */}
                        <div className="flex-shrink-0 w-24 text-right">
                          <div className="text-sm font-medium text-neutral-400">
                            {displayStock.toFixed(1)}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            in stock
                          </div>
                        </div>

                        {/* Add to Cart Button - Only show when selected and quantity chosen */}
                        {isProductSelected && product.selected_quantity && (!hasVariants || selectedVariantId) && (
                          <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCartWithVariant(product);
                              }}
                              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 bg-white text-neutral-900 hover:bg-neutral-200 shadow-lg hover:shadow-xl"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      
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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-left-4 {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-right-4 {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fadeIn;
        }

        .slide-in-from-left-4 {
          animation-name: slide-in-from-left-4;
        }

        .slide-in-from-right-4 {
          animation-name: slide-in-from-right-4;
        }

        .duration-200 {
          animation-duration: 200ms;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
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
