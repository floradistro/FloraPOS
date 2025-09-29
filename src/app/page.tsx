'use client';

import React, { useState, useEffect, Suspense, lazy, useRef, useCallback, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Cart } from '../components/ui/Cart';
import { UnifiedSearchInput, UnifiedSearchInputRef } from '../components/ui/UnifiedSearchInput';
import { ProductGrid } from '../components/ui/ProductGrid';
import { AdjustmentsGrid, AdjustmentsGridRef } from '../components/ui/AdjustmentsGrid';
import BlueprintFieldsGrid from '../components/ui/BlueprintFieldsGrid';
import { PrintSettingsPanel, PrintSettings } from '../components/ui/PrintSettingsPanel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';




// Wrapper to properly forward refs to lazy-loaded components
const createLazyComponent = <P extends {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>
) => {
  const LazyComponent = lazy(importFn);
  // Return a forwardRef component that properly forwards the ref
  return React.forwardRef<any, P>((props, ref) => (
    <LazyComponent {...props} ref={ref} />
  ));
};
const CheckoutScreenLazy = createLazyComponent(() => import('../components/ui/CheckoutScreen'));
const OrdersViewLazy = createLazyComponent(() => import('../components/ui/OrdersView'));
const CustomersViewLazy = createLazyComponent(() => import('../components/ui/CustomersView'));

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CartItem, ViewType } from '../types';
import { initializePWA } from '../lib/serviceWorker';
import { errorReporting, reportUserActionError } from '../lib/errorReporting';
import { CacheManager } from '../lib/cache-manager';
import { 
  CriticalErrorBoundary,
  StandardErrorBoundary 
} from '../components/error/UnifiedErrorBoundary';


