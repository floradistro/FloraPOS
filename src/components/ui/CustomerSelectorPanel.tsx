'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WordPressUser } from '../../services/users-service';
import { usersService } from '../../services/users-service';
import { NewCustomerForm } from './NewCustomerForm';

interface CustomerSelectorPanelProps {
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
}

export function CustomerSelectorPanel({ selectedCustomer, onCustomerSelect }: CustomerSelectorPanelProps) {
  const [customers, setCustomers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await usersService.getUsers(true);
      setCustomers(usersData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: WordPressUser | null) => {
    onCustomerSelect?.(customer);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    loadCustomers();
  };

  const handleNewCustomerClick = () => {
    setShowNewCustomerForm(true);
  };

  const handleCustomerCreated = (newCustomer: WordPressUser) => {
    setCustomers(prev => [...prev, newCustomer]);
    onCustomerSelect?.(newCustomer);
    setShowNewCustomerForm(false);
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    return (
      customer.display_name?.toLowerCase().includes(query) ||
      customer.username.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full bg-neutral-800/30 border border-neutral-700/50 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700/50 bg-neutral-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-300">Customer Selection</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewCustomerClick}
              className="text-neutral-400 hover:text-neutral-300 transition-colors p-1 hover:bg-white/[0.05] rounded"
              title="Add New Customer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 hover:bg-white/[0.05] rounded disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input - Same width as header search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full max-w-[768px] min-w-[180px] sm:min-w-[200px] md:min-w-[300px] px-3 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-neutral-300 text-sm placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
          <svg className="absolute right-3 top-2.5 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="px-4 py-3 border-b border-neutral-700/30 bg-neutral-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-neutral-200 font-medium">
                  {selectedCustomer.display_name || selectedCustomer.username}
                </div>
                <div className="text-xs text-neutral-400">{selectedCustomer.email}</div>
              </div>
            </div>
            <button
              onClick={() => handleCustomerSelect(null)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-1 hover:bg-red-400/10 rounded"
              title="Clear Selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-400"></div>
            <span className="ml-2 text-sm text-neutral-400">Loading customers...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="text-red-400 text-sm">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p>{error}</p>
              <button
                onClick={loadCustomers}
                className="mt-2 text-xs text-neutral-500 hover:text-neutral-300 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="text-neutral-500 text-sm">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>{searchQuery ? 'No customers found' : 'No customers available'}</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`w-full px-4 py-3 text-left hover:bg-white/[0.03] transition-all duration-150 flex items-center gap-3 group ${
                  selectedCustomer?.id === customer.id ? 'bg-blue-600/10 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="w-8 h-8 bg-neutral-700/50 rounded-full flex items-center justify-center group-hover:bg-neutral-600/20 transition-colors">
                  <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-200 font-medium truncate">
                    {customer.display_name || customer.username}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">{customer.email}</div>
                </div>
                {selectedCustomer?.id === customer.id && (
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-neutral-700/50 bg-neutral-800/30">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</span>
          {selectedCustomer && (
            <span className="text-blue-400">Selected</span>
          )}
        </div>
      </div>

      {/* New Customer Form Modal */}
      <NewCustomerForm
        isOpen={showNewCustomerForm}
        onClose={() => setShowNewCustomerForm(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}
