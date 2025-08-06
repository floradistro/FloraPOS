// Common type definitions for Flora POS

// WooCommerce Meta Data
export interface WooMetaData {
  id: number
  key: string
  value: string | number | boolean | object
}

// Advanced Custom Fields (ACF)
export interface ACFField {
  key: string
  label: string
  value: string | number | boolean | object | null
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'date' | 'image' | 'file' | 'url' | 'email' | 'password' | 'wysiwyg' | 'oembed' | 'gallery' | 'repeater' | 'flexible_content' | 'group' | 'clone'
}

// Chart Data
export interface ChartDataPoint {
  name: string
  value: number
  label?: string
  color?: string
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Inventory Information
export interface InventoryInfo {
  product_id: number
  location_id: number
  location_name: string
  stock_quantity: number
  virtual_stock?: number
  reserved_stock?: number
  available_stock: number
}

// Shipping Line
export interface ShippingLine {
  id: number
  method_title: string
  method_id: string
  total: string
  total_tax: string
  taxes: Array<{
    id: number
    total: string
    subtotal: string
  }>
  meta_data: WooMetaData[]
}

// Staff Member
export interface StaffMember {
  id: number
  email: string
  first_name: string
  last_name: string
  display_name: string
  role: string
  allowed_stores: number[]
  pos_enabled: boolean
  capabilities: string[]
  avatar_url?: string
}

// Search Result
export interface SearchResult {
  type: 'product' | 'customer' | 'order'
  id: number
  title: string
  subtitle?: string
  description?: string
  image?: string
  data: any // This can be typed more specifically based on type
}

// ID Scanner Data
export interface IDScannerData {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
  expirationDate?: string
  isValid: boolean
  errors?: string[]
}

// Category Icon mapping
export interface CategoryIcon {
  icon: string
  color: string
  bgColor: string
}

// Quick Add Preference
export interface QuickAddPreference {
  key: string
  label: string
  value: string | number | boolean
  category: string
}