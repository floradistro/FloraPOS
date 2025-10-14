'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PrintToolbar } from './PrintToolbar';

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

interface PrintViewProps {
  template?: LabelTemplate;
  data?: Array<{ line1: string; line2?: string; line3?: string }>;
  selectedProduct?: Product | null;
}

// Template Definitions
const TEMPLATES = {
  avery_5160: {
    template_name: "Avery_5160_30up",
    description: "30-up address labels on US Letter; 1.000 x 2.625 in each (Avery 5160-compatible).",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.5,
      margin_bottom: 0.5,
      margin_left: 0.1875,
      margin_right: 0.1875
    },
    grid: {
      rows: 10,
      columns: 3,
      label_width: 2.625,
      label_height: 1.0,
      horizontal_pitch: 2.75,
      vertical_pitch: 1.0,
      origin: "top-left"
    },
    label_style: {
      safe_padding: { top: 0.0625, right: 0.0625, bottom: 0.0625, left: 0.0625 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false }
    },
    text_style: {
      font_family: "Helvetica",
      font_size_pt: 9,
      line_height_em: 1.1,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit"
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 48 },
      { name: "line2", type: "text", required: false, max_length: 48 },
      { name: "line3", type: "text", required: false, max_length: 48 }
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.0625, y: 0.0625, width: 2.5, height: 0.875 },
        style_overrides: { line_break: "auto", max_lines: 3 }
      }
    ],
    data_mapping: {
      records_per_page: 30,
      fill_order: "row-major"
    },
    sample_data: [
      { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }
    ]
  },
  avery_5161: {
    template_name: "Avery_5161_20up",
    description: "20-up address labels on US Letter; 1.000 x 4.000 in each (Avery 5161-compatible).",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.5,
      margin_bottom: 0.5,
      margin_left: 0.16,
      margin_right: 0.16
    },
    grid: {
      rows: 10,
      columns: 2,
      label_width: 4.0,
      label_height: 1.0,
      horizontal_pitch: 4.18,
      vertical_pitch: 1.0,
      origin: "top-left"
    },
    label_style: {
      safe_padding: { top: 0.0625, right: 0.0625, bottom: 0.0625, left: 0.0625 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false }
    },
    text_style: {
      font_family: "Helvetica",
      font_size_pt: 9,
      line_height_em: 1.1,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit"
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 }
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.0625, y: 0.0625, width: 3.875, height: 0.875 },
        style_overrides: { line_break: "auto", max_lines: 3 }
      }
    ],
    data_mapping: {
      records_per_page: 20,
      fill_order: "row-major"
    },
    sample_data: [
      { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }
    ]
  },
  avery_5162: {
    template_name: "Avery_5162_14up",
    description: "14-up address labels on US Letter; 1.33 x 4.00 in each (Avery 5162-compatible).",
    units: "in",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      margin_top: 0.83,
      margin_bottom: 0.83,
      margin_left: 0.16,
      margin_right: 0.16
    },
    grid: {
      rows: 7,
      columns: 2,
      label_width: 4.0,
      label_height: 1.33,
      horizontal_pitch: 4.18,
      vertical_pitch: 1.33,
      origin: "top-left"
    },
    label_style: {
      safe_padding: { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 },
      corner_radius: 0.0625,
      background: "none",
      border: { enabled: false }
    },
    text_style: {
      font_family: "Helvetica",
      font_size_pt: 10,
      line_height_em: 1.2,
      color: "#000000",
      align: "left",
      vertical_align: "top",
      overflow: "shrink-to-fit"
    },
    fields: [
      { name: "line1", type: "text", required: true, max_length: 60 },
      { name: "line2", type: "text", required: false, max_length: 60 },
      { name: "line3", type: "text", required: false, max_length: 60 }
    ],
    layout: [
      {
        type: "text_block",
        binding: ["line1", "line2", "line3"],
        join_with: "\n",
        box: { x: 0.08, y: 0.08, width: 3.84, height: 1.17 },
        style_overrides: { line_break: "auto", max_lines: 4 }
      }
    ],
    data_mapping: {
      records_per_page: 14,
      fill_order: "row-major"
    },
    sample_data: [
      { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" }
    ]
  }
};

