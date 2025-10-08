#!/bin/bash

echo "🔧 Fixing Vercel Preview environment variables..."

# Remove old preview values
echo "Removing old preview values..."
vercel env rm NEXT_PUBLIC_WC_CONSUMER_KEY preview
vercel env rm NEXT_PUBLIC_WC_CONSUMER_SECRET preview
vercel env rm NEXT_PUBLIC_API_ENVIRONMENT preview
vercel env rm NEXT_PUBLIC_ENVIRONMENT preview

echo ""
echo "Adding correct preview values..."

# Add correct staging credentials for preview
echo "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY preview
echo "cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET preview
echo "staging" | vercel env add NEXT_PUBLIC_API_ENVIRONMENT preview
echo "staging" | vercel env add NEXT_PUBLIC_ENVIRONMENT preview

echo ""
echo "✅ Preview environment fixed!"
echo "🚀 Now redeploy your preview/staging branch"

