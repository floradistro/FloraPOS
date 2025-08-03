# ACF-Based Customer Preferences System

## Overview

This system integrates customer preferences directly with your existing ACF (Advanced Custom Fields) structure, allowing staff to quickly save product attributes as customer preferences from cart items during checkout.

## 🚀 Key Features

### 1. **ACF Field Mapping**
- Automatically maps ACF fields to preference categories:
  - `strain_type` → Strain preferences
  - `effects` → Effect preferences  
  - `flavor` → Flavor preferences
  - `thca_%` → Potency preferences
  - `terpene` → Terpene preferences
  - `nose` → Aroma preferences
  - And more...

### 2. **Quick Add from Cart**
- **"Save Preferences" button** appears on cart items when customer is assigned
- Shows available ACF fields that can be saved as preferences
- Automatically excludes preferences customer already has
- One-click saving with automatic categorization

### 3. **Smart Display in Checkout**
- **Customer Preferences Quick View** shows automatically when customer is selected
- **Priority alerts** for allergies and medical needs (highlighted in red)
- **Organized display** of ACF-based preferences with visual categories
- **Product attribution** - shows which product each preference came from

### 4. **Seamless Integration**
- Works with your existing ACF field structure
- No changes needed to product data
- Stores preferences as WooCommerce user metadata [[memory:4547334]]
- Compatible with your current POS workflow

## 📋 Implementation

### Components Added:

1. **`CustomerPreferenceQuickView`** - Displays customer preferences in checkout
2. **`QuickAddToPreferences`** - Button to save ACF fields as preferences
3. **Updated Cart component** - Integrated preference display and quick-add functionality
4. **API endpoints** - For saving/retrieving preferences from WooCommerce

### Integration Points:

```tsx
// In your checkout flow
{assignedCustomer && (
  <CustomerPreferenceQuickView customer={assignedCustomer} />
)}

// In cart items
{assignedCustomer && (
  <QuickAddToPreferences
    customer={assignedCustomer}
    productId={item.id}
    productName={item.name}
    onAddPreference={handleAddPreference}
  />
)}
```

## 🎯 How It Works

### Step 1: Customer Selection
When a customer is assigned to the cart, their existing preferences automatically display.

### Step 2: Product in Cart
Cart items show a "Save Preferences" button with a count of available ACF fields that can be saved.

### Step 3: Quick Add
Staff clicks the button and sees a modal with:
- Available ACF fields from the product
- Mapped preference categories
- One-click "Add" buttons for each field

### Step 4: Automatic Learning
Preferences are saved with:
- The ACF field value
- Which product it came from
- Automatic categorization
- Staff member who added it

### Step 5: Future Visits
Next time the customer visits:
- Preferences display immediately in checkout
- Staff can see allergies/medical needs prominently
- Product recommendations can be based on learned preferences

## 📊 Demo Available

Visit `/demo-acf-preferences` to see the full system in action with:
- Mock customer with existing ACF-based preferences
- Interactive cart item with quick-add functionality
- Real-time preference updates
- Visual examples of all features

## 🔧 Technical Details

### ACF Field Mapping
```typescript
export const ACF_PREFERENCE_MAPPING: Record<string, PreferenceCategory> = {
  'strain_type': PreferenceCategory.STRAIN_TYPE,
  'effects': PreferenceCategory.EFFECTS,
  'flavor': PreferenceCategory.FLAVOR,
  'nose': PreferenceCategory.NOSE,
  'terpene': PreferenceCategory.TERPENE,
  'thca_%': PreferenceCategory.POTENCY,
  // ... more mappings
}
```

### Data Storage
- Preferences stored as WooCommerce user metadata: `_customer_preferences`
- Each preference includes ACF field key and source product ID
- API endpoints handle CRUD operations

### Smart Filtering
- Only shows ACF fields that map to preference categories
- Excludes fields customer already has as preferences
- Filters out empty or N/A values

## 💡 Benefits for Staff

1. **No Manual Entry** - Preferences learned automatically from purchases
2. **Safety First** - Allergies and medical needs prominently displayed
3. **Quick Reference** - All preferences visible during checkout
4. **Product Attribution** - Know which products customer liked
5. **Consistent Data** - Uses your existing ACF field structure

## 🎯 Use Cases

### Example 1: Customer Buys Blue Dream
- ACF fields: Strain Type: "Sativa", Effects: "Uplifting, Creative", Flavor: "Berry, Sweet"
- Staff clicks "Save Preferences" button
- Customer now has Sativa, Uplifting effects, and Berry flavor preferences
- Future visits show these preferences in checkout

### Example 2: Customer with Allergies
- Staff manually adds allergy preference: "Sensitive to high limonene"
- Shows prominently in red alert box during checkout
- Staff can avoid citrus-heavy strains

### Example 3: Regular Customer
- Over time, system learns customer prefers:
  - Indica strains for evening
  - High THC potency (20%+)
  - Earthy, pine flavors
- Staff can quickly recommend matching products

## 📈 Next Steps

1. **Test the demo** at `/demo-acf-preferences`
2. **Integrate components** into your existing checkout flow
3. **Connect API endpoints** to your WooCommerce backend
4. **Train staff** on using the quick-add feature
5. **Monitor usage** and refine preference categories as needed

## 🔗 Files Created/Modified

- `src/types/auth.ts` - Updated with ACF-based preference types
- `src/components/CustomerPreferenceQuickView.tsx` - Checkout display
- `src/components/QuickAddToPreferences.tsx` - Quick-add functionality  
- `src/components/Cart.tsx` - Integrated preferences into cart
- `src/app/api/customers/[customerId]/preferences/route.ts` - API endpoints
- `src/app/demo-acf-preferences/page.tsx` - Interactive demo

The system is now ready for integration into your existing POS workflow! 