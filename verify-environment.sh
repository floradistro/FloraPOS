#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Flora POS Environment Setup Verification             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check .env files
echo "📁 Checking .env files..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local exists"
else
    echo "   ❌ .env.local missing"
fi

if [ -f .env.production ]; then
    echo "   ✅ .env.production exists"
else
    echo "   ❌ .env.production missing"
fi

if [ -f .env.example ]; then
    echo "   ✅ .env.example exists"
else
    echo "   ❌ .env.example missing"
fi

echo ""

# Check .gitignore
echo "🔒 Checking .gitignore..."
if grep -q ".env\*.local" .gitignore; then
    echo "   ✅ .env*.local is ignored"
else
    echo "   ❌ .env*.local not in .gitignore"
fi

echo ""

# Check .env.local values
echo "🔧 Checking .env.local configuration..."
if grep -q "NEXT_PUBLIC_ENVIRONMENT=local" .env.local; then
    echo "   ✅ Environment set to 'local'"
else
    echo "   ⚠️  Environment not set to 'local'"
fi

if grep -q "NEXT_PUBLIC_API_ENVIRONMENT=docker" .env.local; then
    echo "   ✅ API environment defaults to 'docker'"
else
    echo "   ⚠️  API environment not set to 'docker'"
fi

if grep -q "NEXT_PUBLIC_DOCKER_API_URL=http://localhost:8081" .env.local; then
    echo "   ✅ Docker URL is http://localhost:8081"
else
    echo "   ⚠️  Docker URL incorrect"
fi

echo ""

# Check Docker connection
echo "🐳 Checking Docker WordPress..."
if curl -s http://localhost:8081/wp-json > /dev/null 2>&1; then
    echo "   ✅ Docker WordPress is running on port 8081"
else
    echo "   ⚠️  Docker WordPress not accessible on port 8081"
    echo "      Run: docker ps"
fi

echo ""

# Check for hardcoded URLs in src
echo "🔍 Scanning for hardcoded API URLs in src..."
HARDCODED=$(grep -r "https://api\.floradistro\.com" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "\.env" | grep -v "api-config\.ts" | grep -v "server-api-config\.ts" | wc -l)
if [ "$HARDCODED" -eq "0" ]; then
    echo "   ✅ No hardcoded API URLs found (all use proxy)"
else
    echo "   ⚠️  Found $HARDCODED hardcoded API URLs - should use proxy"
fi

echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION COMPLETE                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. npm run dev  # Start dev server"
echo "2. Open http://localhost:3000"
echo "3. Check for ⚠️ DOCKER LOCAL badge (orange)"
echo "4. Check console for startup banner"
echo ""
