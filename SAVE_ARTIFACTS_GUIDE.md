# How to Save AI Artifacts - Complete Guide

## ✅ What's Working Now

The download icon in the artifact viewer is now a **SAVE button** that saves artifacts to your Supabase backend.

## How It Works

### 1. Generate Code in AI Chat
Ask the AI to create something:
- "Create a countdown timer"
- "Make a Matrix animation"
- "Build a React component"

### 2. Preview the Artifact
The AI will generate code and it will automatically preview in the artifact viewer.

### 3. Click the Save Icon (💾)
Look for the **archive/save icon** next to the download icon - it's already there!

### 4. Save Dialog Appears
You'll see a modal with:
- **Name** - Edit the artifact title
- **Description** - Add details about what it does
- **Code Preview** - See a preview of your code
- **Visibility Toggle** - Choose Personal or Company-Wide

### 5. Choose Visibility

**Personal Only** (Default - Lock Icon 🔒)
- Only you can see this artifact
- Saved to your personal collection
- Can publish later

**Company-Wide** (Globe Icon 🌐)
- Visible to ALL staff members
- Shows in global artifact library
- Others can fork/copy it

### 6. Click "Save Artifact"
Your artifact is saved to Supabase! ✅

## Where to Find Saved Artifacts

### Personal Artifacts
```bash
GET /api/artifacts?userId=your@email.com&scope=personal
```

### Global Artifacts
```bash
GET /api/artifacts?scope=global
```

### All (Personal + Global)
```bash
GET /api/artifacts?userId=your@email.com&scope=all
```

## Artifact Actions

### Publish (Make Global)
```javascript
// In your personal library, click "Publish"
await fetch(`/api/artifacts/${artifactId}/publish`, {
  method: 'POST'
});
// Now visible company-wide!
```

### Unpublish (Make Private)
```javascript
// Click "Unpublish" to make it personal again
await fetch(`/api/artifacts/${artifactId}/publish`, {
  method: 'DELETE'
});
```

### Fork (Copy to Personal)
```javascript
// In global library, click "Fork"
await fetch(`/api/artifacts/${artifactId}/fork`, {
  method: 'POST',
  body: JSON.stringify({ userId: user.email })
});
// Creates your own copy to edit
```

### Edit
```javascript
await fetch(`/api/artifacts/${artifactId}`, {
  method: 'PUT',
  body: JSON.stringify({
    title: 'Updated Title',
    code: 'updated code...',
    tags: ['updated']
  })
});
```

### Delete
```javascript
await fetch(`/api/artifacts/${artifactId}`, {
  method: 'DELETE'
});
```

## Technical Details

### Database Schema
```sql
ai_artifacts
  ├── id (UUID)
  ├── title (TEXT)
  ├── description (TEXT)
  ├── code (TEXT) - Full code
  ├── language (html|react|javascript|typescript)
  ├── artifact_type (visualization|component|utility|dashboard|tool|other)
  ├── created_by (TEXT) - User email
  ├── is_global (BOOLEAN) - Published status
  ├── tags (TEXT[]) - Array of tags
  ├── view_count (INTEGER)
  ├── fork_count (INTEGER)
  └── parent_artifact_id (UUID) - For forks
```

### Auto-Features

**Auto-Language Detection:**
- Code with JSX → `react`
- Code with TypeScript → `typescript`
- Code with HTML → `html`
- Pure JavaScript → `javascript`

**Auto-Categorization:**
- Three.js/Charts/Graphs → `visualization`
- React components/UI → `component`
- Timers/Calculators → `tool`
- Analytics/Dashboards → `dashboard`
- Helper functions → `utility`

**Auto-Tagging:**
- Always adds: `ai-generated`
- Adds language: `html`, `react`, etc.
- Adds source: `chat` (from AI chat) or `manual`
- Custom tags from form

## Example Flow

```
1. User: "Create a countdown timer"
   ↓
2. AI generates HTML code
   ↓
3. Artifact preview shows Matrix animation
   ↓
4. User clicks 💾 Save icon
   ↓
5. Modal appears:
   - Name: "Countdown Timer" ✓
   - Description: "10-minute timer with controls"
   - Visibility: Personal Only (can toggle to Company-Wide)
   ↓
6. User clicks "Save Artifact"
   ↓
7. POST /api/artifacts
   {
     userId: "staff@floradistro.com",
     title: "Countdown Timer",
     description: "10-minute timer with controls",
     code: "<!DOCTYPE html>...",
     language: "html",
     artifact_type: "tool",
     tags: ["ai-generated", "html", "chat"],
     is_global: false
   }
   ↓
8. Saved to Supabase! ✅
   - Artifact ID: UUID
   - View count: 0
   - Fork count: 0
   - Status: Personal
```

## Next: Build UI Pages

### Personal Library Page
```
/artifacts
  - List all personal artifacts
  - Filter by type, language, tags
  - Search by name
  - Quick actions: Edit, Delete, Publish, View
```

### Global Library Page
```
/artifacts/global
  - Browse all company-wide artifacts
  - See who created each one
  - View counts and fork counts
  - Fork to your collection
  - Filter and search
```

### Artifact Detail Page
```
/artifacts/[id]
  - Full code view
  - Live preview
  - Metadata (author, created date, stats)
  - Fork button (if global)
  - Edit button (if yours)
  - Publish/Unpublish toggle (if yours)
```

## Status

✅ **Backend Complete** - All APIs working  
✅ **Save Button Updated** - Connected to Supabase  
✅ **Database Ready** - Tables exist in production  
✅ **Personal/Global Toggle** - Working  
✅ **Build Passing** - Deployed to production  
🔄 **UI Pages** - Pending (optional, can use API directly)  

## Testing

```bash
# Try saving an artifact from AI chat
# 1. Generate some code
# 2. Click the save icon
# 3. Fill in details
# 4. Toggle Personal/Company-Wide
# 5. Save!

# Check it was saved
curl "http://localhost:3000/api/artifacts?userId=user@example.com&scope=personal"
```

---

**Updated:** October 8, 2025  
**Status:** ✅ Production Ready  
**Location:** Supabase Production Database
