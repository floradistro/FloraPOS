'use client';

import React, { useState, useRef } from 'react';

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
}

interface PrintViewProps {
  template?: LabelTemplate;
  data?: Array<{ line1: string; line2?: string; line3?: string }>;
  selectedProduct?: Product | null;
}

const DEFAULT_AVERY_5160: LabelTemplate = {
  "template_name": "Avery_5160_30up",
  "description": "30-up address labels on US Letter; 1.000 x 2.625 in each (Avery 5160-compatible).",
  "units": "in",
  "page": {
    "size": "letter",
    "width": 8.5,
    "height": 11.0,
    "margin_top": 0.5,
    "margin_bottom": 0.5,
    "margin_left": 0.1875,
    "margin_right": 0.1875
  },
  "grid": {
    "rows": 10,
    "columns": 3,
    "label_width": 2.625,
    "label_height": 1.0,
    "horizontal_pitch": 2.75,
    "vertical_pitch": 1.0,
    "origin": "top-left"
  },
  "label_style": {
    "safe_padding": { "top": 0.0625, "right": 0.0625, "bottom": 0.0625, "left": 0.0625 },
    "corner_radius": 0.0625,
    "background": "none",
    "border": { "enabled": false }
  },
  "text_style": {
    "font_family": "Helvetica",
    "font_size_pt": 9,
    "line_height_em": 1.1,
    "color": "#000000",
    "align": "left",
    "vertical_align": "top",
    "overflow": "shrink-to-fit"
  },
  "fields": [
    {
      "name": "line1",
      "type": "text",
      "required": true,
      "max_length": 48
    },
    {
      "name": "line2",
      "type": "text",
      "required": false,
      "max_length": 48
    },
    {
      "name": "line3",
      "type": "text",
      "required": false,
      "max_length": 48
    }
  ],
  "layout": [
    {
      "type": "text_block",
      "binding": ["line1", "line2", "line3"],
      "join_with": "\n",
      "box": {
        "x": 0.0625,
        "y": 0.0625,
        "width": 2.625 - 0.125,
        "height": 1.0 - 0.125
      },
      "style_overrides": {
        "line_break": "auto",
        "max_lines": 3
      }
    }
  ],
  "data_mapping": {
    "records_per_page": 30,
    "fill_order": "row-major"
  },
  "sample_data": [
    { "line1": "Flora Distro", "line2": "1234 Market St", "line3": "Charlotte, NC 28202" },
    { "line1": "Attn: Fulfillment", "line2": "555 Warehouse Rd", "line3": "Salisbury, NC 28144" }
  ]
};

