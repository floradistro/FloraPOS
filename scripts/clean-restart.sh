#!/bin/bash

# Clean Restart Script for FloraPOS
# This script completely clears all caches and restarts the dev server

echo "🧹 Stopping all Next.js processes..."
pkill -f "next" 2>/dev/null || true
sleep 2

echo "🗑️  Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

echo "🔄 Cleaning npm cache..."
npm cache clean --force

echo "🚀 Starting fresh dev server on port 3000..."
PORT=3000 npm run dev
