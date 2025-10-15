'use client';

import React from 'react';
import { MenuToolbarProps } from './types';
import { ConfigDropdown } from './ConfigDropdown';
import { LayoutDropdown } from './LayoutDropdown';
import { DisplayDropdown } from './DisplayDropdown';
import { ColorDropdown } from './ColorDropdown';
import { FontDropdown } from './FontDropdown';
import { TransparencyDropdown } from './TransparencyDropdown';
import { FontSizeDropdown } from './FontSizeDropdown';
import { BackgroundDropdown } from './BackgroundDropdown';
import { MenuModeDropdown } from './MenuModeDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import { ColumnSelector } from '../ColumnSelector';
import { TypographyDropdown } from './TypographyDropdown';
import { ElementsDropdown } from './ElementsDropdown';
import { LayoutDropdownV2 } from './LayoutDropdownV2';

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
  cardFontColor,
  imageBackgroundColor,
  titleFont,
  pricingFont,
  cardFont,
  onColorsChange,
  onFontsChange,
  containerOpacity,
  borderWidth,
  borderOpacity,
  imageOpacity,
  blurIntensity,
  glowIntensity,
  onTransparencyChange,
  headerTitleSize,
  cardTitleSize,
  priceSize,
  categorySize,
  onFontSizesChange,
  customBackground,
  onCustomBackgroundChange,
  categories,
  categoryColumnConfigs,
  onColumnsChange,
  onLaunch,
  canLaunch,
  launchTitle,
  openWindowsCount,
  maxWindows,
  pandaMode = false,
  onPandaModeToggle,
  // Config actions
  loadedConfigName,
  onLoadConfig,
  onSaveLayout,
  onSaveTheme,
  onLoadTheme,
  onQRCode,
  onStoreConfig,
  onToggleTVPanel,
  showTVPanel,
  onlineCount,
  totalTVs,
  hasLocation
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
    console.log('🔧 handleConfigChange called:', {
      isDualMode,
      selectedQuadrant,
      updates,
      currentConfig: isDualMode && selectedQuadrant ? dualMenu[selectedQuadrant] : singleMenu
    });
    
    if (!isDualMode) {
      const newConfig = { ...singleMenu, ...updates };
      console.log('✅ Updating single menu:', newConfig);
      onSingleMenuChange(newConfig);
    } else {
      // Update only the selected quadrant
      if (selectedQuadrant) {
        const currentQuadConfig = selectedQuadrant === 'leftBottom' || selectedQuadrant === 'rightBottom'
          ? dualMenu[selectedQuadrant] || { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' }
          : dualMenu[selectedQuadrant];
          
        const updatedDualMenu = {
          ...dualMenu,
          [selectedQuadrant]: { ...currentQuadConfig, ...updates }
        };
        console.log(`✅ Updating ${selectedQuadrant} panel:`, updatedDualMenu[selectedQuadrant]);
        console.log(`✅ Full dual menu after update:`, {
          left: updatedDualMenu.left,
          right: updatedDualMenu.right,
          leftBottom: updatedDualMenu.leftBottom,
          rightBottom: updatedDualMenu.rightBottom
        });
        onDualMenuChange(updatedDualMenu);
      } else {
        console.warn('⚠️ No quadrant selected in dual mode! You must click a quadrant first.');
        alert('Please click on a quadrant (Left Top, Right Top, Left Bottom, or Right Bottom) to configure it.');
      }
    }
  };

  // selectedQuadrant is now passed as prop, no local state needed

  const handleLaunchDual = () => {
    // This would be passed down from the parent component
    onLaunch();
  };

  return (
    <div className="mb-3 relative z-50 pt-3 px-4 flex-shrink-0 w-full">
      <div className="flex items-center justify-between bg-transparent px-0 py-0 w-full">
        {/* Left Side - Primary Actions (Canva-style: Templates/Load) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-1.5" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
            <ConfigDropdown
              loadedConfigName={loadedConfigName}
              onLoadConfig={onLoadConfig}
              onSaveLayout={onSaveLayout}
              onSaveTheme={onSaveTheme}
              onLoadTheme={onLoadTheme}
              onQRCode={onQRCode}
              onStoreConfig={onStoreConfig}
              onToggleTVPanel={onToggleTVPanel}
              showTVPanel={showTVPanel}
              onlineCount={onlineCount}
              totalTVs={totalTVs}
              hasLocation={hasLocation}
            />
            
            <div className="w-px h-5 bg-white/[0.06]" />
            
            <LayoutDropdownV2
              orientation={orientation}
              onOrientationChange={onOrientationChange}
              isDualMode={isDualMode}
              onModeChange={onModeChange}
              viewMode={getCurrentConfig()?.viewMode || 'auto'}
              showImages={getCurrentConfig()?.showImages || false}
              priceLocation={getCurrentConfig()?.priceLocation || 'none'}
              onDisplayChange={(settings) => {
                const currentConfig = getCurrentConfig()
                if (settings.viewMode !== undefined && currentConfig) {
                  handleConfigChange({ ...currentConfig, viewMode: settings.viewMode })
                }
                if (settings.showImages !== undefined && currentConfig) {
                  handleConfigChange({ ...currentConfig, showImages: settings.showImages })
                }
                if (settings.priceLocation !== undefined && currentConfig) {
                  handleConfigChange({ ...currentConfig, priceLocation: settings.priceLocation })
                }
              }}
            />
          </div>
        </div>

        {/* Center - Design Tools & Content (Canva-style: Typography + Elements + Categories) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-1.5" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
            <CategoriesDropdown
              categories={categories}
              isDualMode={isDualMode}
              singleMenu={singleMenu}
              dualMenu={dualMenu}
              selectedQuadrant={selectedQuadrant}
              onSingleMenuChange={onSingleMenuChange}
              onDualMenuChange={onDualMenuChange}
              onQuadrantChange={onQuadrantChange}
              orientation={orientation}
            />
            
            <div className="w-px h-5 bg-white/[0.06]" />
            
            <TypographyDropdown
              titleFont={titleFont}
              pricingFont={pricingFont}
              cardFont={cardFont}
              onFontsChange={onFontsChange}
              headerTitleSize={headerTitleSize}
              cardTitleSize={cardTitleSize}
              priceSize={priceSize}
              categorySize={categorySize}
              onFontSizesChange={onFontSizesChange}
              fontColor={fontColor}
              cardFontColor={cardFontColor}
              onTextColorsChange={(colors) => {
                onColorsChange({
                  backgroundColor,
                  fontColor: colors.fontColor,
                  containerColor,
                  cardFontColor: colors.cardFontColor,
                  imageBackgroundColor
                })
              }}
            />
            
            <div className="w-px h-5 bg-white/[0.06]" />

            <ElementsDropdown
              backgroundColor={backgroundColor}
              containerColor={containerColor}
              imageBackgroundColor={imageBackgroundColor}
              onBackgroundColorsChange={(colors) => {
                onColorsChange({
                  backgroundColor: colors.backgroundColor,
                  fontColor,
                  containerColor: colors.containerColor,
                  cardFontColor,
                  imageBackgroundColor: colors.imageBackgroundColor
                })
              }}
              containerOpacity={containerOpacity}
              borderWidth={borderWidth}
              borderOpacity={borderOpacity}
              imageOpacity={imageOpacity}
              blurIntensity={blurIntensity}
              glowIntensity={glowIntensity}
              onEffectsChange={onTransparencyChange}
              customBackground={customBackground}
              onCustomBackgroundChange={onCustomBackgroundChange}
            />
            
          </div>
        </div>

        {/* Right Side - Actions (Canva-style: Columns + Launch) */}
        <div className="flex items-center gap-2 flex-shrink-0 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-1.5" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
          <ColumnSelector
            categories={categories}
            selectedCategory={getCurrentConfig()?.category || undefined}
            categoryColumnConfigs={categoryColumnConfigs}
            onColumnsChange={onColumnsChange}
          />
          
          <div className="w-px h-5 bg-white/[0.06]" />
          
          {/* Launch Button - Primary Action */}
          <button
            onClick={onLaunch}
            disabled={!canLaunch || openWindowsCount >= maxWindows}
            className="flex items-center gap-1.5 px-4 h-[28px] text-xs font-medium transition-all duration-300 ease-out rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08] hover:border-white/[0.16] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              boxShadow: openWindowsCount >= maxWindows ? 'none' : '0 4px 16px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
            }}
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
