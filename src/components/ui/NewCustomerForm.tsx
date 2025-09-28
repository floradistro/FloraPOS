'use client';

import React, { useState } from 'react';
import { WordPressUser } from '../../services/users-service';
import { UnifiedPopout } from './UnifiedPopout';

interface NewCustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: WordPressUser) => void;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export function NewCustomerForm({ isOpen, onClose, onCustomerCreated }: NewCustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US'
    },
    shipping: {
      first_name: '',
      last_name: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'US'
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleAddressChange = (type: 'address' | 'shipping', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Either email or phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate username from email or phone
      let username = '';
      if (formData.email.trim()) {
        username = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      } else if (formData.phone.trim()) {
        username = `user_${formData.phone.replace(/[^0-9]/g, '')}`;
      } else {
        username = `user_${Date.now()}`;
      }
      
      // Prepare shipping address (copy from billing if needed)
      const shippingAddress = useShippingAsBilling ? {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.address.address_1,
        address_2: formData.address.address_2,
        city: formData.address.city,
        state: formData.address.state,
        postcode: formData.address.postcode,
        country: formData.address.country
      } : formData.shipping;

      const customerData = {
        ...(formData.email.trim() && { email: formData.email.trim() }),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        username: username,
        password: Math.random().toString(36).slice(-8), // Generate random password
        billing: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          address_1: formData.address.address_1,
          address_2: formData.address.address_2,
          city: formData.address.city,
          state: formData.address.state,
          postcode: formData.address.postcode,
          country: formData.address.country,
          ...(formData.email.trim() && { email: formData.email.trim() }),
          ...(formData.phone.trim() && { phone: formData.phone.trim() })
        },
        shipping: shippingAddress
      };

      const response = await fetch('/api/users-matrix/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const newCustomer = await response.json();
      
      // Try to update the customer with additional data
      try {
        await fetch(`/api/users-matrix/customers/${newCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billing: customerData.billing,
            shipping: shippingAddress
          })
        });
      } catch (updateError) {
        console.warn('Could not update customer details:', updateError);
      }

      onCustomerCreated(newCustomer);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US'
      },
      shipping: {
        first_name: '',
        last_name: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US'
      }
    });
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <UnifiedPopout isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-500/20 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
            New Customer
          </h3>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4 p-4 border border-neutral-600 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>
            
            <div className="text-xs text-neutral-400 mt-2">
              <span className="text-red-400">*</span> Either email or phone number is required
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4 p-4 border border-neutral-600 rounded-md">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Address Line 1</label>
              <input
                type="text"
                value={formData.address.address_1}
                onChange={(e) => handleAddressChange('address', 'address_1', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Address Line 2</label>
              <input
                type="text"
                value={formData.address.address_2}
                onChange={(e) => handleAddressChange('address', 'address_2', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">City</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('address', 'city', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">State</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('address', 'state', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State/Province"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.address.postcode}
                  onChange={(e) => handleAddressChange('address', 'postcode', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ZIP/Postal Code"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Country</label>
              <select
                value={formData.address.country}
                onChange={(e) => handleAddressChange('address', 'country', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
              </select>
            </div>
          </div>

          {/* Shipping Address Toggle */}
          <div className="flex items-center space-x-3 p-4 border border-neutral-600 rounded-md">
            <input
              type="checkbox"
              id="useShippingAsBilling"
              checked={useShippingAsBilling}
              onChange={(e) => setUseShippingAsBilling(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="useShippingAsBilling" className="text-sm font-medium text-neutral-300">
              Use billing address for shipping
            </label>
          </div>

          {/* Shipping Address (if different) */}
          {!useShippingAsBilling && (
            <div className="space-y-4 p-4 border border-neutral-600 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.shipping.first_name}
                    onChange={(e) => handleAddressChange('shipping', 'first_name', e.target.value)}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.shipping.last_name}
                    onChange={(e) => handleAddressChange('shipping', 'last_name', e.target.value)}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={formData.shipping.address_1}
                  onChange={(e) => handleAddressChange('shipping', 'address_1', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={formData.shipping.address_2}
                  onChange={(e) => handleAddressChange('shipping', 'address_2', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.shipping.city}
                    onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.shipping.state}
                    onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State/Province"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.shipping.postcode}
                    onChange={(e) => handleAddressChange('shipping', 'postcode', e.target.value)}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ZIP/Postal Code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Country</label>
                <select
                  value={formData.shipping.country}
                  onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                </select>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-800 flex items-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </UnifiedPopout>
  );
}
