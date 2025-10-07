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
      label={isDualMode ? "Dual Menu" : "Single Menu"}
      icon={
        isDualMode ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )
      }
      isActive={true}
    >
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
    </ToolbarDropdown>
  );
};
