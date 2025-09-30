#!/bin/bash

# Flora POS WordPress Deployment Script
# Deploy from local development to live api.floradistro.com

set -e

echo "🚀 Flora POS WordPress Deployment Pipeline"
echo "=========================================="

# Configuration
LOCAL_WP_PATH="$HOME/Desktop/wordpress-site"
LIVE_SITE_URL="https://api.floradistro.com"
LIVE_WP_PATH="/path/to/live/wordpress"  # You'll need to get this from Siteground

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "$LOCAL_WP_PATH/wp-config.php" ]; then
    print_error "Local WordPress not found at $LOCAL_WP_PATH"
    exit 1
fi

cd "$LOCAL_WP_PATH"

echo "📋 Deployment Options:"
echo "1. Deploy custom plugins only"
echo "2. Deploy custom themes only"
echo "3. Deploy database changes (DANGEROUS)"
echo "4. Full sync (plugins + themes + database)"
echo "5. Deploy specific plugin"

read -p "Choose deployment type (1-5): " DEPLOY_TYPE

case $DEPLOY_TYPE in
    1)
        echo "🔌 Deploying Custom Plugins..."
        # Deploy custom plugins
        if [ -d "wp-content/plugins/flora-pos-connector" ]; then
            print_status "Found Flora POS Connector plugin"
            # Here you'd rsync or scp to live site
            # rsync -avz wp-content/plugins/flora-pos-connector/ user@server:/path/to/live/wp-content/plugins/flora-pos-connector/
            echo "📦 Plugin ready for upload to live site"
        fi
        ;;
    2)
        echo "🎨 Deploying Custom Themes..."
        # Deploy custom themes
        ;;
    3)
        echo "🗄️  Database Deployment (USE WITH CAUTION)"
        print_warning "This will overwrite live database!"
        read -p "Are you absolutely sure? (yes/no): " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            # Export local database
            wp db export local-export.sql
            print_status "Database exported"
            echo "📤 Upload local-export.sql to live site and import manually"
        fi
        ;;
    4)
        echo "🔄 Full Sync"
        print_warning "This is a complete deployment - use carefully!"
        ;;
    5)
        read -p "Enter plugin name: " PLUGIN_NAME
        echo "🔌 Deploying plugin: $PLUGIN_NAME"
        ;;
esac

print_status "Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review changes locally first"
echo "2. Test on staging environment if available"
echo "3. Backup live site before deployment"
echo "4. Deploy during low-traffic hours"
echo ""
echo "🔗 Live Site: $LIVE_SITE_URL"
