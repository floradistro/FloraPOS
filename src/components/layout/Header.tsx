'use client';

import React, { useState, useEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { UnifiedSearchInput, UnifiedSearchInputRef, Category, Product } from '../ui/UnifiedSearchInput';
import { IconButton } from '../ui/IconButton';
import { Divider } from '../ui/Divider';
import { HeaderCustomerSelector } from '../ui/HeaderCustomerSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { WordPressUser } from '../../services/users-service';
import { ViewType } from '../../types';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onViewChange?: (view: ViewType) => void;
  currentView?: ViewType;
  // Category filter props
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categorySlug: string | null) => void;
  categoriesLoading?: boolean;
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
  // Search ref
  unifiedSearchRef?: React.RefObject<UnifiedSearchInputRef>;
}

export function Header({ 
  onSearch, 
  onRefresh, 
  onSettings, 
  onViewChange, 
  currentView = 'products',
  categories = [],
  selectedCategory,
  onCategoryChange,
  categoriesLoading = false,
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
  unifiedSearchRef
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  
  // Debounce search query to reduce API calls - 300ms delay for products
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch?.(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Actual search is now triggered by the debounced effect above
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
        {/* Search Bar - Centered on viewport accounting for 60px sidebar */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 mx-1 sm:mx-2 md:mx-4 min-w-0" style={{ marginLeft: '30px' }}>
          {/* Orders View - Unified search with customer selection */}
          {currentView === 'orders' ? (
            <>
              {/* Unified Customer Search */}
              <UnifiedSearchInput
                searchValue={searchQuery}
                onSearchChange={handleSearch}
                className="w-full max-w-[300px] min-w-[180px]"
                placeholder="Search orders, customers..."
                selectedCustomer={selectedCustomer}
                onCustomerSelect={onCustomerSelect}
                categories={[]}
                selectedCategory=""
                onCategoryChange={() => {}}
              />

              {/* Status Filter with Icon */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange?.(e.target.value)}
                  className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out min-w-[120px]"
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
              <div className="flex items-center gap-1 flex-wrap">
                <svg className="w-4 h-4 text-neutral-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange?.(e.target.value)}
                  className="px-2 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out w-28 sm:w-36"
                  title="From Date"
                />
                <span className="text-neutral-500 text-xs sm:text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange?.(e.target.value)}
                  className="px-2 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out w-28 sm:w-36"
                  title="To Date"
                />
              </div>

              {/* Show Selected Only Filter Toggle */}
              <button
                onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
                className={`px-3 h-[30px] rounded-lg transition-all duration-300 ease-out text-sm flex items-center gap-1 whitespace-nowrap border ${
                  showSelectedOnly 
                    ? 'bg-neutral-800/90 text-white border-neutral-500' 
                    : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50'
                }`}
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
                className="px-3 h-[30px] bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 rounded-lg transition-all duration-300 ease-out text-sm flex items-center gap-1 whitespace-nowrap"
                  title="Clear Selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </>
          ) : (
            /* Other Views - Unified Search Bar */
            <UnifiedSearchInput
              ref={unifiedSearchRef}
              searchValue={searchQuery}
              onSearchChange={handleSearch}
              className="w-full max-w-[768px] min-w-[180px] sm:min-w-[200px] md:min-w-[300px]"
              placeholder={`Search ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}...`}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={onCustomerSelect}
              selectedProduct={selectedProduct}
              onProductSelect={onProductSelect}
              products={products}
              productsLoading={productsLoading}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              categoriesLoading={categoriesLoading}
              productOnlyMode={currentView === 'blueprint-fields'}
              isAuditMode={isAuditMode}
              pendingAdjustments={pendingAdjustments}
              onCreateAudit={onCreateAudit}
              onCreateAuditWithDetails={onCreateAuditWithDetails}
              onRemoveAdjustment={onRemoveAdjustment}
              onUpdateAdjustment={onUpdateAdjustment}
              isApplying={isApplying}
            />
          )}
        </div>
        
        {/* Right group - All Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

          {/* Adjustments view navigation buttons */}
          {(currentView === 'adjustments' || currentView === 'history') && (
            <>
              {/* History Button */}
              <button
                onClick={() => onViewChange?.('history')}
                className={`flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-300 ease-out rounded-lg border whitespace-nowrap ${
                  currentView === 'history'
                    ? 'bg-neutral-800/90 text-white border-neutral-500' 
                    : 'bg-transparent text-neutral-500 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50 hover:text-neutral-300'
                }`}
                style={{ fontFamily: 'Tiempo, serif' }}
                title="View Adjustment History"
              >
                <span>History</span>
              </button>

              {/* History Filters - Only show in history view */}
              {currentView === 'history' && (
                <>
                  {/* Date Filter */}
                  <select
                    value={historyDateFilter}
                    onChange={(e) => onHistoryDateFilterChange?.(e.target.value)}
                    className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out"
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
                    className="px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 text-sm focus:bg-neutral-600/10 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out"
                  >
                    <option value="all">All Actions</option>
                    <option value="inventory_update">Inventory Updates</option>
                    <option value="stock_transfer">Stock Transfers</option>
                    <option value="stock_conversion">Stock Conversions</option>
                    <option value="manual_adjustment">Manual Adjustments</option>
                    <option value="order_deduction">Order Deductions</option>
                  </select>
                </>
              )}
              
              {/* Restock Button - Show in adjustments view */}
              {currentView === 'adjustments' && (
                <button
                  onClick={onRestock}
                  className={`flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-300 ease-out rounded-lg border whitespace-nowrap ${
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
                  className={`flex items-center gap-2 px-3 h-[30px] text-sm transition-all duration-300 ease-out rounded-lg border whitespace-nowrap ${
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

        </div>
      </div>
    </div>
  );
}
