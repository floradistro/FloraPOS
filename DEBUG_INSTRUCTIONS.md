# Dual Menu Column Debug Instructions

## What to Check:

1. **Open Browser Console** (Right-click → Inspect → Console tab)

2. **In Main Menu Page:**
   - Set Layout to "Horizontal"
   - Select categories for left and right menus (e.g., both "Flower")
   - Click on left side (white border should appear)
   - Use Column Selector to add columns (Lineage, Nose, Terpene, etc.)
   - Watch console for: `🔍 COLUMN CHANGE EVENT`
   - Click on right side
   - Add different columns
   - Click "Launch Dual Menu"
   - Watch console for: `🔍 LAUNCHING DUAL MENU`

3. **In TV Menu Window (popup):**
   - Watch console for these debug messages:
   - `🔍 DUAL MENU DEBUG - Starting column configuration parsing`
   - `🔍 DUAL MENU MODE DETECTED`
   - `🔍 DUAL MENU STATE CHECK`
   - `🔍 renderMenuSection called with categorySlug`
   - `🔍 Getting columns for category`

## Test Page:

1. Open `test-dual-menu.html` in browser
2. Click "Open Dual Menu Test" button
3. This will open a dual menu with pre-configured columns:
   - Left: name, lineage, nose, terpene
   - Right: name, type, lineage

## What Should Happen:

- The dual menu should show different columns on left vs right side
- Each category should display its configured columns
- Debug output should show columns being properly passed and retrieved

## Current Issue:

- Single menus work correctly with column selection
- Dual menus are not applying the column configurations
- Debug output will help identify where the columns are getting lost