const TEMPLATE_LIST = [
  { id: 'avery_5160', name: 'Avery 5160', description: '30 labels (1.0" × 2.625")' },
  { id: 'avery_5161', name: 'Avery 5161', description: '20 labels (1.0" × 4.0")' },
  { id: 'avery_5162', name: 'Avery 5162', description: '14 labels (1.33" × 4.0")' }
];

export function PrintView({ template: propTemplate, data: propData, selectedProduct: propSelectedProduct }: PrintViewProps) {
  // State Management
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(propSelectedProduct || null);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('avery_5160');
  const [showBorders, setShowBorders] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [sheetScale, setSheetScale] = useState(1.0);
  const [labelPreviewFocused, setLabelPreviewFocused] = useState(false);
  const [sheetPreviewFocused, setSheetPreviewFocused] = useState(false);
  
  // Field toggles
  const [showDate, setShowDate] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showSKU, setShowSKU] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  
  // Blueprint field toggles
  const [showEffect, setShowEffect] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showNose, setShowNose] = useState(false);
  const [showTerpene, setShowTerpene] = useState(false);
  const [showStrainType, setShowStrainType] = useState(false);
  const [showTHCA, setShowTHCA] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  
  // Pricing tier options
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [showTierPrice, setShowTierPrice] = useState(false);
  const [showTierLabel, setShowTierLabel] = useState(false);
  
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  // Get active template
  const template = propTemplate || TEMPLATES[selectedTemplate];

  // Update selected product when prop changes
  useEffect(() => {
    if (propSelectedProduct) {
      setSelectedProduct(propSelectedProduct);
    }
  }, [propSelectedProduct]);

  // Auto-scale sheet to fit
  useEffect(() => {
    const updateScale = () => {
      if (!sheetContainerRef.current || !printRef.current) return;
      
      const container = sheetContainerRef.current;
      const pageWidth = template.page.width * 96; // inches to pixels
      const pageHeight = template.page.height * 96;
      
      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;
      
      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;
      const newScale = Math.min(scaleX, scaleY, 0.9); // max 90%
      
      setSheetScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [template]);

  // Generate product label data
  const generateProductLabelData = (product: Product | null) => {
    if (!product) {
      return [
        { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" },
        { line1: "Sample Product", line2: "Price: $12.99", line3: "SKU: ABC123" }
      ];
    }

    const productName = product.name || 'Unknown Product';
    const productPrice = product.blueprintPricing?.price || parseFloat(product.sale_price || product.regular_price || '0');
    const formattedPrice = `$${productPrice.toFixed(2)}`;
    const productSKU = product.sku || `ID: ${product.id}`;
    const category = product.categories?.[0]?.name || 'General';
    const currentDate = new Date().toLocaleDateString();
    
    const additionalFields = [];
    
    if (showDate) additionalFields.push(`Date: ${currentDate}`);
    if (showPrice) additionalFields.push(formattedPrice);
    if (showSKU) additionalFields.push(`SKU: ${productSKU}`);
    if (showCategory) additionalFields.push(`Cat: ${category}`);
    
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
        if (showTierPrice) {
          additionalFields.push(`${selectedTierData.label}: $${selectedTierData.price.toFixed(2)}`);
        }
        if (showTierLabel) {
          additionalFields.push(`Tier: ${selectedTierData.label}`);
        }
      }
    }
    
    const metaData = product.meta_data || [];
    const getMetaValue = (key: string) => {
      const meta = metaData.find(m => m.key === key || m.key === `_${key}`);
      return meta?.value;
    };
    
    if (showEffect) {
      const effect = getMetaValue('effect');
      if (effect) additionalFields.push(`Effect: ${effect}`);
    }
    
    if (showLineage) {
      const lineage = getMetaValue('lineage');
      if (lineage) additionalFields.push(`Lineage: ${lineage}`);
    }
    
    if (showNose) {
      const nose = getMetaValue('nose');
      if (nose) additionalFields.push(`Nose: ${nose}`);
    }
    
    if (showTerpene) {
      const terpene = getMetaValue('terpene');
      if (terpene) additionalFields.push(`Terpene: ${terpene}`);
    }
    
    if (showStrainType) {
      const strainType = getMetaValue('strain_type');
      if (strainType) additionalFields.push(`Type: ${strainType}`);
    }
    
    if (showTHCA) {
      const thca = getMetaValue('thca_percentage');
      if (thca) additionalFields.push(`THCA: ${thca}%`);
    }
    
    if (showSupplier) {
      const supplier = getMetaValue('supplier');
      if (supplier) additionalFields.push(`Supplier: ${supplier}`);
    }

    const line2 = additionalFields.slice(0, 2).join(' • ');
    const line3 = additionalFields.slice(2, 4).join(' • ');
    
    return Array(template.data_mapping.records_per_page).fill(null).map(() => ({
      line1: productName,
      line2: line2,
      line3: line3
    }));
  };

  const printData = propData || generateProductLabelData(selectedProduct);

  // Convert inches to pixels (96 DPI)
  const inchesToPx = (inches: number) => Math.round(inches * 96);
  const ptToPx = (points: number) => Math.round(points * 1.333);

  // Print Handler
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let printableContent = printRef.current.innerHTML;
        
        if (showLogo) {
          printableContent = printableContent
            .replace(/<img[^>]*src="\/logoprint\.png"[^>]*>/g, '<img class="label-logo" src="/logoprint.png" alt="Logo">');
        }
        printableContent = printableContent
          .replace(/<div style="[^"]*flex: 1[^"]*">/g, '<div class="label-text">');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Labels - ${template.template_name}</title>
              <style>
                @page {
                  size: ${template.page.size};
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: ${template.text_style.font_family}, sans-serif;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                .print-page {
                  width: ${template.page.width}in;
                  height: ${template.page.height}in;
                  position: relative;
                  page-break-after: always;
                }
                .label-grid {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: ${template.page.width}in;
                  height: ${template.page.height}in;
                }
                .label {
                  position: absolute;
                  width: ${template.grid.label_width}in;
                  height: ${template.grid.label_height}in;
                  border-radius: ${template.label_style.corner_radius}in;
                  overflow: hidden;
                }
                .label-content {
                  position: absolute;
                  top: ${template.label_style.safe_padding.top}in;
                  left: ${template.label_style.safe_padding.left}in;
                  right: ${template.label_style.safe_padding.right}in;
                  bottom: ${template.label_style.safe_padding.bottom}in;
                  display: flex;
                  flex-direction: row;
                  align-items: flex-start;
                  gap: 3px;
                  overflow: hidden;
                }
                .label-logo {
                  width: 12pt;
                  height: 12pt;
                  flex-shrink: 0;
                  object-fit: contain;
                }
                .label-text {
                  flex: 1;
                  font-size: ${template.text_style.font_size_pt}pt;
                  line-height: ${template.text_style.line_height_em};
                  color: ${template.text_style.color};
                  text-align: ${template.text_style.align};
                  font-family: ${template.text_style.font_family}, sans-serif;
                  white-space: pre-line;
                  word-wrap: break-word;
                  font-weight: normal;
                  overflow: hidden;
                }
              </style>
            </head>
            <body>
              ${printableContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  // Generate Label Grid
  const generateLabelGrid = () => {
    const labels = [];
    const totalLabels = template.grid.rows * template.grid.columns;
    
    for (let i = 0; i < totalLabels; i++) {
      const row = Math.floor(i / template.grid.columns);
      const col = i % template.grid.columns;
      
      const left = template.page.margin_left + (col * template.grid.horizontal_pitch);
      const top = template.page.margin_top + (row * template.grid.vertical_pitch);
      
      const dataIndex = i % printData.length;
      const labelData = printData[dataIndex];
      const labelText = [labelData.line1, labelData.line2, labelData.line3]
        .filter(line => line && line.trim())
        .join('\n');

      labels.push(
        <div
          key={i}
          className="label"
          style={{
            position: 'absolute',
            left: `${inchesToPx(left)}px`,
            top: `${inchesToPx(top)}px`,
            width: `${inchesToPx(template.grid.label_width)}px`,
            height: `${inchesToPx(template.grid.label_height)}px`,
            border: showBorders ? '1px dashed #ccc' : 'none',
            borderRadius: `${inchesToPx(template.label_style.corner_radius)}px`,
            overflow: 'hidden',
          }}
        >
          <div
            className="label-content"
            style={{
              position: 'absolute',
              top: `${inchesToPx(template.label_style.safe_padding.top)}px`,
              left: `${inchesToPx(template.label_style.safe_padding.left)}px`,
              right: `${inchesToPx(template.label_style.safe_padding.right)}px`,
              bottom: `${inchesToPx(template.label_style.safe_padding.bottom)}px`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '4px',
              overflow: 'hidden',
            }}
          >
            {showLogo && (
              <img
                src="/logoprint.png"
                alt="Logo"
                style={{
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                  objectFit: 'contain',
                }}
              />
            )}
            <div
              style={{
                flex: 1,
                fontSize: `${ptToPx(template.text_style.font_size_pt)}px`,
                lineHeight: template.text_style.line_height_em,
                color: template.text_style.color,
                textAlign: template.text_style.align as any,
                fontFamily: template.text_style.font_family,
                whiteSpace: 'pre-line',
                wordWrap: 'break-word',
                overflow: 'hidden',
              }}
            >
              {labelText}
            </div>
          </div>
        </div>
      );
    }
    
    return labels;
  };

  // Generate single label for editor
  const generateSingleLabel = () => {
    const labelData = printData[0];
    const labelText = [labelData.line1, labelData.line2, labelData.line3]
      .filter(line => line && line.trim())
      .join('\n');

    // Calculate responsive scale - fit to container width
    const baseWidth = inchesToPx(template.grid.label_width) * 2.2;
    const maxWidth = 440; // Max width to fit in 480px column with padding
    const scale = Math.min(1, maxWidth / baseWidth);

    return (
      <div
        className="relative bg-white rounded-xl overflow-hidden"
        style={{
          width: `${baseWidth * scale}px`,
          height: `${inchesToPx(template.grid.label_height) * 2.2 * scale}px`,
          border: showBorders ? '2px solid #3b82f6' : '2px solid transparent',
          boxShadow: '0 20px 60px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: `${inchesToPx(template.label_style.safe_padding.top) * 2.2 * scale}px`,
            left: `${inchesToPx(template.label_style.safe_padding.left) * 2.2 * scale}px`,
            right: `${inchesToPx(template.label_style.safe_padding.right) * 2.2 * scale}px`,
            bottom: `${inchesToPx(template.label_style.safe_padding.bottom) * 2.2 * scale}px`,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: `${8 * scale}px`,
            overflow: 'hidden',
          }}
        >
          {showLogo && (
            <img
              src="/logoprint.png"
              alt="Logo"
              style={{
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                flexShrink: 0,
                objectFit: 'contain',
              }}
            />
          )}
          <div
            style={{
              flex: 1,
              fontSize: `${ptToPx(template.text_style.font_size_pt) * 2.2 * scale}px`,
              lineHeight: template.text_style.line_height_em,
              color: template.text_style.color,
              textAlign: template.text_style.align as any,
              fontFamily: template.text_style.font_family,
              whiteSpace: 'pre-line',
              wordWrap: 'break-word',
              overflow: 'hidden',
            }}
          >
            {labelText}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Custom Toolbar */}
      <PrintToolbar
        selectedProduct={selectedProduct}
        onProductSelect={setSelectedProduct}
        selectedTemplate={selectedTemplate}
        onTemplateChange={(t) => setSelectedTemplate(t as keyof typeof TEMPLATES)}
        showBorders={showBorders}
        onShowBordersChange={setShowBorders}
        showLogo={showLogo}
        onShowLogoChange={setShowLogo}
        onPrint={handlePrint}
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
        template={template}
      />

      {/* Main Content Area - Three Column Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Single Label Editor (Primary Focus) */}
        <div className="w-[480px] flex-shrink-0 flex flex-col border-r border-white/[0.06]">
          {/* Editor Header */}
          <div className="px-8 py-6 border-b border-white/[0.06]">
            <h2 className="text-xl font-light text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
              Label Editor
            </h2>
            <p className="text-sm text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
              {template.grid.label_width}" × {template.grid.label_height}" • {template.template_name}
            </p>
          </div>

          {/* Single Label Preview (Enlarged) */}
          <div className="flex-1 flex items-center justify-center p-6 bg-transparent relative group">
            <div 
              className={`relative cursor-pointer transition-all duration-500 ease-out ${
                labelPreviewFocused ? 'opacity-100 scale-105' : 'opacity-60 scale-100 hover:opacity-80'
              }`}
              style={{ maxWidth: '100%' }}
              onClick={() => setLabelPreviewFocused(!labelPreviewFocused)}
            >
              {generateSingleLabel()}
              
              {/* Label Dimensions Overlay */}
              <div className="absolute -bottom-8 left-0 right-0 text-center">
                <span className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                  2.2× scale preview
                </span>
              </div>

              {/* Focus Indicator */}
              {labelPreviewFocused && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/50">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hover Hint */}
            {!labelPreviewFocused && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                  Click to focus
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="px-8 py-6 border-t border-white/[0.06] grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.data_mapping.records_per_page}
              </div>
              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                labels/sheet
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.grid.rows}×{template.grid.columns}
              </div>
              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                grid layout
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                {printData.length}
              </div>
              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                data records
              </div>
            </div>
          </div>
        </div>

        {/* Center: Full Sheet Preview */}
        <div className="flex-1 flex flex-col">
          {/* Sheet Header */}
          <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                Full Sheet Preview
              </h2>
              <p className="text-sm text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                {template.page.size.toUpperCase()} • {template.page.width}" × {template.page.height}"
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-neutral-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2">
              <button
                onClick={() => setSheetScale(Math.max(0.2, sheetScale - 0.1))}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="text-xs text-neutral-400 font-medium w-12 text-center" style={{ fontFamily: 'Tiempos, serif' }}>
                {Math.round(sheetScale * 100)}%
              </div>
              <button
                onClick={() => setSheetScale(Math.min(1.5, sheetScale + 0.1))}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div className="w-px h-5 bg-white/[0.08] mx-1" />
              <button
                onClick={() => setSheetScale(0.7)}
                className="px-3 h-8 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Fit
              </button>
            </div>
          </div>

          {/* Sheet Preview Area */}
          <div 
            ref={sheetContainerRef}
            className="flex-1 flex items-center justify-center p-4 overflow-auto bg-transparent relative group"
          >
            <div
              className={`cursor-pointer transition-all duration-500 ease-out ${
                sheetPreviewFocused ? 'opacity-100' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                transform: `scale(${sheetPreviewFocused ? sheetScale * 1.05 : sheetScale})`,
                transformOrigin: 'center',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out'
              }}
              onClick={() => setSheetPreviewFocused(!sheetPreviewFocused)}
            >
              <div 
                ref={printRef}
                className="print-page bg-white shadow-2xl relative"
                style={{
                  width: `${inchesToPx(template.page.width)}px`,
                  height: `${inchesToPx(template.page.height)}px`,
                  boxShadow: sheetPreviewFocused 
                    ? '0 30px 70px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                  transition: 'box-shadow 0.5s ease-out'
                }}
              >
                <div
                  className="label-grid"
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

                {/* Focus Indicator */}
                {sheetPreviewFocused && (
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/50">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Hover Hint */}
            {!sheetPreviewFocused && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                  Click to focus
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sliding Fields Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-neutral-900/95 backdrop-blur-xl border-l border-white/[0.06] transform transition-transform duration-300 ease-in-out ${
            showFieldsPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: 40 }}
        >
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                Label Fields
              </h3>
              <button
                onClick={() => setShowFieldsPanel(false)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!selectedProduct && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200" style={{ fontFamily: 'Tiempos, serif' }}>
                  Select a product to enable field options
                </div>
              )}

              {/* Extra Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                  Extra Fields
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'Date', value: showDate, onChange: setShowDate },
                    { label: 'Price', value: showPrice, onChange: setShowPrice },
                    { label: 'SKU', value: showSKU, onChange: setShowSKU },
                    { label: 'Category', value: showCategory, onChange: setShowCategory },
                    { label: 'Margin', value: showMargin, onChange: setShowMargin }
                  ].map((field) => (
                    <button
                      key={field.label}
                      onClick={() => selectedProduct && field.onChange(!field.value)}
                      disabled={!selectedProduct}
                      className={`w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl flex items-center justify-between ${
                        !selectedProduct 
                          ? 'bg-neutral-800/40 text-neutral-600 cursor-not-allowed' 
                          : field.value 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      <span>{field.label}</span>
                      <span className={`text-xs ${field.value && selectedProduct ? 'text-blue-400' : 'text-neutral-600'}`}>
                        {field.value ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blueprint Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                  Blueprint Fields
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'Effect', value: showEffect, onChange: setShowEffect },
                    { label: 'Lineage', value: showLineage, onChange: setShowLineage },
                    { label: 'Nose', value: showNose, onChange: setShowNose },
                    { label: 'Terpene', value: showTerpene, onChange: setShowTerpene },
                    { label: 'Strain Type', value: showStrainType, onChange: setShowStrainType },
                    { label: 'THCA', value: showTHCA, onChange: setShowTHCA },
                    { label: 'Supplier', value: showSupplier, onChange: setShowSupplier }
                  ].map((field) => (
                    <button
                      key={field.label}
                      onClick={() => selectedProduct && field.onChange(!field.value)}
                      disabled={!selectedProduct}
                      className={`w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl flex items-center justify-between ${
                        !selectedProduct 
                          ? 'bg-neutral-800/40 text-neutral-600 cursor-not-allowed' 
                          : field.value 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      <span>{field.label}</span>
                      <span className={`text-xs ${field.value && selectedProduct ? 'text-purple-400' : 'text-neutral-600'}`}>
                        {field.value ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Tiers */}
              {selectedProduct?.blueprintPricing?.ruleGroups && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                    Pricing Tiers
                  </h4>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-800/60 text-white text-sm rounded-xl border border-white/[0.08] focus:outline-none focus:border-blue-400/50"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <option value="">Select Tier</option>
                    {selectedProduct.blueprintPricing.ruleGroups.flatMap((group: any) => 
                      group.tiers.map((tier: any) => (
                        <option 
                          key={`${group.ruleName}-${tier.label}`} 
                          value={`${group.ruleName}-${tier.label}`}
                        >
                          {group.ruleName} - {tier.label} (${tier.price.toFixed(2)})
                        </option>
                      ))
                    )}
                  </select>
                  
                  {selectedTier && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowTierPrice(!showTierPrice)}
                        className={`w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl flex items-center justify-between ${
                          showTierPrice 
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        <span>Show Tier Price</span>
                        <span className={`text-xs ${showTierPrice ? 'text-green-400' : 'text-neutral-600'}`}>
                          {showTierPrice ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowTierLabel(!showTierLabel)}
                        className={`w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl flex items-center justify-between ${
                          showTierLabel 
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        <span>Show Tier Label</span>
                        <span className={`text-xs ${showTierLabel ? 'text-green-400' : 'text-neutral-600'}`}>
                          {showTierLabel ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fields Panel Toggle Button (Bottom Left) */}
        <button
          onClick={() => setShowFieldsPanel(!showFieldsPanel)}
          className="absolute bottom-6 left-[500px] flex items-center gap-2 px-4 py-2.5 bg-neutral-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg hover:bg-neutral-900/80 transition-colors text-white z-30"
          style={{ fontFamily: 'Tiempos, serif' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-xs font-medium">Customize Fields</span>
        </button>
      </div>
    </div>
  );
}
