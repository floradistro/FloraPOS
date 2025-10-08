#!/bin/bash
set -e

echo "🔧 Fixing Vercel Preview credentials via CLI..."
echo ""

cd /Users/whale/Desktop/FloraPOS-main

# Remove old preview credentials
echo "Step 1: Removing old NEXT_PUBLIC_WC_CONSUMER_KEY from preview..."
echo "y" | vercel env rm NEXT_PUBLIC_WC_CONSUMER_KEY preview || echo "Could not remove, may not exist"

echo ""
echo "Step 2: Removing old NEXT_PUBLIC_WC_CONSUMER_SECRET from preview..."
echo "y" | vercel env rm NEXT_PUBLIC_WC_CONSUMER_SECRET preview || echo "Could not remove, may not exist"

echo ""
echo "Step 3: Adding correct NEXT_PUBLIC_WC_CONSUMER_KEY for preview..."
echo "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY preview

echo ""
echo "Step 4: Adding correct NEXT_PUBLIC_WC_CONSUMER_SECRET for preview..."
echo "cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET preview

echo ""
echo "✅ Credentials updated for Preview environment!"
echo ""
echo "Now triggering redeploy..."
git commit --allow-empty -m "trigger: rebuild with correct preview credentials" && git push

echo ""
echo "🚀 Deployment triggered! Check Vercel dashboard for progress."

