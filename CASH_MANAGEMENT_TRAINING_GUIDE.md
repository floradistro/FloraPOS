# Cash Management Training Guide
## Flora POS - Register & Cash Drawer Management

---

## Table of Contents
1. [Overview](#overview)
2. [Accessing Cash Management](#accessing-cash-management)
3. [Opening a Drawer](#opening-a-drawer)
4. [Recording Cash Drops](#recording-cash-drops)
5. [Closing a Drawer](#closing-a-drawer)
6. [Bill Counting Method](#bill-counting-method)
7. [Daily Reconciliation](#daily-reconciliation)
8. [Weekly Deposits](#weekly-deposits)
9. [Best Practices](#best-practices)

---

## Overview

The Cash Management system helps you track all cash transactions at your registers. It manages:
- Opening and closing cash drawers
- Recording cash drops to the safe
- Daily reconciliation
- Tracking variances
- Managing deposits

---

## Accessing Cash Management

### Step 1: Navigate to Cash Management
1. From the main dashboard, click the **Cash Management** icon in the left sidebar
2. You'll see the main dashboard showing:
   - Total cash on hand
   - Cash in drawers (current session)
   - Cash in safe (ready for deposit)
   - Weekly accumulated cash
   - Pending deposits

![Cash Management Dashboard](screenshots/cash-dashboard.png)

### Step 2: View Details
- Click **"show details"** to see:
  - Current drawer session information
  - Recent sessions history
  - Quick action buttons

![Dashboard with Details](screenshots/cash-dashboard-details.png)

---

## Opening a Drawer

### When to Open a Drawer
- At the start of your shift
- When beginning a new register session
- After a previous drawer has been closed

### Step 1: Click "Manage Drawer"
From the cash management dashboard, click the **"manage drawer"** button.

![Manage Drawer Button](screenshots/manage-drawer.png)

### Step 2: Select "Open Drawer"
If no drawer is currently open, you'll see the **"open drawer"** option.

![Open Drawer Option](screenshots/open-drawer-view.png)

### Step 3: Enter Opening Information
Fill in the required information:
- **Register Name**: Identify your register (e.g., "Register 1", "Front Counter")
- **Opening Float**: The starting cash amount (typically $200-$350)
- **Notes** (optional): Any relevant information about this session

![Open Drawer Form](screenshots/open-drawer-form.png)

### Step 4: Confirm
Click the **"open drawer"** button to start your session.

### Result
Your drawer is now open and tracking all cash transactions for this session.

![Drawer Opened Successfully](screenshots/drawer-opened.png)

**What You'll See:**
- Register name
- Time opened
- Opening float amount
- Current cash sales (starts at $0.00)
- Drops to safe (starts at $0.00)
- Expected total

---

## Recording Cash Drops

### When to Record a Cash Drop
- When your drawer has too much cash (security risk)
- During busy periods (lunch/dinner rush)
- Following company policy (e.g., drops every $500)

### Step 1: Open Drawer Management
Click **"manage drawer"** from the dashboard.

### Step 2: Select "Record Cash Drop"
Click the **"record cash drop"** button.

![Record Cash Drop Button](screenshots/drawer-status.png)

### Step 3: Enter Drop Information
![Cash Drop Form](screenshots/cash-drop-form.png)

Enter:
- **Drop Amount**: How much cash you're moving to the safe
- **Notes** (optional): Reason for drop (e.g., "Lunch rush drop", "Exceeded $500")

### Step 4: Confirm
Click **"record drop"** to complete the transaction.

### Result
- The drop is recorded in your drawer session
- "Drops to safe" total is updated
- Cash is tracked as moved to the safe

---

## Closing a Drawer

### When to Close a Drawer
- End of your shift
- End of business day
- When switching cashiers
- During drawer reconciliation

### Step 1: Open Drawer Management
Click **"manage drawer"** from the dashboard.

### Step 2: Select "Close Drawer"
Click the **"close drawer"** button.

![Close Drawer Button](screenshots/drawer-status.png)

### Step 3: Choose Counting Method
You have two options:

#### Option A: Total Amount
Simply enter the total cash counted.

![Total Amount Method](screenshots/close-drawer-total.png)

#### Option B: Count Bills (Recommended)
Count each denomination for accuracy.

![Count Bills Method](screenshots/close-drawer-bills.png)

---

## Bill Counting Method

### Why Use Bill Counting?
- More accurate
- Creates an audit trail
- Easier to spot errors
- Automatic calculation

### Step 1: Select "Count Bills"
Click the **"count bills"** button.

![Bill Counting Interface](screenshots/bill-counting.png)

### Step 2: Enter Each Denomination
Count and enter the quantity of each bill type:
- **$100s**: Number of hundred-dollar bills
- **$50s**: Number of fifty-dollar bills
- **$20s**: Number of twenty-dollar bills
- **$10s**: Number of ten-dollar bills
- **$5s**: Number of five-dollar bills
- **$1s**: Number of one-dollar bills

### Example
If you have:
- 1 × $100 bill
- 2 × $50 bills
- 0 × $20 bills
- 0 × other bills

The system automatically calculates: **$200.00**

### Step 3: Review Total
The **"total counted"** field shows your calculated amount in real-time.

### Step 4: Add Notes (Optional)
If there's a variance, add a note explaining why:
- "Short $5 - customer change error"
- "Over $10 - found in register"
- "Test drawer close - comprehensive flow"

### Step 5: Close Drawer
Click **"close drawer"** to complete.

---

## Variance Indicators

After closing, the system shows your variance with color coding:

### ✅ Green (Perfect or Small)
- Variance: $0.00 - $5.00
- Meaning: Excellent! Drawer balanced correctly

![Zero Variance](screenshots/drawer-closed-zero-variance.png)

### ⚠️ Yellow (Moderate)
- Variance: $5.01 - $10.00
- Meaning: Acceptable but investigate

### 🔴 Red (Large)
- Variance: Over $10.00
- Meaning: Requires immediate attention and investigation

---

## Daily Reconciliation

### Accessing Reconciliation
1. Click **"reconciliation"** from the cash management dashboard

![Reconciliation Button](screenshots/reconciliation-button.png)

2. Select the date to reconcile

![Daily Reconciliation View](screenshots/daily-reconciliation.png)

### What You'll See
- All drawer sessions for that day
- Expected vs actual amounts
- Total variances
- Session details

### When No Sessions Found
The system will display: "no drawer sessions for this date"

---

## Weekly Deposits

### Accessing Deposits
1. Click **"deposits"** from the cash management dashboard

![Deposits Button](screenshots/deposits-button.png)

2. View current week's deposit information

![Weekly Deposits View](screenshots/weekly-deposits.png)

### What You'll See
- Current week total
- List of completed deposits
- Pending deposits
- Deposit history

---

## Best Practices

### 🎯 Daily Operations

1. **Start of Shift**
   - Open drawer immediately
   - Count opening float carefully
   - Document any issues

2. **During Shift**
   - Record cash drops when drawer exceeds policy limit
   - Add notes for any unusual transactions
   - Keep drawer organized

3. **End of Shift**
   - Use "count bills" method for accuracy
   - Document all variances
   - Close drawer promptly

### 📊 Reconciliation

1. **Daily Reconciliation**
   - Review all sessions at end of day
   - Investigate any variances over $5
   - Document patterns or recurring issues

2. **Weekly Review**
   - Check deposit totals
   - Review variance trends
   - Update procedures if needed

### 🔒 Security

1. **Cash Drops**
   - Drop cash when drawer exceeds $500
   - Always record drops immediately
   - Use safe deposit procedure

2. **Drawer Access**
   - Only assigned cashier accesses drawer
   - Close drawer when leaving station
   - Report discrepancies immediately

### 📝 Documentation

1. **Notes Field**
   - Always explain variances
   - Document unusual situations
   - Be specific and clear

2. **Audit Trail**
   - System tracks all transactions
   - Time-stamped entries
   - Full history available

---

## Troubleshooting

### Issue: Can't Open Drawer
**Solution**: Another drawer may be open. Close existing drawer first.

### Issue: Variance is Large
**Solution**: 
1. Recount cash using bill counting method
2. Check for recording errors
3. Review cash drop records
4. Document investigation in notes

### Issue: Missing Cash Drop
**Solution**: Record it immediately with accurate timestamp in notes.

### Issue: System Shows Wrong Register
**Solution**: Close incorrect drawer first, then open correct one.

---

## Quick Reference Card

### Opening Drawer
1. Click "manage drawer"
2. Click "open drawer"
3. Enter register name & opening float
4. Add notes (optional)
5. Click "open drawer"

### Recording Cash Drop
1. Click "manage drawer"
2. Click "record cash drop"
3. Enter drop amount
4. Add notes
5. Click "record drop"

### Closing Drawer
1. Click "manage drawer"
2. Click "close drawer"
3. Select "count bills"
4. Count each denomination
5. Review total
6. Add variance notes if needed
7. Click "close drawer"

---

## Support

For technical issues or questions:
- Contact IT Support
- Reference this guide
- Check system status indicator (bottom right: ☁️ PRODUCTION)

---

## Version Information

- **System**: Flora POS Cash Management
- **Guide Version**: 1.0
- **Last Updated**: October 17, 2025
- **API Environment**: Production (https://api.floradistro.com)

---

*This guide is for internal training purposes. Keep it accessible at all register stations.*