// Import Product type from ProductGrid
import type { Product } from '../components/ui/ProductGrid';
import { WordPressUser } from '../services/users-service';
import { Category } from '../components/ui/CategoryFilter';
import { CategoriesService } from '../services/categories-service';
import { CartService } from '../services/cart-service';
import { ReloadDebugger } from '../lib/debug-reload';
import { AlertModal, SettingsDropdown, InventoryHistoryView, MenuView } from '../components/ui';
import { useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewType>('products');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);
  
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  // View-specific selections state
  const [viewSelections, setViewSelections] = useState<{
    [key in ViewType]?: {
      customer?: WordPressUser | null;
      product?: Product | null;
      category?: string | null;
      searchQuery?: string;
      auditMode?: boolean;
      restockMode?: boolean;
      blueprintField?: string | null;
      blueprintFieldValue?: string | null;
    }
  }>({});
  
  const [selectedCustomer, setSelectedCustomer] = useState<WordPressUser | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [blueprintProducts, setBlueprintProducts] = useState<Product[]>([]);
  const [blueprintProductsLoading, setBlueprintProductsLoading] = useState(false);
  
  // Category filter state - moved up to be available for callbacks
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Blueprint field search state
  const [selectedBlueprintField, setSelectedBlueprintField] = useState<string | null>(null);
  const [blueprintFieldValue, setBlueprintFieldValue] = useState<string | null>(null);
  
  // Products from ProductGrid for blueprint field extraction
  const [gridProducts, setGridProducts] = useState<Product[]>([]);
  
  // Save current view's selections
  const saveCurrentViewSelections = useCallback(() => {
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        customer: selectedCustomer,
        product: selectedProduct,
        category: selectedCategory,
        searchQuery: searchQuery,
        auditMode: isAuditMode,
        restockMode: isRestockMode,
        blueprintField: selectedBlueprintField,
        blueprintFieldValue: blueprintFieldValue,
      }
    }));
  }, [currentView, selectedCustomer, selectedProduct, selectedCategory, searchQuery, isAuditMode, isRestockMode, selectedBlueprintField, blueprintFieldValue]);

  // Restore selections for a specific view
  const restoreViewSelections = useCallback((view: ViewType) => {
    const viewData = viewSelections[view];
    if (viewData) {
      setSelectedCustomer(viewData.customer || null);
      setSelectedProduct(viewData.product || null);
      setSelectedCategory(viewData.category || null);
      setSearchQuery(viewData.searchQuery || '');
      setIsAuditMode(viewData.auditMode || false);
      setIsRestockMode(viewData.restockMode || false);
      setSelectedBlueprintField(viewData.blueprintField || null);
      setBlueprintFieldValue(viewData.blueprintFieldValue || null);
    } else {
      // Default values for new view
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setSelectedCategory(null);
      setSearchQuery('');
      setIsAuditMode(view === 'adjustments'); // Default to audit mode for adjustments
      setIsRestockMode(false);
      setSelectedBlueprintField(null);
      setBlueprintFieldValue(null);
    }
  }, [viewSelections]);

  const handleCustomerSelect = useCallback((customer: WordPressUser | null) => {
    setSelectedCustomer(customer);
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        customer: customer
      }
    }));
  }, [currentView]);


  // Function to calculate and update quantities for sold products
  const updateSoldProductQuantities = useCallback((soldItems: Array<{ productId: number; variantId?: number; soldQuantity: number }>) => {
    console.log('🎯 Calculating quantity updates for sold items:', soldItems);
    
    // Get current ProductGrid state and calculate new quantities
    if (productGridRef.current?.updateProductQuantities) {
      // For now, we'll use the inventory deduction service result
      // Since the backend has already deducted inventory, we need to get fresh data
      // Let's use a simple approach: re-fetch just the sold products
      
      const updates = soldItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        newQuantity: 0 // Will be updated when we get fresh data
      }));
      
      // Trigger immediate state update with placeholder, then fetch real data
      setTimeout(async () => {
        try {
          // Fetch the entire product list but only update sold products
          const response = await fetch(`/api/proxy/flora-im/products?per_page=1000&_t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const realUpdates = soldItems.map(soldItem => {
                const freshProduct = result.data.find((p: any) => p.id === soldItem.productId);
                if (freshProduct) {
                  const locationInventory = freshProduct.inventory?.find((inv: any) => 
                    parseInt(inv.location_id) === parseInt(user?.location_id?.toString() || '0')
                  );
                  
                  return {
                    productId: soldItem.productId,
                    variantId: soldItem.variantId,
                    newQuantity: parseFloat(locationInventory?.stock || locationInventory?.quantity || 0)
                  };
                }
                return null;
              }).filter(update => update !== null) as Array<{ productId: number; variantId?: number; newQuantity: number }>;
              
              if (realUpdates.length > 0) {
                productGridRef.current?.updateProductQuantities(realUpdates);
                console.log('🎯 Updated quantities with fresh data:', realUpdates);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching fresh quantities:', error);
        }
      }, 1000); // 1 second delay for backend processing
    }
  }, [user?.location_id]);

  const handleOpenCustomerSelector = useCallback(() => {
    unifiedSearchRef.current?.openCustomerMode();
  }, []);
  
  const handleProductSelect = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        product: product
      }
    }));
  }, [currentView]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  
  // Track filtered products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProductsCount, setSelectedProductsCount] = useState(0);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Orders filter state
  const [orderStatusFilter, setOrderStatusFilter] = useState('any');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderShowSelectedOnly, setOrderShowSelectedOnly] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrdersCount, setSelectedOrdersCount] = useState(0);

  // History filter states
  const [historyDateFilter, setHistoryDateFilter] = useState('7');
  const [historyActionFilter, setHistoryActionFilter] = useState('all');
  
  // Audit state for header
  const [pendingAdjustments, setPendingAdjustments] = useState(new Map<string, number>());
  const [isApplying, setIsApplying] = useState(false);
  const [adjustmentProducts, setAdjustmentProducts] = useState<any[]>([]);
  
  // Purchase order state
  const [pendingRestockProducts, setPendingRestockProducts] = useState<Map<string, number>>(new Map());
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  
  // Adjustments grid controls state
  const [showOnlySelectedAdjustments, setShowOnlySelectedAdjustments] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(true);
  
  // Function to handle audit creation from header (legacy modal)
  const handleCreateAudit = useCallback(() => {
    if (adjustmentsGridRef.current) {
      adjustmentsGridRef.current.createAudit();
    }
  }, []);

  // Function to handle audit creation with details from search bar
  const handleCreateAuditWithDetails = useCallback(async (name: string, description?: string) => {
    if (adjustmentsGridRef.current) {
      await adjustmentsGridRef.current.createAuditWithDetails(name, description);
    }
  }, []);

  // Function to handle purchase order creation from header (legacy modal)
  const handleCreatePurchaseOrder = useCallback(() => {
    if (adjustmentsGridRef.current) {
      adjustmentsGridRef.current.createPurchaseOrder();
    }
  }, []);

  // Function to handle purchase order creation with details from search bar
  const handleCreatePurchaseOrderWithDetails = useCallback(async (supplierName: string, notes?: string) => {
    if (adjustmentsGridRef.current) {
      await adjustmentsGridRef.current.createPurchaseOrderWithDetails(supplierName, notes);
    }
  }, []);

  // Function to handle removing individual adjustments
  const handleRemoveAdjustment = useCallback((key: string) => {
    console.log('🏠 Main page handleRemoveAdjustment called:', key);
    if (adjustmentsGridRef.current) {
      console.log('🏠 Calling adjustmentsGridRef.current.removeAdjustment');
      adjustmentsGridRef.current.removeAdjustment(key);
    } else {
      console.log('🏠 adjustmentsGridRef.current is null');
    }
  }, []);

  // Function to handle updating individual adjustments
  const handleUpdateAdjustment = useCallback((key: string, newValue: number) => {
    console.log('🏠 Main page handleUpdateAdjustment called:', key, newValue);
    if (adjustmentsGridRef.current) {
      console.log('🏠 Calling adjustmentsGridRef.current.updateAdjustment');
      adjustmentsGridRef.current.updateAdjustment(key, newValue);
    } else {
      console.log('🏠 adjustmentsGridRef.current is null');
    }
  }, []);

  // Function to handle removing individual restock products
  const handleRemoveRestockProduct = useCallback((key: string) => {
    console.log('🛒 Main page handleRemoveRestockProduct called:', key);
    if (adjustmentsGridRef.current) {
      console.log('🛒 Calling adjustmentsGridRef.current.removeRestockProduct');
      adjustmentsGridRef.current.removeRestockProduct(key);
    } else {
      console.log('🛒 adjustmentsGridRef.current is null');
    }
  }, []);

  // Function to handle updating individual restock quantities
  const handleUpdateRestockQuantity = useCallback((key: string, newQuantity: number) => {
    console.log('🛒 Main page handleUpdateRestockQuantity called:', key, newQuantity);
    if (adjustmentsGridRef.current) {
      console.log('🛒 Calling adjustmentsGridRef.current.updateRestockQuantity');
      adjustmentsGridRef.current.updateRestockQuantity(key, newQuantity);
    } else {
      console.log('🛒 adjustmentsGridRef.current is null');
    }
  }, []);
  
  // Update pending adjustments and purchase order state periodically
  useEffect(() => {
    if (currentView === 'adjustments' && adjustmentsGridRef.current) {
      const interval = setInterval(() => {
        const products = adjustmentsGridRef.current?.getProducts() || [];
        const adjustments = adjustmentsGridRef.current?.getPendingAdjustments() || new Map();
        const restockProducts = adjustmentsGridRef.current?.getPendingRestockProducts() || new Map();
        const creatingPO = adjustmentsGridRef.current?.getIsCreatingPO() || false;
        
        // Debug logging
        console.log('🔧 Main Page Debug:', {
          currentView,
          productsCount: products.length,
          adjustmentsCount: adjustments.size,
          restockProductsCount: restockProducts.size,
          isCreatingPO: creatingPO,
          sampleProducts: products.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
        });
        
        setPendingAdjustments(adjustments);
        setIsApplying(adjustmentsGridRef.current?.getIsApplying() || false);
        setAdjustmentProducts(products);
        setPendingRestockProducts(restockProducts);
        setIsCreatingPO(creatingPO);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [currentView]);
  
  // Alert state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // Settings dropdown state
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const productGridRef = useRef<{ 
    refreshInventory: () => Promise<void>;
    updateProductQuantities: (updates: Array<{ productId: number; variantId?: number; newQuantity: number }>) => void;
  }>(null);
  const adjustmentsGridRef = useRef<AdjustmentsGridRef>(null);
  const unifiedSearchRef = useRef<UnifiedSearchInputRef>(null);
  const blueprintFieldsGridRef = useRef<{ refresh: () => Promise<void> }>(null);
  const customersViewRef = useRef<any>(null);
  const ordersViewRef = useRef<any>(null);


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);



  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        searchQuery: query
      }
    }));
  }, [currentView]);

  const handleCategoryChange = useCallback((categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        category: categorySlug
      }
    }));
  }, [currentView]);

  const handleBlueprintFieldChange = useCallback((fieldName: string | null, fieldValue: string | null) => {
    setSelectedBlueprintField(fieldName);
    setBlueprintFieldValue(fieldValue);
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        blueprintField: fieldName,
        blueprintFieldValue: fieldValue
      }
    }));
  }, [currentView]);

  const handleProductsChange = useCallback((products: Product[]) => {
    setGridProducts(products);
  }, []);

  // Memoized fetch categories function
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const fetchedCategories = await CategoriesService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Update time immediately on mount - focus updates handled in combined handler below
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Initialize PWA features (service worker, offline support, etc.)
    initializePWA();
    
    // Setup cache management for development
    CacheManager.setupDevCacheManagement();
    
    // Check if we need to bust cache
    if (CacheManager.shouldBustCache()) {
      console.log('🔄 Cache version mismatch, clearing caches...');
      CacheManager.clearAllCaches().then(() => {
        CacheManager.updateCacheVersion();
      });
    } else {
      CacheManager.updateCacheVersion();
    }
  }, []);

  // Set up error reporting user context when authenticated
  useEffect(() => {
    if (user && user.id) {
      errorReporting.setUserId(user.id.toString());
    }
  }, [user]);

  // Fetch categories in a separate useEffect to avoid blocking the main render
  useEffect(() => {
    fetchCategories().catch(error => {
      // Categories failed to load, continue without them
    });
  }, []);

  const handleAddToCart = (product: Product) => {
    const result = CartService.createCartItemFromProduct(product);
    
    if (result.success && result.cartItem) {
      setCartItems(items => CartService.mergeCartItem(items, result.cartItem!));
    } else {
      setAlertModal({
        isOpen: true,
        title: 'Add to Cart Error',
        message: result.error || 'Failed to add item to cart'
      });
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding item to cart:', result.error);
      }
    }
  };

  // Removed handleAddAdjustment - adjustments now handled directly in AdjustmentsGrid
  /*
  const handleAddAdjustment = (product: Product, adjustment: number) => {
    console.log('🔧 [DEBUG] handleAddAdjustment called:', { productName: product.name, adjustment });
    
    const productId = product.parent_id || product.id;
    const variationId = product.parent_id ? product.id : undefined;
    
    // Check if adjustment item already exists for this product/variant
    setCartItems(items => {
      const existingAdjustmentIndex = items.findIndex(item => 
        item.is_adjustment && 
        item.product_id === productId && 
        item.variation_id === variationId
      );
      
      if (existingAdjustmentIndex >= 0) {
        // Update existing adjustment
        const updatedItems = [...items];
        updatedItems[existingAdjustmentIndex] = {
          ...updatedItems[existingAdjustmentIndex],
          adjustment_amount: adjustment
        };
        console.log('🔧 [DEBUG] Updated existing adjustment item');
        return updatedItems;
      } else {
        // Create new adjustment cart item
        const adjustmentItem: CartItem = {
          id: `adj-${productId}${variationId ? `-${variationId}` : ''}`,
          name: product.name,
          price: 0, // No price for adjustments
          quantity: 1, // Always quantity 1 for adjustment items
          image: product.image,
          sku: product.sku,
          category: product.categories && product.categories.length > 0 ? product.categories[0].name : undefined,
          product_id: productId,
          variation_id: variationId,
          is_variant: !!product.parent_id,
          is_adjustment: true,
          adjustment_amount: adjustment
        };

        console.log('🔧 [DEBUG] Created new adjustment item:', adjustmentItem);
        const newItems = [...items, adjustmentItem];
        console.log('✅ [DEBUG] Added adjustment to cart. Total items:', newItems.length);
        return newItems;
      }
    });
  };
  */

  // Removed handleApplyAdjustments - adjustments now handled directly in AdjustmentsGrid
  /*
  const handleApplyAdjustments = async (reason = 'Manual adjustment') => {
    const adjustmentItems = cartItems.filter(item => item.is_adjustment);
    
    if (adjustmentItems.length === 0) {
      return;
    }

    try {
      console.log(`🔄 Applying ${adjustmentItems.length} inventory adjustments...`);
      
      // Apply all adjustments via API calls
      const adjustmentPromises = adjustmentItems.map(async (item) => {
        const response = await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: item.product_id,
            variation_id: item.variation_id,
            adjustment: item.adjustment_amount,
            reason: reason,
            location_id: user?.location_id || null
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to adjust ${item.name}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Applied adjustment: ${item.name} ${item.adjustment_amount! > 0 ? '+' : ''}${item.adjustment_amount}`);
        return result;
      });

      // Wait for all adjustments to complete
      await Promise.all(adjustmentPromises);
      
      // Clear adjustment items from cart
      setCartItems(items => items.filter(item => !item.is_adjustment));
      
      // Refresh inventory to show updated quantities
      if (productGridRef.current?.refreshInventory) {
        await productGridRef.current.refreshInventory();
      }
      
      console.log(`✅ Applied ${adjustmentItems.length} inventory adjustments successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to apply adjustments:', error);
    }
  };
  */

  // Removed refreshKey and shouldRefreshInventory states - ProductGrid handles inventory refresh via event bus

  // Note: Removed polling-based sync in favor of event-driven system
  // The event bus now handles immediate inventory updates like Portal2

  const handleProductsLoadingChange = (loading: boolean, hasProducts: boolean) => {
    // Don't show initial loading if we're already refreshing
    if (!isRefreshing) {
      setIsProductsLoading(loading);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Clear initial loading state when refresh starts
      setIsProductsLoading(false);
      
      // Only refresh the current view, not the entire page
      if (currentView === 'products') {
        if (productGridRef.current?.refreshInventory) {
          await productGridRef.current.refreshInventory();
        }
      } else if (currentView === 'adjustments') {
        if (adjustmentsGridRef.current?.refreshInventory) {
          await adjustmentsGridRef.current.refreshInventory();
        }
      } else if (currentView === 'blueprint-fields') {
        if (blueprintFieldsGridRef.current?.refresh) {
          await blueprintFieldsGridRef.current.refresh();
        }
      } else if (currentView === 'customers') {
        if (customersViewRef.current?.handleRefresh) {
          await customersViewRef.current.handleRefresh();
        } else {
          // Fallback to invalidating queries
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
      } else if (currentView === 'orders') {
        if (ordersViewRef.current?.handleRefresh) {
          await ordersViewRef.current.handleRefresh();
        } else {
          // Fallback to invalidating queries
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Refresh Error',
        message: 'Failed to refresh. Please try again.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Smart invalidation - refresh only when needed (performance optimization)
  // Removed 30-second polling for better performance

  // Focus handler for time update only - no automatic inventory refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFocus = async () => {
      // Always update time on focus
      setCurrentTime(new Date().toLocaleTimeString());
      
      // No automatic inventory refresh - only manual refresh via button
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);



  const handleSettings = () => {
    setShowSettingsDropdown(prev => !prev);
  };

  const handleAuditModeToggle = () => {
    // Toggle audit mode when in adjustments view
    if (currentView === 'adjustments') {
      const newAuditMode = !isAuditMode;
      setIsAuditMode(newAuditMode);
      setIsRestockMode(false); // Disable restock mode when audit is active
      
      // Update the current view's selections
      setViewSelections(prev => ({
        ...prev,
        [currentView]: {
          ...prev[currentView],
          auditMode: newAuditMode,
          restockMode: false
        }
      }));
      
      if (newAuditMode) {
        setCartItems([]); // Clear cart when entering audit mode
      }
    }
  };

  const handleRestock = () => {
    const newRestockMode = !isRestockMode;
    setIsRestockMode(newRestockMode);
    setIsAuditMode(false); // Disable audit mode when restock is active
    
    // Update the current view's selections
    setViewSelections(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        restockMode: newRestockMode,
        auditMode: false
      }
    }));
    console.log('Restock mode toggled:', newRestockMode);
    
    // If entering restock mode and there are pending restock products, open search dropdown in purchase order mode
    if (newRestockMode && pendingRestockProducts.size > 0) {
      setTimeout(() => {
        unifiedSearchRef.current?.openPurchaseOrderMode();
      }, 100); // Small delay to ensure state is updated
    }
  };

  const handleAudit = () => {
    setIsAuditMode(!isAuditMode);
    setIsRestockMode(false); // Disable restock mode when audit is active
    if (!isAuditMode) {
      setCartItems([]); // Clear cart when entering audit mode
    }
    console.log('Audit mode toggled:', !isAuditMode);
  };


  const handleViewChange = (view: ViewType) => {
    // Save current view's selections before switching
    saveCurrentViewSelections();
    
    // Switch to new view
    setCurrentView(view);
    
    // Restore selections for the new view
    restoreViewSelections(view);
    
    // Clear cart when entering adjustments mode
    if (view === 'adjustments') {
      setCartItems([]);
    }
  };

  const handleHistoryBack = () => {
    setCurrentView('adjustments');
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(items => CartService.updateItemQuantity(items, id, quantity));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => CartService.removeItem(items, id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };
  
  const handleUpdatePriceOverride = (id: string, overridePrice: number | undefined) => {
    setCartItems(items => items.map(item => 
      item.id === id ? { ...item, override_price: overridePrice } : item
    ));
  };
  
  const handleUpdateDiscountPercentage = (id: string, discountPercentage: number | undefined) => {
    setCartItems(items => items.map(item => 
      item.id === id ? { 
        ...item, 
        discount_percentage: discountPercentage !== undefined 
          ? Math.min(100, Math.max(0, discountPercentage)) 
          : undefined
      } : item
    ));
  };

  // Removed handleUpdateAdjustment - adjustments now handled directly in AdjustmentsGrid
  /*
  const handleUpdateAdjustment = (id: string, adjustmentAmount: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, adjustment_amount: adjustmentAmount }
          : item
      )
    );
  };
  */

  const handleCheckout = (customer?: WordPressUser | null) => {
    try {
      // Validate cart using CartService
      const validation = CartService.validateCart(cartItems);
      if (!validation.isValid) {
        setAlertModal({
          isOpen: true,
          title: 'Cart Validation Error',
          message: validation.errors.join('\n')
        });
        reportUserActionError(
          new Error('Checkout validation failed'),
          'checkout',
          { cartItemCount: cartItems.length, validationErrors: validation.errors }
        );
        return;
      }
      
      if (customer) {
        setSelectedCustomer(customer);
      }
      setIsCheckoutLoading(true);
      setShowCheckout(true);
      
      // Trigger prefetching for checkout data
      if (typeof window !== 'undefined') {
        const checkoutEvent = new CustomEvent('checkout-started');
        window.dispatchEvent(checkoutEvent);
      }
      
    } catch (error) {
      reportUserActionError(
        error instanceof Error ? error : new Error('Unknown checkout error'),
        'checkout',
        { cartItemCount: cartItems.length, customerId: customer?.id }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during checkout:', error);
      }
    }
  };

  const handleOrderComplete = async () => {
    // Calculate quantity changes before clearing cart
    const quantityUpdates = cartItems
      .filter(item => !item.is_adjustment && item.quantity > 0)
      .map(item => {
        // Calculate new quantity by subtracting sold amount from current
        // We'll get the current quantity from the ProductGrid state
        return {
          productId: parseInt(item.id.toString()),
          variantId: item.variation_id,
          soldQuantity: item.quantity
        };
      });

    // Clear cart and close checkout immediately
    setCartItems([]);
    setShowCheckout(false);
    setIsCheckoutLoading(false);
    
    // Update only the quantities of sold products
    if (productGridRef.current?.updateProductQuantities && quantityUpdates.length > 0) {
      // Calculate the new quantities based on current state
      const updates = quantityUpdates.map(item => {
        // For now, we'll fetch the current quantity from the grid and subtract
        // This is a simplified approach - the exact current stock will be calculated
        return {
          productId: item.productId,
          variantId: item.variantId,
          newQuantity: 0 // Will be calculated from current state
        };
      });
      
      // Delay slightly to allow backend processing, then update quantities
      setTimeout(() => {
        try {
          // Get fresh quantities for sold products only
          updateSoldProductQuantities(quantityUpdates);
        } catch (error) {
          console.error('❌ Failed to update product quantities:', error);
        }
      }, 500);
    }
    
    // Invalidate customer-related queries to refresh order history and points
    console.log('🔄 Invalidating customer queries after order completion');
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    queryClient.invalidateQueries({ queryKey: ['user-history'] });
    queryClient.invalidateQueries({ queryKey: ['rewards'] });
    
    // Clear selected customer for next order
    setSelectedCustomer(null);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsCheckoutLoading(false);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render main content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Storybook-inspired Background */}
      <div className="absolute inset-0">
        {/* Parchment-like base gradient */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(255,248,220,0.08) 0%, rgba(255,248,220,0.02) 40%, transparent 70%), linear-gradient(180deg, rgba(255,248,220,0.03) 0%, rgba(240,230,200,0.015) 50%, rgba(220,210,180,0.02) 100%)'
          }}
        />
        
        {/* Soft vignette for story framing */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at center, transparent 30%, rgba(139,125,107,0.08) 70%, rgba(101,89,73,0.12) 100%)'
          }}
        />
        
        {/* Subtle paper texture */}
        <div 
          className="absolute inset-0 opacity-[0.004]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,248,220,0.3) 0.5px, transparent 1px),
              radial-gradient(circle at 75% 75%, rgba(240,230,200,0.2) 0.5px, transparent 1px),
              radial-gradient(circle at 50% 10%, rgba(255,248,220,0.15) 0.3px, transparent 0.8px),
              radial-gradient(circle at 20% 80%, rgba(240,230,200,0.25) 0.4px, transparent 1px)
            `,
            backgroundSize: '40px 40px, 60px 60px, 30px 30px, 50px 50px',
            backgroundPosition: '0 0, 20px 20px, 10px 10px, 30px 30px'
          }}
        />
        
        {/* Magical floating elements */}
        <div 
          className="absolute inset-0 opacity-[0.006]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 20%, rgba(255,215,0,0.4) 1px, transparent 2px),
              radial-gradient(circle at 85% 30%, rgba(255,182,193,0.3) 0.8px, transparent 1.5px),
              radial-gradient(circle at 25% 70%, rgba(173,216,230,0.35) 0.6px, transparent 1.2px),
              radial-gradient(circle at 70% 80%, rgba(255,215,0,0.25) 0.4px, transparent 1px),
              radial-gradient(circle at 45% 15%, rgba(255,182,193,0.2) 0.5px, transparent 1px)
            `,
            backgroundSize: '200px 200px, 180px 180px, 220px 220px, 160px 160px, 240px 240px',
            animation: 'storytellFloat 20s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* CSS Animation for floating elements */}
      <style jsx>{`
        @keyframes storytellFloat {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.006;
          }
          25% {
            transform: translate(5px, -8px) rotate(1deg);
            opacity: 0.004;
          }
          50% {
            transform: translate(-3px, -12px) rotate(-0.5deg);
            opacity: 0.008;
          }
          75% {
            transform: translate(8px, -5px) rotate(0.8deg);
            opacity: 0.003;
          }
        }
      `}</style>
      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          onRefresh={handleRefresh}
          onSettings={handleSettings}
          onViewChange={handleViewChange}
          currentView={currentView}
          onAuditModeToggle={handleAuditModeToggle}
        />
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Navigation */}
          <Header 
            onSearch={handleSearch}
            searchValue={searchQuery}
            onRefresh={handleRefresh}
            onSettings={handleSettings}
            onViewChange={handleViewChange}
            currentView={currentView}
            categories={categories}
            selectedCategory={selectedCategory || undefined}
            onCategoryChange={handleCategoryChange}
            categoriesLoading={categoriesLoading}
            selectedBlueprintField={selectedBlueprintField}
            onBlueprintFieldChange={handleBlueprintFieldChange}
            blueprintFieldValue={blueprintFieldValue}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
            selectedProduct={selectedProduct}
            onProductSelect={handleProductSelect}
            products={
              currentView === 'products' ? gridProducts :
              currentView === 'adjustments' ? adjustmentProducts : 
              blueprintProducts
            }
            productsLoading={currentView === 'adjustments' ? false : blueprintProductsLoading}
            isAuditMode={isAuditMode}
            isRestockMode={isRestockMode}
            selectedCount={selectedProductsCount}
            filteredCount={filteredProducts.length}
            onRestock={handleRestock}
            onAudit={handleAudit}
            // Orders filter props
            statusFilter={orderStatusFilter}
            onStatusFilterChange={setOrderStatusFilter}
            dateFrom={orderDateFrom}
            dateTo={orderDateTo}
            onDateFromChange={setOrderDateFrom}
            onDateToChange={setOrderDateTo}
            showSelectedOnly={orderShowSelectedOnly}
            onShowSelectedOnlyChange={setOrderShowSelectedOnly}
            totalOrders={totalOrders}
            selectedOrdersCount={selectedOrdersCount}
            onClearOrderSelection={() => setSelectedOrdersCount(0)}
            historyDateFilter={historyDateFilter}
            onHistoryDateFilterChange={setHistoryDateFilter}
            historyActionFilter={historyActionFilter}
            onHistoryActionFilterChange={setHistoryActionFilter}
            // Audit button props
            pendingAdjustments={pendingAdjustments}
            onCreateAudit={handleCreateAudit}
            onCreateAuditWithDetails={handleCreateAuditWithDetails}
            onRemoveAdjustment={handleRemoveAdjustment}
            onUpdateAdjustment={handleUpdateAdjustment}
            isApplying={isApplying}
            // Purchase order props
            pendingRestockProducts={pendingRestockProducts}
            onCreatePurchaseOrder={handleCreatePurchaseOrder}
            onCreatePurchaseOrderWithDetails={handleCreatePurchaseOrderWithDetails}
            onRemoveRestockProduct={handleRemoveRestockProduct}
            onUpdateRestockQuantity={handleUpdateRestockQuantity}
            isCreatingPO={isCreatingPO}
            showOnlySelectedAdjustments={showOnlySelectedAdjustments}
            onShowOnlySelectedAdjustmentsChange={setShowOnlySelectedAdjustments}
            sortAlphabetically={sortAlphabetically}
            onSortAlphabeticallyChange={setSortAlphabetically}
            unifiedSearchRef={unifiedSearchRef}
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Full Page Loading Overlay - Show when initially loading products only */}
        {(currentView === 'products' && isProductsLoading && !isRefreshing) && (
          <LoadingSpinner 
            overlay
            size="lg"
          />
        )}
        
            {/* Main Content */}
            <main className={`flex-1 relative transition-all duration-500 ease-in-out ${
              currentView !== 'products' && currentView !== 'blueprint-fields' ? 'mr-[-320px]' : 'mr-0'
            }`}>
          {/* Loading Overlays - Only show refresh overlays for views without their own loading */}
          {isRefreshing && currentView !== 'blueprint-fields' && (
            <LoadingSpinner 
              overlay 
              size="lg"
            />
          )}
          {currentView === 'products' && (
            <div className="h-full overflow-y-auto relative">
              <ProductGrid
                ref={productGridRef}
                onAddToCart={handleAddToCart}
                searchQuery={searchQuery}
                categoryFilter={selectedCategory || undefined}
                selectedBlueprintField={selectedBlueprintField}
                blueprintFieldValue={blueprintFieldValue}
                onLoadingChange={handleProductsLoadingChange}
                onProductsChange={handleProductsChange}
              />
            </div>
          )}
          
          {currentView === 'adjustments' && (
            <div className="h-full overflow-y-auto relative">
              <AdjustmentsGrid
                ref={adjustmentsGridRef}
                searchQuery={searchQuery}
                categoryFilter={selectedCategory || undefined}
                onLoadingChange={handleProductsLoadingChange}
                isAuditMode={isAuditMode}
                isRestockMode={isRestockMode}
                showOnlySelected={showOnlySelectedAdjustments}
                onShowOnlySelectedChange={setShowOnlySelectedAdjustments}
                sortAlphabetically={sortAlphabetically}
                onSortAlphabeticallyChange={setSortAlphabetically}
              />
            </div>
          )}

          {currentView === 'history' && (
            <div className="h-full overflow-hidden">
              <InventoryHistoryView
                onBack={handleHistoryBack}
                dateFilter={historyDateFilter}
                actionFilter={historyActionFilter}
              />
            </div>
          )}

          {currentView === 'blueprint-fields' && (
            <div className="h-full overflow-y-auto relative">
              <BlueprintFieldsGrid
                ref={blueprintFieldsGridRef}
                searchQuery={searchQuery}
                categoryFilter={selectedCategory || undefined}
                onLoadingChange={(loading) => setBlueprintProductsLoading(loading)} 
                selectedCustomer={selectedCustomer}
                printSettings={printSettings}
                selectedProduct={selectedProduct}
                onProductSelect={handleProductSelect}
                onProductsLoad={(products) => {
                  console.log('Page: Received products from BlueprintFieldsGrid:', products?.length);
                  setBlueprintProducts(products);
                }}
              />
            </div>
          )}
          
          {currentView === 'customers' && (
            <div className="h-full">
              <StandardErrorBoundary componentName="CustomersView">
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <CustomersViewLazy 
                    ref={customersViewRef} 
                    hideLoadingOverlay={isRefreshing}
                  />
                </Suspense>
              </StandardErrorBoundary>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="h-full overflow-y-auto">
              <StandardErrorBoundary componentName="OrdersView">
                <Suspense fallback={<LoadingSpinner size="lg" />}>
                  <OrdersViewLazy 
                    ref={ordersViewRef} 
                    hideLoadingOverlay={isRefreshing}
                    statusFilter={orderStatusFilter}
                    onStatusFilterChange={setOrderStatusFilter}
                    dateFrom={orderDateFrom}
                    dateTo={orderDateTo}
                    onDateFromChange={setOrderDateFrom}
                    onDateToChange={setOrderDateTo}
                    showSelectedOnly={orderShowSelectedOnly}
                    onShowSelectedOnlyChange={setOrderShowSelectedOnly}
                    onTotalOrdersChange={setTotalOrders}
                    onSelectedOrdersCountChange={setSelectedOrdersCount}
                    selectedCustomer={selectedCustomer}
                  />
                </Suspense>
              </StandardErrorBoundary>
            </div>
          )}

          {currentView === 'menu' && (
            <div className="h-full overflow-y-auto">
              <StandardErrorBoundary componentName="MenuView">
                <MenuView
                  searchQuery={searchQuery}
                  categoryFilter={selectedCategory || undefined}
                />
              </StandardErrorBoundary>
            </div>
          )}

            </main>

        {/* Cart Panel - Only show for products and blueprint-fields views */}
        <div className={`w-80 flex-shrink-0 transition-transform duration-500 ease-in-out ${
          currentView !== 'products' && currentView !== 'blueprint-fields' ? 'transform translate-x-full' : 'transform translate-x-0'
        }`}>
          {!showCheckout && currentView !== 'blueprint-fields' && currentView === 'products' ? (
            <StandardErrorBoundary componentName="Cart">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={handleCheckout}
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleCustomerSelect}
                isProductsLoading={isProductsLoading}
                isAuditMode={isAuditMode}
                onOpenCustomerSelector={handleOpenCustomerSelector}
                isCheckoutLoading={isCheckoutLoading}
                onUpdatePriceOverride={handleUpdatePriceOverride}
                onUpdateDiscountPercentage={handleUpdateDiscountPercentage}
                // onApplyAdjustments={handleApplyAdjustments} - removed
                // onUpdateAdjustment={handleUpdateAdjustment} - removed
              />
            </StandardErrorBoundary>
          ) : currentView === 'blueprint-fields' ? (
            <PrintSettingsPanel
              selectedCustomer={selectedCustomer}
              onCustomerSelect={handleCustomerSelect}
              onSettingsChange={setPrintSettings}
            />
          ) : (
            <CriticalErrorBoundary componentName="Checkout">
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <CheckoutScreenLazy
                  items={cartItems}
                  selectedCustomer={selectedCustomer}
                  onClose={handleCloseCheckout}
                  onOrderComplete={handleOrderComplete}
                />
              </Suspense>
            </CriticalErrorBoundary>
          )}
        </div>
          </div>
        </div>
      </div>


      {/* Status Bar */}
      <div className="flex-shrink-0 bg-transparent px-4 py-2 relative z-10">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3 text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {/* Orders Count in Status Bar */}
            {currentView === 'orders' && (
              <>
                <span>{totalOrders} total orders</span>
                {selectedOrdersCount > 0 && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="text-neutral-300">{selectedOrdersCount} selected</span>
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {mounted && isAuthenticated && user && (
              <span>{user.location || 'FloraDistro'}</span>
            )}
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{mounted ? currentTime : '--:--:--'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />
      

      {/* Settings Dropdown - Positioned in cart area */}
      {showSettingsDropdown && (
        <div className="fixed top-16 right-2 w-80 z-[9999]">
          <SettingsDropdown
            isOpen={showSettingsDropdown}
            onClose={() => setShowSettingsDropdown(false)}
            onToggle={() => setShowSettingsDropdown(prev => !prev)}
          />
        </div>
      )}

    </div>
  );
}
