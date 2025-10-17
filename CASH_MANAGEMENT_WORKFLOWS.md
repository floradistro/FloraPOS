# Cash Management Workflows
## Visual Process Flows

---

## 🔄 Complete Daily Cash Flow

```
START OF DAY
     ↓
[Open Drawer]
     ↓
Enter Opening Float ($200-$350)
     ↓
✓ Drawer Open & Tracking
     ↓
┌─────────────────────────────┐
│   DURING BUSINESS HOURS     │
├─────────────────────────────┤
│                             │
│  Process Sales → Cash In    │
│        ↓                    │
│  Drawer Reaches $500?       │
│        ↓                    │
│  YES → [Record Cash Drop]   │
│        ↓                    │
│  Move $150-$300 to Safe     │
│        ↓                    │
│  Continue Sales             │
│                             │
└─────────────────────────────┘
     ↓
END OF DAY
     ↓
[Close Drawer]
     ↓
Count All Cash
     ↓
Record Total/Bills
     ↓
System Calculates Variance
     ↓
┌─────────────────┐
│  Variance OK?   │
└─────────────────┘
     ↓
YES → Green ✓ (0-$5)
NO  → Yellow ⚠ ($5-$10) or Red 🔴 (>$10)
     ↓
Document & Investigate
     ↓
✓ Drawer Closed
     ↓
Safe Deposit Next Day
```

---

## 📥 Opening Drawer Workflow

```
┌─────────────────────────────────────────┐
│          OPEN DRAWER PROCESS            │
└─────────────────────────────────────────┘

START: Beginning of Shift
         ↓
    [Check System]
         ↓
   Is drawer open? ◄─────┐
         ↓ NO            │ YES
   Navigate to          │
   Cash Management      │
         ↓              │
   Click "manage drawer"│
         ↓              │
   Click "open drawer"  │
         ↓              │
   ┌────────────────┐   │
   │ Enter Details: │   │
   │ • Register Name│   │
   │ • Float Amount │   │
   │ • Notes        │   │
   └────────────────┘   │
         ↓              │
   Count Starting Cash  │
         ↓              │
   Verify Amount Matches│
         ↓              │
   Click "open drawer"  │
         ↓              │
   ✓ DRAWER OPENED     │
         ↓              │
   System Shows:        │
   • Opening Float      │
   • Start Time         │
   • Register Name      │
         ↓              │
   Begin Transactions   │
         ↓──────────────┘
         ↓
    COMPLETE
```

---

## 💸 Cash Drop Workflow

```
┌─────────────────────────────────────────┐
│         CASH DROP PROCESS               │
└─────────────────────────────────────────┘

TRIGGER: Drawer Exceeds Limit
         ↓
   Count Drawer Cash
         ↓
   Amount > $500? ◄──────┐
         ↓ YES           │ NO
   [Record Cash Drop]    │
         ↓              │
   Open Drawer Widget    │
         ↓              │
   Click "record drop"   │
         ↓              │
   ┌────────────────┐   │
   │ Enter Details: │   │
   │ • Amount       │   │
   │ • Reason/Notes │   │
   └────────────────┘   │
         ↓              │
   Verify Amount        │
         ↓              │
   Click "record drop"  │
         ↓              │
   Remove Cash          │
         ↓              │
   Place in Safe        │
         ↓              │
   ┌────────────────┐   │
   │ Safe Drop Form │   │
   │ • Date/Time    │   │
   │ • Amount       │   │
   │ • Register #   │   │
   │ • Employee ID  │   │
   └────────────────┘   │
         ↓              │
   ✓ DROP RECORDED     │
         ↓              │
   System Updates:      │
   • Drops Total        │
   • Expected Cash      │
         ↓──────────────┘
         ↓
   Continue Sales
```

---

## 🔒 Closing Drawer Workflow

