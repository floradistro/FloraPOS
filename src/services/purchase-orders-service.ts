/**
 * Purchase Orders Service
 * Handles purchase order operations for restock mode
 */

export interface PurchaseOrderItem {
  product_id: number;
  variation_id?: number;
  sku: string;
  product_name: string;
  quantity_ordered: number;
  unit_cost: number;
  line_total?: number;
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

export interface PurchaseOrdersResponse {
  success: boolean;
  data?: PurchaseOrder[];
  message?: string;
  error?: string;
}

export interface SuppliersResponse {
  success: boolean;
  data?: Supplier[];
  message?: string;
  error?: string;
}

export interface CreatePurchaseOrderResponse {
  success: boolean;
  data?: PurchaseOrder;
  message?: string;
  error?: string;
}

export class PurchaseOrdersService {
  private static baseUrl = '/api/proxy/flora-im';

  /**
   * Get all suppliers
   */
  static async getSuppliers(): Promise<SuppliersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers?status=active&_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const suppliers = await response.json();
      
      return {
        success: true,
        data: suppliers
      };
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get purchase orders
   */
  static async getPurchaseOrders(params?: {
    status?: string;
    supplier_id?: number;
    location_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrdersResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('_t', Date.now().toString());
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/purchase-orders?${searchParams.toString()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const pos = await response.json();
      
      return {
        success: true,
        data: pos
      };
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get single purchase order
   */
  static async getPurchaseOrder(id: number): Promise<CreatePurchaseOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-orders/${id}?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const po = await response.json();
      
      return {
        success: true,
        data: po
      };
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create purchase order
   */
  static async createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'po_number' | 'created_at'>): Promise<CreatePurchaseOrderResponse> {
    try {
      // TEMPORARY: Since Flora-IM API purchase orders endpoint returns 500,
      // we'll create a mock purchase order for now
      console.log('🔧 [TEMP] Creating mock purchase order due to Flora-IM API issue');
      
      // Generate a mock PO number
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      const mockPO: PurchaseOrder = {
        ...poData,
        id: Math.floor(Math.random() * 10000),
        po_number: poNumber,
        created_at: new Date().toISOString(),
        status: 'draft'
      };
      
      // Log the purchase order details for reference
      console.log('📦 Mock Purchase Order Created:', {
        po_number: mockPO.po_number,
        supplier_name: mockPO.supplier_name,
        total_amount: mockPO.total_amount,
        items_count: mockPO.items?.length || 0,
        notes: mockPO.notes
      });
      
      // Store in localStorage for persistence during development (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const existingPOs = JSON.parse(localStorage.getItem('mock_purchase_orders') || '[]');
          existingPOs.push(mockPO);
          localStorage.setItem('mock_purchase_orders', JSON.stringify(existingPOs));
          console.log('💾 Stored mock PO in localStorage');
        } catch (e) {
          console.warn('Failed to store mock PO in localStorage:', e);
        }
      }
      
      return {
        success: true,
        data: mockPO,
        message: `Purchase order ${poNumber} created successfully (mock)`
      };
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate purchase order from restock products
   */
  static async generatePurchaseOrderFromRestock(params: {
    products: RestockProduct[];
    supplier_id: number;
    location_id: number;
    po_name?: string;
    notes?: string;
  }): Promise<CreatePurchaseOrderResponse> {
    try {
      console.log(`🔍 [PO Service] Generating PO from ${params.products.length} restock products`);
      
      const response = await fetch(`${this.baseUrl}/purchase-orders/generate-from-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ [PO Service] Generated PO: ${result.data?.po_number}`);
      
      return result;
    } catch (error) {
      console.error('Failed to generate purchase order from restock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update purchase order status
   */
  static async updatePurchaseOrder(id: number, updates: Partial<PurchaseOrder>): Promise<CreatePurchaseOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('Failed to update purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel purchase order
   */
  static async cancelPurchaseOrder(id: number, reason?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('Failed to cancel purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Receive purchase order items
   */
  static async receivePurchaseOrder(id: number, items: Array<{
    item_id: number;
    quantity_received: number;
  }>): Promise<{ success: boolean; error?: string; message?: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('Failed to receive purchase order items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transform restock products to PO format
   */
  static transformRestockProductsToPOItems(products: RestockProduct[]): PurchaseOrderItem[] {
    return products.map(product => ({
      product_id: product.product_id,
      variation_id: product.variation_id || 0,
      sku: product.sku,
      product_name: product.name,
      quantity_ordered: product.restock_quantity,
      unit_cost: product.suggested_cost || 0,
      notes: `Restock from ${product.current_stock || 0} to ${(product.current_stock || 0) + product.restock_quantity}`
    }));
  }

  /**
   * Calculate PO totals
   */
  static calculatePOTotals(items: PurchaseOrderItem[], taxRate: number = 0, shippingCost: number = 0) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount + shippingCost;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      shipping_cost: parseFloat(shippingCost.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  }
}
