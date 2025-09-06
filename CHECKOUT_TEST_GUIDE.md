# POSV1 Inventory Deduction Test Guide

## Current Status
✅ Inventory deduction service created
✅ Checkout integration added  
✅ API proxy enabled
✅ Debugging logs added

## Test Steps

### 1. Open POSV1 and Login
- Go to http://localhost:3000
- Login with valid credentials
- Check that user has a location assigned

### 2. Find Product with Inventory
**Recommended test products (known to have inventory):**
- **Chanel Candy (ID: 786)** - 200 units at Charlotte Monroe (ID: 19), 56.8 at Charlotte Central (ID: 20)
- **Lemon Cherry Gelato (ID: 766)** - 444 units at Charlotte Monroe, 460 at Charlotte Central
- **Golden Hour (ID: 40788)** - 12345 units at Charlotte Monroe

### 3. Add to Cart and Checkout
1. Add 1-2 units of a test product to cart
2. Go to checkout
3. Complete payment (cash or card)
4. **Watch browser console for logs**

### 4. Expected Console Logs
Look for these logs during checkout:
```
🏪 Order location info: { userLocation: "...", locationId: ..., ... }
🔍 Starting inventory deduction for order ...
📦 Processing item: ... (qty: ...)
🔍 Fetching inventory: /api/proxy/flora-im/inventory?...
📊 Inventory API response: [...]
📝 Updating inventory: { product_id: ..., quantity: ... }
📝 Update response status: 200
✅ Inventory successfully deducted for order: [...]
📊 Deduction summary: { totalItems: ..., items: [...] }
```

### 5. Verify Inventory Deduction
After successful checkout:
1. Check if product cards show updated quantities
2. Or manually check via API:
```bash
curl "http://localhost:3000/api/proxy/flora-im/inventory?product_id=786&location_id=19"
```

## Troubleshooting

### If No Console Logs Appear
- Check if inventory deduction service is being called
- Look for TypeScript compilation errors
- Verify user location is set correctly

### If "Inventory Warning" Alert Shows
- Check the error message in console
- Verify API authentication
- Check if product exists at the location

### If Quantities Don't Update
- Check if ProductGrid refresh is working
- Verify inventory API returns updated data
- Check for caching issues

## Test with Conversion Ratios

To test conversion ratios:
1. Find a product with pricing tier that has conversion ratios
2. Add to cart with specific quantity
3. Check that deducted amount = sold quantity × conversion ratio

Example: If selling 2 Pre-Rolls with 0.7g per unit ratio:
- Sold: 2 units
- Should deduct: 2 × 0.7 = 1.4g from flower inventory

## Quick API Tests

### Check Current Inventory
```bash
curl "http://localhost:3000/api/proxy/flora-im/inventory?product_id=786&location_id=19"
```

### Check All Products with Inventory  
```bash
curl "http://localhost:3000/api/proxy/flora-im/products" | grep -A5 -B5 "stock"
```

## Success Criteria
- ✅ Console logs show inventory deduction process
- ✅ No error alerts during checkout
- ✅ Product quantities decrease after purchase
- ✅ Conversion ratios applied correctly (if applicable)
- ✅ ProductGrid refreshes and shows updated quantities
