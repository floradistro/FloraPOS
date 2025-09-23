'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductAuditTable } from './ProductAuditTable';
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
}

export const AdjustmentsGrid = forwardRef<AdjustmentsGridRef, AdjustmentsGridProps>(
  ({ searchQuery, categoryFilter, onLoadingChange, isAuditMode = false, isRestockMode = false }, ref) => {
    const { user } = useAuth();
    
    // Debug mode states
    console.log(`🔧 AdjustmentsGrid - isAuditMode: ${isAuditMode}, isRestockMode: ${isRestockMode}`);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Stock editing state
    const [editedStockValues, setEditedStockValues] = useState<Record<string, number | string>>({});
    const [focusedStockFields, setFocusedStockFields] = useState<Set<string>>(new Set());
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    const [pendingAdjustments, setPendingAdjustments] = useState<Map<string, number>>(new Map());
    const [isApplying, setIsApplying] = useState(false);
    const [adjustmentStatus, setAdjustmentStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    
    // Audit batch states (only shown in audit mode)
    const [showAuditDialog, setShowAuditDialog] = useState(false);
    const [auditName, setAuditName] = useState('');
    const [auditDescription, setAuditDescription] = useState('');
    
    // Purchase order states (only shown in restock mode)
    const [pendingRestockProducts, setPendingRestockProducts] = useState<Map<string, number>>(new Map());
    const [showPODialog, setShowPODialog] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [poNotes, setPONotes] = useState('');
    const [isCreatingPO, setIsCreatingPO] = useState(false);
    
    // Filtering and sorting states
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    const [sortAlphabetically, setSortAlphabetically] = useState(true);

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading, products.length > 0);
    }, [loading, products.length, onLoadingChange]);

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
          matchesStockCriteria = product.total_stock > 0;
          console.log(`🔍 Audit Mode - Product: ${product.name}, Stock: ${product.total_stock}, Show: ${matchesStockCriteria}`);
        } else if (isRestockMode) {
          // Restock mode: show entire catalog (no stock filtering)
          matchesStockCriteria = true;
          console.log(`📦 Restock Mode - Product: ${product.name}, Show: ${matchesStockCriteria}`);
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


    // Handle product selection
    const handleProductSelection = (product: Product, event?: React.MouseEvent) => {
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
      createAudit: () => setShowAuditDialog(true),
      createAuditWithDetails: async (name: string, description?: string) => {
        await applyAuditAdjustments(name, description);
      },
      getPendingAdjustments: () => pendingAdjustments,
      getIsApplying: () => isApplying,
      getProducts: () => products,
      removeAdjustment,
      updateAdjustment,
      // Purchase order methods
      createPurchaseOrder: () => setShowPODialog(true),
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
      }
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

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const floraApiUrl = `/api/proxy/flora-im/products?${params}`;
        console.log('🔄 Fetching from Flora IM API...');
        
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
        console.log(`✅ Fetched ${productsWithInventory.length} products`);

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
            blueprintPricing: null,
            has_variants: product.type === 'variable',
            variants: undefined
          };
        });

        // Load variants for variable products
        const normalizedProducts = await Promise.all(
          baseProducts.map(async (product) => {
            if (product.type === 'variable') {
              try {
                const variants = await loadVariantsForProduct(product.id);
                if (variants && variants.length > 0) {
                  product.has_variants = true;
                  product.variants = variants;
                }
              } catch (error) {
                console.error(`Failed to load variants for product ${product.id}:`, error);
              }
            }
            return product;
          })
        );

        const loadTime = Date.now() - startTime;
        console.log(`✅ Processed ${normalizedProducts.length} products in ${loadTime}ms`);

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
    }, [searchQuery, categoryFilter, user?.location_id]);

    // Load products on mount and when filters change
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
        const variantsUrl = `/api/proxy/woocommerce/products/${productId}/variations?per_page=1000&_t=${Date.now()}`;
        const variantsResponse = await fetch(variantsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });

        if (!variantsResponse.ok) {
          return null;
        }

        const variants = await variantsResponse.json();
        if (!variants || variants.length === 0) {
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
        
        return processedVariants;
      } catch (error) {
        console.error(`Error loading variants for product ${productId}:`, error);
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
      setShowPODialog(false);

      try {
        console.log(`Creating PO "${supplierName}" with ${pendingRestockProducts.size} products...`);
        
        // Convert pending restock products to RestockProduct format
        const restockProducts: RestockProduct[] = Array.from(pendingRestockProducts.entries()).map(([key, quantity]) => {
          const [productId, variantId] = key.split('-').map(Number);
          const product = products.find(p => p.id === productId);
          
          if (!product) {
            throw new Error(`Product not found: ${productId}`);
          }

          return {
            product_id: productId,
            variation_id: variantId || undefined,
            name: product.name,
            sku: product.sku,
            restock_quantity: quantity,
            suggested_cost: 0, // TODO: Could add cost estimation
            current_stock: product.total_stock
          };
        });

        // Create purchase order using standard endpoint
        const poItems = PurchaseOrdersService.transformRestockProductsToPOItems(restockProducts);
        const totals = PurchaseOrdersService.calculatePOTotals(poItems);
        
        const result = await PurchaseOrdersService.createPurchaseOrder({
          supplier_id: 1, // Default supplier - TODO: Add supplier selection
          location_id: user?.location_id ? parseInt(user.location_id) : 20,
          status: 'draft',
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          shipping_cost: totals.shipping_cost,
          total_amount: totals.total_amount,
          notes: notes || `Purchase order "${supplierName}" created from restock on ${new Date().toLocaleDateString()}`,
          supplier_name: supplierName,
          items: poItems
        });

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
                message: `Purchase order ${result.data?.po_number || 'Unknown'} created and stock updated for ${restockProducts.length} items`
              });

              // Trigger inventory refresh to show updated stock levels
              window.dispatchEvent(new CustomEvent('inventoryUpdated'));
            } else {
              console.warn('PO created but stock update failed');
              setAdjustmentStatus({
                type: 'error',
                message: `Purchase order ${result.data?.po_number || 'Unknown'} created but stock update failed. Please manually adjust inventory.`
              });
            }
          } catch (stockError) {
            console.error('Error updating stock after PO creation:', stockError);
            setAdjustmentStatus({
              type: 'error',
              message: `Purchase order ${result.data?.po_number || 'Unknown'} created but stock update failed. Please manually adjust inventory.`
            });
          }
          
          // Clear pending restock products
          setPendingRestockProducts(new Map());
          
          console.log(`✅ Created purchase order: ${result.data?.po_number || 'Unknown'}`);
        } else {
          throw new Error(result.error || 'Failed to create purchase order');
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
      if (pendingAdjustments.size === 0) {
        console.log('No adjustments to apply');
        return;
      }

      const finalAuditName = customName || auditName;
      const finalAuditDescription = customDescription || auditDescription;

      if (!finalAuditName.trim()) {
        setAdjustmentStatus({ 
          type: 'error', 
          message: 'Please provide an audit name for the audit trail' 
        });
        return;
      }

      setIsApplying(true);
      setAdjustmentStatus({ type: null, message: '' });
      setShowAuditDialog(false);

      try {
        console.log(`Applying audit "${finalAuditName}" with ${pendingAdjustments.size} adjustments...`);
        
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
            batch_description: finalAuditDescription || `Audit created on ${new Date().toLocaleDateString()}`,
            location_id: user?.location_id ? parseInt(user.location_id) : 20,
            user_id: user?.id ? parseInt(user.id) : 1,
            user_name: user?.username || 'System',
            adjustments
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Batch adjustment completed:', result);
          
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
            message: `✅ Audit "${finalAuditName}" completed successfully! Audit #${result.audit_number} - ${result.summary.successful} items processed`
          });
        } else {
          console.error('❌ Audit adjustment failed:', result);
          setAdjustmentStatus({
            type: 'error',
            message: `Failed to apply audit adjustments: ${result.error}`
          });
        }
        
        // Clear pending adjustments and audit info
        setPendingAdjustments(new Map());
        setEditedStockValues({});
        setAuditName('');
        setAuditDescription('');
        
        // Force refresh inventory data
        console.log('🔄 Force refreshing inventory data after audit...');
        await refreshInventory();
        
      } catch (error) {
        console.error('❌ Error applying audit adjustments:', error);
        setAdjustmentStatus({
          type: 'error',
          message: `Error applying audit adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsApplying(false);
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
              message: `Successfully applied ${successful.length} adjustment${successful.length > 1 ? 's' : ''}`
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

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
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
            onShowOnlySelectedChange={setShowOnlySelected}
            sortAlphabetically={sortAlphabetically}
            onSortAlphabeticallyChange={setSortAlphabetically}
          />
        </div>
        
        {/* Status Messages Only */}
        {adjustmentStatus.type && (
          <div className="border-t border-white/[0.08] bg-neutral-900/95 backdrop-blur-sm p-4">
            <div className={`text-sm font-medium flex items-center gap-2 ${
              adjustmentStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {adjustmentStatus.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {adjustmentStatus.message}
            </div>
          </div>
        )}
        
        {/* Audit Dialog */}
        {showAuditDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-base font-normal text-neutral-200 mb-4" style={{ fontFamily: 'Tiempos, serif' }}>Create Audit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Audit Name *
                  </label>
                  <input
                    type="text"
                    value={auditName}
                    onChange={(e) => setAuditName(e.target.value)}
                    placeholder="e.g., Monthly Inventory Count"
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={auditDescription}
                    onChange={(e) => setAuditDescription(e.target.value)}
                    placeholder="Additional notes about this audit..."
                    rows={3}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                <div className="text-xs text-neutral-500">
                  This will create an audit with {pendingAdjustments.size} adjustment{pendingAdjustments.size !== 1 ? 's' : ''} and generate a unique audit number for tracking.
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAuditDialog(false);
                    setAuditName('');
                    setAuditDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyAuditAdjustments()}
                  disabled={!auditName.trim() || isApplying}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    !auditName.trim() || isApplying
                      ? 'bg-neutral-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isApplying ? 'Creating...' : 'Create Audit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdjustmentsGrid.displayName = 'AdjustmentsGrid';
