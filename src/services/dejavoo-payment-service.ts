/**
 * Dejavoo Payment Service
 * Processes payments through Dejavoo WizarPOS QZ terminals
 */

import type { 
  PaymentTransaction,
  PaymentResult,
  TransactionApiResponse
} from '@/types/terminal';

class DejavooPaymentService {
  private baseUrl = '/api/proxy/flora-im';

  private getApiEnvironment(): string {
    const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'staging';
    if (typeof window === 'undefined') return DEFAULT_ENV;
    return localStorage.getItem('flora_pos_api_environment') || DEFAULT_ENV;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-environment': this.getApiEnvironment(),
      'Cache-Control': 'no-cache'
    };
  }

  private buildUrl(endpoint: string): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    url.searchParams.append('_t', Date.now().toString());
    return url.toString();
  }

  /**
   * Process sale transaction
   */
  async processSale(params: {
    terminal_id: number;
    amount: number;
    pos_order_id?: number;
    woocommerce_order_id?: number;
    invoice_number?: string;
  }): Promise<PaymentResult> {
    try {
      console.log('💳 Processing sale:', params);
      
      const url = this.buildUrl('/payment/sale');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Sale failed:', errorText);
        throw new Error(`Payment failed: ${errorText}`);
      }

      const result: PaymentResult = await response.json();
      
      if (result.success) {
        console.log('✅ Sale approved:', result);
      } else {
        console.error('❌ Sale declined:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error processing sale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Void transaction (same-day cancellation)
   */
  async voidTransaction(terminalId: number, transactionRef: string): Promise<PaymentResult> {
    try {
      console.log('🚫 Voiding transaction:', transactionRef);
      
      const url = this.buildUrl('/payment/void');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          terminal_id: terminalId,
          transaction_ref: transactionRef
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Void failed: ${errorText}`);
      }

      const result: PaymentResult = await response.json();
      
      if (result.success) {
        console.log('✅ Transaction voided:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error voiding transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process return/refund
   */
  async processReturn(params: {
    terminal_id: number;
    amount: number;
    ref_id?: string; // Original transaction ref for linked refund
  }): Promise<PaymentResult> {
    try {
      console.log('↩️ Processing return:', params);
      
      const url = this.buildUrl('/payment/return');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Return failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Return processed:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error processing return:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Adjust tip on existing transaction
   */
  async adjustTip(params: {
    terminal_id: number;
    transaction_ref: string;
    tip_amount: number;
  }): Promise<PaymentResult> {
    try {
      console.log('💰 Adjusting tip:', params);
      
      const url = this.buildUrl('/payment/tip-adjust');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tip adjust failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Tip adjusted:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error adjusting tip:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionRef: string): Promise<PaymentTransaction | null> {
    try {
      const url = this.buildUrl(`/payment/status/${transactionRef}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${response.statusText}`);
      }

      const result: TransactionApiResponse = await response.json();

      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: number): Promise<PaymentTransaction | null> {
    try {
      const url = this.buildUrl(`/payment/transactions/${transactionId}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get transaction: ${response.statusText}`);
      }

      const result: TransactionApiResponse = await response.json();

      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error(`Error getting transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions for order
   */
  async getOrderTransactions(params: {
    pos_order_id?: number;
    woocommerce_order_id?: number;
  }): Promise<PaymentTransaction[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.pos_order_id) queryParams.append('pos_order_id', params.pos_order_id.toString());
      if (params.woocommerce_order_id) queryParams.append('woocommerce_order_id', params.woocommerce_order_id.toString());

      const url = this.buildUrl(`/payment/order-transactions?${queryParams.toString()}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get order transactions: ${response.statusText}`);
      }

      const result: TransactionApiResponse = await response.json();

      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error getting order transactions:', error);
      throw error;
    }
  }

  /**
   * Abort current transaction
   */
  async abortTransaction(terminalId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('⛔ Aborting transaction on terminal:', terminalId);
      
      const url = this.buildUrl('/payment/abort');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ terminal_id: terminalId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Abort failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Transaction aborted');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error aborting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ====================
  // GIFT CARD OPERATIONS
  // ====================

  /**
   * Activate gift card
   */
  async giftActivate(terminalId: number, amount: number): Promise<PaymentResult> {
    return this.giftOperation(terminalId, 'activate', amount);
  }

  /**
   * Reload/add value to gift card
   */
  async giftReload(terminalId: number, amount: number): Promise<PaymentResult> {
    return this.giftOperation(terminalId, 'reload', amount);
  }

  /**
   * Redeem/use gift card
   */
  async giftRedeem(terminalId: number, amount: number): Promise<PaymentResult> {
    return this.giftOperation(terminalId, 'redeem', amount);
  }

  /**
   * Gift card balance inquiry
   */
  async giftInquiry(terminalId: number): Promise<PaymentResult> {
    return this.giftOperation(terminalId, 'inquiry', 0);
  }

  /**
   * Generic gift card operation handler
   */
  private async giftOperation(terminalId: number, operation: string, amount: number): Promise<PaymentResult> {
    try {
      console.log(`🎁 Gift card ${operation}:`, { terminalId, amount });
      
      const url = this.buildUrl(`/payment/gift/${operation}`);
      
      const body: any = { terminal_id: terminalId };
      if (operation !== 'inquiry') {
        body.amount = amount;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gift ${operation} failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Gift ${operation} successful:`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error in gift ${operation}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const dejavooPaymentService = new DejavooPaymentService();

