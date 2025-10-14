'use client';

import React, { useState, useEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { UnifiedSearchInput, UnifiedSearchInputRef, Category, Product } from '../ui/UnifiedSearchInput';
import { IconButton } from '../ui/IconButton';
import { Divider } from '../ui/Divider';
import { HeaderCustomerSelector } from '../ui/HeaderCustomerSelector';
import { ArtifactsDropdown } from '../ui/ArtifactsDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { WordPressUser } from '../../services/users-service';
import { ViewType } from '../../types';
import { ApiConfig } from '../../lib/api-config';
import { AICanvasRef } from '../ui/SimpleAICanvas';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  onRefresh?: () => void;
  onSettings?: () => void;
  onViewChange?: (view: ViewType) => void;
  currentView?: ViewType;
  // Category filter props
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categorySlug: string | null) => void;
  categoriesLoading?: boolean;
  // Blueprint field search props - supports multiple selections
  selectedBlueprintField?: string | null;
  onBlueprintFieldChange?: (fieldName: string | null, fieldValues: string[] | null) => void;
  blueprintFieldValues?: string[];
  // Customer selector props
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  // Product selector props (for blueprint view)
  selectedProduct?: Product | null;
  onProductSelect?: (product: Product | null) => void;
  products?: Product[];
  productsLoading?: boolean;
  // Audit mode props
  isAuditMode?: boolean;
  isRestockMode?: boolean;
  // Select all props for adjust mode (removed - no longer needed)
  selectedCount?: number;
  filteredCount?: number;
  // Restock props for adjust mode
  onRestock?: () => void;
  // Audit props for adjust mode
  onAudit?: () => void;
  // Orders filter props
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  totalOrders?: number;
  selectedOrdersCount?: number;
  onClearOrderSelection?: () => void;
  // Audit button props
  pendingAdjustments?: Map<string, number>;
  onCreateAudit?: () => void;
  onCreateAuditWithDetails?: (name: string, description?: string) => Promise<void>;
  onRemoveAdjustment?: (key: string) => void;
  onUpdateAdjustment?: (key: string, newValue: number) => void;
  isApplying?: boolean;
  // Purchase order props
  pendingRestockProducts?: Map<string, number>;
  onCreatePurchaseOrder?: () => void;
  onCreatePurchaseOrderWithDetails?: (supplierName: string, notes?: string) => Promise<void>;
  onRemoveRestockProduct?: (key: string) => void;
  onUpdateRestockQuantity?: (key: string, newQuantity: number) => void;
  isCreatingPO?: boolean;
  // Adjustments view controls
  showOnlySelectedAdjustments?: boolean;
  onShowOnlySelectedAdjustmentsChange?: (show: boolean) => void;
  sortAlphabetically?: boolean;
  onSortAlphabeticallyChange?: (sort: boolean) => void;
  // Search ref
  unifiedSearchRef?: React.RefObject<UnifiedSearchInputRef>;
  // AI Canvas props
  aiCanvasTool?: 'brush' | 'eraser';
  onAiCanvasToolChange?: (tool: 'brush' | 'eraser') => void;
  aiCanvasColor?: string;
  onAiCanvasColorChange?: (color: string) => void;
  aiCanvasBrushSize?: number;
  onAiCanvasBrushSizeChange?: (size: number) => void;
  onClearAiCanvas?: () => void;
  aiCanvasRef?: React.RefObject<AICanvasRef>;
  // Product Grid View Mode
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  // Product Images Toggle
  showProductImages?: boolean;
  onShowProductImagesChange?: (show: boolean) => void;
  // Product Sorting
  productSortOrder?: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'default';
  onProductSortOrderChange?: (order: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'default') => void;
  // Customer Segment Filter
  customerSegmentFilter?: 'all' | 'vip' | 'regular' | 'at-risk' | 'dormant';
  onCustomerSegmentFilterChange?: (segment: 'all' | 'vip' | 'regular' | 'at-risk' | 'dormant') => void;
}

