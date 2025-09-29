import React, { useState } from 'react';
import { Avery5160SheetPreview } from './Avery5160Template';
import { AveryTemplateService, AVERY_5160_TEMPLATE } from '@/services/averyTemplateService';

interface IndustryPrintPreviewProps {
  labelData: Record<string, string>[];
  className?: string;
}

export function IndustryPrintPreview({ labelData, className = '' }: IndustryPrintPreviewProps) {
  const [zoom, setZoom] = useState(75); // Default 75% zoom
  const [showMargins, setShowMargins] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  // Standard US Letter dimensions in pixels at 96 DPI
  const paperWidth = 816; // 8.5 inches * 96 DPI
  const paperHeight = 1056; // 11 inches * 96 DPI
  
  // Calculate scaled dimensions
  const scaledWidth = (paperWidth * zoom) / 100;
  const scaledHeight = (paperHeight * zoom) / 100;

  const zoomOptions = [25, 50, 75, 100, 125, 150, 200];

  return (
    <div className={`industry-print-preview bg-gray-100 ${className}`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-800">Print Preview</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Page 1 of 1</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs text-gray-600">US Letter (8.5" × 11")</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {zoomOptions.map(option => (
                <option key={option} value={option}>{option}%</option>
              ))}
            </select>
            
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* View Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMargins(!showMargins)}
              className={`text-xs px-2 py-1 rounded ${
                showMargins 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Margins
            </button>
            
            <button
              onClick={() => setShowRulers(!showRulers)}
              className={`text-xs px-2 py-1 rounded ${
                showRulers 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Rulers
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-8">
        <div className="flex justify-center">
          <div className="relative">
            {/* Rulers */}
            {showRulers && (
              <>
                {/* Horizontal Ruler */}
                <div 
                  className="absolute -top-6 bg-white border-b border-gray-300 flex"
                  style={{ 
                    left: '0',
                    width: `${scaledWidth}px`,
                    height: '24px'
                  }}
                >
                  {Array.from({ length: 9 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 relative border-r border-gray-300 last:border-r-0"
                      style={{ minWidth: `${scaledWidth / 8.5}px` }}
                    >
                      <div className="absolute bottom-0 left-0 text-xs text-gray-500 transform -translate-x-1/2">
                        {i}
                      </div>
                      <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-400"></div>
                    </div>
                  ))}
                </div>

                {/* Vertical Ruler */}
                <div 
                  className="absolute -left-6 bg-white border-r border-gray-300 flex flex-col"
                  style={{ 
                    top: '0',
                    width: '24px',
                    height: `${scaledHeight}px`
                  }}
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 relative border-b border-gray-300 last:border-b-0"
                      style={{ minHeight: `${scaledHeight / 11}px` }}
                    >
                      <div className="absolute right-0 top-0 text-xs text-gray-500 transform -translate-y-1/2 -rotate-90 origin-center">
                        {i}
                      </div>
                      <div className="absolute right-0 top-0 h-px w-2 bg-gray-400"></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Paper Sheet */}
            <div 
              className="bg-white shadow-2xl border border-gray-300 relative"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Print Margins Guide */}
              {showMargins && (
                <div 
                  className="absolute border border-blue-300 border-dashed opacity-50"
                  style={{
                    top: `${(0.5 * scaledHeight) / 11}px`, // 0.5" margin
                    left: `${(0.5 * scaledWidth) / 8.5}px`, // 0.5" margin
                    right: `${(0.5 * scaledWidth) / 8.5}px`, // 0.5" margin
                    bottom: `${(0.5 * scaledHeight) / 11}px`, // 0.5" margin
                  }}
                />
              )}

              {/* Avery 5160 Labels */}
              <div 
                className="absolute"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left'
                }}
              >
                <Avery5160SheetPreview
                  labelData={labelData}
                  className="w-full h-full"
                />
              </div>

              {/* Paper Info Watermark */}
              <div className="absolute bottom-4 right-4 text-gray-300 text-xs font-mono opacity-50">
                US Letter • 8.5" × 11" • Portrait
              </div>
            </div>

            {/* Paper Shadow */}
            <div 
              className="absolute bg-gray-400 -z-10"
              style={{
                top: '4px',
                left: '4px',
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                opacity: 0.3
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Ready to print</span>
          <span>•</span>
          <span>Avery 5160 Compatible</span>
          <span>•</span>
          <span>30 labels per sheet</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Zoom: {zoom}%</span>
          <span>•</span>
          <span>{scaledWidth.toFixed(0)} × {scaledHeight.toFixed(0)} px</span>
        </div>
      </div>
    </div>
  );
}
