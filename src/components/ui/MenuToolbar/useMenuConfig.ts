import { useState, useCallback } from 'react';
import { MenuConfig, DualMenuConfig } from './types';

export const useMenuConfig = () => {
  // Simplified state management
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isDualMode, setIsDualMode] = useState(false);
  
  // Single menu configuration
  const [singleMenu, setSingleMenu] = useState<MenuConfig>({
    category: null,
    viewMode: 'auto',
    showImages: true,
    priceLocation: 'inline'
  });

  // Dual menu configuration
  const [dualMenu, setDualMenu] = useState<DualMenuConfig>({
    left: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
    right: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
    leftBottom: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
    rightBottom: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
    enableLeftStacking: false,
    enableRightStacking: false
  });

  // Colors
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [containerColor, setContainerColor] = useState('#1f1f1f');
  const [cardFontColor, setCardFontColor] = useState('#ffffff');
  const [imageBackgroundColor, setImageBackgroundColor] = useState('#1a1a1a');
  
  // Fonts
  const [titleFont, setTitleFont] = useState('Tiempos, serif');
  const [pricingFont, setPricingFont] = useState('Tiempos, serif');
  const [cardFont, setCardFont] = useState('Tiempos, serif');

  // Selected quadrant for dual menu configuration
  const [selectedQuadrant, setSelectedQuadrant] = useState<'left' | 'right' | 'leftBottom' | 'rightBottom' | ''>('');

  const updateSingleMenu = useCallback((updates: Partial<MenuConfig>) => {
    setSingleMenu(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDualMenu = useCallback((updates: Partial<DualMenuConfig>) => {
    setDualMenu(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDualMenuSide = useCallback((side: 'left' | 'right' | 'leftBottom' | 'rightBottom', updates: Partial<MenuConfig>) => {
    setDualMenu(prev => ({
      ...prev,
      [side]: { ...prev[side], ...updates }
    }));
  }, []);

  const getCurrentConfig = useCallback(() => {
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
        return dualMenu.leftBottom;
      case 'rightBottom':
        return dualMenu.rightBottom;
      default:
        return dualMenu.left; // Default fallback
    }
  }, [isDualMode, selectedQuadrant, singleMenu, dualMenu]);

  const updateCurrentConfig = useCallback((updates: Partial<MenuConfig>) => {
    if (!isDualMode) {
      updateSingleMenu(updates);
      return;
    }

    // Update the specific selected quadrant
    if (selectedQuadrant) {
      updateDualMenuSide(selectedQuadrant, updates);
    }
  }, [isDualMode, selectedQuadrant, updateSingleMenu, updateDualMenuSide]);

  const resetToSingleMode = useCallback(() => {
    setIsDualMode(false);
    setSelectedQuadrant('');
    setDualMenu({
      left: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
      right: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
      leftBottom: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
      rightBottom: { category: null, viewMode: 'auto', showImages: true, priceLocation: 'inline' },
      enableLeftStacking: false,
      enableRightStacking: false
    });
  }, []);

  const switchToDualMode = useCallback((categories: Array<{ slug: string }>) => {
    setIsDualMode(true);
    if (categories.length >= 2) {
      setDualMenu(prev => ({
        ...prev,
        left: { ...prev.left, category: categories[0].slug, priceLocation: prev.left.priceLocation || 'inline' },
        right: { ...prev.right, category: categories[1].slug, priceLocation: prev.right.priceLocation || 'inline' }
      }));
      setSelectedQuadrant('left');
    }
  }, []);

  // Get current panel config properties
  const currentConfig = getCurrentConfig();
  
  return {
    // State
    orientation,
    isDualMode,
    singleMenu,
    singlePanel: singleMenu, // Alias for backwards compatibility
    dualMenu,
    leftPanel: dualMenu.left, // Alias for backwards compatibility
    rightPanel: dualMenu.right, // Alias for backwards compatibility
    backgroundColor,
    fontColor,
    containerColor,
    cardFontColor,
    imageBackgroundColor,
    titleFont,
    pricingFont,
    cardFont,
    selectedQuadrant,
    
    // Current panel convenience properties
    showImages: currentConfig.showImages,
    viewMode: currentConfig.viewMode,
    category: currentConfig.category,
    priceLocation: (currentConfig as any).priceLocation || 'inline',
    
    // Actions
    setOrientation,
    setIsDualMode,
    setSingleMenu,
    setDualMenu,
    setBackgroundColor,
    setFontColor,
    setContainerColor,
    setCardFontColor,
    setImageBackgroundColor,
    setTitleFont,
    setPricingFont,
    setCardFont,
    setSelectedQuadrant,
    
    // Helpers
    updateSingleMenu,
    updateDualMenu,
    updateDualMenuSide,
    getCurrentConfig,
    updateCurrentConfig,
    updateActivePanel: updateCurrentConfig, // Alias
    resetToSingleMode,
    switchToDualMode
  };
};
