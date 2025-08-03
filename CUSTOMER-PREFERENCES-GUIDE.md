# Customer Preferences Tracking Guide

## Overview

This system allows staff to track customer preferences to provide personalized service and match inventory to customer needs when they visit your dispensary.

## Features

### 1. **Preference Categories**

Staff can track the following customer preferences:

- **Product Type**: Flower, Edibles, Concentrates, Vapes, etc.
- **Strain Type**: Indica, Sativa, Hybrid preferences
- **Potency**: THC/CBD level preferences
- **Flavor Profile**: Fruity, Earthy, Diesel, etc.
- **Consumption Method**: Smoking, Vaping, Edibles only
- **Medical Needs**: Pain relief, Anxiety, Sleep aid
- **Allergies**: Important allergy information [[memory:4547334]]
- **Budget**: Price range preferences
- **Custom**: Any other specific preferences

### 2. **Priority Alerts**

The system prioritizes important information:
- **Allergies** and **Medical needs** are highlighted in red
- These appear at the top of preference lists
- Staff see these immediately when serving the customer

### 3. **Quick View During Checkout**

When a customer is selected during checkout:
- Preferences appear automatically
- Important alerts (allergies/medical) show prominently
- Staff can quickly see all preferences to guide recommendations

## How to Use

### Adding Customer Preferences

1. **From WooCommerce Admin**:
   - Navigate to WooCommerce → Customers
   - Select a customer
   - Add preferences using custom fields

2. **From the POS System** (with implementation):
   - Select customer during checkout
   - Click "Add Preference" button
   - Choose category and enter details
   - Add notes for additional context

### Example Use Cases

#### Case 1: Customer with Nut Allergy
```
Category: Allergies
Value: Nut allergy - No edibles with nuts
Notes: Severe allergy, always check ingredients
```

#### Case 2: Medical User for Anxiety
```
Category: Medical Needs
Value: Anxiety Relief
Notes: Prefers high-CBD strains, avoid high THC

Category: Strain Type
Value: Indica-dominant
Notes: Best results with evening use
```

#### Case 3: Budget-Conscious Customer
```
Category: Budget
Value: Budget Friendly
Notes: Looking for deals, bulk discounts

Category: Product Type
Value: Flower
Notes: Prefers to buy in larger quantities
```

## Implementation Status

### ✅ Completed
- Customer preference data types
- UI components for viewing/editing preferences
- API structure for storing in WooCommerce
- Quick view component for checkout

### 🔄 To Implement
1. **Backend Integration**:
   - Connect API endpoints to WooCommerce
   - Test preference storage/retrieval
   
2. **Frontend Integration**:
   - Add preference display to checkout flow
   - Add edit capabilities to customer selection
   
3. **Product Matching**:
   - Auto-suggest products based on preferences
   - Filter inventory by customer preferences

## Technical Details

### Data Storage
- Preferences stored as WooCommerce user metadata
- Key: `_customer_preferences`
- Format: JSON array of preference objects

### API Endpoints
- `GET /api/customers/{id}/preferences` - Fetch preferences
- `PUT /api/customers/{id}/preferences` - Update all preferences
- `POST /api/customers/{id}/preferences` - Add single preference

### Components
- `CustomerPreferences.tsx` - Full preference management
- `CustomerPreferenceQuickView.tsx` - Compact checkout display

## Benefits

1. **Better Customer Service**: Staff can provide personalized recommendations
2. **Safety**: Allergy and medical information prevents issues
3. **Efficiency**: Quick access to preferences speeds up service
4. **Sales**: Match inventory to customer needs increases satisfaction
5. **Loyalty**: Customers appreciate personalized service

## Privacy Considerations

- Only authorized staff can view/edit preferences
- Preferences are stored securely in WooCommerce
- Medical information should be handled sensitively
- Follow local regulations for storing health data

## Next Steps

1. Test the implementation with sample customers
2. Train staff on using the preference system
3. Gather feedback and refine categories
4. Consider automated product recommendations based on preferences 