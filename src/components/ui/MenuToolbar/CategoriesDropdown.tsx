'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem } from './DropdownItem';
import { MenuConfig, DualMenuConfig } from './types';

interface CategoriesDropdownProps {
  categories: Array<{ id: number; name: string; slug: string }>;
  isDualMode: boolean;
  singleMenu: MenuConfig;
  dualMenu: DualMenuConfig;
  selectedQuadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '';
  onSingleMenuChange: (config: MenuConfig) => void;
  onDualMenuChange: (config: DualMenuConfig) => void;
  orientation: 'horizontal' | 'vertical';
}

export const CategoriesDropdown: React.FC<CategoriesDropdownProps> = ({
  categories,
  isDualMode,
  singleMenu,
  dualMenu,
  selectedQuadrant,
  onSingleMenuChange,
  onDualMenuChange,
  orientation
}) => {
  const clearAllCategories = () => {
    if (isDualMode) {
      onDualMenuChange({
        ...dualMenu,
        left: { ...dualMenu.left, category: null },
        right: { ...dualMenu.right, category: null },
        leftBottom: { ...dualMenu.leftBottom, category: null },
        rightBottom: { ...dualMenu.rightBottom, category: null },
        enableLeftStacking: false,
        enableRightStacking: false
      });
    } else {
      onSingleMenuChange({ ...singleMenu, category: null });
    }
  };

  const selectSingleCategory = (categorySlug: string) => {
    onSingleMenuChange({ ...singleMenu, category: categorySlug });
  };

  const selectDualCategory = (position: 'left' | 'right' | 'leftBottom' | 'rightBottom', categorySlug: string | null) => {
    const updates: Partial<DualMenuConfig> = {};
    
    if (position === 'leftBottom') {
      updates.leftBottom = { ...dualMenu.leftBottom, category: categorySlug };
      updates.enableLeftStacking = !!categorySlug;
    } else if (position === 'rightBottom') {
      updates.rightBottom = { ...dualMenu.rightBottom, category: categorySlug };
      updates.enableRightStacking = !!categorySlug;
    } else {
      updates[position] = { ...dualMenu[position], category: categorySlug };
    }

    onDualMenuChange({ ...dualMenu, ...updates });
  };

  return (
    <ToolbarDropdown
      label="Categories"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      }
      isActive={!!(singleMenu.category || dualMenu.left.category || dualMenu.right.category)}
      className="dropdown-right"
    >
      {!isDualMode ? (
        // Single Menu Mode
        <div className="px-3 py-2">
          <div className="text-xs text-neutral-500 mb-2">SINGLE MENU</div>
          <DropdownItem
            icon={null}
            label="All Categories"
            description="Show all products"
            isActive={!singleMenu.category}
            onClick={() => selectSingleCategory('')}
          />
          {categories.map(category => (
            <DropdownItem
              key={category.id}
              icon={null}
              label={category.name}
              description=""
              isActive={singleMenu.category === category.slug}
              onClick={() => selectSingleCategory(category.slug)}
            />
          ))}
        </div>
      ) : (
        // Dual Menu Mode
        orientation === 'horizontal' && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-neutral-500">DUAL MENU</div>
              <button
                onClick={clearAllCategories}
                className="text-xs text-neutral-500 hover:text-neutral-300"
                title="Clear all categories"
              >
                ✕
              </button>
            </div>
            
            {/* Grid layout for category selectors */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left Top */}
              <select 
                value={dualMenu.left.category || ''} 
                onChange={(e) => selectDualCategory('left', e.target.value || null)}
                className={`px-2 py-1 rounded text-xs border focus:outline-none ${
                  selectedQuadrant === 'left' 
                    ? 'bg-green-900/50 border-green-500 text-green-300' 
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 focus:border-neutral-500'
                }`}
              >
                <option value="">Left Top</option>
                {categories.map(category => (
                  <option key={`left-${category.id}`} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {/* Right Top */}
              <select 
                value={dualMenu.right.category || ''} 
                onChange={(e) => selectDualCategory('right', e.target.value || null)}
                className={`px-2 py-1 rounded text-xs border focus:outline-none ${
                  selectedQuadrant === 'right' 
                    ? 'bg-blue-900/50 border-blue-500 text-blue-300' 
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 focus:border-neutral-500'
                }`}
              >
                <option value="">Right Top</option>
                {categories.map(category => (
                  <option key={`right-${category.id}`} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Left Bottom */}
              <select 
                value={dualMenu.leftBottom?.category || ''} 
                onChange={(e) => selectDualCategory('leftBottom', e.target.value || null)}
                className={`px-2 py-1 rounded text-xs border focus:outline-none ${
                  selectedQuadrant === 'leftBottom' 
                    ? 'bg-orange-900/50 border-orange-500 text-orange-300' 
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 focus:border-neutral-500'
                }`}
              >
                <option value="">Left Bottom</option>
                {categories.map(category => (
                  <option key={`left2-${category.id}`} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Right Bottom */}
              <select 
                value={dualMenu.rightBottom?.category || ''} 
                onChange={(e) => selectDualCategory('rightBottom', e.target.value || null)}
                className={`px-2 py-1 rounded text-xs border focus:outline-none ${
                  selectedQuadrant === 'rightBottom' 
                    ? 'bg-purple-900/50 border-purple-500 text-purple-300' 
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 focus:border-neutral-500'
                }`}
              >
                <option value="">Right Bottom</option>
                {categories.map(category => (
                  <option key={`right2-${category.id}`} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Show current selection */}
            {selectedQuadrant && (
              <div className="mt-2 px-2 py-1 rounded bg-neutral-800 border border-neutral-600">
                <div className="text-xs text-neutral-300">
                  Currently configuring: <span className={`font-medium ${
                    selectedQuadrant === 'left' ? 'text-green-400' :
                    selectedQuadrant === 'right' ? 'text-blue-400' :
                    selectedQuadrant === 'leftBottom' ? 'text-orange-400' :
                    'text-purple-400'
                  }`}>
                    {selectedQuadrant === 'left' ? 'Left Top' :
                     selectedQuadrant === 'right' ? 'Right Top' :
                     selectedQuadrant === 'leftBottom' ? 'Left Bottom' :
                     'Right Bottom'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </ToolbarDropdown>
  );
};
