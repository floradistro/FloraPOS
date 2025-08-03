# Virtual Pre-Roll Workflow with Separate Products

## Overview

Staff continues to manage virtual pre-roll inventory at the flower product level, while customers see and purchase separate pre-roll products with proper SKUs.

## Staff Workflow (Backend Management)

### 1. Morning Prep - Converting Flower to Virtual Pre-Rolls

**Location:** Flower Product Card (e.g., Purple Punch)

```
Purple Punch (Flower)
├── Stock: 700g
├── Virtual Pre-rolls: 10 ready
├── Target: 50 pre-rolls
└── [Convert to Pre-rolls] button
```

**Steps:**
1. Staff opens Purple Punch flower product
2. Sees current virtual pre-roll count (10/50 target)
3. Clicks "Convert to Pre-rolls"
4. Enters quantity (e.g., 40 pre-rolls = 28g)
5. System updates:
   - Flower stock: 700g → 672g
   - Virtual pre-rolls: 10 → 50
   - Activity logged with timestamp

### 2. Throughout the Day - Monitoring Levels

**Real-time Display:**
```
Virtual Pre-Roll Status:
Ready Now: 50 ✅
Can Make: 960 (from 672g)
Total Available: 1,010

[████████████░░░] 50/50 target (100%)
```

**Color Indicators:**
- 🟢 Green: At or above target
- 🟡 Yellow: 50-99% of target
- 🟠 Orange: Below 50% of target
- 🔴 Red: No virtual stock

### 3. Low Stock Alerts

When virtual count drops below 30% of target:
- Visual alert on product card
- Optional notification to staff
- Quick convert buttons: [+10] [+20] [+50]

## Customer Experience (Frontend Sales)

### 1. Product Display

Customers see TWO separate products:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ Purple Punch (Flower)   │  │ Purple Punch Pre-rolls  │
│ SKU: PP-FLW            │  │ SKU: PP-PR              │
│ $10/gram               │  │ $6/pre-roll             │
│ Stock: 672g            │  │ Stock: 50 ready         │
└─────────────────────────┘  └─────────────────────────┘
```

### 2. Pre-roll Availability Display

The pre-roll product shows smart availability:

```
Purple Punch Pre-rolls
Available: 1,010 total
├── 50 ready to go ✅
└── 960 can be made fresh

[Select Quantity: 1  3  5  10]
```

### 3. Order Processing

When customer orders 5 pre-rolls:

**If virtual stock available (50 ready):**
- Uses 5 from virtual inventory
- Virtual count: 50 → 45
- No flower deduction
- Instant fulfillment

**If partial virtual stock (3 ready, need 5):**
- Uses 3 from virtual
- Converts 2 on-demand (1.4g flower)
- Updates both inventories

## Behind the Scenes - System Integration

### Database Structure

```sql
-- Flower Product (ID: 792)
product_name: "Purple Punch"
sku: "PP-FLW"
stock: 672
meta: {
  _virtual_preroll_count: 50,
  _preroll_target: 50,
  _total_converted: 150,
  _total_sold: 100
}

-- Pre-roll Product (ID: 1234)
product_name: "Purple Punch Pre-rolls"
sku: "PP-PR"
stock: 0 (virtual product)
meta: {
  _source_flower_id: 792,
  _conversion_rate: 0.7,
  _virtual_product: "yes"
}
```

### Inventory Deduction Logic

```php
// When pre-roll product is sold
if (is_virtual_preroll($product_id)) {
    $source_flower_id = get_source_flower_id($product_id);
    $virtual_available = get_virtual_count($source_flower_id);
    
    if ($virtual_available >= $quantity) {
        // Use virtual stock
        deduct_virtual_count($source_flower_id, $quantity);
    } else {
        // Mixed: use virtual + convert flower
        $use_virtual = $virtual_available;
        $convert_fresh = $quantity - $virtual_available;
        $flower_needed = $convert_fresh * 0.7;
        
        deduct_virtual_count($source_flower_id, $use_virtual);
        deduct_flower_stock($source_flower_id, $flower_needed);
    }
}
```

## Benefits of This Approach

### For Staff:
- ✅ Same workflow - manage pre-rolls within flower products
- ✅ Clear targets and visual indicators
- ✅ Batch conversion tools
- ✅ Activity tracking and reporting

### For Business:
- ✅ Separate SKUs for flower vs pre-rolls
- ✅ Proper tax application per product type
- ✅ Clean itemization on receipts
- ✅ Native WooCommerce reporting

### For Customers:
- ✅ Clear product distinction
- ✅ Accurate availability information
- ✅ Professional receipts with correct items
- ✅ Transparent pricing

## Quick Reference

### Staff Actions:
1. **Convert flower to pre-rolls**: Within flower product card
2. **Monitor levels**: Visual indicators on flower product
3. **Set targets**: Configure per strain based on demand

### System Handles:
1. **SKU separation**: Flower and pre-rolls have distinct SKUs
2. **Inventory linking**: Pre-roll sales deduct from flower
3. **Tax calculation**: Different rates per product type
4. **Reporting**: Separate sales data for each form

### Customer Sees:
1. **Two products**: Flower by gram, pre-rolls by count
2. **Real availability**: Combined virtual + potential
3. **Proper receipts**: "3x Purple Punch Pre-rolls"

## Implementation Timeline

1. **Week 1**: Create virtual pre-roll products in WooCommerce
2. **Week 2**: Deploy Addify plugin modifications
3. **Week 3**: Update frontend to show both products
4. **Week 4**: Train staff on unchanged workflow
5. **Week 5**: Go live with dual-product system 