'use client';

import React, { useState, useEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { IconButton } from '../ui/IconButton';
import { Divider } from '../ui/Divider';
import { CategoryFilter, Category } from '../ui/CategoryFilter';
import { HeaderCustomerSelector } from '../ui/HeaderCustomerSelector';
import { HeaderProductSelector, Product } from '../ui/HeaderProductSelector';
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
  onHistoryActionFilterChange
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, logout } = useAuth();
  
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
      <div className="flex items-center justify-center h-full py-4 px-4 gap-3">
        {/* Main content container - all in one row */}
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
          
          {/* Left group - Adjustments controls - Only show in adjustments or history view */}
          {(currentView === 'adjustments' || currentView === 'history') && (
            <div className="flex items-center gap-2">
              {/* History Button */}
              <button
                onClick={() => onViewChange?.('history')}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-lg border whitespace-nowrap ${
                  currentView === 'history'
                    ? 'bg-white/[0.12] text-white border-white/[0.2]' 
                    : 'text-neutral-400 hover:text-white border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20'
                }`}
                title="View Adjustment History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>History</span>
              </button>

              {/* History Filters - Only show in history view */}
              {currentView === 'history' && (
                <>
                  {/* Date Filter */}
                  <select
                    value={historyDateFilter}
                    onChange={(e) => onHistoryDateFilterChange?.(e.target.value)}
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-300 text-sm focus:border-neutral-500 focus:outline-none"
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
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-300 text-sm focus:border-neutral-500 focus:outline-none"
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
              <button
                onClick={onRestock}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-lg border whitespace-nowrap ${
                  isRestockMode
                    ? 'bg-white/[0.12] text-white border-white/[0.2]' 
                    : 'text-neutral-400 hover:text-white border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20'
                }`}
                title={isRestockMode ? "Exit Restock Mode" : "Enter Restock Mode - Show entire catalog"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Restock</span>
              </button>
              
              {/* Audit Button - Show in adjustments view */}
              <button
                onClick={onAudit}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-lg border whitespace-nowrap ${
                  isAuditMode
                    ? 'bg-white/[0.12] text-white border-white/[0.2]' 
                    : 'text-neutral-400 hover:text-white border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20'
                }`}
                title={isAuditMode ? "Exit Audit Mode" : "Enter Audit Mode - Show only products in stock"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Audit</span>
              </button>
            </div>
          )}
          
          {/* Center group - Search and Filters */}
          <div className="flex-1 flex items-center justify-center gap-2">
          {/* Orders View - Filter Controls */}
          {currentView === 'orders' ? (
            <>

              {/* Customer Filter */}
              <HeaderCustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerSelect={onCustomerSelect}
              />

              {/* Status Filter with Icon */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange?.(e.target.value)}
                  className="px-3 h-[30px] bg-neutral-800/80 border border-white/[0.12] rounded text-neutral-300 text-sm focus:border-white/[0.3] focus:outline-none hover:bg-neutral-700/80 transition-colors min-w-[120px]"
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

              {/* Date Range Filters with Icon - Compact */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange?.(e.target.value)}
                  className="px-2 h-[30px] bg-neutral-800/80 border border-white/[0.12] rounded text-neutral-300 text-sm focus:border-white/[0.3] focus:outline-none hover:bg-neutral-700/80 transition-colors w-36"
                  title="From Date"
                />
                <span className="text-neutral-500 text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange?.(e.target.value)}
                  className="px-2 h-[30px] bg-neutral-800/80 border border-white/[0.12] rounded text-neutral-300 text-sm focus:border-white/[0.3] focus:outline-none hover:bg-neutral-700/80 transition-colors w-36"
                  title="To Date"
                />
              </div>

              {/* Show Selected Only Filter Toggle */}
              <button
                onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
                className={`px-3 h-[30px] rounded transition text-sm flex items-center gap-1 whitespace-nowrap border ${
                  showSelectedOnly 
                    ? 'bg-white/[0.12] text-white border-white/[0.2]' 
                    : 'bg-neutral-800/80 text-neutral-300 border-white/[0.12] hover:bg-neutral-700/80'
                }`}
                title={showSelectedOnly ? 'Show all orders' : 'Show only selected orders'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {showSelectedOnly ? 'Selected' : 'All'}
              </button>

              {/* Clear Selection Button */}
              {selectedOrdersCount > 0 && onClearOrderSelection && (
                <button
                  onClick={onClearOrderSelection}
                  className="px-3 h-[30px] bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 rounded transition text-sm flex items-center gap-1 whitespace-nowrap"
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
            /* Other Views - Search and Filters */
            <>
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                className="w-96"
                placeholder={currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              />
              
              {/* Customer Selector - Hidden in adjust mode */}
              {!isAuditMode && (
                <HeaderCustomerSelector
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={onCustomerSelect}
                />
              )}
              
              {/* Product Selector - Show only in blueprint-fields view */}
              {currentView === 'blueprint-fields' && (
                <HeaderProductSelector
                  selectedProduct={selectedProduct}
                  onProductSelect={onProductSelect}
                  products={products}
                  loading={productsLoading}
                />
              )}
              
              {/* Show category filter only in products view */}
              {currentView === 'products' && (
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  loading={categoriesLoading}
                />
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
