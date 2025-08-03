# Customer Preferences - Integration Quick Start

## Quick Implementation Steps

### 1. **Add to Your Existing Checkout Component**

In your checkout/POS component where customers are selected, add:

```tsx
import CustomerPreferenceQuickView from '@/components/CustomerPreferenceQuickView'

// In your component where customer is selected:
{selectedCustomer && (
  <CustomerPreferenceQuickView customer={selectedCustomer} />
)}
```

### 2. **Add Preference Management to Customer Profile**

Create a customer profile page or modal:

```tsx
import CustomerPreferences from '@/components/CustomerPreferences'

// In your customer profile component:
<CustomerPreferences
  customer={customer}
  onUpdatePreferences={handleUpdatePreferences}
  canEdit={userHasPermission}
/>
```

### 3. **Connect to WooCommerce**

The API endpoints are ready to connect to WooCommerce's user metadata system:

```javascript
// Fetch preferences
const response = await fetch(`/api/customers/${customerId}/preferences`)
const { preferences } = await response.json()

// Update preferences
await fetch(`/api/customers/${customerId}/preferences`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ preferences })
})
```

## Demo Available

Visit `/demo-preferences` to see a working demo of the customer preferences system.

## Key Benefits for Your Staff

1. **Safety First**: Allergies and medical needs are highlighted in red
2. **Quick Reference**: All preferences visible during checkout
3. **Easy to Add**: Simple dropdown menus for common preferences
4. **Flexible**: Custom preferences for unique needs
5. **Persistent**: Saved to customer profile for future visits

## Next Steps

1. Test the demo at `/demo-preferences`
2. Integrate `CustomerPreferenceQuickView` into your checkout flow
3. Add preference management to your customer selection/profile area
4. Train staff on using the preference categories
5. Consider adding product filtering based on preferences 