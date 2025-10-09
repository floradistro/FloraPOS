# TV Live Preview Feature

## Overview
The TV Menu Control Panel now features **live previews** of what's actually displaying on each TV in real-time, plus visual feedback when pushing configurations.

## New Features

### 1. **Live TV Preview** (Per-TV)
Each online TV now has a "Show Live Preview" button that displays:
- Real-time iframe showing exactly what's on the TV
- 16:9 aspect ratio preview window
- Loading state while preview loads
- Refresh button to reload preview
- Auto-reloads when pushing config

### 2. **Pushing Animation**
When you push a config to a TV:
- Blue pulsing overlay appears on the preview
- "Pushing Config..." badge shows
- Preview automatically reloads after push completes
- Visual confirmation that action is in progress

### 3. **TV Dashboard - Grid View**
New dashboard showing all online TVs at once:
- Grid layout with live preview thumbnails
- TV number badges on each preview
- Click any TV to select and control it
- Real-time status indicators
- Shows count of pushing TVs
- Collapsible to save space

## Components Created

### TVPreview.tsx
```typescript
// Per-TV live preview component
<TVPreview
  tvId={tv.id}
  tvNumber={tv.tv_number}
  locationId={locationId}
  isOnline={isOnline}
  isPushing={isPushing} // Triggers push animation
/>
```

**Features:**
- Toggle to show/hide preview
- Live iframe of actual TV display
- Loading spinner
- Pushing animation overlay
- Manual refresh button
- Pointer events disabled (view-only)

### TVPreviewCard.tsx
```typescript
// Thumbnail preview for dashboard
<TVPreviewCard
  tvId={tv.id}
  tvNumber={tv.tv_number}
  locationId={locationId}
  isOnline={isOnline}
  onClick={() => selectTV(tv.id)}
/>
```

**Features:**
- Compact thumbnail view
- Scaled-down iframe (50% scale)
- Hover overlay with "Click to expand"
- Aspect ratio preserved

### TVDashboard.tsx
```typescript
// Grid view of all TVs
<TVDashboard
  tvDevices={tvDevices}
  isOnline={isOnline}
  onSelectTV={onSelectTV}
  selectedTV={selectedTV}
  pushingTVs={pushingTVs}
/>
```

**Features:**
- Responsive grid (2/3/4 columns)
- Shows only online TVs
- Selected TV highlighted with blue ring
- Pushing state shown on affected TVs
- Stats footer showing online/pushing counts
- Collapsible toggle button

## How It Works

### Push Config Flow
```
User clicks "Push Config"
    ↓
Add TV to pushingTVs Set
    ↓
Show loading toast
    ↓
Send command to TV
    ↓
Preview shows blue pulsing overlay
    ↓
Wait 2 seconds for TV to process
    ↓
Success toast appears
    ↓
Preview auto-reloads
    ↓
Remove TV from pushingTVs Set
    ↓
Overlay disappears
```

### Preview Updates
- **Initial Load**: Preview iframe loads TV display URL
- **On Push**: Iframe src is refreshed to show new config
- **Manual Refresh**: User can click refresh button anytime
- **Real-time**: Iframe content updates automatically via TV's own refresh

## User Experience

### Before
- Click "Push Config" → Wait → Hope it worked → Maybe check TV manually

### After
- Click "Push Config" → See loading toast → See blue pulse on preview → See success toast → Preview updates showing new config

## Visual Feedback Layers

### 1. Toast Notifications
- Loading state
- Success confirmation  
- Error alerts

### 2. Preview Animations
- Blue pulsing border during push
- "Pushing Config..." badge
- Loading spinner while preview loads

### 3. Dashboard Indicators
- Green online status
- Blue pushing status with count
- Selected TV highlighted with ring

## Performance Considerations

### Optimizations
1. **Lazy Loading**: Previews only load when expanded
2. **Pointer Events Disabled**: No interaction with iframe to prevent conflicts
3. **Scale Transform**: Dashboard thumbnails use CSS transform instead of loading twice
4. **Collapsible**: Dashboard can be collapsed to hide previews

