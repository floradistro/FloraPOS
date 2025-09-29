import React from 'react';
import { AveryTemplate, AveryTemplateService, AVERY_5160_TEMPLATE } from '@/services/averyTemplateService';

interface Avery5160LabelProps {
  data: Record<string, string>;
  template?: AveryTemplate;
  className?: string;
  style?: React.CSSProperties;
}

export function Avery5160Label({
  data,
  template = AVERY_5160_TEMPLATE,
  className = '',
  style = {}
}: Avery5160LabelProps) {
  // Determine DPI from style or use default
  const currentDPI = style.fontSize ? 150 : 96; // If fontSize is set in style, we're in high-DPI mode
  
  // Convert template dimensions to pixels for display
  const labelWidth = AveryTemplateService.convertToPixels(template.grid.label_width, template.units, currentDPI);
  const labelHeight = AveryTemplateService.convertToPixels(template.grid.label_height, template.units, currentDPI);
  
  // Use the exact layout box from template specification
  const layoutBox = template.layout[0].box;
  const contentX = AveryTemplateService.convertToPixels(layoutBox.x, template.units, currentDPI);
  const contentY = AveryTemplateService.convertToPixels(layoutBox.y, template.units, currentDPI);
  const contentWidth = AveryTemplateService.convertToPixels(layoutBox.width, template.units, currentDPI);
  const contentHeight = AveryTemplateService.convertToPixels(layoutBox.height, template.units, currentDPI);

  // Get text content from layout
  const textLayout = template.layout.find(layout => layout.type === 'text_block');
  const textLines = textLayout ? textLayout.binding.map(field => data[field] || '').filter(line => line.trim() !== '') : [];
  const textContent = textLines.join(textLayout?.join_with || '\n');

  return (
    <div 
      className={`avery-5160-label bg-white border border-gray-200 relative overflow-hidden ${className}`}
      style={{
        width: `${labelWidth}px`,
        height: `${labelHeight}px`,
        borderRadius: template.label_style.corner_radius > 0 ? 
          `${AveryTemplateService.convertToPixels(template.label_style.corner_radius, template.units)}px` : '0',
        ...style
      }}
    >
      {/* Content area */}
      <div
        className="absolute flex flex-col justify-center"
        style={{
          left: `${contentX}px`,
          top: `${contentY}px`,
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          fontSize: style.fontSize || `${template.text_style.font_size_pt * (currentDPI / 96)}px`,
          fontFamily: template.text_style.font_family,
          lineHeight: template.text_style.line_height_em,
          color: template.text_style.color,
          textAlign: template.text_style.align as 'left' | 'center' | 'right'
        }}
      >
        {/* Render text content */}
        {textContent && (
          <div className="whitespace-pre-line break-words">
            {textContent}
          </div>
        )}
      </div>
    </div>
  );
}

interface Avery5160SheetPreviewProps {
  labelData: Record<string, string>[];
  template?: AveryTemplate;
  className?: string;
}

