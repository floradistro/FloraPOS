# Vercel Environment Variables Setup

## Critical: Set These in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

### Required for ALL Environments (Production, Preview, Development)

```
NEXT_PUBLIC_PRODUCTION_API_URL=https://api.floradistro.com
NEXT_PUBLIC_DOCKER_API_URL=http://localhost:8080
NEXT_PUBLIC_STAGING_API_URL=https://api.floradistro.com

NEXT_PUBLIC_WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678

WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```

### For Staging/Preview Deployments
```
NEXT_PUBLIC_API_ENVIRONMENT=staging
NEXT_PUBLIC_ENVIRONMENT=staging
```

### For Production Deployments
```
NEXT_PUBLIC_API_ENVIRONMENT=production
NEXT_PUBLIC_ENVIRONMENT=production
```

## Using Vercel CLI (Alternative)

```bash
# For all environments
vercel env add NEXT_PUBLIC_PRODUCTION_API_URL
# Enter: https://api.floradistro.com
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_DOCKER_API_URL
# Enter: http://localhost:8080
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_STAGING_API_URL
# Enter: https://api.floradistro.com
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_WC_CONSUMER_KEY
# Enter: ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_WC_CONSUMER_SECRET
# Enter: cs_38194e74c7ddc5d72b6c32c70485728e7e529678
# Select: Production, Preview, Development

vercel env add WC_CONSUMER_KEY
# Enter: ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
# Select: Production, Preview, Development

vercel env add WC_CONSUMER_SECRET
# Enter: cs_38194e74c7ddc5d72b6c32c70485728e7e529678
# Select: Production, Preview, Development

# For preview/staging
vercel env add NEXT_PUBLIC_API_ENVIRONMENT
# Enter: staging
# Select: Preview

vercel env add NEXT_PUBLIC_ENVIRONMENT
# Enter: staging
# Select: Preview

# For production
vercel env add NEXT_PUBLIC_API_ENVIRONMENT
# Enter: production
# Select: Production

vercel env add NEXT_PUBLIC_ENVIRONMENT
# Enter: production
# Select: Production
```

## After Setting Variables

1. Redeploy your application: `vercel --prod` or trigger a new deployment via GitHub
2. Variables with `NEXT_PUBLIC_` prefix are embedded at **build time** - you MUST redeploy after changing them
3. Variables without `NEXT_PUBLIC_` prefix are available at **runtime** in API routes

## Verify Environment Variables

Add this API route to check: `/api/check-env`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasProductionUrl: !!process.env.NEXT_PUBLIC_PRODUCTION_API_URL,
    hasDockerUrl: !!process.env.NEXT_PUBLIC_DOCKER_API_URL,
    hasStagingUrl: !!process.env.NEXT_PUBLIC_STAGING_API_URL,
    hasConsumerKey: !!process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
    hasConsumerSecret: !!process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
    hasServerConsumerKey: !!process.env.WC_CONSUMER_KEY,
    hasServerConsumerSecret: !!process.env.WC_CONSUMER_SECRET,
    apiEnvironment: process.env.NEXT_PUBLIC_API_ENVIRONMENT,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  });
}
```

