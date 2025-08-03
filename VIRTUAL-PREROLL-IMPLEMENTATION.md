# 🎯 Virtual Pre-Roll Inventory Implementation

## 📋 **Overview**
Implemented a virtual pre-roll inventory system that tracks pre-rolled inventory without creating separate products. Staff can convert flower to pre-rolls, and the system automatically manages inventory deduction based on availability.

## 🔧 **Plugin Modifications**

### **1. Inventory Deduction Logic Updates**

#### **Modified Files:**
- `/includes/admin/class-addify-multi-location-inventory-admin.php` (2 locations)
- `/class-addify-multi-inventory-management.php` (1 location)

#### **Key Changes:**
- Added virtual pre-roll inventory check before flower deduction
- If virtual pre-rolls available: No flower deduction
- If insufficient virtual: Use available virtual first, then deduct remaining from flower
- Tracks all deductions in metadata for reporting

### **2. New REST API Controller**

#### **New File:**
- `/rest-api/controllers/af-mli-preroll-conversion-controller.php`

#### **Endpoints:**
- `POST /wp-json/addify/v1/preroll/convert` - Convert flower to pre-rolls
- `GET /wp-json/addify/v1/preroll/inventory/{product_id}` - Get virtual inventory
- `GET /wp-json/addify/v1/preroll/activity/{product_id}` - Get activity log
- `GET /wp-json/addify/v1/preroll/metrics` - Get overall metrics
- `PUT /wp-json/addify/v1/preroll/target` - Update pre-roll target

### **3. Activity Logging Function**

#### **Added to:**
- `/class-addify-multi-inventory-management.php` (global function)
- `/includes/admin/class-addify-multi-location-inventory-admin.php` (class method)

#### **Function:**
```php
af_mli_log_preroll_activity($product_id, $action_type, $data)
```

## 📊 **Metadata Structure**

### **Product Metadata:**
- `_virtual_preroll_count` - Current virtual pre-roll inventory
- `_preroll_target` - Target pre-rolls to maintain (default: 10)
- `_total_prerolls_converted` - Lifetime conversions
- `_total_prerolls_sold` - Lifetime sales
- `_total_flower_to_preroll` - Total flower used for conversions
- `_preroll_activity_log` - Activity log (last 100 entries)

### **Order Item Metadata (Added During Sale):**
- `_preroll_source` - "virtual" or "on_demand"
- `_virtual_used` - Number from virtual inventory
- `_flower_converted` - Grams converted on-demand

## 🔄 **Workflow**

### **1. Staff Converts Flower to Pre-Rolls:**
```
API Call: POST /wp-json/addify/v1/preroll/convert
{
  "product_id": 792,
  "preroll_count": 10,
  "location_id": 30,
  "notes": "Morning prep"
}

Result:
- Deducts 7g from flower inventory
- Adds 10 to virtual pre-roll count
- Logs conversion activity
```

### **2. Customer Buys Pre-Rolls:**
```
Scenario A: Sufficient Virtual (10 virtual, customer wants 7)
- Virtual count: 10 → 3
- Flower deduction: 0g
- Source: "virtual"

Scenario B: Mixed (3 virtual, customer wants 10)
- Virtual count: 3 → 0
- Flower deduction: 4.9g (7 × 0.7g)
- Source: "mixed"
```

### **3. Metrics & Reporting:**
```
GET /wp-json/addify/v1/preroll/metrics

Response:
{
  "total_virtual_inventory": 150,
  "total_converted": 500,
  "total_sold": 485,
  "products_below_target": 3,
  "product_details": [...]
}
```

## 🎨 **Frontend Requirements**

### **1. Staff Conversion Interface**
- Product selector (flower products only)
- Pre-roll count input
- Location selector (optional)
- Notes field
- Current inventory display

### **2. Virtual Inventory Dashboard**
- Grid/list of products with:
  - Current virtual count
  - Target indicator (red/yellow/green)
  - Quick convert button
  - Activity history

### **3. POS Integration**
- Show virtual count on product cards
- Indicate source after sale (virtual/on-demand)

## 🚀 **Testing**

### **Test Conversion:**
```bash
curl -X POST https://api.floradistro.com/wp-json/addify/v1/preroll/convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 792,
    "preroll_count": 5,
    "location_id": 30
  }'
```

### **Check Virtual Inventory:**
```bash
curl https://api.floradistro.com/wp-json/addify/v1/preroll/inventory/792 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 **Benefits**

1. **Accurate Tracking**: Every pre-roll accounted for
2. **Efficiency**: Pre-roll in advance during slow times
3. **Flexibility**: Automatic fallback to on-demand
4. **Reporting**: Complete audit trail
5. **No Duplicate Products**: Single source of truth

## 🔒 **Security**

- Requires WordPress authentication
- Capability check: `manage_woocommerce` or `edit_shop_orders`
- Input validation on all endpoints
- Activity logging for accountability

## 📝 **Notes**

- Virtual inventory is location-agnostic (can be sold from any location)
- Flower deduction happens immediately upon conversion
- System prevents over-conversion (stock validation)
- Activity log limited to 100 entries to prevent database bloat
- All decimal quantities preserved throughout the system 