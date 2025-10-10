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
      icon={<></>}
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-xs font-medium">Categories</span>
        </div>
      }
      className="dropdown-right"
    >
      <div className="w-[400px]" style={{ fontFamily: 'Tiempos, serif' }}>
      {!isDualMode ? (
        // Single Menu Mode
        <div className="px-1 pb-1">
          <div className="text-[10px] text-white/40 mb-2 px-1 uppercase tracking-wider font-medium">Single Menu</div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            <button
              onClick={() => selectSingleCategory('')}
              className={`w-full px-3 py-2.5 text-left rounded-lg transition-all text-xs font-medium ${
                !singleMenu.category
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white/90'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => selectSingleCategory(category.slug)}
                className={`w-full px-3 py-2.5 text-left rounded-lg transition-all text-xs font-medium ${
                  singleMenu.category === category.slug
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Dual Menu Mode
        orientation === 'horizontal' && (
          <div className="px-1 pb-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Dual Menu</div>
              <button
                onClick={clearAllCategories}
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
                title="Clear all categories"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Grid layout for category selectors */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left Top */}
              <div>
                <label className="text-[10px] text-white/50 mb-1.5 block px-1">Left Top</label>
                <select 
                  value={dualMenu.left.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('left');
                    selectDualCategory('left', e.target.value || null);
                  }}
                  onFocus={() => onQuadrantChange('left')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('left');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border-0 focus:outline-none transition-all ${
                    selectedQuadrant === 'left' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Select...</option>
                  {categories.map(category => (
                    <option key={`left-${category.id}`} value={category.slug} style={{ background: '#1a1a1a' }}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Right Top */}
              <div>
                <label className="text-[10px] text-white/50 mb-1.5 block px-1">Right Top</label>
                <select 
                  value={dualMenu.right.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('right');
                    selectDualCategory('right', e.target.value || null);
                  }}
                  onFocus={() => onQuadrantChange('right')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('right');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border-0 focus:outline-none transition-all ${
                    selectedQuadrant === 'right' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Select...</option>
                  {categories.map(category => (
                    <option key={`right-${category.id}`} value={category.slug} style={{ background: '#1a1a1a' }}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Left Bottom */}
              <div>
                <label className="text-[10px] text-white/50 mb-1.5 block px-1">Left Bottom</label>
                <select 
                  value={dualMenu.leftBottom?.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('leftBottom');
                    selectDualCategory('leftBottom', e.target.value || null);
                  }}
                  onFocus={() => onQuadrantChange('leftBottom')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('leftBottom');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border-0 focus:outline-none transition-all ${
                    selectedQuadrant === 'leftBottom' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Select...</option>
                  {categories.map(category => (
                    <option key={`left2-${category.id}`} value={category.slug} style={{ background: '#1a1a1a' }}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Bottom */}
              <div>
                <label className="text-[10px] text-white/50 mb-1.5 block px-1">Right Bottom</label>
                <select 
                  value={dualMenu.rightBottom?.category || ''} 
                  onChange={(e) => {
                    onQuadrantChange('rightBottom');
                    selectDualCategory('rightBottom', e.target.value || null);
                  }}
                  onFocus={() => onQuadrantChange('rightBottom')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuadrantChange('rightBottom');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border-0 focus:outline-none transition-all ${
                    selectedQuadrant === 'rightBottom' 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2rem'
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Select...</option>
                  {categories.map(category => (
                    <option key={`right2-${category.id}`} value={category.slug} style={{ background: '#1a1a1a' }}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Show current selection */}
            {selectedQuadrant && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border-0">
                <div className="text-xs text-blue-300 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-medium">
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
      </div>
      
      <style jsx>{`
        /* Webkit scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </ToolbarDropdown>
  );
};
