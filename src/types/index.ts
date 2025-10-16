/**
 * Centralized Type Definitions for POSV1
 * This file contains all shared interfaces and types used across the application
 */

// ====================
// CART TYPES
// ====================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  category?: string;
  product_id?: number;        // Parent product ID
  variation_id?: number;      // Variant ID (if this is a variant)
  is_variant?: boolean;       // Flag to identify variants
  is_adjustment?: boolean;    // Flag to identify adjustment items
  adjustment_amount?: number; // The adjustment amount (+/-)
  
  // Price override and discount fields
  override_price?: number;    // Manual price override (replaces original price)
  discount_percentage?: number; // Discount percentage to apply (0-100)
  
  // Pricing tier information
  pricing_tier?: {
    tier_label: string;       // e.g. "Bulk 10+ units"
    tier_rule_name: string;   // e.g. "Flower Wholesale Pricing"
    tier_price: number;       // The tier price per unit
    tier_quantity: number;    // The tier minimum quantity
    tier_category?: string;   // e.g. "flower", "gram"
    
    // Conversion ratio for unit calculations
    conversion_ratio?: {
      input_amount: number;   // e.g. 0.7
      input_unit: string;     // e.g. "g"
      output_amount: number;  // e.g. 1
      output_unit: string;    // e.g. "unit"
      description?: string;   // e.g. "Each unit sold deducts 0.7g from inventory"
    };
  };
}

// ====================
// USER TYPES
// ====================

export interface WordPressUser {
  id: number;
  username: string;
  name?: string;
  display_name?: string;
  email: string;
  roles: string[];
  location?: string;
  location_id?: string;
}

// ====================
// PRODUCT TYPES
// ====================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  regular_price: string;
  sale_price?: string;
  attributes: Record<string, string>;
  inventory: Array<{
    location_id: number;
    quantity: number;
  }>;
  total_stock: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  stock_status?: string;
  regular_price: string;
  sale_price?: string;
  image?: string;
  categories: Category[];
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
  meta_data?: Array<{
    id: number;
    key: string;
    value: any;
  }>;
  
  // V2 Fields structure (new)
  fields?: Array<{
    id: number;
    name: string;
    label: string;
    type: string;
    value: any;
    has_value: boolean;
    is_required: boolean;
    config?: any;
  }>;
  
  // Variant support
  has_variants?: boolean;
  variants?: ProductVariant[];
  parent_id?: number; // For variant products
  
  // UI state
  selected_quantity?: number;
  selected_price?: number;
  selected_category?: string;
  
  // Blueprint pricing
  blueprintPricing?: any;
}

// ====================
// LOCATION & TAX TYPES
// ====================

export interface LocationMapping {
  id: number;
  rate: number;
  name: string;
}

export interface TaxRate {
  rate: number;
  name: string;
  location: string;
}

// ====================
// ORDER TYPES
// ====================

export type PaymentMethod = 'cash' | 'card';

export interface OrderLineItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  total: string;
  sku: string;
  variation_id?: number;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

export interface TaxLine {
  rate_code: string;
  rate_id: string;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface OrderData {
  customer_id?: number;
  employee_id?: number;
  payment_method: PaymentMethod;
  payment_method_title: string;
  status: string;
  currency: string;
  line_items: OrderLineItem[];
  tax_lines: TaxLine[];
  billing: Address;
  shipping: Address;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
  pos_order: boolean;
  location_id: number;
  set_paid: boolean;
}

// ====================
// PURCHASE ORDER TYPES
// ====================

export interface PurchaseOrderItem {
  id?: number;
  product_id: number;
  variation_id?: number;
  sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  line_total?: number;
  tax_rate?: number;
  discount_amount?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id?: number;
  po_number?: string;
  supplier_id: number;
  location_id: number;
  status: 'draft' | 'pending' | 'partial' | 'completed' | 'cancelled';
  expected_date?: string;
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  notes?: string;
  created_by?: number;
  created_at?: string;
  received_date?: string;
  supplier_name?: string;
  location_name?: string;
  created_by_name?: string;
  items?: PurchaseOrderItem[];
}

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface RestockProduct {
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  restock_quantity: number;
  suggested_cost?: number;
  current_stock?: number;
  min_stock_level?: number;
}

// ====================
// VIEW TYPES
// ====================

export type ViewType = 'products' | 'adjustments' | 'customers' | 'orders' | 'blueprint-fields' | 'history' | 'menu' | 'ai-view' | 'cash';

// ====================
// API TYPES
// ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}
