# Customer Name Capitalization Fix Script

## Problem
Customer names stored in ALL CAPS look unprofessional:
- `JOHN DOE` ❌
- `SARAH JOHNSON` ❌

Should be proper Title Case:
- `John Doe` ✅
- `Sarah Johnson` ✅

---

## Solution: Safe Bulk Fix Script

Created: `scripts/fix-customer-capitalization.js`

### Features
- ✅ **Dry-run by default** - Preview changes before applying
- ✅ **Safe** - Only fixes ALL CAPS names, skips mixed case
- ✅ **Comprehensive** - Fixes first name, last name, billing, shipping
- ✅ **Smart** - Converts to proper Title Case
- ✅ **Detailed** - Shows exactly what will change
- ✅ **Rate-limited** - 100ms between API calls
- ✅ **Error handling** - Continues on errors, reports at end

---

## Usage

### Step 1: Preview Changes (Dry Run)
```bash
node scripts/fix-customer-capitalization.js
```

**Output:**
```
🔧 Customer Name Capitalization Fixer

📋 DRY RUN MODE - No changes will be made
   Run with --apply to actually update customers

📥 Fetching customers...
   Fetched page 1: 100 customers
   Fetched page 2: 56 customers
✅ Total customers fetched: 156

📝 Customers that need fixing:

👤 Customer #123 (john@email.com)
   First Name: "JOHN" → "John"
   Last Name: "DOE" → "Doe"
   Billing First: "JOHN" → "John"
   Billing Last: "DOE" → "Doe"

👤 Customer #456 (sarah@email.com)
   First Name: "SARAH" → "Sarah"
   Last Name: "JOHNSON" → "Johnson"

📊 Summary: 23 customers need capitalization fixes

💡 Tip: Run with --apply to actually make these changes
```

### Step 2: Apply Changes (For Real)
```bash
node scripts/fix-customer-capitalization.js --apply
```

**Output:**
```
⚠️  APPLY MODE - Changes will be made!

📥 Fetching customers...
✅ Total customers fetched: 156

📝 Customers that need fixing:
[... shows changes ...]

⚠️  Proceeding to apply fixes in 3 seconds...

🔄 Applying fixes...

✅ [1/23] Updated customer #123
✅ [2/23] Updated customer #456
✅ [3/23] Updated customer #789
...

📊 Results:
   ✅ Successfully updated: 23
   ❌ Failed: 0
   📝 Total processed: 23

✅ Done! All capitalization fixes applied.
```

---

## What Gets Fixed

### Names Fixed
- ✅ `first_name`
- ✅ `last_name`
- ✅ `billing.first_name`
- ✅ `billing.last_name`
- ✅ `shipping.first_name`
- ✅ `shipping.last_name`

### Smart Detection
Only fixes if **entire name is ALL CAPS**:

| Original | Fixed? | Result |
|----------|--------|--------|
| `JOHN DOE` | ✅ Yes | `John Doe` |
| `SARAH` | ✅ Yes | `Sarah` |
| `John Doe` | ❌ No | `John Doe` (already good) |
| `John DOE` | ❌ No | `John DOE` (mixed - user intent unclear) |
| `McDonald` | ❌ No | `McDonald` (already proper) |

### Title Case Rules
- First letter of each word → Uppercase
- Rest of letters → Lowercase
- Examples:
  - `JOHN SMITH` → `John Smith`
  - `MARY O'BRIEN` → `Mary O'brien`
  - `JOSE RODRIGUEZ` → `Jose Rodriguez`

---

## Safety Features

1. **Dry Run Default**: Must explicitly use `--apply`
2. **Preview First**: Always shows what will change
3. **3-Second Warning**: Gives time to cancel before applying
4. **No Data Loss**: Only changes capitalization
5. **Selective**: Only touches ALL CAPS names
6. **Rate Limited**: Doesn't overwhelm API
7. **Error Resilient**: Continues even if some fail

---

## Options

### Verbose Mode
Show detailed API payloads:
```bash
node scripts/fix-customer-capitalization.js --apply --verbose
```

---

## Example Session

```bash
# Step 1: Check what needs fixing
$ node scripts/fix-customer-capitalization.js

📋 DRY RUN MODE
📊 Summary: 23 customers need capitalization fixes

# Step 2: Looks good, apply changes
$ node scripts/fix-customer-capitalization.js --apply

⚠️  APPLY MODE - Changes will be made!
⚠️  Proceeding to apply fixes in 3 seconds...
✅ Successfully updated: 23

# Step 3: Verify in dashboard
$ # Check customer view - names now look proper!
```

---

## Edge Cases Handled

### Names Already Proper
```
"John Doe" → No change (skipped)
"Sarah Johnson" → No change (skipped)
```

### Mixed Capitalization
```
"John DOE" → No change (unclear intent, safer to skip)
"JOHN doe" → No change (weird format, skip)
```

### Special Characters
```
"MARY O'BRIEN" → "Mary O'brien"
"JOSE-MARIA" → "Jose-Maria"
"MC DONALD" → "Mc Donald"
```

### Empty/Null Names
```
null → No change (skipped)
"" → No change (skipped)
```

---

## Technical Details

### API Used
- WooCommerce REST API v3
- Endpoint: `/wp-json/wc/v3/customers`
- Method: `PUT` for updates

### Rate Limiting
- 100ms delay between requests
- ~10 customers per second
- Safe for production

### Authentication
Uses credentials from script:
```javascript
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
```

---

## Troubleshooting

### Script Fails to Run
```bash
# Make sure it's executable
chmod +x scripts/fix-customer-capitalization.js

# Run with node directly
node scripts/fix-customer-capitalization.js
```

### API Errors
- Check credentials are correct
- Verify API URL is accessible
- Ensure WooCommerce API is enabled

### Too Many Changes
- Review dry-run output carefully
- Apply to a few customers first (edit script to limit)
- Always backup before bulk changes

---

## Best Practices

1. **Always Dry-Run First**: Never skip the preview
2. **Low Traffic Time**: Run during off-hours
3. **Backup First**: Backup customer database
4. **Monitor**: Watch for any errors during run
5. **Verify After**: Check a few customers in dashboard

---

## Files

- Script: `scripts/fix-customer-capitalization.js`
- Documentation: `CUSTOMER_CAPITALIZATION_FIX.md`

---

## Result

After running, your customer dashboard will look **professional**:

### Before
```
JOHN DOE
SARAH JOHNSON  
JOSE RODRIGUEZ
```

### After
```
John Doe
Sarah Johnson
Jose Rodriguez
```

Clean. Professional. Apple-like. ✨

---

**Status**: Ready to use
**Safety**: High (dry-run default)
**Impact**: Improves UI professionalism across entire app

