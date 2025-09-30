#!/bin/bash

# Automated WordPress Plugin Deployment
# Usage: ./deploy-plugin.sh plugin-name staging|production

PLUGIN_NAME=$1
ENVIRONMENT=$2

if [ -z "$PLUGIN_NAME" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./deploy-plugin.sh plugin-name staging|production"
    exit 1
fi

# Configuration
LOCAL_WP_PATH="$HOME/Desktop/wordpress-site"
PLUGIN_PATH="$LOCAL_WP_PATH/wp-content/plugins/$PLUGIN_NAME"

if [ "$ENVIRONMENT" = "staging" ]; then
    REMOTE_HOST="staging.api.floradistro.com"
    REMOTE_PATH="/staging-wordpress/wp-content/plugins/"
elif [ "$ENVIRONMENT" = "production" ]; then
    REMOTE_HOST="api.floradistro.com"
    REMOTE_PATH="/public_html/wp-content/plugins/"
else
    echo "Environment must be 'staging' or 'production'"
    exit 1
fi

echo "🚀 Deploying $PLUGIN_NAME to $ENVIRONMENT..."

# 1. Create plugin ZIP
cd "$LOCAL_WP_PATH/wp-content/plugins"
zip -r "$PLUGIN_NAME.zip" "$PLUGIN_NAME/"

# 2. Upload via SCP (you'll need SSH access)
# scp "$PLUGIN_NAME.zip" user@$REMOTE_HOST:$REMOTE_PATH

# 3. Extract and activate remotely
# ssh user@$REMOTE_HOST "cd $REMOTE_PATH && unzip $PLUGIN_NAME.zip && wp plugin activate $PLUGIN_NAME"

echo "✅ Plugin deployment prepared!"
echo "📦 ZIP file: $LOCAL_WP_PATH/wp-content/plugins/$PLUGIN_NAME.zip"
echo "📤 Upload this to your $ENVIRONMENT WordPress site"
