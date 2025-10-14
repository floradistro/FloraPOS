'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';
import { AdvancedProductSearch } from './AdvancedProductSearch';

interface Product {
  id: number;
  name: string;
  regular_price: string;
  sale_price?: string;
  sku: string;
  image?: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
  blueprintPricing?: any;
  meta_data?: Array<{
    id: number;
    key: string;
    value: any;
  }>;
}

interface LabelTemplate {
  template_name: string;
  description: string;
  units: string;
  page: {
    size: string;
    width: number;
    height: number;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
  };
  grid: {
    rows: number;
    columns: number;
    label_width: number;
    label_height: number;
    horizontal_pitch: number;
    vertical_pitch: number;
    origin: string;
  };
  label_style: {
    safe_padding: { top: number; right: number; bottom: number; left: number };
    corner_radius: number;
    background: string;
    border: { enabled: boolean };
  };
  text_style: {
    font_family: string;
    font_size_pt: number;
    line_height_em: number;
    color: string;
    align: string;
    vertical_align: string;
    overflow: string;
  };
  data_mapping: {
    records_per_page: number;
    fill_order: string;
  };
}

interface PrintToolbarProps {
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  showBorders: boolean;
  onShowBordersChange: (show: boolean) => void;
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
  onPrint: () => void;
  onLibraryClick: () => void;
  templates: Array<{ id: string; name: string; description: string }>;
  
  showDate: boolean;
  onShowDateChange: (show: boolean) => void;
  showPrice: boolean;
  onShowPriceChange: (show: boolean) => void;
  showSKU: boolean;
  onShowSKUChange: (show: boolean) => void;
  showCategory: boolean;
  onShowCategoryChange: (show: boolean) => void;
  showMargin: boolean;
  onShowMarginChange: (show: boolean) => void;
  
  showEffect: boolean;
  onShowEffectChange: (show: boolean) => void;
  showLineage: boolean;
  onShowLineageChange: (show: boolean) => void;
  showNose: boolean;
  onShowNoseChange: (show: boolean) => void;
  showTerpene: boolean;
  onShowTerpeneChange: (show: boolean) => void;
  showStrainType: boolean;
  onShowStrainTypeChange: (show: boolean) => void;
  showTHCA: boolean;
  onShowTHCAChange: (show: boolean) => void;
  showSupplier: boolean;
  onShowSupplierChange: (show: boolean) => void;
  
  selectedTier: string;
  onSelectedTierChange: (tier: string) => void;
  showTierPrice: boolean;
  onShowTierPriceChange: (show: boolean) => void;
  showTierLabel: boolean;
  onShowTierLabelChange: (show: boolean) => void;
  
  productNameFont: string;
  onProductNameFontChange: (font: string) => void;
  productNameSize: number;
  onProductNameSizeChange: (size: number) => void;
  productNameColor: string;
  onProductNameColorChange: (color: string) => void;
  productNameWeight: 'normal' | 'bold';
  onProductNameWeightChange: (weight: 'normal' | 'bold') => void;
  
  detailsFont: string;
  onDetailsFontChange: (font: string) => void;
  detailsSize: number;
  onDetailsSizeChange: (size: number) => void;
  detailsColor: string;
  onDetailsColorChange: (color: string) => void;
  
  labelLineHeight: number;
  onLabelLineHeightChange: (height: number) => void;
  logoSize: number;
  onLogoSizeChange: (size: number) => void;
  
  template: LabelTemplate;
}

