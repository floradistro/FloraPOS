export interface MenuConfig {
  category: string | null;
  viewMode: 'table' | 'card' | 'auto';
  showImages: boolean;
  priceLocation?: 'none' | 'header' | 'inline';
}

export interface DualMenuConfig {
  left: MenuConfig;
  right: MenuConfig;
  leftBottom?: MenuConfig;
  rightBottom?: MenuConfig;
  enableLeftStacking: boolean;
  enableRightStacking: boolean;
}

export interface MenuToolbarProps {
  orientation: 'horizontal' | 'vertical';
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void;
  
  // Single menu config
  singleMenu: MenuConfig;
  onSingleMenuChange: (config: MenuConfig) => void;
  
  // Dual menu config
  dualMenu: DualMenuConfig;
  onDualMenuChange: (config: DualMenuConfig) => void;
  
  // Mode selection
  isDualMode: boolean;
  onModeChange: (isDual: boolean) => void;
  
  // Quadrant selection
  selectedQuadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '';
  onQuadrantChange: (quadrant: 'left' | 'right' | 'leftBottom' | 'rightBottom' | '') => void;
  
  // Colors
  backgroundColor: string;
  fontColor: string;
  containerColor: string;
  cardFontColor: string;
  imageBackgroundColor: string;
  onColorsChange: (colors: { 
    backgroundColor: string; 
    fontColor: string; 
    containerColor: string;
    cardFontColor: string;
    imageBackgroundColor: string;
  }) => void;
  
  // Fonts
  titleFont: string;
  pricingFont: string;
  cardFont: string;
  onFontsChange: (fonts: { titleFont: string; pricingFont: string; cardFont: string }) => void;
  
  // Config actions
  loadedConfigName?: string;
  onLoadConfig: () => void;
  onSaveLayout: () => void;
  onSaveTheme: () => void;
  onQRCode: () => void;
  onStoreConfig: () => void;
  onToggleTVPanel: () => void;
  showTVPanel: boolean;
  onlineCount: number;
  totalTVs: number;
  hasLocation: boolean;
  
  // Categories
  categories: Array<{ id: number; name: string; slug: string }>;
  
  // Column configs
  categoryColumnConfigs: Map<string, string[]>;
  onColumnsChange: (categorySlug: string, columns: string[]) => void;
  
  // Launch actions
  onLaunch: () => void;
  canLaunch: boolean;
  launchTitle: string;
  
  // Window management
  openWindowsCount: number;
  maxWindows: number;
  
  // Theme
  pandaMode?: boolean;
  onPandaModeToggle?: () => void;
}

export interface ToolbarDropdownProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface DropdownItemProps {
  icon: React.ReactNode | null;
  label: string;
  description: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}
