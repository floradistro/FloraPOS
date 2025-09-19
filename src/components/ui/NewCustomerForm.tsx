'use client';

import React, { useState } from 'react';
import { WordPressUser } from '../../services/users-service';
import { IDScanner, ScannedIDData } from './IDScanner';

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
  const [showIDScanner, setShowIDScanner] = useState(false);

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

  const handleIDScanned = (scannedData: ScannedIDData) => {
    // Populate form with scanned data
    setFormData(prev => ({
      ...prev,
      firstName: scannedData.firstName || prev.firstName,
      lastName: scannedData.lastName || prev.lastName,
      address: {
        ...prev.address,
        address_1: scannedData.address || prev.address.address_1,
        city: scannedData.city || prev.address.city,
        state: scannedData.state || prev.address.state,
        postcode: scannedData.zipCode || prev.address.postcode
      }
    }));
    
    setShowIDScanner(false);
    setError(null);
  };

  const handleIDScanError = (errorMessage: string) => {
    setError(`ID Scan Error: ${errorMessage}`);
    setShowIDScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.email.trim()) {
      setError('First name and email are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate username from email
      const username = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
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
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        username: username,
        billing: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          address_1: formData.address.address_1,
          address_2: formData.address.address_2,
          city: formData.address.city,
          state: formData.address.state,
          postcode: formData.address.postcode,
          country: formData.address.country,
          email: formData.email.trim(),
          phone: formData.phone
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-neutral-800 border border-white/[0.04] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              Add New Customer
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Enter customer details or scan their driver's license
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIDScanner(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors text-sm font-medium"
              title="Scan Driver's License"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan ID
            </button>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-700 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{ fontFamily: 'Tiempos, serif' }}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
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
                  placeholder="Enter phone number"
                />
              </div>
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
      
      {/* ID Scanner Modal */}
      <IDScanner
        isOpen={showIDScanner}
        onClose={() => setShowIDScanner(false)}
        onDataScanned={handleIDScanned}
        onError={handleIDScanError}
      />
    </div>
  );
}
