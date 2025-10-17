'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dynamic from 'next/dynamic';
import { WordPressUser, usersService } from '../../services/users-service';
import { useUserPointsBalance } from '../../hooks/useRewards';
import { useDebounce } from '../../hooks/useDebounce';
import type { IDScanResult } from './ScanditIDScanner';
import { BlueprintFieldsService } from '../../services/blueprint-fields-service';

const ScanditIDScanner = dynamic(
  () => import('./ScanditIDScanner').then(mod => ({ default: mod.ScanditIDScanner })),
  { ssr: false }
);

export interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  regular_price: string;
  sale_price?: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
}

interface UnifiedSearchInputProps {
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  
  // Customer props
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  
  // Product props
  selectedProduct?: Product | null;
  onProductSelect?: (product: Product | null) => void;
  products?: Product[];
  productsLoading?: boolean;
  
  // Category props
  categories?: Category[] | undefined;
  selectedCategory?: string | undefined;
  onCategoryChange?: ((categorySlug: string | null) => void) | undefined;
  categoriesLoading?: boolean;
  
  // Audit props
  isAuditMode?: boolean;
  pendingAdjustments?: Map<string, number>;
  onCreateAudit?: () => void;
  onCreateAuditWithDetails?: (name: string, description?: string) => Promise<void>;
  onRemoveAdjustment?: (key: string) => void;
  onUpdateAdjustment?: (key: string, newValue: number) => void;
  isApplying?: boolean;
  
  // Purchase Order props
  isRestockMode?: boolean;
  pendingRestockProducts?: Map<string, number>;
  onCreatePurchaseOrder?: () => void;
  onCreatePurchaseOrderWithDetails?: (supplierName: string, notes?: string) => Promise<void>;
  onRemoveRestockProduct?: (key: string) => void;
  onUpdateRestockQuantity?: (key: string, newQuantity: number) => void;
  isCreatingPO?: boolean;
  
  // Blueprint field search props - supports multiple selections
  selectedBlueprintField?: string | null;
  onBlueprintFieldChange?: (fieldName: string | null, fieldValues: string[] | null) => void;
  blueprintFieldValues?: string[];
  
  // Mode control
  customerOnlyMode?: boolean; // When true, only shows customers, no categories or search
  productOnlyMode?: boolean; // When true, only shows products for blueprint view
  autoOpen?: boolean; // When true, automatically opens dropdown
}

export interface UnifiedSearchInputRef {
  openCustomerMode: () => void;
  openProductMode: () => void;
  openFilterMode: () => void;
  close: () => void;
}

// Component to display customer points
const CustomerPoints = ({ customerId }: { customerId: number }) => {
  const { data: pointsBalance, isLoading } = useUserPointsBalance(customerId);
  
  if (isLoading) {
    return <span className="text-xs text-neutral-500">Loading...</span>;
  }
  
  if (!pointsBalance) {
    return <span className="text-xs text-neutral-500">0 Points</span>;
  }
  
  const balance = pointsBalance as any;
  const pointsLabel = balance.points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = balance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span className="text-white text-xs font-medium bg-purple-600/40 px-2 py-0.5 rounded ml-2 border border-purple-500/30 transition-all duration-200">
      {balance.balance.toLocaleString()} {pointsUnit}
    </span>
  );
};

