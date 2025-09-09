#!/bin/bash

echo "🧪 Testing Audit Batch Functionality"
echo "====================================="

# Test 1: Create audit batch
echo "1. Creating audit batch..."
BATCH_RESPONSE=$(curl -s -X POST "https://api.floradistro.com/wp-json/flora-im/v1/audit-batches?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_name": "Test Audit Batch",
    "batch_description": "Testing the audit batch functionality",
    "location_id": 20,
    "user_id": 1,
    "user_name": "Test User"
  }')

echo "Response: $BATCH_RESPONSE"

# Extract batch_id if successful
BATCH_ID=$(echo $BATCH_RESPONSE | jq -r '.batch_id // empty')

if [ ! -z "$BATCH_ID" ]; then
    echo "✅ Audit batch created successfully with ID: $BATCH_ID"
    
    # Test 2: Get batch details
    echo ""
    echo "2. Getting batch details..."
    curl -s "https://api.floradistro.com/wp-json/flora-im/v1/audit-batches/$BATCH_ID?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | jq .
    
    # Test 3: Complete the batch
    echo ""
    echo "3. Completing the batch..."
    curl -s -X PUT "https://api.floradistro.com/wp-json/flora-im/v1/audit-batches/$BATCH_ID?consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678" \
      -H "Content-Type: application/json" \
      -d '{"action": "complete"}' | jq .
    
else
    echo "❌ Failed to create audit batch"
    echo "Error: $BATCH_RESPONSE"
fi

echo ""
echo "4. Testing the full batch adjustment flow..."
curl -s -X POST "http://localhost:3000/api/inventory/batch-adjust" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_name": "Frontend Test Audit",
    "batch_description": "Testing from the frontend API",
    "location_id": 20,
    "user_id": 1,
    "user_name": "Frontend User",
    "adjustments": [
      {
        "product_id": 123,
        "variation_id": null,
        "adjustment_quantity": 1,
        "reason": "Test audit - small increase",
        "location_id": 20
      }
    ]
  }' | jq .
