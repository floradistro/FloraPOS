/**
 * Inventory Visibility Service
 * Centralized service for managing product visibility based on stock levels
 * Preserves existing instant refresh functionality while adding zero-stock filtering
 */

interface InventoryRecord {
  product_id: number;
  location_id: number;
  variation_id?: number;
  quantity: number;
}

interface Product {
  id: number;
  variation_id?: number;
  inventory?: Array<{
    location_id: number | string;
    stock: number;
    quantity?: number;
  }>;
  [key: string]: any;
}

export class InventoryVisibilityService {
  private static hideOutOfStock: boolean = true;
  private static auditModeOverride: boolean = false;

  /**
   * Set whether to hide out of stock products
   */
  static setHideOutOfStock(hide: boolean) {
    this.hideOutOfStock = hide;
  }

  /**
   * Set audit mode override (shows all products regardless of stock)
   */
  static setAuditMode(enabled: boolean) {
    this.auditModeOverride = enabled;
  }

  /**
   * Filter products by stock availability at specific location
   * Preserves all product data and doesn't interfere with refresh mechanisms
   */
  static filterProductsByStock<T extends Product>(
    products: T[],
    locationId: number | string,
    options: {
      includeZeroStock?: boolean;
      isAuditMode?: boolean;
      isRestockMode?: boolean;
    } = {}
  ): T[] {
    // Always show all products in audit or restock mode
    if (options.isAuditMode || options.isRestockMode || this.auditModeOverride) {
      return products;
    }

    // If explicitly requested to include zero stock, return all
    if (options.includeZeroStock || !this.hideOutOfStock) {
      return products;
    }

    const locationIdStr = locationId.toString();

    // Filter products that have stock > 0 at the specified location
    return products.filter(product => {
      // Check if product has inventory data
      if (!product.inventory || !Array.isArray(product.inventory)) {
        // No inventory data means we can't determine stock, so hide it
        return false;
      }

      // Find inventory for this specific location
      const locationInventory = product.inventory.find(inv => {
        const invLocationId = inv.location_id?.toString();
        return invLocationId === locationIdStr;
      });

      if (!locationInventory) {
        // No inventory record for this location means no stock
        return false;
      }

      // Check stock quantity (handle both 'stock' and 'quantity' fields)
      const stockQty = locationInventory.stock ?? locationInventory.quantity ?? 0;
      return stockQty > 0;
    });
  }

  /**
   * Check if a specific product has stock at a location
   * Used for individual product checks without filtering arrays
   */
  static hasStock(
    product: Product,
    locationId: number | string
  ): boolean {
    if (!product.inventory || !Array.isArray(product.inventory)) {
      return false;
    }

    const locationIdStr = locationId.toString();
    const locationInventory = product.inventory.find(inv => 
      inv.location_id?.toString() === locationIdStr
    );

    if (!locationInventory) {
      return false;
    }

    const stockQty = locationInventory.stock ?? locationInventory.quantity ?? 0;
    return stockQty > 0;
  }

  /**
   * Filter inventory records to only show items with stock
   * Used for direct inventory API responses
   */
  static filterInventoryRecords(
    inventory: InventoryRecord[],
    options: {
      includeZeroStock?: boolean;
      isAuditMode?: boolean;
    } = {}
  ): InventoryRecord[] {
    if (options.includeZeroStock || options.isAuditMode || !this.hideOutOfStock) {
      return inventory;
    }

    return inventory.filter(record => record.quantity > 0);
  }

  /**
   * Process products from API response and apply stock filtering
   * Maintains original data structure for compatibility
   */
  static async processApiProducts<T extends Product>(
    products: T[],
    locationId: number | string,
    options: {
      includeZeroStock?: boolean;
      isAuditMode?: boolean;
      isRestockMode?: boolean;
    } = {}
  ): Promise<T[]> {
    // Apply filtering while preserving all product properties
    return this.filterProductsByStock(products, locationId, options);
  }

  /**
   * Check if stock filtering is currently enabled
   */
  static isStockFilteringEnabled(): boolean {
    return this.hideOutOfStock && !this.auditModeOverride;
  }
}
