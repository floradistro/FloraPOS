/**
 * Cash Management Type Definitions
 */

export interface DrawerSession {
  id: number;
  location_id: number;
  terminal_id?: number;
  register_name: string;
  session_status: 'open' | 'closed' | 'reconciled';
  opened_at: string;
  closed_at?: string;
  reconciled_at?: string;
  opening_float: number;
  expected_cash_sales: number;
  expected_cash_returns: number;
  expected_total: number;
  actual_cash_counted?: number;
  cash_drops_total: number;
  cash_additions_total: number;
  variance: number;
  variance_reason?: string;
  denomination_breakdown?: DenominationBreakdown;
  opened_by?: number;
  closed_by?: number;
  reconciled_by?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CashDrop {
  id: number;
  drawer_session_id: number;
  location_id: number;
  drop_type: 'safe_drop' | 'bank_bag' | 'other';
  amount: number;
  dropped_by: number;
  dropped_at: string;
  verified_by?: number;
  verified_at?: string;
  denomination_breakdown?: DenominationBreakdown;
  notes?: string;
  created_at?: string;
}

export interface DailyReconciliation {
  id: number;
  location_id: number;
  business_date: string;
  reconciliation_status: 'pending' | 'in_progress' | 'completed' | 'approved';
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  cash_received: number;
  cash_paid_out: number;
  total_cash_drops: number;
  cash_in_safe: number;
  cash_in_drawers: number;
  total_variance: number;
  variance_notes?: string;
  drawer_session_ids?: number[];
  reconciled_by?: number;
  reconciled_at?: string;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyDeposit {
  id: number;
  location_id: number;
  week_start_date: string;
  week_end_date: string;
  deposit_status: 'pending' | 'prepared' | 'picked_up' | 'deposited' | 'verified';
  deposit_amount: number;
  daily_reconciliation_ids?: number[];
  denomination_breakdown?: DenominationBreakdown;
  prepared_by?: number;
  prepared_at?: string;
  picked_up_by?: string;
  picked_up_at?: string;
  deposited_at?: string;
  bank_deposit_slip?: string;
  bank_verified_amount?: number;
  bank_verified_at?: string;
  variance: number;
  notes?: string;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CashOnHand {
  location_id: number;
  location_name: string;
  cash_in_drawers: number;
  cash_in_safe: number;
  total_cash_on_hand: number;
  pending_deposit_amount: number;
  current_week_cash_accumulated: number;
  last_updated?: string;
}

export interface DenominationBreakdown {
  hundreds?: number;
  fifties?: number;
  twenties?: number;
  tens?: number;
  fives?: number;
  ones?: number;
  quarters?: number;
  dimes?: number;
  nickels?: number;
  pennies?: number;
}

export interface CashManagementMetrics {
  totalCashHandled: number;
  weeklyAverage: number;
  monthlyTotal: number;
  totalVariance: number;
  averageVariance: number;
  variancePercentage: number;
  sessionsCount: number;
  dropsCount: number;
  depositsCount: number;
  cashInDrawers: number;
  cashInSafe: number;
  totalCashOnHand: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

