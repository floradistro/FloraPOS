import React from 'react';
import { IconButton } from './IconButton';

interface OrdersGridHeaderProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalOrders: number;
  selectedOrdersCount: number;
  onClearSelection?: () => void;
  
  // Employee filter
  selectedEmployee?: string;
  onEmployeeChange?: (employee: string) => void;
  employeeOptions?: Array<{ value: string; label: string }>;
  
  // Date range filter
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  
  // Show selected filter
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
}

export function OrdersGridHeader({
  statusFilter,
  onStatusFilterChange,
  totalOrders,
  selectedOrdersCount,
  onClearSelection,
  selectedEmployee = '',
  onEmployeeChange,
  employeeOptions = [],
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
}: OrdersGridHeaderProps) {
  return (
    <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
      <div className="flex items-center justify-between w-full relative">
        {/* Left section - Orders Icon and Title */}
        <div className="flex items-center gap-2">
          <IconButton
            variant="active"
            title="Orders"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </IconButton>
          
          <span className="px-2 py-1 bg-white/[0.05] text-neutral-400 text-xs rounded">
            {totalOrders} total
          </span>
          {selectedOrdersCount > 0 && (
            <span className="px-2 py-1 bg-white/[0.08] text-neutral-300 text-xs rounded">
              {selectedOrdersCount} selected
            </span>
          )}
        </div>

        {/* Center section - Filters */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2 py-1.5 bg-neutral-800/60 border border-white/[0.1] rounded text-neutral-300 text-xs focus:border-white/[0.3] focus:outline-none"
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

          {/* Employee Filter */}
          {employeeOptions.length > 0 && (
            <select
              value={selectedEmployee}
              onChange={(e) => onEmployeeChange?.(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800/60 border border-white/[0.1] rounded text-neutral-300 text-xs focus:border-white/[0.3] focus:outline-none"
            >
              <option value="">All Employees</option>
              {employeeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800/60 border border-white/[0.1] rounded text-neutral-300 text-xs focus:border-white/[0.3] focus:outline-none"
              placeholder="From"
            />
            <span className="text-neutral-500 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800/60 border border-white/[0.1] rounded text-neutral-300 text-xs focus:border-white/[0.3] focus:outline-none"
              placeholder="To"
            />
          </div>

          {/* Show Selected Only Filter Toggle */}
          <button
            onClick={() => onShowSelectedOnlyChange?.(!showSelectedOnly)}
            className={`px-2 py-1.5 rounded-lg transition text-xs ${
              showSelectedOnly 
                ? 'bg-white/[0.05] text-blue-400 hover:bg-white/[0.08]' 
                : 'bg-white/[0.05] text-neutral-300 hover:bg-white/[0.08]'
            }`}
            title={showSelectedOnly ? 'Show all orders' : 'Show only selected orders'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </button>
        </div>

        {/* Right section - Clear Selection Button */}
        <div className="flex items-center gap-2">
          {selectedOrdersCount > 0 && onClearSelection && (
            <IconButton
              onClick={onClearSelection}
              variant="ghost"
              size="sm"
              title="Clear Selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
