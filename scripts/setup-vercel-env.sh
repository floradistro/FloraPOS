#!/bin/bash

# Setup Vercel Environment Variables
# This script adds all required environment variables to Vercel

echo "🚀 Setting up Vercel environment variables..."

# Function to add env var
add_env() {
  local key=$1
  local value=$2
  echo "Adding $key..."
  echo "$value" | vercel env add "$key" preview production development 2>/dev/null || echo "  ⚠️  $key might already exist"
}

# API URLs
add_env "NEXT_PUBLIC_PRODUCTION_API_URL" "https://api.floradistro.com"
add_env "NEXT_PUBLIC_DOCKER_API_URL" "http://localhost:8080"
add_env "NEXT_PUBLIC_STAGING_API_URL" "https://api.floradistro.com"

# Environment settings
add_env "NEXT_PUBLIC_API_ENVIRONMENT" "staging"
add_env "NEXT_PUBLIC_ENVIRONMENT" "staging"

# WooCommerce credentials (client-side)
add_env "NEXT_PUBLIC_WC_CONSUMER_KEY" "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
add_env "NEXT_PUBLIC_WC_CONSUMER_SECRET" "cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

# WooCommerce credentials (server-side)
add_env "WC_CONSUMER_KEY" "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5"
add_env "WC_CONSUMER_SECRET" "cs_38194e74c7ddc5d72b6c32c70485728e7e529678"

echo ""
echo "✅ Environment variables setup complete!"
echo "📝 Now redeploy your application for changes to take effect"

