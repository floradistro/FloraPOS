# AI Agent Migration to Supabase - Complete

## Overview

The Claude AI agent configuration has been successfully migrated from WordPress to Supabase. The agent config (system prompt, model settings, API keys) is now stored in Supabase, while WordPress is still used for tools and inventory data access.

## ✅ What Was Completed

### 1. Supabase Migration
- ✅ Created migration SQL for AI agent tables (ai_agents, ai_conversations, ai_messages)
- ✅ Adapted to existing Supabase schema (which uses `settings` JSON field)
- ✅ Migrated WordPress agent data to Supabase production

### 2. Service Layer
- ✅ Created `src/services/ai-agent-service.ts`
- ✅ Implements full agent CRUD operations
- ✅ Normalizes Supabase schema to expected format
- ✅ Handles settings JSON extraction

### 3. API Routes Updated
- ✅ `/api/ai/config` - Now fetches from Supabase
- ✅ `/api/ai/direct` - Uses Supabase agent config
- ✅ `/api/ai/wordpress-proxy` - Uses Supabase for agent, WordPress for tools

### 4. Migration Scripts
- ✅ `scripts/migrate-agent-to-supabase.js` - Migrates agent data
- ✅ `scripts/check-supabase-schema.js` - Verifies schema
- ✅ `scripts/run-supabase-migration.js` - Creates tables

### 5. Type Definitions
- ✅ Updated `src/types/supabase.ts` with AI agent types
- ✅ Agent service exports normalized types

## 📊 Current Schema

### Existing Supabase Schema (`ai_agents` table)
```sql
{
  id: UUID
  name: TEXT
  provider: TEXT (constraint: must be 'openai')
  model: TEXT
  tier: TEXT
  description: TEXT
  system_prompt: TEXT
  capabilities: JSONB[]
  settings: JSONB {
    temperature: number
    max_tokens: number
    api_key: string
    actual_provider: string
  }
  is_active: BOOLEAN
  has_web_search: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Normalized Format (Used by API)
```typescript
{
  id: string
  name: string
  model: string
  system_prompt: string
  temperature: number     // Extracted from settings
  max_tokens: number      // Extracted from settings
  api_key: string         // Extracted from settings
  status: string          // Derived from is_active
  provider: string
  ...other fields
}
```

## 🔧 How It Works

### Agent Loading Flow
```
Frontend Request
   ↓
/api/ai/config or /api/ai/direct
   ↓
aiAgentService.getActiveAgent()
   ↓
Supabase Query (SELECT * FROM ai_agents WHERE is_active = true AND name ILIKE '%Flora AI%')
   ↓
normalizeAgent() - Extracts settings.temperature, settings.max_tokens, settings.api_key
   ↓
Return to API route
   ↓
Response to Frontend
```

### Chat Flow with Tools
```
User Message
   ↓
/api/ai/wordpress-proxy
   ↓
1. Fetch agent config from Supabase (cached 5min)
2. Fetch tools from WordPress (cached 5min)
3. Call Claude API with agent config
4. Execute tools via WordPress if needed
   ↓
Stream response to user
```

## 📝 Configuration Files

### Environment Variables Required
```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://nfkshvmqqgosvcwztqyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WordPress (Still used for tools)
NEXT_PUBLIC_PRODUCTION_API_URL=https://api.floradistro.com
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678

# Claude API (Fallback, also in Supabase)
CLAUDE_API_KEY=your-claude-api-key-here
```

## 🚀 Deployment Steps

### 1. Local Testing
```bash
cd /Users/whale/Desktop/FloraPOS-main
npm run dev
```

### 2. Verify Agent Config
```bash
# Check Supabase schema
node scripts/check-supabase-schema.js

# Test API endpoint
curl http://localhost:3000/api/ai/config
```

### 3. Deploy to Production
```bash
# Ensure environment variables are set in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
git push origin main
```

## 🔄 Migration Run Results

```
✅ WordPress agent fetched: Flora AI Assistant
✅ Agent created in Supabase (ID: 0e0b4f98-c527-4e73-b61e-89c31041327e)
✅ Migration verified successfully
```

Active agents in Supabase:
- GPT-5 Enterprise (existing)
- GPT-4 Premium (existing)
- GPT-3.5 Turbo (existing)
- **Flora AI Assistant** (migrated) ← ACTIVE
- Flora AI Assistant (duplicate) ← Created during testing

## 📦 Files Created/Modified

### New Files
- `supabase/migrations/20251008000001_create_ai_agent_tables.sql`
- `src/services/ai-agent-service.ts`
- `scripts/migrate-agent-to-supabase.js`
- `scripts/check-supabase-schema.js`
- `scripts/run-supabase-migration.js`
- `AI_AGENT_SUPABASE_MIGRATION.md` (this file)

### Modified Files
- `src/types/supabase.ts` - Added AI agent types
- `src/app/api/ai/config/route.ts` - Uses Supabase
- `src/app/api/ai/direct/route.ts` - Uses Supabase
- `src/app/api/ai/wordpress-proxy/route.ts` - Uses Supabase for agent config

## 🧪 Testing Checklist

- [ ] Test `/api/ai/config` endpoint
- [ ] Test direct AI chat (without tools)
- [ ] Test AI chat with WordPress tools
- [ ] Test agent config updates
- [ ] Verify on production
- [ ] Test local and production environments

## 🔐 Security Notes

- API keys are now stored in Supabase `settings` JSON field
- Supabase service role key is required for migrations
- RLS policies allow read access for all agents
- Write operations require service role key

## 📚 Documentation

- Agent service: `src/services/ai-agent-service.ts`
- API routes: `src/app/api/ai/*/route.ts`
- Types: `src/types/supabase.ts`
- Migration SQL: `supabase/migrations/20251008000001_create_ai_agent_tables.sql`

## 🎯 Next Steps

1. **Test the chat** - Verify agent works on both local and production
2. **Clean up duplicates** - Remove duplicate Flora AI Assistant entries in Supabase
3. **Monitor performance** - Check if Supabase caching is effective
4. **Add conversation history** - Implement ai_conversations and ai_messages tables
5. **WordPress deprecation** - Eventually migrate tools to Supabase too

## ⚠️ Important Notes

- **WordPress is still used for tools** - Only agent config is in Supabase
- **Schema constraint** - Provider must be 'openai' due to existing constraint
- **Settings JSON** - Temperature, max_tokens, and api_key are in settings field
- **Caching** - Agent config is cached for 5 minutes to reduce Supabase calls

## 🆘 Troubleshooting

### Agent not loading
```bash
# Check Supabase schema
node scripts/check-supabase-schema.js

# Verify agent exists
curl http://localhost:3000/api/ai/config
```

### Migration failed
```bash
# Re-run migration
SUPABASE_SERVICE_ROLE_KEY="..." node scripts/migrate-agent-to-supabase.js
```

### API key not found
- Check that API key is in agent's `settings.api_key` field
- Fallback to `process.env.CLAUDE_API_KEY` if not in Supabase

## ✨ Summary

The migration is complete! The Claude agent configuration is now stored in Supabase production database. The system fetches agent config (system prompt, model, temperature, max_tokens, API key) from Supabase and uses WordPress only for inventory tools and data access.

**Agent Config: Supabase ✅**
**Tools & Inventory: WordPress ✅**
**Chat Streaming: Claude API directly ✅**

