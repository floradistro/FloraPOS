'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PrintToolbar } from './PrintToolbar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const LARGE_PREVIEW_SCALE = 2.8;
const SHEET_PREVIEW_SCALE = 0.6;

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
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    max_length: number;
  }>;
  layout: Array<{
    type: string;
    binding: string[];
    join_with: string;
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    style_overrides: {
      line_break: string;
      max_lines: number;
    };
  }>;
  data_mapping: {
    records_per_page: number;
    fill_order: string;
  };
  sample_data: Array<{
    line1: string;
    line2: string;
    line3: string;
  }>;
}

interface Product {
  id: number;
  name: string;
  regular_price: string;
  sale_price?: string;
  sku: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
  blueprintPricing?: any;
  image?: string;
  meta_data?: Array<{
    id: number;
    key: string;
    value: any;
  }>;
}

interface SavedTemplate {
  id: string;
  name: string;
  description: string | null;
  config_data: any;
  created_at: string;
}

interface PrintViewProps {
  template?: LabelTemplate;
  data?: Array<{ line1: string; line2?: string; line3?: string }>;
  selectedProduct?: Product | null;
}

const TEMPLATES = {
  avery_5160: {
    template_name: "Avery 5160",
    description: "30-up address labels on US Letter",
    units: "in",
    page: { size: "letter", width: 8.5, height: 11.0, margin_top: 0.5, margin_bottom: 0.5, margin_left: 0.21875, margin_right: 0.21875 },
    grid: { rows: 10, columns: 3, label_width: 2.625, label_height: 1.0, horizontal_pitch: 2.83333, vertical_pitch: 1.0, origin: "top-left" },
    label_style: { safe_padding: { top: 0.08, right: 0.05, bottom: 0.05, left: 0.05 }, corner_radius: 0.0625, background: "none", border: { enabled: false } },
    text_style: { font_family: "Helvetica", font_size_pt: 9, line_height_em: 1.1, color: "#000000", align: "left", vertical_align: "top", overflow: "shrink-to-fit" },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 48 },
      { name: "line2", type: "text", required: false, max_length: 48 },
      { name: "line3", type: "text", required: false, max_length: 48 }
    ],
    layout: [{ type: "text_block", binding: ["line1", "line2", "line3"], join_with: "\n", box: { x: 0.0625, y: 0.0625, width: 2.5, height: 0.875 }, style_overrides: { line_break: "auto", max_lines: 3 } }],
    data_mapping: { records_per_page: 30, fill_order: "row-major" },
    sample_data: [{ line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }]
  },
  avery_5161: {
    template_name: "Avery 5161",
    description: "20-up address labels on US Letter",
    units: "in",
    page: { size: "letter", width: 8.5, height: 11.0, margin_top: 0.5, margin_bottom: 0.5, margin_left: 0.15625, margin_right: 0.15625 },
    grid: { rows: 10, columns: 2, label_width: 4.0, label_height: 1.0, horizontal_pitch: 4.1875, vertical_pitch: 1.0, origin: "top-left" },
    label_style: { safe_padding: { top: 0.0625, right: 0.0625, bottom: 0.0625, left: 0.0625 }, corner_radius: 0.0625, background: "none", border: { enabled: false } },
    text_style: { font_family: "Helvetica", font_size_pt: 9, line_height_em: 1.1, color: "#000000", align: "left", vertical_align: "top", overflow: "shrink-to-fit" },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 }
    ],
    layout: [{ type: "text_block", binding: ["line1", "line2", "line3"], join_with: "\n", box: { x: 0.0625, y: 0.0625, width: 3.875, height: 0.875 }, style_overrides: { line_break: "auto", max_lines: 3 } }],
    data_mapping: { records_per_page: 20, fill_order: "row-major" },
    sample_data: [{ line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }]
  },
  avery_5162: {
    template_name: "Avery 5162",
    description: "14-up address labels on US Letter",
    units: "in",
    page: { size: "letter", width: 8.5, height: 11.0, margin_top: 0.84, margin_bottom: 0.84, margin_left: 0.15625, margin_right: 0.15625 },
    grid: { rows: 7, columns: 2, label_width: 4.0, label_height: 1.33, horizontal_pitch: 4.1875, vertical_pitch: 1.33, origin: "top-left" },
    label_style: { safe_padding: { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 }, corner_radius: 0.0625, background: "none", border: { enabled: false } },
    text_style: { font_family: "Helvetica", font_size_pt: 10, line_height_em: 1.2, color: "#000000", align: "left", vertical_align: "top", overflow: "shrink-to-fit" },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 }
    ],
    layout: [{ type: "text_block", binding: ["line1", "line2", "line3"], join_with: "\n", box: { x: 0.08, y: 0.08, width: 3.84, height: 1.17 }, style_overrides: { line_break: "auto", max_lines: 4 } }],
    data_mapping: { records_per_page: 14, fill_order: "row-major" },
    sample_data: [{ line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }]
  }
};

