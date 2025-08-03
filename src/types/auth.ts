export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  storeId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Add customer preference types
export interface CustomerPreference {
  id: string
  customerId: string
  category: string  // Changed from PreferenceCategory to string to support more flexible categories
  value: string
  notes?: string
  addedBy: string
  addedAt: string
  updatedAt: string
  // ACF field integration
  acfFieldKey?: string  // Maps to ACF field key like 'strain_type', 'effects', etc.
  productId?: number    // If preference was learned from a specific product
}

export enum PreferenceCategory {
  // Real ACF fields from your system only
  THCA_PERCENT = 'thca_%',
  NOSE = 'nose',
  EFFECTS = 'effects', 
  TERPENE = 'terpene',
  STRAIN_TYPE = 'strain_type',
  LINEAGE = 'lineage',
  // Only one manual category for anything else
  CUSTOM = 'custom'
}

export const ACF_PREFERENCE_MAPPING: Record<string, PreferenceCategory> = {
  // Direct mapping to your actual ACF fields
  'thca_%': PreferenceCategory.THCA_PERCENT,
  'nose': PreferenceCategory.NOSE,
  'effects': PreferenceCategory.EFFECTS,
  'terpene': PreferenceCategory.TERPENE,
  'strain_type': PreferenceCategory.STRAIN_TYPE,
  'lineage': PreferenceCategory.LINEAGE
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
  loyaltyPoints?: number
  totalSpent?: number
  orderCount?: number
  lastOrderDate?: string
  preferences?: CustomerPreference[]
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Store {
  id: string
  name: string
  address: string
  phone: string
  isActive: boolean
  timezone: string
  currency: string
  taxRate: number
  createdAt: string
  updatedAt: string
}

export interface Terminal {
  id: string
  name: string
  storeId: string
  isActive: boolean
  lastActivity: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  storeId: string
  terminalId: string
  token: string
  expiresAt: string
  createdAt: string
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  STORE_ADMIN = 'store_admin', 
  MANAGER = 'manager',
  CASHIER = 'cashier'
}

export interface LoginRequest {
  email: string
  password: string
  storeId: string
  terminalId: string
}

export interface LoginResponse {
  user: User
  store: Store
  terminal: Terminal
  token: string
  expiresAt: string
}

export interface AuthContextType {
  user: User | null
  store: Store | null
  terminal: Terminal | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

export interface Permission {
  action: string
  resource: string
}

export const PERMISSIONS = {
  // Sales permissions
  PROCESS_SALE: { action: 'process', resource: 'sale' },
  VOID_SALE: { action: 'void', resource: 'sale' },
  REFUND_SALE: { action: 'refund', resource: 'sale' },
  
  // Inventory permissions
  VIEW_INVENTORY: { action: 'view', resource: 'inventory' },
  MANAGE_INVENTORY: { action: 'manage', resource: 'inventory' },
  
  // Reports permissions
  VIEW_REPORTS: { action: 'view', resource: 'reports' },
  EXPORT_REPORTS: { action: 'export', resource: 'reports' },
  
  // User management
  MANAGE_USERS: { action: 'manage', resource: 'users' },
  VIEW_USERS: { action: 'view', resource: 'users' },
  
  // Store management
  MANAGE_STORES: { action: 'manage', resource: 'stores' },
  VIEW_STORES: { action: 'view', resource: 'stores' },
  
  // Terminal management
  MANAGE_TERMINALS: { action: 'manage', resource: 'terminals' },
  VIEW_TERMINALS: { action: 'view', resource: 'terminals' },
} as const

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [UserRole.STORE_ADMIN]: [
    PERMISSIONS.PROCESS_SALE,
    PERMISSIONS.VOID_SALE,
    PERMISSIONS.REFUND_SALE,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_STORES,
    PERMISSIONS.MANAGE_TERMINALS,
    PERMISSIONS.VIEW_TERMINALS,
  ],
  [UserRole.MANAGER]: [
    PERMISSIONS.PROCESS_SALE,
    PERMISSIONS.VOID_SALE,
    PERMISSIONS.REFUND_SALE,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_TERMINALS,
  ],
  [UserRole.CASHIER]: [
    PERMISSIONS.PROCESS_SALE,
    PERMISSIONS.VIEW_INVENTORY,
  ],
} 