export const UnifiedSearchInput = forwardRef<UnifiedSearchInputRef, UnifiedSearchInputProps>(({
  searchValue,
  onSearchChange,
  placeholder = "Search products, customers, categories...",
  className = '',
  selectedCustomer,
  onCustomerSelect,
  selectedProduct,
  onProductSelect,
  products = [],
  productsLoading = false,
  categories = [],
  selectedCategory,
  onCategoryChange,
  categoriesLoading = false,
  selectedBlueprintField,
  onBlueprintFieldChange,
  blueprintFieldValues,
  isAuditMode = false,
  pendingAdjustments = new Map(),
  onCreateAudit,
  onCreateAuditWithDetails,
  onRemoveAdjustment,
  onUpdateAdjustment,
  isApplying = false,
  isRestockMode = false,
  pendingRestockProducts = new Map(),
  onCreatePurchaseOrder,
  onCreatePurchaseOrderWithDetails,
  onRemoveRestockProduct,
  onUpdateRestockQuantity,
  isCreatingPO = false,
  customerOnlyMode = false,
  productOnlyMode = false,
  autoOpen = false
}, ref) => {
  const [customers, setCustomers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [internalValue, setInternalValue] = useState(searchValue);
  const [customerSearchValue, setCustomerSearchValue] = useState(''); // Separate search for customer modal
  const [isCustomerMode, setIsCustomerMode] = useState(customerOnlyMode);
  const [isProductMode, setIsProductMode] = useState(productOnlyMode);
  const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard navigation
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [lastSearchValue, setLastSearchValue] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showIDScanner, setShowIDScanner] = useState(false);
  const [isBlueprintFieldMode, setIsBlueprintFieldMode] = useState(false);
  const [blueprintFieldSearchValue, setBlueprintFieldSearchValue] = useState('');
  const [selectedFieldForValues, setSelectedFieldForValues] = useState<string | null>(null);
  const [availableFieldValues, setAvailableFieldValues] = useState<{[key: string]: string[]}>({});
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    licenseNumber: ''
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search for performance
  const debouncedSearchValue = useDebounce(internalValue, 100);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openCustomerMode: () => {
      setIsCustomerMode(true);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openProductMode: () => {
      setIsProductMode(true);
      setIsCustomerMode(false);
      setIsEditingProduct(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openFilterMode: () => {
      setIsFilterOpen(true);
      setIsOpen(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
    },
    close: () => {
      setIsOpen(false);
      setIsFilterOpen(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsBlueprintFieldMode(false);
      setSelectedFieldForValues(null);
      setInternalValue('');
      setBlueprintFieldSearchValue('');
    }
  }));
  

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);
  
  // Load blueprint field data - fetch from WooCommerce since Flora IM doesn't include meta_data
  const loadBlueprintFieldsForProducts = useCallback(async () => {
    if (!products || products.length === 0) {
      console.log('⚠️ No products to extract blueprint fields from');
      setAvailableFieldValues({});
      return;
    }
    
    console.log('🔍 Fetching blueprint fields for', products.length, 'products from WooCommerce');
    
    const fieldValues: {[key: string]: Set<string>} = {
      effect: new Set(),
      lineage: new Set(),
      nose: new Set(),
      terpene: new Set(),
      strain_type: new Set(),
      thca_percentage: new Set(),
      supplier: new Set()
    };
    
    let foundBlueprintFields = 0;

    // Fetch a batch of products from WooCommerce with meta_data
    // Use first 100 products to avoid overwhelming API
    const productIds = products.slice(0, 100).map(p => p.id);
    
    try {
      // Fetch from WooCommerce in one call using include parameter
      const response = await fetch(`/api/proxy/woocommerce/products?include=${productIds.join(',')}&per_page=100`);
      
      if (!response.ok) {
        console.error('Failed to fetch products from WooCommerce:', response.statusText);
        setAvailableFieldValues({});
        return;
      }
      
      const wcProducts = await response.json();
      console.log(`✅ Fetched ${wcProducts.length} products from WooCommerce`);
      
      // Debug: Check first product's meta_data
      if (wcProducts.length > 0) {
        const firstProduct = wcProducts[0];
        console.log('🔬 First product meta_data sample:', {
          productId: firstProduct.id,
          productName: firstProduct.name,
          metaDataCount: firstProduct.meta_data?.length || 0,
          blueprintKeys: firstProduct.meta_data?.filter((m: any) => m.key?.includes('blueprint')).map((m: any) => m.key) || []
        });
      }
      
      // Extract blueprint fields from WooCommerce products
      wcProducts.forEach((product: any, index: number) => {
        if (product.meta_data && Array.isArray(product.meta_data)) {
          // Find V3 Native Flora Fields ONLY
          const blueprintMeta = product.meta_data.filter((meta: any) => 
            meta.key && meta.key.startsWith('_field_') // V3 Native format ONLY
          );
          
          if (index === 0 && blueprintMeta.length > 0) {
            console.log('🔬 First product blueprint fields:', blueprintMeta.map((m: any) => ({ key: m.key, value: m.value })));
          }
          
          blueprintMeta.forEach((meta: any) => {
            // Extract field name from V3 Native format
            let fieldName = meta.key;
            if (fieldName.startsWith('_field_')) {
              fieldName = fieldName.substring(7); // V3 Native: _field_effect -> effect
            }
            
            // Handle special case variations
            if (fieldName === 'effects') fieldName = 'effect';
            if (fieldName === 'thc_percentage') fieldName = 'thca_percentage';
            
            // Check if this is a field we're tracking
            if (fieldValues[fieldName] && meta.value) {
              const value = String(meta.value).trim();
              if (value !== '') {
                fieldValues[fieldName].add(value);
                foundBlueprintFields++;
              }
            }
          });
        }
      });
      
      console.log(`📊 Blueprint fields found: ${foundBlueprintFields} total field instances`);
      console.log('🔍 Field counts:', Object.keys(fieldValues).map(k => `${k}: ${fieldValues[k].size}`));
      
    } catch (error) {
      console.error('Error fetching blueprint fields from WooCommerce:', error);
      setAvailableFieldValues({});
      return;
    }
    
    // Convert Sets to sorted arrays
    const sortedFieldValues: {[key: string]: string[]} = {};
    Object.keys(fieldValues).forEach(field => {
      sortedFieldValues[field] = Array.from(fieldValues[field]).sort();
      if (sortedFieldValues[field].length > 0) {
        console.log(`✅ ${field}: ${sortedFieldValues[field].length} unique values`, sortedFieldValues[field].slice(0, 5));
      }
    });
    
    setAvailableFieldValues(sortedFieldValues);
  }, [products]);

  // Load blueprint fields when products change
  useEffect(() => {
    if (products && products.length > 0) {
      loadBlueprintFieldsForProducts();
    }
  }, [loadBlueprintFieldsForProducts]);

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(searchValue);
  }, [searchValue]);

  // Call search callback when debounced value changes - products only, no customers
  useEffect(() => {
    if (debouncedSearchValue !== searchValue && !isCustomerMode && !isProductMode) {
      onSearchChange(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearchChange, searchValue, isCustomerMode, isProductMode]);

  // Auto-open effect
  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
    
    // Auto-enable product mode for productOnlyMode
    if (productOnlyMode && !isProductMode) {
      setIsProductMode(true);
    }
  }, [autoOpen, productOnlyMode]);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const minWidth = (showNewCustomerForm || showIDScanner) ? 500 : 400; // Wider when form or scanner is shown
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, minWidth)
      });
    }
  }, [isOpen, showNewCustomerForm, showIDScanner]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        
        // Clear customer search from main search bar when clicking outside customer modal
        if (isCustomerMode) {
          setInternalValue('');
          setIsCustomerMode(false);
          setCustomerSearchValue('');
          // Also clear the main search value
          onSearchChange('');
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isCustomerMode, onSearchChange]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleFilterClickOutside(event: MouseEvent) {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node) &&
          filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleFilterClickOutside);
      return () => document.removeEventListener('mousedown', handleFilterClickOutside);
    }
  }, [isFilterOpen]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const usersData = await usersService.getUsers(true);
      const customersOnly = usersData.filter(user => user.roles.includes('customer'));
      setCustomers(customersOnly);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // For product-only mode, always enable product mode and open dropdown
    if (productOnlyMode) {
      setIsProductMode(true);
      if (!isOpen) {
        setIsOpen(true);
      }
    }
    
    // If we were showing a selected product and user starts typing, enter editing mode
    if (productOnlyMode && selectedProduct && !isEditingProduct) {
      setIsEditingProduct(true);
    }
    
    // Apple iOS Standard: Don't auto-open dropdown on typing
    // Only open if explicitly in a modal mode (customer/product selection)
    // Normal search typing should NOT trigger dropdowns
  };

  const handleInputFocus = () => {
    // Apple iOS Standard: Only open dropdown for explicit actions, never on focus
    
    // For product-only mode (blueprint-fields), open if explicitly needed
    if (productOnlyMode && !isProductMode) {
      setIsProductMode(true);
      setIsOpen(true);
      return;
    }
    
    // Don't auto-open for normal search - wait for explicit user action
  };

  const handleCustomerSelect = (customer: WordPressUser | null) => {
    onCustomerSelect?.(customer);
    setIsOpen(false);
    // Clear search and exit customer mode
    if (isCustomerMode) {
      setInternalValue('');
      setIsCustomerMode(false);
    }
  };

  const handleNewCustomerClick = () => {
    setShowNewCustomerForm(true);
    setShowIDScanner(false);
    setIsOpen(true); // Ensure dropdown stays open to show the form
    setIsCustomerMode(true); // Ensure we're in customer mode
  };


  // Function to find matching customer based on ID scan results
  const findMatchingCustomer = (result: IDScanResult): WordPressUser | null => {
    console.log('🔍 Searching for matching customer with data:', result);
    
    if (!customers || customers.length === 0) {
      console.log('📭 No customers loaded to match against');
      return null;
    }
    
    // Create normalized versions of scanned data for comparison
    const scannedFirstName = result.firstName?.trim().toLowerCase();
    const scannedLastName = result.lastName?.trim().toLowerCase();
    const scannedFullName = result.fullName?.trim().toLowerCase();
    const scannedLicenseNumber = result.licenseNumber?.trim().toLowerCase();
    
    console.log('🔍 Normalized scan data:', {
      scannedFirstName,
      scannedLastName,
      scannedFullName,
      scannedLicenseNumber
    });
    
    for (const customer of customers) {
      console.log(`🔍 Checking customer: ${customer.display_name || customer.name} (ID: ${customer.id})`);
      
      // Strategy 1: Match by first name + last name combination
      if (scannedFirstName && scannedLastName) {
        const customerDisplayName = (customer.display_name || customer.name || '').trim().toLowerCase();
        const customerName = customer.name?.trim().toLowerCase() || '';
        
        // Extract first and last names from display_name or name
        const displayNameParts = customerDisplayName.split(' ');
        const nameParts = customerName.split(' ');
        
        const customerFirstName = displayNameParts[0]?.toLowerCase() || nameParts[0]?.toLowerCase();
        const customerLastName = displayNameParts.slice(1).join(' ').toLowerCase() || 
                                nameParts.slice(1).join(' ').toLowerCase();
        
        // Exact first + last name match
        if (customerFirstName === scannedFirstName && customerLastName === scannedLastName) {
          console.log('✅ MATCH: First + Last name exact match');
          return customer;
        }
        
        // Full name match (scan full name vs customer display name)
        if (scannedFullName) {
          const normalizedCustomerDisplayName = customerDisplayName.replace(/\s+/g, ' ');
          const normalizedCustomerName = customerName.replace(/\s+/g, ' ');
          if (normalizedCustomerDisplayName === scannedFullName || normalizedCustomerName === scannedFullName) {
            console.log('✅ MATCH: Full name match');
            return customer;
          }
        }
        
        // Partial name match with high confidence (both first and last contain each other)
        if (customerFirstName && customerLastName &&
            customerFirstName.includes(scannedFirstName) && scannedFirstName.includes(customerFirstName) &&
            customerLastName.includes(scannedLastName) && scannedLastName.includes(customerLastName)) {
          console.log('✅ MATCH: High confidence partial name match');
          return customer;
        }
      }
      
      // Note: Email matching removed as IDScanResult doesn't typically contain email addresses
    }
    
    console.log('❌ No matching customer found');
    return null;
  };

  const handleIDScanResult = (result: IDScanResult) => {
    console.log('🎯 Processing ID scan result:', result);
    
    try {
      // First, try to match against existing customers
      const matchedCustomer = findMatchingCustomer(result);
      
      if (matchedCustomer) {
        console.log('🎉 Found matching customer:', matchedCustomer);
        console.log('🎯 AUTO-SELECTING existing customer for sale');
        // Automatically select the matched customer
        handleCustomerSelect(matchedCustomer);
        setShowIDScanner(false);
        return;
      }
      
      console.log('👤 No matching customer found, proceeding to new customer form');
    } catch (error) {
      console.error('❌ Error during customer matching:', error);
      console.log('🔄 Falling back to new customer form');
    }
    
    // Auto-fill the form with scanned data
    setNewCustomerData(prev => ({
      ...prev,
      firstName: result.firstName || prev.firstName,
      lastName: result.lastName || prev.lastName,
      email: prev.email, // Keep existing email if any
      phone: prev.phone, // Keep existing phone if any
      address: result.address || prev.address,
      city: result.city || prev.city,
      state: result.state || prev.state,
      zipCode: result.zipCode || prev.zipCode,
      dateOfBirth: result.dateOfBirth || prev.dateOfBirth,
      licenseNumber: result.licenseNumber || prev.licenseNumber
    }));
    
    console.log('✅ Updated customer data with ID scan results');
    
    // Switch to the form view with pre-filled data and ensure dropdown stays open
    setShowIDScanner(false);
    setShowNewCustomerForm(true);
    setIsOpen(true); // Ensure dropdown stays open to show the form
    setIsCustomerMode(true); // Ensure we're in customer mode
  };

  const handleCancelIDScanner = () => {
    setShowIDScanner(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.firstName.trim()) {
      return;
    }
    
    // Only require phone number if no email is provided (email will use default)
    if (!newCustomerData.email.trim() && !newCustomerData.phone.trim()) {
      return;
    }

    setIsCreatingCustomer(true);
    try {
      let username = '';
      if (newCustomerData.email.trim()) {
        username = newCustomerData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      } else if (newCustomerData.phone.trim()) {
        username = `user_${newCustomerData.phone.replace(/[^0-9]/g, '')}`;
      } else {
        username = `user_${Date.now()}`;
      }
      
      const billingAddress = {
        first_name: newCustomerData.firstName.trim(),
        last_name: newCustomerData.lastName.trim(),
        ...(newCustomerData.email.trim() && { email: newCustomerData.email.trim() }),
        ...(newCustomerData.phone.trim() && { phone: newCustomerData.phone.trim() }),
        address_1: newCustomerData.address,
        city: newCustomerData.city,
        state: newCustomerData.state,
        postcode: newCustomerData.zipCode,
        country: 'US'
      };

      const customerData = {
        email: newCustomerData.email.trim() || 'declinedemail@floradistro.com',
        first_name: newCustomerData.firstName.trim(),
        last_name: newCustomerData.lastName.trim(),
        username: username,
        password: Math.random().toString(36).slice(-8), // Generate random password
        billing: billingAddress,
        shipping: billingAddress, // Use same address for shipping
        meta_data: [
          ...(newCustomerData.dateOfBirth ? [{
            key: '_date_of_birth',
            value: newCustomerData.dateOfBirth
          }] : []),
          ...(newCustomerData.licenseNumber ? [{
            key: '_license_number',
            value: newCustomerData.licenseNumber
          }] : [])
        ]
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
      setNewCustomerData({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        address: '', 
        city: '', 
        state: '', 
        zipCode: '',
        dateOfBirth: '',
        licenseNumber: ''
      });
      setShowNewCustomerForm(false);
      setShowIDScanner(false); // Close ID scanner if it was open
      setIsOpen(false);
      
      if (isCustomerMode) {
        setInternalValue('');
        setIsCustomerMode(false);
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCancelNewCustomer = () => {
    setNewCustomerData({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      phone: '', 
      address: '', 
      city: '', 
      state: '', 
      zipCode: '',
      dateOfBirth: '',
      licenseNumber: ''
    });
    setShowNewCustomerForm(false);
    setShowIDScanner(false);
  };

  const handleProductSelect = (product: Product | null) => {
    onProductSelect?.(product);
    setIsOpen(false);
    
    // For product-only mode, show the selected product name in the input
    if (productOnlyMode && product) {
      setInternalValue(product.name);
      setLastSearchValue(product.name);
    } else {
      // Store the current search value before clearing
      if (internalValue) {
        setLastSearchValue(internalValue);
      }
      // Clear search when product is selected or cleared
      setInternalValue('');
    }
    
    // Exit editing mode when product is selected
    setIsEditingProduct(false);
    // Exit product mode if in explicit product mode (not product-only mode)
    if (isProductMode && !productOnlyMode) {
      setIsProductMode(false);
    }
  };

  const handleCategorySelect = (categorySlug: string | null) => {
    onCategoryChange?.(categorySlug);
    setIsOpen(false);
  };

  // Check if customer functionality is enabled - only in customer mode
  const customerEnabled = isCustomerMode;
  // Check if product functionality is enabled - in product mode OR when productOnlyMode is true
  const productEnabled = isProductMode || productOnlyMode;

  // Filter customers based on separate customer search (not main search)
  const filteredCustomers = useMemo(() => {
    if (!customerEnabled) return [];
    if (!customerSearchValue) return customers; // Show all customers when no search
    
    const query = customerSearchValue.toLowerCase();
    
    // Filter and rank customers
    const matches = customers.filter(customer => {
      const name = (customer.display_name || customer.name || '').toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      const username = customer.username?.toLowerCase() || '';
      const customerId = customer.id?.toString() || '';
      
      // Split query into words for better matching
      const queryWords = query.split(/\s+/).filter(word => word.length > 0);
      
      // Check if all query words match somewhere in customer data
      return queryWords.every(word => 
        name.includes(word) || 
        email.includes(word) || 
        username.includes(word) ||
        customerId.includes(word)
      );
    });

    // Sort by relevance: exact matches first, then partial matches
    return matches.sort((a, b) => {
      const aName = (a.display_name || a.name || '').toLowerCase();
      const bName = (b.display_name || b.name || '').toLowerCase();
      const aEmail = a.email?.toLowerCase() || '';
      const bEmail = b.email?.toLowerCase() || '';

      // Exact name match gets highest priority
      if (aName === query && bName !== query) return -1;
      if (bName === query && aName !== query) return 1;
      
      // Name starts with query gets second priority
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
      
      // Email exact match
      if (aEmail === query && bEmail !== query) return -1;
      if (bEmail === query && aEmail !== query) return 1;
      
      // Alphabetical fallback
      return aName.localeCompare(bName);
    });
  }, [customers, customerSearchValue, customerEnabled]);

  // Auto-select single customer result (Google-style)
  useEffect(() => {
    if (isCustomerMode && filteredCustomers.length === 1 && customerSearchValue.length > 2) {
      const singleCustomer = filteredCustomers[0];
      const customerName = (singleCustomer.display_name || singleCustomer.name || '').toLowerCase();
      const query = customerSearchValue.toLowerCase();
      
      // Auto-select if it's an exact match or very close match
      if (customerName === query || customerName.startsWith(query)) {
        setTimeout(() => {
          handleCustomerSelect(singleCustomer);
        }, 300); // Small delay to prevent accidental selection while typing
      }
    }
  }, [filteredCustomers, customerSearchValue, isCustomerMode, handleCustomerSelect]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredCustomers]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const selectedElement = document.querySelector(`[data-customer-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productEnabled) return [];
    
    // For product-only mode (blueprint-fields), show more products and don't require search
    if (productOnlyMode) {
      if (!debouncedSearchValue) return products.slice(0, 20); // Show first 20 when no search
      
      const query = debouncedSearchValue.toLowerCase();
      return products.filter(product => {
        const name = product.name.toLowerCase();
        const sku = product.sku.toLowerCase();
        const categories = product.categories?.map(cat => cat.name.toLowerCase()).join(' ') || '';
        return name.includes(query) || sku.includes(query) || categories.includes(query);
      }).slice(0, 20); // Show more results for product selection
    }
    
    // Default behavior for other modes
    if (!debouncedSearchValue) return products.slice(0, 8); // Show first 8 when no search
    
    const query = debouncedSearchValue.toLowerCase();
    return products.filter(product => {
      const name = product.name.toLowerCase();
      const sku = product.sku.toLowerCase();
      return name.includes(query) || sku.includes(query);
    }).slice(0, 8); // Limit results
  }, [products, debouncedSearchValue, productEnabled, productOnlyMode]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const activeCategories = categories.filter(cat => cat.count && cat.count > 0);
    if (!debouncedSearchValue) return activeCategories.slice(0, 8);
    
    const query = debouncedSearchValue.toLowerCase();
    return activeCategories.filter(category => 
      category.name.toLowerCase().includes(query)
    );
  }, [categories, debouncedSearchValue]);

  // Get display text for current selections
  const getDisplayText = () => {
    const parts = [];
    if (selectedCustomer) {
      parts.push(`${selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username}`);
    }
    if (selectedProduct) {
      parts.push(`${selectedProduct.name}`);
    }
    if (selectedCategory) {
      const category = categories.find(cat => cat.slug === selectedCategory);
      if (category) {
        parts.push(`${category.name}`);
      }
    }
    return parts.join(' • ');
  };

  const displayText = getDisplayText();
  const showFilters = displayText && !internalValue;
  const hasSelections = selectedProduct || selectedCategory;
  
  // In product-only mode, if a product is selected and not editing, show it and make input readonly
  const showProductSelection = productOnlyMode && selectedProduct && !internalValue && !isEditingProduct;
  
  // Debug logging for filter button visibility
  useEffect(() => {
    const shouldShowFilter = !isCustomerMode && !isProductMode && !productOnlyMode && categories !== undefined && onCategoryChange !== undefined;
    console.log('🔍 Filter button check:', {
      shouldShow: shouldShowFilter,
      categories: categories?.length,
      onCategoryChange: !!onCategoryChange,
      selectedCategory,
      selectedBlueprintField,
      blueprintFieldValues: blueprintFieldValues?.length
    });
  }, [categories, onCategoryChange, selectedCategory, selectedBlueprintField, blueprintFieldValues, isCustomerMode, isProductMode, productOnlyMode]);

  return (
    <>
      <div className={`relative flex items-center gap-2 ${className}`}>
        {/* Filter Button - Show when we have category functionality (products view) */}
        {!isCustomerMode && !isProductMode && !productOnlyMode && categories !== undefined && onCategoryChange !== undefined && (
          <button
            ref={filterButtonRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-[38px] px-3 rounded-lg border transition-all duration-200 ease-out flex items-center justify-center gap-1.5 relative ${
              selectedCategory || (selectedBlueprintField && blueprintFieldValues && blueprintFieldValues.length > 0)
                ? 'border-white/30 bg-white/10 text-white hover:bg-white/15'
                : 'border-neutral-500/30 hover:border-neutral-400/50 text-neutral-400 hover:text-neutral-300 bg-transparent hover:bg-neutral-600/10'
            }`}
            title="Filter products by category or blueprint fields"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            {(selectedCategory || (selectedBlueprintField && blueprintFieldValues && blueprintFieldValues.length > 0)) && (
              <>
                <span className="text-xs font-medium">
                  {selectedCategory ? 'Category' : `${blueprintFieldValues?.length || 0}`}
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-neutral-900"></span>
              </>
            )}
          </button>
        )}
        
        <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder=""
          style={{ fontFamily: 'Tiempos, serif' }}
          value={showProductSelection ? selectedProduct.name : internalValue}
          readOnly={showProductSelection || false}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full h-[42px] bg-white/5 hover:bg-white/10 rounded-xl focus:outline-none text-sm text-center transition-all duration-200 ease-out min-w-0 px-3 pr-10 text-neutral-300"
        />
        
        {/* Search Icon - Always visible on the right */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Clear filters button - normal mode (only for product/category when no customer selected) */}
        {!isCustomerMode && !isProductMode && !selectedCustomer && (selectedProduct || selectedCategory) && !internalValue && (
          <button
            onClick={() => {
              handleProductSelect(null);
              handleCategorySelect(null);
              // Don't focus input to prevent dropdown from opening
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Clear filters"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Clear customer mode button */}
        {isCustomerMode && (
          <button
            onClick={() => {
              setIsCustomerMode(false);
              setIsOpen(false);
              setInternalValue('');
              setCustomerSearchValue('');
              onSearchChange('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Exit customer mode"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Clear product mode button */}
        {isProductMode && (
          <button
            onClick={() => {
              setIsProductMode(false);
              setIsOpen(false);
              setInternalValue('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Exit product mode"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Clear selected product in product-only mode */}
        {showProductSelection && (
          <button
            onClick={() => {
              handleProductSelect(null);
              setIsEditingProduct(false);
              setLastSearchValue('');
              // Don't focus input to prevent dropdown from opening
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Clear product selection"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}


        </div>
      </div>

      {/* Simple Dropdown for Product-Only Mode */}
      {isOpen && productOnlyMode && dropdownPosition && (
        <div 
          className="fixed rounded-2xl overflow-hidden shadow-2xl z-50 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08]"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: '400px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Product Search Results */}
          <div className="max-h-96 overflow-y-auto px-2 py-2">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full px-3 py-2.5 text-left rounded-lg transition-all duration-200 mb-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90"
                >
                  <div className="flex items-center gap-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {product.name}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
                        <span>{product.sku}</span>
                        {product.categories?.[0] && (
                          <>
                            <span>•</span>
                            <span className="lowercase">{product.categories[0].name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-neutral-500">
                      ${parseFloat(product.regular_price || '0').toFixed(2)}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-neutral-500 text-xs font-mono lowercase">
                {productsLoading ? 'loading...' : 'no products found'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Popout - Only for Customer/Audit/Restock Modes */}
      {isOpen && !productOnlyMode && isCustomerMode && typeof document !== 'undefined' && ReactDOM.createPortal(
        (() => {
          return (
            <>
              {/* Enhanced Glass Overlay */}
              <div 
                className="fixed inset-0 transition-all duration-500"
                style={{ 
                  zIndex: 99998,
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(8px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(120%)'
                }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Apple 2035 Customer Modal */}
              <div 
                ref={dropdownRef}
                className="fixed rounded-2xl overflow-hidden shadow-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08]"
                style={{ 
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(90vw, 800px)',
                  height: 'min(80vh, 700px)',
                  zIndex: 99999,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Customers Section - Only show if not in product-only mode */}
          {!productOnlyMode && (isCustomerMode || filteredCustomers.length > 0) && (
            <>
              <div className="px-6 py-4 border-b border-white/5 relative">
                {/* Close button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (isCustomerMode) {
                      setInternalValue('');
                      setIsCustomerMode(false);
                      setCustomerSearchValue('');
                      onSearchChange('');
                    }
                  }}
                  className="absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-300 flex items-center justify-center active:scale-95"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex items-center justify-center gap-2">
                  {/* Customer Search Bar */}
                  <div className="flex-1 flex items-center justify-center max-w-[500px]">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder=""
                        value={customerSearchValue}
                        onChange={(e) => setCustomerSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsOpen(false);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedIndex(prev => Math.max(prev - 1, -1));
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
                              handleCustomerSelect(filteredCustomers[selectedIndex]);
                            } else if (filteredCustomers.length === 1) {
                              handleCustomerSelect(filteredCustomers[0]);
                            }
                          }
                        }}
                        className="w-full h-[42px] bg-white/5 hover:bg-white/10 rounded-xl focus:bg-white/10 focus:outline-none text-sm text-center transition-all duration-300 ease-out text-neutral-300 pr-10"
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scan ID button */}
                <button
                  onClick={() => {
                    setShowIDScanner(true);
                    setShowNewCustomerForm(false);
                    setIsOpen(true);
                    setIsCustomerMode(true);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 right-4 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-300 flex items-center justify-center active:scale-95"
                  title="Scan ID"
                >
                  <span className="text-xs font-mono font-medium lowercase">scan</span>
                </button>
              </div>
              
              <div className={`flex flex-col overflow-hidden ${showIDScanner ? 'h-[700px]' : 'max-h-[45rem]'}`}>
                {/* Fixed Top Section - ID Scanner or New Customer Form */}
                {(showIDScanner || showNewCustomerForm) && (
                  <div className="flex-shrink-0 h-full">
                    {showIDScanner ? (
                      <div className="px-4 py-4 border-b border-neutral-500/20 h-full">
                        <ScanditIDScanner
                          onScanResult={handleIDScanResult}
                          onCancel={handleCancelIDScanner}
                        />
                      </div>
                    ) : (
                      <div className="px-6 py-4 border-b border-white/5">
                        <div className="mb-3">
                          <h3 className="text-xs font-mono text-neutral-500 lowercase tracking-wider">new customer</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="first name"
                              value={newCustomerData.firstName}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                            <input
                              type="text"
                              placeholder="last name"
                              value={newCustomerData.lastName}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="email"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                          />
                          <input
                            type="tel"
                            placeholder="phone"
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                          />
                          <div className="text-[10px] font-mono text-neutral-600 text-center lowercase">
                            email or phone required
                          </div>
                          <input
                            type="text"
                            placeholder="address"
                            value={newCustomerData.address}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="city"
                              value={newCustomerData.city}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                            <input
                              type="text"
                              placeholder="state"
                              value={newCustomerData.state}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, state: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                            <input
                              type="text"
                              placeholder="zip"
                              value={newCustomerData.zipCode}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, zipCode: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              placeholder="date of birth"
                              value={newCustomerData.dateOfBirth}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                            <input
                              type="text"
                              placeholder="license number"
                              value={newCustomerData.licenseNumber}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white placeholder-neutral-500 focus:bg-white/10 focus:outline-none text-sm font-mono transition-all duration-300"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleCancelNewCustomer}
                              disabled={isCreatingCustomer}
                              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl text-xs font-mono font-medium transition-all duration-300 disabled:opacity-50 active:scale-95 lowercase"
                            >
                              cancel
                            </button>
                            <button
                              onClick={handleCreateCustomer}
                              disabled={isCreatingCustomer || !newCustomerData.firstName.trim() || (!newCustomerData.email.trim() && !newCustomerData.phone.trim())}
                              className="flex-1 px-4 py-2.5 bg-neutral-200 hover:bg-neutral-100 disabled:bg-white/5 text-neutral-900 disabled:text-neutral-600 rounded-xl text-xs font-mono font-bold transition-all duration-300 flex items-center justify-center active:scale-95 lowercase"
                            >
                              {isCreatingCustomer ? 'creating...' : 'create'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Header Options */}
                {!showIDScanner && !showNewCustomerForm && (
                  <div className="flex-shrink-0 border-b border-white/5">
                    {/* New Customer and Guest Customer Buttons in One Row */}
                    <div className="flex gap-2 px-6 py-4">
                      {/* New Customer Button */}
                      <button
                        onClick={handleNewCustomerClick}
                        className="flex-1 px-4 py-3 text-xs font-mono font-medium transition-all flex items-center justify-center text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl duration-300 active:scale-95 lowercase"
                      >
                        new customer
                      </button>

                      {/* Guest Customer Button */}
                      <button
                        onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
                        className="flex-1 px-4 py-3 text-xs font-mono font-medium transition-all flex items-center justify-center text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl duration-300 active:scale-95 lowercase"
                      >
                        guest
                      </button>
                    </div>
                  </div>
                )}

                {/* Scrollable Customer List - Hide when scanner is active */}
                {!showIDScanner && (
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 px-4 py-2">
                    {filteredCustomers.length > 0 ? (
                      <>
                      {/* Customer List */}
                      {filteredCustomers.map((customer, index) => (
                        <button
                          key={customer.id}
                          data-customer-index={index}
                          onClick={() => handleCustomerSelect(customer)}
                          className={`w-full px-4 py-3 text-left transition-all flex items-center justify-between rounded-xl mb-2 duration-300 ${
                            selectedCustomer?.id === customer.id
                              ? 'bg-white/10 text-white'
                              : index === selectedIndex
                              ? 'bg-white/10 text-white'
                              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium mb-0.5 truncate">
                                {customer.display_name || customer.name || customer.username}
                              </div>
                              <div className="text-xs font-mono text-neutral-500 truncate">
                                {customer.email || 'No email'}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <CustomerPoints customerId={customer.id} />
                            </div>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <svg className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center text-neutral-500 text-xs font-mono lowercase">
                        {(isCustomerMode ? customerSearchValue : debouncedSearchValue) ? 'no customers found' : 'no customers available'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Products Section */}
          {(isProductMode || filteredProducts.length > 0) && (
            <>
              {!productOnlyMode && !isProductMode && filteredCustomers.length > 0 && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              {/* Products Header with Search */}
              <div className="px-4 py-4 border-b border-white/5 relative" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                {/* Close button - Only show if in product-only mode */}
                {productOnlyMode && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-neutral-600/50 hover:border-neutral-400/70 bg-transparent hover:bg-neutral-600/10 text-neutral-400 hover:text-neutral-200 transition-all duration-300 flex items-center justify-center"
                    title="Close"
                    style={{ left: '8px' }}
                  >
                    <span className="text-lg font-medium tracking-wide" style={{ fontFamily: 'Tiempos, serif' }}>
                      ×
                    </span>
                  </button>
                )}
                
                <div className="flex items-center justify-center gap-2">
                  {/* Product Search Bar - Floating style */}
                  <div className="flex-1 flex items-center justify-center max-w-[500px]">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsOpen(false);
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            // Add keyboard navigation for products if needed
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            // Add keyboard navigation for products if needed
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredProducts.length === 1) {
                              handleProductSelect(filteredProducts[0]);
                            }
                          }
                        }}
                        className="w-full h-[38px] bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg placeholder-neutral-500 focus:placeholder-transparent focus:bg-neutral-600/15 focus:outline-none text-sm text-center placeholder:text-center transition-all duration-200 ease-out text-neutral-400"
                        style={{ fontFamily: 'Tiempos, serif' }}
                        autoFocus={productOnlyMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Full Height Products List */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: productOnlyMode ? 'calc(100vh - 200px)' : '400px' }}>
                <div className="py-2">
                  {/* Clear Product Selection */}
                  <button
                    onClick={() => handleProductSelect(null)}
                    className={`w-full px-4 py-3 text-left text-sm transition-all flex items-center justify-between group hover:bg-neutral-600/5 ${
                      !selectedProduct
                        ? 'bg-neutral-600/10 text-neutral-200 border-l-2 border-blue-400'
                        : 'text-neutral-400 hover:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
                      <span style={{ fontFamily: 'Tiempos, serif' }}>No Product Selected</span>
                    </div>
                    {!selectedProduct && <span className="text-xs text-blue-400">✓</span>}
                  </button>

                  {/* Product List */}
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`w-full px-4 py-3 text-left text-sm transition-all flex items-center justify-between group hover:bg-neutral-600/5 ${
                        selectedProduct?.id === product.id
                          ? 'bg-neutral-600/10 text-neutral-200 border-l-2 border-blue-400'
                          : 'text-neutral-400 hover:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                            {product.name}
                          </div>
                          {product.categories && product.categories.length > 0 && (
                            <div className="text-xs text-neutral-500 truncate mt-0.5">
                              {product.categories[0].name}
                            </div>
                          )}
                          {product.sku && (
                            <div className="text-xs text-neutral-600 truncate mt-0.5">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {product.regular_price && (
                          <span className="text-xs text-neutral-500">
                            ${product.regular_price}
                          </span>
                        )}
                        {selectedProduct?.id === product.id && (
                          <span className="text-xs text-blue-400">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {/* No products found message */}
                  {filteredProducts.length === 0 && searchValue && (
                    <div className="px-4 py-8 text-center text-neutral-500">
                      <div className="text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
                        No products found for "{searchValue}"
                      </div>
                      <div className="text-xs mt-1 text-neutral-600">
                        Try adjusting your search terms
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}




          {/* No results */}
          {filteredCustomers.length === 0 && filteredProducts.length === 0 && (isCustomerMode ? customerSearchValue : debouncedSearchValue) && (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">
              <div className="mb-4">
                {isCustomerMode 
                  ? `No customers found for "${customerSearchValue}"`
                  : isProductMode || productOnlyMode
                  ? `No products found for "${debouncedSearchValue}"`
                  : `No customers or products found for "${debouncedSearchValue}"`
                }
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Clear customer search from main search bar when closing
                  if (isCustomerMode) {
                    setInternalValue('');
                    setIsCustomerMode(false);
                    setCustomerSearchValue('');
                    onSearchChange('');
                  }
                }}
                className="px-4 py-2 bg-neutral-600/20 hover:bg-neutral-600/40 text-neutral-300 rounded-lg text-xs transition-colors"
              >
                Close Search
              </button>
            </div>
          )}
              </div>
            </>
          );
        })(),
        document.body
      )}

      {/* Filter Modal */}
      {isFilterOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={filterDropdownRef}
          className="fixed rounded-2xl overflow-hidden shadow-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08]"
          style={{ 
            top: filterButtonRef.current ? filterButtonRef.current.getBoundingClientRect().bottom + 8 : '50%',
            left: filterButtonRef.current ? filterButtonRef.current.getBoundingClientRect().left : '50%',
            width: 'min(90vw, 400px)',
            maxHeight: 'min(70vh, 600px)',
            zIndex: 99999,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Categories Section */}
          {filteredCategories.length > 0 && (
            <div className="py-2 px-1">
              <div className="text-[10px] text-white/40 mb-2 px-3 uppercase tracking-wider font-medium">Categories</div>
              
              <div className="space-y-0.5 max-h-64 overflow-y-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
              }}>
                {/* All Categories Option */}
                <button
                  onClick={() => {
                    handleCategorySelect(null);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                    !selectedCategory
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                  }`}
                >
                  <span className="text-xs font-medium">All Categories</span>
                  {!selectedCategory && (
                    <svg className="ml-auto w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Category List */}
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategorySelect(category.slug);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                      selectedCategory === category.slug
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                    }`}
                  >
                    <span className="text-xs font-medium flex-1">{category.name}</span>
                    <div className="flex items-center gap-2">
                      {category.count && (
                        <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                          {category.count}
                        </span>
                      )}
                      {selectedCategory === category.slug && (
                        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blueprint Fields Section */}
          {filteredCategories.length > 0 && (
            <div className="border-t border-neutral-700/50 my-1" />
          )}
          <div className="py-2 px-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                Blueprint Fields
              </div>
              {selectedBlueprintField && blueprintFieldValues && blueprintFieldValues.length > 0 && !selectedFieldForValues && (
                <button
                  onClick={() => {
                    if (onBlueprintFieldChange) {
                      onBlueprintFieldChange(null, null);
                    }
                  }}
                  className="px-3 py-2 -mr-2 text-[11px] text-white/60 hover:text-white font-medium transition-all duration-150 rounded-lg hover:bg-white/5 active:scale-95"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Active Filters Indicator */}
            {selectedBlueprintField && blueprintFieldValues && blueprintFieldValues.length > 0 && !selectedFieldForValues && (
              <div className="mx-1 mb-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                    {[
                      { key: 'effect', label: 'Effect' },
                      { key: 'lineage', label: 'Lineage' },
                      { key: 'nose', label: 'Nose' },
                      { key: 'terpene', label: 'Terpene' },
                      { key: 'strain_type', label: 'Strain Type' },
                      { key: 'thca_percentage', label: 'THCA %' },
                      { key: 'supplier', label: 'Supplier' }
                    ].find(f => f.key === selectedBlueprintField)?.label}
                  </div>
                  <span className="text-[10px] text-white/40 font-medium">
                    {blueprintFieldValues.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blueprintFieldValues?.map((value, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (onBlueprintFieldChange && blueprintFieldValues) {
                          const newValues = blueprintFieldValues.filter(v => v !== value);
                          onBlueprintFieldChange(
                            selectedBlueprintField,
                            newValues.length > 0 ? newValues : null
                          );
                        }
                      }}
                      className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-all duration-150 active:scale-95 min-h-[36px]"
                      title="Tap to remove"
                    >
                      <span className="text-xs text-white/90 font-medium">
                        {value}
                      </span>
                      <svg className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show field selection or field values */}
            {!selectedFieldForValues ? (
              /* Blueprint Field Options */
              <div className="space-y-0.5">
                {[
                  { key: 'effect', label: 'Effect' },
                  { key: 'lineage', label: 'Lineage' },
                  { key: 'nose', label: 'Nose' },
                  { key: 'terpene', label: 'Terpene' },
                  { key: 'strain_type', label: 'Strain Type' },
                  { key: 'thca_percentage', label: 'THCA %' },
                  { key: 'supplier', label: 'Supplier' }
                ].map((field) => {
                  const isActive = selectedBlueprintField === field.key;
                  const hasSelections = isActive && blueprintFieldValues && blueprintFieldValues.length > 0;
                  return (
                    <button
                      key={field.key}
                      onClick={() => {
                        setSelectedFieldForValues(field.key);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                        isActive
                          ? 'bg-white/10 border border-white/20 text-white'
                          : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                      }`}
                    >
                      <span className="flex-1 text-xs font-medium">
                        {field.label}
                        <span className={`ml-2 text-[10px] ${isActive ? 'text-white/60' : 'text-white/50'}`}>
                          ({availableFieldValues[field.key]?.length || 0})
                        </span>
                        {hasSelections && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white">
                            {blueprintFieldValues?.length || 0}
                          </span>
                        )}
                      </span>
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white/80' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Field Values List with Full Height Scrolling */
              <div className="flex flex-col" style={{ height: '400px' }}>
                {/* Back button - Fixed at top */}
                <div className="px-3 py-2 border-b border-neutral-700/50 mb-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedFieldForValues(null)}
                      className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-xs font-medium">
                        {[
                          { key: 'effect', label: 'Effect' },
                          { key: 'lineage', label: 'Lineage' },
                          { key: 'nose', label: 'Nose' },
                          { key: 'terpene', label: 'Terpene' },
                          { key: 'strain_type', label: 'Strain Type' },
                          { key: 'thca_percentage', label: 'THCA %' },
                          { key: 'supplier', label: 'Supplier' }
                        ].find(f => f.key === selectedFieldForValues)?.label || 'Back to Fields'}
                      </span>
                    </button>
                    <span className="text-[10px] text-white/40 font-medium">
                      {availableFieldValues[selectedFieldForValues]?.length || 0}
                    </span>
                  </div>
                </div>
                
                {/* Scrollable Field Values Container - Uses full available height */}
                <div className="overflow-y-auto flex-1 space-y-0.5 px-1" style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                }}>
                  {availableFieldValues[selectedFieldForValues]?.length > 0 ? (
                    <>
                      {availableFieldValues[selectedFieldForValues].map((value, index) => {
                        const isSelected = selectedBlueprintField === selectedFieldForValues && blueprintFieldValues && blueprintFieldValues.includes(value);
                        return (
                          <button
                            key={`${selectedFieldForValues}-${index}`}
                            onClick={() => {
                              if (onBlueprintFieldChange) {
                                // Toggle selection - don't close dropdown
                                const currentValues = selectedBlueprintField === selectedFieldForValues && blueprintFieldValues ? blueprintFieldValues : [];
                                const newValues = isSelected
                                  ? currentValues.filter(v => v !== value)
                                  : [...currentValues, value];
                                
                                onBlueprintFieldChange(
                                  selectedFieldForValues,
                                  newValues.length > 0 ? newValues : null
                                );
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
                              isSelected
                                ? 'bg-white/15 border border-white/30 text-white'
                                : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                            }`}
                          >
                            <span className="text-xs font-medium flex-1 truncate">
                              {value}
                            </span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                      
                      {/* Clear Filter Option at Bottom - Only show if values are selected */}
                      {selectedBlueprintField === selectedFieldForValues && blueprintFieldValues && blueprintFieldValues.length > 0 && (
                        <>
                          <div className="border-t border-neutral-700/50 my-3 mx-1" />
                          <button
                            onClick={() => {
                              if (onBlueprintFieldChange) {
                                onBlueprintFieldChange(null, null);
                              }
                              setSelectedFieldForValues(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg transition-all duration-200 ease-out mx-1 text-white/60 hover:bg-white/10 hover:text-white active:scale-98 min-h-[44px]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium">Clear All ({blueprintFieldValues?.length || 0})</span>
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-xs text-white/50 text-center space-y-2">
                      <p>No values found for this field</p>
                      <p className="text-[10px] text-neutral-600">
                        Debug: {availableFieldValues[selectedFieldForValues]?.length || 0} values loaded
                      </p>
                      <p className="text-[10px] text-neutral-600">
                        Total fields tracked: {Object.keys(availableFieldValues).length}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

UnifiedSearchInput.displayName = 'UnifiedSearchInput';
