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
import { AlertModal, SettingsDropdown, InventoryHistoryView } from '../components/ui';
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
  const [selectedCustomer, setSelectedCustomer] = useState<WordPressUser | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [blueprintProducts, setBlueprintProducts] = useState<Product[]>([]);
  const [blueprintProductsLoading, setBlueprintProductsLoading] = useState(false);
  
  const handleCustomerSelect = useCallback((customer: WordPressUser | null) => {
    setSelectedCustomer(customer);
  }, []);

  // Function to update quantities for sold products
  const updateSoldProductQuantities = useCallback(async (soldProducts: Array<{ productId: number; variantId?: number }>) => {
    try {
      // Fetch fresh inventory data for only the sold products
      const updates = await Promise.all(
        soldProducts.map(async ({ productId, variantId }) => {
          try {
            const response = await fetch(`/api/proxy/flora-im/products/${productId}/inventory`);
            if (response.ok) {
              const inventoryData = await response.json();
              
              // Extract stock for user's location
              const locationStock = inventoryData.find((inv: any) => 
                parseInt(inv.location_id) === parseInt(user?.location_id?.toString() || '0')
              );
              
              return {
                productId,
                variantId,
                newQuantity: locationStock?.quantity || 0
              };
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch inventory for product ${productId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed requests and update ProductGrid
      const validUpdates = updates.filter(update => update !== null);
      if (validUpdates.length > 0 && productGridRef.current?.updateProductQuantities) {
        productGridRef.current.updateProductQuantities(validUpdates);
      }
      
    } catch (error) {
      console.error('Error updating sold product quantities:', error);
      throw error;
    }
  }, [user?.location_id]);

  const handleOpenCustomerSelector = useCallback(() => {
    unifiedSearchRef.current?.openCustomerMode();
  }, []);
  
  const handleProductSelect = useCallback((product: Product | null) => {
    setSelectedProduct(product);
  }, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  
  // Category filter state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
  
  // Update pending adjustments and applying state periodically
  useEffect(() => {
    if (currentView === 'adjustments' && adjustmentsGridRef.current) {
      const interval = setInterval(() => {
        const products = adjustmentsGridRef.current?.getProducts() || [];
        const adjustments = adjustmentsGridRef.current?.getPendingAdjustments() || new Map();
        
        // Debug logging
        console.log('🔧 Main Page Debug:', {
          currentView,
          productsCount: products.length,
          adjustmentsCount: adjustments.size,
          sampleProducts: products.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
        });
        
        setPendingAdjustments(adjustments);
        setIsApplying(adjustmentsGridRef.current?.getIsApplying() || false);
        setAdjustmentProducts(products);
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
  }, []);

  const handleCategoryChange = useCallback((categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
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
      setIsAuditMode(!isAuditMode);
      setIsRestockMode(false); // Disable restock mode when audit is active
      if (!isAuditMode) {
        setCartItems([]); // Clear cart when entering audit mode
      }
    }
  };

  const handleRestock = () => {
    setIsRestockMode(!isRestockMode);
    setIsAuditMode(false); // Disable audit mode when restock is active
    console.log('Restock mode toggled:', !isRestockMode);
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
    setCurrentView(view);
    // Clear selected product when leaving blueprint view
    if (view !== 'blueprint-fields') {
      setSelectedProduct(null);
    }
    // Set audit mode when entering adjustments view
    if (view === 'adjustments') {
      setIsAuditMode(true);
      setIsRestockMode(false);
      setCartItems([]); // Clear cart when entering adjustments mode
    } else if (view !== 'history') {
      setIsAuditMode(false);
      setIsRestockMode(false);
    }
    // Keep modes when switching between adjustments and history
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
    // Get the products that were sold for live updates
    const soldProductIds = cartItems
      .filter(item => !item.is_adjustment && item.quantity > 0)
      .map(item => ({ 
        productId: parseInt(item.id.toString()), 
        variantId: item.variation_id 
      }));

    // Clear cart and close checkout immediately
    setCartItems([]);
    setShowCheckout(false);
    setIsCheckoutLoading(false);
    
    // Update product quantities live by fetching fresh data for sold items only
    if (productGridRef.current?.updateProductQuantities && soldProductIds.length > 0) {
      try {
        // Fetch updated stock levels for sold products
        await updateSoldProductQuantities(soldProductIds);
        console.log('✅ Updated quantities for sold products:', soldProductIds);
      } catch (error) {
        console.error('❌ Failed to update product quantities:', error);
        // Fallback: Don't break the checkout flow
      }
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
    <div className="flex flex-col h-screen bg-transparent relative overflow-hidden">
      {/* Subtle 3D Wave Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-800"></div>
        <svg 
          className="absolute inset-0 w-full h-full object-cover"
          viewBox="0 0 1200 800" 
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#606060" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#464646" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#373737" stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#727272" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#606060" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#464646" stopOpacity="0.2"/>
            </linearGradient>
            <filter id="blur">
              <feGaussianBlur stdDeviation="2"/>
            </filter>
          </defs>
          
          {/* Background wave layers for 3D depth */}
          <path 
            d="M0,400 C300,300 600,500 1200,400 L1200,800 L0,800 Z" 
            fill="url(#waveGradient1)"
            filter="url(#blur)"
            opacity="0.3"
          />
          <path 
            d="M0,500 C400,350 800,550 1200,450 L1200,800 L0,800 Z" 
            fill="url(#waveGradient2)"
            opacity="0.4"
          />
          <path 
            d="M0,600 C350,450 650,650 1200,550 L1200,800 L0,800 Z" 
            fill="url(#waveGradient1)"
            opacity="0.2"
          />
          
          {/* Subtle top waves */}
          <path 
            d="M0,0 C300,100 600,50 1200,80 L1200,0 Z" 
            fill="url(#waveGradient2)"
            opacity="0.15"
          />
        </svg>
      </div>
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
            onRefresh={handleRefresh}
            onSettings={handleSettings}
            onViewChange={handleViewChange}
            currentView={currentView}
            categories={categories}
            selectedCategory={selectedCategory || undefined}
            onCategoryChange={handleCategoryChange}
            categoriesLoading={categoriesLoading}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
            selectedProduct={selectedProduct}
            onProductSelect={handleProductSelect}
            products={currentView === 'adjustments' ? adjustmentProducts : blueprintProducts}
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
            unifiedSearchRef={unifiedSearchRef}
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Full Page Loading Overlay - Show when initially loading products only */}
        {(currentView === 'products' && isProductsLoading && !isRefreshing) && (
          <LoadingSpinner 
            overlay
            size="lg" 
            text="Loading Products"
            subText="Fetching inventory data..."
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
              text={
                isRefreshing && currentView === 'products' ? 'Refreshing Products' :
                isRefreshing && currentView === 'customers' ? 'Refreshing Customers' :
                isRefreshing && currentView === 'orders' ? 'Refreshing Orders' :
                'Loading'
              }
              subText="Updating data..."
            />
          )}
          {currentView === 'products' && (
            <div className="h-full overflow-y-auto relative">
              <ProductGrid
                ref={productGridRef}
                onAddToCart={handleAddToCart}
                searchQuery={searchQuery}
                categoryFilter={selectedCategory || undefined}
                onLoadingChange={handleProductsLoadingChange}
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
                <Suspense fallback={<LoadingSpinner size="lg" text="Loading Customers" subText="Preparing view..." />}>
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
                <Suspense fallback={<LoadingSpinner size="lg" text="Loading Orders" subText="Preparing view..." />}>
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
              <Suspense fallback={<LoadingSpinner size="lg" text="Loading Checkout" subText="Preparing checkout..." />}>
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
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>Online</span>
            <span className="text-neutral-600">•</span>
            <span>Last updated: {mounted ? currentTime : '--:--:--'}</span>
            {/* Orders Count in Status Bar */}
            {currentView === 'orders' && (
              <>
                <span className="text-neutral-600">•</span>
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
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-neutral-500">
            {mounted && isAuthenticated && user && (
              <span>Hello, {user.username}</span>
            )}
          </div>
          
          <div className="text-xs text-neutral-500">
            {mounted && isAuthenticated && user && (
              <span>{user.location || 'FloraDistro'}</span>
            )}
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
