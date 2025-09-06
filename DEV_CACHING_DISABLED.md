# 🚨 DEVELOPMENT CACHING CONFIGURATION

## CACHING ISSUES IDENTIFIED AND FIXED

### Problem
Multiple aggressive caching layers were preventing code changes from showing up during development:

1. **Service Worker**: Cached JavaScript for 24 hours
2. **React Query**: Cached API responses for 5-30 minutes  
3. **Next.js**: Build caching in `.next` folder
4. **Browser**: HTTP cache headers

### Changes Made for Development

#### 1. Service Worker (`public/sw.js`)
**Before**: 
- Static resources: 24 hours
- API calls: 2 hours / 30 minutes / 5 minutes

**After (DEV MODE)**:
- Static resources: 10 seconds
- API calls: 10 seconds / 5 seconds / 1 second

#### 2. React Query Cache Times (`src/constants/index.ts`)
**Before**:
- Categories: 2 hours
- Products: 5 minutes
- Customers: 15 minutes

**After (DEV MODE)**:
- Categories: 10 seconds
- Products: 1 second
- Customers: 5 seconds

#### 3. Data Patterns (`src/lib/data-patterns.ts`)
**Before**:
- Static: 30 minutes
- Dynamic: 5 minutes
- Realtime: 30 seconds

**After (DEV MODE)**:
- Static: 10 seconds
- Dynamic: 1 second
- Realtime: 0 (no cache)

## How to Clear All Caches for Development

### 1. Browser Cache
- **Chrome/Edge**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- **Or**: DevTools > Application > Storage > Clear site data

### 2. Service Worker
- **DevTools > Application > Service Workers > Unregister**
- **Or**: DevTools > Application > Storage > Clear site data

### 3. Next.js Build Cache
```bash
rm -rf .next
npm run dev
```

### 4. React Query Cache
- **Already handled by reduced cache times**
- **Or**: Use React Query DevTools to clear cache manually

## For Production Deployment

**⚠️ IMPORTANT**: Before deploying to production, revert these cache times to production values:

```javascript
// Production cache times (revert before deploy)
export const CACHE_TIMES = {
  CATEGORIES: 1000 * 60 * 120,      // 2 hours
  LOCATIONS: 1000 * 60 * 240,       // 4 hours
  TAX_RATES: 1000 * 60 * 60 * 24,   // 24 hours
  BLUEPRINT_ASSIGNMENTS: 1000 * 60 * 30, // 30 minutes
  PRODUCTS: 1000 * 60 * 5,          // 5 minutes
  CUSTOMERS: 1000 * 60 * 15,        // 15 minutes
} as const;
```

## Quick Development Workflow

1. **Make code changes**
2. **Hard refresh browser** (Cmd+Shift+R)
3. **Changes should appear within 1-10 seconds**
4. **No more incognito mode needed!**

## Files Modified
- `public/sw.js` - Service worker cache durations
- `src/constants/index.ts` - React Query cache times
- `src/lib/data-patterns.ts` - Data pattern cache times

## Verification
After these changes, code and data changes should be visible within seconds instead of minutes/hours.
