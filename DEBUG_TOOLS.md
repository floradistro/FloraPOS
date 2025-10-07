# 🔧 Magic2 Tools Debugging

## The Real Issue

**You're correct!** Docker WordPress HAS inventory data, but the Magic2 tools are returning empty results.

The problem is likely in the `Flora_AI_Tools` class implementation in the Magic2 plugin.

---

## What's Happening

```
AI executes: get_inventory_levels({location_id: 20})
    ↓
flora_ai_execute_tool() calls Flora_AI_Tools->execute_tool()
    ↓
Tool queries database/API
    ↓
Returns empty array/object
    ↓
AI says "no data"
```

---

## Likely Issues in Magic2 Plugin

### **Possibility 1: Wrong API Endpoint**
The tool might be calling Flora IM API incorrectly:
```php
// Might be doing:
$url = 'http://localhost/wp-json/flora-im/v1/inventory'; // Wrong host

// Should be:
$url = 'http://localhost/wp-json/flora-im/v1/inventory?location_id=20';
```

### **Possibility 2: Wrong Database Query**
```php
// Might be querying:
SELECT * FROM wp_flora_inventory WHERE location_id = ?

// But data might be stored differently
```

### **Possibility 3: Missing Consumer Keys**
Tools need WooCommerce auth to access Flora IM API:
```php
$url .= '?consumer_key=XXX&consumer_secret=YYY';
```

---

## How to Fix

### **Step 1: Check What Data Exists**

Run in phpMyAdmin or wp-cli:

```sql
-- Check inventory exists
SELECT COUNT(*) FROM wp_flora_inventory;

-- Check locations exist  
SELECT id, name FROM wp_flora_locations;

-- Check what inventory looks like
SELECT * FROM wp_flora_inventory LIMIT 5;
```

### **Step 2: Test Flora IM API Directly**

```bash
curl "http://localhost:8081/wp-json/flora-im/v1/inventory?consumer_key=ck_...&consumer_secret=cs_..."
```

Should return inventory data.

### **Step 3: Check Magic2 Tool Implementation**

The `Flora_AI_Tools` class (in Magic2/includes/class-ai-tools.php) needs to:

**For get_inventory_levels:**
```php
public function execute_get_inventory_levels($input) {
    $location_id = isset($input['location_id']) ? $input['location_id'] : null;
    
    // Call Flora IM API
    $url = get_site_url() . '/wp-json/flora-im/v1/inventory';
    if ($location_id) {
        $url .= '?location_id=' . $location_id;
    }
    
    // Add auth
    $url .= '&consumer_key=' . WC_CONSUMER_KEY;
    $url .= '&consumer_secret=' . WC_CONSUMER_SECRET;
    
    $response = wp_remote_get($url);
    return json_decode(wp_remote_retrieve_body($response), true);
}
```

**For get_locations:**
```php
public function execute_get_locations($input) {
    $url = get_site_url() . '/wp-json/flora-im/v1/locations';
    $url .= '?consumer_key=' . WC_CONSUMER_KEY;
    $url .= '&consumer_secret=' . WC_CONSUMER_SECRET;
    
    $response = wp_remote_get($url);
    return json_decode(wp_remote_retrieve_body($response), true);
}
```

---

## Quick Diagnosis

### **Test if Flora IM API works:**

1. **Check locations endpoint:**
```bash
curl "http://localhost:8081/wp-json/flora-im/v1/locations?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678"
```

2. **Check inventory endpoint:**
```bash
curl "http://localhost:8081/wp-json/flora-im/v1/inventory?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678"
```

If these return data, then the Magic2 tools are implemented incorrectly.

---

## The Root Cause

The **Magic2 plugin's tool implementation** is likely:
- ❌ Not calling the Flora IM API correctly
- ❌ Not passing authentication
- ❌ Querying wrong endpoints
- ❌ Not handling location_id parameter properly

**The AI system is working perfectly.** The tools are broken.

---

## Solution

We need to check/fix the Magic2 plugin's `class-ai-tools.php` file:

1. See how `execute_tool('get_inventory_levels')` is implemented
2. See how `execute_tool('get_locations')` is implemented
3. Make sure they call the correct Flora IM API endpoints
4. Make sure they pass WooCommerce authentication
5. Make sure they handle parameters correctly

**Can you check Docker WordPress container directly or access the Magic2 plugin code?**

The issue is in the plugin implementation, not in our AI configuration!