```
┌─────────────────────────────────────────┐
│        CLOSE DRAWER PROCESS             │
└─────────────────────────────────────────┘

START: End of Shift
         ↓
   Complete All Sales
         ↓
   [Close Drawer]
         ↓
   Open Drawer Widget
         ↓
   Click "close drawer"
         ↓
   ┌──────────────────┐
   │ Choose Method:   │
   ├──────────────────┤
   │ 1. Total Amount  │
   │ 2. Count Bills   │ ← RECOMMENDED
   └──────────────────┘
         ↓
   ╔═══════════════════════════════╗
   ║     COUNT BILLS METHOD        ║
   ╠═══════════════════════════════╣
   ║ 1. Remove All Cash            ║
   ║ 2. Sort by Denomination       ║
   ║ 3. Count Each Stack           ║
   ║                               ║
   ║ Enter Quantities:             ║
   ║ $100 × ___ = $___            ║
   ║  $50 × ___ = $___            ║
   ║  $20 × ___ = $___            ║
   ║  $10 × ___ = $___            ║
   ║   $5 × ___ = $___            ║
   ║   $1 × ___ = $___            ║
   ║                               ║
   ║ Total: $___.__               ║
   ╚═══════════════════════════════╝
         ↓
   Review Auto-Calculated Total
         ↓
   System Compares:
   • Expected: [Opening Float + Sales - Drops]
   • Actual: [Your Count]
         ↓
   ┌──────────────────┐
   │ Variance Check   │
   └──────────────────┘
         ↓
   ┌─────────────────────┐
   │ Is variance > $5?   │
   └─────────────────────┘
         ↓
   YES → Add Detailed Notes
         ↓
   Click "close drawer"
         ↓
   ✓ DRAWER CLOSED
         ↓
   System Records:
   • Close Time
   • Actual Amount
   • Variance
   • Notes
         ↓
   ┌─────────────────────┐
   │ Variance Report     │
   ├─────────────────────┤
   │ Green:   Perfect ✓  │
   │ Yellow:  Acceptable │
   │ Red:     Investigate│
   └─────────────────────┘
         ↓
   Print/Review Summary
         ↓
   COMPLETE
```

---

## 📊 Daily Reconciliation Workflow

```
┌─────────────────────────────────────────┐
│      DAILY RECONCILIATION FLOW          │
└─────────────────────────────────────────┘

START: End of Business Day
         ↓
   All Drawers Closed?
         ↓ YES
   Navigate to Cash Management
         ↓
   Click "reconciliation"
         ↓
   Select Today's Date
         ↓
   System Loads:
   ┌────────────────────┐
   │ All Day's Sessions │
   │ • Session 1        │
   │ • Session 2        │
   │ • Session 3        │
   └────────────────────┘
         ↓
   Review Each Session:
   ┌────────────────────┐
   │ Register 1         │
   │ Expected: $550.00  │
   │ Actual:   $548.00  │
   │ Variance: -$2.00✓  │
   └────────────────────┘
         ↓
   Identify Issues
         ↓
   ┌─────────────────┐
   │ Any Red Items?  │
   └─────────────────┘
         ↓ YES
   Investigate Immediately
         ↓
   • Review notes
   • Check transactions
   • Interview staff
   • Document findings
         ↓
   Calculate Day Total:
   • Total Expected: $____
   • Total Actual:   $____
   • Total Variance: $____
         ↓
   ┌──────────────────┐
   │ Acceptable?      │
   │ < $10 total var? │
   └──────────────────┘
         ↓ YES
   Sign Off on Day
         ↓
   ✓ RECONCILIATION COMPLETE
         ↓
   Prepare Deposit
```

---

## 💰 Weekly Deposit Workflow

```
┌─────────────────────────────────────────┐
│        WEEKLY DEPOSIT FLOW              │
└─────────────────────────────────────────┘

START: Weekly Deposit Day
         ↓
   Review Week in System
         ↓
   Click "deposits"
         ↓
   System Shows:
   ┌────────────────────┐
   │ Current Week:      │
   │ Mon:  $450.00     │
   │ Tue:  $380.00     │
   │ Wed:  $520.00     │
   │ Thu:  $410.00     │
   │ Fri:  $680.00     │
   │ Sat:  $890.00     │
   │ Sun:  $720.00     │
   │ ─────────────────  │
   │ Total: $4,050.00  │
   └────────────────────┘
         ↓
   Open Safe
         ↓
   Count All Cash
         ↓
   Sort by Denomination
         ↓
   Count Each:
   • $100s
   • $50s
   • $20s
   • $10s
   • $5s
   • $1s
         ↓
   Verify Matches System
         ↓
   ┌──────────────────┐
   │ Amounts Match?   │
   └──────────────────┘
         ↓ YES
   Prepare Deposit:
   • Fill out deposit slip
   • Seal in deposit bag
   • Record serial numbers
         ↓
   Complete Deposit
         ↓
   Update System:
   • Mark as deposited
   • Add receipt number
   • Upload receipt photo
         ↓
   ✓ DEPOSIT COMPLETE
         ↓
   File Documentation
```

