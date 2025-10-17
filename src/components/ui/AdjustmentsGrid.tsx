'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductAuditTable } from './ProductAuditTable';
import { RestockHistoryTable } from './RestockHistoryTable';
import { AuditHistoryTable } from './AuditHistoryTable';
import { AllHistoryTable } from './AllHistoryTable';
import { SalesHistoryTable } from './SalesHistoryTable';
import { ProductDashboard } from './ProductDashboard';
import { BlueprintPricingService, BlueprintPricingData } from '../../services/blueprint-pricing-service';
import { PurchaseOrdersService, type RestockProduct } from '../../services/purchase-orders-service';

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
  blueprintPricing?: BlueprintPricingData | null;
  parent_id?: number;
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

interface AdjustmentsGridProps {
  searchQuery?: string;
  categoryFilter?: string;
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  isAuditMode?: boolean;
  isRestockMode?: boolean;
  showOnlySelected?: boolean;
  onShowOnlySelectedChange?: (show: boolean) => void;
  sortAlphabetically?: boolean;
  onSortAlphabeticallyChange?: (sort: boolean) => void;
  onRestock?: () => void;
  onAudit?: () => void;
  onDashboardAction?: (action: {
    type: 'audit' | 'restock';
    filter?: {
      category?: string;
      search?: string;
      mode?: 'aging' | 'lowStock' | 'category';
    };
  }) => void;
}

export interface AdjustmentsGridRef {
  refreshInventory: () => Promise<void>;
  createAudit: () => void;
  createAuditWithDetails: (name: string, description?: string) => Promise<void>;
  getPendingAdjustments: () => Map<string, number>;
  getIsApplying: () => boolean;
  getProducts: () => Product[];
  removeAdjustment: (key: string) => void;
  updateAdjustment: (key: string, newValue: number) => void;
  // Purchase order methods
  createPurchaseOrder: () => void;
  createPurchaseOrderWithDetails: (supplierName: string, notes?: string) => Promise<void>;
  getPendingRestockProducts: () => Map<string, number>;
  getIsCreatingPO: () => boolean;
  removeRestockProduct: (key: string) => void;
  updateRestockQuantity: (key: string, quantity: number) => void;
  // View control
  showHistoryTab: (tab: 'all' | 'restock' | 'audit' | 'sales') => void;
}

