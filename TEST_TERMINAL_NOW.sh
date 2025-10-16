#!/bin/bash
# Test Your WizarPOS Q2 Terminal RIGHT NOW
# Run this from a computer at Charlotte (same WiFi as terminal)

echo "💳 Testing WizarPOS Q2 Terminal"
echo "================================"
echo ""
echo "Terminal IP: 192.168.1.229"
echo "TPN: 01Q43200268"
echo ""

# Test 1: Check if terminal is reachable
echo "Test 1: Checking if terminal is online..."
if ping -c 2 192.168.1.229 > /dev/null 2>&1; then
    echo "✅ Terminal is reachable!"
else
    echo "❌ Cannot reach terminal"
    echo "   Make sure you're on the same WiFi network (192.168.1.x)"
    exit 1
fi

echo ""
echo "Test 2: Getting terminal status..."
curl -v -X POST "http://192.168.1.229/terminalstatus" \
  -H "Content-Type: application/json" \
  -d '{
    "RegisterID":"01Q43200268",
    "AuthKey":"123ABC123"
  }' 2>&1 | grep -E "HTTP|Connected|Error|Response" || echo "No response"

echo ""
echo ""
echo "Test 3: Sending \$1.00 test transaction..."
echo "⏳ Watch your terminal screen - it should wake up!"
echo ""

curl -v -X POST "http://192.168.1.229/sale" \
  -H "Content-Type: application/json" \
  -d '{
    "TransType":"Sale",
    "RegisterID":"01Q43200268",
    "AuthKey":"123ABC123",
    "Amount":"100",
    "InvoiceNumber":"TEST-'$(date +%s)'",
    "GetSignature":"Y",
    "PrintReceipt":"N"
  }' 2>&1

echo ""
echo ""
echo "📝 Results:"
echo "----------"
echo "If terminal screen lit up → ✅ Communication works!"
echo "If no response → Check terminal WiFi connection"
echo "If error 404 → Try different endpoint (check Dejavoo docs)"
echo ""
echo "Next: Run QUICK_LOCAL_DEPLOY.sh to set up POS locally"

