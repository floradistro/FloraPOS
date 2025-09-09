'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WordPressUser } from '../../services/users-service';

export interface PrintSettings {
  includeLogo: boolean;
  includeQRCode: boolean;
  includeCustomer: boolean;
  includeDisclaimer: boolean;
  includeTimestamp: boolean;
  labelSize: string;
  orientation: string;
  copies: number;
}

interface PrintSettingsProps {
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  onSettingsChange?: (settings: PrintSettings) => void;
}

export function PrintSettingsPanel({ selectedCustomer, onCustomerSelect, onSettingsChange }: PrintSettingsProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  // Print settings state
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    includeLogo: true,
    includeQRCode: true,
    includeCustomer: true,
    includeDisclaimer: true,
    includeTimestamp: true,
    labelSize: '2x4', // 2x4, 2x3, 4x6
    orientation: 'landscape', // portrait, landscape
    copies: 1
  });

  // Notify parent component when settings change
  useEffect(() => {
    onSettingsChange?.(printSettings);
  }, [printSettings, onSettingsChange]);

  const handlePrint = () => {
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
  };

  const handleExportPDF = () => {
    // Same as print but with a different title
    handlePrint();
  };

  return (
    <div className="h-full bg-neutral-900/95 backdrop-blur-sm border border-white/[0.08] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/[0.08] bg-neutral-800/50">
        <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Print Settings</h3>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs text-neutral-200 font-medium">
                {selectedCustomer.display_name || selectedCustomer.username}
              </div>
              <div className="text-xs text-neutral-400">{selectedCustomer.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Print Actions */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-neutral-850/30 space-y-2">
        <button
          onClick={handlePrint}
          className="w-full px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800/70 text-neutral-300 border border-white/[0.08] rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-center gap-2 group"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Labels
        </button>
        
        <button
          onClick={handleExportPDF}
          className="w-full px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800/70 text-neutral-300 border border-white/[0.08] rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      {/* Label Settings Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-1">
          <div className="px-4 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Label Configuration
          </div>
          
          {/* Size Settings */}
          <div className="px-4 py-2 space-y-2">
            <div className="text-xs text-neutral-400 mb-1">Label Size (inches)</div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: '2x3', label: '2" × 3"', description: 'Small' },
                { value: '2x4', label: '2" × 4"', description: 'Standard' },
                { value: '4x6', label: '4" × 6"', description: 'Large' }
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => setPrintSettings({ ...printSettings, labelSize: size.value })}
                  className={`px-2 py-2.5 text-xs rounded transition-all duration-150 flex flex-col items-center gap-1 ${
                    printSettings.labelSize === size.value
                      ? 'bg-neutral-700/50 text-neutral-200 border border-white/[0.15]'
                      : 'bg-neutral-800/30 text-neutral-400 border border-white/[0.06] hover:bg-neutral-800/50'
                  }`}
                >
                  <span className="font-medium">{size.label}</span>
                  <span className="text-[10px] opacity-70">{size.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="px-4 py-2 space-y-2">
            <div className="text-xs text-neutral-400 mb-1">Orientation</div>
            <div className="grid grid-cols-2 gap-1">
              {['portrait', 'landscape'].map((orientation) => (
                <button
                  key={orientation}
                  onClick={() => setPrintSettings({ ...printSettings, orientation })}
                  className={`px-2 py-1.5 text-xs rounded transition-all duration-150 ${
                    printSettings.orientation === orientation
                      ? 'bg-neutral-700/50 text-neutral-200 border border-white/[0.15]'
                      : 'bg-neutral-800/30 text-neutral-400 border border-white/[0.06] hover:bg-neutral-800/50'
                  }`}
                >
                  {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Copies */}
          <div className="px-4 py-2">
            <div className="text-xs text-neutral-400 mb-1">Number of Copies</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintSettings({ ...printSettings, copies: Math.max(1, printSettings.copies - 1) })}
                className="w-7 h-7 bg-neutral-800/50 hover:bg-neutral-800/70 text-neutral-400 rounded border border-white/[0.06] flex items-center justify-center transition-all duration-150"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={printSettings.copies}
                onChange={(e) => setPrintSettings({ ...printSettings, copies: parseInt(e.target.value) || 1 })}
                className="w-16 px-2 py-1 bg-neutral-800/50 border border-white/[0.06] rounded text-neutral-300 text-xs text-center focus:border-white/[0.15] focus:outline-none"
              />
              <button
                onClick={() => setPrintSettings({ ...printSettings, copies: Math.min(10, printSettings.copies + 1) })}
                className="w-7 h-7 bg-neutral-800/50 hover:bg-neutral-800/70 text-neutral-400 rounded border border-white/[0.06] flex items-center justify-center transition-all duration-150"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Include Options */}
        <div className="border-t border-white/[0.06] py-1">
          <div className="px-4 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Include Elements
          </div>
          
          <div className="px-4 py-2 space-y-2">
            {[
              { key: 'includeLogo', label: 'Company Logo' },
              { key: 'includeQRCode', label: 'QR Code' },
              { key: 'includeCustomer', label: 'Customer Name' },
              { key: 'includeDisclaimer', label: 'Legal Disclaimer' },
              { key: 'includeTimestamp', label: 'Date & Time' }
            ].map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-3 py-1.5 cursor-pointer group hover:bg-white/[0.02] rounded px-1 -mx-1 transition-all duration-150"
              >
                <input
                  type="checkbox"
                  checked={printSettings[option.key as keyof typeof printSettings] as boolean}
                  onChange={(e) => setPrintSettings({ ...printSettings, [option.key]: e.target.checked })}
                  className="w-3.5 h-3.5 bg-neutral-800 border border-white/[0.15] rounded text-neutral-300 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-neutral-300 group-hover:text-neutral-200">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.08] bg-neutral-800/30">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{printSettings.copies} cop{printSettings.copies !== 1 ? 'ies' : 'y'} • {printSettings.labelSize.replace('x', '" × ')}"</span>
          <span className="text-neutral-300">Ready to Print</span>
        </div>
      </div>
    </div>
  );
}