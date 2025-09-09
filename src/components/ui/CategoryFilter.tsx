'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  onCategoryChange: (categorySlug: string | null) => void;
  loading?: boolean;
}

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  loading = false 
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (categorySlug: string | null) => {
    onCategoryChange(categorySlug);
    setIsOpen(false);
  };

  const selectedCategoryName = selectedCategory 
    ? categories.find(cat => cat.slug === selectedCategory)?.name || 'Unknown Category'
    : 'All Categories';

  const activeCategories = categories.filter(cat => cat.count && cat.count > 0);

  if (loading) {
    return (
      <div className="relative">
        <button 
          disabled
          className="flex items-center gap-2 px-3 h-[30px] bg-neutral-800/80 rounded text-neutral-500 cursor-not-allowed text-sm"
        >
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[30px] bg-neutral-800/80 hover:bg-neutral-700/80 rounded text-neutral-400 transition-colors min-w-[140px] justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <span className="truncate">{selectedCategoryName}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-neutral-800 rounded shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* All Categories Option */}
          <button
            onClick={() => handleCategorySelect(null)}
            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
              !selectedCategory
                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
            }`}
          >
            <span>All Categories</span>
            {!selectedCategory && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Divider */}
          {activeCategories.length > 0 && (
            <div className="h-px bg-neutral-700/50 mx-2 my-2" />
          )}

          {/* Category Options */}
          {activeCategories.length > 0 ? (
            activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                  selectedCategory === category.slug
                    ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                    : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
                }`}
              >
                <span>{category.name}</span>
                <div className="flex items-center gap-2">
                  {category.count && (
                    <span className="text-xs text-neutral-500 bg-neutral-700/50 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  )}
                  {selectedCategory === category.slug && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500 text-center">
              No categories available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
