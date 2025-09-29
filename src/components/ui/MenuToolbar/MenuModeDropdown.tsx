'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem } from './DropdownItem';
import { DualMenuConfig } from './types';

interface MenuModeDropdownProps {
  isDualMode: boolean;
  onModeChange: (isDual: boolean) => void;
  dualMenu: DualMenuConfig;
  onDualMenuChange: (config: DualMenuConfig) => void;
  selectedQuadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '';
  onQuadrantChange: (quadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '') => void;
  categories: Array<{ id: number; name: string; slug: string }>;
  orientation: 'horizontal' | 'vertical';
  onLaunchDual: () => void;
}

export const MenuModeDropdown: React.FC<MenuModeDropdownProps> = ({
  isDualMode,
  onModeChange,
  dualMenu,
  onDualMenuChange,
  selectedQuadrant,
  onQuadrantChange,
  categories,
  orientation,
  onLaunchDual
}) => {
  const switchToSingleMode = () => {
    onModeChange(false);
    onQuadrantChange('');
  };

  const switchToDualMode = () => {
    onModeChange(true);
    if (!dualMenu.left.category && !dualMenu.right.category && categories.length >= 2) {
      onDualMenuChange({
        ...dualMenu,
        left: { ...dualMenu.left, category: categories[0].slug },
        right: { ...dualMenu.right, category: categories[1].slug }
      });
      onQuadrantChange('left');
    }
  };

  return (
    <ToolbarDropdown
      label="Menu Mode"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      }
      isActive={true}
    >
      {/* Mode Selection */}
      <div className="px-4 py-2 border-b border-neutral-600/30">
        <div className="text-xs text-neutral-400 font-medium mb-2">MENU MODE</div>
        <DropdownItem
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
          label="Single Menu"
          description="One category display"
          isActive={!isDualMode}
          onClick={switchToSingleMode}
        />
        <DropdownItem
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
            </svg>
          }
          label="Dual Menu"
          description="Side-by-side categories"
          isActive={isDualMode}
          onClick={switchToDualMode}
        />
      </div>

      {/* Quadrant Selection for Dual Mode */}
      {isDualMode && (
        <div className="px-4 py-2 border-b border-neutral-600/30">
          <div className="text-xs text-neutral-400 font-medium mb-2">SELECT QUADRANT TO CONFIGURE</div>
          <DropdownItem
            icon={<div className="w-3 h-3 rounded bg-green-500" />}
            label="Left Top"
            description="Configure left top quadrant"
            isActive={selectedQuadrant === 'left'}
            onClick={() => onQuadrantChange('left')}
          />
          <DropdownItem
            icon={<div className="w-3 h-3 rounded bg-blue-500" />}
            label="Right Top"
            description="Configure right top quadrant"
            isActive={selectedQuadrant === 'right'}
            onClick={() => onQuadrantChange('right')}
          />
          <DropdownItem
            icon={<div className="w-3 h-3 rounded bg-orange-500" />}
            label="Left Bottom"
            description="Configure left bottom quadrant"
            isActive={selectedQuadrant === 'leftBottom'}
            onClick={() => onQuadrantChange('leftBottom')}
          />
          <DropdownItem
            icon={<div className="w-3 h-3 rounded bg-purple-500" />}
            label="Right Bottom"
            description="Configure right bottom quadrant"
            isActive={selectedQuadrant === 'rightBottom'}
            onClick={() => onQuadrantChange('rightBottom')}
          />
        </div>
      )}

      {/* Launch Dual Menu */}
      {isDualMode && (
        <div className="px-4 py-2">
          <div className="text-xs text-neutral-400 font-medium mb-2">LAUNCH</div>
          <DropdownItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
              </svg>
            }
            label="Launch Dual Menu"
            description="Split screen dual category menu"
            isActive={!!(orientation === 'horizontal' && dualMenu.left.category && dualMenu.right.category)}
            disabled={!(orientation === 'horizontal' && dualMenu.left.category && dualMenu.right.category)}
            onClick={() => {
              const isDualEnabled = orientation === 'horizontal' && dualMenu.left.category && dualMenu.right.category;
              if (isDualEnabled) {
                onLaunchDual();
              } else {
                if (orientation !== 'horizontal') {
                  alert('Dual menu requires horizontal orientation');
                } else {
                  alert('Please select categories for both left and right menus');
                }
              }
            }}
          />
        </div>
      )}
    </ToolbarDropdown>
  );
};
