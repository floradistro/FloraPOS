'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { useUserPointsBalance } from '../../hooks/useRewards';

interface HeaderCustomerSelectorProps {
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
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
  const [singular, plural] = pointsBalance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = pointsBalance.balance === 1 ? singular : plural;
  
  return (
    <span className="text-xs text-white font-medium">
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
    </span>
  );
};

export function HeaderCustomerSelector({ 
  selectedCustomer, 
  onCustomerSelect 
}: HeaderCustomerSelectorProps) {
  const [customers, setCustomers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click is on the dropdown itself (fixed positioned)
        const target = event.target as Element;
        if (!target.closest('[data-dropdown-content]')) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  const handleCustomerSelect = (customer: WordPressUser | null) => {
    onCustomerSelect?.(customer);
    setIsOpen(false);
  };

  const handleToggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedCustomerName = selectedCustomer 
    ? (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)
    : 'Select Customer';

  if (loading) {
    return (
      <div className="relative">
        <button 
          disabled
          className="flex items-center gap-2 px-3 py-1 bg-neutral-800/80 rounded text-neutral-500 cursor-not-allowed text-sm"
        >
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="flex items-center gap-2 px-3 py-1 bg-neutral-800/80 hover:bg-neutral-700/80 rounded text-neutral-400 transition-colors min-w-[160px] justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{selectedCustomerName}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && dropdownPosition && (
        <div 
          data-dropdown-content
          className="fixed py-2 bg-neutral-800 border border-white/[0.08] rounded shadow-2xl z-[99999] max-h-80 overflow-y-auto backdrop-blur-sm"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {/* Clear Selection Option */}
          <button
            onClick={() => handleCustomerSelect(null)}
            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
              !selectedCustomer
                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}
          >
            <span>No Customer</span>
          </button>

          {/* Guest Customer Option */}
          <button
            onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
              selectedCustomer?.id === 0
                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}
          >
            <div className="font-medium">Guest Customer</div>
            <div className="text-xs text-neutral-500">Walk-in customer</div>
          </button>

          {/* Customer Options */}
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleCustomerSelect(customer)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                selectedCustomer?.id === customer.id
                  ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                  : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium">
                  {customer.display_name || customer.name || customer.username}
                </div>
                <CustomerPoints customerId={customer.id} />
              </div>
              <div className="text-xs text-neutral-500">
                {customer.email}
              </div>
            </button>
          ))}

          {customers.length === 0 && (
            <div className="px-4 py-2 text-center text-neutral-500 text-sm">
              No customers available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
