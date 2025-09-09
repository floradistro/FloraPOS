import React, { useState, useEffect, useRef } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { Button, IconButton, AlertModal, ConfirmModal, LoadingSpinner } from '../ui';
import { SimpleRewardsView, EnhancedCustomerOrderHistory } from './rewards';
import { useQuery } from '@tanstack/react-query';

interface CustomersViewProps {
  onClose?: () => void;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  onSelectedCustomersChange?: (selected: Set<number>) => void;
  onTotalCustomersChange?: (total: number) => void;
  onAddCustomer?: () => void;
  hideLoadingOverlay?: boolean;
}

export interface CustomersViewRef {
  handleAddNew: () => void;
  handleRefresh: () => void;
}

interface EditingUser extends Partial<WordPressUser> {
  password?: string;
  // WooCommerce customer fields
  phone?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

type CustomerTab = 'contact' | 'rewards' | 'orders' | 'preferences';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

const US_STATES = [
  { code: '', name: 'Select State' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

const CustomersViewComponent = React.forwardRef<CustomersViewRef, CustomersViewProps>(({ 
  onClose,
  selectedLocationId = '',
  onLocationChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  onSelectedCustomersChange,
  onTotalCustomersChange,
  onAddCustomer,
  hideLoadingOverlay = false
}, ref) => {
  // Use React Query for optimized data fetching
  const {
    data: users = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => usersService.getUsers(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache retention
    retry: 2,
  });

  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<EditingUser>({});
  const [saving, setSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<{ [userId: number]: CustomerTab }>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [customerData, setCustomerData] = useState<{[userId: number]: any}>({});
  const [loadingCustomerData, setLoadingCustomerData] = useState<Set<number>>(new Set());
  
  // Modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  


  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'customer', label: 'Customer', visible: true, required: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'joined', label: 'Joined', visible: true },
    { id: 'orders', label: 'Total Orders', visible: false },
    { id: 'spent', label: 'Total Spent', visible: false },
    { id: 'lastOrder', label: 'Last Order', visible: false },
  ]);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Close column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle query error
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Failed to load customers data');
    }
  }, [queryError]);

  // Filter to show only customers
  const customersOnly = users.filter(user => user.roles.includes('customer'));

  // Update parent with total customers count
  useEffect(() => {
    if (onTotalCustomersChange) {
      onTotalCustomersChange(customersOnly.length);
    }
  }, [customersOnly.length, onTotalCustomersChange]);

  // Toggle expand card
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Set default tab if not set
      if (!activeCustomerTab[id]) {
        setActiveCustomerTab(prev => ({ ...prev, [id]: 'contact' }));
      }
      // Load customer data when expanding a card for the details tab
      if (activeCustomerTab[id] === 'contact' || !activeCustomerTab[id]) {
        loadCustomerData(id);
      }
    }
    setExpandedCards(newExpanded);
  };

  // Toggle selection
  const toggleUserSelection = (id: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
    
    // Update parent with selected customers
    if (onSelectedCustomersChange) {
      onSelectedCustomersChange(newSelected);
    }
  };

  // Start editing
  const startEditing = async (user?: WordPressUser) => {
    if (user) {
      setEditingUser(user.id);
      
      // Load customer data if we don't have it yet
      if (!customerData[user.id]) {
        await loadCustomerData(user.id);
      }
      
      const customer = customerData[user.id] || {};
      
      setEditForm({
        name: user.name,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        roles: user.roles,
        phone: customer.billing?.phone || customer.phone || '',
        billing: customer.billing || {
          first_name: user.name?.split(' ')[0] || '',
          last_name: user.name?.split(' ').slice(1).join(' ') || '',
          company: '',
          address_1: '',
          address_2: '',
          city: '',
          state: 'NC',
          postcode: '',
          country: 'US',
          email: user.email,
          phone: ''
        },
        shipping: customer.shipping || {
          first_name: user.name?.split(' ')[0] || '',
          last_name: user.name?.split(' ').slice(1).join(' ') || '',
          company: '',
          address_1: '',
          address_2: '',
          city: '',
          state: 'NC',
          postcode: '',
          country: 'US'
        }
      });
    } else {
      setShowAddForm(true);
      setEditingUser('new');
      setEditForm({
        name: '',
        username: '',
        email: '',
        display_name: '',
        roles: ['customer'], // Default to customer role
        password: '',
        phone: '',
        billing: {
          first_name: '',
          last_name: '',
          company: '',
          address_1: '',
          address_2: '',
          city: '',
          state: 'NC',
          postcode: '',
          country: 'US',
          email: '',
          phone: ''
        },
        shipping: {
          first_name: '',
          last_name: '',
          company: '',
          address_1: '',
          address_2: '',
          city: '',
          state: 'NC',
          postcode: '',
          country: 'US'
        }
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({});
    setShowAddForm(false);
  };

  // Update form field
  const updateField = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Update nested form field (for billing/shipping)
  const updateNestedField = (parent: string, field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any || {}),
        [field]: value
      }
    }));
  };

  // Save user
  const saveUser = async () => {
    if (!editForm.email) {
      setError('Email is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare data for WordPress - only include supported fields (no username for updates)
      const wpSupportedFields: any = {
        email: editForm.email,
        display_name: editForm.display_name,
        name: editForm.name,
        roles: editForm.roles
      };

      // Only include password if it's provided
      if (editForm.password && editForm.password.trim() !== '') {
        wpSupportedFields.password = editForm.password;
      }

      // Prepare WooCommerce customer data
      const customerData = {
        billing: {
          ...editForm.billing,
          phone: editForm.phone || editForm.billing?.phone || ''
        },
        shipping: editForm.shipping
      };

      if (editingUser === 'new') {
        // For new users, include username in creation
        wpSupportedFields.username = editForm.username;
        
        // Create new customer
        const response = await fetch('/api/users-matrix/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...wpSupportedFields,
            roles: ['customer'] // Ensure new users are customers
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create customer');
        }

        const newUser = await response.json();
        
        // Try to update the WooCommerce customer data
        try {
          await fetch(`/api/users-matrix/customers/${newUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
          });
        } catch (err) {
          console.warn('⚠️ Could not update customer data for new user:', err);
        }

        setUsers(prev => [...prev, newUser]);
        setShowAddForm(false);
        
      } else if (typeof editingUser === 'number') {
        // Update existing customer - WordPress user data first
        const userResponse = await fetch(`/api/users-matrix/users/${editingUser}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wpSupportedFields)
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          console.error('User update failed:', errorData);
          throw new Error(errorData.error || 'Failed to update customer');
        }

        const updatedUser = await userResponse.json();

        // Update WooCommerce customer data
        try {
          const customerResponse = await fetch(`/api/users-matrix/customers/${editingUser}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
          });

          if (customerResponse.ok) {
            const updatedCustomer = await customerResponse.json();
            setCustomerData(prev => ({ ...prev, [editingUser]: updatedCustomer }));
            console.log('✅ Customer data updated successfully');
          } else {
            console.warn('⚠️ Could not update customer data, but user data was saved');
          }
        } catch (err) {
          console.warn('⚠️ Customer data update failed, but user data was saved:', err);
        }

        setUsers(prev => prev.map(user => 
          user.id === editingUser ? updatedUser : user
        ));
        setLastUpdated(editingUser);
        setTimeout(() => setLastUpdated(null), 3000);
      }

      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // Send password reset
  const sendPasswordReset = async (userId: number) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset');
      }

      // Password reset sent successfully
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };



  // Load WooCommerce customer data
  const loadCustomerData = async (userId: number) => {
    if (loadingCustomerData.has(userId)) return; // Prevent duplicate requests
    
    try {
      setLoadingCustomerData(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
      
      const response = await fetch(`/api/users-matrix/customers/${userId}`);
      
      if (response.ok) {
        const customer = await response.json();
        setCustomerData(prev => ({ ...prev, [userId]: customer }));
        console.log('✅ Customer data loaded:', customer);
      } else {
        console.log('⚠️ Customer data not found, will use defaults');
        setCustomerData(prev => ({ ...prev, [userId]: {} }));
      }
    } catch (err) {
      console.error('❌ Failed to load customer data:', err);
      setCustomerData(prev => ({ ...prev, [userId]: {} }));
    } finally {
      setLoadingCustomerData(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };



  // Delete customer
  const deleteCustomer = async (userId: number) => {
    // Show confirm modal instead of browser confirm
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer',
      message: 'Are you sure you want to delete this customer? This action cannot be undone.',
      onConfirm: () => performDeleteCustomer(userId)
    });
  };
  
  const performDeleteCustomer = async (userId: number) => {

    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  // Set active tab for a customer
  const setCustomerTab = (userId: number, tab: CustomerTab) => {
    setActiveCustomerTab(prev => ({ ...prev, [userId]: tab }));
    
    // Load customer data when switching to contact (details) tab
    if (tab === 'contact' && !customerData[userId]) {
      loadCustomerData(userId);
    }
  };

  // Handle add new customer (called from parent)
  const handleAddNew = () => {
    if (onAddCustomer) {
      onAddCustomer();
    } else {
      startEditing();
    }
  };

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    handleAddNew: handleAddNew,
    handleRefresh: () => refetchUsers()
  }));

  return (
    <div className="h-full bg-neutral-900 flex flex-col">

      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-900 relative">
        {/* Loading Overlay */}
        {loading && !hideLoadingOverlay && (
          <LoadingSpinner 
            overlay 
            size="lg" 
            text="Loading Customers"
            subText="Fetching customer data..."
          />
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="border-b border-white/[0.08] px-6 py-4 bg-neutral-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Customer</h3>
              <IconButton
                onClick={cancelEditing}
                variant="ghost"
                size="sm"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Username *"
                />
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Email *"
                />
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => updateField('display_name', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Display Name"
                />
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Password *"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={saveUser}
                    disabled={saving || !editForm.username?.trim() || !editForm.email?.trim()}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {saving ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    variant="ghost"
                    disabled={saving}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="w-full">
          {/* Table Header */}
          <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-6 py-3 z-10">
                         <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 relative">
              <div className="w-6"></div> {/* Space for expand icon */}
              {columns.find(c => c.id === 'customer')?.visible && (
                <div className="flex-1">Customer</div>
              )}
              {columns.find(c => c.id === 'email')?.visible && (
                <div className="w-64">Email</div>
              )}
              {columns.find(c => c.id === 'joined')?.visible && (
                <div className="w-40">Joined</div>
              )}
              {columns.find(c => c.id === 'orders')?.visible && (
                <div className="w-32">Total Orders</div>
              )}
              {columns.find(c => c.id === 'spent')?.visible && (
                <div className="w-32">Total Spent</div>
              )}
              {columns.find(c => c.id === 'lastOrder')?.visible && (
                <div className="w-40">Last Order</div>
              )}

              {/* Column Selector Icon - Far Right */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2" ref={columnSelectorRef}>
              <button
                onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
                title="Configure table columns"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>

              {/* Column Selector Dropdown */}
              {isColumnSelectorOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-white/[0.08] rounded-lg shadow-lg" style={{ zIndex: 99999 }}>
                  <div className="p-3">
                    <div className="text-xs font-medium text-neutral-300 mb-3">Configure Table Columns</div>
                    
                    <div className="space-y-2">
                      {columns.map(column => (
                        <label key={column.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-neutral-200">
                          <input
                            type="checkbox"
                            checked={column.visible}
                            onChange={() => toggleColumn(column.id)}
                            disabled={column.required}
                            className="rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500 focus:ring-1 disabled:opacity-50"
                          />
                          <span className={column.required ? 'text-neutral-500' : ''}>
                            {column.label}
                          </span>
                          {column.required && (
                            <span className="text-neutral-600 text-[10px]">(required)</span>
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/[0.08] flex gap-2">
                      <button
                        onClick={() => {
                          setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                        }}
                        className="flex-1 text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                      >
                        Show All
                      </button>
                      <button
                        onClick={() => {
                          setColumns(prev => prev.map(col => ({ ...col, visible: col.required || false })));
                        }}
                        className="flex-1 text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                      >
                        Hide All
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div>
          {users.map((user) => (
            <div
              key={user.id}
              className={`group mb-2 rounded-lg border-b border-white/[0.02] relative overflow-hidden ${
                selectedUsers.has(user.id)
                  ? 'bg-neutral-800/50 hover:bg-neutral-800/70 border-l-4 border-l-neutral-400'
                  : 'bg-neutral-900/40 hover:bg-neutral-800/60'
              } ${expandedCards.has(user.id) ? 'h-[calc(100vh-200px)] min-h-[600px]' : 'h-auto'}`}
              style={{
                transition: 'height 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease',
                willChange: expandedCards.has(user.id) ? 'height' : 'auto'
              }}
            >
              {/* Customer Row - Single Line */}
              <div 
                className="flex items-center gap-3 px-6 py-3 cursor-pointer select-none relative bg-inherit"
                style={{ zIndex: 2 }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isButton = target.closest('button');
                  if (!isButton) {
                    toggleUserSelection(user.id);
                  }
                }}
                onDoubleClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isButton = target.closest('button');
                  if (!isButton) {
                    e.stopPropagation();
                    toggleExpand(user.id);
                  }
                }}
              >
                {/* Expand/Collapse Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(user.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 smooth-hover"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-300 ease-out ${expandedCards.has(user.id) ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Customer Name */}
                {columns.find(c => c.id === 'customer')?.visible && (
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-500 text-sm">
                      {user.display_name || user.name || user.username}
                    </div>
                    <div className="text-xs text-neutral-600 truncate">
                      ID: {user.id}
                    </div>
                  </div>
                )}

                {/* Email */}
                {columns.find(c => c.id === 'email')?.visible && (
                  <div className="w-64 text-neutral-500 text-sm truncate">
                    {user.email}
                  </div>
                )}

                {/* Joined Date */}
                {columns.find(c => c.id === 'joined')?.visible && (
                  <div className="w-40 text-neutral-500 text-xs">
                    {new Date().toLocaleDateString()}
                  </div>
                )}

                {/* Total Orders */}
                {columns.find(c => c.id === 'orders')?.visible && (
                  <div className="w-32 text-neutral-500 text-xs">
                    0 orders
                  </div>
                )}

                {/* Total Spent */}
                {columns.find(c => c.id === 'spent')?.visible && (
                  <div className="w-32 text-neutral-500 text-xs">
                    $0.00
                  </div>
                )}

                {/* Last Order */}
                {columns.find(c => c.id === 'lastOrder')?.visible && (
                  <div className="w-40 text-neutral-500 text-xs">
                    Never
                  </div>
                )}
              </div>

              {/* Expanded View */}
              {expandedCards.has(user.id) && (
                <div 
                  className="absolute inset-x-0 top-[60px] bottom-0 bg-neutral-800/30 hover:bg-neutral-800/50 border-t border-white/[0.02] overflow-y-auto p-4"
                  style={{
                    animation: 'expandTopDown 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                    transformOrigin: 'top',
                    transform: 'scaleY(0)',
                    willChange: 'transform',
                    zIndex: 1
                  }}
                >
                  {/* Tab Controls */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCustomerTab(user.id, 'contact')}
                        size="sm"
                        variant={activeCustomerTab[user.id] === 'contact' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => setCustomerTab(user.id, 'rewards')}
                        size="sm"
                        variant={activeCustomerTab[user.id] === 'rewards' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Rewards
                      </Button>
                      <Button
                        onClick={() => setCustomerTab(user.id, 'orders')}
                        size="sm"
                        variant={activeCustomerTab[user.id] === 'orders' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Order History
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <>
                          <Button
                            onClick={saveUser}
                            disabled={saving}
                            size="sm"
                            className="text-xs"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="ghost"
                            disabled={saving}
                            size="sm"
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => startEditing(user)}
                            size="sm"
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteCustomer(user.id)}
                            variant="danger"
                            size="sm"
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                                      {/* Tab Content */}
                   <div className="space-y-6">
                     {/* Details Tab - Contact + Account Management */}
                     {activeCustomerTab[user.id] === 'contact' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                         {/* Contact Information */}
                         <div className="space-y-2">
                           <div className="text-neutral-500 font-medium text-xs mb-2">
                             Contact Information
                           </div>
                          {editingUser === user.id ? (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Email:</div>
                                <input
                                  type="email"
                                  value={editForm.email || ''}
                                  onChange={(e) => updateField('email', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Phone:</div>
                                <input
                                  type="tel"
                                  value={editForm.phone || ''}
                                  onChange={(e) => updateField('phone', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Phone number"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Email:</span>
                                  <span className="text-neutral-500 text-xs">{user.email}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Phone:</span>
                                  <span className="text-neutral-500 text-xs">{customerData[user.id]?.billing?.phone || customerData[user.id]?.phone || 'Not set'}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Account Details */}
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Account Details
                          </div>
                          {editingUser === user.id ? (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Display Name:</div>
                                <input
                                  type="text"
                                  value={editForm.display_name || ''}
                                  onChange={(e) => updateField('display_name', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Full Name:</div>
                                <input
                                  type="text"
                                  value={editForm.name || ''}
                                  onChange={(e) => updateField('name', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Full name"
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Password:</div>
                                <input
                                  type="password"
                                  value={editForm.password || ''}
                                  onChange={(e) => updateField('password', e.target.value)}
                                  className="w-full px-2 py-1 bg-black border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Leave empty to keep current"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Username:</span>
                                  <span className="text-neutral-500 text-xs">{user.username}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Display Name:</span>
                                  <span className="text-neutral-500 text-xs">{user.display_name || 'Not set'}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Customer ID:</span>
                                  <span className="text-neutral-500 text-xs">{user.id}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Billing Address */}
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Billing Address
                          </div>
                          {editingUser === user.id ? (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Name:</div>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={editForm.billing?.first_name || ''}
                                    onChange={(e) => updateNestedField('billing', 'first_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="First name"
                                  />
                                  <input
                                    type="text"
                                    value={editForm.billing?.last_name || ''}
                                    onChange={(e) => updateNestedField('billing', 'last_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="Last name"
                                  />
                                </div>
                                <div className="text-neutral-600 text-xs mb-1">Street Address:</div>
                                <input
                                  type="text"
                                  value={editForm.billing?.address_1 || ''}
                                  onChange={(e) => updateNestedField('billing', 'address_1', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs mb-2"
                                  placeholder="Street address"
                                />
                                <input
                                  type="text"
                                  value={editForm.billing?.address_2 || ''}
                                  onChange={(e) => updateNestedField('billing', 'address_2', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Apt, suite, etc."
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">City & State:</div>
                                <input
                                  type="text"
                                  value={editForm.billing?.city || ''}
                                  onChange={(e) => updateNestedField('billing', 'city', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs mb-2"
                                  placeholder="City"
                                />
                                <div className="flex gap-2">
                                  <select
                                    value={editForm.billing?.state || ''}
                                    onChange={(e) => updateNestedField('billing', 'state', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  >
                                    {US_STATES.map(state => (
                                      <option key={state.code} value={state.code} className="bg-neutral-800 text-neutral-300">
                                        {state.name}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={editForm.billing?.postcode || ''}
                                    onChange={(e) => updateNestedField('billing', 'postcode', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="Zip"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Name:</div>
                                <div className="text-neutral-500 text-xs mb-2">
                                  {customerData[user.id]?.billing?.first_name || customerData[user.id]?.billing?.last_name ? (
                                    `${customerData[user.id].billing.first_name || ''} ${customerData[user.id].billing.last_name || ''}`.trim()
                                  ) : (
                                    'Not set'
                                  )}
                                </div>
                                <div className="text-neutral-600 text-xs mb-1">Address:</div>
                                <div className="text-neutral-500 text-xs">
                                  {customerData[user.id]?.billing?.address_1 ? (
                                    <>
                                      {customerData[user.id].billing.address_1}
                                      {customerData[user.id].billing?.address_2 && `, ${customerData[user.id].billing.address_2}`}
                                      <br />
                                      {customerData[user.id].billing?.city && `${customerData[user.id].billing.city}, `}
                                      {customerData[user.id].billing?.state && (
                                        US_STATES.find(s => s.code === customerData[user.id].billing.state)?.name || customerData[user.id].billing.state
                                      )} {customerData[user.id].billing?.postcode}
                                    </>
                                  ) : (
                                    'Not set'
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Shipping Address
                          </div>
                          {editingUser === user.id ? (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Name:</div>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={editForm.shipping?.first_name || ''}
                                    onChange={(e) => updateNestedField('shipping', 'first_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="First name"
                                  />
                                  <input
                                    type="text"
                                    value={editForm.shipping?.last_name || ''}
                                    onChange={(e) => updateNestedField('shipping', 'last_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="Last name"
                                  />
                                </div>
                                <div className="text-neutral-600 text-xs mb-1">Street Address:</div>
                                <input
                                  type="text"
                                  value={editForm.shipping?.address_1 || ''}
                                  onChange={(e) => updateNestedField('shipping', 'address_1', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs mb-2"
                                  placeholder="Street address"
                                />
                                <input
                                  type="text"
                                  value={editForm.shipping?.address_2 || ''}
                                  onChange={(e) => updateNestedField('shipping', 'address_2', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Apt, suite, etc."
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">City & State:</div>
                                <input
                                  type="text"
                                  value={editForm.shipping?.city || ''}
                                  onChange={(e) => updateNestedField('shipping', 'city', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs mb-2"
                                  placeholder="City"
                                />
                                <div className="flex gap-2">
                                  <select
                                    value={editForm.shipping?.state || ''}
                                    onChange={(e) => updateNestedField('shipping', 'state', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  >
                                    {US_STATES.map(state => (
                                      <option key={state.code} value={state.code} className="bg-neutral-800 text-neutral-300">
                                        {state.name}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={editForm.shipping?.postcode || ''}
                                    onChange={(e) => updateNestedField('shipping', 'postcode', e.target.value)}
                                    className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                    placeholder="Zip"
                                  />
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      shipping: { 
                                        first_name: prev.billing?.first_name || '',
                                        last_name: prev.billing?.last_name || '',
                                        company: prev.billing?.company || '',
                                        address_1: prev.billing?.address_1 || '',
                                        address_2: prev.billing?.address_2 || '',
                                        city: prev.billing?.city || '',
                                        state: prev.billing?.state || '',
                                        postcode: prev.billing?.postcode || '',
                                        country: prev.billing?.country || 'US'
                                      }
                                    }));
                                  }}
                                  className="w-full px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                                >
                                  Copy from Billing
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Name:</div>
                                <div className="text-neutral-500 text-xs mb-2">
                                  {customerData[user.id]?.shipping?.first_name || customerData[user.id]?.shipping?.last_name ? (
                                    `${customerData[user.id].shipping.first_name || ''} ${customerData[user.id].shipping.last_name || ''}`.trim()
                                  ) : (
                                    'Same as billing'
                                  )}
                                </div>
                                <div className="text-neutral-600 text-xs mb-1">Address:</div>
                                <div className="text-neutral-500 text-xs">
                                  {customerData[user.id]?.shipping?.address_1 ? (
                                    <>
                                      {customerData[user.id].shipping.address_1}
                                      {customerData[user.id].shipping?.address_2 && `, ${customerData[user.id].shipping.address_2}`}
                                      <br />
                                      {customerData[user.id].shipping?.city && `${customerData[user.id].shipping.city}, `}
                                      {customerData[user.id].shipping?.state && (
                                        US_STATES.find(s => s.code === customerData[user.id].shipping.state)?.name || customerData[user.id].shipping.state
                                      )} {customerData[user.id].shipping?.postcode}
                                    </>
                                  ) : (
                                    'Same as billing'
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                       
                       {/* Customer Preferences - Full Width Section */}
                       <div className="col-span-full mt-6">
                         <div className="text-neutral-500 font-medium text-sm mb-4 border-b border-white/[0.08] pb-2">
                           Customer Preferences
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <div className="space-y-3">
                             <div className="text-neutral-400 font-medium text-xs mb-3">
                               Communication
                             </div>
                             <div className="bg-neutral-900/40 rounded p-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-neutral-600 text-xs">Email Notifications:</span>
                                 <span className="text-neutral-400 text-xs font-medium">Enabled</span>
                               </div>
                             </div>
                             <div className="bg-neutral-900/40 rounded p-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-neutral-600 text-xs">SMS Notifications:</span>
                                 <span className="text-neutral-400 text-xs font-medium">Disabled</span>
                               </div>
                             </div>
                           </div>
                           <div className="space-y-3">
                             <div className="text-neutral-400 font-medium text-xs mb-3">
                               Shopping Preferences
                             </div>
                             <div className="bg-neutral-900/40 rounded p-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-neutral-600 text-xs">Language:</span>
                                 <span className="text-neutral-400 text-xs font-medium">English</span>
                               </div>
                             </div>
                             <div className="bg-neutral-900/40 rounded p-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-neutral-600 text-xs">Currency:</span>
                                 <span className="text-neutral-400 text-xs font-medium">USD</span>
                               </div>
                             </div>
                           </div>
                           <div className="space-y-3">
                             <div className="text-neutral-400 font-medium text-xs mb-3">
                               Marketing & Actions
                             </div>
                             <div className="bg-neutral-900/40 rounded p-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-neutral-600 text-xs">Newsletter:</span>
                                 <span className="text-neutral-400 text-xs font-medium">Subscribed</span>
                               </div>
                             </div>
                             {editingUser !== user.id && (
                               <div className="bg-neutral-900/40 rounded p-3">
                                 <div className="text-neutral-600 text-xs mb-2">Password:</div>
                                 <button
                                   onClick={() => sendPasswordReset(user.id)}
                                   className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover transition-colors"
                                 >
                                   Send Reset Link
                                 </button>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                     )}

                    {/* Rewards Tab */}
                    {activeCustomerTab[user.id] === 'rewards' && (
                      <div className="col-span-4">
                        <SimpleRewardsView
                          userId={user.id}
                          userName={user.display_name || user.username}
                          isAdmin={true}
                        />
                      </div>
                    )}

                    {/* Order History Tab */}
                    {activeCustomerTab[user.id] === 'orders' && (
                      <div className="col-span-4">
                        <EnhancedCustomerOrderHistory userId={user.id} initialPerPage={10} />
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-300 mb-2">No customers found</h3>
            <p className="text-sm text-neutral-500 text-center mb-6 max-w-sm">
              Get started by adding your first customer to the system.
            </p>
            <button
              onClick={() => startEditing()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Customer
            </button>
          </div>
        )}
      </div>
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Delete"
      />
      

    </div>
  );
});

CustomersViewComponent.displayName = 'CustomersView';

// Export the component directly without any wrappers
// This avoids ref passing issues with lazy loading
export default CustomersViewComponent;