export function PrintView({ template = DEFAULT_AVERY_5160, data, selectedProduct }: PrintViewProps) {
  const [showBorders, setShowBorders] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('avery_5160');
  
  // Extra field options
  const [showDate, setShowDate] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showSKU, setShowSKU] = useState(false);
  
  // Blueprint field options
  const [showEffect, setShowEffect] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showNose, setShowNose] = useState(false);
  const [showTerpene, setShowTerpene] = useState(false);
  const [showStrainType, setShowStrainType] = useState(false);
  const [showTHCA, setShowTHCA] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  
  // Blueprint pricing tier options
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [showTierPrice, setShowTierPrice] = useState(false);
  const [showTierLabel, setShowTierLabel] = useState(false);
  
  // Generate product label data or fallback to sample data
  const generateProductLabelData = (product: Product | null) => {
    if (!product) {
      // Fallback sample data when no product is selected
      return [
        { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" },
        { line1: "Attn: Fulfillment", line2: "555 Warehouse Rd", line3: "Salisbury, NC 28144" },
        { line1: "Customer Name", line2: "123 Main Street", line3: "City, State 12345" },
        { line1: "Business Name", line2: "456 Oak Avenue", line3: "Town, ST 67890" },
        { line1: "John Doe", line2: "789 Pine Road", line3: "Village, NC 13579" },
        { line1: "Jane Smith", line2: "321 Elm Drive", line3: "Hamlet, SC 24680" },
        { line1: "ABC Company", line2: "654 Maple Lane", line3: "Borough, GA 97531" },
        { line1: "XYZ Corp", line2: "987 Cedar Court", line3: "Township, FL 86420" },
        { line1: "Sample Address", line2: "111 First Street", line3: "Anytown, VA 11111" },
        { line1: "Test Customer", line2: "222 Second Ave", line3: "Somewhere, TN 22222" }
      ];
    }

    // Format product information for labels
    const productName = product.name || 'Unknown Product';
    const productPrice = product.blueprintPricing?.price || parseFloat(product.sale_price || product.regular_price || '0');
    const formattedPrice = `$${productPrice.toFixed(2)}`;
    const productSKU = product.sku || `ID: ${product.id}`;
    const category = product.categories?.[0]?.name || 'General';
    const currentDate = new Date().toLocaleDateString();
    
    // Build additional fields based on settings
    const additionalFields = [];
    
    if (showDate) additionalFields.push(`Date: ${currentDate}`);
    if (showPrice) additionalFields.push(formattedPrice);
    if (showSKU) additionalFields.push(`SKU: ${productSKU}`);
    if (showCategory) additionalFields.push(`Cat: ${category}`);
    
    // Add blueprint pricing margin if available
    if (showMargin && product.blueprintPricing?.margin) {
      additionalFields.push(`Margin: ${(product.blueprintPricing.margin * 100).toFixed(1)}%`);
    }
    
    // Add blueprint pricing tier information
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
    
    // Add blueprint fields from meta_data if available
    const metaData = product.meta_data || [];
    console.log('🔍 Product meta_data for blueprint fields:', product.name, metaData);
    
    const getMetaValue = (key: string) => {
      const meta = metaData.find(m => m.key === key || m.key === `_${key}`);
      console.log(`🔍 Looking for field '${key}':`, meta?.value);
      return meta?.value;
    };
    
    if (showEffect) {
      const effect = getMetaValue('effect');
      console.log('🔍 Effect field:', effect);
      if (effect) additionalFields.push(`Effect: ${effect}`);
    }
    
    if (showLineage) {
      const lineage = getMetaValue('lineage');
      console.log('🔍 Lineage field:', lineage);
      if (lineage) additionalFields.push(`Lineage: ${lineage}`);
    }
    
    if (showNose) {
      const nose = getMetaValue('nose');
      console.log('🔍 Nose field:', nose);
      if (nose) additionalFields.push(`Nose: ${nose}`);
    }
    
    if (showTerpene) {
      const terpene = getMetaValue('terpene');
      console.log('🔍 Terpene field:', terpene);
      if (terpene) additionalFields.push(`Terpene: ${terpene}`);
    }
    
    if (showStrainType) {
      const strainType = getMetaValue('strain_type');
      console.log('🔍 Strain Type field:', strainType);
      if (strainType) additionalFields.push(`Type: ${strainType}`);
    }
    
    if (showTHCA) {
      const thca = getMetaValue('thca_percentage');
      console.log('🔍 THCA field:', thca);
      if (thca) additionalFields.push(`THCA: ${thca}%`);
    }
    
    if (showSupplier) {
      const supplier = getMetaValue('supplier');
      console.log('🔍 Supplier field:', supplier);
      if (supplier) additionalFields.push(`Supplier: ${supplier}`);
    }
    
    // Add test blueprint fields if no real data is found (for testing)
    if (additionalFields.length === 0 && (showEffect || showLineage || showNose || showTerpene || showStrainType || showTHCA || showSupplier)) {
      console.log('🔍 No real blueprint data found, adding test data for demonstration');
      if (showEffect) additionalFields.push('Effect: Relaxing');
      if (showLineage) additionalFields.push('Lineage: OG Kush x Bubba');
      if (showNose) additionalFields.push('Nose: Earthy, Pine');
      if (showTerpene) additionalFields.push('Terpene: Myrcene');
      if (showStrainType) additionalFields.push('Type: Indica');
      if (showTHCA) additionalFields.push('THCA: 22.5%');
      if (showSupplier) additionalFields.push('Supplier: ABC Farm');
    }
    
    console.log('🔍 Final additional fields:', additionalFields);

    // Create product label data with optional fields
    const line2 = additionalFields.slice(0, 2).join(' • ');
    const line3 = additionalFields.slice(2, 4).join(' • ');
    
    return Array(10).fill(null).map(() => ({
      line1: productName,
      line2: line2,
      line3: line3
    }));
  };

  // Initialize print data with selected product or sample data
  const [printData, setPrintData] = useState(() => {
    if (data) return data;
    return generateProductLabelData(selectedProduct);
  });

  // Update print data when selected product or field options change
  React.useEffect(() => {
    if (!data) { // Only update if not using custom data
      setPrintData(generateProductLabelData(selectedProduct));
    }
  }, [selectedProduct, data, showDate, showCategory, showPrice, showSKU, showEffect, showLineage, showNose, showTerpene, showStrainType, showTHCA, showSupplier, showMargin, selectedTier, showTierPrice, showTierLabel]);
  const printRef = useRef<HTMLDivElement>(null);

  // Convert inches to pixels for display (96 DPI)
  const inchesToPx = (inches: number) => Math.round(inches * 96);
  
  // Convert points to pixels for font size
  const ptToPx = (points: number) => Math.round(points * 1.333);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = printRef.current.innerHTML;
        // Create a modified version of the content for printing with proper structure
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

  const generateLabelGrid = () => {
    const labels = [];
    const totalLabels = template.grid.rows * template.grid.columns;
    
    for (let i = 0; i < totalLabels; i++) {
      const row = Math.floor(i / template.grid.columns);
      const col = i % template.grid.columns;
      
      // Calculate position - start from the page margins, not from 0
      const left = template.page.margin_left + (col * template.grid.horizontal_pitch);
      const top = template.page.margin_top + (row * template.grid.vertical_pitch);
      
      // Get data for this label - cycle through available data
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
            {/* Logo */}
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
            {/* Text Content */}
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

  return (
    <div className="h-full flex bg-neutral-800">
      {/* Left Panel - Print Preview */}
      <div className="flex-1 flex flex-col">
        {/* Print Preview */}
        <div className="flex-1 flex items-center justify-center p-4" style={{ backgroundColor: '#1a1a1a' }}>
          {/* Page Preview */}
          <div 
            ref={printRef}
            className="print-page bg-white shadow-lg relative"
            style={{
              width: `${inchesToPx(template.page.width)}px`,
              height: `${inchesToPx(template.page.height)}px`,
              transform: 'scale(1.0)',
              transformOrigin: 'center',
              maxHeight: 'none',
              maxWidth: 'none',
            }}
          >
            {/* Label Grid */}
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
          </div>
        </div>
      </div>

      {/* Right Panel - Print Controls */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-neutral-900">
        {/* Toolbar Header */}
        <div className="px-4 py-4 bg-black">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Print Controls</h3>
        </div>

        {/* Toolbar Content */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Print Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Actions</h4>
            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className="w-full px-4 py-3 bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Print Labels
              </button>
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Quick Print
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Display</h4>
            <div className="space-y-2">
              <button
                onClick={() => setShowBorders(!showBorders)}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  showBorders 
                    ? 'bg-white text-black' 
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Show Borders</span>
                <span className="text-xs">{showBorders ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  showLogo 
                    ? 'bg-white text-black' 
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Show Logo</span>
                <span className="text-xs">{showLogo ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Template</h4>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-white text-sm focus:outline-none focus:bg-neutral-700"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <option value="avery_5160">Avery 5160 (30-up)</option>
              <option value="avery_5161">Avery 5161 (20-up)</option>
              <option value="avery_5162">Avery 5162 (14-up)</option>
            </select>
          </div>

          {/* Product Selection Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Product Selection</h4>
            {selectedProduct ? (
              <div className="bg-neutral-800 p-3 space-y-2">
                <div className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-neutral-400 grid grid-cols-2 gap-2">
                  <div>${(selectedProduct.blueprintPricing?.price || parseFloat(selectedProduct.sale_price || selectedProduct.regular_price || '0')).toFixed(2)}</div>
                  <div>{selectedProduct.sku || `#${selectedProduct.id}`}</div>
                </div>
                <button 
                  onClick={() => {
                    setPrintData(generateProductLabelData(null));
                  }}
                  className="w-full px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm transition-colors"
                  style={{ fontFamily: 'Tiempos, serif' }}
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="bg-neutral-800 p-3 space-y-1">
                <div className="text-sm text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>No Product Selected</div>
                <div className="text-xs text-neutral-500">Search above to select a product</div>
              </div>
            )}
          </div>

          {/* Extra Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Extra Fields</h4>
            {!selectedProduct && (
              <div className="text-xs text-neutral-600 mb-2">Select a product above to enable field options</div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setShowDate(!showDate)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showDate 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Date</span>
                <span className="text-xs">{showDate ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowPrice(!showPrice)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showPrice 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Price</span>
                <span className="text-xs">{showPrice ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowSKU(!showSKU)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showSKU 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>SKU</span>
                <span className="text-xs">{showSKU ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowCategory(!showCategory)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showCategory 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Category</span>
                <span className="text-xs">{showCategory ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowMargin(!showMargin)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showMargin 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Margin</span>
                <span className="text-xs">{showMargin ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Blueprint Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Blueprint Fields</h4>
            {!selectedProduct && (
              <div className="text-xs text-neutral-600 mb-2">Select a product above to enable blueprint fields</div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setShowEffect(!showEffect)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showEffect 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Effect</span>
                <span className="text-xs">{showEffect ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowLineage(!showLineage)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showLineage 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Lineage</span>
                <span className="text-xs">{showLineage ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowNose(!showNose)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showNose 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Nose</span>
                <span className="text-xs">{showNose ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowTerpene(!showTerpene)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showTerpene 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Terpene</span>
                <span className="text-xs">{showTerpene ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowStrainType(!showStrainType)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showStrainType 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Strain Type</span>
                <span className="text-xs">{showStrainType ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowTHCA(!showTHCA)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showTHCA 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>THCA</span>
                <span className="text-xs">{showTHCA ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setShowSupplier(!showSupplier)}
                disabled={!selectedProduct}
                className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                  !selectedProduct 
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                    : showSupplier 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                <span>Supplier</span>
                <span className="text-xs">{showSupplier ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Blueprint Pricing Tiers */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Pricing Tiers</h4>
            {!selectedProduct ? (
              <div className="text-xs text-neutral-600">Select a product with blueprint pricing to see tiers</div>
            ) : !selectedProduct.blueprintPricing?.ruleGroups ? (
              <div className="text-xs text-neutral-600">Selected product has no pricing tiers</div>
            ) : (
              <>
                {(() => {
                  console.log('🔍 Rendering pricing tiers section for:', selectedProduct.name);
                  console.log('🔍 Rule groups:', selectedProduct.blueprintPricing.ruleGroups);
                  return null;
                })()}
              
              {/* Tier Selection */}
              <div className="space-y-2">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 text-white text-sm focus:outline-none focus:bg-neutral-700"
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
              </div>

              {/* Tier Display Options */}
              {selectedTier && (
                <div className="space-y-1">
                  <button
                    onClick={() => setShowTierPrice(!showTierPrice)}
                    className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                      showTierPrice 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <span>Show Tier Price</span>
                    <span className="text-xs">{showTierPrice ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    onClick={() => setShowTierLabel(!showTierLabel)}
                    className={`w-full px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                      showTierLabel 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <span>Show Tier Label</span>
                    <span className="text-xs">{showTierLabel ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              )}
              </>
            )}
          </div>

          {/* Data Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Data</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors" style={{ fontFamily: 'Tiempos, serif' }}>
                Import CSV
              </button>
              <button className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors" style={{ fontFamily: 'Tiempos, serif' }}>
                Add Manual
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-neutral-800 p-3 space-y-2">
            <h4 className="text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>Specifications</h4>
            <div className="space-y-1 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Page:</span>
                <span>{template.page.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Grid:</span>
                <span>{template.grid.rows}×{template.grid.columns}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{template.grid.label_width}"×{template.grid.label_height}"</span>
              </div>
              <div className="flex justify-between">
                <span>Labels:</span>
                <span>{template.data_mapping.records_per_page}</span>
              </div>
              <div className="flex justify-between">
                <span>Records:</span>
                <span>{printData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

