# Vercel Credentials Fix

## Problem
Vercel has OLD credentials that don't work:
- `NEXT_PUBLIC_WC_CONSUMER_KEY` = `ck_0abd043d9bbb10574ccfff1d7bef2eb930255975` ❌ OLD/WRONG
- `NEXT_PUBLIC_WC_CONSUMER_SECRET` = `cs_9fa78aeb3a74ff77d4b8d392206ff1cab4e6bea7` ❌ OLD/WRONG

## Solution - Update in Vercel Dashboard

Go to: **Vercel → Project Settings → Environment Variables**

### Find and UPDATE these two variables:

1. **NEXT_PUBLIC_WC_CONSUMER_KEY**
   - Current value: `ck_0abd043d9bbb10574ccfff1d7bef2eb930255975`
   - NEW value: `ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5`
   - Apply to: **Preview only** (leave Production and Development as is)

2. **NEXT_PUBLIC_WC_CONSUMER_SECRET**
   - Current value: `cs_9fa78aeb3a74ff77d4b8d392206ff1cab4e6bea7`
   - NEW value: `cs_38194e74c7ddc5d72b6c32c70485728e7e529678`
   - Apply to: **Preview only** (leave Production and Development as is)

### How to Edit in Vercel Dashboard:

1. Click the **three dots** (⋯) next to the variable
2. Click **Edit**
3. Expand to see environment checkboxes
4. **UNCHECK** Production and Development
5. **CHECK** Preview only
6. Update the value
7. Click **Save**

### Alternative: Using Vercel CLI

```bash
# Remove old preview values
vercel env rm NEXT_PUBLIC_WC_CONSUMER_KEY preview
vercel env rm NEXT_PUBLIC_WC_CONSUMER_SECRET preview

# Add correct preview values
echo "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5" | vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY preview
echo "cs_38194e74c7ddc5d72b6c32c70485728e7e529678" | vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET preview
```

### After Updating:

Trigger a new deployment:
```bash
git commit --allow-empty -m "trigger: rebuild with correct credentials"
git push
```

## Verification

Once deployed, visit: `https://your-staging-url.vercel.app/api/check-env`

Should show:
```json
{
  "credentials": {
    "consumerKeyPreview": "ck_bb8e5fe..."
  }
}
```