export function Avery5160SheetPreview({
  labelData,
  template = AVERY_5160_TEMPLATE,
  className = ''
}: Avery5160SheetPreviewProps) {
  // Convert page dimensions to pixels (using higher DPI for more accurate preview)
  const previewDPI = 150; // Higher DPI for better preview quality
  const pageWidth = AveryTemplateService.convertToPixels(template.page.width, template.units, previewDPI);
  const pageHeight = AveryTemplateService.convertToPixels(template.page.height, template.units, previewDPI);
  
  // Convert margins to pixels
  const marginTop = AveryTemplateService.convertToPixels(template.page.margin_top, template.units, previewDPI);
  const marginLeft = AveryTemplateService.convertToPixels(template.page.margin_left, template.units, previewDPI);
  const marginRight = AveryTemplateService.convertToPixels(template.page.margin_right, template.units, previewDPI);
  const marginBottom = AveryTemplateService.convertToPixels(template.page.margin_bottom, template.units, previewDPI);
  
  // Convert label dimensions to pixels
  const labelWidth = AveryTemplateService.convertToPixels(template.grid.label_width, template.units, previewDPI);
  const labelHeight = AveryTemplateService.convertToPixels(template.grid.label_height, template.units, previewDPI);
  
  // Calculate gaps between labels using horizontal_pitch and vertical_pitch
  const horizontalPitch = AveryTemplateService.convertToPixels(template.grid.horizontal_pitch, template.units, previewDPI);
  const verticalPitch = AveryTemplateService.convertToPixels(template.grid.vertical_pitch, template.units, previewDPI);
  const horizontalGap = horizontalPitch - labelWidth;
  const verticalGap = verticalPitch - labelHeight;

  // Create array of labels to fill the sheet
  const labels = [];
  const totalLabels = template.data_mapping.records_per_page;
  
  for (let i = 0; i < totalLabels; i++) {
    if (i < labelData.length && labelData[i] && Object.keys(labelData[i]).length > 0) {
      labels.push(labelData[i]);
    } else {
      // Show actual data in first few labels, then empty placeholders
      if (i < 3 && labelData[0]) {
        labels.push({
          line1: labelData[0]?.line1 || 'Flora Distro',
          line2: labelData[0]?.line2 || 'Sample Product',
          line3: labelData[0]?.line3 || 'SKU: 12345'
        });
      } else {
        // Empty label placeholder
        labels.push({
          line1: '',
          line2: '',
          line3: ''
        });
      }
    }
  }

  return (
    <div className={`avery-5160-sheet-container ${className}`}>
      {/* PDF-like page with shadow and border */}
      <div 
        className="avery-5160-sheet bg-white shadow-2xl border border-gray-300 relative mx-auto"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '2px'
        }}
      >
        {/* Page margins visualization */}
        <div 
          className="absolute border border-blue-200 border-dashed opacity-30"
          style={{
            top: `${marginTop}px`,
            left: `${marginLeft}px`,
            right: `${marginRight}px`,
            bottom: `${marginBottom}px`,
          }}
        />
        
        {/* Label grid container */}
        <div
          className="absolute"
          style={{
            top: `${marginTop}px`,
            left: `${marginLeft}px`,
            width: `${pageWidth - marginLeft - marginRight}px`,
            height: `${pageHeight - marginTop - marginBottom}px`,
          }}
        >
          {labels.map((data, index) => {
            // Calculate position using row-major order (left to right, top to bottom)
            const row = Math.floor(index / template.grid.columns);
            const col = index % template.grid.columns;
            
            // Calculate exact position using horizontal_pitch and vertical_pitch
            const labelX = col * horizontalPitch;
            const labelY = row * verticalPitch;
            
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${labelX}px`,
                  top: `${labelY}px`,
                  width: `${labelWidth}px`,
                  height: `${labelHeight}px`,
                }}
              >
                <Avery5160Label
                  data={data}
                  template={template}
                  className={`border border-gray-200 ${index === 0 ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200'}`}
                  style={{
                    fontSize: `${template.text_style.font_size_pt * (previewDPI / 96)}px`,
                    width: '100%',
                    height: '100%'
                  }}
                />
                {/* Label number for reference */}
                <div 
                  className="absolute -top-3 -left-1 text-xs text-gray-400 font-mono"
                  style={{ fontSize: '8px' }}
                >
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Corner registration marks (like real Avery sheets) */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-300"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-300"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-300"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-300"></div>
      </div>
      
      {/* Sheet information - only show when not in industry preview */}
      {!className.includes('industry-preview') && (
        <div className="mt-3 text-center">
          <div className="text-xs text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded-lg border">
            📄 Avery 5160 Compatible • 8.5" × 11" US Letter • 30 Labels (3×10)
          </div>
          <div className="text-xs text-gray-500 mt-2 flex justify-center items-center gap-4">
            <span>📏 Each label: 2.625" × 1.000"</span>
            <span>🔍 Preview: {Math.round((previewDPI / 96) * 100)}% scale</span>
          </div>
          <div className="text-xs text-blue-600 mt-1 font-medium">
            ✓ Ready for printing • Precise dimensions • Professional layout
          </div>
        </div>
      )}
    </div>
  );
}

// Scalable preview for print settings panel
interface Avery5160PreviewProps {
  labelData: Record<string, string>[];
  template?: AveryTemplate;
  scale?: number;
  className?: string;
}

export function Avery5160Preview({
  labelData,
  template = AVERY_5160_TEMPLATE,
  scale = 0.3,
  className = ''
}: Avery5160PreviewProps) {
  return (
    <div 
      className={`avery-5160-preview ${className}`}
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'top left',
        width: 'fit-content'
      }}
    >
      <Avery5160SheetPreview
        labelData={labelData}
        template={template}
        className="shadow-md border border-gray-300"
      />
    </div>
  );
}
