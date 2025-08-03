'use client'

import { Trash2, Plus, Minus, User, X, CreditCard, DollarSign, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { IDScanner } from './IDScanner'
import { MatrixRain } from './MatrixRain'
import { FloraProduct, floraAPI, CreateOrderData } from '../lib/woocommerce'
import { useLocation } from '@/contexts/LocationContext'
import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTaxRates, calculateTaxAmount, type TaxRate } from '@/hooks/useTaxRates'
import CustomerPreferenceQuickView from './CustomerPreferenceQuickView'
import QuickAddToPreferences from './QuickAddToPreferences'
import { Customer as CustomerType, CustomerPreference } from '@/types/auth'

// Extended Customer interface for Cart component compatibility
interface Customer extends CustomerType {
  address?: string
  totalOrders?: number
  totalSpent?: number
  status?: 'active' | 'inactive' | 'vip'
  avatar?: string
  orderHistory?: Array<{
    id: number
    date: string
    total: number
    items: string[]
    status: 'completed' | 'pending' | 'cancelled' | 'processing' | 'on-hold' | 'refunded' | 'failed'
  }>
}

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: number, variation: string, newQuantity: number) => void
  onRemoveItem: (productId: number, variation: string) => void
  assignedCustomer: Customer | null
  onAssignCustomer: (customer: Customer) => void
  onUnassignCustomer: () => void
}

// Helper function to format variation display
function formatVariationDisplay(variation: string, item?: CartItem): string {
  if (!variation || variation === 'default') return ''
  
  if (variation.includes('flower-')) {
    const grams = variation.replace('flower-', '')
    return `${grams}g Flower`
  }
  
  if (variation.includes('preroll-')) {
    const count = variation.replace('preroll-', '')
    if (item) {
      const gramsPerPreroll = item.mli_preroll_conversion || 0.7
      const totalGrams = parseFloat((parseInt(count) * gramsPerPreroll).toFixed(1))
      return `${count}x Pre-rolls (${totalGrams}g)`
    }
    return `${count}x Pre-rolls`
  }
  
  if (variation.includes('qty-')) {
    const qty = variation.replace('qty-', '')
    return `${qty} units`
  }
  
  return variation
}

// Main page cart item interface (matches the one in page.tsx)
interface CartItem extends FloraProduct {
  selectedVariation: string
  cartQuantity: number
}

