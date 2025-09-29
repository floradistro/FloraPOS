import React from 'react';
import { LabelData, AveryLabelSize, AVERY_LABEL_SIZES } from '@/services/averyLabelService';
import { QRCodeSVG } from 'qrcode.react';

interface AveryLabelTemplateProps {
  data: LabelData;
  labelSize: AveryLabelSize;
  includeLogo?: boolean;
  includeQRCode?: boolean;
  includeCustomer?: boolean;
  includeTimestamp?: boolean;
  logoUrl?: string;
  className?: string;
}

export function AveryLabelTemplate({
  data,
  labelSize,
  includeLogo = true,
  includeQRCode = true,
  includeCustomer = true,
  includeTimestamp = true,
  logoUrl,
  className = ''
}: AveryLabelTemplateProps) {
  const dimensions = AVERY_LABEL_SIZES[labelSize];
  
  // Convert inches to pixels for display (96 DPI)
  const labelWidth = dimensions.width * 96;
  const labelHeight = dimensions.height * 96;

  return (
    <div 
      className={`avery-label bg-white border border-gray-300 flex flex-col justify-between p-2 text-black overflow-hidden ${className}`}
      style={{
        width: `${labelWidth}px`,
        height: `${labelHeight}px`,
        fontSize: '8px',
        lineHeight: '1.2'
      }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {/* Customer Information */}
          {includeCustomer && data.customerName && (
            <div className="mb-1">
              <div className="font-bold text-xs truncate">{data.customerName}</div>
              {data.customerEmail && (
                <div className="text-xs text-gray-600 truncate">{data.customerEmail}</div>
              )}
              {data.customerPhone && (
                <div className="text-xs text-gray-600">{data.customerPhone}</div>
              )}
            </div>
          )}

          {/* Product Information */}
          {data.productName && (
            <div className="mb-1">
              <div className="font-semibold text-xs leading-tight">
                {data.productName.length > 40 
                  ? data.productName.substring(0, 40) + '...' 
                  : data.productName
                }
              </div>
              {data.productSku && (
                <div className="text-xs text-gray-600">SKU: {data.productSku}</div>
              )}
            </div>
          )}

          {/* Price and Quantity */}
          {(data.price || data.quantity) && (
            <div className="text-xs font-medium">
              {data.price && <span>Price: {data.price}</span>}
              {data.price && data.quantity && <span className="mx-1">|</span>}
              {data.quantity && <span>Qty: {data.quantity}</span>}
            </div>
          )}
        </div>

        {/* QR Code */}
        {includeQRCode && data.qrCode && (
          <div className="ml-2 flex-shrink-0">
            <QRCodeSVG
              value={data.qrCode}
              size={Math.min(labelHeight * 0.4, 32)}
              level="M"
              includeMargin={false}
            />
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-end">
        {/* Custom Text */}
        {data.customText && (
          <div className="text-xs text-gray-600 flex-1 min-w-0">
            {data.customText.length > 50 
              ? data.customText.substring(0, 50) + '...' 
              : data.customText
            }
          </div>
        )}

        {/* Logo */}
        {includeLogo && logoUrl && (
          <div className="ml-2 flex-shrink-0">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="max-h-4 max-w-8 object-contain"
            />
          </div>
        )}
      </div>

      {/* Timestamp */}
      {includeTimestamp && data.timestamp && (
        <div className="text-xs text-gray-400 text-right mt-1">
          {new Date(data.timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// Preview component for multiple labels
interface AveryLabelSheetPreviewProps {
  labelSize: AveryLabelSize;
  labelData: LabelData[];
  includeLogo?: boolean;
  includeQRCode?: boolean;
  includeCustomer?: boolean;
  includeTimestamp?: boolean;
  logoUrl?: string;
  className?: string;
}

export function AveryLabelSheetPreview({
  labelSize,
  labelData,
  includeLogo = true,
  includeQRCode = true,
  includeCustomer = true,
  includeTimestamp = true,
  logoUrl,
  className = ''
}: AveryLabelSheetPreviewProps) {
  const dimensions = AVERY_LABEL_SIZES[labelSize];
  const labelsPerPage = dimensions.columns * dimensions.rows;
  
  // Create array of labels to fill the sheet
  const labels = [];
  for (let i = 0; i < labelsPerPage; i++) {
    if (i < labelData.length) {
      labels.push(labelData[i]);
    } else {
      // Empty label placeholder
      labels.push({});
    }
  }

  return (
    <div 
      className={`avery-label-sheet bg-white shadow-lg ${className}`}
      style={{
        width: '8.5in',
        height: '11in',
        padding: `${dimensions.marginTop}in ${dimensions.marginRight}in ${dimensions.marginBottom}in ${dimensions.marginLeft}in`,
        display: 'grid',
        gridTemplateColumns: `repeat(${dimensions.columns}, 1fr)`,
        gridTemplateRows: `repeat(${dimensions.rows}, 1fr)`,
        gap: `${dimensions.gapY}in ${dimensions.gapX}in`
      }}
    >
      {labels.map((data, index) => (
        <AveryLabelTemplate
          key={index}
          data={data}
          labelSize={labelSize}
          includeLogo={includeLogo}
          includeQRCode={includeQRCode}
          includeCustomer={includeCustomer}
          includeTimestamp={includeTimestamp}
          logoUrl={logoUrl}
          className="border-dashed border-gray-300"
        />
      ))}
    </div>
  );
}

// Single label preview component for the print settings panel
interface AveryLabelPreviewProps {
  data: LabelData;
  labelSize: AveryLabelSize;
  includeLogo?: boolean;
  includeQRCode?: boolean;
  includeCustomer?: boolean;
  includeTimestamp?: boolean;
  logoUrl?: string;
  scale?: number;
}

export function AveryLabelPreview({
  data,
  labelSize,
  includeLogo = true,
  includeQRCode = true,
  includeCustomer = true,
  includeTimestamp = true,
  logoUrl,
  scale = 0.8
}: AveryLabelPreviewProps) {
  return (
    <div 
      className="avery-label-preview"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <AveryLabelTemplate
        data={data}
        labelSize={labelSize}
        includeLogo={includeLogo}
        includeQRCode={includeQRCode}
        includeCustomer={includeCustomer}
        includeTimestamp={includeTimestamp}
        logoUrl={logoUrl}
        className="shadow-md"
      />
    </div>
  );
}