const TEMPLATE_LIST = [
  { id: 'avery_5160', name: 'Avery 5160', description: '30 labels (1.0" × 2.625")' },
  { id: 'avery_5161', name: 'Avery 5161', description: '20 labels (1.0" × 4.0")' },
  { id: 'avery_5162', name: 'Avery 5162', description: '14 labels (1.33" × 4.0")' }
];

export function PrintView({ template: propTemplate, data: propData, selectedProduct: propSelectedProduct }: PrintViewProps) {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(propSelectedProduct || null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('avery_5160');
  const [showBorders, setShowBorders] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [sheetScale, setSheetScale] = useState(0.7);
  const [bulkPrintMode, setBulkPrintMode] = useState(false);
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const [showDate, setShowDate] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [showMargin, setShowMargin] = useState(false);
  
  const [showEffect, setShowEffect] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showNose, setShowNose] = useState(false);
  const [showTerpene, setShowTerpene] = useState(false);
  const [showStrainType, setShowStrainType] = useState(false);
  const [showTHCA, setShowTHCA] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [showTierPrice, setShowTierPrice] = useState(false);
  const [showTierLabel, setShowTierLabel] = useState(false);
  
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [focusedPreview, setFocusedPreview] = useState<'label' | 'sheet' | null>(null);
  
  const [productNameFont, setProductNameFont] = useState('Helvetica, sans-serif');
  const [productNameSize, setProductNameSize] = useState(8);
  const [productNameColor, setProductNameColor] = useState('#000000');
  const [productNameWeight, setProductNameWeight] = useState<'normal' | 'bold'>('bold');
  
  const [detailsFont, setDetailsFont] = useState('Helvetica, sans-serif');
  const [detailsSize, setDetailsSize] = useState(6);
  const [detailsColor, setDetailsColor] = useState('#666666');
  
  const [labelLineHeight, setLabelLineHeight] = useState(1.0);
  const [logoSize, setLogoSize] = useState(12);
  
  const printRef = useRef<HTMLDivElement>(null);
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  const template = propTemplate || TEMPLATES[selectedTemplate];

  useEffect(() => {
    if (propSelectedProduct) {
      setSelectedProduct(propSelectedProduct);
    }
  }, [propSelectedProduct]);

  useEffect(() => {
    const updateScale = () => {
      if (!sheetContainerRef.current) return;
      const container = sheetContainerRef.current;
      const pageWidth = template.page.width * 96;
      const pageHeight = template.page.height * 96;
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;
      const newScale = Math.min(scaleX, scaleY, 0.9);
      setSheetScale(newScale);
    };
    
    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (sheetContainerRef.current) {
      resizeObserver.observe(sheetContainerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [template]);

  useEffect(() => {
    loadSavedTemplates();
  }, [user]);

  useEffect(() => {
    const applyDefaultTemplate = async () => {
      if (!user || savedTemplates.length === 0) return;
      
      const defaultTemplate = savedTemplates.find(t => t.name.toLowerCase() === 'default');
      if (defaultTemplate) {
        console.log('✅ Auto-applying "Default" template');
        loadTemplate(defaultTemplate);
      }
    };
    
    applyDefaultTemplate();
  }, [savedTemplates]);

  useEffect(() => {
    const fetchBulkProducts = async () => {
      if (!bulkPrintMode || selectedProducts.size === 0) {
        setBulkProducts([]);
        setCurrentPageIndex(0);
        return;
      }
      
      console.log('🔄 Fetching bulk products:', Array.from(selectedProducts));
      
      const productIds = Array.from(selectedProducts);
      const products: Product[] = [];
      
      for (const productId of productIds) {
        try {
          const response = await fetch(`/api/proxy/woocommerce/products?include=${productId}&per_page=1`);
          if (response.ok) {
            const wcProducts = await response.json();
            if (wcProducts && wcProducts.length > 0) {
              const fullProduct = wcProducts[0];
              console.log('✅ Fetched product:', fullProduct.name);
              products.push(fullProduct);
            }
          } else {
            console.error('Error fetching product:', productId, response.status);
          }
        } catch (error) {
          console.error('Error fetching product:', productId, error);
        }
      }
      
      console.log('✅ Fetched bulk products:', products.length, 'of', productIds.length);
      setBulkProducts(products);
      setCurrentPageIndex(0);
    };
    
    fetchBulkProducts();
  }, [bulkPrintMode, selectedProducts]);

  useEffect(() => {
    if (!bulkPrintMode || bulkProducts.length <= 1) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPageIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentPageIndex(prev => Math.min(bulkProducts.length - 1, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bulkPrintMode, bulkProducts.length]);

  const loadSavedTemplates = async () => {
    if (!user) return;
    
    console.log('📥 Loading templates...');
    
    const { data, error } = await (supabase as any)
      .from('label_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Load error:', error);
      return;
    }
    
    console.log('✅ Templates loaded:', data?.length || 0);
    if (data) {
      setSavedTemplates(data as any);
    }
  };

  const saveCurrentConfig = async () => {
    if (!user || !saveName.trim()) {
      console.warn('⚠️ Cannot save: user or name missing', { user: !!user, saveName });
      return;
    }
    
    console.log('💾 Saving template...', { userId: user.id, saveName });
    
    const config = {
      selectedTemplate,
      showBorders,
      showLogo,
      showDate,
      showCategory,
      showPrice,
      showSKU,
      showMargin,
      showEffect,
      showLineage,
      showNose,
      showTerpene,
      showStrainType,
      showTHCA,
      showSupplier,
      selectedTier,
      showTierPrice,
      showTierLabel,
      productNameFont,
      productNameSize,
      productNameColor,
      productNameWeight,
      detailsFont,
      detailsSize,
      detailsColor,
      labelLineHeight,
      logoSize
    };

    const { data, error } = await (supabase as any)
      .from('label_templates')
      .insert({
        user_id: user.id,
        location_id: user.location_id ? parseInt(user.location_id) : null,
        name: saveName.trim(),
        description: saveDescription.trim() || null,
        template_type: selectedTemplate,
        config_data: config
      })
      .select();

    if (error) {
      console.error('❌ Save error:', error);
      alert(`Failed to save template: ${error.message}`);
      return;
    }

    console.log('✅ Template saved:', data);
    setSaveName('');
    setSaveDescription('');
    await loadSavedTemplates();
  };

  const loadTemplate = (template: SavedTemplate) => {
    const config = template.config_data;
    setSelectedTemplate(config.selectedTemplate || 'avery_5160');
    setShowBorders(config.showBorders ?? true);
    setShowLogo(config.showLogo ?? true);
    setShowDate(config.showDate ?? false);
    setShowCategory(config.showCategory ?? false);
    setShowPrice(config.showPrice ?? false);
    setShowSKU(config.showSKU ?? false);
    setShowMargin(config.showMargin ?? false);
    setShowEffect(config.showEffect ?? false);
    setShowLineage(config.showLineage ?? false);
    setShowNose(config.showNose ?? false);
    setShowTerpene(config.showTerpene ?? false);
    setShowStrainType(config.showStrainType ?? false);
    setShowTHCA(config.showTHCA ?? false);
    setShowSupplier(config.showSupplier ?? false);
    setSelectedTier(config.selectedTier || '');
    setShowTierPrice(config.showTierPrice ?? false);
    setShowTierLabel(config.showTierLabel ?? false);
    setProductNameFont(config.productNameFont || 'Helvetica, sans-serif');
    setProductNameSize(config.productNameSize || 8);
    setProductNameColor(config.productNameColor || '#000000');
    setProductNameWeight(config.productNameWeight || 'bold');
    setDetailsFont(config.detailsFont || 'Helvetica, sans-serif');
    setDetailsSize(config.detailsSize || 6);
    setDetailsColor(config.detailsColor || '#666666');
    setLabelLineHeight(config.labelLineHeight || 1.0);
    setLogoSize(config.logoSize || 12);
    setShowLibrary(false);
  };

  const deleteTemplate = async (id: string) => {
    console.log('🗑️ Deleting template:', id);
    
    const { error } = await (supabase as any)
      .from('label_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Delete error:', error);
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    
    console.log('✅ Template deleted');
    loadSavedTemplates();
  };

  const generateProductLabelData = (product: Product | null) => {
    if (!product) {
      return [{ line1: "Flora Distro", line2: "Select a product", line3: "to begin" }];
    }

    console.log('🔍 Generating label data for:', product.name);
    console.log('🔍 Product has meta_data?', !!product.meta_data, product.meta_data?.length || 0);
    console.log('🔍 BASIC FIELDS:', {
      'showPrice (should add price)': showPrice,
      'showSKU (should add SKU)': showSKU,
      'showDate (should add date)': showDate,
      'showCategory (should add category)': showCategory
    });
    console.log('🔍 BLUEPRINT FIELDS:', { showEffect, showLineage, showNose, showTerpene, showStrainType, showTHCA, showSupplier });

    const productName = product.name || 'Unknown Product';
    const productPrice = product.blueprintPricing?.price || parseFloat(product.sale_price || product.regular_price || '0');
    const formattedPrice = `$${productPrice.toFixed(2)}`;
    const productSKU = product.sku || `ID: ${product.id}`;
    const category = product.categories?.[0]?.name || 'General';
    const currentDate = new Date().toLocaleDateString();
    
    const additionalFields: string[] = [];
    
    if (showDate) {
      console.log('✅ Adding Date:', currentDate);
      additionalFields.push(`Date: ${currentDate}`);
    }
    if (showPrice) {
      console.log('✅ Adding Price:', formattedPrice);
      additionalFields.push(formattedPrice);
    }
    if (showSKU) {
      console.log('✅ Adding SKU:', productSKU);
      additionalFields.push(`SKU: ${productSKU}`);
    }
    if (showCategory) {
      console.log('✅ Adding Category:', category);
      additionalFields.push(`Cat: ${category}`);
    }
    
    if (showMargin && product.blueprintPricing?.margin) {
      additionalFields.push(`Margin: ${(product.blueprintPricing.margin * 100).toFixed(1)}%`);
    }
    
    if (product.blueprintPricing?.ruleGroups && selectedTier) {
      const allTiers = product.blueprintPricing.ruleGroups.flatMap((group: any) => 
        group.tiers.map((tier: any) => ({
          ...tier,
          ruleName: group.ruleName,
          tierKey: `${group.ruleName}-${tier.label}`
        }))
      );
      
      const selectedTierData = allTiers.find((tier: any) => tier.tierKey === selectedTier);
      
      if (selectedTierData) {
        if (showTierPrice) additionalFields.push(`${selectedTierData.label}: $${selectedTierData.price.toFixed(2)}`);
        if (showTierLabel) additionalFields.push(`Tier: ${selectedTierData.label}`);
      }
    }
    
    const metaData = product.meta_data || [];
    console.log('📦 Product meta_data:', metaData.map(m => m.key));
    
    const getMetaValue = (key: string) => {
      const meta = metaData.find(m => m.key === key || m.key === `_${key}`);
      console.log(`🔎 Looking for meta "${key}":`, meta?.value || 'NOT FOUND');
      return meta?.value;
    };
    
    if (showEffect) {
      const effect = getMetaValue('effect');
      if (effect) {
        console.log('✅ Adding Effect:', effect);
        additionalFields.push(`Effect: ${effect}`);
      }
    }
    
    if (showLineage) {
      const lineage = getMetaValue('lineage');
      if (lineage) {
        console.log('✅ Adding Lineage:', lineage);
        additionalFields.push(`Lineage: ${lineage}`);
      }
    }
    
    if (showNose) {
      const nose = getMetaValue('nose');
      if (nose) {
        console.log('✅ Adding Nose:', nose);
        additionalFields.push(`Nose: ${nose}`);
      }
    }
    
    if (showTerpene) {
      const terpene = getMetaValue('terpene');
      if (terpene) {
        console.log('✅ Adding Terpene:', terpene);
        additionalFields.push(`Terpene: ${terpene}`);
      }
    }
    
    if (showStrainType) {
      const strainType = getMetaValue('strain_type');
      if (strainType) {
        console.log('✅ Adding Strain Type:', strainType);
        additionalFields.push(`Type: ${strainType}`);
      }
    }
    
    if (showTHCA) {
      const thca = getMetaValue('thca_percentage');
      if (thca) {
        console.log('✅ Adding THCA:', thca);
        additionalFields.push(`THCA: ${thca}%`);
      }
    }
    
    if (showSupplier) {
      const supplier = getMetaValue('supplier');
      if (supplier) {
        console.log('✅ Adding Supplier:', supplier);
        additionalFields.push(`Supplier: ${supplier}`);
      }
    }

    console.log('📋 Total additionalFields:', additionalFields.length, additionalFields);
    
    console.log('🏷️ FINAL Label data:', {
      productName,
      fields: additionalFields,
      totalLines: 1 + additionalFields.length
    });
    
    return Array(template.data_mapping.records_per_page).fill(null).map(() => ({
      line1: productName,
      additionalLines: additionalFields
    }));
  };

  const inchesToPx = (inches: number) => Math.round(inches * 96);
  const ptToPx = (points: number) => Math.round(points * 1.333);

  const generatePrintableSheet = (labelData: any[]) => {
    const totalLabels = template.grid.rows * template.grid.columns;
    
    // Use inches for everything (iOS Safari respects inches better)
    const paddingTop = template.label_style.safe_padding.top;
    const paddingRight = template.label_style.safe_padding.right;
    const paddingBottom = template.label_style.safe_padding.bottom;
    const paddingLeft = template.label_style.safe_padding.left;
    const labelWidth = template.grid.label_width;
    const labelHeight = template.grid.label_height;
    const cornerRadius = template.label_style.corner_radius;
    
    let labelsHtml = '';
    
    for (let i = 0; i < totalLabels; i++) {
      const row = Math.floor(i / template.grid.columns);
      const col = i % template.grid.columns;
      
      const left = template.page.margin_left + (col * template.grid.horizontal_pitch);
      const top = template.page.margin_top + (row * template.grid.vertical_pitch);
      
      const dataIndex = i % labelData.length;
      const label = labelData[dataIndex];
      
      const productNameLength = label.line1?.length || 0;
      let adaptiveNameSize = productNameSize;
      
      if (productNameLength > 30) {
        adaptiveNameSize = Math.max(5, productNameSize * 0.6);
      } else if (productNameLength > 22) {
        adaptiveNameSize = Math.max(5, productNameSize * 0.75);
      } else if (productNameLength > 15) {
        adaptiveNameSize = Math.max(6, productNameSize * 0.9);
      }
      
      const additionalLinesHtml = label.additionalLines?.map((line: string) => `
        <div style="font-size: ${detailsSize}pt; line-height: ${labelLineHeight}; color: ${detailsColor}; font-family: ${detailsFont}; word-wrap: break-word; overflow: hidden;">
          ${line}
        </div>
      `).join('') || '';
      
      labelsHtml += `
        <div class="label" style="left: ${left}in; top: ${top}in; width: ${labelWidth}in; height: ${labelHeight}in;">
          <div class="label-content" style="top: ${paddingTop}in; left: ${paddingLeft}in; right: ${paddingRight}in; bottom: ${paddingBottom}in;">
            ${showLogo ? `<img src="/logoprint.png" class="label-logo" style="width: ${logoSize}px; height: ${logoSize}px;" />` : ''}
            <div class="label-text">
              <div class="product-name" style="font-size: ${adaptiveNameSize}pt; line-height: ${labelLineHeight}; color: ${productNameColor}; font-family: ${productNameFont}; font-weight: ${productNameWeight};">
                ${label.line1}
              </div>
              ${additionalLinesHtml}
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="print-page">
        <div class="label-grid">
          ${labelsHtml}
        </div>
      </div>
    `;
  };
  
  const printData = React.useMemo(() => {
    console.log('🔄 printData useMemo recalculating...');
    if (propData) {
      console.log('📦 Using propData');
      return propData;
    }
    
    if (bulkPrintMode && bulkProducts.length > 0) {
      console.log('🏭 Generating bulk label data for product at index', currentPageIndex);
      const currentProduct = bulkProducts[currentPageIndex];
      if (currentProduct) {
        return generateProductLabelData(currentProduct);
      }
    }
    
    console.log('🏭 Generating new label data from product');
    const result = generateProductLabelData(selectedProduct);
    console.log('✅ printData result:', result[0]);
    return result;
  }, [
    propData, 
    selectedProduct,
    bulkProducts,
    currentPageIndex,
    bulkPrintMode,
    template,
    showDate, showPrice, showSKU, showCategory, showMargin,
    showEffect, showLineage, showNose, showTerpene, showStrainType, showTHCA, showSupplier,
    selectedTier, showTierPrice, showTierLabel
  ]);

  const handlePrint = () => {
    // Detect iOS and PWA mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    console.log('🖨️ Print mode:', { isIOS, isPWA });
    
    let printableContent = '';
    
    if (bulkPrintMode && bulkProducts.length > 0) {
      console.log('🖨️ Printing all bulk products:', bulkProducts.length);
      
      bulkProducts.forEach((product, index) => {
        const productLabels = generateProductLabelData(product);
        const pageContent = generatePrintableSheet(productLabels);
        printableContent += pageContent;
      });
    } else if (printRef.current) {
      printableContent = printRef.current.innerHTML;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printableContent;
    
    tempDiv.querySelectorAll('img[src="/logoprint.png"]').forEach(img => {
      img.className = 'label-logo';
    });
    
    tempDiv.querySelectorAll('.flex-1.flex.flex-col').forEach(container => {
      const newContainer = document.createElement('div');
      newContainer.className = 'label-text';
      Array.from(container.children).forEach((child, index) => {
        const newDiv = document.createElement('div');
        newDiv.textContent = child.textContent;
        if (index === 0) {
          newDiv.className = 'product-name';
        }
        newContainer.appendChild(newDiv);
      });
      container.parentNode?.replaceChild(newContainer, container);
    });
    
    printableContent = tempDiv.innerHTML;
    
    // PWA Mode: Use iframe instead of new window
    if (isIOS && isPWA) {
      console.log('📱 PWA mode - using iframe print');
      
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        alert('Print failed');
        document.body.removeChild(iframe);
        return;
      }
      
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Labels</title>
  <style>
    @font-face {
      font-family: 'DonGraffiti';
      src: url('/DonGraffiti.otf') format('opentype');
      font-display: block;
    }
    @font-face {
      font-family: 'Tiempos';
      src: url('/Tiempos Text Regular.otf') format('opentype');
      font-display: block;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: 8.5in 11in; margin: 0; }
    html, body { width: 8.5in; height: 11in; margin: 0; padding: 0; }
    body { font-family: Helvetica, sans-serif; background: white; position: relative; }
    .print-page { width: 8.5in; height: 11in; position: relative; page-break-after: always; }
    .label-grid { position: absolute; top: 0; left: 0; width: 8.5in; height: 11in; }
    @media print {
      html, body { width: 8.5in !important; height: 11in !important; }
      .print-page { width: 8.5in !important; height: 11in !important; page-break-after: always !important; }
    }
  </style>
</head>
<body>${printableContent}</body>
</html>`);
      iframeDoc.close();
      
      // Wait for fonts to load
      const printIframe = () => {
        if (iframeDoc.fonts) {
          iframeDoc.fonts.ready.then(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          });
        } else {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 1000);
        }
      };
      
      setTimeout(printIframe, 300);
      return;
    }
    
    // Non-PWA: Use new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print labels');
      return;
    }
    
    // Write HTML with consistent screen/print styles
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Labels</title>
  <style>
    @font-face {
      font-family: 'DonGraffiti';
      src: url('/DonGraffiti.otf') format('opentype');
      font-display: block;
    }
    @font-face {
      font-family: 'Tiempos';
      src: url('/Tiempos Text Regular.otf') format('opentype');
      font-display: block;
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    @page { 
      size: 8.5in 11in;
      margin: 0;
    }
    
    html {
      width: 8.5in;
      height: 11in;
    }
    
    body { 
      width: 8.5in;
      height: 11in;
      margin: 0;
      padding: 0;
      font-family: Helvetica, sans-serif;
      background: white;
      position: relative;
    }
    
    .print-page { 
      width: 8.5in;
      height: 11in;
      position: relative;
      page-break-after: always;
      break-after: always;
    }
    
    .label-grid { 
      position: absolute;
      top: 0;
      left: 0;
      width: 8.5in;
      height: 11in;
    }
    
    .label { 
      position: absolute;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .label-content { 
      position: absolute;
      display: flex;
      align-items: flex-start;
      gap: 2px;
    }
    
    .label-logo { 
      flex-shrink: 0;
      object-fit: contain;
    }
    
    .label-text { 
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    
    .product-name { 
      font-weight: bold;
      word-wrap: break-word;
      overflow: hidden;
    }
    
    @media print {
      html, body {
        width: 8.5in !important;
        height: 11in !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-page {
        width: 8.5in !important;
        height: 11in !important;
        page-break-after: always !important;
      }
      .label-grid {
        width: 8.5in !important;
        height: 11in !important;
      }
    }
  </style>
</head>
<body>${printableContent}</body>
</html>`);
    printWindow.document.close();
    
    // Wait for fonts and images to load, then auto-print
    if (isIOS) {
      // iOS/PWA: Wait for fonts, then auto-trigger print
      console.log('📱 iOS detected - waiting for fonts to load');
      
      const checkAndPrint = () => {
        // Check if fonts are loaded
        if (printWindow.document.fonts && printWindow.document.fonts.status === 'loaded') {
          console.log('✅ Fonts loaded, triggering print');
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          // Wait for fonts
          if (printWindow.document.fonts) {
            printWindow.document.fonts.ready.then(() => {
              console.log('✅ Fonts ready, triggering print');
              printWindow.focus();
              setTimeout(() => {
                printWindow.print();
              }, 500);
            }).catch(() => {
              // Fonts failed, print anyway
              console.log('⚠️ Font load timeout, printing anyway');
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
              }, 500);
            });
          } else {
            // No font API, just wait and print
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 1500);
          }
        }
      };
      
      // Give a moment for DOM to be ready
      setTimeout(checkAndPrint, 300);
    } else {
      // Desktop: Quick print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    }
  };

  const generateLabelGrid = () => {
    const labels = [];
    const totalLabels = template.grid.rows * template.grid.columns;
    const basePadding = inchesToPx(template.label_style.safe_padding.top / 4);
    const baseGap = 2;
    
    for (let i = 0; i < totalLabels; i++) {
      const row = Math.floor(i / template.grid.columns);
      const col = i % template.grid.columns;
      
      const left = template.page.margin_left + (col * template.grid.horizontal_pitch);
      const top = template.page.margin_top + (row * template.grid.vertical_pitch);
      
      const dataIndex = i % printData.length;
      const labelData = printData[dataIndex];

      labels.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${inchesToPx(left)}px`,
            top: `${inchesToPx(top)}px`,
            width: `${inchesToPx(template.grid.label_width)}px`,
            height: `${inchesToPx(template.grid.label_height)}px`,
            border: showBorders ? '1px dashed rgba(0,0,0,0.15)' : 'none',
            borderRadius: `${inchesToPx(template.label_style.corner_radius)}px`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `${basePadding}px`,
              left: `${basePadding}px`,
              right: `${basePadding}px`,
              bottom: `${basePadding}px`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: `${baseGap}px`,
              overflow: 'hidden',
            }}
          >
            {renderLabelContent(labelData, 1)}
          </div>
        </div>
      );
    }
    
    return labels;
  };

  const renderLabelContent = (labelData: any, scale: number = 1) => {
    const ptToPx = (pt: number) => pt * 1.333;
    
    const productNameLength = labelData.line1?.length || 0;
    let adaptiveNameSize = productNameSize;
    
    if (productNameLength > 30) {
      adaptiveNameSize = Math.max(5, productNameSize * 0.6);
    } else if (productNameLength > 22) {
      adaptiveNameSize = Math.max(5, productNameSize * 0.75);
    } else if (productNameLength > 15) {
      adaptiveNameSize = Math.max(6, productNameSize * 0.9);
    }
    
    return (
      <>
        {showLogo && (
          <img
            src="/logoprint.png"
            alt="Logo"
            className="flex-shrink-0"
            style={{
              width: `${logoSize * scale}px`,
              height: `${logoSize * scale}px`,
              objectFit: 'contain',
            }}
          />
        )}
        <div className="flex-1 flex flex-col" style={{ gap: `${1 * scale}px`, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: `${ptToPx(adaptiveNameSize) * scale}px`,
              lineHeight: labelLineHeight,
              color: productNameColor,
              fontFamily: productNameFont,
              fontWeight: productNameWeight,
              wordWrap: 'break-word',
              overflow: 'hidden',
            }}
          >
            {labelData.line1}
          </div>
          {labelData.additionalLines && labelData.additionalLines.map((line: string, idx: number) => (
            <div
              key={idx}
              style={{
                fontSize: `${ptToPx(detailsSize) * scale}px`,
                lineHeight: labelLineHeight,
                color: detailsColor,
                fontFamily: detailsFont,
                wordWrap: 'break-word',
                overflow: 'hidden',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </>
    );
  };

  const generateSingleLabel = () => {
    const labelData = printData[0];
    const basePadding = inchesToPx(template.label_style.safe_padding.top / 4);
    const baseGap = 2;

    return (
      <div
        className="relative bg-white rounded overflow-hidden transition-shadow duration-700"
        style={{
          width: `${inchesToPx(template.grid.label_width)}px`,
          height: `${inchesToPx(template.grid.label_height)}px`,
          transform: `scale(${LARGE_PREVIEW_SCALE})`,
          transformOrigin: 'center',
          border: showBorders ? '1px solid rgba(0,0,0,0.1)' : 'none',
          boxShadow: focusedPreview === 'label' 
            ? '0 30px 90px -20px rgba(255, 255, 255, 0.12), 0 0 40px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            : '0 20px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: `${baseGap}px`,
            overflow: 'hidden',
            padding: `${basePadding}px`,
          }}
        >
          {renderLabelContent(labelData, 1)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <PrintToolbar
        selectedProduct={selectedProduct}
        onProductSelect={setSelectedProduct}
        selectedProducts={selectedProducts}
        onSelectedProductsChange={setSelectedProducts}
        bulkPrintMode={bulkPrintMode}
        onBulkPrintModeChange={setBulkPrintMode}
        selectedTemplate={selectedTemplate}
        onTemplateChange={(t) => setSelectedTemplate(t as keyof typeof TEMPLATES)}
        showBorders={showBorders}
        onShowBordersChange={setShowBorders}
        showLogo={showLogo}
        onShowLogoChange={setShowLogo}
        onPrint={handlePrint}
        onLibraryClick={() => setShowLibrary(true)}
        templates={TEMPLATE_LIST}
        showDate={showDate}
        onShowDateChange={setShowDate}
        showPrice={showPrice}
        onShowPriceChange={setShowPrice}
        showSKU={showSKU}
        onShowSKUChange={setShowSKU}
        showCategory={showCategory}
        onShowCategoryChange={setShowCategory}
        showMargin={showMargin}
        onShowMarginChange={setShowMargin}
        showEffect={showEffect}
        onShowEffectChange={setShowEffect}
        showLineage={showLineage}
        onShowLineageChange={setShowLineage}
        showNose={showNose}
        onShowNoseChange={setShowNose}
        showTerpene={showTerpene}
        onShowTerpeneChange={setShowTerpene}
        showStrainType={showStrainType}
        onShowStrainTypeChange={setShowStrainType}
        showTHCA={showTHCA}
        onShowTHCAChange={setShowTHCA}
        showSupplier={showSupplier}
        onShowSupplierChange={setShowSupplier}
        selectedTier={selectedTier}
        onSelectedTierChange={setSelectedTier}
        showTierPrice={showTierPrice}
        onShowTierPriceChange={setShowTierPrice}
        showTierLabel={showTierLabel}
        onShowTierLabelChange={setShowTierLabel}
        productNameFont={productNameFont}
        onProductNameFontChange={setProductNameFont}
        productNameSize={productNameSize}
        onProductNameSizeChange={setProductNameSize}
        productNameColor={productNameColor}
        onProductNameColorChange={setProductNameColor}
        productNameWeight={productNameWeight}
        onProductNameWeightChange={setProductNameWeight}
        detailsFont={detailsFont}
        onDetailsFontChange={setDetailsFont}
        detailsSize={detailsSize}
        onDetailsSizeChange={setDetailsSize}
        detailsColor={detailsColor}
        onDetailsColorChange={setDetailsColor}
        labelLineHeight={labelLineHeight}
        onLabelLineHeightChange={setLabelLineHeight}
        logoSize={logoSize}
        onLogoSizeChange={setLogoSize}
        template={template}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-transparent">
          <div 
            className="px-6 py-4 border-b border-white/[0.06] transition-all duration-700"
            style={{
              opacity: focusedPreview === null ? 0.6 : focusedPreview === 'label' ? 0.85 : 0.4,
            }}
          >
            <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Full Label</div>
            <div className="text-xs text-white/30 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
              {template.grid.label_width}" × {template.grid.label_height}"
            </div>
          </div>
          <div 
            className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 cursor-pointer transition-all duration-700 ease-out overflow-hidden"
            onClick={() => setFocusedPreview(focusedPreview === 'label' ? null : 'label')}
            style={{
              opacity: focusedPreview === null ? 0.6 : focusedPreview === 'label' ? 0.85 : 0.4,
            }}
          >
            <div
              className="transition-transform duration-700 ease-out w-full h-full flex items-center justify-center"
              style={{
                transform: focusedPreview === 'label' ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {generateSingleLabel()}
            </div>
          </div>
          <div 
            className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-center gap-8 transition-all duration-700"
            style={{
              opacity: focusedPreview === null ? 0.6 : focusedPreview === 'label' ? 0.85 : 0.4,
            }}
          >
            <div className="text-center">
              <div className="text-sm font-medium text-white/90" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.data_mapping.records_per_page}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>labels/sheet</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white/90" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.grid.rows}×{template.grid.columns}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>grid</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white/90" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.page.size.toUpperCase()}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>size</div>
            </div>
          </div>
        </div>

        <div className="w-[420px] flex flex-col border-l border-white/[0.06] bg-transparent">
          <div 
            className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between transition-all duration-700"
            style={{
              opacity: focusedPreview === null ? 0.6 : focusedPreview === 'sheet' ? 0.85 : 0.4,
            }}
          >
            <div>
              <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                {bulkPrintMode && bulkProducts.length > 0 ? `Sheet ${currentPageIndex + 1} of ${bulkProducts.length}` : 'Sheet'}
              </div>
              <div className="text-xs text-white/30 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                {Math.round(sheetScale * 100)}% scale
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetScale(Math.max(0.2, sheetScale - 0.1));
                }}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetScale(Math.min(1.2, sheetScale + 0.1));
                }}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {bulkPrintMode && bulkProducts.length > 1 && (
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="text-xs text-white/50" style={{ fontFamily: 'Tiempos, serif' }}>
                {bulkProducts[currentPageIndex]?.name || `Product ${currentPageIndex + 1}`}
              </div>
              <button
                onClick={() => setCurrentPageIndex(Math.min(bulkProducts.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === bulkProducts.length - 1}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Next
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          <div 
            ref={sheetContainerRef}
            className="flex-1 flex items-center justify-center p-4 overflow-hidden cursor-pointer transition-all duration-700 ease-out"
            onClick={() => setFocusedPreview(focusedPreview === 'sheet' ? null : 'sheet')}
            style={{
              opacity: focusedPreview === null ? 0.6 : focusedPreview === 'sheet' ? 0.85 : 0.4,
            }}
          >
            <div
              className="transition-transform duration-700 ease-out"
              style={{
                transform: `scale(${sheetScale * (focusedPreview === 'sheet' ? 1.03 : 1)})`,
                transformOrigin: 'center',
              }}
            >
              <div 
                ref={printRef}
                className="bg-white transition-shadow duration-700"
                style={{
                  width: `${inchesToPx(template.page.width)}px`,
                  height: `${inchesToPx(template.page.height)}px`,
                  position: 'relative',
                  boxShadow: focusedPreview === 'sheet'
                    ? '0 40px 100px -30px rgba(255, 255, 255, 0.15), 0 0 50px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                    : '0 25px 80px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${inchesToPx(template.page.width)}px`,
                    height: `${inchesToPx(template.page.height)}px`,
                  }}
                >
                  {generateLabelGrid()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}>
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-base font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>Label Library</h2>
              <button
                onClick={() => setShowLibrary(false)}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider px-3" style={{ fontFamily: 'Tiempos, serif' }}>
                  Save Current Configuration
                </div>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Template name"
                  className="w-full px-3 py-2 bg-neutral-800 text-white text-sm rounded border border-white/10 focus:outline-none focus:border-white/30"
                  style={{ fontFamily: 'Tiempos, serif' }}
                />
                <input
                  type="text"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 bg-neutral-800 text-white text-sm rounded border border-white/10 focus:outline-none focus:border-white/30"
                  style={{ fontFamily: 'Tiempos, serif' }}
                />
                <button
                  onClick={saveCurrentConfig}
                  disabled={!saveName.trim()}
                  className="w-full px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  Save Template
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider px-3" style={{ fontFamily: 'Tiempos, serif' }}>
                  Saved Templates ({savedTemplates.length})
                </div>
                {savedTemplates.length === 0 ? (
                  <div className="py-8 text-center text-white/30 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
                    No saved templates yet
                  </div>
                ) : (
                  savedTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => loadTemplate(t)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                            {t.name}
                          </div>
                          {t.description && (
                            <div className="text-xs text-white/40 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                              {t.description}
                            </div>
                          )}
                          <div className="text-xs text-white/30 mt-1" style={{ fontFamily: 'Tiempos, serif' }}>
                            {new Date(t.created_at).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
