# POSV1 Architecture Guide

## 🏗️ **Unified Architecture Standards**

### **Data Fetching Patterns**

#### **1. API Client** (src/lib/api-client.ts)
```typescript
import { api } from '../lib/api-client';

// Internal API calls
const products = await api.get('/api/products');
const order = await api.post('/api/orders', orderData);

// External Flora API calls
const floraData = await api.flora('/wc/v3/products');

// Batch operations
const results = await api.batch([
  () => api.get('/api/products'),
  () => api.get('/api/categories')
]);
```

#### **2. React Query Patterns** (src/lib/data-patterns.ts)
```typescript
import { useProducts, useCategories, useBlueprintPricing } from '../lib/data-patterns';

// Standard product fetching
const { data: products, loading, error } = useProducts(filters);

// Cached categories
const { data: categories } = useCategories();

// Optimized blueprint pricing
const { data: pricing } = useBlueprintPricing(productList);
```

#### **3. Service Layer Standards**
```typescript
// Consistent service pattern
export class ProductService {
  static async getProducts(): Promise<Product[]> {
    return api.get('/api/products', { 
      cacheTime: 5 * 60 * 1000,
      retries: 3 
    });
  }
}
```

---

### **Error Handling System**

#### **Unified Error Boundaries**
```typescript
import { 
  CriticalErrorBoundary,    // For checkout, payments
  StandardErrorBoundary,    // For main components
  LightErrorBoundary        // For optional features
} from '../components/error/UnifiedErrorBoundary';

// Usage
<CriticalErrorBoundary componentName="Checkout">
  <CheckoutScreen />
</CriticalErrorBoundary>
```

#### **Error Boundary Levels**
- **Critical**: Payment, checkout, order processing
- **Standard**: Product grid, customer list, main features  
- **Light**: Optional components, decorative elements

---

### **State Management Strategy**

#### **1. Zustand for Global State**
```typescript
// Use for: Cart, user preferences, global UI state
const cartStore = useCartStore();
const { addItem, removeItem, clearCart } = cartStore;
```

#### **2. React Query for Server State**
```typescript
// Use for: API data, caching, background updates
const { data, loading, error, refetch } = useProducts();
```

#### **3. Local useState for Component State**
```typescript
// Use for: Form inputs, local UI state, temporary state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});
```

---

### **Performance Optimizations**

#### **1. API Caching Strategy**
```typescript
const cacheTimes = {
  static: 30 * 60 * 1000,      // Categories, locations
  dynamic: 5 * 60 * 1000,      // Products, customers  
  realtime: 30 * 1000,         // Inventory, pricing
  critical: 0,                 // Orders, payments
};
```

#### **2. Blueprint Pricing Optimization**
- **Single API call** loads all assignments + rules
- **1-minute memory cache** for subsequent requests
- **Batch processing** for multiple products
- **Zero additional network calls** for individual products

#### **3. Component Optimization**
```typescript
// Lazy loading for non-critical components
const ProductGrid = lazy(() => import('./ProductGrid'));

// Memoization for expensive calculations
const expensiveValue = useMemo(() => calculatePricing(products), [products]);
```

---

### **File Organization**

```
src/
├── lib/
│   ├── api-client.ts           # Unified API client
│   ├── data-patterns.ts        # Standard React Query patterns
│   └── errorReporting.ts       # Global error reporting
├── components/
│   ├── error/
│   │   └── UnifiedErrorBoundary.tsx
│   └── ui/                     # Reusable UI components
├── services/                   # Business logic services
├── stores/                     # Zustand global state
├── hooks/                      # Custom React hooks
└── types/                      # TypeScript definitions
```

---

### **Code Quality Standards**

#### **1. TypeScript First**
```typescript
// Always define interfaces
interface Product {
  id: number;
  name: string;
  price: number;
}

// Use strict typing
const getProduct = (id: number): Promise<Product | null>
```

#### **2. Error Handling**
```typescript
// Always handle errors gracefully
try {
  const result = await api.get('/api/products');
  return result;
} catch (error) {
  console.error('Product fetch error:', error);
  return [];
}
```

#### **3. Performance Considerations**
- Use React Query for server state
- Implement proper caching strategies
- Lazy load non-critical components
- Optimize bundle size with tree shaking

---

### **Testing Strategy**

#### **1. API Layer Testing**
```typescript
// Test API client functionality
describe('API Client', () => {
  it('should cache GET requests', async () => {
    // Test caching behavior
  });
});
```

#### **2. Component Testing**
```typescript
// Test with error boundaries
describe('ProductGrid', () => {
  it('should handle API errors gracefully', () => {
    // Test error states
  });
});
```

---

### **Deployment Considerations**

#### **Production Optimizations**
- Enable API response compression
- Configure proper cache headers
- Use CDN for static assets
- Implement proper error logging

#### **Monitoring**
- Track API response times
- Monitor error rates by component
- Watch cache hit rates
- Alert on critical component failures

---

## 🎯 **Migration Guidelines**

### **From Old Pattern to New Pattern**

#### **Before (Inconsistent)**
```typescript
// Mixed approaches
const response = await fetch('/api/products');
const data = await response.json();

useQuery('products', fetchProducts);
const [loading, setLoading] = useState(true);
```

#### **After (Standardized)**
```typescript
// Unified approach
import { useProducts } from '../lib/data-patterns';
const { data: products, loading, error } = useProducts();
```

### **Error Boundary Migration**
```typescript
// Replace multiple boundaries
<ProductGridErrorBoundary>
<CheckoutErrorBoundary>  
<CartErrorBoundary>

// With unified system
<StandardErrorBoundary componentName="ProductGrid">
<CriticalErrorBoundary componentName="Checkout">
<StandardErrorBoundary componentName="Cart">
```

---

This architecture provides:
✅ **Consistent** data fetching patterns  
✅ **Optimized** performance with smart caching  
✅ **Robust** error handling at all levels  
✅ **Scalable** foundation for future features  
✅ **Maintainable** code organization