### Resource Usage
- Each preview is an iframe loading the actual TV display page
- Dashboard shows up to ~10 TVs with scaled iframes
- Previews are view-only (pointer-events: none)
- Consider disabling dashboard for 20+ TVs

## Code Integration

### State Management
```typescript
// Track which TVs are being pushed to
const [pushingTVs, setPushingTVs] = useState<Set<string>>(new Set())

// Add TV to pushing state
setPushingTVs(prev => new Set(prev).add(tv.id))

// Remove TV from pushing state
setPushingTVs(prev => {
  const next = new Set(prev)
  next.delete(tv.id)
  return next
})
```

### Preview URL Construction
```typescript
const url = new URL('/menu-display', window.location.origin)
url.searchParams.set('location_id', locationId.toString())
url.searchParams.set('tv_number', tvNumber.toString())
```

### Iframe Refresh
```typescript
const iframe = document.getElementById(`tv-preview-${tvId}`) as HTMLIFrameElement
if (iframe) {
  iframe.src = iframe.src // Force reload
}
```

## UI Components

### Per-TV Preview Toggle Button
```
┌─────────────────────────────────┐
│ 📹 Show Live Preview          ▼ │
└─────────────────────────────────┘
```

### Expanded Preview
```
┌─────────────────────────────────┐
│ 📹 Hide Live Preview          ▲ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │    Live TV Display          │ │
│ │    (16:9 preview)           │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ Live Preview • Updates in real-time 🔄│
└─────────────────────────────────┘
```

### Pushing State
```
┌─────────────────────────────────┐
│ ╔═══════════════════════════╗   │
│ ║ 🔄 Pushing Config...      ║   │
│ ╠═══════════════════════════╣   │
│ ║  (Blue pulsing overlay)   ║   │
│ ╚═══════════════════════════╝   │
└─────────────────────────────────┘
```

### TV Dashboard
```
┌────────────────────────────────────────────────┐
│ 📺 Live TV Dashboard                         ▼ │
│ 3 online TVs • Real-time previews              │
├────────────────────────────────────────────────┤
│ ┌──────┐  ┌──────┐  ┌──────┐                  │
│ │ TV 1 │  │ TV 2 │  │ TV 3 │                  │
│ │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │                  │
│ │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │                  │
│ └──────┘  └──────┘  └──────┘                  │
│                                                │
│ • 3 Online    • 1 Pushing                      │
└────────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Click "Show Live Preview" on a TV - preview appears
- [ ] Click "Hide Live Preview" - preview collapses
- [ ] Push config to TV - blue overlay appears, then disappears
- [ ] Preview updates after push completes
- [ ] Manual refresh button works
- [ ] Dashboard shows all online TVs
- [ ] Dashboard collapses/expands
- [ ] Clicking TV in dashboard selects it
- [ ] Multiple TVs pushing shows count in dashboard
- [ ] Preview shows actual TV display content
- [ ] Preview is view-only (no interaction)

## Benefits

### For Users
- ✅ See exactly what's on each TV without walking to it
- ✅ Confirm config pushes worked instantly
- ✅ Monitor multiple TVs from one screen
- ✅ Troubleshoot display issues remotely

### For Developers
- ✅ Easy to debug TV display issues
- ✅ Visual confirmation of commands working
- ✅ Real-time monitoring of all TVs
- ✅ Better understanding of TV state

## Future Enhancements (Optional)

- Screenshot/thumbnail system for better performance
- Picture-in-picture mode for multi-monitor setups
- Preview history (show last 5 states)
- Side-by-side comparison (before/after push)
- Auto-screenshot on push success
- Preview annotations (highlight changes)

## Technical Details

### Security
- iframes are same-origin (localhost or same domain)
- pointer-events: none prevents interaction
- View-only, no control through preview

### Browser Support
- Works in all modern browsers
- Uses standard iframe API
- CSS transforms for scaling
- No special permissions needed

### Performance
- Lightweight (just iframes)
- Lazy loaded (only when expanded)
- Minimal CPU usage
- No video streaming (static pages)

---

**This feature transforms the TV control experience from blind command sending to visual, real-time management of your display network.**

