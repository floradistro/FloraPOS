'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { LoadingSpinner } from './LoadingSpinner';
import { WordPressUser } from '../../services/users-service';
import { PrintSettings } from './PrintSettingsPanel';
import QRCode from 'react-qr-code';

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

interface BlueprintFieldsGridProps {
  searchQuery?: string;
  categoryFilter?: string;
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  selectedCustomer?: WordPressUser | null;
  printSettings?: PrintSettings | null;
  selectedProduct?: Product | null;
  onProductSelect?: (product: Product | null) => void;
  onProductsLoad?: (products: Product[]) => void;
}

export const BlueprintFieldsGrid = forwardRef<{ refresh: () => Promise<void> }, BlueprintFieldsGridProps>(
  ({ searchQuery, categoryFilter, onLoadingChange, selectedCustomer, printSettings, selectedProduct: parentSelectedProduct, onProductSelect, onProductsLoad }, ref) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [productFields, setProductFields] = useState<Record<number, ProductBlueprintFields>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditableFields, setShowEditableFields] = useState(false);

    useImperativeHandle(ref, () => ({
      refresh: refreshData
    }));

    const handleFieldsUpdate = (productId: number, updatedFields: ProductBlueprintFields) => {
      setProductFields(prev => ({
        ...prev,
        [productId]: updatedFields
      }));
      setShowEditableFields(false);
    };

    const refreshData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch products from the flower category
        const response = await fetch(
          `https://api.floradistro.com/wp-json/wc/v3/products?category=25&consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678&per_page=50`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const productsData = await response.json();
        console.log('BlueprintFieldsGrid: Loaded products:', productsData?.length);
        setProducts(productsData || []);
        // Notify parent component about loaded products
        if (onProductsLoad) {
          console.log('BlueprintFieldsGrid: Calling onProductsLoad with products');
          onProductsLoad(productsData || []);
        }

        // Fetch blueprint fields for each product
        const fieldsData: Record<number, ProductBlueprintFields> = {};
        
        for (const product of productsData) {
          try {
            const fields = await BlueprintFieldsService.getProductBlueprintFieldsWithFallback(
              product.id, 
              product.name
            );
            if (fields) {
              fieldsData[product.id] = fields;
            }
          } catch (error) {
            console.warn(`Failed to fetch fields for product ${product.id}:`, error);
          }
        }

        setProductFields(fieldsData);
      } catch (error) {
        console.error('Error fetching blueprint fields data:', error);
        setError('Failed to load blueprint fields data');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      refreshData();
    }, []);

    useEffect(() => {
      onLoadingChange?.(loading, products.length > 0);
    }, [loading, products.length, onLoadingChange]);

    if (loading) {
      return (
        <LoadingSpinner 
          size="lg" 
          text="Loading Blueprint Fields"
          subText="Fetching product configurations..."
          centered
          fullHeight
        />
      );
    }

    if (error) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="space-y-2">
              <p className="text-red-400 text-xl font-light">Error Loading Blueprint Fields</p>
              <p className="text-neutral-500 text-base">{error}</p>
            </div>
            <button
              onClick={refreshData}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Single column layout showing selected product - centered
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="flex flex-col gap-6 items-center w-full">
          {/* Editable Fields Panel */}
          {parentSelectedProduct && productFields[parentSelectedProduct.id] && showEditableFields && (
            <div className="w-full max-w-4xl">
              <EditableFieldsComponent
                product={parentSelectedProduct}
                fields={productFields[parentSelectedProduct.id]}
                onFieldsUpdate={handleFieldsUpdate}
                onCancel={() => setShowEditableFields(false)}
              />
            </div>
          )}

          {/* Label Preview - Centered */}
          {parentSelectedProduct && productFields[parentSelectedProduct.id] && (
            <div className="flex flex-col items-center w-full animate-fadeIn label-preview-container gap-4">
              {/* Edit Controls */}
              {!showEditableFields && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEditableFields(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Edit Fields
                  </button>
                </div>
              )}
              
              {!showEditableFields && (
                <ProductBlueprintCard
                  product={parentSelectedProduct}
                  fields={productFields[parentSelectedProduct.id]}
                  selectedCustomer={selectedCustomer}
                  printSettings={printSettings}
                />
              )}
            </div>
          )}
          
          {/* No Product Selected Message - Centered */}
          {!parentSelectedProduct && (
            <div className="text-center">
              <img 
                src="/logo123.png" 
                alt="Flora" 
                className="w-32 h-32 mx-auto mb-6 opacity-30 object-contain"
                style={{
                  animation: 'subtle-float 3s ease-in-out infinite'
                }}
              />
              <p className="text-neutral-300 text-2xl mb-3 font-light">No Product Selected</p>
              <p className="text-neutral-500 text-base">Select a product from the dropdown above to preview its label</p>
              
              {/* Custom CSS animations */}
              <style jsx>{`
                @keyframes subtle-float {
                  0%, 100% { 
                    transform: translateY(0px) scale(1);
                    opacity: 0.3;
                  }
                  50% { 
                    transform: translateY(-2px) scale(1.02);
                    opacity: 0.4;
                  }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    );
  }
);

BlueprintFieldsGrid.displayName = 'BlueprintFieldsGrid';

interface ProductBlueprintCardProps {
  product: Product;
  fields: ProductBlueprintFields;
  selectedCustomer?: WordPressUser | null;
  printSettings?: PrintSettings | null;
}

interface EditableFieldsProps {
  product: Product;
  fields: ProductBlueprintFields;
  onFieldsUpdate: (productId: number, updatedFields: ProductBlueprintFields) => void;
}

const ProductBlueprintCard: React.FC<ProductBlueprintCardProps> = ({ product, fields, selectedCustomer, printSettings }) => {
  const { user } = useAuth();
  const [editableFields, setEditableFields] = useState(fields.fields);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Update editableFields when fields prop changes
  useEffect(() => {
    setEditableFields(fields.fields);
  }, [fields.fields]);

  const handleFieldChange = (fieldName: string, newValue: any) => {
    setEditableFields(prev => 
      prev.map(field => 
        field.field_name === fieldName 
          ? { ...field, field_value: newValue }
          : field
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Find fields that have changed
      const changedFields = editableFields.filter(editableField => {
        const originalField = fields.fields.find(f => f.field_name === editableField.field_name);
        return originalField && originalField.field_value !== editableField.field_value;
      });

      if (changedFields.length === 0) {
        console.log('No changes to save');
        setIsEditing(false);
        return;
      }

      console.log('Saving changed fields:', changedFields);

      // Call the API to update fields
      const fieldsToUpdate = changedFields.map(field => ({
        field_name: field.field_name,
        field_value: field.field_value
      }));

      const response = await fetch('/api/blueprint-fields/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          fields: fieldsToUpdate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fields');
      }

      const result = await response.json();
      console.log('✅ Fields saved successfully:', result);
      
      setIsEditing(false);
      
      // Optionally refresh the parent component data
      // This would require passing a refresh callback from parent
    } catch (error) {
      console.error('❌ Failed to save fields:', error);
      alert('Failed to save fields: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditableFields(fields.fields); // Reset to original values
    setIsEditing(false);
  };
  
  // Determine card size based on label settings - TRUE TO SIZE
  const getCardSizeClass = () => {
    if (!printSettings) return '';
    
    const baseUnit = 100; // pixels per inch for screen display (adjusted for better visibility)
    
    // Apply true aspect ratios
    if (isPortrait) {
      switch (printSettings.labelSize) {
        case '2x3':
          return 'w-[200px] h-[300px]'; // 2" x 3" at 100ppi
        case '2x4':
          return 'w-[200px] h-[400px]'; // 2" x 4" at 100ppi
        case '4x6':
          return 'w-[400px] h-[600px]'; // 4" x 6" at 100ppi
        default:
          return '';
      }
    } else {
      // Landscape (rotated 90 degrees)
      switch (printSettings.labelSize) {
        case '2x3':
          return 'w-[300px] h-[200px]'; // 3" x 2" at 100ppi
        case '2x4':
          return 'w-[400px] h-[200px]'; // 4" x 2" at 100ppi
        case '4x6':
          return 'w-[600px] h-[400px]'; // 6" x 4" at 100ppi
        default:
          return '';
      }
    }
  };
  
  // Determine if layout should be compact
  const isCompact = printSettings?.labelSize === '2x3';
  const isPortrait = printSettings?.orientation === 'portrait';
  
  // For 2x3 labels, use a more compact layout
  if (isCompact) {
    // Portrait orientation for 2x3
    if (isPortrait) {
      return (
        <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden flex flex-col ${getCardSizeClass()}`}>
          {/* Portrait Layout for 2x3 */}
          <div className="p-3 h-full flex flex-col justify-between">
            {/* Logo centered */}
            <div className="flex justify-center">
              <img
                src="/logoprint.png"
                alt="FloraDistro Logo"
                className="w-12 h-12 object-contain"
                loading="lazy"
              />
            </div>
            
            {/* Product Name */}
            <h3 className="text-sm text-neutral-900 text-center leading-tight" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
              {product.name}
            </h3>
            
            {/* Compact Fields Grid */}
            <div className="grid grid-cols-2 gap-1">
              {fields.fields.slice(0, 6).map((field, index) => (
                <div 
                  key={`${field.field_name}-${index}`} 
                  className="bg-neutral-200 border border-black/15 rounded p-1 text-center"
                >
                  <dt className="text-[8px] font-bold text-neutral-600 uppercase">
                    {field.field_label.substring(0, 6)}
                  </dt>
                  <dd className="text-[9px] font-black text-neutral-900">
                    {field.field_type === 'number' && field.field_value ? 
                      `${field.field_value}${field.field_name === 'thca_percentage' ? '%' : ''}` :
                      String(field.field_value || 'N/A').substring(0, 8)
                    }
                  </dd>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            {printSettings?.includeQRCode && (
              <div className="flex justify-center pt-1">
                <QRCode
                  value={`https://floradistro.com/product/${product.id}`}
                  size={35}
                  bgColor="#f5f5f5"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Landscape orientation for 2x3
      return (
        <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden ${getCardSizeClass()}`}>
          {/* Landscape Layout for 2x3 */}
          <div className="p-3 h-full flex gap-2">
            {/* Left side with logo */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/logoprint.png"
                alt="FloraDistro Logo"
                className="w-16 h-16 object-contain"
                loading="lazy"
              />
              {printSettings?.includeQRCode && (
                <QRCode
                  value={`https://floradistro.com/product/${product.id}`}
                  size={30}
                  bgColor="#f5f5f5"
                  fgColor="#000000"
                  level="M"
                />
              )}
            </div>
            
            {/* Right side with content */}
            <div className="flex-1 space-y-1">
              <h3 className="text-lg text-neutral-900 leading-tight" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                {product.name}
              </h3>
              
              <div className="grid grid-cols-3 gap-0.5">
                {fields.fields.slice(0, 6).map((field, index) => (
                  <div 
                    key={`${field.field_name}-${index}`} 
                    className="bg-neutral-200 border border-black/15 rounded p-0.5 text-center"
                  >
                    <dt className="text-[7px] font-bold text-neutral-600 uppercase">
                      {field.field_label.substring(0, 5)}
                    </dt>
                    <dd className="text-[8px] font-black text-neutral-900">
                      {field.field_type === 'number' && field.field_value ? 
                        `${field.field_value}` :
                        String(field.field_value || 'N/A').substring(0, 6)
                      }
                    </dd>
                  </div>
                ))}
              </div>
              
              <div className="text-[8px] text-neutral-600">
                {user?.location || 'FloraDistro'}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  
  // For 4x6 labels
  if (printSettings?.labelSize === '4x6') {
    // Portrait orientation for 4x6
    if (isPortrait) {
      return (
        <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden flex flex-col ${getCardSizeClass()}`}>
          {/* Portrait Layout for 4x6 */}
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto">
            {/* Header with Logo */}
            <div className="flex flex-col items-center gap-2">
              <img
                src="/logoprint.png"
                alt="FloraDistro Logo"
                className="w-40 h-40 object-contain"
                loading="lazy"
              />
              <h3 className="text-5xl text-neutral-900 text-center leading-tight" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                {product.name}
              </h3>
            </div>
            
            {/* Product Image if available */}
            {product.image && (
              <div className="flex justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded-lg border border-black/20"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Fields Grid */}
            <div className="grid grid-cols-2 gap-3">
              {fields.fields.map((field, index) => (
                <div 
                  key={`${field.field_name}-${index}`} 
                  className="bg-neutral-200 border border-black/15 rounded p-3 text-center"
                >
                  <dt className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
                    {field.field_label}
                  </dt>
                  <dd className="text-lg font-black text-neutral-900">
                    {field.field_type === 'number' && field.field_value ? 
                      `${field.field_value}${field.field_name === 'thca_percentage' ? '%' : ''}` :
                      field.field_value || 'N/A'
                    }
                  </dd>
                </div>
              ))}
            </div>
            
            {/* Footer Section */}
            <div className="bg-neutral-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-neutral-800 text-sm uppercase tracking-wide">DISPENSED BY:</div>
                  <div className="text-neutral-700 font-semibold text-3xl" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                    Flora Distro
                  </div>
                  <div className="text-neutral-700 text-base">{user?.location || 'FloraDistro'}</div>
                </div>
                
                {printSettings?.includeQRCode && (
                  <div className="flex flex-col items-center">
                    <QRCode
                      value={`https://floradistro.com/product/${product.id}`}
                      size={100}
                      bgColor="#f5f5f5"
                      fgColor="#000000"
                      level="M"
                    />
                    <div className="text-xs font-bold text-neutral-800 mt-1 uppercase">
                      SCAN FOR COA
                    </div>
                  </div>
                )}
              </div>
              
              {selectedCustomer && printSettings?.includeCustomer && (
                <div className="border-t border-black/15 pt-3">
                  <div className="font-bold text-neutral-800 text-sm uppercase tracking-wide">SEALED FRESH FOR:</div>
                  <div className="font-bold text-neutral-900 text-lg">
                    {(selectedCustomer.display_name || selectedCustomer.username).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Landscape orientation for 4x6 (original horizontal layout)
      return (
        <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden ${getCardSizeClass()}`}>
          {/* Landscape Layout for 4x6 */}
          <div className="p-4 h-full flex gap-6">
          {/* Left Section */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/logoprint.png"
                alt="FloraDistro Logo"
                className="w-32 h-32 object-contain"
                loading="lazy"
              />
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg border border-black/20"
                  loading="lazy"
                />
              )}
            </div>
            
            <h3 className="text-4xl text-neutral-900 leading-tight" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
              {product.name}
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {fields.fields.map((field, index) => (
                <div 
                  key={`${field.field_name}-${index}`} 
                  className="bg-neutral-200 border border-black/15 rounded p-2 text-center"
                >
                  <dt className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
                    {field.field_label}
                  </dt>
                  <dd className="text-sm font-black text-neutral-900">
                    {field.field_type === 'number' && field.field_value ? 
                      `${field.field_value}${field.field_name === 'thca_percentage' ? '%' : ''}` :
                      field.field_value || 'N/A'
                    }
                  </dd>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Section */}
          <div className="w-64 bg-neutral-200 rounded-lg p-3 space-y-3">
            <div>
              <div className="font-bold text-neutral-800 text-sm uppercase tracking-wide">DISPENSED BY:</div>
              <div className="text-neutral-700 font-semibold text-2xl" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                Flora Distro
              </div>
              <div className="text-neutral-700 text-sm">{user?.location || 'FloraDistro'}</div>
            </div>
            
            {printSettings?.includeQRCode && (
              <div className="flex flex-col items-center">
                <QRCode
                  value={`https://floradistro.com/product/${product.id}`}
                  size={120}
                  bgColor="#f5f5f5"
                  fgColor="#000000"
                  level="M"
                />
                <div className="text-[10px] font-bold text-neutral-800 mt-1 uppercase">
                  SCAN FOR COA
                </div>
              </div>
            )}
            
            {selectedCustomer && printSettings?.includeCustomer && (
              <div className="border-t border-black/15 pt-2">
                <div className="font-bold text-neutral-800 text-xs uppercase tracking-wide">FOR:</div>
                <div className="font-bold text-neutral-900 text-sm">
                  {(selectedCustomer.display_name || selectedCustomer.username).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
    }
  }
  
  // Default 2x4 layout (standard) - 2x4 means 2 inches wide by 4 inches tall
  // Landscape orientation for 2x4 (rotated to 4 inches wide by 2 inches tall)
  if (!isPortrait) {
    return (
      <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden ${getCardSizeClass()}`}>
        {/* Landscape Layout for 2x4 (4 wide x 2 tall) - Horizontal layout */}
        <div className="p-3 h-full flex gap-3">
          {/* Left side with logo and QR */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <img
              src="/logoprint.png"
              alt="FloraDistro Logo"
              className="w-20 h-20 object-contain"
              loading="lazy"
            />
            {printSettings?.includeQRCode && (
              <QRCode
                value={`https://floradistro.com/product/${product.id}`}
                size={50}
                bgColor="#f5f5f5"
                fgColor="#000000"
                level="M"
              />
            )}
          </div>
          
          {/* Middle section with product info */}
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl text-neutral-900 leading-tight" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
              {product.name}
            </h3>
            
            {/* Compact horizontal fields */}
            <div className="grid grid-cols-4 gap-1">
              {fields.fields.slice(0, 8).map((field, index) => (
                <div 
                  key={`${field.field_name}-${index}`} 
                  className="bg-neutral-200 border border-black/15 rounded p-1 text-center"
                >
                  <dt className="text-[8px] font-bold text-neutral-600 uppercase">
                    {field.field_label.substring(0, 6)}
                  </dt>
                  <dd className="text-[9px] font-black text-neutral-900">
                    {field.field_type === 'number' && field.field_value ? 
                      `${field.field_value}${field.field_name === 'thca_percentage' ? '%' : ''}` :
                      String(field.field_value || 'N/A').substring(0, 6)
                    }
                  </dd>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side with dispensary info */}
          <div className="bg-neutral-200 rounded-lg p-2 min-w-[120px]">
            <div className="text-[9px] font-bold text-neutral-800 uppercase">Dispensed By:</div>
            <div className="text-neutral-700 font-semibold text-base" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
              Flora Distro
            </div>
            <div className="text-[9px] text-neutral-600">{user?.location || 'FloraDistro'}</div>
            {selectedCustomer && printSettings?.includeCustomer && (
              <div className="mt-1 pt-1 border-t border-black/10">
                <div className="text-[8px] font-bold text-neutral-800 uppercase">For:</div>
                <div className="text-[9px] font-bold text-neutral-900">
                  {(selectedCustomer.display_name || selectedCustomer.username).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Portrait orientation for 2x4 (natural orientation - 2 inches wide by 4 inches tall)
  return (
    <div className={`bg-neutral-100 border border-black/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none overflow-hidden flex flex-col ${getCardSizeClass()}`}>
      {/* Portrait Layout for 2x4 (2 wide x 4 tall - original layout) */}
      <div className="p-4 h-full grid grid-cols-2 gap-4">
        
        {/* Left Column: Logo + Product Info + Fields */}
        <div className="space-y-4">
          {/* Header: Logo + Product Image */}
          <div className="flex flex-col items-center gap-4 mb-4">
            {/* Centered Logo */}
            <div className="w-48 h-48 flex-shrink-0">
              <img
                src="/logoprint.png"
                alt="FloraDistro Logo"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            
            {product.image && (
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-black/20">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Full Width Product Name */}
          <div className="w-full mb-6 text-center">
            <h3 className="text-6xl text-neutral-900 leading-tight tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
              {product.name}
            </h3>
          </div>

          {/* Product Specifications */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {fields.fields.map((field, index) => (
              <div 
                key={`${field.field_name}-${index}`} 
                className="bg-neutral-100 border border-black/15 rounded p-1.5 text-center hover:bg-neutral-200 transition-colors"
              >
                  <dt className="text-xs font-bold text-neutral-600 mb-0.5 uppercase tracking-wide">
                    {field.field_label}
                  </dt>
                  <dd className="text-xs font-black text-neutral-900" title={String(field.field_value || 'N/A')}>
                    {field.field_type === 'number' && field.field_value ? 
                      `${field.field_value}${field.field_name === 'thca_percentage' ? '%' : ''}` :
                      field.field_value || 'N/A'
                    }
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dispensed By Info */}
        <div className="bg-neutral-200 border border-black/15 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-4">
            {/* Dispensed By Info */}
            <div className="flex-1">
              <div className="font-bold text-neutral-800 text-sm mb-2 uppercase tracking-wide">DISPENSED BY:</div>
              <div className="text-neutral-700 font-semibold text-3xl mb-2 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                Flora Distro
              </div>
              <div className="text-neutral-700 font-semibold text-lg">{user?.location || 'FloraDistro'}</div>
              <div className="text-neutral-600 text-sm mt-1">123 Main Street, Charlotte, NC 28202</div>
            </div>

            {/* QR Code */}
            <div className="flex-shrink-0 -m-4 ml-4 flex flex-col items-center justify-center">
              <QRCode
                value={`https://floradistro.com/product/${product.id}`}
                size={160}
                bgColor="#f5f5f5"
                fgColor="#000000"
                level="M"
              />
              <div className="text-xs font-bold text-neutral-800 mt-2 uppercase tracking-wide text-center">
                SCAN FOR COA
              </div>
            </div>
          </div>

          <div className="border-t border-black/15 pt-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Label Info */}
              <div>
                <div className="font-bold text-neutral-800 text-sm mb-2 uppercase tracking-wide">LABEL INFO:</div>
                <div className="text-neutral-600 text-sm">Generated: {new Date().toLocaleDateString()}</div>
                <div className="text-neutral-600 text-sm">Time: {new Date().toLocaleTimeString()}</div>
              </div>

              {/* Sealed Fresh For */}
              {selectedCustomer && (
                <div>
                  <div className="font-bold text-neutral-800 text-sm mb-2 uppercase tracking-wide">SEALED FRESH FOR:</div>
                  <div className="font-bold text-neutral-900 text-base">
                    {(selectedCustomer.display_name || selectedCustomer.username).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-black/15 pt-3">
            <div className="text-xs text-neutral-500 text-center leading-relaxed">
              This product has not been analyzed or approved by the FDA. This product is not for use by minors, women who are pregnant or breast feeding, or persons with or at risk of heart disease, high blood pressure, diabetes, or taking medicine for depression or asthma. Keep out of reach of children and pets. For use only by adults 21 years of age and older. State of North Carolina compliant product.
            </div>
            <div className="text-xs text-neutral-600 text-center mt-3 font-medium">
              visit www.floradistro.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Editable Fields Component
interface EditableFieldsComponentProps {
  product: Product;
  fields: ProductBlueprintFields;
  onFieldsUpdate: (productId: number, updatedFields: ProductBlueprintFields) => void;
  onCancel: () => void;
}

const EditableFieldsComponent: React.FC<EditableFieldsComponentProps> = ({ 
  product, 
  fields, 
  onFieldsUpdate, 
  onCancel 
}) => {
  const [editableFields, setEditableFields] = useState(fields.fields);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (fieldName: string, newValue: any) => {
    setEditableFields(prev => 
      prev.map(field => 
        field.field_name === fieldName 
          ? { ...field, field_value: newValue }
          : field
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Find fields that have changed
      const changedFields = editableFields.filter(editableField => {
        const originalField = fields.fields.find(f => f.field_name === editableField.field_name);
        return originalField && originalField.field_value !== editableField.field_value;
      });

      if (changedFields.length === 0) {
        console.log('No changes to save');
        onCancel();
        return;
      }

      console.log('Saving changed fields:', changedFields);

      // Call the API to update fields
      const fieldsToUpdate = changedFields.map(field => ({
        field_name: field.field_name,
        field_value: field.field_value
      }));

      const response = await fetch('/api/blueprint-fields/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          fields: fieldsToUpdate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fields');
      }

      const result = await response.json();
      console.log('✅ Fields saved successfully:', result);
      
      // Update the parent component with new field values
      const updatedFields: ProductBlueprintFields = {
        ...fields,
        fields: editableFields
      };
      onFieldsUpdate(product.id, updatedFields);
      
    } catch (error) {
      console.error('❌ Failed to save fields:', error);
      alert('Failed to save fields: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-neutral-200">
          Edit Fields: {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {editableFields.map((field, index) => (
          <div key={`${field.field_name}-${index}`} className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              {field.field_label}
            </label>
            {field.field_type === 'number' ? (
              <input
                type="number"
                value={field.field_value || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 focus:border-blue-500 focus:outline-none"
                step="0.01"
              />
            ) : field.field_type === 'select' ? (
              <select
                value={field.field_value || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select...</option>
                {/* You can add predefined options here based on field.field_name */}
                {field.field_name === 'strain_type' && (
                  <>
                    <option value="Indica">Indica</option>
                    <option value="Sativa">Sativa</option>
                    <option value="Hybrid">Hybrid</option>
                  </>
                )}
              </select>
            ) : (
              <input
                type="text"
                value={field.field_value || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-200 focus:border-blue-500 focus:outline-none"
              />
            )}
            {field.field_description && (
              <p className="text-xs text-neutral-500">{field.field_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlueprintFieldsGrid;
