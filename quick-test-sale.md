# Quick Test Instructions

1. In browser, add Watermelon Gummy to cart
2. Complete checkout with any payment method
3. Check console logs for:
   - "🔥 V2 INVENTORY DEDUCTION" = V2 service working
   - "📊 Current stock: 50.00" = Reading correct inventory
   - "✅ Verified: Inventory is now 49" = Update confirmed

4. After checkout:
   - Product should show 49 in stock
   - Product should NOT disappear
   - Order total should be ~$32

If you see "📦 Processing inventory for..." instead of "🔥 V2", 
the old service is still running and V2 didn't load.
