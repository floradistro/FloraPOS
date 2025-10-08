# Agent System Prompt Update - Seamless Artifact Handling

## What Was Updated

The Flora AI Assistant's system prompt has been enhanced to provide seamless artifact/code preview switching.

## Key Improvements

### 1. **Clear Code Block Formatting Rules**
   - Explicit instructions for `\`\`\`html`, `\`\`\`react`, and `\`\`\`javascript`
   - Code ONLY inside backticks, explanations outside
   - Complete examples for each code type

### 2. **Artifact Preview System Section**
   - Dedicated section at the top explaining artifact handling
   - Shows exact format for HTML, React, and Three.js
   - Emphasizes that code blocks automatically trigger preview

### 3. **Enhanced Examples**
   - Full working countdown timer example
   - Shows proper structure, styling, and interactivity
   - Demonstrates explanation placement (outside code blocks)

### 4. **Improved Editing Mode**
   - Clearer instructions when editing existing artifacts
   - Emphasis on preserving ALL existing code
   - Step-by-step editing workflow

### 5. **Best Practices Checklist**
   - Simple, focused code (150 lines HTML, 100 lines React max)
   - Proper HTML structure with DOCTYPE
   - Modern styling with flexbox/grid
   - Mobile-responsive design
   - Clean, professional aesthetics

## Before vs After

### Before (3,983 chars):
- Generic instructions
- Scattered formatting rules
- No clear artifact handling guidance
- Missing examples

### After (7,410 chars):
- **"ARTIFACT PREVIEW SYSTEM - CRITICAL"** section at top
- Step-by-step code block examples
- Complete working example
- Clear do's and don'ts
- Seamless preview emphasis

## How It Works

1. **User requests code** → "Create a button"
2. **Agent responds** with explanation + properly formatted code block
3. **Artifact viewer automatically detects** markdown code blocks
4. **Preview renders seamlessly** based on language tag (`html`, `react`, `javascript`)
5. **User sees live preview** immediately

## Testing

```bash
# Verify updated prompt is loaded
curl http://localhost:3000/api/ai/config | jq '.agent.system_prompt' | head -c 500

# Expected output: "You are Flora AI Assistant... ARTIFACT PREVIEW SYSTEM - CRITICAL..."
```

## Update Script

To update the prompt again in the future:

```bash
cd /Users/whale/Desktop/FloraPOS-main
node scripts/update-agent-prompt.js
```

Or edit directly in Supabase dashboard:
https://supabase.com/dashboard/project/nfkshvmqqgosvcwztqyq/editor

## Result

✅ **Seamless artifact switching** - Code blocks automatically trigger preview  
✅ **Clear formatting rules** - Agent knows exactly how to format code  
✅ **Complete examples** - Agent has working patterns to follow  
✅ **Consistent behavior** - Every code response follows the same format  
✅ **Better UX** - Users see live previews without manual switching  

## Cache Invalidation

The agent config API has a 5-minute cache. To force immediate refresh:

```bash
# Restart dev server or wait 5 minutes for cache to expire
# Cache key: 'agent-config-supabase'
```

## Production Deployment

The updated prompt is already in Supabase production database. When you deploy:

1. Vercel will use the production Supabase URL
2. Agent config will load with the new prompt
3. All AI chat responses will use the enhanced artifact handling
4. No additional deployment steps needed

---

**Updated:** October 8, 2025  
**Agent ID:** `0e0b4f98-c527-4e73-b61e-89c31041327e`  
**Prompt Length:** 7,410 characters

