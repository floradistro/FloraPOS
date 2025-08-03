# Virtual Pre-Roll Integration Guide

## Overview
This guide explains how to integrate virtual pre-roll functionality with Addify Multi-Location Inventory for flower products. The system allows converting flower inventory into pre-rolls on-demand, tracking them per location.

## System Architecture

### 1. Product Structure
- **Flower Products**: Physical products with actual inventory (tracked in grams)
- **Virtual Pre-Roll Products**: Separate SKUs with no physical inventory
- **Conversion Rate**: Configurable grams per pre-roll (default: 0.7g)

### 2. Key Components

#### Frontend Components
- `VirtualPrerollSection`: UI component for managing pre-roll conversions
- `useVirtualPrerolls`: Hook for conversion operations
- `virtual-product-helpers`: Utility functions for pre-roll calculations

#### Backend API
- `/api/virtual-prerolls/convert`: Handles conversion requests
- Updates both product metadata and location-specific inventory

## Setup Instructions

### 1. Product Configuration in WooCommerce Admin

#### For Flower Products:
1. Go to **Products > Edit Product**
2. Navigate to **Inventory** tab
3. Enable **"Manage stock at product level"**
4. Enable **"Enable Multi Inventory Management"**
5. Set **Product Type** to "Weight"
6. Add **Pre-roll Conversion Rate** (e.g., 0.7 for 0.7g per pre-roll)

#### Product Metadata Required:
```
mli_preroll_conversion: 0.7  // Grams per pre-roll
_virtual_preroll_count: 0    // Current virtual inventory
_location_X_virtual_preroll_count: 0  // Per-location virtual count
```

### 2. Creating Virtual Pre-Roll Products

For each flower strain that supports pre-rolls:

1. Create a new product with SKU format: `[FLOWER-SKU]-PR`
2. Set as **Virtual Product** (no shipping required)
3. Set **Manage Stock** to false
4. Add metadata:
   ```
   _virtual_product: yes
   _product_type: preroll
   _source_flower_id: [ID of flower product]
   _conversion_rate: 0.7
   ```

### 3. Frontend Integration

The `VirtualPrerollSection` component automatically appears on flower product cards when:
- Product is in the "flower" category
- Product has `mli_preroll_conversion` > 0
- Product has stock available

```tsx
<VirtualPrerollSection 
  product={flowerProduct}
  linkedPrerollProduct={virtualPrerollProduct}
  onConvert={handleConversion}
  onConversionSuccess={refreshInventory}
/>
```

### 4. Location-Specific Tracking

The system tracks virtual pre-rolls per location:
- Global count: `_virtual_preroll_count`
- Location-specific: `_location_[ID]_virtual_preroll_count`

### 5. POS Integration

For POS systems:
1. When selling pre-rolls, check virtual inventory first
2. If insufficient virtual stock, convert on-demand
3. Deduct from flower inventory: quantity × conversion_rate

## API Usage

### Convert Flower to Pre-Rolls
```javascript
POST /api/virtual-prerolls/convert
{
  "product_id": 123,
  "preroll_count": 5,
  "location_id": "32",
  "notes": "Manual conversion for customer"
}
```

### Check Virtual Inventory
```javascript
GET /api/virtual-prerolls/convert?product_id=123&location_id=32
```

Response:
```json
{
  "success": true,
  "data": {
    "virtual_ready": 10,
    "can_make": 14,
    "total_available": 24,
    "flower_stock": 10.5,
    "conversion_rate": 0.7
  }
}
```

## Inventory Calculations

### Available Pre-Rolls
```
Virtual Ready = Already converted pre-rolls
Can Make = floor(flower_stock / conversion_rate)
Total Available = Virtual Ready + Can Make
```

### Conversion Impact
```
Flower Used = preroll_count × conversion_rate
New Flower Stock = current_stock - flower_used
New Virtual Count = current_virtual + preroll_count
```

## Best Practices

1. **Set Realistic Conversion Rates**: Account for loss during rolling
2. **Monitor Virtual Inventory**: Track conversions per location
3. **Regular Audits**: Reconcile virtual counts with physical pre-rolls
4. **Staff Training**: Ensure staff understand the conversion process

## Troubleshooting

### Common Issues

1. **Conversion Fails**
   - Check flower stock availability
   - Verify conversion rate is set
   - Ensure location has inventory

2. **Virtual Count Mismatch**
   - Check location-specific vs global counts
   - Review conversion activity logs
   - Verify POS deduction logic

3. **Product Not Showing Pre-Roll UI**
   - Confirm product is in flower category
   - Check mli_preroll_conversion meta exists
   - Verify stock quantity > 0

## Testing

Use the test page at `/test-flower-prerolls` to:
- View all flower products with conversion capability
- Test conversion functionality
- Verify location-specific tracking
- Check inventory calculations

## Future Enhancements

1. **Batch Conversions**: Convert multiple strains at once
2. **Conversion History**: Track all conversions with timestamps
3. **Automatic Restock**: Convert when virtual inventory is low
4. **Multi-Size Pre-Rolls**: Support different pre-roll sizes
5. **Waste Tracking**: Account for material loss during conversion 