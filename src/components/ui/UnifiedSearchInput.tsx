'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import ReactDOM from 'react-dom';
import { WordPressUser, usersService } from '../../services/users-service';
import { useUserPointsBalance } from '../../hooks/useRewards';
import { useDebounce } from '../../hooks/useDebounce';
import { ParsedIDData } from '../../utils/idParser';

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
  const [isCustomerMode, setIsCustomerMode] = useState(customerOnlyMode);
  const [isProductMode, setIsProductMode] = useState(productOnlyMode);
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
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('Ready to scan');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search for performance
  const debouncedSearchValue = useDebounce(internalValue, 300);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openCustomerMode: () => {
      setIsCustomerMode(true);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openProductMode: () => {
      setIsProductMode(true);
      setIsCustomerMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsOpen(true);
      setInternalValue('');
    },
    openAuditMode: () => {
      setIsAuditDropdownMode(true);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsPurchaseOrderMode(false);
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
      setIsOpen(true);
      setInternalValue('');
      setSupplierName('');
      setPONotes('');
    },
    close: () => {
      setIsOpen(false);
      setIsCustomerMode(false);
      setIsProductMode(false);
      setIsEditingProduct(false);
      setIsAuditDropdownMode(false);
      setIsPurchaseOrderMode(false);
      setInternalValue('');
      setAuditName('');
      setAuditDescription('');
    }
  }));
  
  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(searchValue);
  }, [searchValue]);

  // Call search callback when debounced value changes
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
      const minWidth = showNewCustomerForm ? (showIDScanner ? 550 : 500) : 400; // Wider when scanner is active
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
    
    // Open dropdown when typing
    if (!isOpen && newValue.length > 0) {
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
    } else {
      setIsOpen(true);
    }
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
    setNewCustomerData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
    setShowNewCustomerForm(false);
  };

  const handleIDScanClick = async () => {
    if (showIDScanner) {
      // Stop scanning
      if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        setScannerStream(null);
      }
      setShowIDScanner(false);
    } else {
      // Start scanning
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setScannerStream(stream);
        setShowIDScanner(true);
      } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required to scan ID. Please allow camera access and try again.');
      }
    }
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
    
    // Stop camera
    if (scannerStream) {
      scannerStream.getTracks().forEach(track => track.stop());
      setScannerStream(null);
    }
    setShowIDScanner(false);
  };

  const startInlineScanning = async (video: HTMLVideoElement) => {
    try {
      setScannerStatus('Initializing scanner...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setScannerStatus('Canvas not supported');
        return;
      }

      let scanCount = 0;
      let isScanning = true;
      
      const scan = async () => {
        if (!video || !ctx || !showIDScanner || !isScanning) return;
        
        if (video.readyState < 2) {
          setScannerStatus('Camera loading...');
          setTimeout(scan, 100);
          return;
        }
        
        scanCount++;
        
        // Set canvas to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        if (canvas.width === 0 || canvas.height === 0) {
          setTimeout(scan, 100);
          return;
        }
        
        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        setScannerStatus(`Scanning for ID barcode... (${scanCount})`);
        
        try {
          // Try ZXing PDF417 reader first
          const { BrowserPDF417Reader } = await import('@zxing/browser');
          const pdf417Reader = new BrowserPDF417Reader();
          
          const result = await pdf417Reader.decodeFromCanvas(canvas);
          if (result) {
            const barcodeText = result.getText();
            console.log('✅ Barcode detected! Length:', barcodeText.length);
            console.log('Raw barcode data:', barcodeText);
            
            setScannerStatus('Barcode found! Parsing ID data...');
            
            const { parseIDBarcode } = await import('../../utils/idParser');
            const parsedData = parseIDBarcode(barcodeText);
            
            if (parsedData) {
              console.log('✅ ID data successfully parsed:', parsedData);
              setScannerStatus('Success! ID data extracted');
              isScanning = false;
              handleIDDataScanned(parsedData);
              return;
            } else {
              console.log('❌ Could not parse ID data from barcode');
              setScannerStatus('Invalid ID format - try repositioning');
            }
          }
        } catch (error) {
          // Continue scanning - most frames won't have barcodes
        }
        
        // Continue rapid scanning
        if (showIDScanner && isScanning) {
          requestAnimationFrame(scan); // Use requestAnimationFrame for smoother scanning
        }
      };
      
      setScannerStatus('Ready - hold ID barcode steady in frame');
      
      // Start scanning when video is ready
      if (video.readyState >= 2) {
        scan();
      } else {
        video.addEventListener('canplay', scan, { once: true });
      }
      
    } catch (error) {
      console.error('❌ Scanner initialization failed:', error);
      setScannerStatus('Scanner failed to initialize');
    }
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

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerEnabled) return [];
    if (!debouncedSearchValue) return customers.slice(0, 5); // Show first 5 when no search
    
    const query = debouncedSearchValue.toLowerCase();
    return customers.filter(customer => {
      const name = (customer.display_name || customer.name || '').toLowerCase();
      const email = customer.email.toLowerCase();
      const username = customer.username.toLowerCase();
      return name.includes(query) || email.includes(query) || username.includes(query);
    }).slice(0, 8); // Limit results
  }, [customers, debouncedSearchValue, customerEnabled]);

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
      <div className={`relative ${className}`}>
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
                  : (showFilters ? displayText : placeholder)
          }
          style={{ 
            fontFamily: 'Tiempos, serif',
            ...(showFilters || showProductSelection) ? { textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' } : {}
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
          className={`w-full h-[30px] bg-transparent hover:bg-neutral-600/10 rounded-lg placeholder-neutral-400 focus:bg-neutral-600/10 focus:outline-none text-sm text-center placeholder:text-center transition-all duration-200 ease-out min-w-0 ${
            showProductSelection
              ? 'text-neutral-200 font-medium'
              : isAuditDropdownMode
                ? 'text-neutral-300 font-medium'
                : isPurchaseOrderMode
                  ? 'text-neutral-300 font-medium'
                  : 'text-neutral-400'
          } ${
            isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0
              ? 'border-2 border-green-500/30 bg-green-500/10 shadow-lg shadow-green-500/20 cursor-pointer'
              : isAuditMode && pendingAdjustments && pendingAdjustments.size > 0
                ? 'border-2 border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/20 cursor-pointer'
              : hasSelections 
                ? 'border-2 border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                : 'border border-neutral-500/30 hover:border-neutral-400/50 focus:border-neutral-300'
          } ${
            selectedCustomer && selectedCustomer.id > 0 && !internalValue && !isCustomerMode 
              ? 'px-3 pr-8' 
              : isAuditMode && pendingAdjustments && pendingAdjustments.size > 0
                ? 'px-3 pr-24'
                : 'px-3'
          }`}
        />
        
        {/* Customer points indicator when selected */}
        {selectedCustomer && selectedCustomer.id > 0 && !internalValue && !isCustomerMode && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <CustomerPoints customerId={selectedCustomer.id} />
          </div>
        )}
        
        {/* Clear filters button - normal mode */}
        {!isCustomerMode && !isProductMode && (selectedCustomer || selectedProduct || selectedCategory) && !internalValue && (
          <button
            onClick={() => {
              handleCustomerSelect(null);
              handleProductSelect(null);
              handleCategorySelect(null);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Clear filters"
          >
            <span className="text-xs">✕</span>
          </button>
        )}

        {/* Clear customer mode button */}
        {isCustomerMode && (
          <button
            onClick={() => {
              setIsCustomerMode(false);
              setIsOpen(false);
              setInternalValue('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Exit customer mode"
          >
            <span className="text-xs">✕</span>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Exit product mode"
          >
            <span className="text-xs">✕</span>
          </button>
        )}

        {/* Clear selected product in product-only mode */}
        {showProductSelection && (
          <button
            onClick={() => {
              handleProductSelect(null);
              setIsEditingProduct(false);
              setLastSearchValue('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Clear product selection"
          >
            <span className="text-xs">✕</span>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Exit audit mode"
          >
            <span className="text-xs">✕</span>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Exit purchase order mode"
          >
            <span className="text-xs">✕</span>
          </button>
        )}

        {/* Audit mode indicator */}
        {isAuditMode && pendingAdjustments && pendingAdjustments.size > 0 && !isCustomerMode && !isProductMode && !showProductSelection && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <button
              onClick={() => {
                setIsAuditDropdownMode(true);
                setIsOpen(true);
              }}
              className="text-white text-xs font-medium bg-purple-600/40 px-2 py-0.5 rounded border border-purple-500/30 pointer-events-auto transition-all duration-200"
              title={`Create audit with ${pendingAdjustments.size} pending adjustments`}
            >
              {pendingAdjustments.size} Adjustments
            </button>
          </div>
        )}

        {/* Restock mode indicator */}
        {isRestockMode && pendingRestockProducts && pendingRestockProducts.size > 0 && !isCustomerMode && !isProductMode && !showProductSelection && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <button
              onClick={() => {
                setIsPurchaseOrderMode(true);
                setIsOpen(true);
              }}
              className="text-white text-xs font-medium bg-green-600/40 px-2 py-0.5 rounded border border-green-500/30 pointer-events-auto transition-all duration-200 hover:bg-green-600/60"
              title={`Create purchase order with ${pendingRestockProducts.size} products`}
            >
              {pendingRestockProducts.size} Products
            </button>
          </div>
        )}
      </div>

      {isOpen && dropdownPosition && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-neutral-700/95 border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
        >
          {/* Customers Section - Only show if not in product-only mode */}
          {!productOnlyMode && filteredCustomers.length > 0 && (
            <>
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                  {isCustomerMode ? 'Select Customer' : 'Customers'}
                </h3>
              </div>
              
              <div className={`py-1 ${showNewCustomerForm ? (showIDScanner ? 'max-h-[600px]' : 'max-h-[500px]') : 'max-h-48'} overflow-y-auto`}>
                {/* New Customer Form or Button */}
                {showNewCustomerForm ? (
                  <div className="px-4 py-3 border-b border-neutral-500/20 mb-1">
                    <div className="space-y-3">
                      {/* ID Scan Toggle */}
                      <button
                        onClick={handleIDScanClick}
                        className={`w-full px-3 py-2 border rounded text-xs transition-colors flex items-center justify-center gap-2 ${
                          showIDScanner 
                            ? 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30' 
                            : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showIDScanner ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3z" />
                          )}
                        </svg>
                        {showIDScanner ? 'Stop Scanning' : 'Scan State ID'}
                      </button>

                      {/* Inline Camera Scanner */}
                      {showIDScanner && scannerStream && (
                        <div className="relative bg-black rounded border border-neutral-600">
                          <video
                            ref={(video) => {
                              if (video && scannerStream) {
                                video.srcObject = scannerStream;
                                video.play();
                                
                                // Start scanning when video loads
                                video.onloadedmetadata = () => {
                                  startInlineScanning(video);
                                };
                              }
                            }}
                            className="w-full h-32 object-cover rounded"
                            autoPlay
                            playsInline
                            muted
                          />
                          
                          {/* Scanning Overlay */}
                          <div className="absolute inset-2 border-2 border-blue-400 rounded pointer-events-none">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-300"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-300"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-300"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-300"></div>
                          </div>
                          
                          <div className="absolute bottom-1 left-1 right-1 text-center">
                            <div className="bg-black/70 rounded px-2 py-1">
                              <p className="text-white text-xs">{scannerStatus}</p>
                            </div>
                          </div>
                          
                          {/* Test Button for Development */}
                          <button
                            onClick={() => {
                              // Test data for development
                              const testData = {
                                firstName: 'John',
                                lastName: 'Doe',
                                address: '123 Main St',
                                city: 'Charlotte',
                                state: 'NC',
                                zipCode: '28202'
                              };
                              handleIDDataScanned(testData);
                            }}
                            className="absolute top-1 right-1 px-2 py-1 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded transition-colors"
                          >
                            Test
                          </button>
                        </div>
                      )}
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
                    className="w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group text-neutral-300 hover:bg-white/[0.05] hover:text-neutral-200 border-b border-neutral-500/20 mb-1"
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

                {/* Clear Customer Selection */}
                <button
                  onClick={() => handleCustomerSelect(null)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                    !selectedCustomer
                      ? 'bg-neutral-600/5 text-neutral-300'
                      : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                  }`}
                >
                  <span>No Customer</span>
                  {!selectedCustomer && <span className="text-xs">✓</span>}
                </button>

                {/* Guest Customer */}
                <button
                  onClick={() => handleCustomerSelect({ id: 0, name: 'Guest Customer', email: 'guest@pos.local', username: 'guest', display_name: 'Guest Customer', roles: ['customer'] } as WordPressUser)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                    selectedCustomer?.id === 0
                      ? 'bg-neutral-600/5 text-neutral-300'
                      : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">Guest Customer</div>
                    <div className="text-xs text-neutral-500">Walk-in customer</div>
                  </div>
                  {selectedCustomer?.id === 0 && <span className="text-xs">✓</span>}
                </button>

                {/* Customer List */}
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-neutral-600/5 text-neutral-300'
                        : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium mb-1 flex items-center">
                        {customer.display_name || customer.name || customer.username}
                        <CustomerPoints customerId={customer.id} />
                      </div>
                      <div className="text-xs text-neutral-500">
                        {customer.email}
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <span className="text-xs ml-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Products Section */}
          {filteredProducts.length > 0 && (
            <>
              {!productOnlyMode && filteredCustomers.length > 0 && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                  {isProductMode ? 'Select Product' : 'Products'}
                </h3>
              </div>
              
              <div className="py-1 max-h-48 overflow-y-auto">
                {/* Clear Product Selection */}
                <button
                  onClick={() => handleProductSelect(null)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                    !selectedProduct
                      ? 'bg-neutral-600/5 text-neutral-300'
                      : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                  }`}
                >
                  <span>No Product</span>
                  {!selectedProduct && <span className="text-xs">✓</span>}
                </button>

                {/* Product List */}
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center justify-between group ${
                      selectedProduct?.id === product.id
                        ? 'bg-neutral-600/5 text-neutral-300'
                        : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                        <span>{product.name}</span>
                        {product.categories && product.categories.length > 0 && (
                          <span className="text-xs text-neutral-400 font-normal opacity-50">
                            • {product.categories[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedProduct?.id === product.id && (
                      <span className="text-xs ml-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Purchase Order Section - Only show in restock mode */}
          {isRestockMode && isPurchaseOrderMode && pendingRestockProducts && pendingRestockProducts.size > 0 && (
            <>
              {(filteredCustomers.length > 0 || filteredProducts.length > 0) && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                  Create Purchase Order ({pendingRestockProducts.size} products)
                </h3>
              </div>
              
              <div className="p-4 space-y-3 bg-transparent">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Enter supplier name..."
                    className="w-full px-3 py-2 bg-neutral-600/50 border border-neutral-500/30 rounded text-sm text-white placeholder-neutral-400 focus:border-green-500/50 focus:outline-none"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={poNotes}
                    onChange={(e) => setPONotes(e.target.value)}
                    placeholder="Purchase order notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-600/50 border border-neutral-500/30 rounded text-sm text-white placeholder-neutral-400 focus:border-green-500/50 focus:outline-none resize-none"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                </div>

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
                                  ✏️
                                </button>
                                <button
                                  onClick={() => onRemoveRestockProduct?.(key)}
                                  className="text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Remove from purchase order"
                                >
                                  ✕
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
                    onClick={() => {
                      setIsPurchaseOrderMode(false);
                      setIsOpen(false);
                      setSupplierName('');
                      setPONotes('');
                    }}
                    className="flex-1 px-3 py-2 bg-neutral-600 hover:bg-neutral-500 text-white text-sm rounded transition-colors"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    Cancel
                  </button>
                  <button
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
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    {isCreatingPO ? 'Creating...' : 'Create PO'}
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
              
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
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
                                className="w-16 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
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

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Audit Name *
                  </label>
                  <input
                    type="text"
                    value={auditName}
                    onChange={(e) => setAuditName(e.target.value)}
                    placeholder="e.g., Monthly Inventory Count"
                    className="w-full px-3 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={auditDescription}
                    onChange={(e) => setAuditDescription(e.target.value)}
                    placeholder="Additional notes about this audit..."
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none text-sm"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsAuditDropdownMode(false);
                      setIsOpen(false);
                      setAuditName('');
                      setAuditDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-neutral-600/50 hover:bg-neutral-600/70 text-white rounded-lg transition-colors text-sm"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    Cancel
                  </button>
                  <button
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
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2 ${
                      !auditName.trim() || isApplying
                        ? 'bg-neutral-600/50 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    {isApplying && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

          {/* Categories Section - Only show if not in customer-only or product-only mode */}
          {!isCustomerMode && !isProductMode && !productOnlyMode && !isAuditDropdownMode && !isPurchaseOrderMode && filteredCategories.length > 0 && (
            <>
              {filteredCustomers.length > 0 && (
                <div className="h-px bg-neutral-500/20 mx-2" />
              )}
              
              <div className="px-4 py-2.5 border-b border-neutral-500/20 bg-transparent">
                <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>Categories</h3>
              </div>
              
              <div className="py-1 max-h-48 overflow-y-auto">
                {/* All Categories Option */}
                <button
                  onClick={() => handleCategorySelect(null)}
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
                    onClick={() => handleCategorySelect(category.slug)}
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

          {/* No results */}
          {filteredCustomers.length === 0 && filteredProducts.length === 0 && (!isCustomerMode && !isProductMode && !productOnlyMode ? filteredCategories.length === 0 : true) && debouncedSearchValue && (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">
              {isCustomerMode 
                ? `No customers found for "${debouncedSearchValue}"`
                : isProductMode || productOnlyMode
                ? `No products found for "${debouncedSearchValue}"`
                : `No customers, products, or categories found for "${debouncedSearchValue}"`
              }
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
});

UnifiedSearchInput.displayName = 'UnifiedSearchInput';
