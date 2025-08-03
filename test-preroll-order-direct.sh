#!/bin/bash

# Test script to create a pre-roll order with virtual pre-rolls
# This follows the exact path used in our successful tests

API_URL="https://api.floradistro.com"
API_KEY="ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
API_SECRET="cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

# Product to test - Lemon Cherry Gelato (766) which has virtual pre-rolls
PRODUCT_ID=766
PREROLL_COUNT=5
LOCATION_ID=30

echo "=== Creating Pre-roll Order Test ==="
echo "Product: Lemon Cherry Gelato (ID: $PRODUCT_ID)"
echo "Pre-rolls: $PREROLL_COUNT"
echo "Location: Charlotte Monroe (ID: $LOCATION_ID)"
echo ""

# First, check current virtual pre-roll inventory
echo "1. Checking current inventory..."
PRODUCT_DATA=$(curl -s -X GET \
    "$API_URL/wp-json/wc/v3/products/$PRODUCT_ID" \
    -u "$API_KEY:$API_SECRET")

VIRTUAL_COUNT=$(echo "$PRODUCT_DATA" | jq -r '.meta_data[] | select(.key=="_virtual_preroll_count") | .value // "0"')
STOCK=$(echo "$PRODUCT_DATA" | jq -r '.stock_quantity // 0')

echo "   Virtual pre-rolls available: $VIRTUAL_COUNT"
echo "   Flower stock: ${STOCK}g"
echo ""

# Create order with pre-roll metadata
echo "2. Creating order with pre-roll metadata..."

ORDER_JSON=$(cat <<EOF
{
  "payment_method": "cash",
  "payment_method_title": "Cash",
  "set_paid": true,
  "status": "processing",
  "billing": {
    "first_name": "Test",
    "last_name": "Customer",
    "email": "test@example.com"
  },
  "shipping": {
    "first_name": "Test",
    "last_name": "Customer"
  },
  "line_items": [
    {
      "product_id": $PRODUCT_ID,
      "quantity": 1,
      "meta_data": [
        {
          "key": "variation",
          "value": "preroll-$PREROLL_COUNT"
        },
        {
          "key": "_selected_variation",
          "value": "preroll-$PREROLL_COUNT"
        },
        {
          "key": "_preroll_count",
          "value": "$PREROLL_COUNT"
        },
        {
          "key": "_grams_per_preroll",
          "value": "0.7"
        },
        {
          "key": "selected_location",
          "value": "{\"selected_value\":\"$LOCATION_ID\",\"selected_text\":\"Charlotte Monroe Location\"}"
        },
        {
          "key": "_location_id",
          "value": "$LOCATION_ID"
        },
        {
          "key": "_virtual_prerolls_available",
          "value": "$VIRTUAL_COUNT"
        }
      ]
    }
  ],
  "meta_data": [
    {
      "key": "_order_source_platform",
      "value": "API Test"
    },
    {
      "key": "_order_source_location",
      "value": "Charlotte Monroe"
    }
  ]
}
EOF
)

echo "$ORDER_JSON" > order-data.json

ORDER_RESPONSE=$(curl -s -X POST \
    "$API_URL/wp-json/wc/v3/orders" \
    -u "$API_KEY:$API_SECRET" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON")

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id // "error"')

if [ "$ORDER_ID" != "error" ]; then
    echo "   ✅ Order created: #$ORDER_ID"
    
    # Check line item metadata
    echo ""
    echo "3. Order line item metadata:"
    echo "$ORDER_RESPONSE" | jq '.line_items[0].meta_data[] | {key: .key, value: .value}'
    
    # Wait a moment for processing
    sleep 2
    
    # Check updated inventory
    echo ""
    echo "4. Checking updated inventory..."
    UPDATED_PRODUCT=$(curl -s -X GET \
        "$API_URL/wp-json/wc/v3/products/$PRODUCT_ID" \
        -u "$API_KEY:$API_SECRET")
    
    NEW_VIRTUAL_COUNT=$(echo "$UPDATED_PRODUCT" | jq -r '.meta_data[] | select(.key=="_virtual_preroll_count") | .value // "0"')
    NEW_STOCK=$(echo "$UPDATED_PRODUCT" | jq -r '.stock_quantity // 0')
    
    echo "   Virtual pre-rolls after order: $NEW_VIRTUAL_COUNT (was $VIRTUAL_COUNT)"
    echo "   Flower stock after order: ${NEW_STOCK}g (was ${STOCK}g)"
    
    VIRTUAL_USED=$((VIRTUAL_COUNT - NEW_VIRTUAL_COUNT))
    FLOWER_USED=$((STOCK - NEW_STOCK))
    
    echo ""
    echo "5. Summary:"
    echo "   Virtual pre-rolls used: $VIRTUAL_USED"
    echo "   Flower deducted: ${FLOWER_USED}g"
    
    if [ $VIRTUAL_USED -gt 0 ]; then
        echo "   ✅ Virtual pre-rolls were used!"
    else
        echo "   ❌ Virtual pre-rolls were NOT used"
    fi
    
else
    echo "   ❌ Failed to create order"
    echo "$ORDER_RESPONSE" | jq '.'
fi

rm -f order-data.json 