---

## 🔍 Variance Investigation Flow

```
┌─────────────────────────────────────────┐
│     VARIANCE INVESTIGATION              │
└─────────────────────────────────────────┘

TRIGGER: Variance > $5
         ↓
   ┌────────────────────┐
   │ Variance Amount?   │
   └────────────────────┘
         ↓
   $5-$10 (Yellow) → Standard Review
   >$10 (Red)      → Immediate Investigation
         ↓
   ╔═══════════════════════════╗
   ║  INVESTIGATION STEPS      ║
   ╠═══════════════════════════╣
   ║                           ║
   ║ 1. RECOUNT                ║
   ║    • Sort cash again      ║
   ║    • Use bill method      ║
   ║    • Double-check math    ║
   ║         ↓                 ║
   ║ 2. REVIEW TRANSACTIONS    ║
   ║    • Check receipts       ║
   ║    • Verify sales total   ║
   ║    • Check refunds        ║
   ║         ↓                 ║
   ║ 3. CHECK DROPS            ║
   ║    • Verify drop amounts  ║
   ║    • Check safe records   ║
   ║    • Match paperwork      ║
   ║         ↓                 ║
   ║ 4. INTERVIEW               ║
   ║    • Talk to cashier      ║
   ║    • Any incidents?       ║
   ║    • Unusual activity?    ║
   ║         ↓                 ║
   ║ 5. DOCUMENT                ║
   ║    • Write detailed notes ║
   ║    • Include timeline     ║
   ║    • List actions taken   ║
   ║                           ║
   ╚═══════════════════════════╝
         ↓
   Determine Root Cause
         ↓
   Common Causes:
   • Counting error
   • Incorrect change
   • Missed transaction
   • Recording error
   • Theft (rare)
         ↓
   Take Corrective Action
         ↓
   Update Training if Needed
         ↓
   ✓ INVESTIGATION COMPLETE
         ↓
   File Report
```

---

## 🎓 Training Path

```
NEW EMPLOYEE TRAINING SEQUENCE
═════════════════════════════

Week 1: Observation
├─ Shadow experienced cashier
├─ Observe drawer opening
├─ Watch cash drop procedure
└─ See drawer closing

Week 2: Supervised Practice
├─ Open drawer (supervised)
├─ Process transactions
├─ Record cash drop (supervised)
└─ Close drawer (supervised)

Week 3: Independent with Backup
├─ Open drawer independently
├─ Record drops independently
├─ Close drawer independently
└─ Manager spot-check

Week 4: Full Independence
├─ All drawer operations
├─ Reconciliation tasks
└─ Train new hires

Ongoing: Quarterly Review
├─ Refresh training
├─ Review procedures
└─ Update for system changes
```

---

## 📈 Performance Metrics

```
CASH HANDLING SCORECARD
══════════════════════

Individual Performance:
┌────────────────────────────────┐
│ Metric              | Target   │
├────────────────────────────────┤
│ Variance Rate       | < $5     │
│ Over/Short Ratio    | < 1%     │
│ Drop Compliance     | 100%     │
│ Close Time          | < 10 min │
│ Documentation       | 100%     │
└────────────────────────────────┘

Store Performance:
┌────────────────────────────────┐
│ Metric              | Target   │
├────────────────────────────────┤
│ Daily Variance      | < $20    │
│ Weekly Variance     | < $50    │
│ Deposit Accuracy    | 100%     │
│ Reconciliation Time | < 30 min │
└────────────────────────────────┘
```

---

## 🚨 Emergency Procedures

```
CASH DISCREPANCY > $50
         ↓
STOP ALL OPERATIONS
         ↓
Notify Manager IMMEDIATELY
         ↓
Secure All Cash
         ↓
Do NOT Count Again
         ↓
Manager Witnesses Recount
         ↓
Document Everything
         ↓
Review Security Footage
         ↓
File Incident Report
```

---

**Version 1.0 | October 2025 | Flora POS**

