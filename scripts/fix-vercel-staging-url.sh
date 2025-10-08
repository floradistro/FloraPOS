#!/bin/bash
set -e

echo "🔧 Fixing Vercel STAGING_API_URL (doesn't exist, using production URL)..."
echo ""

cd /Users/whale/Desktop/FloraPOS-main

# Remove old preview staging URL
echo "Step 1: Removing NEXT_PUBLIC_STAGING_API_URL from preview..."
echo "y" | vercel env rm NEXT_PUBLIC_STAGING_API_URL preview || echo "Could not remove, may not exist"

echo ""
echo "Step 2: Adding correct NEXT_PUBLIC_STAGING_API_URL (production URL) for preview..."
echo "https://api.floradistro.com" | vercel env add NEXT_PUBLIC_STAGING_API_URL preview

echo ""
echo "✅ Staging URL updated to use production server!"
echo ""
echo "Now triggering redeploy..."
git commit --allow-empty -m "fix: use production URL for staging (staging.floradistro.com doesn't exist)" && git push

echo ""
echo "🚀 Deployment triggered!"

