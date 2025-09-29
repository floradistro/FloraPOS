export interface AveryTemplateField {
  name: string;
  type: 'text' | 'image' | 'qrcode';
  required: boolean;
  max_length?: number;
}

export interface AveryTemplateLayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AveryTemplateLayout {
  type: 'text_block' | 'image' | 'qrcode';
  binding: string[];
  join_with?: string;
  box: AveryTemplateLayoutBox;
  style_overrides?: {
    line_break?: 'auto' | 'manual';
    max_lines?: number;
    font_family?: string;
    font_size_pt?: number;
    align?: 'left' | 'center' | 'right';
    vertical_align?: 'top' | 'middle' | 'bottom';
  };
}

export interface AveryTemplate {
  template_name: string;
  description: string;
  units: 'in' | 'mm' | 'pt';
  page: {
    size: 'letter' | 'a4';
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
    origin: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  label_style: {
    safe_padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    corner_radius: number;
    background: string;
    border: {
      enabled: boolean;
      width?: number;
      color?: string;
    };
  };
  text_style: {
    font_family: string;
    font_size_pt: number;
    line_height_em: number;
    color: string;
    align: 'left' | 'center' | 'right';
    vertical_align: 'top' | 'middle' | 'bottom';
    overflow: 'clip' | 'shrink-to-fit' | 'wrap';
  };
  fields: AveryTemplateField[];
  layout: AveryTemplateLayout[];
  data_mapping: {
    records_per_page: number;
    fill_order: 'row-major' | 'column-major';
  };
  sample_data: Record<string, string>[];
}

// Avery 5160 Template - 30-up address labels
export const AVERY_5160_TEMPLATE: AveryTemplate = {
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
    safe_padding: { top: 0.125, right: 0.125, bottom: 0.125, left: 0.125 },
    corner_radius: 0.0625,
    background: "none",
    border: { enabled: false }
  },
  text_style: {
    font_family: "Helvetica",
    font_size_pt: 10,
    line_height_em: 1.15,
    color: "#000000",
    align: "left",
    vertical_align: "middle",
    overflow: "shrink-to-fit"
  },
  fields: [
    {
      name: "line1",
      type: "text",
      required: true,
      max_length: 48
    },
    {
      name: "line2",
      type: "text",
      required: false,
      max_length: 48
    },
    {
      name: "line3",
      type: "text",
      required: false,
      max_length: 48
    }
  ],
  layout: [
    {
      type: "text_block",
      binding: ["line1", "line2", "line3"],
      join_with: "\n",
      box: {
        x: 0.125,
        y: 0.125,
        width: 2.375, // 2.625 - 0.125 - 0.125
        height: 0.75  // 1.0 - 0.125 - 0.125
      },
      style_overrides: {
        line_break: "auto",
        max_lines: 3
      }
    }
  ],
  data_mapping: {
    records_per_page: 30,
    fill_order: "row-major"
  },
  sample_data: [
    { line1: "Flora Distro", line2: "1234 Market St", line3: "Charlotte, NC 28202" },
    { line1: "Attn: Fulfillment", line2: "555 Warehouse Rd", line3: "Salisbury, NC 28144" }
  ]
};

// Available templates registry
export const AVAILABLE_TEMPLATES: Record<string, AveryTemplate> = {
  'Avery_5160_30up': AVERY_5160_TEMPLATE
};

export class AveryTemplateService {
  public static getTemplate(templateName: string): AveryTemplate | null {
    return AVAILABLE_TEMPLATES[templateName] || null;
  }

  public static getAvailableTemplates(): AveryTemplate[] {
    return Object.values(AVAILABLE_TEMPLATES);
  }

  public static convertToPixels(value: number, unit: string, dpi: number = 96): number {
    switch (unit) {
      case 'in':
        return value * dpi;
      case 'mm':
        return (value / 25.4) * dpi;
      case 'pt':
        return (value / 72) * dpi;
      default:
        return value;
    }
  }

  public static convertToPoints(value: number, unit: string): number {
    switch (unit) {
      case 'in':
        return value * 72;
      case 'mm':
        return (value / 25.4) * 72;
      case 'pt':
        return value;
      default:
        return value;
    }
  }

  public static generateLabelData(template: AveryTemplate, records: Record<string, any>[]): Record<string, string>[] {
    return records.map(record => {
      const labelData: Record<string, string> = {};
      
      template.fields.forEach(field => {
        const value = record[field.name] || '';
        if (field.max_length && value.length > field.max_length) {
          labelData[field.name] = value.substring(0, field.max_length);
        } else {
          labelData[field.name] = value;
        }
      });
      
      return labelData;
    });
  }

  public static validateLabelData(template: AveryTemplate, data: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    template.fields.forEach(field => {
      if (field.required && (!data[field.name] || data[field.name].trim() === '')) {
        errors.push(`Field '${field.name}' is required`);
      }
      
      if (field.max_length && data[field.name] && data[field.name].length > field.max_length) {
        errors.push(`Field '${field.name}' exceeds maximum length of ${field.max_length} characters`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
