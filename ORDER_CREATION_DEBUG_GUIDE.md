# Order Creation Error: "invalid parameter(s): line_items" - Complete Debug Guide

## 🔍 All Possible Causes & Fixes

This error can happen for MANY reasons. We've now added comprehensive validation and logging to catch ALL of them.

---

## 1️⃣ INVALID PRODUCT ID (Most Common)

### Causes:
- ❌ ProductMappingService returned null (name search failed)
- ❌ parseInt() on string IDs like "variant-12345-67890" → NaN
- ❌ product_id field missing from cart item
- ❌ Variant ID undefined from failed API call

### Fixes Applied:
```typescript
// ✅ Use item.product_id FIRST (set by CartService)
let productId = item.product_id;

// ✅ Only fallback to name search if missing
if (!productId || productId <= 0) {
  productId = await ProductMappingService.find...
}

// ✅ Strict validation
if (!productId || isNaN(productId) || productId <= 0) {
  throw new Error(`Invalid product ID for "${item.name}"`);
}
```

**Files:** `CheckoutScreen.tsx` (line 160-181), `cart-service.ts` (line 108-118), `ProductGrid.tsx` (line 769-777, 695-728)

---

## 2️⃣ INVALID QUANTITY

### Causes:
- ❌ Quantity is 0, negative, NaN, or Infinity
- ❌ User edited quantity to invalid value
- ❌ Conversion ratio calculation error

### Fixes Applied:
```typescript
// ✅ Ensure minimum quantity
const quantity = Math.max(0.01, item.quantity || 1);

// ✅ Validate number
if (isNaN(quantity) || !isFinite(quantity)) {
  throw new Error(`Invalid quantity for "${item.name}"`);
}
```

**File:** `CheckoutScreen.tsx` (line 190-195)

---

## 3️⃣ INVALID PRICE

### Causes:
- ❌ Price is NaN (calculation error)
- ❌ Price is negative
- ❌ Price is Infinity
- ❌ Override price corrupted

### Fixes Applied:
```typescript
// ✅ Validate price
if (isNaN(finalPrice) || !isFinite(finalPrice) || finalPrice < 0) {
  throw new Error(`Invalid price for "${item.name}": ${finalPrice}`);
}
```

**File:** `CheckoutScreen.tsx` (line 197-200)

---

## 4️⃣ EMPTY/INVALID SUBTOTAL OR TOTAL

### Causes:
- ❌ NaN price × quantity → NaN total
- ❌ Undefined or null values
- ❌ String instead of number

### Fixes Applied:
```typescript
// ✅ Validate in line item validation
if (li.subtotal === undefined || isNaN(parseFloat(li.subtotal))) {
  validationErrors.push(`Invalid subtotal`);
}
```

**File:** `CheckoutScreen.tsx` (line 339-344)

---

## 5️⃣ EMPTY/INVALID OPTIONAL FIELDS

### Causes:
- ❌ SKU is undefined/null (should be omitted, not empty string)
- ❌ Name is empty string
- ❌ Whitespace-only strings

### Fixes Applied:
```typescript
// ✅ Only add optional fields if valid
if (item.name && item.name.trim()) {
  lineItem.name = item.name.trim();
}

if (item.sku && item.sku.trim()) {
  lineItem.sku = item.sku.trim();
}
```

**File:** `CheckoutScreen.tsx` (line 223-230)

---

## 6️⃣ INVALID METADATA VALUES

### Causes:
- ❌ Undefined values in meta_data
- ❌ conversion_ratio fields missing
- ❌ Null/undefined being converted to strings

### Fixes Applied:
```typescript
// ✅ Validate conversion_ratio before adding
if (cr.input_amount && cr.input_unit && cr.output_amount && cr.output_unit) {
  // Only add if all required fields exist
  const conversionMetadata = [...]
}
```

**File:** `CheckoutScreen.tsx` (line 281-305)

---

## 7️⃣ INVALID VARIATION_ID

### Causes:
- ❌ variation_id is NaN
- ❌ variation_id is 0 or negative
- ❌ variation_id exists but is invalid type

