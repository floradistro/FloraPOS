'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { WordPressUser, usersService } from '../../services/users-service';
import { useUserPointsBalance } from '../../hooks/useRewards';
import { IDScanner } from './IDScanner';
import { ParsedIDData } from '../../utils/idParser';

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
    <span className="text-xs text-neutral-500 bg-neutral-700/50 px-2 py-1 rounded">
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
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showIDScanner, setShowIDScanner] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = showNewCustomerForm ? 380 : 280; // Wider when form is shown
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left - 60, // Offset to make dropdown wider than button
        width: dropdownWidth
      });
    }
  }, [isOpen, showNewCustomerForm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  const handleNewCustomerClick = () => {
    setShowNewCustomerForm(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.firstName.trim() || !newCustomerData.email.trim()) {
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const username = newCustomerData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const billingAddress = {
        first_name: newCustomerData.firstName.trim(),
        last_name: newCustomerData.lastName.trim(),
        email: newCustomerData.email.trim(),
        phone: newCustomerData.phone,
        address_1: newCustomerData.address,
        city: newCustomerData.city,
        state: newCustomerData.state,
        postcode: newCustomerData.zipCode,
        country: 'US'
      };

      const customerData = {
        email: newCustomerData.email.trim(),
        first_name: newCustomerData.firstName.trim(),
        last_name: newCustomerData.lastName.trim(),
        username: username,
        password: Math.random().toString(36).slice(-8), // Generate random password
        billing: billingAddress,
        shipping: billingAddress // Use same address for shipping
      };

      const response = await fetch('/api/users-matrix/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const newCustomer = await response.json();
      setCustomers(prev => [...prev, newCustomer]);
      onCustomerSelect?.(newCustomer);
      
      // Reset form
      setNewCustomerData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
      setShowNewCustomerForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCancelNewCustomer = () => {
    setNewCustomerData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
    setShowNewCustomerForm(false);
  };

  const handleIDScanClick = () => {
    setShowIDScanner(true);
  };

  const handleIDDataScanned = (data: ParsedIDData) => {
    setNewCustomerData({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode
    });
    setShowIDScanner(false);
  };

  const selectedCustomerName = selectedCustomer 
    ? (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)
    : 'Select Customer';

  if (loading) {
    return (
      <div className="relative">
        <button 
          disabled
          className="flex items-center gap-2 px-3 h-[30px] bg-transparent border border-neutral-500/30 rounded-lg text-neutral-500 cursor-not-allowed text-sm"
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
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 transition-all duration-300 ease-out min-w-[160px] justify-between text-sm"
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

      {isOpen && dropdownPosition && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-neutral-700/95 backdrop-blur-sm border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.08] bg-neutral-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Select Customer</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-500 transition-colors p-1 hover:bg-white/[0.05] rounded"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Customer Options */}
          <div className="py-1 max-h-96 overflow-y-auto">
            {/* Clear Selection Option */}
            <button
              onClick={() => handleCustomerSelect(null)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group ${
                !selectedCustomer
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9l-6 6-6-6" />
                  </svg>
                </div>
                <span>No Customer</span>
              </div>
              {!selectedCustomer && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* New Customer Form or Button */}
            {showNewCustomerForm ? (
              <div className="px-4 py-3 border-b border-white/[0.08]">
                <div className="space-y-3">
                  {/* ID Scan Button */}
                  <button
                    onClick={handleIDScanClick}
                    className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3z" />
                    </svg>
                    Scan State ID
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={newCustomerData.firstName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={newCustomerData.lastName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={newCustomerData.city}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newCustomerData.state}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, state: e.target.value }))}
                      className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={newCustomerData.zipCode}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelNewCustomer}
                      disabled={isCreatingCustomer}
                      className="flex-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded text-xs transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer || !newCustomerData.firstName.trim() || !newCustomerData.email.trim()}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      {isCreatingCustomer ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleNewCustomerClick}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group text-neutral-300 hover:bg-white/[0.05] hover:text-neutral-200 border-b border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-700/50 rounded-full flex items-center justify-center group-hover:bg-neutral-600/50 transition-colors">
                    <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">New Customer</div>
                    <div className="text-xs text-neutral-500 group-hover:text-neutral-400">Add a new customer</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Guest Customer Option */}
            <button
              onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group ${
                selectedCustomer?.id === 0
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Guest Customer</div>
                  <div className="text-xs text-neutral-500">Walk-in customer</div>
                </div>
              </div>
              {selectedCustomer?.id === 0 && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Customer Options */}
            {customers.length > 0 ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {customer.display_name || customer.name || customer.username}
                        </div>
                        <CustomerPoints customerId={customer.id} />
                      </div>
                      <div className="text-xs text-neutral-500">
                        {customer.email}
                      </div>
                    </div>
                  </div>
                  {selectedCustomer?.id === customer.id && (
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-neutral-500 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                No customers available
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ID Scanner Modal */}
      <IDScanner
        isOpen={showIDScanner}
        onClose={() => setShowIDScanner(false)}
        onDataScanned={handleIDDataScanned}
      />
    </>
  );
}
