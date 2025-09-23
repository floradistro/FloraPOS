'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BlueprintFieldsService, BlueprintField, ProductBlueprintFields } from '../../services/blueprint-fields-service';
import { LoadingSpinner } from './LoadingSpinner';
import { Category } from '../../types';

interface ColumnSelectorProps {
  categories: Category[];
  selectedCategory?: string;
  categoryColumnConfigs: Map<string, string[]>; // Per-category column configurations
  onColumnsChange: (categorySlug: string, columns: string[]) => void;
  className?: string;
}

interface FieldOption {
  field_name: string;
  field_label: string;
  field_type: string;
  count: number; // How many products have this field
}

export function ColumnSelector({ 
  categories, 
  selectedCategory, 
  categoryColumnConfigs, 
  onColumnsChange,
  className = ""
}: ColumnSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  // Get current category's column selection
  const getCurrentColumns = (): string[] => {
    if (!selectedCategory) return ['name'];
    return categoryColumnConfigs.get(selectedCategory) || ['name'];
  };

  const currentSelectedColumns = getCurrentColumns();

  // Fetch blueprint fields for the selected category
  useEffect(() => {
    const fetchCategoryFields = async () => {
      if (!selectedCategory) {
        setAvailableFields([]);
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
        console.log(`🔍 Fetching blueprint fields for category: ${category.name} (ID: ${category.id})`);
        
        const categoryProducts = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id);
        
        if (categoryProducts.length === 0) {
          console.log(`⚠️ No products with blueprint fields found for category: ${category.name}`);
          // Only show product name if no blueprint fields found
          setAvailableFields([
            { field_name: 'name', field_label: 'Product Name', field_type: 'text', count: 0 }
          ]);
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

        // Add only real blueprint fields from the API
        categoryProducts.forEach(productFields => {
          productFields.fields.forEach(field => {
            if (fieldMap.has(field.field_name)) {
              fieldMap.get(field.field_name)!.count++;
            } else {
              fieldMap.set(field.field_name, {
                field_name: field.field_name,
                field_label: field.field_label || field.field_name,
                field_type: field.field_type || 'text',
                count: 1
              });
            }
          });
        });

        const fields = Array.from(fieldMap.values()).sort((a, b) => {
          // Product name always first
          if (a.field_name === 'name') return -1;
          if (b.field_name === 'name') return 1;
          // Then sort by count (most common first), then by label
          if (a.count !== b.count) return b.count - a.count;
          return a.field_label.localeCompare(b.field_label);
        });

        console.log(`✅ Found ${fields.length} available fields for ${category.name}:`, 
          fields.map(f => `${f.field_label} (${f.count} products)`));
        
        setAvailableFields(fields);
      } catch (err) {
        console.error('Error fetching category blueprint fields:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blueprint fields');
        // Fallback to just product name on error
        setAvailableFields([
          { field_name: 'name', field_label: 'Product Name', field_type: 'text', count: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryFields();
  }, [selectedCategory, categories]);

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

  const handleSelectDefaults = () => {
    if (!selectedCategory) return;
    // Use the first 3-4 available fields as defaults
    const defaultFields = availableFields.slice(0, Math.min(4, availableFields.length)).map(f => f.field_name);
    onColumnsChange(selectedCategory, defaultFields);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={setButtonRef}
        onClick={() => selectedCategory && setIsOpen(!isOpen)}
        disabled={!selectedCategory}
        className={`flex items-center gap-2 px-3 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent ${
          selectedCategory 
            ? 'text-white border-neutral-600/50 hover:bg-neutral-600/10 hover:border-neutral-500/70 cursor-pointer' 
            : 'text-neutral-500 border-neutral-700/50 cursor-not-allowed'
        }`}
        title={selectedCategory ? "Select columns to display" : "Select a category first"}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2z" />
        </svg>
        Columns ({currentSelectedColumns.length})
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown positioned relative to button */}
      {isOpen && buttonRef && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div 
          className="fixed inset-0" 
          style={{ zIndex: 2147483647 }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="absolute w-80 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1f1f1f',
              border: '1px solid #404040',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              ...((() => {
                const rect = buttonRef.getBoundingClientRect();
                const dropdownHeight = 384; // max-h-96 = 384px
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                // Position above if not enough space below
                const shouldPositionAbove = spaceBelow < dropdownHeight + 8 && spaceAbove > dropdownHeight;
                
                return {
                  top: shouldPositionAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
                  left: Math.max(8, rect.right - 320),
                  maxHeight: shouldPositionAbove 
                    ? Math.min(384, spaceAbove - 8) 
                    : Math.min(384, spaceBelow - 8)
                };
              })())
            }}
          >
            {/* Header */}
            <div className="p-3 border-b border-neutral-700" style={{ backgroundColor: '#1f1f1f', borderBottomColor: '#404040' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                  Column Selection
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-1">
                <button
                  onClick={handleSelectDefaults}
                  className="px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                >
                  Defaults
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                >
                  All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                >
                  Name Only
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: '#1f1f1f' }}>
              {loading ? (
                <div className="p-4 text-center">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-neutral-400 mt-2">Loading blueprint fields...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-400 mb-2">Error loading fields</p>
                  <p className="text-xs text-neutral-400">{error}</p>
                </div>
              ) : (
                <div className="p-2">
                  {availableFields.map((field) => (
                    <label
                      key={field.field_name}
                      className="flex items-center gap-3 p-2 hover:bg-neutral-700/50 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={currentSelectedColumns.includes(field.field_name)}
                        onChange={() => handleColumnToggle(field.field_name)}
                        disabled={field.field_name === 'name'}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium truncate">
                            {field.field_label}
                          </span>
                          <span className="text-xs text-neutral-400 ml-2">
                            {field.count > 0 ? `${field.count}` : 'All'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500 font-mono">
                            {field.field_name}
                          </span>
                          <span className="text-xs text-neutral-500 bg-neutral-700/50 px-1.5 py-0.5 rounded">
                            {field.field_type}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-700" style={{ backgroundColor: '#1f1f1f', borderTopColor: '#404040' }}>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>
                  {currentSelectedColumns.length} of {availableFields.length} columns selected
                </span>
                <span>
                  {selectedCategory ? 
                    categories.find(c => c.slug === selectedCategory)?.name || 'Category' 
                    : 'Select a Category'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
