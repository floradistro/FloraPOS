# Virtual Pre-Roll Frontend Implementation Guide

## Overview

The virtual pre-roll system has been integrated into the frontend, allowing staff to:
- View virtual pre-roll inventory on product cards
- Convert flower to virtual pre-rolls
- See availability status with visual indicators
- Track conversion history

## Components

### 1. VirtualPrerollSection Component
Located at: `src/components/VirtualPrerollSection.tsx`

Features:
- Displays current virtual pre-roll count vs target
- Visual progress bar with color coding:
  - 🔴 Red: No virtual pre-rolls (0)
  - 🟠 Orange: Below 50% of target
  - 🟡 Yellow: Between 50-100% of target
  - 🟢 Green: At or above target
- Conversion interface with gram calculation
- Shows lifetime stats (converted/sold)

### 2. ProductCard Updates
Modified: `src/components/ProductCard.tsx`

Enhancements:
- Integrated VirtualPrerollSection for flower products
- Pre-roll buttons show availability:
  - Green background with ✓ = Virtual pre-rolls ready
  - Hover tooltip shows availability status
- Visual distinction between ready and make-to-order

### 3. API Integration

#### Virtual Pre-Roll Conversion Endpoint
`POST /api/virtual-prerolls/convert`

Request:
```json
{
  "product_id": 773,
  "preroll_count": 10,
  "location_id": "30",
  "notes": "Morning prep"
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully converted 10 pre-rolls",
  "data": {
    "product_id": 773,
    "prerolls_created": 10,
    "flower_used": 7.0,
    "virtual_count_before": 0,
    "virtual_count_after": 10
  }
}
```

#### Check Virtual Inventory
`GET /api/virtual-prerolls/convert?product_id=773`

### 4. Custom Hook
`src/hooks/useVirtualPrerolls.ts`

Provides:
- `convertToPrerolls()` - Handle conversion with loading states
- `checkVirtualInventory()` - Get current virtual stock
- Error handling and loading states

## Usage Examples

### Basic Product Display
```tsx
<ProductCard
  product={flowerProduct}
  onAddToCart={handleAddToCart}
  // Virtual pre-roll section auto-displays for flower products
/>
```

### Manual Conversion
```tsx
const { convertToPrerolls } = useVirtualPrerolls()

await convertToPrerolls(
  productId,    // Product ID
  10,          // Number of pre-rolls
  locationId   // Optional location
)
```

## Visual Indicators

### Stock Status Colors
- **Green (✓ Ready)**: Virtual pre-rolls available
- **Orange**: Some virtual, need to make more
- **Default**: Must convert from flower

### Progress Bar
Shows virtual inventory vs target:
```
[████████░░] 8/10 🔄
```
Click refresh icon to open conversion panel.

## Testing

Visit `/test-virtual-prerolls` to see:
- Different virtual inventory scenarios
- Conversion interface behavior
- Visual status indicators
- Grid and list view displays

## Production Considerations

### 1. Authentication
The plugin endpoints require WordPress authentication. Current implementation uses mock data. For production:

```typescript
// Add WordPress auth token
const wpToken = await getWordPressAuthToken()
const response = await fetch('/wp-json/addify/v1/preroll/convert', {
  headers: {
    'Authorization': `Bearer ${wpToken}`
  }
})
```

### 2. Real-time Updates
Consider implementing:
- WebSocket for live inventory updates
- Polling for virtual count changes
- Optimistic UI updates

### 3. Permissions
Add role-based controls:
```tsx
{canConvert && (
  <VirtualPrerollSection 
    product={product}
    onConvert={handleConvert}
  />
)}
```

### 4. Batch Conversions
For efficiency, allow bulk conversions:
```tsx
<BulkConversionModal
  products={lowStockProducts}
  onBatchConvert={handleBatchConvert}
/>
```

## Styling

Uses VS Code theme colors:
- `vscode-bg`: Background
- `vscode-textMuted`: Secondary text
- `text-green-400`: Ready status
- `bg-green-900/30`: Virtual available button

## Next Steps

1. **Connect Real API**: Implement WordPress authentication
2. **Add Notifications**: Toast messages for conversion success/failure
3. **Activity Log**: Display conversion history
4. **Metrics Dashboard**: Overall virtual inventory analytics
5. **Mobile Optimization**: Responsive conversion interface 