import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawStoreId = searchParams.get('store_id') || 'Charlotte Monroe'
    
    // Map store IDs to store names
    const storeMapping: { [key: string]: string } = {
      '30': 'Charlotte Monroe',
      'charlotte': 'Charlotte Monroe',
      'Charlotte Monroe': 'Charlotte Monroe'
    }
    
    const storeId = storeMapping[rawStoreId] || rawStoreId
    
    console.log('🔍 Fetching staff members for store:', rawStoreId, '->', storeId)

    let allStaffMembers = []
    let storeSpecificStaff = []

    // Method 1: Check WordPress users (skip for now due to auth issues)
    // POS access is now managed by Addify Multi-Location Inventory plugin
    console.log('📋 Method 1: Skipping WordPress users (auth issues)...')
    try {
      // Skip WordPress Users API for now due to authentication issues
      const wpUsersResponse = { ok: false }

      if (wpUsersResponse.ok) {
        // This won't execute since ok is false
        const wpUsers: any[] = []
        console.log(`📊 Found ${wpUsers.length} WordPress users total`)
        
        wpUsers.forEach((user: any, index: number) => {
          console.log(`👤 User ${index + 1}:`, {
            id: user.id,
            name: user.name,
            slug: user.slug,
            email: user.email,
            roles: user.roles,
            meta: user.meta || {},
            description: user.description
          })

          // Check if user has store-specific information in description or meta
          const hasStoreInfo = user.description && user.description.toLowerCase().includes(storeId.toLowerCase())
          if (hasStoreInfo) {
            console.log(`🏪 User ${user.name} has store-specific info in description:`, user.description)
          }
        })

        // Filter for actual staff (exclude subscribers and customers)
        const staffUsers = wpUsers.filter((user: any) => {
          const userRoles = user.roles || []
          const hasStaffRole = userRoles.some((role: string) => 
            ['administrator', 'shop_manager', 'editor', 'author'].includes(role)
          )
          const isNotCustomer = !userRoles.includes('customer') && !userRoles.includes('subscriber')
          const hasName = user.name && user.name.trim() !== ''
          const hasEmail = user.email && user.email.trim() !== ''
          
          // Prioritize actual staff roles over customers
          const isActualStaff = hasStaffRole && isNotCustomer
          
          console.log(`🔍 ${user.name || 'Unknown'}: roles=[${userRoles.join(',')}], hasStaffRole=${hasStaffRole}, isNotCustomer=${isNotCustomer}, isActualStaff=${isActualStaff}`)
          
          return isActualStaff && hasName && hasEmail
        })

        console.log(`✅ Found ${staffUsers.length} actual staff members in WordPress`)

        const wpStaff = staffUsers.map((user: any) => {
          // Check if this user is assigned to the current store
          const isStoreSpecific = user.description && user.description.toLowerCase().includes(storeId.toLowerCase())
          
          const staffMember = {
            id: user.slug || user.username || `user_${user.id}`,
            name: user.name || user.display_name || `User ${user.id}`,
            email: user.email || '',
            role: user.roles?.[0] || 'staff',
            avatar: user.avatar_urls?.['48'] || null,
            source: 'wordpress_users',
            wordpress_id: user.id,
            store_specific: isStoreSpecific
          }

          if (isStoreSpecific) {
            console.log(`🏪 STORE-SPECIFIC STAFF FOUND:`, staffMember)
            storeSpecificStaff.push(staffMember)
          }

          return staffMember
        })

        allStaffMembers.push(...wpStaff)

      } else {
        console.log('⚠️ WordPress Users API skipped due to authentication issues')
      }
    } catch (error) {
      console.error('❌ WordPress Users API error:', error)
    }

    // Method 2: Check WordPress users directly for Addify store assignments
    // Enhanced approach to find ALL assigned staff, not just those who processed orders
    console.log('📋 Method 2: Checking for ALL Addify-assigned staff members...')
    try {
      // First, get all WooCommerce customers and look for those with POS assignments
      const allCustomersResponse = await fetch(`https://api.floradistro.com/wp-json/wc/v3/customers?per_page=100&role=all`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      })

      if (allCustomersResponse.ok) {
        const allCustomers = await allCustomersResponse.json()
        console.log(`📊 Checking ${allCustomers.length} users for Addify POS assignments`)
        
        allCustomers.forEach((customer: any) => {
          // Look for POS-related meta data
          let posEnabled = false
          let posRole = 'cashier'
          let allowedStores: any[] = []
          
          if (customer.meta_data && Array.isArray(customer.meta_data)) {
            const posEnabledMeta = customer.meta_data.find((meta: any) => meta.key === 'pos_enabled')
            const posRoleMeta = customer.meta_data.find((meta: any) => meta.key === 'pos_role')
            const allowedStoresMeta = customer.meta_data.find((meta: any) => 
              meta.key === 'allowed_stores' || meta.key === 'pos_allowed_stores'
            )
            
            posEnabled = posEnabledMeta?.value === '1' || posEnabledMeta?.value === 1
            posRole = posRoleMeta?.value || 'cashier'
            allowedStores = allowedStoresMeta?.value || []
            
            // Ensure allowedStores is an array
            if (!Array.isArray(allowedStores)) {
              allowedStores = []
            }
          }
          
          // Check if this user has store access
          let hasStoreAccess = false
          if (allowedStores.length > 0) {
            hasStoreAccess = allowedStores.some((storeIdOrName: any) => {
              const storeStr = String(storeIdOrName).toLowerCase()
              return storeStr === rawStoreId || 
                     storeStr === storeId.toLowerCase() ||
                     storeStr.includes('charlotte') ||
                     storeStr === '30'
            })
          }
          
          // Include if POS enabled and has store access
          if (posEnabled && hasStoreAccess && customer.first_name && customer.email) {
            const staffMember = {
              id: customer.username || customer.email?.split('@')[0] || `customer_${customer.id}`,
              name: `${customer.first_name} ${customer.last_name}`.trim(),
              email: customer.email || '',
              role: posRole,
              source: 'addify_assigned_staff',
              wc_id: customer.id,
              store_specific: true,
              pos_enabled: true,
              pos_role: posRole,
              allowed_stores: allowedStores
            }
            
            console.log(`🎯 FOUND ADDIFY-ASSIGNED STAFF:`, staffMember)
            storeSpecificStaff.push(staffMember)
            allStaffMembers.push(staffMember)
          }
        })
      } else {
        console.error('❌ All Customers API failed:', allCustomersResponse.status)
      }
    } catch (error) {
      console.error('❌ All Customers API error:', error)
    }

    // Method 3: Check WooCommerce customers for additional staff assignments
    console.log('📋 Method 3: Checking WooCommerce customers for additional POS-assigned staff...')
    try {
      const wcCustomersResponse = await fetch(`https://api.floradistro.com/wp-json/wc/v3/customers?per_page=100`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      })

      if (wcCustomersResponse.ok) {
        const wcCustomers = await wcCustomersResponse.json()
        console.log(`📊 Found ${wcCustomers.length} WooCommerce customers`)
        
        wcCustomers.forEach((customer: any, index: number) => {
          // Look for store assignment in meta_data
          let hasStoreAssignment = false
          let storeAssignmentData = null

          if (customer.meta_data && Array.isArray(customer.meta_data)) {
            const storeRelatedMeta = customer.meta_data.filter((meta: any) => 
              meta.key && (
                meta.key.includes('store') || 
                meta.key.includes('location') || 
                meta.key.includes('assigned') ||
                meta.key.includes('branch') ||
                meta.key.includes('workplace') ||
                meta.key.includes('pos_allowed_stores') ||
                meta.key.includes('allowed_stores') || // Addify format
                meta.key.includes('staff_store') ||
                meta.key.includes('employee_location')
              )
            )

            storeRelatedMeta.forEach((meta: any) => {
              console.log(`🏪 Customer ${customer.email} has store-related meta:`, meta)
              
              // Handle different meta value types
              let metaValue = meta.value
              if (Array.isArray(metaValue)) {
                // Handle array values like pos_allowed_stores
                const storeMatch = metaValue.some((store: any) => {
                  const storeStr = String(store).toLowerCase()
                  return storeStr.includes(storeId.toLowerCase()) || 
                         storeStr.includes('charlotte') ||
                         storeStr === rawStoreId
                })
                if (storeMatch) {
                  hasStoreAssignment = true
                  storeAssignmentData = meta
                  console.log(`🎯 STORE ASSIGNMENT MATCH (array):`, meta)
                }
              } else if (metaValue && typeof metaValue === 'string') {
                // Handle string values
                if (metaValue.toLowerCase().includes(storeId.toLowerCase()) ||
                    metaValue === rawStoreId) {
                  hasStoreAssignment = true
                  storeAssignmentData = meta
                  console.log(`🎯 STORE ASSIGNMENT MATCH (string):`, meta)
                }
              }
            })
          }

          // Also check billing address for store location
          if (customer.billing && customer.billing.city) {
            const cityMatch = customer.billing.city.toLowerCase().includes(storeId.toLowerCase()) ||
                             storeId.toLowerCase().includes(customer.billing.city.toLowerCase())
            if (cityMatch) {
              console.log(`🏪 Customer ${customer.email} billing city matches store:`, customer.billing.city)
              hasStoreAssignment = true
            }
          }

          // Check if this is a POS-enabled staff member (Addify Multi-Location Inventory format)
          const posEnabledMeta = customer.meta_data?.find((meta: any) => meta.key === 'pos_enabled')
          const posRoleMeta = customer.meta_data?.find((meta: any) => meta.key === 'pos_role')
          const isPosEnabled = posEnabledMeta?.value === '1' || posEnabledMeta?.value === 1
          const hasStaffPosRole = posRoleMeta?.value && ['manager', 'cashier', 'staff', 'employee', 'store_admin', 'super_admin'].includes(posRoleMeta.value)
          
          // Include if they have store assignment OR are POS-enabled staff OR are shop managers
          if (hasStoreAssignment || customer.role === 'shop_manager' || (isPosEnabled && hasStaffPosRole)) {
            const staffMember = {
              id: customer.username || customer.email?.split('@')[0] || `customer_${customer.id}`,
              name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username || customer.email,
              email: customer.email || '',
              role: posRoleMeta?.value || customer.role || 'staff',
              source: 'woocommerce_customers',
              wc_id: customer.id,
              store_specific: hasStoreAssignment || isPosEnabled,
              store_assignment: storeAssignmentData,
              pos_enabled: isPosEnabled,
              pos_role: posRoleMeta?.value
            }

            if (hasStoreAssignment) {
              console.log(`🏪 STORE-ASSIGNED STAFF FOUND:`, staffMember)
              storeSpecificStaff.push(staffMember)
            }

            allStaffMembers.push(staffMember)
          }
        })

      } else {
        console.error('❌ WooCommerce Customers API failed:', wcCustomersResponse.status)
      }
    } catch (error) {
      console.error('❌ WooCommerce Customers API error:', error)
    }

    // Method 4: Check orders for staff who have processed orders at this location
    console.log('📋 Method 4: Checking orders for location-specific staff activity...')
    try {
      const ordersResponse = await fetch(`https://api.floradistro.com/wp-json/wc/v3/orders?per_page=100`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      })

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json()
        console.log(`📊 Checking ${orders.length} orders for location-specific staff`)
        
        const locationStaff = new Map()
        
        orders.forEach((order: any) => {
          let orderLocation = null
          let orderStaff = null

          if (order.meta_data && Array.isArray(order.meta_data)) {
            // Find location information
            const locationMeta = order.meta_data.find((meta: any) => 
              meta.key && (
                meta.key.includes('location') || 
                meta.key.includes('store') ||
                meta.key === '_order_source_location'
              )
            )

            // Find staff information
            const staffMeta = order.meta_data.find((meta: any) => 
              meta.key && (
                meta.key.includes('staff') || 
                meta.key.includes('processed_by') ||
                meta.key.includes('cashier') ||
                meta.key.includes('employee')
              )
            )

            if (locationMeta) {
              orderLocation = locationMeta.value
              console.log(`📍 Order ${order.id} location:`, orderLocation)
            }

            if (staffMeta) {
              orderStaff = staffMeta.value
              console.log(`👤 Order ${order.id} staff:`, orderStaff)
            }

            // If both location and staff found, and location matches our store
            if (orderLocation && orderStaff && 
                typeof orderLocation === 'string' && 
                orderLocation.toLowerCase().includes(storeId.toLowerCase())) {
              
              console.log(`🎯 FOUND STAFF FOR THIS LOCATION: ${orderStaff} at ${orderLocation}`)
              
              if (!locationStaff.has(orderStaff)) {
                locationStaff.set(orderStaff, {
                  id: orderStaff,
                  name: orderStaff.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  email: `${orderStaff}@floradistro.com`,
                  role: 'shop_manager',
                  source: 'order_location_match',
                  location: orderLocation,
                  store_specific: true
                })
              }
            }
          }
        })

        const locationSpecificStaff = Array.from(locationStaff.values())
        console.log(`✅ Found ${locationSpecificStaff.length} location-specific staff from orders`)
        
        storeSpecificStaff.push(...locationSpecificStaff)
        allStaffMembers.push(...locationSpecificStaff)

      }
    } catch (error) {
      console.error('❌ Orders check failed:', error)
    }

    // Remove duplicates - prioritize Addify-assigned staff over other sources
    const uniqueStaff = new Map()
    const sourcePriority = {
      'addify_assigned_staff': 1,
      'woocommerce_customers': 2,
      'order_location_match': 3
    }
    
    // Sort by priority first, then deduplicate
    const sortedStaff = allStaffMembers.sort((a: any, b: any) => {
      const aPriority = sourcePriority[a.source as keyof typeof sourcePriority] || 999
      const bPriority = sourcePriority[b.source as keyof typeof sourcePriority] || 999
      return aPriority - bPriority
    })
    
    sortedStaff.forEach((staff: any) => {
      // Use email as primary key, fallback to name+email combination
      const key = staff.email || `${staff.name}_${staff.id}`
      if (key && !uniqueStaff.has(key)) {
        uniqueStaff.set(key, staff)
      }
    })

    const finalStaff = Array.from(uniqueStaff.values())
    
    console.log(`✅ Final results:`)
    console.log(`   - Total staff found: ${finalStaff.length}`)
    console.log(`   - Store-specific staff: ${storeSpecificStaff.length}`)
    
    finalStaff.forEach((staff: any, index: number) => {
      console.log(`👤 Staff ${index + 1}:`, {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        source: staff.source,
        store_specific: staff.store_specific || false
      })
    })

    // If we found real staff, don't include fallback data
    if (finalStaff.length > 0) {
      // Prioritize store-specific staff
      if (storeSpecificStaff.length > 0) {
        console.log(`🏪 Returning ${storeSpecificStaff.length} store-specific staff members`)
        return NextResponse.json(storeSpecificStaff)
      } else {
        console.log(`📋 Returning ${finalStaff.length} general staff members (no store-specific found)`)
        return NextResponse.json(finalStaff)
      }
    }

    // Only return fallback if no real staff found at all
    console.log('⚠️ No real staff found, returning minimal fallback')
    return NextResponse.json([
      { 
        id: `staff_${storeId.toLowerCase().replace(/\s+/g, '_')}`, 
        name: `${storeId} Staff`, 
        email: `staff@floradistro.com`, 
        role: 'shop_manager',
        source: 'fallback',
        store: storeId
      }
    ])

  } catch (error) {
    console.error('❌ Error fetching staff:', error)
    return NextResponse.json([])
  }
} 