#!/bin/bash

# Script to check the metadata of the last order

API_URL="https://api.floradistro.com"
API_KEY="ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
API_SECRET="cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

echo "=== Checking Last Order Metadata ==="
echo ""

# Get the last order
LAST_ORDER=$(curl -s -X GET \
    "$API_URL/wp-json/wc/v3/orders?per_page=1&orderby=date&order=desc" \
    -u "$API_KEY:$API_SECRET")

ORDER_ID=$(echo "$LAST_ORDER" | jq -r '.[0].id')
ORDER_NUMBER=$(echo "$LAST_ORDER" | jq -r '.[0].number')
ORDER_DATE=$(echo "$LAST_ORDER" | jq -r '.[0].date_created')
CREATED_VIA=$(echo "$LAST_ORDER" | jq -r '.[0].created_via')

echo "Last Order: #$ORDER_NUMBER (ID: $ORDER_ID)"
echo "Created: $ORDER_DATE via $CREATED_VIA"
echo ""

# Get line items
echo "Line Items:"
echo "$LAST_ORDER" | jq -r '.[0].line_items[] | "\nProduct: \(.name) (ID: \(.product_id))\nQuantity: \(.quantity)\nMetadata:"'

# Get line item metadata
echo ""
echo "Line Item Metadata Details:"
echo "$LAST_ORDER" | jq '.[0].line_items[0].meta_data[] | {key: .key, value: .value}' 