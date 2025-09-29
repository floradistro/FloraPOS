import jsPDF from 'jspdf';
import { AVERY_5160_TEMPLATE, AveryTemplate } from './averyTemplateService';

export interface Avery5160LabelData {
  line1: string;
  line2: string;
  line3: string;
}

export class Avery5160PdfService {
  private static convertInchesToPt(inches: number): number {
    return inches * 72; // 72 points per inch
  }

  public static async generatePDF(
    labelData: Avery5160LabelData[],
    template: AveryTemplate = AVERY_5160_TEMPLATE
  ): Promise<Blob> {
    try {
      console.log('Starting PDF generation with', labelData.length, 'labels');
      
      // Create PDF document with US Letter size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      console.log('PDF document created');

    // Convert template dimensions to points
    const pageWidth = this.convertInchesToPt(template.page.width);
    const pageHeight = this.convertInchesToPt(template.page.height);
    const marginTop = this.convertInchesToPt(template.page.margin_top);
    const marginLeft = this.convertInchesToPt(template.page.margin_left);
    const marginRight = this.convertInchesToPt(template.page.margin_right);
    const marginBottom = this.convertInchesToPt(template.page.margin_bottom);
    
    const labelWidth = this.convertInchesToPt(template.grid.label_width);
    const labelHeight = this.convertInchesToPt(template.grid.label_height);
    const horizontalPitch = this.convertInchesToPt(template.grid.horizontal_pitch);
    const verticalPitch = this.convertInchesToPt(template.grid.vertical_pitch);
    
    const safePaddingTop = this.convertInchesToPt(template.label_style.safe_padding.top);
    const safePaddingLeft = this.convertInchesToPt(template.label_style.safe_padding.left);
    const safePaddingRight = this.convertInchesToPt(template.label_style.safe_padding.right);
    const safePaddingBottom = this.convertInchesToPt(template.label_style.safe_padding.bottom);

    // Fill the sheet with labels (30 labels total)
    const totalLabels = template.data_mapping.records_per_page;
    const labelsToRender = [];
    
    console.log('Processing', totalLabels, 'total labels');
    
    for (let i = 0; i < totalLabels; i++) {
      if (i < labelData.length && labelData[i]) {
        labelsToRender.push(labelData[i]);
      } else {
        // Empty label
        labelsToRender.push({ line1: '', line2: '', line3: '' });
      }
    }
    
    console.log('Labels to render:', labelsToRender.length);

    // Set font
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(template.text_style.font_size_pt);
    pdf.setTextColor(0, 0, 0);

    // Draw labels
    console.log('Drawing labels with dimensions:', {
      marginTop, marginLeft, labelWidth, labelHeight, horizontalPitch, verticalPitch
    });
    
    for (let i = 0; i < labelsToRender.length; i++) {
      const label = labelsToRender[i];
      
      // Calculate position in grid using row-major order (3 columns, 10 rows)
      const row = Math.floor(i / template.grid.columns);
      const col = i % template.grid.columns;
      
      // Calculate label position using horizontal_pitch and vertical_pitch
      const labelX = marginLeft + (col * horizontalPitch);
      const labelY = marginTop + (row * verticalPitch);
      
      if (i < 3) {
        console.log(`Label ${i}: row=${row}, col=${col}, x=${labelX}, y=${labelY}`);
      }
      
      // Content area within the label (respecting safe padding)
      const contentX = labelX + safePaddingLeft;
      const contentY = labelY + safePaddingTop;
      const contentWidth = labelWidth - safePaddingLeft - safePaddingRight;
      const contentHeight = labelHeight - safePaddingTop - safePaddingBottom;

      // Draw label border (for debugging - always show for now)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(labelX, labelY, labelWidth, labelHeight);
      
      // Draw text box border (for debugging)
      const layoutBox = template.layout[0].box;
      const textBoxX = labelX + this.convertInchesToPt(layoutBox.x);
      const textBoxY = labelY + this.convertInchesToPt(layoutBox.y);
      const textBoxWidth = this.convertInchesToPt(layoutBox.width);
      const textBoxHeight = this.convertInchesToPt(layoutBox.height);
      
      pdf.setDrawColor(100, 100, 255);
      pdf.setLineWidth(0.25);
      pdf.rect(textBoxX, textBoxY, textBoxWidth, textBoxHeight);

      // Draw text content using the exact layout specification
      if (label.line1 || label.line2 || label.line3) {
        const lines = [label.line1, label.line2, label.line3].filter(line => line && line.trim() !== '');
        
        if (lines.length > 0) {
          const lineHeight = template.text_style.font_size_pt * template.text_style.line_height_em;
          
          // Position text according to vertical_align: "middle"
          const totalTextHeight = lines.length * lineHeight;
          let startY = textBoxY + (textBoxHeight - totalTextHeight) / 2 + lineHeight * 0.8;
          
          lines.forEach((line, lineIndex) => {
            if (line) {
              // Handle text alignment (left by default)
              let textX = textBoxX;
              if (template.text_style.align === 'center') {
                textX = textBoxX + textBoxWidth / 2;
              } else if (template.text_style.align === 'right') {
                textX = textBoxX + textBoxWidth;
              }
              
              // Ensure text fits within the text box width
              const textLines = pdf.splitTextToSize(line, textBoxWidth);
              
              textLines.forEach((textLine: string, textLineIndex: number) => {
                const currentY = startY + (lineIndex * lineHeight) + (textLineIndex * lineHeight);
                
                // Only draw if within the text box area and max_lines limit
                if (currentY <= textBoxY + textBoxHeight && lineIndex < 3) {
                  pdf.text(textLine, textX, currentY, {
                    align: template.text_style.align as 'left' | 'center' | 'right'
                  });
                }
              });
            }
          });
        }
      }
    }

      console.log('PDF generation completed');
      return pdf.output('blob');
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static downloadPDF(blob: Blob, filename: string = 'avery-5160-labels.pdf'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static async printPDF(blob: Blob): Promise<void> {
    try {
      const url = URL.createObjectURL(blob);
      
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.print();
          }
          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        } catch (error) {
          console.error('Print error:', error);
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }
      };
      
      iframe.src = url;
    } catch (error) {
      console.error('Failed to create print PDF:', error);
      throw error;
    }
  }
}
