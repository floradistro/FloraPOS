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
          className="flex items-center gap-2 px-3 h-[30px] bg-transparent border border-neutral-500/30 rounded-lg text-neutral-500 cursor-not-allowed text-sm"
        >
          <span className="text-sm">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[30px] bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg text-neutral-400 transition-all duration-300 ease-out min-w-[140px] justify-between text-sm"
      >
        <span className="truncate">{selectedCategoryName}</span>
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
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-neutral-700/95 border border-white/[0.08] rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
          {/* All Categories Option */}
          <button
            onClick={() => handleCategorySelect(null)}
            className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between ${
              !selectedCategory
                ? 'bg-neutral-600/5 text-neutral-300'
                : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
            }`}
          >
            <span>All Categories</span>
            {!selectedCategory && (
              <span className="text-xs">✓</span>
            )}
          </button>

          {/* Divider */}
          {activeCategories.length > 0 && (
            <div className="h-px bg-neutral-600/10 mx-2 my-2" />
          )}

          {/* Category Options */}
          {activeCategories.length > 0 ? (
            activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between ${
                  selectedCategory === category.slug
                    ? 'bg-neutral-600/5 text-neutral-300'
                    : 'text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-300'
                }`}
              >
                <span>{category.name}</span>
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
