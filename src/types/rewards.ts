export interface UserPointsBalance {
  user_id: number;
  balance: number;
  points_label: string;
  formatted_balance: string;
  timestamp: string;
}

export interface PointsHistoryEvent {
  id: number;
  points: number;
  type: string;
  description: string;
  date: string;
  order_id?: number;
  formatted_date: string;
}

export interface UserPointsHistory {
  user_id: number;
  events: PointsHistoryEvent[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface RedemptionCalculation {
  user_id: number;
  points_to_redeem: number;
  discount_amount: number;
  formatted_discount: string;
  remaining_balance: number;
  can_redeem: boolean;
}

export interface RedemptionResult {
  user_id: number;
  points_redeemed: number;
  discount_amount: number;
  coupon_code: string;
  formatted_discount: string;
  expires_at: string;
}

export interface ProductPoints {
  product_id: number;
  points_earned: number;
  points_required: number;
  can_purchase_with_points: boolean;
  formatted_points_earned: string;
  formatted_points_required?: string;
}

export interface RewardsSettings {
  points_label: string;
  earn_ratio: string;
  redeem_ratio: string;
  min_redeem_points: number;
  max_redeem_discount: string;
  points_expiry: string;
}

export interface UserWithPoints {
  id: number;
  display_name: string;
  email: string;
  balance: number;
  formatted_balance: string;
}

export interface BulkUsersResponse {
  users: UserWithPoints[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface AdjustPointsRequest {
  points: number;
  description: string;
}

export interface RedeemPointsRequest {
  user_id: number;
  points: number;
  cart_total?: number;
}

export interface CalculateRedemptionRequest {
  user_id: number;
  points: number;
}

export type PointsEventType = 
  | 'order-placed'
  | 'order-completed'
  | 'manual-adjust'
  | 'redeem'
  | 'expire'
  | 'refund'
  | 'bonus';

export interface RewardsAPIError {
  code: string;
  message: string;
  data?: {
    status: number;
  };
}


