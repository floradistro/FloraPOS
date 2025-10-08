# AI Chat "fetch failed" Fix - Summary

## Problem
AI chat was intermittently showing:
```
⚠️ Error
fetch failed
Suggestion: Wait a moment and try again.
```

This occurred in **live production** (not local) on different basic requests, indicating Vercel-specific timeout/network issues.

## Root Cause
The `/api/ai/direct` route (which connects to Supabase + Claude API) had issues specific to Vercel production:
1. **No Vercel function timeout** configured (default 10s too short for streaming)
2. **Long Supabase timeout** (10s) with no retry logic
3. **Long Claude API timeout** (60s) blocking the function
4. **Long stream stall detection** (90s) causing hung connections
5. **No retry logic** for transient network failures
6. **Generic error messages** that didn't help debug production issues

## Fixes Applied

### 1. Vercel Function Timeout (60 seconds)
Added to `vercel.json`:
```json
{
  "functions": {
    "src/app/api/ai/direct/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 2. Supabase Connection with Retry (5s timeout, 2 attempts)
```typescript
// Retry up to 2 times with 5s timeout each
for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    const agentPromise = aiAgentService.getActiveAgent();
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Supabase timeout (5s)')), 5000)
    );
    
    agent = await Promise.race([agentPromise, timeoutPromise]);
    if (agent) break; // Success
  } catch (error: any) {
    console.warn(`⚠️ Supabase fetch attempt ${attempt} failed`);
    if (attempt < 2) await new Promise(r => setTimeout(r, 500)); // Wait before retry
  }
}
```

### 3. Claude API Connection Timeout (30 seconds)
```typescript
const abortController = new AbortController();
const connectionTimeout = setTimeout(() => {
  abortController.abort();
}, 30000); // 30s (reduced from 60s)

const response = await fetch(claudeEndpoint, {
  signal: abortController.signal,
  ...
});
```

### 4. Stream Stall Detection (45 seconds)
```typescript
let lastActivity = Date.now();
const streamTimeout = 45000; // 45s (reduced from 90s)

while (true) {
  if (Date.now() - lastActivity > streamTimeout) {
    throw new Error('Stream timeout - Claude API stopped responding');
  }
  
  const { done, value } = await reader.read();
  lastActivity = Date.now(); // Reset on data
  ...
}
```

### 5. Specific Error Messages
Now distinguishes between:
- **Network failures**: "Unable to connect to Claude API. Please check your internet connection"
- **Rate limits**: "Claude API rate limit exceeded. Please wait a moment"
- **API overload**: "Claude API is temporarily overloaded. Please try again"
- **Connection timeout**: "Connection to Claude API timed out"
- **Database errors**: "Database connection error"
- **Invalid API key**: "Invalid Claude API key"


## Testing

### Test in Production:
1. Basic query: "Hello, how are you?"
2. Complex query with long response
3. Multiple rapid requests (rate limit test)
4. Wait for timeout scenarios (if connection is slow)

### Expected Behavior:
- **Success**: Response streams normally
- **Network issue**: Clear error message about connection
- **Rate limit**: Specific message to wait and retry
- **Timeout**: Clear timeout message instead of generic "fetch failed"

## Architecture

```
User Query
    ↓
AIChatPanel.tsx (routes based on keywords)
    ↓
/api/ai/direct (for simple queries) ←— FIXED HERE
    ↓
1. Fetch agent from Supabase (10s timeout)
2. Connect to Claude API (60s timeout)
3. Stream response (90s stall detection)
    ↓
Return to frontend with specific errors
```

## Monitoring

Check server logs for these new log messages:
- `❌ Failed to fetch agent from Supabase:` - Database connection issues
- `❌ Claude API connection timeout (60s)` - Claude API not responding
- `❌ Stream stalled - no data for 90 seconds` - Stream interrupted
- `❌ Claude API error: 429` - Rate limiting
- `❌ Claude API error: 529` - API overloaded

## Rollback Plan
If issues persist, the previous version is in git history:
```bash
git log --oneline src/app/api/ai/direct/route.ts
git diff HEAD~1 src/app/api/ai/direct/route.ts
```

## Files Modified
- `/src/app/api/ai/direct/route.ts` - Reduced timeouts, added retry logic, better errors
- `/vercel.json` - Added maxDuration: 60s for AI endpoints

## Key Changes from First Fix

**First Fix** (worked locally, not in production):
- Long timeouts (60s Claude, 90s stream)
- No retry logic
- No Vercel function timeout config

**Second Fix** (optimized for production):
- ✅ Shorter timeouts (30s Claude, 45s stream) for faster failure detection
- ✅ Retry logic for Supabase (2 attempts × 5s)
- ✅ Vercel function timeout: 60s
- ✅ Better error messages for debugging

## Why It Failed in Production

Local works fine because:
- No Vercel function timeout limits
- No cold start delays
- Reliable local network to Supabase/Claude

Production failed because:
- Vercel default 10s timeout too short
- Network latency to Supabase/Claude APIs
- Long timeouts caused hung connections
- No retry logic for transient failures

## Next Steps
1. ✅ Deployed to production (commit af3519c)
2. Wait 2-3 minutes for Vercel deployment
3. Test on live production site
4. Monitor Vercel logs for timeout/error patterns
5. If still issues, may need to cache agent config

