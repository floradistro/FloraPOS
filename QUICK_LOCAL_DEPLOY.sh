#!/bin/bash
# Quick Local Deployment Script for FloraPOS
# Run this on a computer at Charlotte (same network as terminal)

echo "🚀 FloraPOS Local Deployment"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Install from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in FloraPOS directory!"
    echo "Run: cd /path/to/FloraPOS-main"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Configuring environment..."

# Create .env.local with production WordPress but local terminal
cat > .env.local << 'EOF'
# WordPress Backend (Cloud)
NEXT_PUBLIC_WORDPRESS_URL=https://api.floradistro.com
NEXT_PUBLIC_API_ENVIRONMENT=production

# Local Terminal (Same Network)
NEXT_PUBLIC_TERMINAL_IP=http://192.168.1.229
NEXT_PUBLIC_USE_LOCAL_TERMINAL=true

# Supabase (Keep your existing config)
NEXT_PUBLIC_SUPABASE_URL=https://wvmkcbzspqxixjkxnxwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bWtjYnpzcHF4aXhqa3hueHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4MjI1NjUsImV4cCI6MjA0MTM5ODU2NX0.4zcuLOJHvONZfgHG0PJ2qG6rKyXFQnK1RDAxqCPMYr0
EOF

echo "✅ Environment configured"
echo ""

echo "🏗️  Building application..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "🎯 Starting FloraPOS..."
echo ""
echo "╔════════════════════════════════════════╗"
echo "║  FloraPOS is starting...               ║"
echo "║                                        ║"
echo "║  Open in browser:                      ║"
echo "║  http://localhost:3000                 ║"
echo "║                                        ║"
echo "║  Terminal: 192.168.1.229               ║"
echo "║  Backend: api.floradistro.com          ║"
echo "║                                        ║"
echo "║  Press Ctrl+C to stop                  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Start the server
npm start

