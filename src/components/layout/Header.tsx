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
  // Blueprint field search props
  selectedBlueprintField?: string | null;
  onBlueprintFieldChange?: (fieldName: string | null, fieldValue: string | null) => void;
  blueprintFieldValue?: string | null;
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
  // History filter props
  historyDateFilter?: string;
  onHistoryDateFilterChange?: (days: string) => void;
  historyActionFilter?: string;
  onHistoryActionFilterChange?: (action: string) => void;
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
  blueprintFieldValue,
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
  historyDateFilter = '7',
  onHistoryDateFilterChange,
  historyActionFilter = 'all',
  onHistoryActionFilterChange,
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
  aiCanvasRef
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAiToolsDropdown, setShowAiToolsDropdown] = useState(false);
  const [apiEnvironment, setApiEnvironment] = useState<'production' | 'docker'>('production');
  
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
    <div className="header-nav bg-transparent flex-shrink-0 relative z-40">
      <div className="flex items-center h-full py-4 px-2 sm:px-4 relative gap-2">
        {/* Back Button for History View */}
        {currentView === 'history' && (
          <button
            onClick={() => onViewChange?.('adjustments')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-transparent hover:bg-neutral-800/50 text-neutral-300 hover:text-neutral-100 rounded-lg transition-all duration-200 border border-neutral-500/30 hover:border-neutral-400/50"
            style={{ fontFamily: 'Tiempo, serif' }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Audit
          </button>
        )}

        {/* Left Controls - Adjustments Controls */}
        {currentView === 'adjustments' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* A-Z Sort Toggle */}
            <button
              onClick={() => onSortAlphabeticallyChange?.(!sortAlphabetically)}
              className={`px-3 h-[30px] rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-2 whitespace-nowrap border flex-shrink-0 ${
                sortAlphabetically 
                  ? 'bg-neutral-800/90 text-white border-neutral-500' 
                  : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
              }`}
              title={sortAlphabetically ? 'Disable alphabetical sorting' : 'Enable alphabetical sorting'}
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              A-Z
            </button>

            {/* Show Selected Toggle */}
            <button
              onClick={() => onShowOnlySelectedAdjustmentsChange?.(!showOnlySelectedAdjustments)}
              className={`px-3 h-[30px] rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-2 whitespace-nowrap border flex-shrink-0 ${
                showOnlySelectedAdjustments 
                  ? 'bg-neutral-800/90 text-white border-neutral-500' 
                  : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
              }`}
              title={showOnlySelectedAdjustments ? 'Show all products' : 'Show only selected products'}
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              {showOnlySelectedAdjustments ? `Selected (${selectedCount})` : 'Selected'}
            </button>
          </div>
        )}

        {/* Fixed Search Bar Container - Same position as adjustments view */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 mx-1 sm:mx-2 md:mx-4 min-w-0" style={{ marginLeft: (currentView === 'adjustments' || currentView === 'history' || currentView === 'menu') ? '0px' : '30px' }}>
          <UnifiedSearchInput
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
            categories={currentView === 'orders' ? [] : categories}
            selectedCategory={currentView === 'orders' ? '' : selectedCategory}
            onCategoryChange={currentView === 'orders' ? () => {} : onCategoryChange}
            categoriesLoading={categoriesLoading}
            selectedBlueprintField={currentView === 'products' ? selectedBlueprintField : null}
            onBlueprintFieldChange={currentView === 'products' ? onBlueprintFieldChange : undefined}
            blueprintFieldValue={currentView === 'products' ? blueprintFieldValue : null}
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
        </div>

        
        {/* Right group - All Navigation Buttons and Filters */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          {/* Artifacts Library Dropdown - Show on all views */}
          <ArtifactsDropdown 
            canvasRef={aiCanvasRef}
            onViewChange={onViewChange}
          />

          {/* Orders View Filters */}
          {currentView === 'orders' && (
            <>

              {/* Status Filter with Icon */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange?.(e.target.value)}
                  className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out min-w-[120px]"
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
                  className="px-2 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out w-28 sm:w-36"
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title="From Date"
                />
                <span className="text-neutral-500 text-xs sm:text-sm" style={{ fontFamily: 'Tiempo, serif' }}>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange?.(e.target.value)}
                  className="px-2 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out w-28 sm:w-36"
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title="To Date"
                />
              </div>

              {/* Show Selected Only Filter Toggle */}
              <button
                onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
                className={`px-3 h-[30px] rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-1 whitespace-nowrap border flex-shrink-0 ${
                  showSelectedOnly 
                    ? 'bg-neutral-800/90 text-white border-neutral-500' 
                    : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                }`}
                style={{ fontFamily: 'Tiempo, serif' }}
                title={showSelectedOnly ? 'Show all orders' : 'Show only selected orders'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
                </svg>
                {showSelectedOnly ? 'Selected' : 'All'}
              </button>

              {/* Clear Selection Button */}
              {selectedOrdersCount > 0 && onClearOrderSelection && (
                <button
                  onClick={onClearOrderSelection}
                  className="px-3 h-[30px] bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title="Clear Selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </>
          )}

          {/* Adjustments view navigation buttons */}
          {(currentView === 'adjustments' || currentView === 'history') && (
            <>
              {/* History Button - Icon Only */}
              <button
                onClick={() => onViewChange?.('history')}
                className={`flex items-center justify-center w-[30px] h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border ${
                  currentView === 'history'
                    ? 'bg-neutral-800/90 text-white border-neutral-500' 
                    : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-neutral-300'
                }`}
                title="View Adjustment History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* History Filters - Only show in history view */}
              {currentView === 'history' && (
                <>
                  {/* Date Filter */}
                  <select
                    value={historyDateFilter}
                    onChange={(e) => onHistoryDateFilterChange?.(e.target.value)}
                    className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out"
                    style={{ fontFamily: 'Tiempo, serif' }}
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>

                  {/* Action Filter */}
                  <select
                    value={historyActionFilter}
                    onChange={(e) => onHistoryActionFilterChange?.(e.target.value)}
                    className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-200 ease-out"
                    style={{ fontFamily: 'Tiempo, serif' }}
                  >
                    <option value="all">All Actions</option>
                    <option value="inventory_update">Inventory Updates</option>
                    <option value="stock_transfer">Stock Transfers</option>
                    <option value="stock_conversion">Stock Conversions</option>
                    <option value="manual_adjustment">Manual Adjustments</option>
                    <option value="order_deduction">Order Deductions</option>
                    <option value="restock">Restocks</option>
                  </select>
                </>
              )}
              
              {/* Restock Button - Show in adjustments view */}
              {currentView === 'adjustments' && (
                <button
                  onClick={onRestock}
                  className={`flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap ${
                    isRestockMode
                      ? 'bg-neutral-800/90 text-white border-neutral-500' 
                      : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-neutral-300'
                  }`}
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title={isRestockMode ? "Exit Restock Mode" : "Enter Restock Mode - Show entire catalog"}
                >
                  <span>Restock</span>
                </button>
              )}
              
              {/* Audit Button - Show in adjustments view */}
              {currentView === 'adjustments' && (
                <button
                  onClick={onAudit}
                  className={`flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-200 ease-out rounded-lg border whitespace-nowrap ${
                    isAuditMode
                      ? 'bg-neutral-800/90 text-white border-neutral-500' 
                      : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-neutral-300'
                  }`}
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title={isAuditMode ? "Exit Audit Mode" : "Enter Audit Mode - Show only products in stock"}
                >
                  <span>Audit</span>
                </button>
              )}
            </>
          )}

          {/* AI Canvas Tools */}
          {currentView === 'ai-view' && (
            <>
              {/* Combined Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAiToolsDropdown(!showAiToolsDropdown)}
                  className="px-3 h-[30px] rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-2 whitespace-nowrap border bg-transparent text-neutral-400 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50"
                  style={{ fontFamily: 'Tiempo, serif' }}
                  title="Drawing Tools"
                >
                  <span>Tools</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showAiToolsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAiToolsDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-2xl z-50 p-4">
                      {/* Tool Selection */}
                      <div className="mb-4">
                        <label className="text-xs text-neutral-400 font-medium block mb-2" style={{ fontFamily: 'Tiempo, serif' }}>Tool</label>
                        <div className="flex gap-1.5 p-1 bg-neutral-800/40 rounded-lg">
                          <button
                            onClick={() => onAiCanvasToolChange?.('brush')}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                              aiCanvasTool === 'brush'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/5'
                            }`}
                            style={{ fontFamily: 'Tiempo, serif' }}
                          >
                            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Brush
                          </button>
                          <button
                            onClick={() => onAiCanvasToolChange?.('eraser')}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                              aiCanvasTool === 'eraser'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/5'
                            }`}
                            style={{ fontFamily: 'Tiempo, serif' }}
                          >
                            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eraser
                          </button>
                        </div>
                      </div>

                      {/* Colors - Only show for brush */}
                      {aiCanvasTool === 'brush' && (
                        <>
                          <div className="h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent mb-3"></div>
                          <div className="mb-4">
                            <label className="text-xs text-neutral-400 font-medium block mb-2" style={{ fontFamily: 'Tiempo, serif' }}>Color</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f', '#c77dff'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => onAiCanvasColorChange?.(c)}
                                  className={`w-8 h-8 rounded-md transition-all duration-200 hover:scale-110 ${
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
                      <div className={aiCanvasTool === 'brush' ? '' : ''}>
                        {aiCanvasTool === 'brush' && (
                          <div className="h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent mb-3"></div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-neutral-400 font-medium" style={{ fontFamily: 'Tiempo, serif' }}>Size</label>
                          <span className="text-xs text-neutral-500 font-mono">{aiCanvasBrushSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={aiCanvasBrushSize}
                          onChange={(e) => onAiCanvasBrushSizeChange?.(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800/60 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, white 0%, white ${(aiCanvasBrushSize - 1) / 19 * 100}%, rgba(38, 38, 38, 0.6) ${(aiCanvasBrushSize - 1) / 19 * 100}%, rgba(38, 38, 38, 0.6) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Clear Canvas Button */}
              <button
                onClick={onClearAiCanvas}
                className="px-3 h-[30px] bg-transparent hover:bg-neutral-800/40 text-neutral-400 hover:text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700/40 hover:border-neutral-600/60 transition-all duration-200"
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
  );
}
