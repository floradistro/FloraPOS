'use client';

import React from 'react';
import { MenuToolbarProps } from './types';
import { LayoutDropdown } from './LayoutDropdown';
import { DisplayDropdown } from './DisplayDropdown';
import { ColorDropdown } from './ColorDropdown';
import { MenuModeDropdown } from './MenuModeDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import { ColumnSelector } from '../ColumnSelector';

export const MenuToolbar: React.FC<MenuToolbarProps> = ({
  orientation,
  onOrientationChange,
  singleMenu,
  onSingleMenuChange,
  dualMenu,
  onDualMenuChange,
  isDualMode,
  onModeChange,
  selectedQuadrant,
  onQuadrantChange,
  backgroundColor,
  fontColor,
  containerColor,
  onColorsChange,
  categories,
  categoryColumnConfigs,
  onColumnsChange,
  onLaunch,
  canLaunch,
  launchTitle,
  openWindowsCount,
  maxWindows,
  pandaMode = false,
  onPandaModeToggle
}) => {
  // Determine current configuration based on mode and selected quadrant
  const getCurrentConfig = () => {
    if (!isDualMode) {
      return singleMenu;
    }
    
    // Return the configuration for the selected quadrant
    switch (selectedQuadrant) {
      case 'left':
        return dualMenu.left;
      case 'right':
        return dualMenu.right;
      case 'leftBottom':
        return dualMenu.leftBottom || { category: null, viewMode: 'auto', showImages: false };
      case 'rightBottom':
        return dualMenu.rightBottom || { category: null, viewMode: 'auto', showImages: false };
      default:
        return dualMenu.left; // Default fallback
    }
  };

  const handleConfigChange = (updates: Partial<typeof singleMenu>) => {
    if (!isDualMode) {
      onSingleMenuChange({ ...singleMenu, ...updates });
    } else {
      // Update only the selected quadrant
      if (selectedQuadrant) {
        const updatedDualMenu = {
          ...dualMenu,
          [selectedQuadrant]: { ...dualMenu[selectedQuadrant], ...updates }
        };
        onDualMenuChange(updatedDualMenu);
      }
    }
  };

  // selectedQuadrant is now passed as prop, no local state needed

  const handleLaunchDual = () => {
    // This would be passed down from the parent component
    onLaunch();
  };

  return (
    <div className="mb-2 relative z-50 pt-2 px-2 flex-shrink-0 w-full">
      <div className="flex items-center justify-between bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/50 rounded-lg px-2 py-2 w-full">
        {/* Left Side - Configuration Dropdowns */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <LayoutDropdown
            orientation={orientation}
            onOrientationChange={onOrientationChange}
          />

          <DisplayDropdown
            currentConfig={getCurrentConfig()}
            onConfigChange={handleConfigChange}
            pandaMode={pandaMode}
            onPandaModeToggle={onPandaModeToggle}
          />

          <ColorDropdown
            backgroundColor={backgroundColor}
            fontColor={fontColor}
            containerColor={containerColor}
            onColorsChange={onColorsChange}
          />

          <MenuModeDropdown
            isDualMode={isDualMode}
            onModeChange={onModeChange}
            dualMenu={dualMenu}
            onDualMenuChange={onDualMenuChange}
            selectedQuadrant={selectedQuadrant}
            onQuadrantChange={onQuadrantChange}
            categories={categories}
            orientation={orientation}
            onLaunchDual={handleLaunchDual}
          />
        </div>

        {/* Right Side - Categories, Columns & Launch */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CategoriesDropdown
            categories={categories}
            isDualMode={isDualMode}
            singleMenu={singleMenu}
            dualMenu={dualMenu}
            selectedQuadrant={selectedQuadrant}
            onSingleMenuChange={onSingleMenuChange}
            onDualMenuChange={onDualMenuChange}
            orientation={orientation}
          />
          
          <ColumnSelector
            categories={categories}
            selectedCategory={getCurrentConfig()?.category || undefined}
            categoryColumnConfigs={categoryColumnConfigs}
            onColumnsChange={onColumnsChange}
          />
          
          {/* Launch Button */}
          <button
            onClick={onLaunch}
            disabled={!canLaunch || openWindowsCount >= maxWindows}
            className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-neutral-600/50 hover:bg-neutral-600/10 hover:border-neutral-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              openWindowsCount >= maxWindows
                ? `Maximum of ${maxWindows} windows reached. Close some windows first.`
                : launchTitle
            }
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {openWindowsCount >= maxWindows 
              ? 'Max Reached' 
              : isDualMode && dualMenu.left.category && dualMenu.right.category ? 'Launch Dual' : 'Launch'}
          </button>
        </div>
      </div>
    </div>
  );
};
