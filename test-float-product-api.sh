#!/bin/bash

# Test Float Product API

API_URL="http://api.floradistro.com"
CONSUMER_KEY="ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
CONSUMER_SECRET="cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

# Base64 encode credentials
CREDENTIALS=$(echo -n "$CONSUMER_KEY:$CONSUMER_SECRET" | base64)

echo "Testing Float Product API..."
echo "========================================"

# Test parameters
PRODUCT_ID=7851  # Replace with actual flower product ID
QUANTITY=5
LOCATION_ID=32   # Blowing Rock

echo "1. Getting float product info..."
curl -s -X GET \
  "$API_URL/wp-json/addify-mli/v1/float-products/$PRODUCT_ID?location_id=$LOCATION_ID" \
  -H "Authorization: Basic $CREDENTIALS" | python3 -m json.tool

echo ""
echo "2. Testing conversion endpoint..."
RESPONSE=$(curl -s -X POST \
  "$API_URL/wp-json/addify-mli/v1/float-products/convert" \
  -H "Authorization: Basic $CREDENTIALS" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": '$PRODUCT_ID',
    "quantity": '$QUANTITY',
    "location_id": '$LOCATION_ID'
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool

echo ""
echo "3. Checking updated inventory..."
curl -s -X GET \
  "$API_URL/wp-json/addify-mli/v1/float-products/$PRODUCT_ID?location_id=$LOCATION_ID" \
  -H "Authorization: Basic $CREDENTIALS" | python3 -m json.tool

echo ""
echo "Test complete!" 