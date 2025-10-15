'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { LoadingSpinner } from './LoadingSpinner';
import { Category, Product } from '../../types';

interface ColumnSelectorProps {
  categories: Category[];
  selectedCategory?: string;
  categoryColumnConfigs: Map<string, string[]>;
  onColumnsChange: (categorySlug: string, columns: string[]) => void;
  className?: string;
  products: Product[]; // Pass products to extract fields from
}

interface FieldOption {
  field_name: string;
  field_label: string;
  field_type: string;
  count: number;
}

export function ColumnSelector({ 
  categories, 
  selectedCategory, 
  categoryColumnConfigs, 
  onColumnsChange,
  className = "",
  products = []
}: ColumnSelectorProps) {
  
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  // Get current category's column selection
  const getCurrentColumns = (): string[] => {
    if (!selectedCategory) return ['name'];
    return categoryColumnConfigs.get(selectedCategory) || ['name'];
  };

  const currentSelectedColumns = getCurrentColumns();
  const [lastFetchedCategory, setLastFetchedCategory] = useState<string | null>(null);

  // Extract fields from products for the selected category
  useEffect(() => {
    const extractCategoryFields = () => {
      if (!selectedCategory) {
        setAvailableFields([]);
        setLastFetchedCategory(null);
        return;
      }

      // Skip if already processed this category
      if (selectedCategory === lastFetchedCategory) {
        return;
      }

      const category = categories.find(cat => cat.slug === selectedCategory);
      if (!category) {
        setAvailableFields([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 Extracting Flora Fields for category: ${category.name} (ID: ${category.id})`);
        
        // Filter products in this category
        const categoryProducts = products.filter(p => 
          p.categories?.some(c => c.id === category.id)
        );
        
        setLastFetchedCategory(selectedCategory);
        
        if (categoryProducts.length === 0) {
          console.log(`⚠️ No products found for category: ${category.name}`);
          setAvailableFields([
            { field_name: 'name', field_label: 'Product Name', field_type: 'text', count: 0 }
          ]);
          setLoading(false);
          return;
        }

        // Aggregate all unique fields from all products in the category
        const fieldMap = new Map<string, FieldOption>();
        
        // Always add product name as the first field
        fieldMap.set('name', {
          field_name: 'name',
          field_label: 'Product Name',
          field_type: 'text',
          count: categoryProducts.length
        });

        // Extract Flora Fields V2 from products
        categoryProducts.forEach(product => {
          if (product.fields && Array.isArray(product.fields)) {
            product.fields.forEach(field => {
              if (field.has_value && field.value) {
                const fieldName = field.name;
                if (fieldMap.has(fieldName)) {
                  fieldMap.get(fieldName)!.count++;
                } else {
                  fieldMap.set(fieldName, {
                    field_name: fieldName,
                    field_label: field.label || fieldName,
                    field_type: field.type || 'text',
                    count: 1
                  });
                }
              }
            });
          }
        });

        const fields = Array.from(fieldMap.values()).sort((a, b) => {
          // Product name always first
          if (a.field_name === 'name') return -1;
          if (b.field_name === 'name') return 1;
          // Then sort by count (most common first), then by label
          if (a.count !== b.count) return b.count - a.count;
          return a.field_label.localeCompare(b.field_label);
        });

        console.log(`✅ Found ${fields.length} Flora Fields for ${category.name}:`, 
          fields.map(f => `${f.field_label} (${f.count} products)`));
        
        setAvailableFields(fields);
      } catch (err) {
        console.error('Error extracting Flora Fields:', err);
        setError(err instanceof Error ? err.message : 'Failed to load fields');
        // Fallback to just product name on error
        setAvailableFields([
          { field_name: 'name', field_label: 'Product Name', field_type: 'text', count: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    extractCategoryFields();
  }, [selectedCategory, products, categories]);

  const handleColumnToggle = (fieldName: string) => {
    if (!selectedCategory) return;
    
    const newColumns = currentSelectedColumns.includes(fieldName)
      ? currentSelectedColumns.filter(col => col !== fieldName)
      : [...currentSelectedColumns, fieldName];
    
    onColumnsChange(selectedCategory, newColumns);
  };

  const handleSelectAll = () => {
    if (!selectedCategory) return;
    onColumnsChange(selectedCategory, availableFields.map(field => field.field_name));
  };

  const handleSelectNone = () => {
    if (!selectedCategory) return;
    onColumnsChange(selectedCategory, ['name']); // Keep at least product name
  };

  if (!selectedCategory) {
    return null;
  }

  const category = categories.find(c => c.slug === selectedCategory);
  if (!category) {
    return null;
  }

  return (
    <>
      <button
        ref={setButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white text-xs font-medium transition-all duration-200 backdrop-blur-sm flex items-center gap-2 ${className}`}
        style={{ fontFamily: 'Tiempos, serif' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 012 2v10a2 2 0 01-2 2m-6 0a6 6 0 0012 0v-1" />
        </svg>
        Columns ({currentSelectedColumns.length})
      </button>

      {isOpen && buttonRef && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ zIndex: 999998 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div
            className="fixed rounded-2xl shadow-2xl"
            style={{
              zIndex: 999999,
              top: Math.min(buttonRef.getBoundingClientRect().bottom + 8, window.innerHeight - 520),
              left: Math.max(16, Math.min(buttonRef.getBoundingClientRect().left, window.innerWidth - 336)),
              minWidth: '320px',
              maxWidth: '400px',
              maxHeight: '500px',
              background: 'rgba(23, 23, 23, 0.98)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              fontFamily: 'Tiempos, serif'
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{category.name} - Columns</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-2 overflow-y-auto" style={{ maxHeight: '350px' }}>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : error ? (
                <div className="px-4 py-3 text-xs text-red-400">
                  {error}
                </div>
              ) : availableFields.length === 0 ? (
                <div className="px-4 py-3 text-xs text-white/50">
                  No fields available
                </div>
              ) : (
                <div className="space-y-1">
                  {availableFields.map(field => {
                    const isSelected = currentSelectedColumns.includes(field.field_name);
                    const isProductName = field.field_name === 'name';
                    
                    return (
                      <button
                        key={field.field_name}
                        onClick={() => !isProductName && handleColumnToggle(field.field_name)}
                        disabled={isProductName}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isProductName
                            ? 'bg-white/5 text-white/40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-white/10 text-white hover:bg-white/15'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-400/50'
                            : 'border-white/20'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {field.field_label}
                            {isProductName && <span className="text-white/30 ml-2">(Required)</span>}
                          </div>
                          <div className="text-[10px] text-white/40">
                            {field.count} product{field.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
              <div className="text-[10px] text-white/40">
                {currentSelectedColumns.length} column{currentSelectedColumns.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
