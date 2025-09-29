'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WordPressUser } from '../../services/users-service';
import { AveryLabelService, AveryLabelSize, LabelData, AVERY_LABEL_SIZES } from '../../services/averyLabelService';
import { AveryLabelSheetPreview } from './AveryLabelTemplate';
import { Product } from './ProductGrid';

export interface PrintSettings {
  includeLogo: boolean;
  includeQRCode: boolean;
  includeCustomer: boolean;
  includeDisclaimer: boolean;
  includeTimestamp: boolean;
  labelSize: string;
  averyLabelSize: AveryLabelSize;
  orientation: string;
  copies: number;
  useAveryTemplate: boolean;
}

interface PrintSettingsProps {
  selectedCustomer?: WordPressUser | null;
  selectedProduct?: Product | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  onSettingsChange?: (settings: PrintSettings) => void;
}

export function PrintSettingsPanel({ selectedCustomer, selectedProduct, onCustomerSelect, onSettingsChange }: PrintSettingsProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  // Print settings state
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    includeLogo: true,
    includeQRCode: true,
    includeCustomer: true,
    includeDisclaimer: true,
    includeTimestamp: true,
    labelSize: '2x4', // 2x4, 2x3, 4x6
    averyLabelSize: '5160', // Avery label size
    orientation: 'landscape', // portrait, landscape
    copies: 1,
    useAveryTemplate: false
  });

  // Notify parent component when settings change
  useEffect(() => {
    onSettingsChange?.(printSettings);
  }, [printSettings, onSettingsChange]);

  const handlePrint = async () => {
    if (printSettings.useAveryTemplate) {
      await handleAveryPrint();
    } else {
      // Apply print styles to the document
      const [width, height] = printSettings.labelSize.split('x').map(n => parseInt(n));
      const isPortrait = printSettings.orientation === 'portrait';
      const printWidth = isPortrait ? width : height;
      const printHeight = isPortrait ? height : width;

      // Create a style element for print media
      const styleEl = document.createElement('style');
      styleEl.id = 'print-styles';
      styleEl.textContent = `
        @media print {
          @page {
            size: ${printWidth}in ${printHeight}in;
            margin: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          .label-preview-container,
          .label-preview-container * {
            visibility: visible;
          }
          
          .label-preview-container {
            position: fixed;
            left: 0;
            top: 0;
            width: ${printWidth}in !important;
            height: ${printHeight}in !important;
          }
          
          .label-preview-container > div {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
          }
        }
      `;

      // Remove any existing print styles
      const existingStyle = document.getElementById('print-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Add the new print styles
      document.head.appendChild(styleEl);

      // Trigger print
      window.print();

      // Clean up after printing
      setTimeout(() => {
        styleEl.remove();
      }, 1000);
    }
  };

  const handleExportPDF = async () => {
    if (printSettings.useAveryTemplate) {
      await handleAveryExportPDF();
    } else {
      // Same as print but with a different title
      handlePrint();
    }
  };

  const handleAveryPrint = async () => {
    try {
      const labelData = generateLabelData();
      const labelElement = document.querySelector('.avery-label-preview .avery-label');
      
      if (labelElement) {
        const blob = await AveryLabelService.generateLabelFromHTML(
          labelElement as HTMLElement,
          printSettings.averyLabelSize,
          printSettings.copies
        );
        
        // Create temporary URL and trigger print
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating Avery labels:', error);
    }
  };

  const handleAveryExportPDF = async () => {
    try {
      const labelData = generateLabelData();
      
      const blob = await AveryLabelService.generateLabelPDF({
        labelSize: printSettings.averyLabelSize,
        data: Array(printSettings.copies).fill(labelData[0]),
        includeLogo: printSettings.includeLogo,
        includeQRCode: printSettings.includeQRCode,
        includeCustomer: printSettings.includeCustomer,
        includeTimestamp: printSettings.includeTimestamp
      });
      
      AveryLabelService.downloadPDF(blob, `avery-labels-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error exporting Avery labels:', error);
    }
  };

  const generateLabelData = (): LabelData[] => {
    // If no product selected, return empty array
    if (!selectedProduct) {
      return [];
    }

    const data: LabelData = {
      customerName: selectedCustomer?.display_name || selectedCustomer?.username || '',
      customerEmail: selectedCustomer?.email || '',
      customerPhone: '', // Add phone field to WordPressUser if available
      productName: selectedProduct.name,
      productSku: selectedProduct.sku || '',
      qrCode: `${window.location.origin}/product/${selectedProduct.id}`,
      logoUrl: '/logo123.png',
      timestamp: new Date().toISOString(),
      customText: printSettings.includeDisclaimer ? 'Terms and conditions apply' : '',
      price: selectedProduct.regular_price ? `$${selectedProduct.regular_price}` : '',
      quantity: selectedProduct.total_stock?.toString() || ''
    };
    
    // Create array for multiple copies
    return Array(printSettings.copies).fill(data);
  };

  return (
    <div className="w-full bg-transparent flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <h3 className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>Print Settings</h3>
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="mx-2 mt-2 mb-3">
          <div className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-300 font-medium truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                  {selectedCustomer.display_name || selectedCustomer.username}
                </div>
                <div className="text-xs text-neutral-500 truncate" style={{ fontFamily: 'Tiempos, serif' }}>{selectedCustomer.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="px-2 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-all duration-300 ease-out group relative flex flex-col items-center justify-center"
            title="Print Labels"
          >
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
          </button>
          
          {/* Export Button */}
          <button
            onClick={handleExportPDF}
            className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-all duration-300 ease-out group relative flex flex-col items-center justify-center"
            title="Export PDF"
          >
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
          </button>

          {/* Portrait Orientation Button */}
          <button
            onClick={() => setPrintSettings({ ...printSettings, orientation: 'portrait' })}
            className={`transition-all duration-300 ease-out group relative rounded-lg p-3 flex flex-col items-center justify-center ${
              printSettings.orientation === 'portrait'
                ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
            }`}
            title="Portrait"
          >
            <svg className={`w-5 h-5 transition-colors duration-300 ${
              printSettings.orientation === 'portrait' ? 'text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-300'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="7" y="3" width="10" height="18" rx="2" ry="2" strokeWidth={2}/>
            </svg>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
          </button>

          {/* Landscape Orientation Button */}
          <button
            onClick={() => setPrintSettings({ ...printSettings, orientation: 'landscape' })}
            className={`transition-all duration-300 ease-out group relative rounded-lg p-3 flex flex-col items-center justify-center ${
              printSettings.orientation === 'landscape'
                ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
            }`}
            title="Landscape"
          >
            <svg className={`w-5 h-5 transition-colors duration-300 ${
              printSettings.orientation === 'landscape' ? 'text-neutral-200' : 'text-neutral-400 group-hover:text-neutral-300'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="10" rx="2" ry="2" strokeWidth={2}/>
            </svg>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
          </button>
        </div>
      </div>

      {/* Label Settings Section */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Template Type */}
        <div className="mb-4">
          <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
            Label Template
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPrintSettings({ ...printSettings, useAveryTemplate: false })}
              className={`w-full transition-all duration-300 ease-out group relative rounded-lg p-3 ${
                !printSettings.useAveryTemplate
                  ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                  : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
              }`}
            >
              <div className="text-left">
                <div className={`font-medium text-sm transition-colors duration-300 ${
                  !printSettings.useAveryTemplate
                    ? 'text-neutral-200'
                    : 'text-neutral-300 group-hover:text-neutral-200'
                }`} style={{ fontFamily: 'Tiempos, serif' }}>
                  Standard
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  !printSettings.useAveryTemplate
                    ? 'text-neutral-500'
                    : 'text-neutral-600 group-hover:text-neutral-500'
                }`} style={{ fontFamily: 'Tiempos, serif' }}>
                  Basic labels
                </div>
              </div>
            </button>
            <button
              onClick={() => setPrintSettings({ ...printSettings, useAveryTemplate: true })}
              className={`w-full transition-all duration-300 ease-out group relative rounded-lg p-3 ${
                printSettings.useAveryTemplate
                  ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                  : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
              }`}
            >
              <div className="text-left">
                <div className={`font-medium text-sm transition-colors duration-300 ${
                  printSettings.useAveryTemplate
                    ? 'text-neutral-200'
                    : 'text-neutral-300 group-hover:text-neutral-200'
                }`} style={{ fontFamily: 'Tiempos, serif' }}>
                  Avery
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  printSettings.useAveryTemplate
                    ? 'text-neutral-500'
                    : 'text-neutral-600 group-hover:text-neutral-500'
                }`} style={{ fontFamily: 'Tiempos, serif' }}>
                  Professional
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Size Settings */}
        <div className="mb-4">
        <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
          {printSettings.useAveryTemplate ? 'Avery Label Size' : 'Label Size'}
        </div>
          {printSettings.useAveryTemplate ? (
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(AVERY_LABEL_SIZES).map(([key, dimensions]) => (
                <button
                  key={key}
                  onClick={() => setPrintSettings({ ...printSettings, averyLabelSize: key as AveryLabelSize })}
                  className={`w-full transition-all duration-300 ease-out group relative rounded-lg p-3 ${
                    printSettings.averyLabelSize === key
                      ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                      : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left flex-1">
                      <div className={`font-medium text-sm transition-colors duration-300 ${
                        printSettings.averyLabelSize === key
                          ? 'text-neutral-200'
                          : 'text-neutral-300 group-hover:text-neutral-200'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        Avery {key}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        printSettings.averyLabelSize === key
                          ? 'text-neutral-500'
                          : 'text-neutral-600 group-hover:text-neutral-500'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {dimensions.width}" × {dimensions.height}" ({dimensions.columns}×{dimensions.rows})
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: '2x3', label: '2" × 3"', description: 'Small labels' },
                { value: '2x4', label: '2" × 4"', description: 'Standard labels' },
                { value: '4x6', label: '4" × 6"', description: 'Large labels' }
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => setPrintSettings({ ...printSettings, labelSize: size.value })}
                  className={`w-full transition-all duration-300 ease-out group relative rounded-lg p-3 ${
                    printSettings.labelSize === size.value
                      ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                      : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="text-left flex-1">
                      <div className={`font-medium text-sm transition-colors duration-300 ${
                        printSettings.labelSize === size.value
                          ? 'text-neutral-200'
                          : 'text-neutral-300 group-hover:text-neutral-200'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {size.label}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        printSettings.labelSize === size.value
                          ? 'text-neutral-500'
                          : 'text-neutral-600 group-hover:text-neutral-500'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {size.description}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
                </button>
              ))}
            </div>
          )}
        </div>


        {/* Copies */}
        <div className="mb-4">
        <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
          Copies
        </div>
          <div className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-all duration-300 ease-out group">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPrintSettings({ ...printSettings, copies: Math.max(1, printSettings.copies - 1) })}
                className="w-8 h-8 rounded-full bg-neutral-700/30 hover:bg-neutral-600/30 text-neutral-400 hover:text-neutral-300 flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={printSettings.copies}
                  onChange={(e) => setPrintSettings({ ...printSettings, copies: parseInt(e.target.value) || 1 })}
                  className="w-full bg-transparent text-neutral-300 text-lg font-medium text-center focus:outline-none"
                  style={{ fontFamily: 'Tiempos, serif' }}
                />
                <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>copies</div>
              </div>
              <button
                onClick={() => setPrintSettings({ ...printSettings, copies: Math.min(10, printSettings.copies + 1) })}
                className="w-8 h-8 rounded-full bg-neutral-700/30 hover:bg-neutral-600/30 text-neutral-400 hover:text-neutral-300 flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Include Options */}
      <div className="border-t border-white/[0.06] px-2 py-3">
        <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
          Include Elements
        </div>
        
        <div className="space-y-2">
          {[
            { key: 'includeLogo', label: 'Company Logo' },
            { key: 'includeQRCode', label: 'QR Code' },
            { key: 'includeCustomer', label: 'Customer Name' },
            { key: 'includeDisclaimer', label: 'Legal Disclaimer' },
            { key: 'includeTimestamp', label: 'Date & Time' }
          ].map((option) => (
            <label
              key={option.key}
              className={`flex items-center rounded-lg p-3 transition-all duration-300 ease-out cursor-pointer group relative ${
                printSettings[option.key as keyof typeof printSettings]
                  ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                  : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center flex-1">
                <div className="flex-1">
                  <div className={`font-medium text-sm transition-colors duration-300 ${
                    printSettings[option.key as keyof typeof printSettings]
                      ? 'text-neutral-200'
                      : 'text-neutral-300 group-hover:text-neutral-200'
                  }`} style={{ fontFamily: 'Tiempos, serif' }}>
                    {option.label}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={printSettings[option.key as keyof typeof printSettings] as boolean}
                  onChange={(e) => setPrintSettings({ ...printSettings, [option.key]: e.target.checked })}
                  className="sr-only"
                />
              </div>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
            </label>
          ))}
        </div>
      </div>

      {/* Full Sheet Preview */}
      {printSettings.useAveryTemplate && selectedProduct && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
            Label Sheet Preview
          </div>
          <div className="flex justify-center">
            <div 
              className="label-preview-container bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden"
              style={{ 
                width: '300px',
                height: '388px', // 8.5:11 aspect ratio scaled down
                transform: 'scale(0.35)',
                transformOrigin: 'top center'
              }}
            >
              <AveryLabelSheetPreview
                labelSize={printSettings.averyLabelSize}
                labelData={generateLabelData()}
                includeLogo={printSettings.includeLogo}
                includeQRCode={printSettings.includeQRCode}
                includeCustomer={printSettings.includeCustomer}
                includeTimestamp={printSettings.includeTimestamp}
                logoUrl="/logo123.png"
                className="w-full h-full"
              />
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
              {selectedProduct.name} • {AVERY_LABEL_SIZES[printSettings.averyLabelSize].columns}×{AVERY_LABEL_SIZES[printSettings.averyLabelSize].rows} labels per sheet
            </div>
          </div>
        </div>
      )}

      {/* No Product Selected Message */}
      {printSettings.useAveryTemplate && !selectedProduct && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="px-2 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
            Preview
          </div>
          <div className="flex justify-center py-8">
            <div className="text-center text-neutral-500">
              <div className="text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
                Select a product to preview labels
              </div>
              <div className="text-xs mt-1 text-neutral-600">
                Use the search bar above to choose a product
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
            {printSettings.copies} cop{printSettings.copies !== 1 ? 'ies' : 'y'} • {printSettings.useAveryTemplate ? `Avery ${printSettings.averyLabelSize}` : printSettings.labelSize.replace('x', '" × "')} • {printSettings.orientation}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}