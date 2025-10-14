# Cannabis-Specific Dashboard KPIs

## Why Cannabis is Different

Traditional retail dashboards don't account for:
- **Perishable nature** - Cannabis ages and loses potency
- **Compliance requirements** - Product age tracking is critical
- **Category dynamics** - Flower vs Concentrates vs Edibles have different margins/velocity
- **Customer preferences** - Strain types, effects, and potency matter
- **Fast-moving landscape** - What's hot changes quickly

---

## New Cannabis KPIs Added

### 1. **Fast Movers** (7-Day Window) 🔥
**What it shows:** Number of products with sales in the last 7 days  
**Why it matters:** Cannabis trends change fast - this tells you what's hot RIGHT NOW  
**Staff action:** Stock up on fast movers, promote slow movers  

**Example:**
- Fast Movers: **15** products (out of 38 in stock)
- Tells staff: 40% of inventory is actively moving, 60% needs attention

---

### 2. **Product Mix** (Category Breakdown) 📊

**What it shows:** Visual breakdown of your inventory by category  
**Metrics per category:**
- Product count (how many SKUs)
- Total value ($ tied up in each category)
- Units sold (90-day velocity)

**Why it matters:**
- **Margin management** - Concentrates typically have higher margins than flower
- **Compliance** - Different categories have different regulations
- **Customer preferences** - Know if you're overstocked in one category

**Example Display:**
```
Concentrate        Edibles           Flower            Vape
   15 products        8 products       10 products      5 products
   $18.2k value      $8.4k value      $12.1k value     $2.9k value
   420 units sold    156 units sold   312 units sold   89 units sold
```

**Staff insights:**
- "We have too much capital in Concentrates - maybe discount slow movers"
- "Flower is selling well but low inventory value - restock opportunity"
- "Edibles are underperforming - review pricing or promotions"

---

### 3. **Inventory Health Score** (Compliance Focus) ✅

**Enhanced with cannabis age tracking:**
- **Fresh (0-7 days):** New stock, peak quality
- **Aging (7-14 days):** Still good, normal sell window
- **Stale (14-21 days):** Needs attention, consider promotion
- **Old (21+ days):** Compliance risk, urgent action needed

**Cannabis-specific actions:**
- Fresh: Premium pricing, feature in displays
- Aging: Standard operations
- Stale: 10-15% discount to move
- Old: Deep discount or return to supplier (if possible)

---

## Enhanced Metrics

### **Always Visible** (Hero + 5 Stats)
1. **Inventory Health Score (0-100)** - Overall condition
2. **Total Products** - SKU count
3. **In Stock** - Products available to sell
4. **Inventory Value** - Capital tied up
5. **Fast Movers** - ⭐ NEW - Hot products (7 days)
6. **Velocity** - Annual turnover rate

### **Show Details** (Expandable)

**Stock & Age:**
- Age distribution (fresh/aging/stale/old)
- Out of stock, low stock, at-risk products
- Total units

**Performance:**
- Sell-through rate
- Average stock level
- Fast movers detail
- Categories count

**Product Mix:** ⭐ NEW
- Category breakdown with value bars
- Sales velocity by category
- Capital allocation visibility

---

## Cannabis Staff Workflows

### **Morning Check (2 minutes)**
1. Look at **Inventory Health Score**
   - Green (80+): Everything good
   - Orange (40-79): Check aging products
   - Red (<40): Immediate action needed

2. Check **Fast Movers** count
   - Low number? Start promotions
   - High number? Ensure stock levels

3. Review **Action Required** alerts
   - Follow up on aging inventory

### **Weekly Review (10 minutes)**
1. Click **"Show Details"**
2. Review **Product Mix**
   - Are categories balanced?
   - Any overstock in low-velocity categories?
3. Check **Age Distribution**
   - Plan promotions for stale inventory
4. Review **Top 3 Performers**
   - Ensure adequate stock

