'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { WordPressUser, usersService } from '../../services/users-service';
import { useUserPointsBalance } from '../../hooks/useRewards';
import { useDebounce } from '../../hooks/useDebounce';
import { ScanditIDScanner, IDScanResult } from './ScanditIDScanner';
import { BlueprintFieldsService } from '../../services/blueprint-fields-service';

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
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categorySlug: string | null) => void;
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
  
  // Blueprint field search props
  selectedBlueprintField?: string | null;
  onBlueprintFieldChange?: (fieldName: string | null, fieldValue: string | null) => void;
  blueprintFieldValue?: string | null;
  
  // Mode control
  customerOnlyMode?: boolean; // When true, only shows customers, no categories or search
  productOnlyMode?: boolean; // When true, only shows products for blueprint view
  autoOpen?: boolean; // When true, automatically opens dropdown
}

export interface UnifiedSearchInputRef {
  openCustomerMode: () => void;
  openProductMode: () => void;
  openAuditMode: () => void;
  openPurchaseOrderMode: () => void;
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
  
  const [singular, plural] = pointsBalance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = pointsBalance.balance === 1 ? singular : plural;
  
  return (
    <span className="text-white text-xs font-medium bg-purple-600/40 px-2 py-0.5 rounded ml-2 border border-purple-500/30 transition-all duration-200">
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
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
  blueprintFieldValue,
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
  const [isAuditDropdownMode, setIsAuditDropdownMode] = useState(false);
  const [auditName, setAuditName] = useState('');
  const [auditDescription, setAuditDescription] = useState('');
  const [editingAdjustment, setEditingAdjustment] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isPurchaseOrderMode, setIsPurchaseOrderMode] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [poNotes, setPONotes] = useState('');
  const [editingRestockProduct, setEditingRestockProduct] = useState<string | null>(null);
  const [editRestockValue, setEditRestockValue] = useState<string>('');
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
      setIsAuditDropdownMode(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openProductMode: () => {
      setIsProductMode(true);
      setIsCustomerMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openAuditMode: () => {
      setIsAuditDropdownMode(true);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsPurchaseOrderMode(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
      setAuditName('');
      setAuditDescription('');
    },
    openPurchaseOrderMode: () => {
      setIsPurchaseOrderMode(true);
      setIsAuditDropdownMode(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsFilterOpen(false);
      setIsOpen(true);
      setInternalValue('');
      setSupplierName('');
      setPONotes('');
    },
    openFilterMode: () => {
      setIsFilterOpen(true);
      setIsOpen(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsPurchaseOrderMode(false);
    },
    close: () => {
      setIsOpen(false);
      setIsFilterOpen(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsPurchaseOrderMode(false);
      setIsBlueprintFieldMode(false);
      setSelectedFieldForValues(null);
      setInternalValue('');
      setAuditName('');
      setAuditDescription('');
      setBlueprintFieldSearchValue('');
    }
  }));
  

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);
  
  // Load blueprint field data using optimized approach
  const loadBlueprintFieldsForProducts = useCallback(async () => {
    if (!products || products.length === 0) return;
    
    console.log('🔍 Loading blueprint fields for', products.length, 'products');
    
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

    // If we have a selected category, use category-based fetching for better efficiency
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(cat => cat.slug === selectedCategory);
      if (category) {
        console.log(`🎯 Using category-based fetching for category: ${category.name} (ID: ${category.id})`);
        try {
          const categoryProducts = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
          
          categoryProducts.forEach(productFields => {
            productFields.fields.forEach(field => {
              if (fieldValues[field.field_name] && field.field_value && 
                  typeof field.field_value === 'string' && field.field_value.trim() !== '') {
                fieldValues[field.field_name].add(field.field_value.trim());
                foundBlueprintFields++;
              }
            });
          });
        } catch (error) {
          console.error('Error fetching category blueprint fields:', error);
          // Fall back to individual product fetching
        }
      }
    }

    // If category-based fetching didn't work or no category selected, fall back to product-based fetching
    if (foundBlueprintFields === 0) {
      console.log('🔄 Using product-based fetching');
      
      // Process products in smaller batches to avoid overwhelming the API
      const batchSize = 25;
      const maxProducts = Math.min(products.length, 100); // Limit total products to avoid long loading times
      const totalBatches = Math.ceil(maxProducts / batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, maxProducts);
        const batchProducts = products.slice(startIndex, endIndex);
        
        console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (${batchProducts.length} products)`);
        
        // Fetch blueprint fields for each product in this batch
        const promises = batchProducts.map(async (product) => {
          try {
            const productFields = await BlueprintFieldsService.getProductBlueprintFields(product.id);
            
            if (productFields && productFields.fields) {
              productFields.fields.forEach(field => {
                if (fieldValues[field.field_name] && field.field_value && 
                    typeof field.field_value === 'string' && field.field_value.trim() !== '') {
                  fieldValues[field.field_name].add(field.field_value.trim());
                  foundBlueprintFields++;
                }
              });
            }
            
            return productFields;
          } catch (error) {
            console.error(`Error loading blueprint fields for product ${product.id}:`, error);
            return null;
          }
        });
        
        await Promise.all(promises);
        
        // Add a small delay between batches to respect rate limits
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    }
    
    console.log(`📊 Blueprint fields found: ${foundBlueprintFields} across ${products.length} products`);
    
    // Convert Sets to sorted arrays
    const sortedFieldValues: {[key: string]: string[]} = {};
    Object.keys(fieldValues).forEach(field => {
      sortedFieldValues[field] = Array.from(fieldValues[field]).sort();
      if (sortedFieldValues[field].length > 0) {
        console.log(`✅ ${field}: ${sortedFieldValues[field].length} values`, sortedFieldValues[field]);
      }
    });
    
    setAvailableFieldValues(sortedFieldValues);
  }, [products, selectedCategory, categories]);

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
  }, [autoOpen]);

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
    
    // If we were showing a selected product and user starts typing, enter editing mode
    if (productOnlyMode && selectedProduct && !isEditingProduct) {
      setIsEditingProduct(true);
    }
    
    // Only open dropdown when typing if we're in a specific mode that shows content
    if (!isOpen && newValue.length > 0 && (isCustomerMode || isProductMode || productOnlyMode)) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    // If in restock mode with pending products, open purchase order mode
    if (isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0 && !isPurchaseOrderMode) {
      setIsPurchaseOrderMode(true);
      setIsOpen(true);
      return;
    }
    
    // If in audit mode with pending adjustments, open audit mode
    if (isAuditMode && pendingAdjustments && pendingAdjustments.size > 0 && !isAuditDropdownMode) {
      setIsAuditDropdownMode(true);
      setIsOpen(true);
      return;
    }
    
    // If in product-only mode with selected product, enter editing mode and restore last search
    if (productOnlyMode && selectedProduct && !internalValue && !isEditingProduct) {
      setIsEditingProduct(true);
      // Restore the last search value so user can continue where they left off
      if (lastSearchValue) {
        setInternalValue(lastSearchValue);
      }
      setIsOpen(true);
      return;
    }
    
    // Only open dropdown if we're in a specific mode that shows content
    if (isCustomerMode || isProductMode || productOnlyMode) {
      setIsOpen(true);
    }
    // For normal product view, don't open dropdown - use filter button instead
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
        ...(newCustomerData.email.trim() && { email: newCustomerData.email.trim() }),
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
    // Store the current search value before clearing
    if (internalValue) {
      setLastSearchValue(internalValue);
    }
    // Clear search when product is selected or cleared
    setInternalValue('');
    // Exit editing mode when product is selected
    setIsEditingProduct(false);
    // Exit product mode if in explicit product mode (not product-only mode)
    if (isProductMode) {
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
    if (!debouncedSearchValue) return products.slice(0, 8); // Show first 8 when no search
    
    const query = debouncedSearchValue.toLowerCase();
    return products.filter(product => {
      const name = product.name.toLowerCase();
      const sku = product.sku.toLowerCase();
      return name.includes(query) || sku.includes(query);
    }).slice(0, 8); // Limit results
  }, [products, debouncedSearchValue, productEnabled]);

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
  const hasSelections = selectedCustomer || selectedProduct || selectedCategory;
  
  // In product-only mode, if a product is selected and not editing, show it and make input readonly
  const showProductSelection = productOnlyMode && selectedProduct && !internalValue && !isEditingProduct;
  

  return (
    <>
      <div className={`relative flex items-center gap-2 ${className}`}>
        {/* Filter Button - Only show in products view */}
        {!isCustomerMode && !isProductMode && !productOnlyMode && !isAuditDropdownMode && !isPurchaseOrderMode && (
          <button
            ref={filterButtonRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-[38px] px-3 rounded-lg border transition-all duration-200 ease-out flex items-center justify-center ${
              selectedCategory || selectedBlueprintField
                ? 'border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/15'
                : 'border-neutral-500/30 hover:border-neutral-400/50 text-neutral-400 hover:text-neutral-300 bg-transparent hover:bg-neutral-600/10'
            }`}
            title="Filter products by category or blueprint fields"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            {(selectedCategory || selectedBlueprintField) && (
              <div className="ml-1 w-2 h-2 bg-pink-400 rounded-full"></div>
            )}
          </button>
        )}
        
        <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isAuditDropdownMode 
              ? `Create audit with ${pendingAdjustments?.size || 0} adjustments...`
              : isPurchaseOrderMode
                ? `Create purchase order with ${pendingRestockProducts?.size || 0} products...`
              : isCustomerMode 
                ? "Search customers..." 
                : (isProductMode || productOnlyMode) 
                  ? "Search products..." 
                  : placeholder
          }
          style={{ 
            fontFamily: 'Tiempos, serif',
            ...(showProductSelection) ? { textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' } : {},
            ...(isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0) ? { 
              boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.2), 0 0 40px rgba(34, 197, 94, 0.1)' 
            } : {},
            ...(isAuditMode && pendingAdjustments && pendingAdjustments.size > 0) ? { 
              boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.2), 0 0 40px rgba(168, 85, 247, 0.1)' 
            } : {},
            ...(hasSelections && !(isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0) && !(isAuditMode && pendingAdjustments && pendingAdjustments.size > 0)) ? { 
              boxShadow: '0 0 0 1px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.2), 0 0 40px rgba(236, 72, 153, 0.1)' 
            } : {}
          }}
          value={showProductSelection ? selectedProduct.name : internalValue}
          readOnly={showProductSelection || false}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={(e) => {
            // If in restock mode with pending products, open purchase order mode on click
            if (isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0 && !isPurchaseOrderMode) {
              e.preventDefault();
              setIsPurchaseOrderMode(true);
              setIsOpen(true);
            }
          }}
          className={`w-full h-[38px] bg-transparent hover:bg-neutral-600/10 rounded-lg placeholder-neutral-400 focus:bg-neutral-600/10 focus:outline-none text-sm text-center placeholder:text-center transition-all duration-200 ease-out min-w-0 ${
            showProductSelection
              ? 'text-neutral-200 font-medium'
              : isAuditDropdownMode
                ? 'text-neutral-300 font-medium'
                : isPurchaseOrderMode
                  ? 'text-neutral-300 font-medium'
                  : 'text-neutral-400'
          } ${
            isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0
              ? 'border-2 border-green-500/30 bg-green-500/10 cursor-pointer'
              : isAuditMode && pendingAdjustments && pendingAdjustments.size > 0
                ? 'border-2 border-purple-500/30 bg-purple-500/10 cursor-pointer'
              : hasSelections 
                ? 'border-2 border-pink-500/30 bg-pink-500/10' 
                : 'border border-neutral-500/30 hover:border-neutral-400/50 focus:border-neutral-300'
          } ${
            selectedCustomer && selectedCustomer.id >= 0 && !isCustomerMode
              ? 'px-3 pr-36' 
              : isAuditMode && pendingAdjustments && pendingAdjustments.size > 0
                ? 'px-3 pr-28'
                : isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0
                  ? 'px-3 pr-24'
                  : 'px-3'
          }`}
        />
        
        {/* Selected customer display as part of the search bar */}
        {selectedCustomer && selectedCustomer.id >= 0 && !isCustomerMode && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs pointer-events-auto">
            <span className="text-pink-300 font-medium truncate max-w-24" style={{ fontFamily: 'Tiempo, serif' }}>
              {selectedCustomer.id === 0 ? 'Guest' : (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)}
            </span>
            {selectedCustomer.id > 0 && <CustomerPoints customerId={selectedCustomer.id} />}
            <button
              onClick={() => {
                handleCustomerSelect(null);
                // Don't focus input to prevent dropdown from opening
              }}
              className="text-pink-400 hover:text-pink-200 transition-all p-0.5 rounded-full hover:bg-pink-500/10"
              title="Clear customer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
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

        {/* Clear audit mode button */}
        {isAuditDropdownMode && (
          <button
            onClick={() => {
              setIsAuditDropdownMode(false);
              setIsOpen(false);
              setAuditName('');
              setAuditDescription('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Exit audit mode"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Clear purchase order mode button */}
        {isPurchaseOrderMode && (
          <button
            onClick={() => {
              setIsPurchaseOrderMode(false);
              setIsOpen(false);
              setSupplierName('');
              setPONotes('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-full hover:bg-neutral-600/20"
            title="Exit purchase order mode"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Audit mode indicator as part of the search bar */}
        {isAuditMode && pendingAdjustments && pendingAdjustments.size > 0 && !isCustomerMode && !isProductMode && !showProductSelection && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => {
                setIsAuditDropdownMode(true);
                setIsOpen(true);
              }}
              className="text-purple-300 text-xs font-medium pointer-events-auto transition-all duration-200 hover:text-purple-200"
              style={{ fontFamily: 'Tiempo, serif' }}
              title={`Create audit with ${pendingAdjustments.size} pending adjustments`}
            >
              {pendingAdjustments.size} Adjustments
            </button>
          </div>
        )}

        {/* Restock mode indicator as part of the search bar */}
        {isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0 && !isCustomerMode && !isProductMode && !showProductSelection && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => {
                setIsPurchaseOrderMode(true);
                setIsOpen(true);
              }}
              className="text-green-300 text-xs font-medium pointer-events-auto transition-all duration-200 hover:text-green-200"
              style={{ fontFamily: 'Tiempo, serif' }}
              title={`Create purchase order with ${pendingRestockProducts.size} products`}
            >
              {pendingRestockProducts.size} Products
            </button>
          </div>
        )}
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
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
              
              {/* Subtle Customer Modal */}
              <div 
                ref={dropdownRef}
                className="fixed rounded-2xl overflow-hidden shadow-2xl"
                style={{ 
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(90vw, 800px)',
                  height: 'min(80vh, 700px)',
                  zIndex: 99999,
                  background: 'rgba(23, 23, 23, 0.85)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  filter: 'contrast(1.1) brightness(1.1)'
                }}
              >
                {/* Customers Section - Only show if not in product-only mode */}
          {!productOnlyMode && (isCustomerMode || filteredCustomers.length > 0) && (
            <>
              <div className="px-4 py-4 border-b border-white/5 relative" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                {/* Close button - Top left corner */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Clear customer search from main search bar when closing customer modal
                    if (isCustomerMode) {
                      setInternalValue('');
                      setIsCustomerMode(false);
                      setCustomerSearchValue('');
                      onSearchChange('');
                    }
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-neutral-600/50 hover:border-neutral-400/70 bg-transparent hover:bg-neutral-600/10 text-neutral-400 hover:text-neutral-200 transition-all duration-300 flex items-center justify-center"
                  title="Close"
                  style={{ left: '8px' }}
                >
                  <span className="text-lg font-medium tracking-wide" style={{ fontFamily: 'Tiempos, serif' }}>
                    ×
                  </span>
                </button>
                
                <div className="flex items-center justify-center gap-2">
                  {/* Customer Search Bar - Matches header nav styling */}
                  <div className="flex-1 flex items-center justify-center max-w-[500px]">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search customers..."
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
                        className="w-full h-[38px] bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg placeholder-neutral-500 focus:placeholder-transparent focus:bg-neutral-600/15 focus:outline-none text-sm text-center placeholder:text-center transition-all duration-200 ease-out text-neutral-400"
                        style={{ fontFamily: 'Tiempos, serif' }}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
                
                {/* Scan ID button - Thin circle with SCAN text */}
                <button
                  onClick={() => {
                    setShowIDScanner(true);
                    setShowNewCustomerForm(false);
                    setIsOpen(true);
                    setIsCustomerMode(true);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-neutral-600/50 hover:border-neutral-400/70 bg-transparent hover:bg-neutral-600/10 text-neutral-400 hover:text-neutral-200 transition-all duration-300 flex items-center justify-center"
                  title="Scan ID"
                  style={{ right: '8px' }}
                >
                  <span className="text-xs font-medium tracking-wide" style={{ fontFamily: 'Tiempos, serif' }}>
                    SCAN
                  </span>
                </button>
              </div>
              
              <div className={`flex flex-col overflow-hidden ${showIDScanner ? 'h-auto' : 'max-h-[45rem]'}`}>
                {/* Fixed Top Section - ID Scanner or New Customer Form */}
                {(showIDScanner || showNewCustomerForm) && (
                  <div className="flex-shrink-0">
                    {showIDScanner ? (
                      <div className="px-4 py-4 border-b border-neutral-500/20">
                        <ScanditIDScanner
                          onScanResult={handleIDScanResult}
                          onCancel={handleCancelIDScanner}
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-4 border-b border-neutral-500/20">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="First Name"
                              value={newCustomerData.firstName}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={newCustomerData.lastName}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Email (optional)"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          />
                          <div className="text-xs text-neutral-400/70 mb-2 text-center">
                            * Either email or phone required
                          </div>
                          <input
                            type="text"
                            placeholder="Address"
                            value={newCustomerData.address}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="City"
                              value={newCustomerData.city}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={newCustomerData.state}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, state: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                            <input
                              type="text"
                              placeholder="ZIP"
                              value={newCustomerData.zipCode}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, zipCode: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              placeholder="Date of Birth"
                              value={newCustomerData.dateOfBirth}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                            <input
                              type="text"
                              placeholder="License Number"
                              value={newCustomerData.licenseNumber}
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                              className="px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelNewCustomer}
                              disabled={isCreatingCustomer}
                              className="flex-1 px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 text-neutral-400 hover:text-neutral-200 rounded-lg text-xs transition-all duration-200 ease-out backdrop-blur-sm disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCreateCustomer}
                              disabled={isCreatingCustomer || !newCustomerData.firstName.trim() || (!newCustomerData.email.trim() && !newCustomerData.phone.trim())}
                              className="flex-1 px-3 py-2 bg-red-600/80 hover:bg-red-600 disabled:bg-red-600/30 text-white rounded-lg text-xs transition-all duration-200 ease-out backdrop-blur-sm flex items-center justify-center"
                            >
                              {isCreatingCustomer ? 'Creating...' : 'Create'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Header Options */}
                {!showIDScanner && !showNewCustomerForm && (
                  <div className="flex-shrink-0 border-b border-neutral-500/20">
                    {/* New Customer and Guest Customer Buttons in One Row */}
                    <div className="flex gap-2 p-4">
                      {/* New Customer Button */}
                      <button
                        onClick={handleNewCustomerClick}
                        className="flex-1 px-4 py-3 text-sm transition-all flex items-center justify-center group text-neutral-400 bg-neutral-600/10 hover:bg-neutral-600/15 hover:text-neutral-200 rounded-lg"
                      >
                        <div className="font-medium">New Customer</div>
                      </button>

                      {/* Guest Customer Button */}
                      <button
                        onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
                        className="flex-1 px-4 py-3 text-sm transition-all flex items-center justify-center group text-neutral-400 bg-neutral-600/10 hover:bg-neutral-600/15 hover:text-neutral-200 rounded-lg"
                      >
                        <div className="font-medium">Guest Customer</div>
                      </button>
                    </div>


                  </div>
                )}

                {/* Scrollable Customer List - Hide when scanner is active */}
                {!showIDScanner && (
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 p-2">
                    {filteredCustomers.length > 0 ? (
                      <>

                      {/* Customer List */}
                      {filteredCustomers.map((customer, index) => (
                        <button
                          key={customer.id}
                          data-customer-index={index}
                          onClick={() => handleCustomerSelect(customer)}
                          className={`w-full px-4 py-4 text-left transition-all flex items-center justify-between group rounded-lg mb-2 ${
                            selectedCustomer?.id === customer.id
                              ? 'bg-neutral-600/20 text-white'
                              : index === selectedIndex
                              ? 'bg-blue-600/15 text-white'
                              : 'bg-neutral-600/10 text-neutral-400 hover:bg-neutral-600/15 hover:text-neutral-300'
                          }`}
                          style={{ fontFamily: 'Tiempos, serif' }}
                        >
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="text-base font-medium mb-1 flex items-center gap-3">
                                {customer.display_name || customer.name || customer.username}
                                <CustomerPoints customerId={customer.id} />
                              </div>
                              <div className="text-sm text-neutral-500">
                                {customer.email}
                              </div>
                            </div>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <span className="text-xs text-white">✓</span>
                          )}
                        </button>
                      ))}
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                        {(isCustomerMode ? customerSearchValue : debouncedSearchValue) ? 'No customers found matching your search' : 'No customers available'}
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

          {/* Purchase Order Section - Only show in restock mode */}
          {isRestockMode && isPurchaseOrderMode && pendingRestockProducts && pendingRestockProducts.size > 0 && (
            <>
              {(filteredCustomers.length > 0 || filteredProducts.length > 0) && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              <div className="px-4 py-2.5 border-b border-neutral-700 bg-transparent">
                <h3 className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                  Create Purchase Order ({pendingRestockProducts.size} products)
                </h3>
              </div>
              
              {/* Purchase Order Details Form - Glassmorphic Style */}
              <div className="px-4 py-4 space-y-3">
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Supplier Name *"
                  className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                  style={{ fontFamily: 'Tiempos, serif' }}
                  required
                />
                
                <textarea
                  value={poNotes}
                  onChange={(e) => setPONotes(e.target.value)}
                  placeholder="Purchase order notes (optional)"
                  className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm resize-none"
                  style={{ fontFamily: 'Tiempos, serif' }}
                  rows={2}
                />

                {/* Pending restock products list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                    Products to Restock:
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Array.from(pendingRestockProducts.entries()).map(([key, quantity]) => {
                      const [productId, variantId] = key.split('-').map(Number);
                      const product = products?.find(p => p.id === productId);
                      const variant = (product as any)?.variants?.find((v: any) => v.id === variantId);
                      const displayName = variant ? `${product?.name} - ${variant.name}` : product?.name || 'Unknown Product';
                      
                      return (
                        <div key={key} className="flex items-center justify-between py-1 px-2 bg-neutral-700/30 rounded text-xs">
                          <span className="text-neutral-200 truncate flex-1" style={{ fontFamily: 'Tiempos, serif' }}>
                            {displayName}
                          </span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-green-400 font-medium">
                              {quantity} units
                            </span>
                            {editingRestockProduct === key ? (
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editRestockValue}
                                onChange={(e) => setEditRestockValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newValue = parseInt(editRestockValue) || 0;
                                    onUpdateRestockQuantity?.(key, newValue);
                                    setEditingRestockProduct(null);
                                    setEditRestockValue('');
                                  } else if (e.key === 'Escape') {
                                    setEditingRestockProduct(null);
                                    setEditRestockValue('');
                                  }
                                }}
                                onBlur={() => {
                                  const newValue = parseInt(editRestockValue) || 0;
                                  onUpdateRestockQuantity?.(key, newValue);
                                  setEditingRestockProduct(null);
                                  setEditRestockValue('');
                                }}
                                className="w-16 px-1 py-0.5 text-xs bg-neutral-600 border border-neutral-500 rounded text-white text-center focus:outline-none focus:border-green-500"
                                autoFocus
                              />
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingRestockProduct(key);
                                    setEditRestockValue(quantity.toString());
                                  }}
                                  className="text-neutral-400 hover:text-neutral-200 transition-colors"
                                  title="Edit quantity"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => onRemoveRestockProduct?.(key)}
                                  className="text-neutral-400 hover:text-neutral-300 transition-colors"
                                  title="Remove from purchase order"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPurchaseOrderMode(false);
                      setIsOpen(false);
                      setSupplierName('');
                      setPONotes('');
                    }}
                    disabled={isCreatingPO}
                    className="flex-1 px-3 py-2 text-xs bg-neutral-600/10 hover:bg-neutral-600/15 text-neutral-400 hover:text-neutral-300 rounded-lg transition-all duration-200 ease-out backdrop-blur-sm disabled:opacity-50"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (supplierName.trim()) {
                        onCreatePurchaseOrderWithDetails?.(supplierName.trim(), poNotes.trim() || undefined);
                        setIsPurchaseOrderMode(false);
                        setIsOpen(false);
                        setSupplierName('');
                        setPONotes('');
                      }
                    }}
                    disabled={!supplierName.trim() || isCreatingPO}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-out backdrop-blur-sm flex items-center justify-center gap-2 ${
                      !supplierName.trim() || isCreatingPO
                        ? 'bg-neutral-600/10 text-neutral-500 cursor-not-allowed'
                        : 'bg-neutral-600/20 hover:bg-neutral-600/30 text-neutral-400'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    {isCreatingPO && (
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isCreatingPO ? 'Creating...' : 'Create Purchase Order'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Audit Section - Only show in audit mode */}
          {isAuditMode && isAuditDropdownMode && pendingAdjustments && pendingAdjustments.size > 0 && (
            <>
              {(filteredCustomers.length > 0 || filteredProducts.length > 0) && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              <div className="px-4 py-2.5 border-b border-neutral-700 bg-transparent">
                <h3 className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                  Create Audit ({pendingAdjustments.size} adjustments)
                </h3>
              </div>
              
              {/* Adjustments List */}
              <div className="max-h-48 overflow-y-auto">
                {Array.from(pendingAdjustments.entries()).map(([key, adjustment]) => {
                  const [productId, variantId] = key.split('-').map(Number);
                  const product = products.find(p => p.id === productId);
                  const variant = (product as any)?.variants?.find((v: any) => v.id === variantId);
                  
                  let displayName = `Product #${productId}`;
                  if (product) {
                    displayName = product.name;
                    if (variant) {
                      displayName += ` - ${variant.name}`;
                    }
                  } else if (variantId) {
                    displayName = `Product #${productId} - Variant #${variantId}`;
                  }
                  
                  const isEditing = editingAdjustment === key;
                  
                  return (
                    <div key={key} className="px-4 py-2 border-b border-neutral-500/10 text-sm hover:bg-neutral-600/20 transition-colors group">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300 truncate flex-1 mr-3" style={{ fontFamily: 'Tiempos, serif' }}>
                          {displayName}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16 px-2 py-1 bg-neutral-900/80 border-0 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newValue = parseFloat(editValue);
                                    if (!isNaN(newValue) && onUpdateAdjustment) {
                                      onUpdateAdjustment(key, newValue);
                                    }
                                    setEditingAdjustment(null);
                                    setEditValue('');
                                  } else if (e.key === 'Escape') {
                                    setEditingAdjustment(null);
                                    setEditValue('');
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  console.log('🔧 Save button clicked:', { key, editValue, onUpdateAdjustment: !!onUpdateAdjustment });
                                  const newValue = parseFloat(editValue);
                                  console.log('🔧 Parsed value:', newValue);
                                  if (!isNaN(newValue) && onUpdateAdjustment) {
                                    console.log('🔧 Calling onUpdateAdjustment');
                                    onUpdateAdjustment(key, newValue);
                                  }
                                  setEditingAdjustment(null);
                                  setEditValue('');
                                }}
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="Save"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAdjustment(null);
                                  setEditValue('');
                                }}
                                className="text-neutral-400 hover:text-neutral-300 transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className={`font-medium min-w-[3rem] text-right ${adjustment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {adjustment > 0 ? '+' : ''}{adjustment}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingAdjustment(key);
                                    setEditValue(adjustment.toString());
                                  }}
                                  className="text-neutral-400 hover:text-neutral-200 transition-colors"
                                  title="Edit adjustment"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('🗑️ Remove button clicked:', { key, onRemoveAdjustment: !!onRemoveAdjustment });
                                    if (onRemoveAdjustment) {
                                      onRemoveAdjustment(key);
                                    }
                                  }}
                                  className="text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Remove adjustment"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Audit Details Form - Glassmorphic Style */}
              <div className="px-4 py-4 space-y-3">
                <input
                  type="text"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  placeholder="Audit Name *"
                  className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm"
                  style={{ fontFamily: 'Tiempos, serif' }}
                  required
                />
                
                <textarea
                  value={auditDescription}
                  onChange={(e) => setAuditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm resize-none"
                  style={{ fontFamily: 'Tiempos, serif' }}
                  rows={2}
                />
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuditDropdownMode(false);
                      setIsOpen(false);
                      setAuditName('');
                      setAuditDescription('');
                    }}
                    disabled={isApplying}
                    className="flex-1 px-3 py-2 text-xs bg-neutral-600/10 hover:bg-neutral-600/15 text-neutral-400 hover:text-neutral-300 rounded-lg transition-all duration-200 ease-out backdrop-blur-sm disabled:opacity-50"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (auditName.trim()) {
                        try {
                          if (onCreateAuditWithDetails) {
                            await onCreateAuditWithDetails(auditName, auditDescription);
                          } else if (onCreateAudit) {
                            onCreateAudit();
                          }
                          setIsAuditDropdownMode(false);
                          setIsOpen(false);
                          setAuditName('');
                          setAuditDescription('');
                        } catch (error) {
                          console.error('Failed to create audit:', error);
                        }
                      }
                    }}
                    disabled={!auditName.trim() || isApplying}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-out backdrop-blur-sm flex items-center justify-center gap-2 ${
                      !auditName.trim() || isApplying
                        ? 'bg-neutral-600/10 text-neutral-500 cursor-not-allowed'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    {isApplying && (
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isApplying ? 'Creating...' : 'Create Audit'}
                  </button>
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
          className="fixed rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            top: filterButtonRef.current ? filterButtonRef.current.getBoundingClientRect().bottom + 8 : '50%',
            left: filterButtonRef.current ? filterButtonRef.current.getBoundingClientRect().left : '50%',
            width: 'min(90vw, 400px)',
            maxHeight: 'min(70vh, 600px)',
            zIndex: 99999,
            background: 'rgba(23, 23, 23, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            filter: 'contrast(1.1) brightness(1.1)'
          }}
        >
          {/* Categories Section */}
          {filteredCategories.length > 0 && (
            <>
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>Categories</h3>
              </div>
              
              <div className="py-1 max-h-48 overflow-y-auto">
                {/* All Categories Option */}
                <button
                  onClick={() => {
                    handleCategorySelect(null);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between ${
                    !selectedCategory
                      ? 'bg-neutral-600/5 text-neutral-300'
                      : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                  }`}
                >
                  <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>All Categories</span>
                  {!selectedCategory && <span className="text-xs">✓</span>}
                </button>

                {/* Category List */}
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategorySelect(category.slug);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between ${
                      selectedCategory === category.slug
                        ? 'bg-neutral-600/5 text-neutral-300'
                        : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                    }`}
                  >
                    <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>{category.name}</span>
                    <div className="flex items-center gap-2">
                      {category.count && (
                        <span className="text-xs text-neutral-500 bg-neutral-600/10 px-2 py-1 rounded">
                          {category.count}
                        </span>
                      )}
                      {selectedCategory === category.slug && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Blueprint Fields Section */}
          <div className="px-2 py-2 border-t border-neutral-600/10">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 px-2">
              Blueprint Fields
            </div>
            
            {/* Show field selection or field values */}
            {!selectedFieldForValues ? (
              /* Blueprint Field Options */
              <div className="space-y-1">
                {[
                  { key: 'effect', label: 'Effect' },
                  { key: 'lineage', label: 'Lineage' },
                  { key: 'nose', label: 'Nose' },
                  { key: 'terpene', label: 'Terpene' },
                  { key: 'strain_type', label: 'Strain Type' },
                  { key: 'thca_percentage', label: 'THCA %' },
                  { key: 'supplier', label: 'Supplier' }
                ].map((field) => (
                  <button
                    key={field.key}
                    onClick={() => {
                      setSelectedFieldForValues(field.key);
                    }}
                    className="w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300"
                  >
                    <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                      {field.label}
                      <span className="ml-2 text-xs text-neutral-500">
                        ({availableFieldValues[field.key]?.length || 0} values)
                      </span>
                    </span>
                    <span className="text-xs">→</span>
                  </button>
                ))}
                
                {/* Clear Blueprint Field Filter */}
                {selectedBlueprintField && (
                  <button
                    onClick={() => {
                      if (onBlueprintFieldChange) {
                        onBlueprintFieldChange(null, null);
                      }
                      setIsFilterOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm transition-all text-neutral-500 hover:bg-neutral-600/5 hover:text-neutral-400 border-t border-neutral-600/10 mt-2 pt-3"
                  >
                    <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                      Clear Blueprint Filter
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* Field Values List with Full Height Scrolling */
              <div className="flex flex-col" style={{ height: '400px' }}>
                {/* Back button - Fixed at top */}
                <button
                  onClick={() => setSelectedFieldForValues(null)}
                  className="w-full px-4 py-2 text-left text-sm transition-all text-neutral-500 hover:bg-neutral-600/5 hover:text-neutral-400 border-b border-neutral-600/10 mb-2 pb-3 flex-shrink-0"
                >
                  <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                    ← Back to Fields
                  </span>
                </button>
                
                {/* Scrollable Field Values Container - Uses full available height */}
                <div className="overflow-y-auto flex-1 space-y-1 pr-1 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600">
                  {availableFieldValues[selectedFieldForValues]?.length > 0 ? (
                    availableFieldValues[selectedFieldForValues].map((value, index) => (
                      <button
                        key={`${selectedFieldForValues}-${index}`}
                        onClick={() => {
                          if (onBlueprintFieldChange) {
                            onBlueprintFieldChange(selectedFieldForValues, value);
                          }
                          setSelectedFieldForValues(null);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between ${
                          selectedBlueprintField === selectedFieldForValues && blueprintFieldValue === value
                            ? 'bg-neutral-600/5 text-neutral-300'
                            : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                        }`}
                      >
                        <span style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }} className="truncate pr-2">
                          {value}
                        </span>
                        {selectedBlueprintField === selectedFieldForValues && blueprintFieldValue === value && (
                          <span className="text-xs flex-shrink-0">✓</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-neutral-500 text-center">
                      No values found for this field
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
