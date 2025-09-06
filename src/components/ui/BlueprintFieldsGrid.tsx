'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { LoadingSpinner } from './LoadingSpinner';
import { WordPressUser } from '../../services/users-service';
import QRCode from 'react-qr-code';

export interface Product {
  id: number;
  name: string;
  sku: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface BlueprintFieldsGridProps {
  searchQuery?: string;
  categoryFilter?: string;
  onLoadingChange?: (loading: boolean, hasProducts: boolean) => void;
  selectedCustomer?: WordPressUser | null;
}

export const BlueprintFieldsGrid = forwardRef<{ refresh: () => Promise<void> }, BlueprintFieldsGridProps>(
  ({ searchQuery, categoryFilter, onLoadingChange, selectedCustomer }, ref) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [productFields, setProductFields] = useState<Record<number, ProductBlueprintFields>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      refresh: refreshData
    }));

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
        setProducts(productsData || []);

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

    // Filter products based on search and category
    const filteredProducts = products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !categoryFilter || 
        product.categories.some(cat => cat.slug === categoryFilter);
      
      return matchesSearch && matchesCategory;
    });

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading blueprint fields..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-400">No products found with blueprint fields</p>
        </div>
      );
    }

      return (
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-4">
          {filteredProducts.map((product) => {
            const fields = productFields[product.id];
            if (!fields || !fields.fields || fields.fields.length === 0) {
              return null;
            }

            return (
              <ProductBlueprintCard
                key={product.id}
                product={product}
                fields={fields}
                selectedCustomer={selectedCustomer}
              />
            );
          })}
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
}

const ProductBlueprintCard: React.FC<ProductBlueprintCardProps> = ({ product, fields, selectedCustomer }) => {
  const { user } = useAuth();
  return (
    <div className="bg-white border border-black/20 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 print:shadow-none">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        
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
                className="bg-neutral-50 border border-black/15 rounded p-1.5 text-center hover:bg-neutral-100 transition-colors"
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
        <div className="bg-neutral-50 border border-black/15 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-4">
            {/* Dispensed By Info */}
            <div className="flex-1">
              <div className="font-bold text-neutral-800 text-sm mb-2 uppercase tracking-wide">DISPENSED BY:</div>
              <div className="text-neutral-700 font-semibold text-3xl mb-2 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif', fontWeight: '100' }}>
                Flora Distro
              </div>
              <div className="text-neutral-700 font-semibold text-lg">{user?.location || 'FloraDistro'}</div>
              {user?.address && (
                <div className="text-neutral-600 text-sm mt-1">{user.address}</div>
              )}
              {!user?.address && (
                <div className="text-neutral-600 text-sm mt-1">123 Main Street, Charlotte, NC 28202</div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex-shrink-0 -m-4 ml-4 flex flex-col items-center justify-center">
              <QRCode
                value={`https://floradistro.com/product/${product.id}`}
                size={160}
                bgColor="#ffffff"
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

export default BlueprintFieldsGrid;
