#!/bin/bash

echo "🔧 Fixing Vercel Preview environment variables..."
echo ""
echo "⚠️  WARNING: This will remove these variables from ALL environments first,"
echo "    then re-add them with correct values per environment."
echo ""
echo "Variables to update:"
echo "  - NEXT_PUBLIC_WC_CONSUMER_KEY"
echo "  - NEXT_PUBLIC_WC_CONSUMER_SECRET"
echo "  - NEXT_PUBLIC_API_ENVIRONMENT"
echo "  - NEXT_PUBLIC_ENVIRONMENT"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Removing old variables..."
echo ""
echo "⚠️  For each prompt, type 'y' and press Enter"
echo ""

vercel env rm NEXT_PUBLIC_WC_CONSUMER_KEY
vercel env rm NEXT_PUBLIC_WC_CONSUMER_SECRET  
vercel env rm NEXT_PUBLIC_API_ENVIRONMENT
vercel env rm NEXT_PUBLIC_ENVIRONMENT

echo ""
echo "Step 2: Adding correct values..."
echo ""

# Production - keep production keys
echo "Adding PRODUCTION values..."
echo "ck_0abd043d9bbb10574ccfff1d7bef2eb930255975" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY production
echo "cs_9fa78aeb3a74ff77d4b8d392206ff1cab4e6bea7" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET production
echo "production" | vercel env add NEXT_PUBLIC_API_ENVIRONMENT production
echo "production" | vercel env add NEXT_PUBLIC_ENVIRONMENT production

# Preview - use staging keys
echo "Adding PREVIEW (staging) values..."
echo "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY preview
echo "cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET preview
echo "staging" | vercel env add NEXT_PUBLIC_API_ENVIRONMENT preview
echo "staging" | vercel env add NEXT_PUBLIC_ENVIRONMENT preview

# Development - use staging keys
echo "Adding DEVELOPMENT values..."
echo "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY development
echo "cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET development
echo "staging" | vercel env add NEXT_PUBLIC_API_ENVIRONMENT development
echo "staging" | vercel env add NEXT_PUBLIC_ENVIRONMENT development

echo ""
echo "✅ Done! Now redeploy:"
echo "   vercel --prod  (for production)"
echo "   git push       (for preview/staging)"

