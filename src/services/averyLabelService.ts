import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Avery label dimensions in inches
export const AVERY_LABEL_SIZES = {
  '5160': { // 30 labels per sheet, 3 columns, 10 rows
    width: 2.625,
    height: 1.0,
    marginTop: 0.5,
    marginLeft: 0.1875,
    marginRight: 0.1875,
    marginBottom: 0.5,
    columns: 3,
    rows: 10,
    gapX: 0.125, // horizontal_pitch - label_width = 2.75 - 2.625 = 0.125
    gapY: 0      // vertical_pitch - label_height = 1.0 - 1.0 = 0
  },
  '5161': { // 20 labels per sheet, 2 columns, 10 rows
    width: 4,
    height: 1,
    marginTop: 0.5,
    marginLeft: 0.15625,
    marginRight: 0.15625,
    marginBottom: 0.5,
    columns: 2,
    rows: 10,
    gapX: 0.1875,
    gapY: 0
  },
  '5162': { // 14 labels per sheet, 2 columns, 7 rows
    width: 4,
    height: 1.33,
    marginTop: 0.83,
    marginLeft: 0.15625,
    marginRight: 0.15625,
    marginBottom: 0.83,
    columns: 2,
    rows: 7,
    gapX: 0.1875,
    gapY: 0
  },
  '5163': { // 10 labels per sheet, 2 columns, 5 rows
    width: 4,
    height: 2,
    marginTop: 0.5,
    marginLeft: 0.15625,
    marginRight: 0.15625,
    marginBottom: 0.5,
    columns: 2,
    rows: 5,
    gapX: 0.1875,
    gapY: 0
  },
  '5164': { // 6 labels per sheet, 2 columns, 3 rows
    width: 4,
    height: 3.33,
    marginTop: 0.5,
    marginLeft: 0.15625,
    marginRight: 0.15625,
    marginBottom: 0.5,
    columns: 2,
    rows: 3,
    gapX: 0.1875,
    gapY: 0
  }
} as const;

export type AveryLabelSize = keyof typeof AVERY_LABEL_SIZES;

export interface LabelData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  productName?: string;
  productSku?: string;
  qrCode?: string;
  logoUrl?: string;
  timestamp?: string;
  customText?: string;
  price?: string;
  quantity?: string;
}

export interface AveryLabelOptions {
  labelSize: AveryLabelSize;
  data: LabelData[];
  includeLogo?: boolean;
  includeQRCode?: boolean;
  includeCustomer?: boolean;
  includeTimestamp?: boolean;
  customCss?: string;
}

export class AveryLabelService {
  private static convertInchesToPt(inches: number): number {
    return inches * 72; // 72 points per inch
  }

  private static convertInchesToPx(inches: number, dpi: number = 96): number {
    return inches * dpi;
  }

  public static async generateLabelPDF(options: AveryLabelOptions): Promise<Blob> {
    const { labelSize, data, includeLogo = true, includeQRCode = true, includeCustomer = true, includeTimestamp = true } = options;
    const dimensions = AVERY_LABEL_SIZES[labelSize];
    
    // Create PDF document (8.5 x 11 inches)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    const pageWidth = 8.5 * 72; // 612 pt
    const pageHeight = 11 * 72; // 792 pt

    // Convert dimensions to points
    const labelWidth = this.convertInchesToPt(dimensions.width);
    const labelHeight = this.convertInchesToPt(dimensions.height);
    const marginTop = this.convertInchesToPt(dimensions.marginTop);
    const marginLeft = this.convertInchesToPt(dimensions.marginLeft);
    const gapX = this.convertInchesToPt(dimensions.gapX);
    const gapY = this.convertInchesToPt(dimensions.gapY);

    // Process labels in batches to fit on pages
    const labelsPerPage = dimensions.columns * dimensions.rows;
    let currentPage = 0;
    
    for (let i = 0; i < data.length; i++) {
      const labelData = data[i];
      const pageIndex = Math.floor(i / labelsPerPage);
      const labelIndex = i % labelsPerPage;
      
      // Add new page if needed
      if (pageIndex > currentPage) {
        pdf.addPage();
        currentPage = pageIndex;
      }

      // Calculate label position
      const row = Math.floor(labelIndex / dimensions.columns);
      const col = labelIndex % dimensions.columns;
      
      const x = marginLeft + col * (labelWidth + gapX);
      const y = marginTop + row * (labelHeight + gapY);

      // Draw label border (for debugging - remove in production)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, labelWidth, labelHeight);

      // Add label content
      await this.drawLabelContent(pdf, labelData, x, y, labelWidth, labelHeight, {
        includeLogo,
        includeQRCode,
        includeCustomer,
        includeTimestamp
      });
    }

    return pdf.output('blob');
  }

