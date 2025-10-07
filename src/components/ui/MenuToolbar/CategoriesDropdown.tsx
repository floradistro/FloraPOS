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
  onQuadrantChange: (quadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '') => void;
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
  onQuadrantChange,
  orientation
}) => {
  const clearAllCategories = () => {
    if (isDualMode) {
      onDualMenuChange({
        ...dualMenu,
        left: { ...dualMenu.left, category: null },
        right: { ...dualMenu.right, category: null },
        leftBottom: { ...(dualMenu.leftBottom || { viewMode: 'auto', showImages: false, priceLocation: 'inline' }), category: null },
        rightBottom: { ...(dualMenu.rightBottom || { viewMode: 'auto', showImages: false, priceLocation: 'inline' }), category: null },
        enableLeftStacking: false,
        enableRightStacking: false
      });
    } else {
      onSingleMenuChange({ ...singleMenu, category: null });
    }
  };

  const selectSingleCategory = (categorySlug: string) => {
    console.log('📁 Selecting single category:', categorySlug);
    const newConfig = { ...singleMenu, category: categorySlug };
    console.log('📁 New single menu config:', newConfig);
    onSingleMenuChange(newConfig);
  };

  const selectDualCategory = (position: 'left' | 'right' | 'leftBottom' | 'rightBottom', categorySlug: string | null) => {
    console.log(`📁 Selecting ${position} category:`, categorySlug);
    const updates: Partial<DualMenuConfig> = {};
    
    if (position === 'leftBottom') {
      updates.leftBottom = { ...(dualMenu.leftBottom || { viewMode: 'auto', showImages: false, priceLocation: 'inline' }), category: categorySlug };
      updates.enableLeftStacking = !!categorySlug;
    } else if (position === 'rightBottom') {
      updates.rightBottom = { ...(dualMenu.rightBottom || { viewMode: 'auto', showImages: false, priceLocation: 'inline' }), category: categorySlug };
      updates.enableRightStacking = !!categorySlug;
    } else {
      updates[position] = { ...dualMenu[position], category: categorySlug };
    }

    const newDualMenu = { ...dualMenu, ...updates };
    console.log(`📁 New dual menu config for ${position}:`, newDualMenu[position === 'left' || position === 'right' ? position : position === 'leftBottom' ? 'leftBottom' : 'rightBottom']);
    onDualMenuChange(newDualMenu);
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
              <div 
                onClick={() => {
                  onQuadrantChange('left');
                  console.log('🟢 LEFT quadrant now active');
                }}
                className="cursor-pointer"
              >
                <select 
                  value={dualMenu.left.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('left');
                    selectDualCategory('left', e.target.value || null);
                    console.log('🟢 LEFT selected:', e.target.value);
                  }}
                  onFocus={() => {
                    onQuadrantChange('left');
                    console.log('🟢 LEFT focused');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('left');
                  }}
                  className={`w-full px-2 py-1 rounded text-xs border focus:outline-none ${
                    selectedQuadrant === 'left' 
                      ? 'bg-white/10 border-white/40 text-white font-medium' 
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
              </div>
              
              {/* Right Top */}
              <div 
                onClick={() => {
                  onQuadrantChange('right');
                  console.log('🔵 RIGHT quadrant now active');
                }}
                className="cursor-pointer"
              >
                <select 
                  value={dualMenu.right.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('right');
                    selectDualCategory('right', e.target.value || null);
                    console.log('🔵 RIGHT selected:', e.target.value);
                  }}
                  onFocus={() => {
                    onQuadrantChange('right');
                    console.log('🔵 RIGHT focused');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('right');
                  }}
                  className={`w-full px-2 py-1 rounded text-xs border focus:outline-none ${
                    selectedQuadrant === 'right' 
                      ? 'bg-white/10 border-white/40 text-white font-medium' 
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
              </div>

              {/* Left Bottom */}
              <div 
                onClick={() => {
                  onQuadrantChange('leftBottom');
                  console.log('🟠 LEFT BOTTOM quadrant now active');
                }}
                className="cursor-pointer"
              >
                <select 
                  value={dualMenu.leftBottom?.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('leftBottom');
                    selectDualCategory('leftBottom', e.target.value || null);
                    console.log('🟠 LEFT BOTTOM selected:', e.target.value);
                  }}
                  onFocus={() => {
                    onQuadrantChange('leftBottom');
                    console.log('🟠 LEFT BOTTOM focused');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('leftBottom');
                  }}
                  className={`w-full px-2 py-1 rounded text-xs border focus:outline-none ${
                    selectedQuadrant === 'leftBottom' 
                      ? 'bg-white/10 border-white/40 text-white font-medium' 
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
              </div>

              {/* Right Bottom */}
              <div 
                onClick={() => {
                  onQuadrantChange('rightBottom');
                  console.log('🟣 RIGHT BOTTOM quadrant now active');
                }}
                className="cursor-pointer"
              >
                <select 
                  value={dualMenu.rightBottom?.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('rightBottom');
                    selectDualCategory('rightBottom', e.target.value || null);
                    console.log('🟣 RIGHT BOTTOM selected:', e.target.value);
                  }}
                  onFocus={() => {
                    onQuadrantChange('rightBottom');
                    console.log('🟣 RIGHT BOTTOM focused');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('rightBottom');
                  }}
                  className={`w-full px-2 py-1 rounded text-xs border focus:outline-none ${
                    selectedQuadrant === 'rightBottom' 
                      ? 'bg-white/10 border-white/40 text-white font-medium' 
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
            </div>
            
            {/* Show current selection */}
            {selectedQuadrant && (
              <div className="mt-2 px-2 py-1 rounded bg-white/5 border border-white/20">
                <div className="text-xs text-white/70">
                  Currently configuring: <span className="font-medium text-white">
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
