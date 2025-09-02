'use client';

import React, { useState, useEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { IconButton } from '../ui/IconButton';
import { Divider } from '../ui/Divider';
import { CategoryFilter, Category } from '../ui/CategoryFilter';
import { HeaderCustomerSelector } from '../ui/HeaderCustomerSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { WordPressUser } from '../../services/users-service';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onViewChange?: (view: 'products' | 'customers' | 'orders') => void;
  currentView?: 'products' | 'customers' | 'orders';
  // Category filter props
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categorySlug: string | null) => void;
  categoriesLoading?: boolean;
  // Customer selector props
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  // Audit mode props
  isAuditMode?: boolean;
  onAuditModeToggle?: () => void;
  // Select all props for adjust mode
  onSelectAll?: () => void;
  selectedCount?: number;
  filteredCount?: number;
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
  isAuditMode = false,
  onAuditModeToggle,
  onSelectAll,
  selectedCount = 0,
  filteredCount = 0
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
    <div className="header-nav bg-transparent flex-shrink-0 relative z-30">
      <div className="flex items-center justify-between h-full py-2 px-4">
        {/* Left section - Adjustments */}
        <div className="flex items-center gap-4">
          <IconButton
            onClick={onAuditModeToggle}
            variant={isAuditMode ? 'active' : 'default'}
            title={isAuditMode ? "Exit Audit Mode" : "Enter Audit Mode"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </IconButton>
          
          {/* Select All Button - Only show in adjust mode */}
          {isAuditMode && currentView === 'products' && (
            <button
              onClick={onSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-neutral-800/20"
              title={`Select all ${filteredCount} filtered products`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Select All {filteredCount > 0 && `(${selectedCount}/${filteredCount})`}
              </span>
            </button>
          )}
        </div>
        
        {/* Center section - Search and Filters */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
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
          
          {/* Show category filter only in products view */}
          {currentView === 'products' && (
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              loading={categoriesLoading}
            />
          )}
        </div>
        
        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          {/* Products */}
          <IconButton
            onClick={() => onViewChange?.('products')}
            variant={currentView === 'products' ? 'active' : 'default'}
            title="Products"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </IconButton>

          <Divider />

          {/* Customers */}
          <IconButton
            onClick={() => onViewChange?.('customers')}
            variant={currentView === 'customers' ? 'active' : 'default'}
            title="Customers"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </IconButton>

          <Divider />

          {/* Orders */}
          <IconButton
            onClick={() => onViewChange?.('orders')}
            variant={currentView === 'orders' ? 'active' : 'default'}
            title="Orders"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </IconButton>

          <Divider />

          {/* Refresh */}
          <IconButton
            onClick={handleRefresh}
            variant="default"
            disabled={isRefreshing}
            title={isRefreshing ? "Refreshing..." : "Refresh"}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>

          <Divider />

          {/* Settings */}
          <IconButton
            onClick={onSettings}
            variant="default"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </IconButton>


        </div>
      </div>
    </div>
  );
}
