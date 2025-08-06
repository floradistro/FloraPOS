# Vercel Environment Variables Setup

## Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Go to your project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar

## Step 2: Add These Environment Variables

Copy and paste each line as a separate environment variable:

### Required Variables:
```
NEXT_PUBLIC_WORDPRESS_URL=https://api.floradistro.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
JWT_SECRET=flora_pos_jwt_secret_2025_change_in_production
```

### Optional (but recommended):
```
WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
FLORA_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
FLORA_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
NEXT_PUBLIC_FLORA_API_URL=https://api.floradistro.com
```

## Step 3: Deploy
After adding the environment variables, redeploy your app:
- Either push a new commit to trigger auto-deploy
- Or click "Redeploy" in the Vercel dashboard

## Step 4: Test
Visit your live site and check:
- The login screen should show real store names (like "Blowing Rock")
- API calls should work properly
- No more fake "Charlotte Monroe" data

## Debug Endpoint
Visit `https://your-app.vercel.app/api/debug` to see:
- Which environment variables are set
- API connectivity status
- Any configuration issues

---

## What This Fixes:
✅ Real store names instead of fake "Charlotte Monroe"  
✅ Working API calls on production  
✅ Proper authentication  
✅ Dynamic store/location data  

The app will now fetch real store data from your API and show actual locations in the login/status bars.