export function Cart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  assignedCustomer, 
  onAssignCustomer, 
  onUnassignCustomer 
}: CartProps) {
  const { currentLocation } = useLocation()
  const [isCheckoutView, setIsCheckoutView] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  
  // Handle adding preference from cart item
  const handleAddPreference = async (preference: Omit<CustomerPreference, 'id' | 'addedAt' | 'updatedAt'>) => {
    if (!assignedCustomer) return
    
    try {
      // Call the API to save the preference
      const response = await fetch(`/api/customers/${assignedCustomer.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      })

      if (!response.ok) {
        throw new Error('Failed to save preference')
      }

      const result = await response.json()
      console.log('Preference saved successfully:', result)
      
      // Update the local customer data to include the new preference
      const newPreference: CustomerPreference = {
        ...preference,
        id: Date.now().toString(), // Temporary ID until we get the real one
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Update the assigned customer with the new preference
      const updatedCustomer = {
        ...assignedCustomer,
        preferences: [...(assignedCustomer.preferences || []), newPreference]
      }
      
      onAssignCustomer(updatedCustomer)
      
      toast.success(`Added ${preference.category} preference for ${assignedCustomer.firstName}`)
    } catch (error) {
      console.error('Failed to add preference:', error)
      toast.error('Failed to add preference')
    }
  }
  
  // Fetch tax rates for the current location
  const { data: taxRatesData, isLoading: taxRatesLoading } = useTaxRates()
  
  const queryClient = useQueryClient()
  
  // Fetch all products to get current virtual pre-roll counts
  const { data: currentProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Get all flower products to check virtual pre-roll counts
      const products = await floraAPI.getProducts({ category: 25, per_page: 100 })
      return products
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
  
  const subtotal = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    console.log(`Cart calculation - Product: ${item.name}, Variation: ${item.selectedVariation}, Price: $${price}`)
    return total + price * item.cartQuantity
  }, 0)

  // Calculate tax using location-specific rates
  const { taxAmount: tax, taxBreakdown } = calculateTaxAmount(
    subtotal,
    taxRatesData?.tax_rates || []
  )
  const total = subtotal + tax

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      console.log('🚀 Creating order with data:', orderData)
      console.log('💰 Passing calculated total to API:', total)
      return floraAPI.createOrder(orderData, total)
    },
    onSuccess: async (data) => {
      console.log('✅ Order created successfully:', data)
      toast.success(`Order #${data.id} completed successfully!`)
      // Clear cart after successful checkout
      items.forEach(item => onRemoveItem(item.id, item.selectedVariation))
      setIsCheckoutView(false)
      // Reset form
      setPaymentMethod('cash')
      setCashReceived('')
      setCustomerEmail('')
      // Invalidate products to refresh virtual pre-roll counts
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      console.error('❌ Order creation failed:', error)
      toast.error(`Failed to create order: ${error.message}`)
    },
  })

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < total) {
        toast.error('Cash received must be greater than or equal to total')
        return
      }
    }

    console.log('🛒 Starting checkout process...')
    console.log('💳 Payment method:', paymentMethod)
    console.log('💰 Total:', total)
    console.log('👤 Assigned customer:', assignedCustomer)
    
    // Get current location info from context
    const deviceInfo = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} POS`
    const timestamp = new Date().toISOString()
    
    const orderData: CreateOrderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'cash' ? 'Cash' : 'Card',
      set_paid: true,
      status: 'processing', // Add this to trigger inventory deduction
      total: total.toFixed(2),
      created_via: 'pos',
      meta_data: [
        {
          key: '_order_source_platform',
          value: 'POS System'
        },
        {
          key: '_order_source_location',
          value: currentLocation.name
        },
        {
          key: '_order_source_details',
          value: `POS ${currentLocation.name}`
        },
        {
          key: '_order_source_device',
          value: deviceInfo
        },
        {
          key: '_order_source_timestamp',
          value: timestamp
        },
        {
          key: '_pos_terminal_id',
          value: currentLocation.terminalId
        },
        {
          key: '_pos_location_id',
          value: currentLocation.id
        },
        {
          key: '_pos_location_name',
          value: currentLocation.name
        },
        {
          key: '_cashier_name',
          value: 'POS User' // This should come from your auth context
        },
        {
          key: '_cashier_email',
          value: 'pos@floracannabis.com' // This should come from your auth context
        },
        {
          key: '_tax_total',
          value: tax.toFixed(2)
        },
        {
          key: '_tax_breakdown',
          value: JSON.stringify(taxBreakdown || [])
        },
        {
          key: '_location_tax_rates',
          value: JSON.stringify(taxRatesData?.tax_rates || [])
        },
        {
          key: '_wc_tax_rate_ids',
          value: JSON.stringify(taxRatesData?.tax_rates?.map((r: TaxRate) => r.id) || [])
        }
      ],
      billing: {
        first_name: assignedCustomer?.firstName || '',
        last_name: assignedCustomer?.lastName || '',
        address_1: assignedCustomer?.address || '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US',
        email: assignedCustomer?.email || customerEmail || 'pos@floracannabis.com',
        phone: assignedCustomer?.phone || ''
      },
      shipping: {
        first_name: assignedCustomer?.firstName || '',
        last_name: assignedCustomer?.lastName || '',
        address_1: assignedCustomer?.address || '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US'
      },
      shipping_lines: [],
      line_items: items.map(item => {
        const itemPrice = parseFloat(item.price) || 0
        
        // For quantity-based products, extract the real quantity from the variation
        let actualQuantity = item.cartQuantity
        let itemTotal = itemPrice * item.cartQuantity
        
        if (item.selectedVariation && item.selectedVariation.startsWith('qty-')) {
          const qtyFromVariation = parseInt(item.selectedVariation.replace('qty-', '')) || 1
          actualQuantity = qtyFromVariation
          // For qty variations, item.price already includes the total price for all units
          itemTotal = itemPrice // Don't multiply by cartQuantity
        } else if (item.selectedVariation && item.selectedVariation.startsWith('flower-')) {
          // Extract grams from flower variation (e.g., flower-3.5 -> 3.5)
          const gramsFromVariation = parseFloat(item.selectedVariation.replace('flower-', '')) || 1
          // Since WooCommerce API only accepts integers, we'll send 1 and store actual grams in metadata
          actualQuantity = 1 // WooCommerce requires integer
          // For flower variations, item.price is the total for the grams selected
          itemTotal = itemPrice // Don't multiply by cartQuantity
          
          console.log(`🌿 Flower item: ${item.name}, Grams: ${gramsFromVariation}g (sending qty: 1 with metadata)`)
        } else if (item.selectedVariation && item.selectedVariation.startsWith('preroll-')) {
          // Extract count from preroll variation (e.g., preroll-2 -> 2)
          const prerollCount = parseInt(item.selectedVariation.replace('preroll-', '')) || 1
          const gramsPerPreroll = item.mli_preroll_conversion || 0.7
          const totalGrams = prerollCount * gramsPerPreroll
          
          // Send quantity as 1 for WooCommerce, actual gram calculation handled by plugin
          actualQuantity = 1
          // For preroll variations, item.price is the total for the count selected
          itemTotal = itemPrice // Don't multiply by cartQuantity
          
          console.log(`🚬 Preroll item: ${item.name}, Count: ${prerollCount} × ${gramsPerPreroll}g = ${totalGrams}g total`)
        }
        
        console.log(`📦 Line item: ${item.name}, Price: $${itemPrice}, Cart Qty: ${item.cartQuantity}, Actual Qty: ${actualQuantity}, Total: $${itemTotal.toFixed(2)}`)
        
        const lineItem: any = {
          product_id: item.id,
          quantity: actualQuantity, // Use actual quantity for inventory deduction
          total: itemTotal.toFixed(2),
          subtotal: itemTotal.toFixed(2)
        }
        
        // Add variation and location metadata
        const metaData: Array<{key: string, value: string}> = []
        
        // Always add location information for inventory deduction
        // Store in the format the Addify plugin expects
        metaData.push({
          key: 'selected_location',
          value: JSON.stringify({
            selected_value: currentLocation.id,
            selected_text: `${currentLocation.name} Location`
          })
        })
        
        // Also add the location ID directly for backup
        metaData.push({
          key: '_location_id',
          value: currentLocation.id
        })
        
        // Add location name for reference
        metaData.push({
          key: '_location_name',
          value: currentLocation.name
        })
        
        if (item.selectedVariation !== 'default') {
          // For flower variations, store the grams and flag for decimal processing
          if (item.selectedVariation && item.selectedVariation.startsWith('flower-')) {
            const grams = parseFloat(item.selectedVariation.replace('flower-', '')) || 1
            // Add both variation and _selected_variation for compatibility
            metaData.push({
              key: 'variation',
              value: item.selectedVariation
            })
            metaData.push({
              key: '_selected_variation',
              value: item.selectedVariation
            })
            metaData.push({
              key: '_variation_type',
              value: 'flower_grams'
            })
            metaData.push({
              key: '_flower_grams',
              value: grams.toString()
            })
            metaData.push({
              key: '_quantity_is_grams',
              value: 'yes'
            })
          }
          
          // For preroll variations, store the count and gram equivalent
          if (item.selectedVariation.startsWith('preroll-')) {
            const count = parseInt(item.selectedVariation.replace('preroll-', '')) || 1
            const gramsPerPreroll = item.mli_preroll_conversion || 0.7 // Use product-specific conversion or default
            
            // Add both variation and _selected_variation for compatibility
            metaData.push({
              key: 'variation',
              value: item.selectedVariation
            })
            metaData.push({
              key: '_selected_variation',
              value: item.selectedVariation
            })
            metaData.push({
              key: '_variation_type',
              value: 'preroll_grams'
            })
            metaData.push({
              key: '_preroll_count',
              value: count.toString()
            })
            metaData.push({
              key: '_grams_per_preroll',
              value: gramsPerPreroll.toString()
            })
            metaData.push({
              key: '_quantity_is_grams',
              value: 'yes'
            })
            
            // Add virtual pre-roll metadata if available
            // Get current product data to ensure we have the latest virtual pre-roll count
            const currentProduct = currentProducts?.find(p => p.id === item.id)
            const virtualAvailable = currentProduct?.virtual_preroll_count || item.virtual_preroll_count || 0
            
            console.log(`🔍 Virtual pre-roll check for ${item.name}:`, {
              productId: item.id,
              virtualAvailable: virtualAvailable,
              cartItemValue: item.virtual_preroll_count,
              currentProductValue: currentProduct?.virtual_preroll_count,
              hasVirtual: virtualAvailable > 0
            })
            
            if (virtualAvailable > 0) {
              metaData.push({
                key: '_virtual_prerolls_available',
                value: virtualAvailable.toString()
              })
              // Signal to Addify to use virtual pre-rolls first
              metaData.push({
                key: '_use_virtual_prerolls',
                value: 'yes'
              })
              console.log(`✅ Added virtual pre-roll metadata: ${virtualAvailable} available`)
            } else {
              console.log(`❌ No virtual pre-rolls available for ${item.name}`)
            }
            
            console.log(`🚬 Preroll metadata: ${count} prerolls × ${gramsPerPreroll}g = ${count * gramsPerPreroll}g total`)
            console.log(`   Virtual available: ${virtualAvailable}`)
            console.log(`   Final metadata:`, metaData)
          }
        }
        
        if (metaData.length > 0) {
          lineItem.meta_data = metaData
        }
        
        return lineItem
      })
    }

    // Add customer ID to order if customer is assigned
    if (assignedCustomer) {
      const customerId = parseInt(assignedCustomer.id)
      console.log(`🎯 Adding customer ID to order: ${customerId}`)
      ;(orderData as any).customer_id = customerId
    } else {
      console.warn('⚠️ No customer assigned - points will not be awarded')
    }

    console.log('📦 Final order data:', orderData)
    createOrderMutation.mutate(orderData)
  }

  const calculateChange = () => {
    const received = parseFloat(cashReceived)
    return isNaN(received) ? 0 : Math.max(0, received - total)
  }

  const handleScanResult = async (data: any) => {
    console.log('Scanned customer data:', data)
    setIsScannerOpen(false)
    
    try {
      console.log('🆔 Raw scanned ID data:', data)
      
      // Extract key information from scanned ID
      const firstName = data.firstName || ''
      const lastName = data.lastName || ''
      const email = data.email || '' // IDs don't usually have email, but we'll check
      const phone = data.phone || '' // IDs don't usually have phone, but we'll check
      const dateOfBirth = data.dateOfBirth || ''
      const address = [data.streetAddress, data.streetAddress2, data.city, data.state, data.zipCode]
        .filter(Boolean)
        .join(', ')
      
      console.log('📋 Extracted data:', { firstName, lastName, email, phone, dateOfBirth, address })
      console.log('🔍 Searching for existing customer with:', { firstName, lastName, dateOfBirth })
      
      // Search for existing customer by name and date of birth
      const searchQuery = `${firstName} ${lastName}`.trim()
      console.log('🔍 Searching for customer with query:', searchQuery)
      
      const existingCustomers = await floraAPI.getCustomers({
        search: searchQuery,
        per_page: 50
      })
      
      console.log('📋 Found existing customers:', existingCustomers.length)
      existingCustomers.forEach((customer, index) => {
        console.log(`Customer ${index + 1}:`, {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        })
      })
      
      // Try to find exact match by name (more flexible matching)
      let matchedCustomer = null
      if (existingCustomers.length > 0) {
        matchedCustomer = existingCustomers.find(customer => {
          const customerName = `${customer.first_name} ${customer.last_name}`.trim().toLowerCase()
          const scannedName = searchQuery.toLowerCase()
          console.log('🔍 Comparing:', { customerName, scannedName })
          return customerName === scannedName
        })
        
        // If no exact match, try partial matching
        if (!matchedCustomer) {
          matchedCustomer = existingCustomers.find(customer => {
            const customerFirstName = customer.first_name?.toLowerCase() || ''
            const customerLastName = customer.last_name?.toLowerCase() || ''
            const scannedFirstName = firstName.toLowerCase()
            const scannedLastName = lastName.toLowerCase()
            
            return customerFirstName.includes(scannedFirstName) && customerLastName.includes(scannedLastName)
          })
        }
      }
      
      console.log('🎯 Matched customer:', matchedCustomer ? `${matchedCustomer.first_name} ${matchedCustomer.last_name}` : 'None')
      
      if (matchedCustomer) {
        // Customer exists, assign them to the cart
        console.log('Found existing customer:', matchedCustomer)
        const customerPhone = matchedCustomer.billing?.phone || ''
        const totalSpent = parseFloat(matchedCustomer.total_spent || '0')
        const ordersCount = matchedCustomer.orders_count || 0
        const loyaltyPoints = matchedCustomer.loyalty_points || 0
        
                 onAssignCustomer({
           id: matchedCustomer.id.toString(),
           firstName: matchedCustomer.first_name || firstName,
           lastName: matchedCustomer.last_name || lastName,
           email: matchedCustomer.email,
           phone: customerPhone,
           dateOfBirth: dateOfBirth,
           address: `${matchedCustomer.billing?.address_1 || ''} ${matchedCustomer.billing?.city || ''}`.trim() || address,
           totalOrders: ordersCount,
           totalSpent: totalSpent,
           loyaltyPoints: loyaltyPoints,
           status: matchedCustomer.is_paying_customer ? 'active' : 'inactive',
           avatar: matchedCustomer.avatar_url,
           createdAt: matchedCustomer.date_created || new Date().toISOString(),
           updatedAt: matchedCustomer.date_modified || new Date().toISOString()
         })
        
        toast.success(`Customer ${firstName} ${lastName} assigned to cart`)
      } else {
                 // Customer doesn't exist, create new one
         console.log('Creating new customer with scanned data')
         
         // Generate a unique email to avoid conflicts
         const timestamp = Date.now()
         const generatedEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@scanned-id.local`
         
         const newCustomerData = {
           first_name: firstName,
           last_name: lastName,
           email: generatedEmail,
           billing: {
             first_name: firstName,
             last_name: lastName,
             address_1: data.streetAddress || '',
             address_2: data.streetAddress2 || '',
             city: data.city || '',
             state: data.state || '',
             postcode: data.zipCode || '',
             phone: phone,
             country: 'US' // Add required country field
           },
           shipping: {
             first_name: firstName,
             last_name: lastName,
             address_1: data.streetAddress || '',
             address_2: data.streetAddress2 || '',
             city: data.city || '',
             state: data.state || '',
             postcode: data.zipCode || '',
             country: 'US' // Add required country field
           }
         }
         
         console.log('📝 Customer data to create:', newCustomerData)
        
                 // Create customer via WooCommerce API
         const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/wc/v3/customers`, {
           method: 'POST',
           headers: {
             'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`),
             'Content-Type': 'application/json',
           },
           body: JSON.stringify(newCustomerData)
         })
        
                 console.log('📡 API Response status:', response.status)
         console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))
         
         if (response.ok) {
           const createdCustomer = await response.json()
           console.log('✅ Created new customer:', createdCustomer)
           
                     // Assign the new customer to cart
          onAssignCustomer({
            id: createdCustomer.id.toString(),
            firstName: firstName,
            lastName: lastName,
            email: createdCustomer.email,
            phone: phone,
            dateOfBirth: dateOfBirth,
            address: address,
            totalOrders: 0,
            totalSpent: 0,
            loyaltyPoints: 0,
            status: 'active',
            avatar: createdCustomer.avatar_url,
            createdAt: createdCustomer.date_created || new Date().toISOString(),
            updatedAt: createdCustomer.date_modified || new Date().toISOString()
          })
           
           toast.success(`New customer ${firstName} ${lastName} created and assigned to cart`)
         } else {
           const responseText = await response.text()
           console.error('❌ Failed to create customer - Status:', response.status)
           console.error('❌ Response text:', responseText)
           
           let errorData
           try {
             errorData = JSON.parse(responseText)
           } catch (e) {
             errorData = { message: responseText }
           }
           
           console.error('❌ Parsed error data:', errorData)
           
           // Show more detailed error message
           const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
           toast.error(`Failed to create customer: ${errorMessage}`)
         }
      }
    } catch (error) {
      console.error('Error processing scanned ID:', error)
      toast.error('Failed to process scanned ID data')
    }
  }

  if (items.length === 0) {
    return (
      <div className="w-80 bg-black flex flex-col">
        <div className="flex-1 relative">
          <MatrixRain width={320} height={400} className="absolute inset-0 w-full h-full" />
          
          {/* Floating ID Scanner Button */}
          {!assignedCustomer && (
            <div className="absolute bottom-4 right-4">
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-primary hover:bg-primary/80 text-white p-3 rounded-full shadow-lg transition-colors flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Scan ID</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Customer Assignment Section - Only show when customer is assigned */}
        {assignedCustomer && (
          <div className="px-2 py-1">
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {assignedCustomer.firstName.charAt(0)}{assignedCustomer.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {assignedCustomer.firstName} {assignedCustomer.lastName}
                  </p>
                  <p className="text-xs text-text-secondary">{assignedCustomer.email}</p>
                  <p className="text-xs font-medium text-green-400">
                    {(assignedCustomer.loyaltyPoints || 0) > 0 ? `${(assignedCustomer.loyaltyPoints || 0).toLocaleString()} chips` : '0 chips'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onUnassignCustomer}
                className="text-error hover:text-error/80 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isScannerOpen && (
          <IDScanner 
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanComplete={handleScanResult}
          />
        )}
      </div>
    )
  }

  return (
    <div className="w-80 bg-black flex flex-col">
      {isCheckoutView ? (
        /* Checkout Form View */
        <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col">
          {/* Checkout Header */}
          <div className="px-2 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCheckoutView(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">Checkout</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-6 space-y-6">
            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Order Summary</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={`${item.id}-${item.selectedVariation}`} className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      {item.name} {formatVariationDisplay(item.selectedVariation, item) && `(${formatVariationDisplay(item.selectedVariation, item)})`} × {item.cartQuantity}
                    </span>
                    <span className="text-text-primary font-medium">
                      ${(parseFloat(item.price) * item.cartQuantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">${subtotal.toFixed(2)}</span>
                </div>
                {taxBreakdown && taxBreakdown.length > 0 ? (
                  taxBreakdown.map((taxItem, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{taxItem.name}</span>
                      <span className="text-text-primary">${taxItem.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-text-primary">${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-text-primary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="customer@example.com"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
              </div>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">
                    Cash Received
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={total}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={total.toFixed(2)}
                    required
                  />
                </div>
                {cashReceived && (
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Change Due</span>
                      <span className="text-text-primary font-medium">
                        ${calculateChange().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="p-6 border-t border-border">
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete Order - $${total.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Customer Section */}
          <div className="px-2 py-4">
            {assignedCustomer ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {assignedCustomer.firstName.charAt(0)}{assignedCustomer.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {assignedCustomer.firstName} {assignedCustomer.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">{assignedCustomer.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={onUnassignCustomer}
                    className="text-error hover:text-error/80 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Customer Preferences Quick View */}
                <CustomerPreferenceQuickView 
                  customer={assignedCustomer} 
                  onAddPreference={handleAddPreference}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">No customer assigned</p>
                    <p className="text-xs text-text-secondary">Scan ID to assign customer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Scan ID</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedVariation}`} className="flex gap-3">
                  <div className="flex-1">
                    {item.images?.[0] && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.images[0].src}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-text-primary mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      {formatVariationDisplay(item.selectedVariation, item) && (
                        <p className="text-xs text-text-secondary mb-1">
                          {formatVariationDisplay(item.selectedVariation, item)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-primary font-medium text-sm">
                          ${(parseFloat(item.price) * item.cartQuantity).toFixed(2)}
                        </p>
                        {assignedCustomer && (
                          <QuickAddToPreferences
                            customer={assignedCustomer}
                            productId={item.id}
                            productName={item.name}
                            onAddPreference={handleAddPreference}
                            className="ml-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveItem(item.id, item.selectedVariation)}
                      className="text-error hover:text-error/80 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.selectedVariation, item.cartQuantity - 1)}
                        className="w-6 h-6 rounded bg-background-secondary hover:bg-background-tertiary flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.cartQuantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.selectedVariation, item.cartQuantity + 1)}
                        className="w-6 h-6 rounded bg-background-secondary hover:bg-background-tertiary flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-text-secondary text-sm">
                      ${parseFloat(item.price).toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-2 py-4">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              {taxBreakdown && taxBreakdown.length > 0 ? (
                taxBreakdown.map((taxItem, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{taxItem.name}</span>
                    <span className="text-text-primary">${taxItem.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax</span>
                  <span className="text-text-primary">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-1">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutView(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-full font-medium transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
      )}

      {isScannerOpen && (
        <IDScanner 
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanResult}
        />
      )}
    </div>
  )
} 