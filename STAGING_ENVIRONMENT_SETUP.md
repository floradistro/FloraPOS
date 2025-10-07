# Staging Environment Setup

## Overview

The FloraPOS system now supports three API environments:
- **Docker** (localhost:8081) - Local development
- **Staging** - Testing/staging server
- **Production** - Live production server

## Required Environment Variables

Add the following to your `.env.local` file:

```bash
# API Environment URLs
NEXT_PUBLIC_PRODUCTION_API_URL=https://api.floradistro.com
NEXT_PUBLIC_STAGING_API_URL=https://staging.floradistro.com
NEXT_PUBLIC_DOCKER_API_URL=http://localhost:8081

# Default environment (docker, staging, or production)
NEXT_PUBLIC_API_ENVIRONMENT=docker

# WooCommerce API Credentials
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Scandit License
NEXT_PUBLIC_SCANDIT_LICENSE_KEY=your_scandit_key

# Build Environment
NEXT_PUBLIC_ENVIRONMENT=local
```

## Using the Environment Toggle

### Login Page
On the login page, you'll see an environment toggle that cycles through:
1. **Docker** (🐳) - localhost:8081
2. **Staging** (🚧) - Your staging server
3. **Production** (☁️) - Live production

Click "Switch to [Next Environment]" to cycle through the environments.

### Developer Dropdown (Main App)
The environment toggle is also available in the developer dropdown in the main application header.

## Environment Cycle

The toggle cycles in this order:
```
Docker → Staging → Production → Docker → ...
```

## Visual Indicators

- **Docker**: Orange (🐳) - Shows dev mode badge
- **Staging**: Yellow (🚧)
- **Production**: Blue (☁️)

## API Behavior

All API calls automatically route to the selected environment:
- WooCommerce API calls
- WordPress API calls
- Custom plugin endpoints
- Blueprint/pricing endpoints

The environment selection is persisted in localStorage and survives page refreshes.

## Important Notes

1. **Production Builds**: In production builds, the environment is locked to `production` and cannot be toggled (safety feature).

2. **Cache Management**: Each environment has its own cache, so switching environments will not mix data.

3. **Staging URL**: You need to set up a staging WordPress instance at the URL specified in `NEXT_PUBLIC_STAGING_API_URL`.

## Setup Steps

1. Create your `.env.local` file with all required variables
2. Set `NEXT_PUBLIC_STAGING_API_URL` to your staging server URL
3. Restart the development server: `npm run dev`
4. The toggle will now cycle through all three environments

## Troubleshooting

### Build Fails with Missing Environment Variable
If you get an error about missing `NEXT_PUBLIC_STAGING_API_URL`:
- Add the variable to your `.env.local` file
- If you don't have a staging server yet, you can temporarily set it to the same as production
- Restart your development server

### Environment Not Switching
- Check browser console for any errors
- Clear localStorage: `localStorage.removeItem('flora_pos_api_environment')`
- Refresh the page

### API Calls Going to Wrong Environment
- Open browser console and check the environment indicator
- Look for the "API Environment Config" box that shows current URLs
- Verify the `x-api-environment` header is being sent with requests

