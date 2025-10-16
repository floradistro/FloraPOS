/**
 * POS Terminal & Payment Processing Types
 * For Dejavoo WizarPOS QZ Integration
 */

// ====================
// POS TERMINAL TYPES
// ====================

export interface POSTerminal {
  id: number;
  terminal_name: string;
  terminal_serial: string;
  terminal_type: 'dejavoo' | 'clover' | 'square';
  terminal_model: string;
  
  // Location & Assignment
  location_id: number;
  workstation_name: string;
  assigned_to_user_id?: number;
  
  // Dejavoo Config
  processor_id?: number;
  dejavoo_register_id?: string;
  dejavoo_auth_key?: string;
  
  // Status
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  connection_status: 'online' | 'offline' | 'unknown';
  ip_address?: string;
  last_seen?: string;
  last_transaction_at?: string;
  
  // Settings
  settings?: Record<string, any>;
  features?: string[];
  
  // Audit
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// ====================
// PAYMENT PROCESSOR TYPES
// ====================

export interface PaymentProcessor {
  id: number;
  processor_name: string;
  processor_type: 'dejavoo' | 'clover' | 'square';
  
  // API Config
  api_endpoint: string;
  api_version: string;
  is_sandbox: boolean;
  
  // Features
  supported_features: string[];
  processor_settings?: Record<string, any>;
  
  // Status
  is_active: boolean;
  
  // Audit
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// ====================
// PAYMENT TRANSACTION TYPES
// ====================

export interface PaymentTransaction {
  id: number;
  
  // Order Reference
  pos_order_id?: number;
  woocommerce_order_id?: number;
  
  // Terminal & Processor
  terminal_id?: number;
  processor_id?: number;
  
  // Transaction Details
  transaction_type: 'sale' | 'void' | 'return' | 'auth' | 'capture' | 'tip_adjust';
  transaction_ref?: string;
  invoice_number?: string;
  
  // Financial
  amount: number;
  tip_amount: number;
  total_amount: number;
  currency: string;
  
  // Payment Method
  payment_method?: string;
  card_type?: string;
  card_last_four?: string;
  entry_method?: 'chip' | 'contactless' | 'swipe' | 'manual';
  
  // Status
  status: 'pending' | 'approved' | 'declined' | 'voided' | 'error';
  response_code?: string;
  response_message?: string;
  
  // Dejavoo Specific
  dejavoo_tpn?: string;
  dejavoo_approval_code?: string;
  dejavoo_batch_number?: string;
  
  // Full Response Data
  processor_request?: Record<string, any>;
  processor_response?: Record<string, any>;
  
  // Signature & Receipt
  signature_data?: string;
  receipt_data?: string;
  
  // Timing
  initiated_at: string;
  completed_at?: string;
  
  // Audit
  created_by?: number;
  created_at?: string;
}

// ====================
// DEJAVOO API TYPES
// ====================

export interface DejavooSaleParams {
  Amount: number;
  InvoiceNumber?: string;
  GetSignature?: 'Y' | 'N';
  PrintReceipt?: 'Y' | 'N';
}

export interface DejavooResponse {
  TransactionID?: string;
  ResponseCode: string;
  ResponseMessage: string;
  ApprovalCode?: string;
  TPN?: string;
  CardType?: string;
  CardLast4?: string;
  EntryMethod?: string;
  Amount?: string;
  TipAmount?: string;
  BatchNumber?: string;
  Signature?: string; // Base64 encoded
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: number;
  transaction?: PaymentTransaction;
  response?: DejavooResponse;
  error?: string;
}

// ====================
// SUPABASE REALTIME TYPES
// ====================

export interface POSTerminalDevice {
  id: string; // UUID
  terminal_id: number; // References WordPress terminal
  terminal_serial: string;
  workstation_name: string;
  location_id: number;
  
  // Status
  status: 'online' | 'offline' | 'processing' | 'error' | 'maintenance';
  connection_status: 'connected' | 'disconnected' | 'unknown';
  
  // Current Activity
  current_transaction_id?: string;
  current_order_id?: string;
  is_busy: boolean;
  
  // Connection
  ip_address?: string;
  user_agent?: string;
  last_heartbeat: string;
  last_transaction_at?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ====================
// FORM TYPES
// ====================

export interface CreateTerminalForm {
  terminal_name: string;
  terminal_serial: string;
  terminal_type?: 'dejavoo' | 'clover' | 'square';
  terminal_model?: string;
  location_id: number;
  workstation_name: string;
  processor_id?: number;
  dejavoo_register_id?: string;
  dejavoo_auth_key?: string;
  features?: string[];
}

export interface UpdateTerminalForm extends Partial<CreateTerminalForm> {
  status?: 'active' | 'inactive' | 'maintenance' | 'error';
  settings?: Record<string, any>;
}

// ====================
// API RESPONSE TYPES
// ====================

export interface TerminalApiResponse {
  success: boolean;
  data?: POSTerminal | POSTerminal[];
  message?: string;
  error?: string;
}

export interface TransactionApiResponse {
  success: boolean;
  data?: PaymentTransaction | PaymentTransaction[];
  message?: string;
  error?: string;
}

export interface ProcessorApiResponse {
  success: boolean;
  data?: PaymentProcessor | PaymentProcessor[];
  message?: string;
  error?: string;
}