export const AdjustmentsGrid = forwardRef<AdjustmentsGridRef, AdjustmentsGridProps>(
  ({ 
    searchQuery, 
    categoryFilter, 
    onLoadingChange, 
    isAuditMode = false, 
    isRestockMode = false,
    showOnlySelected = false,
    onShowOnlySelectedChange,
    sortAlphabetically = true,
    onSortAlphabeticallyChange,
    onRestock,
    onAudit,
    onDashboardAction
  }, ref) => {
    const { user } = useAuth();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'restock' | 'audit' | 'all' | 'sales'>('products');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('30'); // Default to 30 days
    
    // Stock editing state
    const [editedStockValues, setEditedStockValues] = useState<Record<string, number | string>>({});
    const [focusedStockFields, setFocusedStockFields] = useState<Set<string>>(new Set());
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    const [pendingAdjustments, setPendingAdjustments] = useState<Map<string, number>>(new Map());
    const [isApplying, setIsApplying] = useState(false);
    const [adjustmentStatus, setAdjustmentStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    
    // Audit batch states
    const [auditName, setAuditName] = useState('');
    const [auditDescription, setAuditDescription] = useState('');
    
    // Purchase order states
    const [pendingRestockProducts, setPendingRestockProducts] = useState<Map<string, number>>(new Map());
    const [supplierName, setSupplierName] = useState('');
    const [poNotes, setPONotes] = useState('');
    const [isCreatingPO, setIsCreatingPO] = useState(false);
    
    // Note: showOnlySelected and sortAlphabetically are now controlled by props

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading, products.length > 0);
    }, [loading, products.length, onLoadingChange]);

    // Auto-dismiss status messages after 3.5 seconds
    useEffect(() => {
      if (adjustmentStatus.type) {
        const timer = setTimeout(() => {
          setAdjustmentStatus({ type: null, message: '' });
        }, 3500);
        return () => clearTimeout(timer);
      }
    }, [adjustmentStatus]);

    // Memoized filtered products
    const filteredProducts = useMemo(() => {
      return products.filter((product) => {
        const matchesSearch = !searchQuery || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = !categoryFilter || 
          product.categories.some(cat => cat.slug === categoryFilter);
        
        // Stock-based filtering based on mode
        let matchesStockCriteria = true;
        
        if (isAuditMode) {
          // Audit mode: only show products with stock > 0
          // IMPORTANT: Variable products have 0 parent stock - always include them if they have variants
          const hasVariantsWithStock = !!(product.has_variants && product.variants && product.variants.some(v => v.total_stock > 0));
          matchesStockCriteria = product.total_stock > 0 || hasVariantsWithStock;
        } else if (isRestockMode) {
          // Restock mode: show entire catalog (no stock filtering)
          matchesStockCriteria = true;
        }
        // If neither mode is active, show all products (default behavior)
        
        // Show only selected filter
        const matchesSelectedFilter = !showOnlySelected || selectedProducts.has(product.id);
        
        return matchesSearch && matchesCategory && matchesStockCriteria && matchesSelectedFilter;
      }).sort((a, b) => {
        // Primary sort: Products with variants go to the bottom (they are taller cards)
        // Check both has_variants flag AND type === 'variable' to be more robust
        const aHasVariants = (a.has_variants && a.variants && a.variants.length > 0) || a.type === 'variable';
        const bHasVariants = (b.has_variants && b.variants && b.variants.length > 0) || b.type === 'variable';
        
        if (aHasVariants && !bHasVariants) return 1; // a goes to bottom
        if (!aHasVariants && bHasVariants) return -1; // b goes to bottom
        
        // Secondary sort: Within each group (with/without variants), sort alphabetically if enabled
        if (sortAlphabetically) {
          return a.name.localeCompare(b.name);
        }
        
        return 0;
      });
    }, [products, searchQuery, categoryFilter, isAuditMode, isRestockMode, showOnlySelected, selectedProducts, sortAlphabetically]);


    // Handle product selection with lazy variant loading
    const handleProductSelection = async (product: Product, event?: React.MouseEvent) => {
      if (event?.target && (event.target as HTMLElement).closest('input, button')) {
        return;
      }
      
      setSelectedProducts(prev => {
        const newSelected = new Set(prev);
        const productKey = product.id;
        
        if (newSelected.has(productKey)) {
          newSelected.delete(productKey);
        } else {
          newSelected.add(productKey);
        }
        
        return newSelected;
      });
      
      // Lazy load variants for variable products when clicked
      if (product.has_variants && (!product.variants || product.variants.length === 0)) {
        console.log(`🔄 Lazy loading variants for ${product.name}...`);
        const loadedVariants = await loadVariantsForProduct(product.id);
        
        if (loadedVariants && loadedVariants.length > 0) {
          console.log(`✅ Loaded ${loadedVariants.length} variants for ${product.name}`);
          // Update product in state
          setProducts(prev => 
            prev.map(p => 
              p.id === product.id 
                ? { ...p, variants: loadedVariants }
                : p
            )
          );
        }
      }
    };

    // Refresh inventory
    const refreshInventory = async () => {
      try {
        setIsRefreshing(true);
        console.log('🔄 [Adjustments] Refreshing products and inventory...');
        
        await fetchProducts();
        
        console.log('✅ [Adjustments] Inventory refresh completed');
      } catch (error) {
        console.error('❌ [Adjustments] Failed to refresh inventory:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Remove individual adjustment
    const removeAdjustment = useCallback((key: string) => {
      console.log('🔧 AdjustmentsGrid removeAdjustment called:', key);
      setPendingAdjustments(prev => {
        const newAdjustments = new Map(prev);
        console.log('🔧 Before delete:', Array.from(prev.entries()));
        newAdjustments.delete(key);
        console.log('🔧 After delete:', Array.from(newAdjustments.entries()));
        return newAdjustments;
      });
    }, []);

    // Update individual adjustment
    const updateAdjustment = useCallback((key: string, newValue: number) => {
      console.log('🔧 AdjustmentsGrid updateAdjustment called:', key, newValue);
      setPendingAdjustments(prev => {
        const newAdjustments = new Map(prev);
        console.log('🔧 Before update:', Array.from(prev.entries()));
        if (newValue === 0) {
          newAdjustments.delete(key);
        } else {
          newAdjustments.set(key, newValue);
        }
        console.log('🔧 After update:', Array.from(newAdjustments.entries()));
        return newAdjustments;
      });
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      refreshInventory,
      createAudit: () => {
        // Legacy method - audit is now inline in ProductAuditTable
      },
      createAuditWithDetails: async (name: string, description?: string) => {
        await applyAuditAdjustments(name, description);
      },
      getPendingAdjustments: () => pendingAdjustments,
      getIsApplying: () => isApplying,
      getProducts: () => products,
      removeAdjustment,
      updateAdjustment,
      // Purchase order methods
      createPurchaseOrder: () => {
        // Legacy method - purchase order is now inline in ProductAuditTable
      },
      createPurchaseOrderWithDetails: async (supplierName: string, notes?: string) => {
        await createPurchaseOrderFromRestock(supplierName, notes);
      },
      getPendingRestockProducts: () => pendingRestockProducts,
      getIsCreatingPO: () => isCreatingPO,
      removeRestockProduct: (key: string) => {
        setPendingRestockProducts(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      },
      updateRestockQuantity: (key: string, quantity: number) => {
        setPendingRestockProducts(prev => {
          const newMap = new Map(prev);
          if (quantity > 0) {
            newMap.set(key, quantity);
          } else {
            newMap.delete(key);
          }
          return newMap;
        });
      },
      // View control
      showHistoryTab: (tab: 'all' | 'restock' | 'audit' | 'sales') => setActiveTab(tab)
    }));

    const fetchProducts = useCallback(async () => {
      const startTime = Date.now();
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Fetching products for adjustments...`);
        
        const params = new URLSearchParams({
          per_page: '1000',  // Fetch all products (increased from 100)
          page: '1',
          _t: Date.now().toString() // Use full timestamp for better cache busting
        });

        // Add location ID
        if (user?.location_id) {
          params.append('location_id', user.location_id);
        }

        // For audit mode and restock mode, include zero stock products
        if (isAuditMode) {
          params.append('audit_mode', 'true');
        }
        if (isRestockMode) {
          params.append('restock_mode', 'true');
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        // Use optimized bulk endpoint
        const floraApiUrl = `/api/proxy/flora-im/products/bulk?${params}`;
        console.log(`🔄 Fetching from Flora IM Bulk API (Mode: ${isRestockMode ? 'RESTOCK' : isAuditMode ? 'AUDIT' : 'NORMAL'}): ${floraApiUrl}`);
        
        const response = await fetch(floraApiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
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
        console.log(`✅ Fetched ${productsWithInventory.length} products (Mode from API: ${result.meta?.mode || 'unknown'})`);
        
        // Count variable products in response
        const variableProductsCount = productsWithInventory.filter((p: any) => p.type === 'variable').length;
        console.log(`   🔍 Variable products in API response: ${variableProductsCount}`);

        // Don't filter products by location - show ALL products
        // The user's location will still be used for display purposes
        let filteredProducts = productsWithInventory;
        console.log(`✅ Showing all ${filteredProducts.length} products`);
        
        if (user?.location_id) {
          console.log(`📍 User location: ${user.location_id} - will display location-specific stock in UI`);
        }

        // Filter by category if needed
        if (categoryFilter) {
          filteredProducts = filteredProducts.filter((product: any) => 
            product.categories && product.categories.some((cat: any) => cat.slug === categoryFilter)
          );
        }

        // Process products
        console.log(`🔄 Processing ${filteredProducts.length} products into Product objects...`);
        const baseProducts: Product[] = filteredProducts.map((product: any, index: number) => {
          if (!product || !product.id) {
            console.error(`❌ Invalid product at index ${index}:`, product);
            return null;
          }
          
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
            blueprintPricing: null,
            has_variants: product.type === 'variable',
            variants: undefined
          };
        }).filter((p: Product | null): p is Product => p !== null);
        
        console.log(`✅ Processed ${baseProducts.length} valid products (${filteredProducts.length - baseProducts.length} skipped due to errors)`);

        // OPTIMIZATION: Skip eager variant loading - load on-demand when product is clicked
        // This saves 20+ API calls on initial load (4 variable products × 5 variants each)
        const normalizedProducts = baseProducts.map(product => {
          if (product.type === 'variable') {
            product.has_variants = true;
            product.variants = []; // Empty array signals variants need to be loaded
          }
          return product;
        });

        const loadTime = Date.now() - startTime;
        const finalVariableCount = normalizedProducts.filter(p => p.type === 'variable').length;
        console.log(`⚡ Processed ${normalizedProducts.length} products in ${loadTime}ms (${finalVariableCount} variable products, variants lazy-loaded)`);

        setProducts(normalizedProducts);

      } catch (err) {
        const loadTime = Date.now() - startTime;
        console.error(`❌ Failed to fetch products after ${loadTime}ms:`, err);
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMessage);
        
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, [searchQuery, categoryFilter, user?.location_id, isAuditMode, isRestockMode]);

    // Load products on mount and when filters change
    // Products are needed for all tabs (dashboard, audit, restock)
    useEffect(() => {
      fetchProducts();
    }, [fetchProducts]);

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
        console.log(`     🔍 Fetching variants from API for product ${productId}...`);
        const variantsUrl = `/api/proxy/woocommerce/products/${productId}/variations?per_page=100&_t=${Date.now()}`;
        const variantsResponse = await fetch(variantsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });

        if (!variantsResponse.ok) {
          console.error(`     ❌ Variants API error for product ${productId}: ${variantsResponse.status}`);
          return null;
        }

        const variants = await variantsResponse.json();
        console.log(`     📦 Variants API returned ${variants?.length || 0} variants for product ${productId}`);
        
        if (!variants || variants.length === 0) {
          console.warn(`     ⚠️ No variants found for product ${productId}`);
          return null;
        }

        // OPTIMIZATION: Batch fetch inventory for all variants at once
        console.log(`     📦 Batch fetching inventory for ${variants.length} variants...`);
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
          console.log(`     📊 Batch inventory response: ${batchResult.success ? 'success' : 'failed'}`);
          if (batchResult.success && batchResult.data) {
            inventoryMap = batchResult.data;
            console.log(`     ✅ Loaded inventory for ${Object.keys(inventoryMap).length} variant keys`);
          }
        } else {
          console.warn(`     ⚠️ Batch inventory fetch failed: ${batchInventoryResponse.status}`);
        }

        // Process variants with batch inventory data
        const processedVariants = variants
          .filter((variant: any) => {
            // CRITICAL: Filter out variants with invalid IDs
            if (!variant.id || isNaN(variant.id) || variant.id <= 0) {
              console.error(`     ❌ Skipping variant with invalid ID:`, variant);
              return false;
            }
            return true;
          })
          .map((variant: any) => {
            const inventoryKey = `${productId}_${variant.id}`;
            const inventoryData = inventoryMap[inventoryKey];
            
            let inventory: Array<{location_id: number; quantity: number}> = [];
            
            if (inventoryData && inventoryData.success && inventoryData.inventory) {
              inventory = inventoryData.inventory.map((record: any) => ({
                location_id: parseInt(record.location_id),
                quantity: parseFloat(record.quantity) || parseFloat(record.available_quantity) || 0
              }));
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
          });
        
        if (processedVariants.length === 0) {
          console.warn(`     ⚠️ No valid variants after filtering for product ${productId}`);
          return null;
        }
        
        console.log(`     ✅ Returning ${processedVariants.length} valid variants for product ${productId}`);
        return processedVariants;
      } catch (error) {
        console.error(`     ❌ Error loading variants for product ${productId}:`, error);
        return null;
      }
    };

    // Memoized handlers
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

    // Handle restock quantity adjustment (for purchase orders)
    const handleRestockAdjustment = (productId: number, variantId: number | null, quantity: number, reason: string = 'Restock quantity') => {
      try {
        const key = variantId ? `${productId}-${variantId}` : `${productId}`;
        
        console.log(`🛒 [Restock] Product ${productId}${variantId ? `-${variantId}` : ''}: Adjusting restock quantity by ${quantity}`);
        
        // Update pending restock products - add to existing quantity
        setPendingRestockProducts(prev => {
          const newRestockProducts = new Map(prev);
          const currentQuantity = newRestockProducts.get(key) || 0;
          const newQuantity = currentQuantity + quantity;
          
          if (newQuantity > 0) {
            newRestockProducts.set(key, newQuantity);
            console.log(`✅ [Restock] Updated product ${key} to quantity ${newQuantity} (was ${currentQuantity})`);
          } else {
            newRestockProducts.delete(key);
            console.log(`❌ [Restock] Removed product ${key} (quantity would be ${newQuantity})`);
          }
          
          console.log(`📊 [Restock] Total pending products: ${newRestockProducts.size}`);
          return newRestockProducts;
        });
        
      } catch (error) {
        console.error(`❌ [Restock] Error adjusting restock quantity:`, error);
        setAdjustmentStatus({
          type: 'error',
          message: `Failed to adjust restock quantity: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };

    // Wrapper function for inline restock completion
    const applyRestockAdjustments = async () => {
      console.log('🚀 [Restock] applyRestockAdjustments called');
      console.log('📊 [Restock] Pending products:', pendingRestockProducts.size);
      console.log('📝 [Restock] Supplier name:', supplierName);
      
      if (!supplierName || !supplierName.trim()) {
        console.error('❌ [Restock] Supplier name is empty!');
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please provide a supplier name for the purchase order' 
        });
        return;
      }
      
      if (pendingRestockProducts.size === 0) {
        console.error('❌ [Restock] No pending restock products!');
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please add products to restock before completing' 
        });
        return;
      }
      
      try {
        await createPurchaseOrderFromRestock(supplierName, poNotes);
      } catch (error) {
        console.error('❌ [Restock] Error in applyRestockAdjustments:', error);
        setAdjustmentStatus({
          type: 'error',
          message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };

    // Create purchase order from restock products
    const createPurchaseOrderFromRestock = async (supplierName: string, notes?: string) => {
      if (pendingRestockProducts.size === 0) {
        console.log('No restock products to create PO from');
        return;
      }

      if (!supplierName.trim()) {
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please provide a supplier name for the purchase order' 
        });
        return;
      }

      setIsCreatingPO(true);
      setAdjustmentStatus({ type: null, message: '' });

      try {
        console.log(`🔍 [Restock] Creating PO "${supplierName}" with ${pendingRestockProducts.size} products...`);
        console.log(`🔍 [Restock] Current products state has ${products.length} products`);
        console.log(`🔍 [Restock] Product IDs in state:`, products.map(p => p.id));
        console.log(`🔍 [Restock] Pending restock products:`, Array.from(pendingRestockProducts.entries()));
        
        // Convert pending restock products to RestockProduct format
        // If product not in state, fetch it from API
        const restockProducts: RestockProduct[] = [];
        
        for (const [key, quantity] of Array.from(pendingRestockProducts.entries())) {
          const [productId, variantId] = key.split('-').map(Number);
          let product = products.find(p => Number(p.id) === productId);
          
          if (!product) {
            console.warn(`⚠️ [Restock] Product ${productId} not in state, fetching from API...`);
            
            // Fetch the product from API
            try {
              const response = await fetch(`/api/proxy/woocommerce/products/${productId}`);
              if (response.ok) {
                const fetchedProduct = await response.json();
                product = {
                  id: fetchedProduct.id,
                  name: fetchedProduct.name,
                  sku: fetchedProduct.sku || '',
                  type: fetchedProduct.type || 'simple',
                  status: fetchedProduct.status || 'publish',
                  regular_price: fetchedProduct.regular_price || '0',
                  sale_price: fetchedProduct.sale_price,
                  image: fetchedProduct.images?.[0],
                  categories: fetchedProduct.categories || [],
                  inventory: [],
                  total_stock: 0,
                  meta_data: fetchedProduct.meta_data || [],
                  blueprintPricing: null,
                  has_variants: fetchedProduct.type === 'variable',
                  variants: undefined
                };
                console.log(`✅ [Restock] Fetched product ${productId} from API: ${product.name}`);
              } else {
                console.error(`❌ [Restock] Failed to fetch product ${productId} from API: ${response.status}`);
                throw new Error(`Product ${productId} not found and could not be fetched from API`);
              }
            } catch (fetchError) {
              console.error(`❌ [Restock] Error fetching product ${productId}:`, fetchError);
              throw new Error(`Product ${productId} not found: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
            }
          } else {
            console.log(`✅ [Restock] Found product ${productId} in state: ${product.name}`);
          }

          restockProducts.push({
            product_id: productId,
            variation_id: variantId || undefined,
            name: product.name,
            sku: product.sku,
            restock_quantity: quantity,
            suggested_cost: 0,
            current_stock: product.total_stock
          });
        }
        
        console.log(`✅ [Restock] ${restockProducts.length} products ready for PO`);

        // Get or create supplier first
        console.log('🔍 [Restock] Fetching suppliers...');
        const suppliersResponse = await PurchaseOrdersService.getSuppliers();
        
        let supplierId = 1; // Fallback
        if (suppliersResponse.success && suppliersResponse.data && suppliersResponse.data.length > 0) {
          // Check if supplier with matching name exists
          const existingSupplier = suppliersResponse.data.find(s => 
            s.name.toLowerCase().trim() === supplierName.toLowerCase().trim()
          );
          
          if (existingSupplier) {
            supplierId = existingSupplier.id;
            console.log(`✅ [Restock] Found existing supplier: ${existingSupplier.name} (ID: ${supplierId})`);
          } else {
            // Use first active supplier
            supplierId = suppliersResponse.data[0].id;
            console.log(`⚠️ [Restock] Supplier "${supplierName}" not found, using: ${suppliersResponse.data[0].name} (ID: ${supplierId})`);
          }
        } else {
          console.warn('⚠️ [Restock] No suppliers found, attempting with default ID 1');
        }
        
        // Create purchase order using standard endpoint
        const poItems = PurchaseOrdersService.transformRestockProductsToPOItems(restockProducts);
        const totals = PurchaseOrdersService.calculatePOTotals(poItems);
        
        console.log(`📝 [Restock] Creating PO with supplier_id: ${supplierId}, location_id: ${user?.location_id ? parseInt(user.location_id) : 20}`);
        
        const result = await PurchaseOrdersService.createPurchaseOrder({
          supplier_id: supplierId,
          location_id: user?.location_id ? parseInt(user.location_id) : 20,
          status: 'draft',
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          shipping_cost: totals.shipping_cost,
          total_amount: totals.total_amount,
          notes: notes || `Purchase order "${supplierName}" created from restock on ${new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`,
          supplier_name: supplierName,
          items: poItems
        });

        console.log('📦 [Restock] PO Creation result:', result);
        
        if (!result.success) {
          const errorMessage = result.error || 'Unknown error occurred';
          console.error('❌ [Restock] PO creation failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        if (result.success && result.data) {
          // For POS systems, we'll also update the stock immediately after creating the PO
          // This simulates receiving the purchase order instantly
          console.log('📦 Updating stock levels for restocked products...');
          
          try {
            const stockUpdates = restockProducts.map(product => ({
              product_id: product.product_id,
              variation_id: product.variation_id || null,
              adjustment_quantity: product.restock_quantity,
              reason: `Restock via PO ${result.data?.po_number || 'Unknown'}`,
              location_id: user?.location_id ? parseInt(user.location_id) : 20
            }));

            // Apply stock updates via the inventory adjustment API
            const updateResponse = await fetch('/api/inventory/adjust', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adjustments: stockUpdates })
            });

            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log('✅ Stock levels updated successfully:', updateResult);
              
              // Store restock operation metadata for history tracking
              if (typeof window !== 'undefined' && window.localStorage) {
                try {
                  const restockMetadata = {
                    po_number: result.data?.po_number || 'Unknown',
                    timestamp: new Date().toISOString(),
                    user_id: user?.id || 0,
                    user_name: user?.username || 'Unknown',
                    location_id: user?.location_id ? parseInt(user.location_id) : 20,
                    products: restockProducts.map(p => ({
                      product_id: p.product_id,
                      variation_id: p.variation_id || null,
                      quantity: p.restock_quantity,
                      name: p.name
                    }))
                  };
                  
                  const existingRestocks = JSON.parse(localStorage.getItem('restock_operations') || '[]');
                  existingRestocks.push(restockMetadata);
                  localStorage.setItem('restock_operations', JSON.stringify(existingRestocks));
                  console.log('💾 Stored restock metadata:', restockMetadata);
                } catch (e) {
                  console.warn('Failed to store restock metadata:', e);
                }
              }
              
              setAdjustmentStatus({
                type: 'success',
                message: `Success, purchase order ${result.data?.po_number || ''} created`
              });

              // Trigger inventory refresh to show updated stock levels
              window.dispatchEvent(new CustomEvent('inventoryUpdated'));
            } else {
              console.warn('PO created but stock update failed');
              setAdjustmentStatus({
                type: 'error',
                message: `Error: Purchase order created but stock update failed`
              });
            }
          } catch (stockError) {
            console.error('Error updating stock after PO creation:', stockError);
            setAdjustmentStatus({
              type: 'error',
              message: `Error: Purchase order created but stock update failed`
            });
          }
          
          // Clear pending restock products
          setPendingRestockProducts(new Map());
          
          console.log(`✅ Created purchase order: ${result.data?.po_number || 'Unknown'}`);
        }

      } catch (error) {
        console.error('❌ Failed to create purchase order:', error);
        setAdjustmentStatus({
          type: 'error',
          message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsCreatingPO(false);
      }
    };

    // Handle inventory adjustment directly - now handles both incremental and absolute adjustments
    const handleInventoryAdjustment = (productId: number, variantId: number | null, adjustment: number, reason: string = 'Manual adjustment') => {
      try {
        const key = variantId ? `${productId}-${variantId}` : `${productId}`;
        
        // Update pending adjustments
        setPendingAdjustments(prev => {
          const newAdjustments = new Map(prev);
          const currentAdjustment = newAdjustments.get(key) || 0;
          const newAdjustment = currentAdjustment + adjustment;
          
          if (newAdjustment === 0) {
            newAdjustments.delete(key);
          } else {
            newAdjustments.set(key, newAdjustment);
          }
          
          return newAdjustments;
        });
        
        console.log(`Adjustment queued: Product ${productId}${variantId ? ` Variant ${variantId}` : ''} - ${adjustment > 0 ? '+' : ''}${adjustment}`);
        
      } catch (error) {
        console.error('Failed to queue adjustment:', error);
      }
    };
    
    // Set adjustment to a specific value (for direct input)
    const setAdjustmentValue = (productId: number, variantId: number | null, value: number) => {
      const key = variantId ? `${productId}-${variantId}` : `${productId}`;
      
      if (isRestockMode) {
        // In restock mode, update pending restock products
        setPendingRestockProducts(prev => {
          const newRestockProducts = new Map(prev);
          if (value === 0) {
            newRestockProducts.delete(key);
          } else {
            newRestockProducts.set(key, value);
          }
          return newRestockProducts;
        });
      } else {
        // In audit mode, update pending adjustments
        setPendingAdjustments(prev => {
          const newAdjustments = new Map(prev);
          if (value === 0) {
            newAdjustments.delete(key);
          } else {
            newAdjustments.set(key, value);
          }
          return newAdjustments;
        });
      }
    };

    // Handle direct stock value changes
    const handleStockValueChange = (productId: number, variantId: number | null, newStock: number | string) => {
      const key = variantId ? `${productId}-${variantId}` : `${productId}`;
      setEditedStockValues(prev => ({
        ...prev,
        [key]: newStock
      }));
    };

    // Apply stock value change
    const handleStockValueApply = async (productId: number, variantId: number | null, newStock: number, currentStock: number) => {
      try {
        const adjustment = newStock - currentStock;
        
        if (adjustment === 0) {
          return;
        }

        const key = variantId ? `${productId}-${variantId}` : `${productId}`;
        
        // Set the adjustment directly to the difference
        setPendingAdjustments(prev => {
          const newAdjustments = new Map(prev);
          newAdjustments.set(key, adjustment);
          return newAdjustments;
        });
        
        console.log(`Stock adjustment set: Product ${productId}${variantId ? ` Variant ${variantId}` : ''} - Set to ${newStock} (${adjustment > 0 ? '+' : ''}${adjustment})`);
        
      } catch (error) {
        console.error('Failed to apply stock adjustment:', error);
      }
    };

    // Apply audit adjustments with batch audit trail
    const applyAuditAdjustments = async (customName?: string, customDescription?: string) => {
      console.log('🚀 [Audit] applyAuditAdjustments called');
      console.log('📊 [Audit] Pending adjustments:', pendingAdjustments.size);
      console.log('📝 [Audit] Audit name state:', auditName);
      console.log('📝 [Audit] Custom name param:', customName);
      
      if (pendingAdjustments.size === 0) {
        console.error('❌ [Audit] No adjustments to apply');
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please add adjustments before completing audit' 
        });
        return;
      }

      const finalAuditName = customName || auditName;
      const finalAuditDescription = customDescription || auditDescription;
      
      console.log('📝 [Audit] Final audit name:', finalAuditName);

      if (!finalAuditName || !finalAuditName.trim()) {
        console.error('❌ [Audit] Audit name is empty!');
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please provide an audit name for the audit trail' 
        });
        return;
      }

      setIsApplying(true);
      setAdjustmentStatus({ type: null, message: '' });

      try {
        console.log(`🔄 [Audit] Applying audit "${finalAuditName}" with ${pendingAdjustments.size} adjustments...`);
        
        // Convert pending adjustments to API format
        const adjustments = Array.from(pendingAdjustments.entries()).map(([key, adjustment]) => {
          const [productId, variantId] = key.split('-').map(Number);
          return {
            product_id: productId,
            variation_id: variantId || null,
            adjustment_quantity: adjustment,
            reason: `Audit: ${finalAuditName}`,
            location_id: user?.location_id ? parseInt(user.location_id) : 20
          };
        });

        const response = await fetch('/api/inventory/batch-adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch_name: finalAuditName,
            batch_description: finalAuditDescription || `Audit created on ${new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`,
            location_id: user?.location_id ? parseInt(user.location_id) : 20,
            user_id: user?.id ? parseInt(user.id) : 1,
            user_name: user?.username || 'System',
            adjustments
          }),
        });

        if (!response.ok) {
          let errorText = await response.text();
          console.error('❌ [Audit] API error response:', errorText);
          
          // Try to parse error as JSON for better error messages
          try {
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorJson.message || errorText;
          } catch (e) {
            // If not JSON, use the text as-is
          }
          
          throw new Error(`API request failed (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log('📦 [Audit] API response:', result);
        
        if (!result.success) {
          const errorMessage = result.error || result.message || 'Unknown error occurred';
          console.error('❌ [Audit] Batch adjustment failed:', errorMessage);
          throw new Error(errorMessage);
        }

        if (result.success) {
          console.log('✅ [Audit] Batch adjustment completed:', result);
          
          // Update UI optimistically
          setProducts(prevProducts => {
            return prevProducts.map(product => {
              const productKey = `${product.id}`;
              const adjustment = pendingAdjustments.get(productKey);
              
              if (adjustment !== undefined) {
                const newInventory = product.inventory.map(inv => {
                  if (parseInt(inv.location_id) === (user?.location_id ? parseInt(user.location_id) : 20)) {
                    return {
                      ...inv,
                      stock: Math.max(0, inv.stock + adjustment)
                    };
                  }
                  return inv;
                });

                const newTotalStock = newInventory.reduce((sum, inv) => sum + inv.stock, 0);

                return {
                  ...product,
                  inventory: newInventory,
                  total_stock: newTotalStock
                };
              }

              // Check variants
              if (product.variants) {
                const updatedVariants = product.variants.map(variant => {
                  const variantKey = `${product.id}-${variant.id}`;
                  const variantAdjustment = pendingAdjustments.get(variantKey);
                  
                  if (variantAdjustment !== undefined) {
                    const newInventory = variant.inventory.map(inv => {
                      if (inv.location_id === (user?.location_id ? parseInt(user.location_id) : 20)) {
                        return {
                          ...inv,
                          quantity: Math.max(0, inv.quantity + variantAdjustment)
                        };
                      }
                      return inv;
                    });

                    const newTotalStock = newInventory.reduce((sum, inv) => sum + inv.quantity, 0);

                    return {
                      ...variant,
                      inventory: newInventory,
                      total_stock: newTotalStock
                    };
                  }
                  return variant;
                });

                return {
                  ...product,
                  variants: updatedVariants
                };
              }

              return product;
            });
          });

          setAdjustmentStatus({
            type: 'success',
            message: `Success, audit ${result.audit_number} created`
          });
        } else {
          console.error('❌ Audit adjustment failed:', result);
          setAdjustmentStatus({
            type: 'error',
            message: `Error: Failed to create audit`
          });
        }
        
        // Clear pending adjustments and audit info
        setPendingAdjustments(new Map());
        setEditedStockValues({});
        setAuditName('');
        setAuditDescription('');
        
        // Force refresh inventory data
        console.log('🔄 [Audit] Force refreshing inventory data after audit...');
        await refreshInventory();
        console.log('✅ [Audit] Inventory refresh complete');
        
      } catch (error) {
        console.error('❌ [Audit] Error applying audit adjustments:', error);
        console.error('❌ [Audit] Error details:', error instanceof Error ? error.message : String(error));
        console.error('❌ [Audit] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        setAdjustmentStatus({
          type: 'error',
          message: `Failed to create audit: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsApplying(false);
        console.log('🏁 [Audit] applyAuditAdjustments finished, isApplying=false');
      }
    };

    // Apply all pending adjustments (legacy method)
    const applyAllAdjustments = async () => {
      
      if (pendingAdjustments.size === 0) {
        console.log('No adjustments to apply');
        return;
      }

      setIsApplying(true);
      setAdjustmentStatus({ type: null, message: '' });

      try {
        console.log(`Applying ${pendingAdjustments.size} adjustments...`);
        
        // Convert pending adjustments to API format
        const adjustments = Array.from(pendingAdjustments.entries()).map(([key, adjustment]) => {
          const [productId, variantId] = key.split('-').map(Number);
          return {
            product_id: productId,
            variation_id: variantId || null,
            adjustment_quantity: adjustment,
            reason: 'Manual inventory adjustment',
            location_id: user?.location_id ? parseInt(user.location_id) : null
          };
        });

        // Call the inventory adjustment API
        const response = await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adjustments }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error response:', errorText);
          throw new Error('Failed to apply adjustments');
        }

        const result = await response.json();
        console.log('Adjustments applied successfully:', result);
        
        // Log success details to console and update UI immediately
        if (result.results) {
          const successful = result.results.filter((r: any) => r.success);
          const failed = result.results.filter((r: any) => !r.success);
          
          if (successful.length > 0) {
            console.log(`✅ Successfully adjusted ${successful.length} products:`);
            successful.forEach((r: any) => {
              console.log(`  - Product ${r.product_id}: ${r.old_stock} → ${r.new_stock}`);
            });
            
            // Immediately update the products state with new stock values
            setProducts(prevProducts => 
              prevProducts.map(product => {
                // Update main product inventory
                const productUpdate = successful.find((s: any) => s.product_id === product.id && !s.variation_id);
                if (productUpdate) {
                  const updatedInventory = product.inventory.map(inv => {
                    if (parseInt(inv.location_id.toString()) === (user?.location_id ? parseInt(user.location_id) : 20)) {
                      return { ...inv, stock: productUpdate.new_stock };
                    }
                    return inv;
                  });
                  return { ...product, inventory: updatedInventory, total_stock: productUpdate.new_stock };
                }
                
                // Update variant inventory
                if (product.variants) {
                  const updatedVariants = product.variants.map(variant => {
                    const variantUpdate = successful.find((s: any) => s.product_id === product.id && s.variation_id === variant.id);
                    if (variantUpdate) {
                      const updatedInventory = variant.inventory.map(inv => {
                        if (parseInt(inv.location_id.toString()) === (user?.location_id ? parseInt(user.location_id) : 20)) {
                          return { ...inv, quantity: variantUpdate.new_stock };
                        }
                        return inv;
                      });
                      return { ...variant, inventory: updatedInventory, total_stock: variantUpdate.new_stock };
                    }
                    return variant;
                  });
                  return { ...product, variants: updatedVariants };
                }
                
                return product;
              })
            );
          }
          
          if (failed.length > 0) {
            console.error(`❌ Failed to adjust ${failed.length} products:`);
            failed.forEach((r: any) => {
              console.error(`  - Product ${r.product_id}: ${r.error || r.message}`);
            });
            
            setAdjustmentStatus({
              type: 'error',
              message: `${failed.length} adjustment${failed.length > 1 ? 's' : ''} failed. Check console for details.`
            });
          } else {
            setAdjustmentStatus({
              type: 'success',
              message: `Success, ${successful.length} adjustment${successful.length > 1 ? 's' : ''} applied`
            });
          }
        }
        
        // Clear pending adjustments - UI already updated above
        setPendingAdjustments(new Map());
        setEditedStockValues({});
        
        // Force refresh inventory data from API to ensure consistency
        console.log('🔄 Force refreshing inventory data after adjustments...');
        setTimeout(async () => {
          try {
            await fetchProducts();
            console.log('✅ Inventory data refreshed successfully');
          } catch (error) {
            console.error('❌ Failed to refresh inventory after adjustments:', error);
          }
        }, 1000); // Wait 1 second to allow API to propagate changes
        
        // Clear status message after 5 seconds
        setTimeout(() => {
          setAdjustmentStatus({ type: null, message: '' });
        }, 5000);
        
      } catch (error) {
        console.error('Failed to apply adjustments:', error);
        setAdjustmentStatus({
          type: 'error',
          message: 'Failed to apply adjustments. Please try again.'
        });
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setAdjustmentStatus({ type: null, message: '' });
        }, 5000);
      } finally {
        setIsApplying(false);
      }
    };

    if (loading && products.length === 0) {
      return null;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="text-center">
            <div className="text-body font-tiempo font-medium text-white mb-4">
              <svg className="w-12 h-12 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-caption-1 font-tiempo text-neutral-400 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchProducts();
              }}
              className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-black rounded-ios text-body-sm font-tiempo font-semibold transition-all active:scale-95"
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
            <p className="text-neutral-400 text-xs" style={{ fontFamily: 'Tiempos, serif' }}>No products found for adjustments</p>
            <p className="text-xs text-neutral-500 mt-2" style={{ fontFamily: 'Tiempos, serif' }}>
              {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
            </p>
          </div>
        </div>
      );
    }

    // Show product dashboard when in normal mode (neither audit nor restock)
    if (!isAuditMode && !isRestockMode && activeTab === 'products') {
      return (
        <ProductDashboard 
          onSelectMode={(mode) => {
            if (mode === 'restock') {
              onRestock?.();
            } else if (mode === 'audit') {
              onAudit?.();
            }
          }}
          onDashboardAction={onDashboardAction}
        />
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Tab Selector Row - Only show when NOT on products tab */}
        {activeTab !== 'products' && (
          <div className="flex-shrink-0 px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              {/* Back to Products Button */}
              <button
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-2 px-4 py-2 text-caption-1 font-tiempo font-medium bg-surface-elevated hover:bg-surface-elevated-hover text-white border border-border-subtle rounded-ios transition-all duration-200 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Products
              </button>
              
              {/* History View Dropdown */}
              <div className="flex items-center gap-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06]">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                  className="px-4 py-2 text-sm bg-transparent text-neutral-300 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[160px]"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  <option value="all" className="bg-neutral-800">All History</option>
                  <option value="restock" className="bg-neutral-800">Restocks</option>
                  <option value="audit" className="bg-neutral-800">Audits</option>
                  <option value="sales" className="bg-neutral-800">Sales</option>
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06]">
                <select
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="px-4 py-2 text-sm bg-transparent text-neutral-300 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[140px]"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  <option value="7" className="bg-neutral-800">Last 7 days</option>
                  <option value="30" className="bg-neutral-800">Last 30 days</option>
                  <option value="60" className="bg-neutral-800">Last 60 days</option>
                  <option value="90" className="bg-neutral-800">Last 90 days</option>
                  <option value="180" className="bg-neutral-800">Last 6 months</option>
                  <option value="365" className="bg-neutral-800">Last year</option>
                  <option value="all" className="bg-neutral-800">All time</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'products' && (
            <ProductAuditTable
              filteredProducts={filteredProducts}
              selectedProducts={selectedProducts}
              editedStockValues={editedStockValues}
              userLocationId={user?.location_id ? parseInt(user.location_id) : undefined}
              onProductSelection={handleProductSelection}
              onInventoryAdjustment={isRestockMode ? handleRestockAdjustment : handleInventoryAdjustment}
              onStockValueChange={handleStockValueChange}
              onStockFieldFocus={handleStockFieldFocus}
              onStockFieldBlur={handleStockFieldBlur}
              onStockValueApply={handleStockValueApply}
              setSelectedProducts={setSelectedProducts}
              pendingAdjustments={isRestockMode ? pendingRestockProducts : pendingAdjustments}
              onSetAdjustmentValue={setAdjustmentValue}
              isRestockMode={isRestockMode}
              isAuditMode={isAuditMode}
              showOnlySelected={showOnlySelected}
              onShowOnlySelectedChange={onShowOnlySelectedChange}
              sortAlphabetically={sortAlphabetically}
              onSortAlphabeticallyChange={onSortAlphabeticallyChange}
              sessionName={isRestockMode ? supplierName : auditName}
              sessionDescription={isRestockMode ? poNotes : auditDescription}
              onSessionNameChange={isRestockMode ? setSupplierName : setAuditName}
              onSessionDescriptionChange={isRestockMode ? setPONotes : setAuditDescription}
              onCompleteSession={isRestockMode ? applyRestockAdjustments : applyAuditAdjustments}
              isApplying={isRestockMode ? isCreatingPO : isApplying}
            />
          )}
          
          {activeTab === 'all' && (
            <AllHistoryTable dateFilter={historyDateFilter} isActive={activeTab === 'all'} />
          )}
          
          {activeTab === 'restock' && (
            <RestockHistoryTable dateFilter={historyDateFilter} isActive={activeTab === 'restock'} />
          )}
          
          {activeTab === 'audit' && (
            <AuditHistoryTable dateFilter={historyDateFilter} isActive={activeTab === 'audit'} />
          )}
          
          {activeTab === 'sales' && (
            <SalesHistoryTable dateFilter={historyDateFilter} isActive={activeTab === 'sales'} />
          )}
        </div>
        
        {/* Status Messages - Animated Notification */}
        {adjustmentStatus.type && (
          <div 
            className={`fixed bottom-4 left-4 z-50 transition-all duration-500 ease-out ${
              adjustmentStatus.type ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{
              animation: 'slideInUp 0.3s ease-out, fadeOut 0.5s ease-out 3s forwards'
            }}
          >
            <div className="bg-neutral-900/90 backdrop-blur-md border border-white/[0.08] rounded-lg px-4 py-2 shadow-lg">
              <div className={`text-xs flex items-center gap-2 ${
                adjustmentStatus.type === 'success' ? 'text-neutral-400' : 'text-neutral-500'
              }`} style={{ fontFamily: 'Tiempos, serif' }}>
                {adjustmentStatus.type === 'success' ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {adjustmentStatus.message}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdjustmentsGrid.displayName = 'AdjustmentsGrid';