const PRESET_FONTS = [
  { name: 'Tiempos', value: 'Tiempos, serif' },
  { name: 'DonGraffiti', value: 'DonGraffiti, cursive' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'SF Pro', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Courier', value: 'Courier New, monospace' },
  { name: 'Inter', value: 'Inter, sans-serif' },
];

export const PrintToolbar: React.FC<PrintToolbarProps> = ({
  selectedProduct,
  onProductSelect,
  selectedTemplate,
  onTemplateChange,
  showBorders,
  onShowBordersChange,
  showLogo,
  onShowLogoChange,
  onPrint,
  onLibraryClick,
  templates,
  showDate,
  onShowDateChange,
  showPrice,
  onShowPriceChange,
  showSKU,
  onShowSKUChange,
  showCategory,
  onShowCategoryChange,
  showMargin,
  onShowMarginChange,
  showEffect,
  onShowEffectChange,
  showLineage,
  onShowLineageChange,
  showNose,
  onShowNoseChange,
  showTerpene,
  onShowTerpeneChange,
  showStrainType,
  onShowStrainTypeChange,
  showTHCA,
  onShowTHCAChange,
  showSupplier,
  onShowSupplierChange,
  selectedTier,
  onSelectedTierChange,
  showTierPrice,
  onShowTierPriceChange,
  showTierLabel,
  onShowTierLabelChange,
  productNameFont,
  onProductNameFontChange,
  productNameSize,
  onProductNameSizeChange,
  productNameColor,
  onProductNameColorChange,
  productNameWeight,
  onProductNameWeightChange,
  detailsFont,
  onDetailsFontChange,
  detailsSize,
  onDetailsSizeChange,
  detailsColor,
  onDetailsColorChange,
  labelLineHeight,
  onLabelLineHeightChange,
  logoSize,
  onLogoSizeChange,
  template
}) => {
  const { user } = useAuth();
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [typographyTab, setTypographyTab] = useState<'font' | 'size' | 'color'>('font');
  const [typographyTarget, setTypographyTarget] = useState<'productName' | 'details' | 'logo'>('productName');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fieldsMenuRef = useRef<HTMLDivElement>(null);
  const typographyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowProductSearch(false);
      }
      if (fieldsMenuRef.current && !fieldsMenuRef.current.contains(event.target as Node)) {
        setShowFieldsMenu(false);
      }
      if (typographyMenuRef.current && !typographyMenuRef.current.contains(event.target as Node)) {
        setShowTypographyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery || !showProductSearch) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsSearching(true);
      try {
        const response = await apiFetch(
          `/api/proxy/flora-im/products/bulk?per_page=50&search=${encodeURIComponent(searchQuery)}&location_id=${user?.location_id || 20}`
        );
        if (response.ok) {
          const data = await response.json();
          const products = Array.isArray(data) ? data : (data.data || data.products || []);
          setSearchResults(products);
        }
      } catch (error) {
        console.error('Product search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, showProductSearch, user?.location_id]);

  const activeFieldsCount = [
    showDate, showPrice, showSKU, showCategory, showMargin,
    showEffect, showLineage, showNose, showTerpene, showStrainType, showTHCA, showSupplier,
    showTierPrice, showTierLabel
  ].filter(Boolean).length;

  return (
    <>
      <AdvancedProductSearch
        selectedProduct={selectedProduct}
        onProductSelect={onProductSelect}
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
      />

      <div className="my-3">
        <div className="flex items-center h-full py-3 px-6 relative gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="max-w-[180px] truncate">
                {selectedProduct ? selectedProduct.name : 'Select Product'}
              </span>
            </button>

            {selectedProduct && (
              <button
                onClick={() => {
                  onProductSelect(null);
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Clear
              </button>
            )}
          </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white focus:bg-white/10 focus:border-white/20 focus:outline-none transition-all duration-200 backdrop-blur-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10 min-w-[140px]"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id} className="bg-neutral-800">{t.name}</option>
            ))}
          </select>

          <button
            onClick={() => onShowBordersChange(!showBorders)}
            className={`px-4 py-2 text-xs rounded-xl transition-all duration-200 backdrop-blur-sm border ${
              showBorders
                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Borders
          </button>

          <button
            onClick={() => onShowLogoChange(!showLogo)}
            className={`px-4 py-2 text-xs rounded-xl transition-all duration-200 backdrop-blur-sm border ${
              showLogo
                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Logo
          </button>

          <div className="relative" ref={fieldsMenuRef}>
            <button
              onClick={() => setShowFieldsMenu(!showFieldsMenu)}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <span>Fields</span>
              {activeFieldsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-white/20 text-white rounded">{activeFieldsCount}</span>
              )}
            </button>

            {showFieldsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFieldsMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-72 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    
                    <div>
                      <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 px-3" style={{ fontFamily: 'Tiempos, serif' }}>
                        Basic Fields
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Date', value: showDate, onChange: onShowDateChange },
                          { label: 'Price', value: showPrice, onChange: onShowPriceChange },
                          { label: 'SKU', value: showSKU, onChange: onShowSKUChange },
                          { label: 'Category', value: showCategory, onChange: onShowCategoryChange },
                          { label: 'Margin', value: showMargin, onChange: onShowMarginChange }
                        ].map((field) => (
                          <button
                            key={field.label}
                            onClick={() => selectedProduct && field.onChange(!field.value)}
                            disabled={!selectedProduct}
                            className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out mx-1 text-left flex items-center justify-between ${
                              !selectedProduct 
                                ? 'bg-white/[0.02] text-white/20 cursor-not-allowed' 
                                : field.value 
                                  ? 'bg-white/10 text-white shadow-sm' 
                                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                            }`}
                            style={{ fontFamily: 'Tiempos, serif' }}
                          >
                            <span>{field.label}</span>
                            {field.value && <span className="text-[10px]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-neutral-700/50" />

                    <div>
                      <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 px-3" style={{ fontFamily: 'Tiempos, serif' }}>
                        Blueprint Fields
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Effect', value: showEffect, onChange: onShowEffectChange },
                          { label: 'Lineage', value: showLineage, onChange: onShowLineageChange },
                          { label: 'Nose', value: showNose, onChange: onShowNoseChange },
                          { label: 'Terpene', value: showTerpene, onChange: onShowTerpeneChange },
                          { label: 'Strain Type', value: showStrainType, onChange: onShowStrainTypeChange },
                          { label: 'THCA', value: showTHCA, onChange: onShowTHCAChange },
                          { label: 'Supplier', value: showSupplier, onChange: onShowSupplierChange }
                        ].map((field) => (
                          <button
                            key={field.label}
                            onClick={() => selectedProduct && field.onChange(!field.value)}
                            disabled={!selectedProduct}
                            className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out mx-1 text-left flex items-center justify-between ${
                              !selectedProduct 
                                ? 'bg-white/[0.02] text-white/20 cursor-not-allowed' 
                                : field.value 
                                  ? 'bg-white/10 text-white shadow-sm' 
                                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                            }`}
                            style={{ fontFamily: 'Tiempos, serif' }}
                          >
                            <span>{field.label}</span>
                            {field.value && <span className="text-[10px]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedProduct?.blueprintPricing?.ruleGroups && (
                      <>
                        <div className="border-t border-neutral-700/50" />
                        <div>
                          <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 px-3" style={{ fontFamily: 'Tiempos, serif' }}>
                            Pricing Tiers
                          </div>
                          <select
                            value={selectedTier}
                            onChange={(e) => onSelectedTierChange(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30 mb-2"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          >
                            <option value="" className="bg-neutral-800">Select Tier</option>
                            {selectedProduct.blueprintPricing.ruleGroups.flatMap((group: any) => 
                              group.tiers.map((tier: any) => (
                                <option 
                                  key={`${group.ruleName}-${tier.label}`} 
                                  value={`${group.ruleName}-${tier.label}`}
                                  className="bg-neutral-800"
                                >
                                  {group.ruleName} - {tier.label} (${tier.price.toFixed(2)})
                                </option>
                              ))
                            )}
                          </select>
                          
                          {selectedTier && (
                            <div className="space-y-1.5">
                              <button
                                onClick={() => onShowTierPriceChange(!showTierPrice)}
                                className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out mx-1 text-left flex items-center justify-between ${
                                  showTierPrice 
                                    ? 'bg-white/10 text-white shadow-sm' 
                                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                                }`}
                                style={{ fontFamily: 'Tiempos, serif' }}
                              >
                                <span>Show Tier Price</span>
                                {showTierPrice && <span className="text-[10px]">✓</span>}
                              </button>
                              <button
                                onClick={() => onShowTierLabelChange(!showTierLabel)}
                                className={`w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out mx-1 text-left flex items-center justify-between ${
                                  showTierLabel 
                                    ? 'bg-white/10 text-white shadow-sm' 
                                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                                }`}
                                style={{ fontFamily: 'Tiempos, serif' }}
                              >
                                <span>Show Tier Label</span>
                                {showTierLabel && <span className="text-[10px]">✓</span>}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative" ref={typographyMenuRef}>
            <button
              onClick={() => setShowTypographyMenu(!showTypographyMenu)}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>Typography</span>
            </button>

            {showTypographyMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTypographyMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-96 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
                  
                  <div className="flex gap-1 p-3 bg-white/5 border-b border-white/[0.06]">
                    <button
                      onClick={() => setTypographyTab('font')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        typographyTab === 'font'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      Font
                    </button>
                    <button
                      onClick={() => setTypographyTab('size')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        typographyTab === 'size'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      Size
                    </button>
                    <button
                      onClick={() => setTypographyTab('color')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all relative overflow-hidden ${
                        typographyTab === 'color'
                          ? 'text-white shadow-sm'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                      style={{
                        fontFamily: 'Tiempos, serif',
                        background: typographyTab === 'color' 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)'
                          : 'transparent'
                      }}
                    >
                      Color
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Target Selector */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                      <button
                        onClick={() => setTypographyTarget('productName')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-all ${
                          typographyTarget === 'productName'
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        Name
                      </button>
                      <button
                        onClick={() => setTypographyTarget('details')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-all ${
                          typographyTarget === 'details'
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setTypographyTarget('logo')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-all ${
                          typographyTarget === 'logo'
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        Logo
                      </button>
                    </div>

                    {typographyTab === 'font' && typographyTarget !== 'logo' && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {PRESET_FONTS.map(font => (
                          <button
                            key={font.value}
                            onClick={() => {
                              if (typographyTarget === 'productName') {
                                onProductNameFontChange(font.value);
                              } else {
                                onDetailsFontChange(font.value);
                              }
                            }}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                              (typographyTarget === 'productName' ? productNameFont : detailsFont) === font.value
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                            }`}
                          >
                            <span className="text-sm" style={{ fontFamily: font.value }}>{font.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {typographyTab === 'size' && (
                      <div className="space-y-4">
                        {typographyTarget === 'productName' && (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/60" style={{ fontFamily: 'Tiempos, serif' }}>Name Size</span>
                                <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded">{productNameSize}pt</span>
                              </div>
                              <input
                                type="range"
                                min="6"
                                max="48"
                                value={productNameSize}
                                onChange={(e) => onProductNameSizeChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-white/60 mb-2" style={{ fontFamily: 'Tiempos, serif' }}>Font Weight</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onProductNameWeightChange('normal')}
                                  className={`flex-1 px-3 py-2 text-xs rounded transition-all ${
                                    productNameWeight === 'normal'
                                      ? 'bg-white/10 text-white'
                                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                  }`}
                                  style={{ fontFamily: 'Tiempos, serif' }}
                                >
                                  Normal
                                </button>
                                <button
                                  onClick={() => onProductNameWeightChange('bold')}
                                  className={`flex-1 px-3 py-2 text-xs rounded transition-all ${
                                    productNameWeight === 'bold'
                                      ? 'bg-white/10 text-white'
                                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                  }`}
                                  style={{ fontFamily: 'Tiempos, serif' }}
                                >
                                  Bold
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                        {typographyTarget === 'details' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-white/60" style={{ fontFamily: 'Tiempos, serif' }}>Details Size</span>
                              <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded">{detailsSize}pt</span>
                            </div>
                            <input
                              type="range"
                              min="4"
                              max="32"
                              value={detailsSize}
                              onChange={(e) => onDetailsSizeChange(parseInt(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                        {typographyTarget === 'logo' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-white/60" style={{ fontFamily: 'Tiempos, serif' }}>Logo Size</span>
                              <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded">{logoSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="6"
                              max="72"
                              value={logoSize}
                              onChange={(e) => onLogoSizeChange(parseInt(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                        <div className="border-t border-neutral-700/50 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/60" style={{ fontFamily: 'Tiempos, serif' }}>Line Height</span>
                            <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded">{labelLineHeight.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.8"
                            max="2.0"
                            step="0.1"
                            value={labelLineHeight}
                            onChange={(e) => onLabelLineHeightChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {typographyTab === 'color' && typographyTarget !== 'logo' && (
                      <div>
                        <label className="text-xs text-white/60 mb-2 block font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
                          {typographyTarget === 'productName' ? 'Product Name Color' : 'Details Color'}
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                          <input
                            type="color"
                            value={typographyTarget === 'productName' ? productNameColor : detailsColor}
                            onChange={(e) => {
                              if (typographyTarget === 'productName') {
                                onProductNameColorChange(e.target.value);
                              } else {
                                onDetailsColorChange(e.target.value);
                              }
                            }}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                            style={{ border: 'none' }}
                          />
                          <input
                            type="text"
                            value={typographyTarget === 'productName' ? productNameColor : detailsColor}
                            onChange={(e) => {
                              if (typographyTarget === 'productName') {
                                onProductNameColorChange(e.target.value);
                              } else {
                                onDetailsColorChange(e.target.value);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onLibraryClick}
            className="flex items-center gap-2 px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-neutral-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Library</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-5 py-2 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm hover:scale-105 active:scale-95"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