  private static async drawLabelContent(
    pdf: jsPDF,
    data: LabelData,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      includeLogo: boolean;
      includeQRCode: boolean;
      includeCustomer: boolean;
      includeTimestamp: boolean;
    }
  ): Promise<void> {
    const padding = 8;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    let currentY = contentY;
    const lineHeight = 12;

    // Set font
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    // Customer information
    if (options.includeCustomer && data.customerName) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.customerName, contentX, currentY);
      currentY += lineHeight;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      if (data.customerEmail) {
        pdf.text(data.customerEmail, contentX, currentY);
        currentY += lineHeight;
      }
      
      if (data.customerPhone) {
        pdf.text(data.customerPhone, contentX, currentY);
        currentY += lineHeight;
      }
    }

    // Product information
    if (data.productName) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const productLines = pdf.splitTextToSize(data.productName, contentWidth);
      pdf.text(productLines, contentX, currentY);
      currentY += lineHeight * productLines.length;
    }

    if (data.productSku) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`SKU: ${data.productSku}`, contentX, currentY);
      currentY += lineHeight;
    }

    // Price and quantity
    if (data.price || data.quantity) {
      let priceText = '';
      if (data.price) priceText += `Price: ${data.price}`;
      if (data.quantity) priceText += (priceText ? ' | ' : '') + `Qty: ${data.quantity}`;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(priceText, contentX, currentY);
      currentY += lineHeight;
    }

    // Custom text
    if (data.customText) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const customLines = pdf.splitTextToSize(data.customText, contentWidth);
      pdf.text(customLines, contentX, currentY);
      currentY += lineHeight * customLines.length;
    }

    // Timestamp
    if (options.includeTimestamp && data.timestamp) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(data.timestamp, contentX, y + height - padding);
    }

    // QR Code placeholder (would need QR code generation library)
    if (options.includeQRCode && data.qrCode) {
      const qrSize = 20;
      const qrX = x + width - qrSize - padding;
      const qrY = y + padding;
      
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(qrX, qrY, qrSize, qrSize);
      
      pdf.setFontSize(6);
      pdf.setTextColor(0, 0, 0);
      pdf.text('QR', qrX + 6, qrY + 12);
    }
  }

  public static async generateLabelFromHTML(
    htmlElement: HTMLElement,
    labelSize: AveryLabelSize,
    copies: number = 1
  ): Promise<Blob> {
    const dimensions = AVERY_LABEL_SIZES[labelSize];
    
    // Create canvas from HTML element
    const canvas = await html2canvas(htmlElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    const labelWidth = this.convertInchesToPt(dimensions.width);
    const labelHeight = this.convertInchesToPt(dimensions.height);
    const marginTop = this.convertInchesToPt(dimensions.marginTop);
    const marginLeft = this.convertInchesToPt(dimensions.marginLeft);
    const gapX = this.convertInchesToPt(dimensions.gapX);
    const gapY = this.convertInchesToPt(dimensions.gapY);

    const labelsPerPage = dimensions.columns * dimensions.rows;
    let currentPage = 0;

    for (let i = 0; i < copies; i++) {
      const pageIndex = Math.floor(i / labelsPerPage);
      const labelIndex = i % labelsPerPage;
      
      if (pageIndex > currentPage) {
        pdf.addPage();
        currentPage = pageIndex;
      }

      const row = Math.floor(labelIndex / dimensions.columns);
      const col = labelIndex % dimensions.columns;
      
      const x = marginLeft + col * (labelWidth + gapX);
      const y = marginTop + row * (labelHeight + gapY);

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, labelWidth, labelHeight);
    }

    return pdf.output('blob');
  }

  public static downloadPDF(blob: Blob, filename: string = 'avery-labels.pdf'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
