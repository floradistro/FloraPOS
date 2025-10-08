#!/bin/bash
set -e

echo "🧹 Cleaning up Vercel Preview environment variables..."
echo ""
echo "⚠️  This will remove PREVIEW-ONLY environment variables"
echo "   Production and Development variables will remain untouched"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Removing preview-specific variables (type 'y' for each):"
echo ""

vercel env rm NEXT_PUBLIC_STAGING_API_URL preview
vercel env rm NEXT_PUBLIC_WC_CONSUMER_KEY preview
vercel env rm NEXT_PUBLIC_WC_CONSUMER_SECRET preview
vercel env rm NEXT_PUBLIC_API_ENVIRONMENT preview
vercel env rm NEXT_PUBLIC_ENVIRONMENT preview

echo ""
echo "✅ Preview environment variables cleaned up!"
echo "📝 Only Production and Development variables remain"
echo ""
echo "Note: Preview deployments from PRs will now use Production/Development variables"

