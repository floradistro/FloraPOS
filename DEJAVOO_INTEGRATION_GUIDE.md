# Dejavoo WizarPOS QZ Cloud Terminal Integration Guide

## 🚀 Complete Implementation Summary

This integration adds industry-standard POS terminal support with Dejavoo WizarPOS QZ cloud terminals to FloraPOS.

### Architecture Reference
Based on [Dejavoo SPIn REST API](https://app.theneo.io/dejavoo/spin/spin-rest-api-methods)

---

## 📦 What Was Built

### 1. **Database Layer** ✅

#### WordPress Tables (MySQL):
- `wp_flora_pos_terminals` - Terminal registry
- `wp_flora_payment_processors` - Processor configurations
- `wp_flora_payment_transactions` - Transaction log with full Dejavoo responses
- Updated `wp_flora_im_pos_orders` - Added terminal_id tracking

#### Supabase Tables (PostgreSQL):
- `pos_terminal_devices` - Real-time terminal status tracking

**Migration Files:**
- `/flora-inventory-matrix/migrations/create-pos-terminals-tables.sql`
- `/FloraPOS-main/supabase/migrations/20251016000001_create_pos_terminal_devices_table.sql`

### 2. **WordPress Backend** ✅

#### Core Classes:
```
/flora-inventory-matrix/includes/
├── class-flora-im-dejavoo-client.php          [Dejavoo SPIn API Client]
├── class-flora-im-pos-terminals.php           [Terminal Management]
├── class-flora-im-payment-processors.php      [Processor Configuration]
└── class-flora-im-payment-transactions.php    [Transaction Processing]
```

#### REST API Endpoints:
```
/flora-inventory-matrix/includes/api/
├── class-flora-im-pos-terminals-api.php      [Terminal CRUD]
└── class-flora-im-payment-api.php            [Payment Processing]
```

**API Endpoints:**
- `GET/POST /flora-im/v1/pos-terminals` - Terminal management
- `POST /flora-im/v1/payment/sale` - Process payment
- `POST /flora-im/v1/payment/void` - Void transaction
- `POST /flora-im/v1/payment/return` - Process refund
- `POST /flora-im/v1/payment/abort` - Abort transaction
- `POST /flora-im/v1/payment/gift/*` - Gift card operations

### 3. **Next.js Frontend** ✅

#### Types:
- `/src/types/terminal.ts` - Complete TypeScript types

#### Services:
- `/src/services/pos-terminals-service.ts` - Terminal management
- `/src/services/dejavoo-payment-service.ts` - Payment processing

---

## 🔧 Setup Instructions

### Step 1: Run Database Migrations

#### WordPress (Production/Staging):
```bash
# SSH into your server and run:
mysql -u your_db_user -p your_database < /path/to/flora-inventory-matrix/migrations/create-pos-terminals-tables.sql
```

#### Supabase:
```bash
cd /Users/whale/Desktop/FloraPOS-main
# Push migration to Supabase
supabase db push
```

### Step 2: Configure Dejavoo Processor

1. Log into WordPress admin
2. Make API call to create processor:

```bash
curl -X POST https://api.floradistro.com/wp-json/flora-im/v1/payment-processors \
  -H "Content-Type: application/json" \
  -d '{
    "processor_name": "Dejavoo Production",
    "processor_type": "dejavoo",
    "api_endpoint": "https://api.dejavoo.com",
    "api_version": "v1",
    "is_sandbox": false,
    "supported_features": ["sale", "void", "return", "auth", "capture", "tip_adjust", "gift_card"],
    "is_active": true
  }'
```

### Step 3: Register POS Terminals

For each physical WizarPOS QZ terminal:

```bash
curl -X POST https://api.floradistro.com/wp-json/flora-im/v1/pos-terminals \
  -H "Content-Type: application/json" \
  -d '{
    "terminal_name": "Register 1",
    "terminal_serial": "WIZARPOS-001",
    "terminal_type": "dejavoo",
    "terminal_model": "wizarpos_qz",
    "location_id": 20,
    "workstation_name": "Front Counter",
    "processor_id": 1,
    "dejavoo_register_id": "YOUR_REGISTER_ID",
    "dejavoo_auth_key": "YOUR_AUTH_KEY",
    "features": ["contactless", "chip", "swipe", "gift_card"]
  }'
```

### Step 4: Update CheckoutScreen Component

The `CheckoutScreen.tsx` needs to be updated to integrate Dejavoo payments. Here's the integration pattern:

```typescript
// At the top of CheckoutScreen.tsx
import { posTerminalsService } from '@/services/pos-terminals-service';
import { dejavooPaymentService } from '@/services/dejavoo-payment-service';
import type { POSTerminal } from '@/types/terminal';

// Inside component:
const [currentTerminal, setCurrentTerminal] = useState<POSTerminal | null>(null);
const [isProcessingPayment, setIsProcessingPayment] = useState(false);

// Load terminal for current workstation
useEffect(() => {
  const loadTerminal = async () => {
    if (!user?.location_id) return;
    
    // Get terminals for location
    const terminals = await posTerminalsService.getLocationTerminals(
      parseInt(user.location_id)
    );
    
    // For now, use first active terminal
    // TODO: Allow user to select their workstation
    if (terminals.length > 0) {
      setCurrentTerminal(terminals[0]);
    }
  };
  
  loadTerminal();
}, [user?.location_id]);

// Update processOrder function to handle card payments
const processOrder = async () => {
  // ... existing validation code ...

  if (paymentMethod === 'card') {
    if (!currentTerminal) {
      setAlertModal({
        isOpen: true,
        title: 'No Terminal',
        message: 'No payment terminal assigned. Please configure a terminal.'
      });
      return;
    }

    // Process card payment via Dejavoo
    setIsProcessingPayment(true);
    
    try {
      const result = await dejavooPaymentService.processSale({
        terminal_id: currentTerminal.id,
        amount: total,
        invoice_number: orderNum
      });

      if (!result.success) {
        setAlertModal({
          isOpen: true,
          title: 'Payment Declined',
          message: result.error || result.response?.ResponseMessage || 'Payment failed'
        });
        setIsProcessingPayment(false);
        return;
      }

      // Payment approved - continue with order creation
      console.log('✅ Payment approved:', result);
      
      // Store transaction ref for order
      const transactionRef = result.response?.TransactionID;
      
      // ... continue with existing WooCommerce order creation ...
      // Make sure to include transaction_ref in order meta_data
      
    } catch (error) {
      console.error('Payment error:', error);
      setAlertModal({
        isOpen: true,
        title: 'Payment Error',
        message: 'Unable to process payment. Please try again.'
      });
      setIsProcessingPayment(false);
      return;
    }
  }

  // ... rest of existing order processing code ...
};
```

---

## 🎯 Usage Examples

### Process a Sale
```typescript
import { dejavooPaymentService } from '@/services/dejavoo-payment-service';

const result = await dejavooPaymentService.processSale({
  terminal_id: 1,
  amount: 125.50,
  pos_order_id: 12345,
  invoice_number: 'POS-1729123456'
});

if (result.success) {
  console.log('Approved!', result.transaction);
  console.log('Card:', result.response?.CardType);
  console.log('Last 4:', result.response?.CardLast4);
} else {
  console.error('Declined:', result.error);
}
```

### Void a Transaction (Same Day)
```typescript
const result = await dejavooPaymentService.voidTransaction(
  1,  // terminal_id
  'TXN-123456'  // transaction_ref
);
```

### Process Return/Refund
```typescript
const result = await dejavooPaymentService.processReturn({
  terminal_id: 1,
  amount: 50.00,
  ref_id: 'TXN-123456'  // optional: link to original transaction
});
```

### Gift Card Operations
```typescript
// Activate
await dejavooPaymentService.giftActivate(1, 100.00);

// Reload
await dejavooPaymentService.giftReload(1, 50.00);

// Redeem
await dejavooPaymentService.giftRedeem(1, 25.00);

// Check Balance
const balance = await dejavooPaymentService.giftInquiry(1);
```

---

## 🔐 Security Notes

1. **API Credentials**: Currently using base64 encoding. For production, implement proper encryption:
   - Use WordPress encryption library
   - Or store credentials in environment variables
   - Never expose credentials in frontend

2. **API Permissions**: Update permission callbacks in API classes:
   ```php
   public function check_permissions() {
       return current_user_can('manage_woocommerce');
   }
   ```

3. **PCI Compliance**: ✅ Card data never touches your servers - handled entirely by Dejavoo terminals

---

## 📊 Real-time Status Tracking

Terminals automatically register with Supabase for real-time status:

```typescript
import { supabase } from '@/lib/supabase';

// Subscribe to terminal status changes
const channel = supabase
  .channel('terminal-status')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pos_terminal_devices',
    filter: `location_id=eq.${locationId}`
  }, (payload) => {
    console.log('Terminal status changed:', payload.new);
  })
  .subscribe();
```

---

## 🧪 Testing

### Test Terminal Connection
```typescript
import { posTerminalsService } from '@/services/pos-terminals-service';

const result = await posTerminalsService.testConnection(1);
if (result.success) {
  console.log('✅ Terminal online');
} else {
  console.error('❌ Terminal offline:', result.error);
}
```

### Test with Sandbox
Update processor to use sandbox mode:
```sql
UPDATE wp_flora_payment_processors 
SET is_sandbox = 1, api_endpoint = 'https://sandbox.dejavoo.com'
WHERE id = 1;
```

---

## 🚨 Error Handling

All payment operations return standardized results:

```typescript
interface PaymentResult {
  success: boolean;
  transaction_id?: number;
  transaction?: PaymentTransaction;
  response?: DejavooResponse;
  error?: string;
}
```

Common error scenarios:
- `terminal_not_found` - Terminal doesn't exist
- `processor_inactive` - Payment processor not active
- `declined` - Card declined (check response.ResponseCode)
- `timeout` - Terminal not responding
- `network_error` - API connection failed

---

## 📱 Next Steps

1. **Build Terminal Management UI** - Create admin panel to manage terminals
2. **Add Workstation Selection** - Let cashiers select their assigned terminal
3. **Transaction History** - Build UI to view transaction history
4. **Batch Settlement** - Implement end-of-day settlement
5. **Receipt Printing** - Handle receipt generation
6. **Signature Capture** - Display customer signatures

---

## 📚 Resources

- [Dejavoo SPIn REST API Documentation](https://app.theneo.io/dejavoo/spin/spin-rest-api-methods)
- WizarPOS QZ Terminal Manual
- Your Dejavoo Merchant Portal

---

## ✅ Implementation Checklist

- [x] Database migrations
- [x] WordPress backend classes
- [x] REST API endpoints
- [x] Next.js TypeScript types
- [x] Payment services
- [x] Terminal services
- [ ] Terminal management UI
- [ ] CheckoutScreen integration
- [ ] Real-time status hooks
- [ ] Error handling UI
- [ ] Transaction history UI
- [ ] Testing with physical terminal

---

## 🆘 Troubleshooting

### Terminal not connecting
1. Check `dejavoo_register_id` and `dejavoo_auth_key` are correct
2. Verify terminal is powered on and connected to network
3. Test API endpoint is reachable
4. Check WordPress error logs

### Payment declined
1. Check Dejavoo response code in `processor_response`
2. Verify merchant account is active
3. Test with different card
4. Check transaction limits

### Database errors
1. Verify migrations ran successfully
2. Check foreign key constraints
3. Review WordPress error logs
4. Test database connectivity

---

**Built with ❤️ for Flora Distribution**

