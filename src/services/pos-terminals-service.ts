/**
 * POS Terminals Service
 * Manages Dejavoo WizarPOS QZ terminals
 */

import type { 
  POSTerminal, 
  CreateTerminalForm, 
  UpdateTerminalForm,
  TerminalApiResponse 
} from '@/types/terminal';

class POSTerminalsService {
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
   * Get all terminals
   */
  async getTerminals(params?: {
    location_id?: number;
    status?: string;
    active_only?: boolean;
  }): Promise<POSTerminal[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.location_id) queryParams.append('location_id', params.location_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.active_only) queryParams.append('active_only', 'true');

      const url = this.buildUrl(`/pos-terminals?${queryParams.toString()}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch terminals: ${response.statusText}`);
      }

      const result: TerminalApiResponse = await response.json();

      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching terminals:', error);
      throw error;
    }
  }

  /**
   * Get single terminal
   */
  async getTerminal(terminalId: number): Promise<POSTerminal | null> {
    try {
      const url = this.buildUrl(`/pos-terminals/${terminalId}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch terminal: ${response.statusText}`);
      }

      const result: TerminalApiResponse = await response.json();

      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching terminal ${terminalId}:`, error);
      throw error;
    }
  }

  /**
   * Create terminal
   */
  async createTerminal(data: CreateTerminalForm): Promise<POSTerminal> {
    try {
      const url = this.buildUrl('/pos-terminals');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create terminal: ${errorText}`);
      }

      const result: TerminalApiResponse = await response.json();

      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to create terminal');
    } catch (error) {
      console.error('Error creating terminal:', error);
      throw error;
    }
  }

  /**
   * Update terminal
   */
  async updateTerminal(terminalId: number, data: UpdateTerminalForm): Promise<POSTerminal> {
    try {
      const url = this.buildUrl(`/pos-terminals/${terminalId}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update terminal: ${errorText}`);
      }

      const result: TerminalApiResponse = await response.json();

      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to update terminal');
    } catch (error) {
      console.error(`Error updating terminal ${terminalId}:`, error);
      throw error;
    }
  }

  /**
   * Delete terminal
   */
  async deleteTerminal(terminalId: number): Promise<void> {
    try {
      const url = this.buildUrl(`/pos-terminals/${terminalId}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete terminal: ${errorText}`);
      }

      const result: TerminalApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete terminal');
      }
    } catch (error) {
      console.error(`Error deleting terminal ${terminalId}:`, error);
      throw error;
    }
  }

  /**
   * Test terminal connection
   */
  async testConnection(terminalId: number): Promise<{ success: boolean; status: string; response?: any; error?: string }> {
    try {
      const url = this.buildUrl(`/pos-terminals/${terminalId}/test`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Connection test failed: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error testing terminal ${terminalId}:`, error);
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get terminals for current location
   */
  async getLocationTerminals(locationId: number): Promise<POSTerminal[]> {
    return this.getTerminals({ location_id: locationId, active_only: true });
  }

  /**
   * Find terminal by workstation name
   */
  async findByWorkstation(workstationName: string, locationId: number): Promise<POSTerminal | null> {
    const terminals = await this.getLocationTerminals(locationId);
    return terminals.find(t => t.workstation_name === workstationName) || null;
  }
}

export const posTerminalsService = new POSTerminalsService();

