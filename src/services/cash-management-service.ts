/**
 * Cash Management Service
 * API integration for cash drawer, reconciliation, and deposits
 */

import { apiFetch } from '../lib/api-fetch';
import type {
  DrawerSession,
  CashDrop,
  DailyReconciliation,
  WeeklyDeposit,
  CashOnHand,
  DenominationBreakdown,
  APIResponse
} from '../types/cash';

const BASE_URL = '/api/cash-management';

class CashManagementService {
  
  // ==========================================
  // DRAWER SESSIONS
  // ==========================================
  
  async openDrawer(data: {
    location_id: number;
    register_name: string;
    opening_float: number;
    terminal_id?: number;
    notes?: string;
  }): Promise<APIResponse<{ session_id: number; session: DrawerSession }>> {
    const response = await apiFetch(`${BASE_URL}/drawer/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to open drawer' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async closeDrawer(data: {
    session_id: number;
    actual_cash_counted: number;
    denomination_breakdown?: DenominationBreakdown;
    variance_reason?: string;
    notes?: string;
  }): Promise<APIResponse<{ session: DrawerSession }>> {
    const response = await apiFetch(`${BASE_URL}/drawer/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to close drawer' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getCurrentDrawer(
    location_id: number,
    register_name?: string
  ): Promise<APIResponse<{ session: DrawerSession | null }>> {
    const params = new URLSearchParams({ location_id: location_id.toString() });
    if (register_name) {
      params.append('register_name', register_name);
    }
    
    const response = await apiFetch(`${BASE_URL}/drawer/current?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch current drawer' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getDrawerSessions(
    location_id: number,
    date_from?: string,
    date_to?: string
  ): Promise<APIResponse<{ sessions: DrawerSession[] }>> {
    const params = new URLSearchParams({ location_id: location_id.toString() });
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    
    const response = await apiFetch(`${BASE_URL}/drawer/sessions?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch drawer sessions' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getDrawerSession(session_id: number): Promise<APIResponse<{ session: DrawerSession }>> {
    const response = await apiFetch(`${BASE_URL}/drawer/${session_id}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch drawer session' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  // ==========================================
  // CASH DROPS
  // ==========================================
  
  async recordCashDrop(data: {
    drawer_session_id: number;
    location_id: number;
    amount: number;
    drop_type?: 'safe_drop' | 'bank_bag' | 'other';
    denomination_breakdown?: DenominationBreakdown;
    notes?: string;
  }): Promise<APIResponse<{ drop_id: number }>> {
    const response = await apiFetch(`${BASE_URL}/drop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to record cash drop' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getSessionDrops(session_id: number): Promise<APIResponse<{ drops: CashDrop[] }>> {
    const response = await apiFetch(`${BASE_URL}/drawer/${session_id}/drops`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch cash drops' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  // ==========================================
  // DAILY RECONCILIATION
  // ==========================================
  
  async createDailyReconciliation(data: {
    location_id: number;
    business_date: string;
  }): Promise<APIResponse<{ reconciliation_id: number; reconciliation: DailyReconciliation }>> {
    const response = await apiFetch(`${BASE_URL}/reconciliation/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create daily reconciliation' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getDailyReconciliation(
    location_id: number,
    business_date?: string,
    date_from?: string,
    date_to?: string
  ): Promise<APIResponse<{ reconciliation?: DailyReconciliation; reconciliations?: DailyReconciliation[] }>> {
    const params = new URLSearchParams({ location_id: location_id.toString() });
    if (business_date) params.append('business_date', business_date);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    
    const response = await apiFetch(`${BASE_URL}/reconciliation/daily?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch reconciliation' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async approveReconciliation(
    reconciliation_id: number,
    notes?: string
  ): Promise<APIResponse<{}>> {
    const response = await apiFetch(`${BASE_URL}/reconciliation/approve/${reconciliation_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to approve reconciliation' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  // ==========================================
  // CASH ON HAND
  // ==========================================
  
  async getCashOnHand(location_id: number): Promise<APIResponse<CashOnHand>> {
    const response = await apiFetch(`${BASE_URL}/on-hand?location_id=${location_id}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch cash on hand' };
    }
    
    const result = await response.json();
    return { success: true, data: result.data };
  }
  
  // ==========================================
  // WEEKLY DEPOSITS
  // ==========================================
  
  async createWeeklyDeposit(data: {
    location_id: number;
    week_start_date?: string;
  }): Promise<APIResponse<{ deposit_id: number; deposit: WeeklyDeposit }>> {
    const response = await apiFetch(`${BASE_URL}/deposits/weekly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create weekly deposit' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async getWeeklyDeposits(
    location_id: number,
    status?: string
  ): Promise<APIResponse<{ deposits: WeeklyDeposit[] }>> {
    const params = new URLSearchParams({ location_id: location_id.toString() });
    if (status) params.append('status', status);
    
    const response = await apiFetch(`${BASE_URL}/deposits/weekly?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch deposits' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async markDepositPrepared(
    deposit_id: number,
    data: {
      denomination_breakdown?: DenominationBreakdown;
      notes?: string;
    }
  ): Promise<APIResponse<{ deposit: WeeklyDeposit }>> {
    const response = await apiFetch(`${BASE_URL}/deposits/${deposit_id}/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to mark deposit prepared' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async markDepositPickedUp(
    deposit_id: number,
    data: {
      picked_up_by: string;
      notes?: string;
    }
  ): Promise<APIResponse<{ deposit: WeeklyDeposit }>> {
    const response = await apiFetch(`${BASE_URL}/deposits/${deposit_id}/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to mark deposit picked up' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async markDepositDeposited(
    deposit_id: number,
    data: {
      bank_deposit_slip?: string;
      notes?: string;
    }
  ): Promise<APIResponse<{ deposit: WeeklyDeposit }>> {
    const response = await apiFetch(`${BASE_URL}/deposits/${deposit_id}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to mark deposit deposited' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
  
  async verifyDeposit(
    deposit_id: number,
    data: {
      bank_verified_amount: number;
      notes?: string;
    }
  ): Promise<APIResponse<{ deposit: WeeklyDeposit }>> {
    const response = await apiFetch(`${BASE_URL}/deposits/${deposit_id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to verify deposit' };
    }
    
    const result = await response.json();
    return { success: true, data: result };
  }
}

export const cashManagementService = new CashManagementService();

