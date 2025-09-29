'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem } from './DropdownItem';

interface LayoutDropdownProps {
  orientation: 'horizontal' | 'vertical';
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void;
}

export const LayoutDropdown: React.FC<LayoutDropdownProps> = ({
  orientation,
  onOrientationChange
}) => {
  return (
    <ToolbarDropdown
      label="Layout"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      }
      isActive={true}
    >
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
          </svg>
        }
        label="Horizontal"
        description="Wide landscape layout"
        isActive={orientation === 'horizontal'}
        onClick={() => onOrientationChange('horizontal')}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={2} />
          </svg>
        }
        label="Vertical"
        description="Tall portrait layout"
        isActive={orientation === 'vertical'}
        onClick={() => onOrientationChange('vertical')}
      />
    </ToolbarDropdown>
  );
};
