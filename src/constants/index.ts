/**
 * Centralized Constants for POSV1
 * This file contains all shared constants used across the application
 */

// Define LocationMapping type here to avoid circular imports
interface LocationMapping {
  id: number;
  rate: number;
  name: string;
}

// ====================
// LOCATION MAPPINGS
// ====================

export const LOCATION_MAPPINGS: Record<string, LocationMapping> = {
  'Charlotte Monroe': { id: 19, rate: 0.0875, name: 'NC Sales Tax + Local' },
  'Charlotte Central': { id: 20, rate: 0.0875, name: 'NC Sales Tax + Local' },
  'Blowing Rock': { id: 21, rate: 0.085, name: 'NC Sales Tax + Local' },
  'Warehouse': { id: 23, rate: 0.08, name: 'NC Sales Tax' },
  'Main Location': { id: 25, rate: 0.08, name: 'Sales Tax' },
  'Default': { id: 25, rate: 0.08, name: 'Sales Tax' }
};

// ====================
// TAX RATES
// ====================

export const DEFAULT_TAX_RATE = 0.08;
export const DEFAULT_TAX_NAME = 'Sales Tax';
export const DEFAULT_LOCATION_ID = 25;

// ====================
// UI CONSTANTS
// ====================

export const DEBOUNCE_DELAYS = {
  PRODUCT_SEARCH: 300,  // milliseconds
  CUSTOMER_SEARCH: 500, // milliseconds
} as const;

export const CACHE_TIMES = {
  CATEGORIES: 10 * 1000,            // 10 seconds (was 2 hours) - DEV MODE
  LOCATIONS: 10 * 1000,             // 10 seconds (was 4 hours) - DEV MODE
  TAX_RATES: 10 * 1000,             // 10 seconds (was 24 hours) - DEV MODE
  BLUEPRINT_ASSIGNMENTS: 5 * 1000,  // 5 seconds (was 30 minutes) - DEV MODE
  PRODUCTS: 1 * 1000,               // 1 second (was 5 minutes) - DEV MODE
  CUSTOMERS: 5 * 1000,              // 5 seconds (was 15 minutes) - DEV MODE
} as const;

export const FOCUS_REFRESH_THROTTLE = 30000; // 30 seconds

// iOS-style stock level indicators
export const STOCK_LEVELS = {
  HIGH: 50,       // Green - healthy stock
  MEDIUM: 20,     // Yellow - low stock warning
  LOW: 10,        // Orange - critical stock
  OUT: 0,         // Red - out of stock
} as const;

export const STOCK_COLORS = {
  HIGH: 'text-white',
  MEDIUM: 'text-neutral-400',
  LOW: 'text-neutral-500',
  OUT: 'text-neutral-600',
} as const;

// ====================
// ORDER CONSTANTS
// ====================

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
} as const;

// ====================
// CATEGORY DISPLAY NAMES
// ====================

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  flower: 'Flower',
  preroll: 'Pre-Roll',
  gram: 'Grams',
  eighth: 'Eighth',
  // Add more as needed
};

// ====================
// API ENDPOINTS
// ====================

export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  PRODUCTS: '/api/proxy/flora-im/products',
  CUSTOMERS: '/api/users-matrix/customers',
  INVENTORY: '/api/proxy/flora-im/inventory',
  CATEGORIES: '/api/categories',
  PRICING: {
    BATCH_BLUEPRINT: '/api/pricing/batch-blueprint',
  },
} as const;

// ====================
// GRID LAYOUT
// ====================

export const GRID_CONFIG = {
  PRODUCT_GRID_COLS: 3,
  CART_WIDTH: 320, // pixels
} as const;

// ====================
// VALIDATION
// ====================

export const VALIDATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 99999.99,
} as const;