export function Header({ 
  onSearch, 
  searchValue = '',
  onRefresh, 
  onSettings, 
  onViewChange, 
  currentView = 'products',
  categories = [],
  selectedCategory,
  onCategoryChange,
  categoriesLoading = false,
  selectedBlueprintField,
  onBlueprintFieldChange,
  blueprintFieldValues = [],
  selectedCustomer,
  onCustomerSelect,
  selectedProduct,
  onProductSelect,
  products = [],
  productsLoading = false,
  isAuditMode = false,
  isRestockMode = false,
  selectedCount = 0,
  filteredCount = 0,
  onRestock,
  onAudit,
  // Orders filter props
  statusFilter = 'any',
  onStatusFilterChange,
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  totalOrders = 0,
  selectedOrdersCount = 0,
  onClearOrderSelection,
  pendingAdjustments = new Map(),
  onCreateAudit,
  onCreateAuditWithDetails,
  onRemoveAdjustment,
  onUpdateAdjustment,
  isApplying = false,
  pendingRestockProducts = new Map(),
  onCreatePurchaseOrder,
  onCreatePurchaseOrderWithDetails,
  onRemoveRestockProduct,
  onUpdateRestockQuantity,
  isCreatingPO = false,
  showOnlySelectedAdjustments = false,
  onShowOnlySelectedAdjustmentsChange,
  sortAlphabetically = true,
  onSortAlphabeticallyChange,
  unifiedSearchRef,
  // AI Canvas
  aiCanvasTool = 'brush',
  onAiCanvasToolChange,
  aiCanvasColor = '#ffffff',
  onAiCanvasColorChange,
  aiCanvasBrushSize = 3,
  onAiCanvasBrushSizeChange,
  onClearAiCanvas,
  aiCanvasRef,
  // View Mode
  viewMode = 'grid',
  onViewModeChange,
  // Product Images
  showProductImages = true,
  onShowProductImagesChange,
  // Product Sorting
  productSortOrder = 'default',
  onProductSortOrderChange,
  // Customer Segment Filter
  customerSegmentFilter = 'all',
  onCustomerSegmentFilterChange
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAiToolsDropdown, setShowAiToolsDropdown] = useState(false);
  const [showViewOptionsDropdown, setShowViewOptionsDropdown] = useState(false);
  const [apiEnvironment, setApiEnvironment] = useState<'production' | 'staging' | 'docker'>('production');
  
  // Click outside handler for menu config dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('menu-config-dropdown');
      const button = (e.target as HTMLElement).closest('button');
      
      if (dropdown && !dropdown.classList.contains('hidden')) {
        const clickedInside = dropdown.contains(e.target as Node);
        const clickedButton = button?.textContent?.includes('Config');
        
        if (!clickedInside && !clickedButton) {
          dropdown.classList.add('hidden');
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Check API environment on mount and update periodically
  useEffect(() => {
    const updateApiEnv = () => {
      if (typeof window !== 'undefined') {
        setApiEnvironment(ApiConfig.getEnvironment());
      }
    };
    
    updateApiEnv();
    const interval = setInterval(updateApiEnv, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, []);
  const { user, logout } = useAuth();
  
  // Debug logging for audit products
  useEffect(() => {
    if (isAuditMode && pendingAdjustments.size > 0) {
      console.log('🎯 Header Debug:', {
        isAuditMode,
        pendingAdjustmentsSize: pendingAdjustments.size,
        productsCount: products.length,
        sampleProducts: products.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
      });
    }
  }, [isAuditMode, pendingAdjustments, products]);
  
  // Debug logging for restock products
  useEffect(() => {
    if (isRestockMode && pendingRestockProducts.size > 0) {
      console.log('🛒 Header PO Debug:', {
        isRestockMode,
        pendingRestockProductsSize: pendingRestockProducts.size,
        productsCount: products.length,
        sampleProducts: products.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
      });
    }
  }, [isRestockMode, pendingRestockProducts, products]);
  
  const handleSearch = (query: string) => {
    onSearch?.(query);
  };

  const handleCategoryChange = (categorySlug: string | null) => {
    onCategoryChange?.(categorySlug);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <div className="header-nav flex-shrink-0 relative z-40">
      {/* Apple 2035 Style Header */}
      <div className="my-3">
        <div className="flex items-center h-full py-3 px-6 relative gap-3">
          {/* Left Controls - Adjustments Controls */}
          {currentView === 'adjustments' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06]">
                <select
                  value={sortAlphabetically ? 'az' : 'default'}
                  onChange={(e) => onSortAlphabeticallyChange?.(e.target.value === 'az')}
                  className="px-4 py-2 text-xs bg-transparent text-neutral-300 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[120px]"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  <option value="default" className="bg-neutral-800">Default</option>
                  <option value="az" className="bg-neutral-800">A-Z Sort</option>
                </select>
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06]">
                <select
                  value={showOnlySelectedAdjustments ? 'selected' : 'all'}
                  onChange={(e) => onShowOnlySelectedAdjustmentsChange?.(e.target.value === 'selected')}
                  className="px-4 py-2 text-xs bg-transparent text-neutral-300 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[120px]"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  <option value="all" className="bg-neutral-800">All Products</option>
                  <option value="selected" className="bg-neutral-800">Selected ({selectedCount})</option>
                </select>
              </div>
            </div>
          )}

          {/* Fixed Search Bar Container - Same position as adjustments view */}
          <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 mx-1 sm:mx-2 md:mx-4 min-w-0" style={{ marginLeft: (currentView === 'adjustments' || currentView === 'menu') ? '0px' : '30px' }}>
          <UnifiedSearchInput
            key={`unified-search-${currentView}`}
            ref={unifiedSearchRef}
            searchValue={searchValue}
            onSearchChange={handleSearch}
            className="w-full max-w-[768px] min-w-[180px] sm:min-w-[200px] md:min-w-[300px]"
            placeholder={currentView === 'orders' ? 'Search orders, customers...' : `Search ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}...`}
            selectedCustomer={selectedCustomer}
            onCustomerSelect={onCustomerSelect}
            selectedProduct={selectedProduct}
            onProductSelect={onProductSelect}
            products={products}
            productsLoading={productsLoading}
            categories={currentView === 'products' ? categories : undefined}
            selectedCategory={currentView === 'products' ? selectedCategory : undefined}
            onCategoryChange={currentView === 'products' ? onCategoryChange : undefined}
            categoriesLoading={currentView === 'products' ? categoriesLoading : false}
            selectedBlueprintField={currentView === 'products' ? selectedBlueprintField : null}
            onBlueprintFieldChange={currentView === 'products' ? onBlueprintFieldChange : undefined}
            blueprintFieldValues={currentView === 'products' ? blueprintFieldValues : undefined}
            // Pass mode-specific props
            productOnlyMode={currentView === 'blueprint-fields'}
            isAuditMode={isAuditMode}
            isRestockMode={isRestockMode}
            pendingAdjustments={pendingAdjustments}
            pendingRestockProducts={pendingRestockProducts}
            onCreateAudit={onCreateAudit}
            onCreateAuditWithDetails={onCreateAuditWithDetails}
            onCreatePurchaseOrder={onCreatePurchaseOrder}
            onCreatePurchaseOrderWithDetails={onCreatePurchaseOrderWithDetails}
            onRemoveAdjustment={onRemoveAdjustment}
            onUpdateAdjustment={onUpdateAdjustment}
            isApplying={isApplying}
            onRemoveRestockProduct={onRemoveRestockProduct}
            onUpdateRestockQuantity={onUpdateRestockQuantity}
            isCreatingPO={isCreatingPO}
          />

          {/* View Options Dropdown - Only show on products view - Next to search bar */}
          {currentView === 'products' && onViewModeChange && onShowProductImagesChange && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowViewOptionsDropdown(!showViewOptionsDropdown)}
                className="px-3 py-2.5 h-[42px] rounded-xl text-xs font-medium transition-all duration-300 backdrop-blur-sm flex items-center gap-1.5 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-black/20"
                title="View Options"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showViewOptionsDropdown && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowViewOptionsDropdown(false)}
                  />
                  
                  {/* Dropdown - TV Menu Style */}
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                    style={{ 
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div className="py-2 px-1">
                      {/* View Mode Section */}
                      <div className="mb-1">
                        <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">View Mode</div>
                        <button
                          onClick={() => {
                            onViewModeChange('grid');
                            setShowViewOptionsDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                            viewMode === 'grid'
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1"/>
                            <rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/>
                            <rect x="14" y="14" width="7" height="7" rx="1"/>
                          </svg>
                          <span className="text-xs font-medium">Grid View</span>
                          {viewMode === 'grid' && (
                            <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            onViewModeChange('list');
                            setShowViewOptionsDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                            viewMode === 'list'
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6"/>
                            <line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/>
                            <rect x="3" y="4" width="2" height="4" rx="1" fill="currentColor"/>
                            <rect x="3" y="10" width="2" height="4" rx="1" fill="currentColor"/>
                            <rect x="3" y="16" width="2" height="4" rx="1" fill="currentColor"/>
                          </svg>
                          <span className="text-xs font-medium">List View</span>
                          {viewMode === 'list' && (
                            <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-neutral-700/50 my-2" />

                      {/* Image Toggle Section */}
                      <div className="mb-1">
                        <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Display</div>
                        <button
                          onClick={() => {
                            onShowProductImagesChange(!showProductImages);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                            showProductImages
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showProductImages ? (
                              <>
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </>
                            ) : (
                              <>
                                <line x1="3" y1="3" x2="21" y2="21" />
                                <path d="M21 15V5a2 2 0 0 0-2-2H9" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M3 21v-6a2 2 0 0 1 2-2h4" />
                              </>
                            )}
                          </svg>
                          <span className="text-xs font-medium">{showProductImages ? 'Hide Images' : 'Show Images'}</span>
                          {showProductImages && (
                            <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Divider */}
                      {onProductSortOrderChange && <div className="border-t border-neutral-700/50 my-2" />}

                      {/* Sort Order Section */}
                      {onProductSortOrderChange && (
                        <div>
                          <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Sort By</div>
                          {[
                            { value: 'default', label: 'Default Order' },
                            { value: 'name-asc', label: 'Name (A-Z)' },
                            { value: 'name-desc', label: 'Name (Z-A)' },
                            { value: 'price-asc', label: 'Price (Low to High)' },
                            { value: 'price-desc', label: 'Price (High to Low)' },
                            { value: 'stock-asc', label: 'Stock (Low to High)' },
                            { value: 'stock-desc', label: 'Stock (High to Low)' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onProductSortOrderChange(option.value as any);
                                setShowViewOptionsDropdown(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                                productSortOrder === option.value
                                  ? 'bg-white/10 text-white shadow-sm'
                                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                              }`}
                            >
                              <span className="text-xs font-medium">{option.label}</span>
                              {productSortOrder === option.value && (
                                <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          </div>

          {/* Right group - All Navigation Buttons and Filters */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            {/* Artifacts Library Dropdown - Hide on products, adjustments, and customers view */}
            {currentView !== 'products' && currentView !== 'adjustments' && currentView !== 'customers' && (
              <ArtifactsDropdown 
                canvasRef={aiCanvasRef}
                onViewChange={onViewChange}
              />
            )}

            {/* Customers View Filter - Segment Dropdown */}
            {currentView === 'customers' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <select
                  value={customerSegmentFilter}
                  onChange={(e) => onCustomerSegmentFilterChange?.(e.target.value as typeof customerSegmentFilter)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white text-xs focus:bg-white/10 focus:border-white/20 focus:outline-none transition-all duration-200 backdrop-blur-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[140px]"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  <option value="all">All Customers</option>
                  <option value="vip">VIP</option>
                  <option value="regular">Regular</option>
                  <option value="at-risk">At-Risk</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
            )}

            {/* Orders View Filters */}
            {currentView === 'orders' && (
              <>
                {/* Status Filter with Icon */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
                  </svg>
                  <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange?.(e.target.value)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white text-xs focus:bg-white/10 focus:border-white/20 focus:outline-none transition-all duration-200 backdrop-blur-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[120px]"
                    style={{ fontFamily: 'Tiempo, serif' }}
                  >
                    <option value="any">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date Range Filters with Icon - Responsive */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-neutral-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange?.(e.target.value)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white text-xs focus:bg-white/10 focus:border-white/20 focus:outline-none transition-all duration-200 backdrop-blur-sm w-32 sm:w-36"
                    style={{ fontFamily: 'Tiempo, serif' }}
                    title="From Date"
                  />
                  <span className="text-neutral-400 text-xs sm:text-sm" style={{ fontFamily: 'Tiempo, serif' }}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange?.(e.target.value)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white text-xs focus:bg-white/10 focus:border-white/20 focus:outline-none transition-all duration-200 backdrop-blur-sm w-32 sm:w-36"
                    style={{ fontFamily: 'Tiempo, serif' }}
                    title="To Date"
                  />
                </div>

                {/* Show Selected Only Filter Toggle */}
                <button
                  onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 text-xs flex items-center gap-2 whitespace-nowrap border flex-shrink-0 ${
                    showSelectedOnly 
                      ? 'bg-white/10 text-white border-white/20 shadow-lg shadow-black/20' 
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-neutral-200'
                  }`}
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title={showSelectedOnly ? 'Show all orders' : 'Show only selected orders'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
                  </svg>
                  {showSelectedOnly ? 'Selected' : 'All'}
                </button>

                {/* Clear Selection Button */}
                {selectedOrdersCount > 0 && onClearOrderSelection && (
                  <button
                    onClick={onClearOrderSelection}
                    className="px-4 py-2 bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400/40 rounded-xl transition-all duration-300 text-xs flex items-center gap-2 whitespace-nowrap flex-shrink-0 hover:shadow-lg hover:shadow-red-500/20"
                    style={{ fontFamily: 'Tiempo, serif' }}
                    title="Clear Selection"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </>
            )}

            {/* Adjustments view - Mode Selector Dropdown */}
            {currentView === 'adjustments' && (
              <div className="flex items-center gap-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06]">
                <select
                  value={isRestockMode ? 'restock' : isAuditMode ? 'audit' : 'normal'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'restock') {
                      if (!isRestockMode) onRestock?.();
                    } else if (value === 'audit') {
                      if (!isAuditMode) onAudit?.();
                    } else {
                      // Exit both modes
                      if (isRestockMode) onRestock?.();
                      if (isAuditMode) onAudit?.();
                    }
                  }}
                  className="px-4 py-2 text-xs bg-transparent text-neutral-300 focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[140px]"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  <option value="normal" className="bg-neutral-800">Select Mode</option>
                  <option value="restock" className="bg-neutral-800">Restock Mode</option>
                  <option value="audit" className="bg-neutral-800">Audit Mode</option>
                </select>
              </div>
            )}

            {/* AI Canvas Tools */}
            {currentView === 'ai-view' && (
              <>
                {/* Combined Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAiToolsDropdown(!showAiToolsDropdown)}
                    className="px-4 py-2 rounded-xl transition-all duration-300 text-xs flex items-center gap-2 whitespace-nowrap border bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white hover:shadow-lg hover:shadow-black/20"
                    style={{ fontFamily: 'Tiempo, serif' }}
                    title="Drawing Tools"
                  >
                    <span>Tools</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown - TV Menu Style */}
                  {showAiToolsDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowAiToolsDropdown(false)}
                      />
                      <div 
                        className="absolute top-full right-0 mt-2 w-64 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                        style={{ 
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="py-2 px-1">
                          {/* Tool Selection */}
                          <div className="mb-1">
                            <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Tool</div>
                            <button
                              onClick={() => onAiCanvasToolChange?.('brush')}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                                aiCanvasTool === 'brush'
                                  ? 'bg-white/10 text-white shadow-sm'
                                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span className="text-xs font-medium">Brush</span>
                              {aiCanvasTool === 'brush' && (
                                <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => onAiCanvasToolChange?.('eraser')}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                                aiCanvasTool === 'eraser'
                                  ? 'bg-white/10 text-white shadow-sm'
                                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="text-xs font-medium">Eraser</span>
                              {aiCanvasTool === 'eraser' && (
                                <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* Colors - Only show for brush */}
                          {aiCanvasTool === 'brush' && (
                            <>
                              <div className="border-t border-neutral-700/50 my-2" />
                              <div className="mb-1">
                                <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Color</div>
                                <div className="flex gap-2 flex-wrap px-3">
                                  {['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f', '#c77dff'].map((c) => (
                                    <button
                                      key={c}
                                      onClick={() => onAiCanvasColorChange?.(c)}
                                      className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${
                                        aiCanvasColor === c ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:ring-1 hover:ring-white/30'
                                      }`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Size */}
                          <div>
                            {aiCanvasTool === 'brush' && (
                              <div className="border-t border-neutral-700/50 my-2" />
                            )}
                            <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Size</div>
                            <div className="px-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/70">Brush Size</span>
                                <span className="text-xs text-white font-mono bg-white/10 px-2 py-0.5 rounded">{aiCanvasBrushSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                value={aiCanvasBrushSize}
                                onChange={(e) => onAiCanvasBrushSizeChange?.(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${(aiCanvasBrushSize - 1) / 19 * 100}%, rgba(255,255,255,0.1) ${(aiCanvasBrushSize - 1) / 19 * 100}%, rgba(255,255,255,0.1) 100%)`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Clear Canvas Button */}
                <button
                  onClick={onClearAiCanvas}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-medium border border-red-500/30 hover:border-red-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title="Clear Canvas"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
