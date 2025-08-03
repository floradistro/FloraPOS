#!/bin/bash

# Test Addify Pre-roll Conversion API

API_URL="http://api.floradistro.com"
CONSUMER_KEY="ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
CONSUMER_SECRET="cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

# Base64 encode credentials
CREDENTIALS=$(echo -n "$CONSUMER_KEY:$CONSUMER_SECRET" | base64)

echo "Testing Addify Pre-roll Conversion API..."
echo "========================================"

# Test parameters
PRODUCT_ID=7851  # Replace with actual flower product ID
PREROLL_COUNT=5
LOCATION_ID=32   # Blowing Rock

echo "Converting $PREROLL_COUNT pre-rolls from product $PRODUCT_ID at location $LOCATION_ID"
echo ""

# Test conversion endpoint
echo "1. Testing conversion endpoint..."
RESPONSE=$(curl -s -X POST \
  "$API_URL/wp-json/addify/v1/preroll/convert" \
  -H "Authorization: Basic $CREDENTIALS" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": '$PRODUCT_ID',
    "preroll_count": '$PREROLL_COUNT',
    "location_id": '$LOCATION_ID',
    "notes": "Test conversion from shell script"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool

echo ""
echo "2. Checking virtual inventory..."
INVENTORY_RESPONSE=$(curl -s -X GET \
  "$API_URL/wp-json/addify/v1/preroll/inventory/$PRODUCT_ID" \
  -H "Authorization: Basic $CREDENTIALS")

echo "Inventory Response:"
echo "$INVENTORY_RESPONSE" | python3 -m json.tool

echo ""
echo "Test complete!" 