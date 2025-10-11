'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { useDebounce } from '../../hooks/useDebounce';
import { useUserPointsBalance } from '../../hooks/useRewards';
import { NewCustomerForm } from './NewCustomerForm';

interface CustomerSelectorProps {
  selectedCustomerId?: number | null;
  onCustomerSelect: (customer: WordPressUser | null) => void;
  placeholder?: string;
  className?: string;
}

// Component to display customer points in dropdown
const CustomerPoints = ({ customerId }: { customerId: number }) => {
  const { data: pointsBalance, isLoading } = useUserPointsBalance(customerId);
  
  if (isLoading) {
    return <span className="text-xs text-neutral-500">Loading...</span>;
  }
  
  if (!pointsBalance) {
    return <span className="text-xs text-neutral-500">0 Points</span>;
  }
  
  // Extract singular/plural form from points_label
  const pointsLabel = (pointsBalance as any).points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = pointsBalance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span className="text-xs text-white font-medium">
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
    </span>
  );
};

export function CustomerSelector({ 
  selectedCustomerId, 
  onCustomerSelect, 
  placeholder = "Search customers...",
  className = ""
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WordPressUser | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  
  // Debounce search query to reduce filtering computations - 200ms delay for responsive feel
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Set selected customer when prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
      setSearchQuery(customer?.display_name || customer?.name || '');
    } else {
      setSelectedCustomer(null);
      setSearchQuery('');
    }
  }, [selectedCustomerId, customers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const usersData = await usersService.getUsers(true);
      // Filter to show only customers
      const customersOnly = usersData.filter(user => user.roles.includes('customer'));
      setCustomers(customersOnly);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear selection if input doesn't match any customer
    if (selectedCustomer && !value.includes(selectedCustomer.display_name || selectedCustomer.name || '')) {
      setSelectedCustomer(null);
      onCustomerSelect(null);
    }
    
    // Open dropdown when typing
    if (!isOpen && value.length > 0) {
      setIsOpen(true);
    }
  };

  const handleCustomerSelect = (customer: WordPressUser) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.display_name || customer.name || customer.username);
    setIsOpen(false);
    onCustomerSelect(customer);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    onCustomerSelect(null);
    inputRef.current?.focus();
  };

  const handleNewCustomerClick = () => {
    setIsOpen(false);
    setShowNewCustomerForm(true);
  };

  const handleCustomerCreated = (newCustomer: WordPressUser) => {
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer);
    setSearchQuery(newCustomer.display_name || newCustomer.name || newCustomer.username);
    onCustomerSelect(newCustomer);
    setShowNewCustomerForm(false);
  };

  // Filter customers based on debounced search query - memoized for performance
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (!debouncedSearchQuery) return true;
      
      const query = debouncedSearchQuery.toLowerCase().trim();
      const name = (customer.display_name || customer.name || '').toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      const username = customer.username?.toLowerCase() || '';
      const customerId = customer.id?.toString() || '';
      
      // Split query into words for better matching
      const queryWords = query.split(/\s+/);
      
      // Check if all query words match somewhere in customer data
      return queryWords.every(word => 
        name.includes(word) || 
        email.includes(word) || 
        username.includes(word) || 
        customerId.includes(word)
      );
    });
  }, [customers, debouncedSearchQuery]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={{ fontFamily: 'Tiempos, serif' }}
          className="w-full px-2 py-2 bg-neutral-800/80 hover:bg-neutral-700/80 rounded text-white/90 placeholder-white/60 focus:bg-neutral-700/80 focus:outline-none text-sm pr-10 transition-colors"
          placeholder={placeholder}
        />
        
        {/* Search/Clear Icon */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {selectedCustomer && (
            <button
              onClick={handleClearSelection}
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-600/50 rounded-full transition-all"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 w-full max-w-[768px] min-w-[180px] sm:min-w-[200px] md:min-w-[300px] mt-2 bg-neutral-800 rounded-lg shadow-2xl z-50 max-h-[32rem] overflow-hidden flex flex-col border border-neutral-700/30">
          {loading ? (
            <div className="p-4 text-center text-neutral-500 text-sm">
              Loading customers...
            </div>
          ) : (
            <>
              {/* Fixed Header Options */}
              <div className="flex-shrink-0 border-b border-neutral-700/50">
                {/* New Customer Option */}
                <button
                  onClick={handleNewCustomerClick}
                  className="w-full text-left px-3 py-3 hover:bg-neutral-700/50 text-neutral-300 hover:text-neutral-200 text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-neutral-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Add New Customer</div>
                      <div className="text-xs text-neutral-500">Create a new customer account</div>
                    </div>
                  </div>
                </button>

                {/* Guest Option */}
                <button
                  onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
                  className="w-full text-left px-3 py-3 hover:bg-neutral-700/50 text-neutral-300 text-sm transition-colors"
                >
                  <div className="font-medium">Guest Customer</div>
                  <div className="text-xs text-neutral-500">Walk-in customer</div>
                </button>
              </div>
              
              {/* Scrollable Customer List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
                {filteredCustomers.length > 0 ? (
                  <>
                    {/* Customer Count */}
                    <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-750/30 sticky top-0">
                      Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Customer Options */}
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className={`w-full text-left px-3 py-3 hover:bg-neutral-700/50 text-neutral-300 text-sm transition-colors ${
                          selectedCustomer?.id === customer.id ? 'bg-neutral-700/50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">
                            {customer.display_name || customer.name || customer.username}
                          </div>
                          <CustomerPoints customerId={customer.id} />
                        </div>
                        <div className="text-xs text-neutral-500">
                          {customer.email} • ID: {customer.id}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-neutral-500 text-sm">
                    {debouncedSearchQuery ? 'No customers found matching your search' : 'No customers available'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* New Customer Form Modal */}
      <NewCustomerForm
        isOpen={showNewCustomerForm}
        onClose={() => setShowNewCustomerForm(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}