### **Monthly Planning (30 minutes)**
1. Analyze **Category Mix** trends
   - Adjust purchasing based on value/sales ratio
2. Review **Inventory Health** over time
   - Identify chronic slow movers
3. Optimize **Fast Movers** strategy
   - Stock levels and pricing

---

## Real-World Cannabis Scenarios

### Scenario 1: Too Much Capital in Concentrates
**Dashboard shows:**
- Concentrates: 15 products, $18k value, 420 units sold
- Flower: 10 products, $12k value, 312 units sold

**Insight:** Concentrates have 1.5× more capital but only 1.3× more sales  
**Action:** Promote concentrate bundles, slow down concentrate purchasing

### Scenario 2: Aging Edibles
**Dashboard shows:**
- Health Score: 68 (fair)
- Old inventory: 29 products
- Edibles in "old" category: 8 products

**Insight:** Edibles aren't moving fast enough  
**Action:** 
- Weekend edibles sale (15% off)
- Create edibles gift packs
- Review pricing vs competitors

### Scenario 3: Fast Movers Trend
**Dashboard shows:**
- Fast Movers: 15 (last week) → 22 (this week)
- Health Score: 75 → 82

**Insight:** Inventory is turning over faster = healthy operation  
**Action:** Celebrate with staff, maintain momentum

### Scenario 4: Category Imbalance
**Dashboard shows:**
- Flower: 40% of products, 55% of sales
- Vape: 15% of products, 10% of sales

**Insight:** Vapes are underperforming relative to shelf space  
**Action:** 
- Reduce vape SKU count
- Expand flower selection
- Better vape placement/merchandising

---

## Technical Implementation

### Data Sources
✅ **Real-time from WooCommerce + Flora IM:**
- Product inventory (by location)
- Blueprint pricing (tiered pricing)
- Audit logs (90-day sales history)
- Category assignments
- Product age (from restock dates)

### Calculations
- **Fast Movers:** Products with negative audit entries in last 7 days
- **Category Mix:** Aggregated by category, filtered by location
- **Health Score:** Weighted algorithm (fresh=100%, aging=75%, stale=40%, old=0%)
- **All metrics:** Filtered to specific location (Charlotte Central = Location 20)

### Performance
- Dashboard loads in < 3 seconds
- All calculations client-side (no server load)
- Real data, no mock/fallback values
- Automatic refresh on view change

---

## Comparison: Before vs After

### **Before** (Traditional Retail)
- Generic metrics (total products, in stock, value)
- No cannabis-specific insights
- No fast-mover tracking
- No category mix visibility
- Staff had to manually calculate trends

### **After** (Cannabis-Optimized)
- ✅ Inventory Health Score (compliance-focused)
- ✅ Fast Movers (7-day trend indicator)
- ✅ Product Mix (category value/sales breakdown)
- ✅ Progressive disclosure (simple default, deep details on demand)
- ✅ Actionable insights (not just data dumps)

---

## Why This Matters

**For Staff:**
- Faster decision-making (2-min check vs 15-min spreadsheet review)
- Clear priorities (Action Required section)
- Cannabis-specific guidance (not generic retail advice)

**For Management:**
- Better capital allocation (Product Mix insights)
- Reduced waste (age tracking)
- Improved margins (category performance)

**For Compliance:**
- Product age visibility
- Automated alerts for old inventory
- Clear audit trail

---

## Future Enhancements (Roadmap)

### Phase 2: Strain Insights
- Top-selling strains (Indica/Sativa/Hybrid)
- Popular effects (Relaxing/Energizing/Creative)
- Potency distribution (THC ranges)

### Phase 3: Margin Intelligence
- Gross margin by category
- Price optimization recommendations
- Discount impact analysis

### Phase 4: Predictive Analytics
- Restock recommendations based on velocity
- Seasonal trend predictions
- Customer preference forecasting

---

*"The best dashboards don't just show data—they tell you what to do next."*

This cannabis-optimized dashboard transforms raw inventory data into actionable intelligence for dispensary staff.