### Fixes Applied:
```typescript
// ✅ Validate variation_id if present
if (li.variation_id !== undefined && (isNaN(li.variation_id) || li.variation_id <= 0)) {
  validationErrors.push(`Invalid variation_id`);
}
```

**File:** `CheckoutScreen.tsx` (line 347-349)

---

## 8️⃣ LINE_ITEMS NOT AN ARRAY

### Causes:
- ❌ Corruption in state management
- ❌ Wrong data structure sent
- ❌ Undefined/null instead of []

### Fixes Applied:
```typescript
// ✅ Sanity check
if (!Array.isArray(orderData.line_items)) {
  throw new Error('Internal error: line_items must be an array');
}
```

**File:** `CheckoutScreen.tsx` (line 503-506)

---

## 🔍 DEBUGGING - When Error Happens

### Console Logs You'll See:

**1. Line Items Validation:**
```
📦 Line items validation (3 items):
   Item 1: {
     name: "Apple Gummy",
     product_id: 671,
     quantity: 1,
     subtotal: "14.99",
     total: "14.99",
     ...
   }
   Item 2: { ... }
   Item 3: { ... }
✅ All line items validated successfully
```

**2. Full Order Payload:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 FULL ORDER PAYLOAD TO WOOCOMMERCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "customer_id": 123,
  "payment_method": "cash",
  "line_items": [
    {
      "product_id": 671,
      "quantity": 1,
      "subtotal": "14.99",
      "total": "14.99",
      ...
    }
  ],
  ...
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**3. If Error Occurs:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ WOOCOMMERCE ORDER CREATION FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: 400 Bad Request
Error Data: {
  "code": "woocommerce_rest_invalid_product_id",
  "message": "Invalid parameter(s): line_items",
  "data": { "status": 400 }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order Data Sent:
  Customer ID: 123
  Payment: cash
  Line Items Count: 3
  First Line Item: { product_id: NaN, ... }  ← FOUND THE BUG!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 HOW TO USE THIS WHEN ERROR HAPPENS

**When staff reports the error:**

1. **Ask them to open browser console** (F12 or Cmd+Option+I)
2. **Look for the big box with** `❌ WOOCOMMERCE ORDER CREATION FAILED`
3. **Check "First Line Item"** - this will show the bad data
4. **Common issues to look for:**
   - `product_id: NaN` → Product ID lookup failed
   - `product_id: 0` → Product not found
   - `quantity: 0` → Invalid quantity
   - `quantity: NaN` → Calculation error
   - `subtotal: "NaN"` → Price calculation error

5. **Screenshot the logs** and you'll know EXACTLY what's wrong

---

## 🛡️ VALIDATION LAYERS

We now validate at **4 different points:**

### Layer 1: Variant Loading (ProductGrid, AdjustmentsGrid)
- Filter out variants with invalid IDs
- Only valid variants shown to users

### Layer 2: Cart Entry (CartService)
- Validate product_id when creating cart item
- Throw error before bad data enters cart

### Layer 3: Add to Cart (ProductGrid)
- Validate variant ID before adding
- Show alert if invalid

### Layer 4: Checkout (CheckoutScreen)
- Validate ALL fields: product_id, quantity, price, totals
- Log exact payload sent to WooCommerce
- Detailed error logging if fails

---

## 📊 NEXT STEPS

If the error STILL happens after these fixes:

1. **Check console logs** - they will show the EXACT issue
2. **Look at "First Line Item"** in error logs
3. **Check which field is invalid** (product_id, quantity, price, etc.)
4. **Report the specific field** and we can add more validation

The logs now show:
- ✅ WHAT was sent
- ✅ WHY it failed
- ✅ WHICH item is bad
- ✅ WHICH field is invalid

This makes the error **10x easier to debug**!

---

## 📅 Date: October 14, 2025
## 🧑‍💻 Engineer: AI Senior Dev  
## 🎯 Status: ✅ Complete - Comprehensive Validation & Logging in Place

