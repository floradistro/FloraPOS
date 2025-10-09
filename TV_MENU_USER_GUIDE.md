# TV Menu Control - User Guide

## What's New

Your TV menu control panel now provides **instant visual feedback** for every action. No more wondering if buttons are working!

## Toast Notifications

All actions now show toast notifications in the bottom-right corner:

### Loading State
When you click any button, you'll immediately see:
```
⟳ Pushing config to TV 1...
```
This confirms your action was received.

### Success State
After the action completes (usually 1-3 seconds):
```
✓ Config pushed to TV 1
```

### Error State
If something goes wrong:
```
✗ Failed to push config to TV 1
```

## Button Actions with Feedback

### Individual TV Controls
When you select a TV and click buttons:

**Push Config Button**
- Click → Loading toast appears
- Wait 1-3 seconds → Success toast shows
- TV updates with new config

**Refresh Button**
- Click → Loading toast appears
- Wait 1-2 seconds → Success toast shows
- TV reloads immediately

### Network-Wide Controls

**Refresh TV List Button** (small button next to "Network TVs")
- Click → "Refreshing TV list..." toast
- Updates the list of online/offline TVs
- Shows "✓ TV list refreshed" when done

**Refresh All Button** (refreshes all local + network TVs)
- Click → "Refreshing X TVs..." toast
- Reloads all open TV windows and sends refresh command to network TVs
- Shows count: "✓ Refreshed 2 local + 3 network TVs"

**Push to Network TVs Button**
- Click → "Pushing config to X network TVs..." toast
- Sends your current config to all online network TVs
- Shows count: "✓ Config pushed to 3 network TVs"

## TV Status Updates

### Online/Offline Detection
- TVs now update their status every **10 seconds** (was 30 seconds)
- Status refreshes automatically every **5 seconds** (was 30 seconds)
- You'll see online/offline changes within **10-20 seconds**

### Green/Gray Indicators
- **Green dot** = TV is online (last seen within 20 seconds)
- **Gray dot** = TV is offline (no heartbeat for 20+ seconds)

## Performance Improvements

### Before
- ❌ No feedback when clicking buttons
- ❌ 30-second delays to see status changes
- ❌ Uncertain if commands were working
- ❌ Had to refresh manually to see updates

### After
- ✅ Instant feedback for all actions
- ✅ 5-10 second status updates
- ✅ Clear success/error messages
- ✅ Automatic real-time updates

## Tips for Best Experience

1. **Wait for the toast** - Loading toasts turn into success/error toasts in 1-3 seconds
2. **Watch the status dots** - They update every 5-10 seconds automatically
3. **Use "Refresh TV List"** - If you don't see a TV, click the refresh button
4. **Network TVs only** - Push Config only works on online network TVs (green dot)

## Troubleshooting

### "No online TVs found" toast
- Check if TVs are actually online (green dot)
- Try clicking "Refresh TV List" button
- TVs must have been online within the last 20 seconds

### Push Config not working
- Ensure the TV has a green dot (online)
- Wait for the success/error toast
- Check console for detailed logs

### TV not appearing
- Wait 10 seconds for automatic refresh
- Click "Refresh TV List" button
- Ensure TV display page is open and not minimized

## Command Execution Flow

```
You Click Button
    ↓
Loading Toast Appears (instant)
    ↓
Command Sent to Database
    ↓
TV Receives via WebSocket (instant)
OR TV Polls Every 5 Seconds (backup)
    ↓
TV Executes Command
    ↓
Success/Error Toast Appears
    ↓
Auto-dismiss after 3 seconds
```

## Real-Time Updates

The system uses multiple layers for reliability:

1. **Supabase Real-time** - Instant WebSocket updates
2. **5-Second Polling** - Backup in case WebSocket drops
3. **10-Second Heartbeats** - Keeps status fresh

This means even if one method fails, the others will keep working.

## Visual Feedback Colors

- **Green** = Success (config pushed, refresh sent)
- **Red** = Error (command failed, TV offline)
- **Gray** = Loading (action in progress)
- **Blue** = Info (general notifications)

All toasts auto-dismiss after 3 seconds, so you don't need to close them manually.

---

**Need Help?** Check the browser console for detailed logs. All commands are logged with 📺 emoji for easy filtering.

