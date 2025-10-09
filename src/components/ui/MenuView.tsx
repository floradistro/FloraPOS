/**
 * MenuView V2
 * Modern TV Menu Control Interface
 * VS Code/Apple Design - Dark Theme
 * 
 * Features:
 * - Live TV monitoring (shows all 6 TVs)
 * - Visual menu editor
 * - Instant push to TVs
 * - Realtime status
 * - Touch-optimized
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { apiFetch } from '../../lib/api-fetch'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { BlueprintPricingService } from '../../services/blueprint-pricing-service'
import { BlueprintFieldsService, ProductBlueprintFields } from '../../services/blueprint-fields-service'
import { Product } from '../../types'
import { SharedMenuDisplay } from './SharedMenuDisplay'
import { MenuToolbar, useMenuConfig } from './MenuToolbar'
import { menuConfigService, MenuConfig } from '../../services/menu-config-service'
import { storeConfigService, StoreConfig, TVConfig } from '../../services/store-config-service'
import { useTVDevices } from '../../hooks/useTVDevices'
import { TVCommandService } from '../../services/tv-command-service'
import { loadGoogleFont } from '../../lib/fonts'

interface MenuViewProps {
  searchQuery?: string
  categoryFilter?: string
}

export function MenuView({ searchQuery = '', categoryFilter }: MenuViewProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Window management with TV tracking (local windows)
  const [openWindows, setOpenWindows] = useState<Map<string, { window: Window, tvNumber: number, category: string }>>(new Map())
  
  // TV Devices from Supabase (shows ALL TVs across network)
  const { devices: tvDevices, isOnline, onlineCount, offlineCount, refresh: refreshTVs } = useTVDevices({
    locationId: user?.location_id ? parseInt(user.location_id.toString()) : undefined,
  })
  
  // Category column configurations
  const [categoryColumnConfigs, setCategoryColumnConfigs] = useState<Map<string, string[]>>(new Map())
  
  // Blueprint fields cache
  const [categoryBlueprintFields, setCategoryBlueprintFields] = useState<Map<string, ProductBlueprintFields[]>>(new Map())
  
  // Menu configuration hook
  const menuConfig = useMenuConfig()
  
  // Current loaded config name
  const [loadedConfigName, setLoadedConfigName] = useState<string | undefined>()
  
  // Show TV panel
  const [showTVPanel, setShowTVPanel] = useState(false)
  
  // Selected TV for editing
  const [selectedTV, setSelectedTV] = useState<string | null>(null)
  
  // Modal states
  const [showLoadConfigModal, setShowLoadConfigModal] = useState(false)
  const [showSaveLayoutModal, setShowSaveLayoutModal] = useState(false)
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false)
  const [configs, setConfigs] = useState<MenuConfig[]>([])
  const [saveLayoutName, setSaveLayoutName] = useState('')
  const [saveThemeName, setSaveThemeName] = useState('')
  
  // Load configs when load modal opens
  useEffect(() => {
    if (showLoadConfigModal) {
      const loadConfigs = async () => {
        try {
          const locationId = user?.location_id ? parseInt(user.location_id.toString()) : undefined
          console.log(`🔄 Loading configs for location: ${locationId}`)
          const allConfigs = await menuConfigService.getAllConfigs(locationId, false)
          console.log(`✅ Received ${allConfigs.length} configs:`, allConfigs)
          
          // Separate into layouts and themes
          const layouts: MenuConfig[] = []
          const themes: MenuConfig[] = []
          
          allConfigs.forEach(c => {
            console.log(`🔍 Processing config: ${c.name}, type: ${c.config_type}`, c)
            if (c.config_type === 'layout') {
              layouts.push(c)
            } else if (c.config_type === 'theme') {
              themes.push(c)
            } else {
              // Legacy: if no type, check if it has categories (layout) or just colors (theme)
              const hasCategories = c.config_data.singleMenu?.category || 
                                   c.config_data.dualMenu?.left?.category ||
                                   c.config_data.dualMenu?.right?.category
              console.log(`   Legacy config - hasCategories: ${hasCategories}`)
              if (hasCategories) {
                layouts.push(c)
              } else {
                themes.push(c)
              }
            }
          })
          
          setAvailableLayouts(layouts)
          setAvailableThemes(themes)
          console.log(`📋 Load modal: ${layouts.length} layouts, ${themes.length} themes`)
          console.log(`📋 Layouts:`, layouts)
          console.log(`📋 Themes:`, themes)
        } catch (error) {
          console.error('❌ Failed to load configs:', error)
        }
      }
      loadConfigs()
    }
  }, [showLoadConfigModal, user?.location_id])

  // Store Config Modal
  const [showStoreConfigModal, setShowStoreConfigModal] = useState(false)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [storeConfigLoading, setStoreConfigLoading] = useState(false)
  const [availableLayouts, setAvailableLayouts] = useState<MenuConfig[]>([])
  const [availableThemes, setAvailableThemes] = useState<MenuConfig[]>([])
  
  // Load store config when modal opens
  useEffect(() => {
    if (showStoreConfigModal && user?.location_id) {
      const loadStoreConfig = async () => {
        setStoreConfigLoading(true)
        try {
          const locationId = parseInt(user.location_id!.toString())
          const [config, allConfigs] = await Promise.all([
            storeConfigService.getStoreConfig(locationId),
            menuConfigService.getAllConfigs(locationId, false)
          ])
          
          // Separate layouts from themes
          const layouts = allConfigs.filter(c => c.config_type === 'layout')
          const themes = allConfigs.filter(c => c.config_type === 'theme')
          
          // If no type specified, treat configs with categories as layouts, others as themes
          allConfigs.forEach(c => {
            if (!c.config_type) {
              const hasCategories = c.config_data.singleMenu?.category || 
                                   c.config_data.dualMenu?.left?.category ||
                                   c.config_data.dualMenu?.right?.category
              if (hasCategories) {
                layouts.push(c)
              } else {
                themes.push(c)
              }
            }
          })
          
          setAvailableLayouts(layouts)
          setAvailableThemes(themes)
          console.log(`📋 Loaded ${layouts.length} layouts and ${themes.length} themes`)
          
          if (config) {
            setStoreConfig(config)
          } else {
            // Create default
            setStoreConfig({
              location_id: locationId,
              store_name: user.location || `Location ${locationId}`,
              tvs: [
                {
                  tv_number: 1,
                  display_name: 'TV 1',
                  orientation: 'horizontal',
                  layout_id: null,
                  theme_id: null,
                  auto_launch: false,
                  enabled: true
                }
              ]
            })
          }
        } catch (error) {
          console.error('Failed to load store config:', error)
        } finally {
          setStoreConfigLoading(false)
        }
      }
      loadStoreConfig()
    }
  }, [showStoreConfigModal, user?.location_id, user?.location])
  
  // Listen for custom events from Header buttons
  useEffect(() => {
    const handleStoreConfigEvent = () => {
      setStoreConfig(null) // Clear previous state
      setShowStoreConfigModal(true) // Will trigger reload via useEffect
    }
    
    const handleLoadEvent = () => {
      console.log('🔧 Load config triggered')
      setShowLoadConfigModal(true)
    }
    
    const handleSaveLayoutEvent = () => {
      console.log('🔧 Save layout triggered')
      setShowSaveLayoutModal(true)
    }
    
    const handleSaveThemeEvent = () => {
      console.log('🔧 Save theme triggered')
      setShowSaveThemeModal(true)
    }
    
    const handleQREvent = () => {
      console.log('🔧 QR code triggered')
      if (!user?.location_id) {
        alert('No location selected')
        return
      }
      setShowQRCodeModal(true)
    }

    window.addEventListener('menu-store-config', handleStoreConfigEvent)
    window.addEventListener('menu-load-config', handleLoadEvent)
    window.addEventListener('menu-save-layout', handleSaveLayoutEvent)
    window.addEventListener('menu-save-theme', handleSaveThemeEvent)
    window.addEventListener('menu-qr-code', handleQREvent)

    return () => {
      window.removeEventListener('menu-store-config', handleStoreConfigEvent)
      window.removeEventListener('menu-load-config', handleLoadEvent)
      window.removeEventListener('menu-save-layout', handleSaveLayoutEvent)
      window.removeEventListener('menu-save-theme', handleSaveThemeEvent)
      window.removeEventListener('menu-qr-code', handleQREvent)
    }
  }, [user?.location_id])
  
  // Auto-select first category on load - DISABLED: Show empty state by default
  // useEffect(() => {
  //   if (products.length > 0 && !menuConfig.singlePanel.category) {
  //     const categories = getUniqueCategories()
  //     if (categories.length > 0) {
  //       menuConfig.updateActivePanel({ category: categories[0].slug })
  //     }
  //   }
  // }, [products, menuConfig])
  
  // Load theme from API
  const handleLoadConfig = useCallback((config: MenuConfig) => {
    const data = config.config_data
    
    // Apply layout
    menuConfig.setOrientation(data.orientation || 'horizontal')
    menuConfig.setIsDualMode(data.isDualMenu || false)
    
    // Apply colors
    menuConfig.setBackgroundColor(data.backgroundColor || '#000000')
    menuConfig.setFontColor(data.fontColor || '#ffffff')
    if (data.cardFontColor) menuConfig.setCardFontColor(data.cardFontColor)
    menuConfig.setContainerColor(data.containerColor || '#1a1a1a')
    if (data.imageBackgroundColor) menuConfig.setImageBackgroundColor(data.imageBackgroundColor)
    
    // Apply fonts
    if (data.titleFont) menuConfig.setTitleFont(data.titleFont)
    if (data.pricingFont) menuConfig.setPricingFont(data.pricingFont)
    if (data.cardFont) menuConfig.setCardFont(data.cardFont)
    
    // Load panel configs
    if (data.singleMenu) {
      menuConfig.singlePanel.category = data.singleMenu.category
      menuConfig.singlePanel.viewMode = data.singleMenu.viewMode
      menuConfig.singlePanel.showImages = data.singleMenu.showImages
      menuConfig.singlePanel.priceLocation = data.singleMenu.priceLocation || data.singlePriceLocation || 'none'
    }
    
    if (data.dualMenu) {
      menuConfig.leftPanel.category = data.dualMenu.left.category
      menuConfig.leftPanel.viewMode = data.dualMenu.left.viewMode
      menuConfig.leftPanel.showImages = data.dualMenu.left.showImages
      menuConfig.leftPanel.priceLocation = data.dualMenu.left.priceLocation || data.leftPriceLocation || 'none'
      
      menuConfig.rightPanel.category = data.dualMenu.right.category
      menuConfig.rightPanel.viewMode = data.dualMenu.right.viewMode
      menuConfig.rightPanel.showImages = data.dualMenu.right.showImages
      menuConfig.rightPanel.priceLocation = data.dualMenu.right.priceLocation || data.rightPriceLocation || 'none'
    }
    
    setLoadedConfigName(config.name)
    console.log('✅ Loaded theme:', config.name)
  }, [menuConfig])
  
  // Save as Layout (menu structure)
  const handleSaveLayout = useCallback(async (name: string) => {
    const configData = {
      orientation: menuConfig.orientation,
      isDualMenu: menuConfig.isDualMode,
      singleMenu: {
        category: menuConfig.singlePanel.category,
        viewMode: menuConfig.singlePanel.viewMode,
        showImages: menuConfig.singlePanel.showImages,
        priceLocation: menuConfig.singlePanel.priceLocation
      },
      dualMenu: {
        left: {
          category: menuConfig.leftPanel.category,
          viewMode: menuConfig.leftPanel.viewMode,
          showImages: menuConfig.leftPanel.showImages,
          priceLocation: menuConfig.leftPanel.priceLocation
        },
        right: {
          category: menuConfig.rightPanel.category,
          viewMode: menuConfig.rightPanel.viewMode,
          showImages: menuConfig.rightPanel.showImages,
          priceLocation: menuConfig.rightPanel.priceLocation
        },
        leftBottom: null,
        rightBottom: null,
        enableLeftStacking: false,
        enableRightStacking: false
      },
      backgroundColor: '#000000', // Default
      fontColor: '#ffffff', // Default
      containerColor: '#1a1a1a', // Default
      categoryColumnConfigs: {}
    }
    
    const newConfig = await menuConfigService.createConfig({
      name: name,
      location_id: user?.location_id ? parseInt(user.location_id.toString()) : null,
      config_data: configData,
      config_type: 'layout',
      is_active: false,
      display_order: 0
    })
    
    console.log('✅ Saved layout:', newConfig.name)
    setLoadedConfigName(newConfig.name)
  }, [menuConfig, user?.location_id])
  
  // Save as Theme (aesthetics only)
  const handleSaveTheme = useCallback(async (name: string) => {
    const configData = {
      orientation: 'horizontal' as 'horizontal' | 'vertical', // Not used for themes
      isDualMenu: false, // Not used for themes
      singleMenu: { category: null, viewMode: 'auto' as 'auto' | 'table' | 'card', showImages: false, priceLocation: 'none' as 'none' | 'inline' | 'header' },
      dualMenu: {
        left: { category: null, viewMode: 'auto' as 'auto' | 'table' | 'card', showImages: false, priceLocation: 'none' as 'none' | 'inline' | 'header' },
        right: { category: null, viewMode: 'auto' as 'auto' | 'table' | 'card', showImages: false, priceLocation: 'none' as 'none' | 'inline' | 'header' },
        leftBottom: null,
        rightBottom: null,
        enableLeftStacking: false,
        enableRightStacking: false
      },
      backgroundColor: menuConfig.backgroundColor,
      fontColor: menuConfig.fontColor,
      cardFontColor: menuConfig.cardFontColor,
      containerColor: menuConfig.containerColor,
      imageBackgroundColor: menuConfig.imageBackgroundColor,
      titleFont: menuConfig.titleFont,
      pricingFont: menuConfig.pricingFont,
      cardFont: menuConfig.cardFont,
      categoryColumnConfigs: {}
    }
    
    const newConfig = await menuConfigService.createConfig({
      name: name,
      location_id: user?.location_id ? parseInt(user.location_id.toString()) : null,
      config_data: configData,
      config_type: 'theme',
      is_active: false,
      display_order: 0
    })
    
    console.log('✅ Saved theme:', newConfig.name)
    setLoadedConfigName(newConfig.name)
  }, [menuConfig, user?.location_id])
  
  // Handle load theme from modal
  const handleLoadFromModal = useCallback(async (configId: number) => {
    try {
      const config = await menuConfigService.getConfig(configId)
      handleLoadConfig(config)
      setShowLoadConfigModal(false)
    } catch (error) {
      console.error('Failed to load theme:', error)
      alert('Failed to load theme')
    }
  }, [handleLoadConfig])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!user?.location_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        per_page: '1000',
        _t: Date.now().toString()
      })
      
      if (user?.location_id) {
        params.append('location_id', user.location_id.toString())
      }

      const response = await apiFetch(`/api/proxy/flora-im/products?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} products`)
        
        // Load blueprint pricing using BATCH API
        try {
          const productsWithCategories = result.data.map((product: Product) => ({
            id: product.id,
            categoryIds: product.categories?.map(cat => cat.id) || []
          }))
          
          const batchPricingResponse = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories)
          
          // Apply pricing to products
          const productsWithPricing = result.data.map((product: Product) => {
            const pricingData = batchPricingResponse[product.id]
            return { ...product, blueprintPricing: pricingData || null }
          })
          
          // Filter to show only products with stock > 0 at current location (same as TV menu and ProductGrid)
          const inStockProducts = productsWithPricing.filter((product: Product) => {
            if (!user?.location_id) return true // Show all if no location
            
            const locationInventory = product.inventory?.find((inv: any) => 
              inv.location_id?.toString() === user.location_id.toString()
            )
            const locationStock = locationInventory ? (parseFloat(locationInventory.stock?.toString() || '0') || parseFloat(locationInventory.quantity?.toString() || '0') || 0) : 0
            return locationStock > 0
          })
          
          console.log(`✅ Preview showing ${inStockProducts.length} in-stock products at location ${user?.location_id}`)
          
          setProducts(inStockProducts)
        } catch (err) {
          console.warn('Failed to load blueprint pricing:', err)
          
          // Even on pricing error, filter by stock
          const inStockProducts = result.data.filter((product: Product) => {
            if (!user?.location_id) return true
            
            const locationInventory = product.inventory?.find((inv: any) => 
              inv.location_id?.toString() === user.location_id.toString()
            )
            const locationStock = locationInventory ? (parseFloat(locationInventory.stock?.toString() || '0') || parseFloat(locationInventory.quantity?.toString() || '0') || 0) : 0
            return locationStock > 0
          })
          
          setProducts(inStockProducts)
        }
      } else {
        throw new Error(result.error || 'Failed to load products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user?.location_id])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])
  
  // Load fonts dynamically when changed
  useEffect(() => {
    loadGoogleFont(menuConfig.titleFont)
    loadGoogleFont(menuConfig.pricingFont)
    loadGoogleFont(menuConfig.cardFont)
  }, [menuConfig.titleFont, menuConfig.pricingFont, menuConfig.cardFont])

  const getUniqueCategories = useCallback(() => {
    const categoryMap = new Map()
    products.forEach(product => {
      product.categories?.forEach(category => {
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, category)
        }
      })
    })
    return Array.from(categoryMap.values())
  }, [products])

  // Load blueprint fields - uses ref to prevent infinite loops
  const loadedFieldsRef = React.useRef(new Set<string>());
  
  const loadCategoryBlueprintFields = useCallback(async (categorySlug: string) => {
    // Skip if already loaded or currently loading
    if (loadedFieldsRef.current.has(categorySlug)) {
      return;
    }
    
    // Mark as loading
    loadedFieldsRef.current.add(categorySlug);

    const category = getUniqueCategories().find(c => c.slug === categorySlug)
    if (!category) return

    try {
      const fields = await BlueprintFieldsService.getCategoryProductsBlueprintFields(category.id)
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, fields))
    } catch (error) {
      console.warn(`Failed to load blueprint fields for ${category.name}:`, error)
      setCategoryBlueprintFields(prev => new Map(prev).set(categorySlug, []))
    }
  }, [getUniqueCategories])

  // Load blueprint fields for active categories
  useEffect(() => {
    if (!menuConfig.isDualMode && menuConfig.singlePanel?.category) {
      loadCategoryBlueprintFields(menuConfig.singlePanel.category)
    }
    if (menuConfig.isDualMode) {
      if (menuConfig.leftPanel?.category) loadCategoryBlueprintFields(menuConfig.leftPanel.category)
      if (menuConfig.rightPanel?.category) loadCategoryBlueprintFields(menuConfig.rightPanel.category)
    }
  }, [menuConfig.isDualMode, menuConfig.singlePanel?.category, menuConfig.leftPanel?.category, menuConfig.rightPanel?.category, loadCategoryBlueprintFields])

  const handleLaunch = useCallback(() => {
    const baseUrl = '/menu-display'
    const params = new URLSearchParams()
    
    // Add location and TV number
    const nextTVNumber = openWindows.size + 1
    params.append('location_id', (user?.location_id || 20).toString())
    params.append('tv_number', nextTVNumber.toString())
    
    params.append('orientation', menuConfig.orientation)
    params.append('backgroundColor', menuConfig.backgroundColor)
    params.append('fontColor', menuConfig.fontColor)
    params.append('cardFontColor', menuConfig.cardFontColor)
    params.append('containerColor', menuConfig.containerColor)
    params.append('imageBackgroundColor', menuConfig.imageBackgroundColor)
    params.append('titleFont', menuConfig.titleFont)
    params.append('pricingFont', menuConfig.pricingFont)
    params.append('cardFont', menuConfig.cardFont)
    params.append('containerOpacity', menuConfig.containerOpacity.toString())
    params.append('borderWidth', menuConfig.borderWidth.toString())
    params.append('borderOpacity', menuConfig.borderOpacity.toString())

    if (menuConfig.isDualMode) {
      params.append('dual', 'true')
      console.log('🚀 Launching DUAL menu with configs:', {
        left: {
          category: menuConfig.leftPanel.category,
          viewMode: menuConfig.leftPanel.viewMode,
          showImages: menuConfig.leftPanel.showImages,
          priceLocation: menuConfig.leftPanel.priceLocation
        },
        right: {
          category: menuConfig.rightPanel.category,
          viewMode: menuConfig.rightPanel.viewMode,
          showImages: menuConfig.rightPanel.showImages,
          priceLocation: menuConfig.rightPanel.priceLocation
        }
      });
      
      if (menuConfig.leftPanel.category) {
        params.append('leftCategory', menuConfig.leftPanel.category)
        params.append('leftViewMode', menuConfig.leftPanel.viewMode)
        params.append('leftPriceLocation', menuConfig.leftPanel.priceLocation || 'inline')
        if (menuConfig.leftPanel.showImages) params.append('leftImages', 'true')
      }
      if (menuConfig.rightPanel.category) {
        params.append('rightCategory', menuConfig.rightPanel.category)
        params.append('rightViewMode', menuConfig.rightPanel.viewMode)
        params.append('rightPriceLocation', menuConfig.rightPanel.priceLocation || 'inline')
        if (menuConfig.rightPanel.showImages) params.append('rightImages', 'true')
      }
      
      // Left Bottom quadrant (stacking)
      if (menuConfig.dualMenu.leftBottom?.category) {
        params.append('leftCategory2', menuConfig.dualMenu.leftBottom.category)
        params.append('leftViewMode2', menuConfig.dualMenu.leftBottom.viewMode)
        params.append('leftPriceLocation2', menuConfig.dualMenu.leftBottom.priceLocation || 'inline')
        if (menuConfig.dualMenu.leftBottom.showImages) params.append('leftImages2', 'true')
        params.append('enableLeftStacking', 'true')
      }
      
      // Right Bottom quadrant (stacking)
      if (menuConfig.dualMenu.rightBottom?.category) {
        params.append('rightCategory2', menuConfig.dualMenu.rightBottom.category)
        params.append('rightViewMode2', menuConfig.dualMenu.rightBottom.viewMode)
        params.append('rightPriceLocation2', menuConfig.dualMenu.rightBottom.priceLocation || 'inline')
        if (menuConfig.dualMenu.rightBottom.showImages) params.append('rightImages2', 'true')
        params.append('enableRightStacking', 'true')
      }
      
      console.log('🚀 Launch URL params:', params.toString());
    } else {
      params.append('viewMode', menuConfig.singlePanel.viewMode)
      params.append('priceLocation', menuConfig.singlePanel.priceLocation || 'inline')
      if (menuConfig.singlePanel.category) {
        params.append('category', menuConfig.singlePanel.category)
      }
      if (menuConfig.singlePanel.showImages) {
        params.append('showImages', 'true')
      }
    }

    const url = `${baseUrl}?${params.toString()}`
    const newWindow = window.open(url, '_blank', 'width=1920,height=1080')
    
    if (newWindow) {
      const windowKey = `tv-${nextTVNumber}`
      const currentCategory = menuConfig.isDualMode 
        ? `${menuConfig.leftPanel.category || ''} / ${menuConfig.rightPanel.category || ''}`
        : menuConfig.singlePanel.category || 'All'
        
      setOpenWindows(prev => new Map(prev).set(windowKey, {
        window: newWindow,
        tvNumber: nextTVNumber,
        category: currentCategory
      }))
      
      console.log(`✅ Launched TV ${nextTVNumber}`)
      
      // Check if window closed - faster polling for better sync
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setOpenWindows(prev => {
            const updated = new Map(prev)
            updated.delete(windowKey)
            return updated
          })
          clearInterval(checkClosed)
          console.log(`📺 TV ${nextTVNumber} closed`)
        }
      }, 300) // Check every 300ms for faster ghost removal
      
      // Store interval ID for cleanup
      if (newWindow) {
        (newWindow as any).__closeCheckInterval = checkClosed;
      }
    }
  }, [menuConfig, openWindows.size, user?.location_id])
  
  // Cleanup function for all window intervals
  useEffect(() => {
    return () => {
      openWindows.forEach(({window: win}) => {
        if ((win as any).__closeCheckInterval) {
          clearInterval((win as any).__closeCheckInterval);
        }
      });
    };
  }, [openWindows])
  
  // Force sync check when TV panel opens
  useEffect(() => {
    if (showTVPanel) {
      console.log('🔄 TV Panel opened - checking window states...');
      setOpenWindows(prev => {
        const updated = new Map(prev);
        let changesDetected = false;
        prev.forEach((tvData, key) => {
          if (tvData.window.closed) {
            updated.delete(key);
            changesDetected = true;
            console.log(`🗑️ Removed closed window: ${key}`);
          }
        });
        return changesDetected ? updated : prev;
      });
    }
  }, [showTVPanel])


  const categories = getUniqueCategories()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️ Error loading products</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      {/* Save Layout Modal */}
      {showSaveLayoutModal && (
        <>
          <div 
            className="fixed inset-0 transition-all duration-500"
            style={{ 
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)'
            }}
            onClick={() => setShowSaveLayoutModal(false)}
          />
          <div 
            className="fixed rounded-2xl overflow-hidden shadow-2xl p-6"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90vw, 500px)',
              zIndex: 99999,
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Save Layout</h3>
            <p className="text-xs text-neutral-400 mb-3">Saves menu structure (categories, single/dual, view modes)</p>
            
            <input
              type="text"
              value={saveLayoutName}
              onChange={(e) => setSaveLayoutName(e.target.value)}
              placeholder="Enter layout name..."
              className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm mb-4"
              style={{ fontFamily: 'Tiempos, serif' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveLayoutName.trim()) {
                  handleSaveLayout(saveLayoutName);
                  setShowSaveLayoutModal(false);
                  setSaveLayoutName('');
                }
              }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!saveLayoutName.trim()) {
                    alert('Please enter a layout name');
                    return;
                  }
                  await handleSaveLayout(saveLayoutName);
                  setShowSaveLayoutModal(false);
                  setSaveLayoutName('');
                }}
                className="flex-1 px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white font-medium transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Save Layout
              </button>
              <button
                onClick={() => {
                  setShowSaveLayoutModal(false);
                  setSaveLayoutName('');
                }}
                className="px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Save Theme Modal */}
      {showSaveThemeModal && (
        <>
          <div 
            className="fixed inset-0 transition-all duration-500"
            style={{ 
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)'
            }}
            onClick={() => setShowSaveThemeModal(false)}
          />
          <div 
            className="fixed rounded-2xl overflow-hidden shadow-2xl p-6"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90vw, 500px)',
              zIndex: 99999,
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Save Theme</h3>
            <p className="text-xs text-neutral-400 mb-3">Saves visual style (colors, fonts, backgrounds)</p>
            
            <input
              type="text"
              value={saveThemeName}
              onChange={(e) => setSaveThemeName(e.target.value)}
              placeholder="Enter theme name..."
              className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 ease-out backdrop-blur-sm mb-4"
              style={{ fontFamily: 'Tiempos, serif' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveThemeName.trim()) {
                  handleSaveTheme(saveThemeName);
                  setShowSaveThemeModal(false);
                  setSaveThemeName('');
                }
              }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!saveThemeName.trim()) {
                    alert('Please enter a theme name');
                    return;
                  }
                  await handleSaveTheme(saveThemeName);
                  setShowSaveThemeModal(false);
                  setSaveThemeName('');
                }}
                className="flex-1 px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white font-medium transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Save Theme
              </button>
              <button
                onClick={() => {
                  setShowSaveThemeModal(false);
                  setSaveThemeName('');
                }}
                className="px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Load Config Modal */}
      {showLoadConfigModal && (
        <>
          <div 
            className="fixed inset-0 transition-all duration-500"
            style={{ 
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)'
            }}
            onClick={() => setShowLoadConfigModal(false)}
          />
          <div 
            className="fixed rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90vw, 700px)',
              maxHeight: '85vh',
              zIndex: 99999,
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4 px-8 pt-6">Load Layouts & Themes</h3>
            
            <div className="flex-1 overflow-y-auto px-8 pb-4" style={{ minHeight: 0 }}>
              {/* Debug Info */}
              <div className="mb-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                Debug: {availableLayouts.length} layouts, {availableThemes.length} themes loaded
              </div>
              
              {/* Layouts Section */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Layouts ({availableLayouts.length})</h4>
                {availableLayouts.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500 text-xs">
                    No layouts saved yet. Click "Save Layout" to create one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableLayouts.map(layout => (
                      <div
                        key={layout.id}
                        onClick={() => handleLoadFromModal(layout.id!)}
                        className="p-3 bg-neutral-600/10 hover:bg-neutral-600/20 border border-white/5 hover:border-white/20 rounded-lg cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-white group-hover:text-neutral-200 transition-colors">{layout.name}</h5>
                            <p className="text-xs text-neutral-400 mt-1">
                              {layout.config_data.isDualMenu ? 'Dual Menu' : 'Single Menu'}
                              {layout.config_data.isDualMenu && layout.config_data.dualMenu ? 
                                ` • ${layout.config_data.dualMenu.left.category || '?'} | ${layout.config_data.dualMenu.right.category || '?'}` 
                                : layout.config_data.singleMenu?.category ? ` • ${layout.config_data.singleMenu.category}` : ''}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Themes Section */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Themes ({availableThemes.length})</h4>
                {availableThemes.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500 text-xs">
                    No themes saved yet. Click "Save Theme" to create one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableThemes.map(theme => (
                      <div
                        key={theme.id}
                        onClick={() => handleLoadFromModal(theme.id!)}
                        className="p-3 bg-neutral-600/10 hover:bg-neutral-600/20 border border-white/5 hover:border-white/20 rounded-lg cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-white group-hover:text-neutral-200 transition-colors">{theme.name}</h5>
                            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.config_data.backgroundColor }}></span>
                              Colors & Fonts
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0 px-8 py-4 border-t border-white/5">
              <button
                onClick={() => setShowLoadConfigModal(false)}
                className="w-full px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* QR Code Modal */}
      {showQRCodeModal && (
        <>
          <div 
            className="fixed inset-0 transition-all duration-500"
            style={{ 
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)'
            }}
            onClick={() => setShowQRCodeModal(false)}
          />
          <div 
            className="fixed rounded-2xl overflow-hidden shadow-2xl p-6"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90vw, 500px)',
              zIndex: 99999,
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">QR Code - Location {user?.location_id}</h3>
            
            <div className="bg-white p-6 rounded-xl mb-4 flex items-center justify-center">
              <img 
                src={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(`${window.location.origin}/menu-display?location_id=${user?.location_id}`)}&choe=UTF-8`}
                alt="QR Code" 
                className="w-full max-w-[300px]" 
              />
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-neutral-400 mb-2">Scan this QR code to open menu on any device:</p>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/menu-display?location_id=${user?.location_id}`}
                className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 focus:outline-none text-xs font-mono transition-all duration-200 backdrop-blur-sm"
                onClick={(e) => e.currentTarget.select()}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            
            <div className="flex gap-2">
              <a
                href={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(`${window.location.origin}/menu-display?location_id=${user?.location_id}`)}&choe=UTF-8`}
                download={`menu-qr-location-${user?.location_id}.png`}
                className="flex-1 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg text-white text-center font-medium transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Download QR
              </a>
              <button
                onClick={() => setShowQRCodeModal(false)}
                className="px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Store Config Modal - Match Load Config Theme */}
      {showStoreConfigModal && storeConfig && (
        <>
          <div 
            className="fixed inset-0 transition-all duration-500"
            style={{ 
              zIndex: 99998,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)'
            }}
            onClick={() => setShowStoreConfigModal(false)}
          />
          <div 
            className="fixed rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90vw, 900px)',
              maxHeight: '85vh',
              zIndex: 99999,
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-8 pt-6 pb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Store Configuration</h3>
              
              {/* Store Name */}
              <input
                type="text"
                value={storeConfig.store_name}
                onChange={(e) => setStoreConfig({ ...storeConfig, store_name: e.target.value })}
                placeholder="Store Name"
                className="w-full px-3 py-2 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-sm transition-all duration-200 ease-out backdrop-blur-sm mb-2"
                style={{ fontFamily: 'Tiempos, serif' }}
              />
              
              <div className="text-xs text-neutral-500">
                Location {storeConfig.location_id} • {storeConfig.id ? `ID: ${storeConfig.id}` : 'Not saved yet'}
              </div>
            </div>
            
            {storeConfigLoading ? (
              <div className="text-center py-12 text-neutral-400">Loading...</div>
            ) : (
              <>
                {/* Scrollable TV List */}
                <div className="flex-1 overflow-y-auto px-8 pb-4" style={{ minHeight: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                      TV Displays ({storeConfig.tvs.length})
                    </h4>
                    <button
                      onClick={() => {
                        const newTVNumber = Math.max(...storeConfig.tvs.map(tv => tv.tv_number), 0) + 1
                        setStoreConfig({
                          ...storeConfig,
                          tvs: [...storeConfig.tvs, {
                            tv_number: newTVNumber,
                            display_name: `TV ${newTVNumber}`,
                            orientation: 'horizontal',
                            layout_id: null,
                            theme_id: null,
                            auto_launch: false,
                            enabled: true
                          }]
                        })
                      }}
                      className="px-3 py-1.5 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white text-xs transition-all duration-200"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      + Add TV
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {storeConfig.tvs.map((tv, index) => (
                      <div
                        key={tv.tv_number}
                        className="p-4 bg-neutral-600/10 hover:bg-neutral-600/20 border border-white/5 hover:border-white/20 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          {/* TV Number Badge */}
                          <div className="flex-shrink-0 w-8 h-8 bg-neutral-700/50 border border-white/10 rounded flex items-center justify-center">
                            <span className="text-sm font-bold text-neutral-300">{tv.tv_number}</span>
                          </div>

                          {/* TV Config */}
                          <div className="flex-1 space-y-2">
                            {/* Row 1: Display Name & Orientation */}
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Display Name"
                                value={tv.display_name}
                                onChange={(e) => {
                                  setStoreConfig({
                                    ...storeConfig,
                                    tvs: storeConfig.tvs.map(t => 
                                      t.tv_number === tv.tv_number ? { ...t, display_name: e.target.value } : t
                                    )
                                  })
                                }}
                                className="px-3 py-1.5 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 placeholder-neutral-500 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 backdrop-blur-sm"
                                style={{ fontFamily: 'Tiempos, serif' }}
                              />

                              <select
                                value={tv.orientation}
                                onChange={(e) => {
                                  setStoreConfig({
                                    ...storeConfig,
                                    tvs: storeConfig.tvs.map(t => 
                                      t.tv_number === tv.tv_number ? { ...t, orientation: e.target.value as any } : t
                                    )
                                  })
                                }}
                                className="px-3 py-1.5 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 backdrop-blur-sm"
                                style={{ fontFamily: 'Tiempos, serif' }}
                              >
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                              </select>
                            </div>

                            {/* Row 2: Layout Selection */}
                            <select
                              value={tv.layout_id || ''}
                              onChange={(e) => {
                                const layoutId = e.target.value ? parseInt(e.target.value) : null
                                const layout = availableLayouts.find(l => l.id === layoutId)
                                setStoreConfig({
                                  ...storeConfig,
                                  tvs: storeConfig.tvs.map(t => 
                                    t.tv_number === tv.tv_number ? { ...t, layout_id: layoutId, layout_name: layout?.name } : t
                                  )
                                })
                              }}
                              className="w-full px-3 py-1.5 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            >
                              <option value="">Select Layout...</option>
                              {availableLayouts.map(layout => (
                                <option key={layout.id} value={layout.id}>
                                  {layout.name} ({layout.config_data.isDualMenu ? 'Dual' : 'Single'})
                                </option>
                              ))}
                            </select>

                            {/* Row 3: Theme Selection */}
                            <select
                              value={tv.theme_id || ''}
                              onChange={(e) => {
                                const themeId = e.target.value ? parseInt(e.target.value) : null
                                const theme = availableThemes.find(t => t.id === themeId)
                                setStoreConfig({
                                  ...storeConfig,
                                  tvs: storeConfig.tvs.map(t => 
                                    t.tv_number === tv.tv_number ? { ...t, theme_id: themeId, theme_name: theme?.name } : t
                                  )
                                })
                              }}
                              className="w-full px-3 py-1.5 bg-neutral-600/10 hover:bg-neutral-600/15 rounded-lg text-neutral-400 focus:bg-neutral-600/15 focus:outline-none text-xs transition-all duration-200 backdrop-blur-sm"
                              style={{ fontFamily: 'Tiempos, serif' }}
                            >
                              <option value="">Select Theme...</option>
                              {availableThemes.map(theme => (
                                <option key={theme.id} value={theme.id}>{theme.name}</option>
                              ))}
                            </select>

                            {/* Row 4: Enabled & Status */}
                            <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 mt-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`tv-${tv.tv_number}-enabled`}
                                  checked={tv.enabled}
                                  onChange={(e) => {
                                    setStoreConfig({
                                      ...storeConfig,
                                      tvs: storeConfig.tvs.map(t => 
                                        t.tv_number === tv.tv_number ? { ...t, enabled: e.target.checked } : t
                                      )
                                    })
                                  }}
                                  className="w-4 h-4 bg-neutral-700 border-neutral-600 text-blue-500 focus:ring-blue-500 rounded"
                                />
                                <label htmlFor={`tv-${tv.tv_number}-enabled`} className="text-xs text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                                  Enabled
                                </label>
                              </div>
                              
                              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                                {tv.layout_name || '—'} • {tv.theme_name || '—'}
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          {storeConfig.tvs.length > 1 && (
                            <button
                              onClick={() => {
                                setStoreConfig({
                                  ...storeConfig,
                                  tvs: storeConfig.tvs.filter(t => t.tv_number !== tv.tv_number)
                                })
                              }}
                              className="flex-shrink-0 text-neutral-500 hover:text-neutral-300 transition-all p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 px-8 py-4 border-t border-white/5">
                  <button
                    onClick={async () => {
                      try {
                        
                        let savedConfig: StoreConfig;
                        if (storeConfig.id) {
                          savedConfig = await storeConfigService.updateStoreConfig(storeConfig.location_id, storeConfig)
                        } else {
                          savedConfig = await storeConfigService.saveStoreConfig(storeConfig)
                        }
                        
                        setStoreConfig(savedConfig)
                        
                        const summary = storeConfig.tvs.map(tv => {
                          const layoutInfo = tv.layout_name || 'No layout';
                          const themeInfo = tv.theme_name || 'No theme';
                          return `• ${tv.display_name}: ${tv.orientation} | ${layoutInfo} + ${themeInfo}`;
                        }).join('\n');
                        
                        alert(`Store config saved to database!\n\nLocation: ${storeConfig.location_id}\n\n${storeConfig.tvs.length} TVs configured:\n${summary}`)
                        setShowStoreConfigModal(false)
                      } catch (error) {
                        console.error('Failed to save:', error)
                        alert('Failed to save: ' + error)
                      }
                    }}
                    className="w-full px-4 py-2 bg-neutral-600/10 hover:bg-neutral-600/20 rounded-lg text-white font-medium transition-all duration-200"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    Save Store Config
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Top Toolbar */}
      <MenuToolbar
        orientation={menuConfig.orientation}
        onOrientationChange={menuConfig.setOrientation}
        singleMenu={menuConfig.singleMenu}
        onSingleMenuChange={menuConfig.setSingleMenu}
        dualMenu={menuConfig.dualMenu}
        onDualMenuChange={menuConfig.setDualMenu}
        isDualMode={menuConfig.isDualMode}
        onModeChange={menuConfig.setIsDualMode}
        selectedQuadrant={menuConfig.selectedQuadrant}
        onQuadrantChange={menuConfig.setSelectedQuadrant}
        backgroundColor={menuConfig.backgroundColor}
        fontColor={menuConfig.fontColor}
        containerColor={menuConfig.containerColor}
        cardFontColor={menuConfig.cardFontColor}
        imageBackgroundColor={menuConfig.imageBackgroundColor}
        onColorsChange={(colors) => {
          menuConfig.setBackgroundColor(colors.backgroundColor)
          menuConfig.setFontColor(colors.fontColor)
          menuConfig.setContainerColor(colors.containerColor)
          menuConfig.setCardFontColor(colors.cardFontColor)
          menuConfig.setImageBackgroundColor(colors.imageBackgroundColor)
        }}
        titleFont={menuConfig.titleFont}
        pricingFont={menuConfig.pricingFont}
        cardFont={menuConfig.cardFont}
        onFontsChange={(fonts) => {
          menuConfig.setTitleFont(fonts.titleFont)
          menuConfig.setPricingFont(fonts.pricingFont)
          menuConfig.setCardFont(fonts.cardFont)
        }}
        containerOpacity={menuConfig.containerOpacity}
        borderWidth={menuConfig.borderWidth}
        borderOpacity={menuConfig.borderOpacity}
        onTransparencyChange={(values) => {
          menuConfig.setContainerOpacity(values.containerOpacity)
          menuConfig.setBorderWidth(values.borderWidth)
          menuConfig.setBorderOpacity(values.borderOpacity)
        }}
        categories={categories}
        categoryColumnConfigs={categoryColumnConfigs}
        onColumnsChange={(categorySlug, columns) => {
          setCategoryColumnConfigs(prev => new Map(prev).set(categorySlug, columns))
        }}
        onLaunch={handleLaunch}
        canLaunch={true}
        launchTitle="Launch to TV"
        openWindowsCount={openWindows.size}
        maxWindows={6}
        loadedConfigName={loadedConfigName}
        onLoadConfig={() => setShowLoadConfigModal(true)}
        onSaveLayout={() => setShowSaveLayoutModal(true)}
        onSaveTheme={() => setShowSaveThemeModal(true)}
        onQRCode={() => setShowQRCodeModal(true)}
        onStoreConfig={() => setShowStoreConfigModal(true)}
        onToggleTVPanel={() => setShowTVPanel(!showTVPanel)}
        showTVPanel={showTVPanel}
        onlineCount={onlineCount}
        totalTVs={tvDevices.length}
        hasLocation={!!user?.location_id}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - TV Control Panel - Slide Out Overlay */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-80 bg-[#1e1e1e]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ease-out shadow-2xl ${
            showTVPanel ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
            {/* VSCode Style Tab */}
            <button
              onClick={() => setShowTVPanel(false)}
              className="absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-20 bg-[#1e1e1e]/95 backdrop-blur-xl border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center hover:bg-white/5 transition-all duration-200 group"
              style={{ boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)' }}
            >
              <svg className="w-4 h-4 text-white/40 group-hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Panel Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-medium text-white mb-2">TV Control Panel</h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  <span className="text-white/70">{onlineCount} Online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-white/50">{offlineCount} Offline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                  <span className="text-white/50">{openWindows.size} Local</span>
                </div>
              </div>
            </div>
            
            {/* TV List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Local Windows Section */}
              {openWindows.size > 0 && (
                <div>
                  <div className="px-2 mb-3 flex items-center justify-between">
                    <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Local Windows ({openWindows.size})
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          // Build URL with current config
                          const params = new URLSearchParams()
                          params.append('location_id', (user?.location_id || 20).toString())
                          params.append('orientation', menuConfig.orientation)
                          params.append('backgroundColor', menuConfig.backgroundColor)
                          params.append('fontColor', menuConfig.fontColor)
                          params.append('cardFontColor', menuConfig.cardFontColor)
                          params.append('containerColor', menuConfig.containerColor)
                          params.append('imageBackgroundColor', menuConfig.imageBackgroundColor)
                          params.append('titleFont', menuConfig.titleFont)
                          params.append('pricingFont', menuConfig.pricingFont)
                          params.append('cardFont', menuConfig.cardFont)
                          
                          if (menuConfig.isDualMode) {
                            params.append('dual', 'true')
                            if (menuConfig.leftPanel.category) {
                              params.append('leftCategory', menuConfig.leftPanel.category)
                              params.append('leftViewMode', menuConfig.leftPanel.viewMode)
                              params.append('leftPriceLocation', menuConfig.leftPanel.priceLocation || 'inline')
                              if (menuConfig.leftPanel.showImages) params.append('leftImages', 'true')
                            }
                            if (menuConfig.rightPanel.category) {
                              params.append('rightCategory', menuConfig.rightPanel.category)
                              params.append('rightViewMode', menuConfig.rightPanel.viewMode)
                              params.append('rightPriceLocation', menuConfig.rightPanel.priceLocation || 'inline')
                              if (menuConfig.rightPanel.showImages) params.append('rightImages', 'true')
                            }
                            // Quad support
                            if (menuConfig.dualMenu.leftBottom?.category) {
                              params.append('leftCategory2', menuConfig.dualMenu.leftBottom.category)
                              params.append('leftViewMode2', menuConfig.dualMenu.leftBottom.viewMode)
                              params.append('leftPriceLocation2', menuConfig.dualMenu.leftBottom.priceLocation || 'inline')
                              if (menuConfig.dualMenu.leftBottom.showImages) params.append('leftImages2', 'true')
                              params.append('enableLeftStacking', 'true')
                            }
                            if (menuConfig.dualMenu.rightBottom?.category) {
                              params.append('rightCategory2', menuConfig.dualMenu.rightBottom.category)
                              params.append('rightViewMode2', menuConfig.dualMenu.rightBottom.viewMode)
                              params.append('rightPriceLocation2', menuConfig.dualMenu.rightBottom.priceLocation || 'inline')
                              if (menuConfig.dualMenu.rightBottom.showImages) params.append('rightImages2', 'true')
                              params.append('enableRightStacking', 'true')
                            }
                          } else {
                            params.append('viewMode', menuConfig.singlePanel.viewMode)
                            params.append('priceLocation', menuConfig.singlePanel.priceLocation || 'inline')
                            if (menuConfig.singlePanel.category) {
                              params.append('category', menuConfig.singlePanel.category)
                            }
                            if (menuConfig.singlePanel.showImages) {
                              params.append('showImages', 'true')
                            }
                          }
                          
                          let count = 0;
                          openWindows.forEach(({window: win, tvNumber}) => {
                            if (!win.closed) {
                              params.set('tv_number', tvNumber.toString());
                              win.location.href = `/menu-display?${params.toString()}`;
                              count++;
                            }
                          });
                          console.log(`📤 Pushed current config to ${count} windows`);
                        }}
                        className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded transition-colors font-medium"
                        title="Push current config to all windows"
                      >
                        📤 Push to All
                      </button>
                      <button
                        onClick={() => {
                          openWindows.forEach(({window: win}) => {
                            if (!win.closed) win.location.reload();
                          });
                        }}
                        className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded transition-colors"
                        title="Refresh all windows"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Close all ${openWindows.size} windows?`)) {
                            openWindows.forEach(({window: win}) => win.close());
                            setOpenWindows(new Map());
                          }
                        }}
                        className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 rounded transition-colors"
                        title="Close all windows"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
              {Array.from(openWindows.entries())
                .filter(([_, tvData]) => !tvData.window.closed) // Filter out closed windows immediately
                .map(([key, tvData]) => {
                const isOpen = true // Already filtered for open windows
                
                return (
                  <div
                    key={key}
                    className={`group relative p-3 rounded border transition-all duration-200 cursor-pointer ${
                      selectedTV === key
                        ? 'bg-white/5 border-white/20'
                        : 'bg-transparent border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                    onClick={() => setSelectedTV(selectedTV === key ? null : key)}
                  >
                    {/* TV Number Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white/90">{tvData.tvNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white/90 truncate text-sm">
                          TV {tvData.tvNumber}
                        </div>
                        <div className="text-xs text-white/50 truncate mt-0.5">
                          {tvData.category}
                        </div>
                        <div className="text-xs flex items-center gap-2 mt-1">
                          <div className={`flex items-center gap-1 ${
                            isOpen ? 'text-white/80' : 'text-white/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isOpen ? 'bg-white/80 animate-pulse' : 'bg-white/20'
                            }`} />
                            {isOpen ? 'Live' : 'Closed'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          tvData.window.close()
                        }}
                        className="text-white/40 hover:text-white/90 transition-colors p-1"
                        title="Close window"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Quick Actions */}
                    {selectedTV === key && isOpen && (
                      <div className="space-y-1.5 mt-2 pt-2 border-t border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Build new URL with current config
                            const params = new URLSearchParams()
                            params.append('location_id', (user?.location_id || 20).toString())
                            params.append('tv_number', tvData.tvNumber.toString())
                            params.append('orientation', menuConfig.orientation)
                            params.append('backgroundColor', menuConfig.backgroundColor)
                            params.append('fontColor', menuConfig.fontColor)
                            params.append('cardFontColor', menuConfig.cardFontColor)
                            params.append('containerColor', menuConfig.containerColor)
                            params.append('imageBackgroundColor', menuConfig.imageBackgroundColor)
                            params.append('titleFont', menuConfig.titleFont)
                            params.append('pricingFont', menuConfig.pricingFont)
                            params.append('cardFont', menuConfig.cardFont)
                            
                            if (menuConfig.isDualMode) {
                              params.append('dual', 'true')
                              if (menuConfig.leftPanel.category) {
                                params.append('leftCategory', menuConfig.leftPanel.category)
                                params.append('leftViewMode', menuConfig.leftPanel.viewMode)
                                params.append('leftPriceLocation', menuConfig.leftPanel.priceLocation || 'inline')
                                if (menuConfig.leftPanel.showImages) params.append('leftImages', 'true')
                              }
                              if (menuConfig.rightPanel.category) {
                                params.append('rightCategory', menuConfig.rightPanel.category)
                                params.append('rightViewMode', menuConfig.rightPanel.viewMode)
                                params.append('rightPriceLocation', menuConfig.rightPanel.priceLocation || 'inline')
                                if (menuConfig.rightPanel.showImages) params.append('rightImages', 'true')
                              }
                              // Quad support
                              if (menuConfig.dualMenu.leftBottom?.category) {
                                params.append('leftCategory2', menuConfig.dualMenu.leftBottom.category)
                                params.append('leftViewMode2', menuConfig.dualMenu.leftBottom.viewMode)
                                params.append('leftPriceLocation2', menuConfig.dualMenu.leftBottom.priceLocation || 'inline')
                                if (menuConfig.dualMenu.leftBottom.showImages) params.append('leftImages2', 'true')
                                params.append('enableLeftStacking', 'true')
                              }
                              if (menuConfig.dualMenu.rightBottom?.category) {
                                params.append('rightCategory2', menuConfig.dualMenu.rightBottom.category)
                                params.append('rightViewMode2', menuConfig.dualMenu.rightBottom.viewMode)
                                params.append('rightPriceLocation2', menuConfig.dualMenu.rightBottom.priceLocation || 'inline')
                                if (menuConfig.dualMenu.rightBottom.showImages) params.append('rightImages2', 'true')
                                params.append('enableRightStacking', 'true')
                              }
                            } else {
                              params.append('viewMode', menuConfig.singlePanel.viewMode)
                              params.append('priceLocation', menuConfig.singlePanel.priceLocation || 'inline')
                              if (menuConfig.singlePanel.category) {
                                params.append('category', menuConfig.singlePanel.category)
                              }
                              if (menuConfig.singlePanel.showImages) {
                                params.append('showImages', 'true')
                              }
                            }
                            
                            const url = `/menu-display?${params.toString()}`
                            tvData.window.location.href = url
                            console.log(`📤 Pushed current config to TV ${tvData.tvNumber}`)
                          }}
                          className="w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded text-xs transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Push Current Config
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            tvData.window.location.reload()
                          }}
                          className="w-full px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            tvData.window.focus()
                          }}
                          className="w-full px-3 py-1.5 bg-transparent hover:bg-white/5 border border-white/10 text-white/70 rounded text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Focus
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
                  </div>
                </div>
              )}

              {/* Network TVs Section (from Supabase) */}
              {tvDevices.length > 0 && (
                <div>
                  <div className="px-2 mb-2 text-xs font-medium text-white/40 uppercase tracking-wider flex items-center justify-between">
                    <span>Network TVs</span>
                    <button
                      onClick={refreshTVs}
                      className="text-white/40 hover:text-white/90 transition-colors p-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tvDevices.map(tv => {
                      const online = isOnline(tv)
                      
                      return (
                        <div
                          key={tv.id}
                          className={`group relative p-3 rounded border transition-all duration-200 cursor-pointer ${
                            selectedTV === tv.id
                              ? 'bg-white/5 border-white/20'
                              : 'bg-transparent border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                          }`}
                          onClick={() => setSelectedTV(selectedTV === tv.id ? null : tv.id)}
                        >
                          {/* TV Number Badge */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-white/90">{tv.tv_number}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-normal text-white/90 truncate text-xs">
                                {tv.device_name}
                              </div>
                              <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                                <div className={`w-1 h-1 rounded-full ${
                                  online ? 'bg-white/60' : 'bg-white/20'
                                }`} />
                                {online ? 'Online' : 'Offline'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          {selectedTV === tv.id && online && (
                            <div className="space-y-1.5 mt-2 pt-2 border-t border-white/10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  TVCommandService.sendCommand(tv.id, 'update_theme', {
                                    backgroundColor: menuConfig.backgroundColor,
                                    fontColor: menuConfig.fontColor,
                                    cardFontColor: menuConfig.cardFontColor,
                                    containerColor: menuConfig.containerColor,
                                    imageBackgroundColor: menuConfig.imageBackgroundColor,
                                    titleFont: menuConfig.titleFont,
                                    pricingFont: menuConfig.pricingFont,
                                    cardFont: menuConfig.cardFont,
                                    orientation: menuConfig.orientation,
                                    isDualMenu: menuConfig.isDualMode,
                                    singleMenu: menuConfig.singlePanel,
                                    leftPanel: menuConfig.leftPanel,
                                    rightPanel: menuConfig.rightPanel
                                  })
                                }}
                                className="w-full px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded text-xs transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Push Config
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  TVCommandService.sendCommand(tv.id, 'refresh')
                                }}
                                className="w-full px-3 py-1.5 bg-transparent hover:bg-white/5 border border-white/10 text-white/70 rounded text-xs transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {openWindows.size === 0 && tvDevices.length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="w-32 h-32 flex items-center justify-center mb-4 relative mx-auto">
                      <Image 
                        src="/logo123.png" 
                        alt="Flora POS Logo" 
                        width={128}
                        height={128}
                        className="object-contain opacity-30 transition-all duration-500"
                        style={{
                          animation: 'subtle-float 3s ease-in-out infinite'
                        }}
                        priority
                      />
                    </div>
                    <p className="text-sm text-white/60 mb-3">No TV displays</p>
                    <p className="text-xs text-white/40">Launch local or wait for network TVs to connect</p>
                    
                    {/* Custom CSS animations */}
                    <style jsx>{`
                      @keyframes subtle-float {
                        0%, 100% { 
                          transform: translateY(0px) scale(1);
                          opacity: 0.3;
                        }
                        50% { 
                          transform: translateY(-2px) scale(1.02);
                          opacity: 0.4;
                        }
                      }
                    `}</style>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-white/10 space-y-2">
              {/* Refresh All Network TVs */}
              <button
                onClick={() => {
                  // Refresh local windows
                  Array.from(openWindows.values()).forEach(tv => {
                    if (!tv.window.closed) {
                      tv.window.location.reload()
                    }
                  })
                  
                  // Send refresh command to all network TVs
                  const locationId = user?.location_id ? parseInt(user.location_id.toString()) : 20
                  TVCommandService.broadcastToLocation(locationId, 'refresh')
                }}
                disabled={openWindows.size === 0 && onlineCount === 0}
                className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-50 border border-white/10 text-white/90 rounded text-xs transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh All ({openWindows.size + onlineCount})
              </button>
              
              {/* Push Config to All Network TVs */}
              {onlineCount > 0 && (
                <button
                  onClick={() => {
                    const locationId = user?.location_id ? parseInt(user.location_id.toString()) : 20
                    TVCommandService.broadcastToLocation(locationId, 'update_theme', {
                      backgroundColor: menuConfig.backgroundColor,
                      fontColor: menuConfig.fontColor,
                      cardFontColor: menuConfig.cardFontColor,
                      containerColor: menuConfig.containerColor,
                      imageBackgroundColor: menuConfig.imageBackgroundColor,
                      titleFont: menuConfig.titleFont,
                      pricingFont: menuConfig.pricingFont,
                      cardFont: menuConfig.cardFont,
                      orientation: menuConfig.orientation,
                      isDualMenu: menuConfig.isDualMode,
                      singleMenu: menuConfig.singlePanel,
                      leftPanel: menuConfig.leftPanel,
                      rightPanel: menuConfig.rightPanel
                    })
                  }}
                  className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Push to Network TVs ({onlineCount})
                </button>
              )}
              
              {/* Close Local Windows */}
              {openWindows.size > 0 && (
                <button
                  onClick={() => {
                    Array.from(openWindows.values()).forEach(tv => {
                      tv.window.close()
                    })
                  }}
                  className="w-full px-3 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-white/70 rounded text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close Local Windows
                </button>
              )}
            </div>
          </div>

        {/* Show TV Panel Button (when hidden) - VSCode Style Tab */}
        {!showTVPanel && (
          <button
            onClick={() => setShowTVPanel(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-20 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 rounded-r-lg flex items-center justify-center hover:bg-white/5 transition-all duration-200 group z-50"
            style={{ boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)' }}
          >
            <svg className="w-4 h-4 text-white/40 group-hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Main Preview Area */}
        <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
          {/* Preview - Full Width */}
          <div className="w-full h-full overflow-hidden">
            {(() => {
              console.log('📤 Passing to SharedMenuDisplay:', {
                isDualMode: menuConfig.isDualMode,
                singleCategory: menuConfig.singlePanel.category,
                leftTopCategory: menuConfig.leftPanel.category,
                rightTopCategory: menuConfig.rightPanel.category,
                leftBottomCategory: menuConfig.dualMenu.leftBottom?.category,
                rightBottomCategory: menuConfig.dualMenu.rightBottom?.category,
                leftViewMode: menuConfig.leftPanel.viewMode,
                rightViewMode: menuConfig.rightPanel.viewMode,
                enableLeftStacking: menuConfig.dualMenu.enableLeftStacking,
                enableRightStacking: menuConfig.dualMenu.enableRightStacking
              });
              return null;
            })()}
            <SharedMenuDisplay
              products={products}
              categories={categories}
              orientation={menuConfig.orientation}
              viewMode={menuConfig.isDualMode ? menuConfig.leftPanel.viewMode : menuConfig.singlePanel.viewMode}
              showImages={menuConfig.isDualMode ? menuConfig.leftPanel.showImages : menuConfig.singlePanel.showImages}
              leftMenuImages={menuConfig.leftPanel.showImages}
              rightMenuImages={menuConfig.rightPanel.showImages}
              categoryFilter={menuConfig.isDualMode ? null : menuConfig.singlePanel.category}
              selectedCategoryName={menuConfig.isDualMode ? null : categories.find(c => c.slug === menuConfig.singlePanel.category)?.name}
              isDualMenu={menuConfig.isDualMode}
              leftMenuCategory={menuConfig.leftPanel.category}
              rightMenuCategory={menuConfig.rightPanel.category}
              leftMenuCategory2={menuConfig.dualMenu.leftBottom?.category || null}
              rightMenuCategory2={menuConfig.dualMenu.rightBottom?.category || null}
              leftMenuImages2={menuConfig.dualMenu.leftBottom?.showImages || false}
              rightMenuImages2={menuConfig.dualMenu.rightBottom?.showImages || false}
              leftMenuViewMode={menuConfig.leftPanel.viewMode}
              rightMenuViewMode={menuConfig.rightPanel.viewMode}
              leftMenuViewMode2={menuConfig.dualMenu.leftBottom?.viewMode || 'auto'}
              rightMenuViewMode2={menuConfig.dualMenu.rightBottom?.viewMode || 'auto'}
              enableLeftStacking={menuConfig.dualMenu.enableLeftStacking}
              enableRightStacking={menuConfig.dualMenu.enableRightStacking}
              backgroundColor={menuConfig.backgroundColor}
              fontColor={menuConfig.fontColor}
              cardFontColor={menuConfig.cardFontColor}
              containerColor={menuConfig.containerColor}
              imageBackgroundColor={menuConfig.imageBackgroundColor}
              titleFont={menuConfig.titleFont}
              pricingFont={menuConfig.pricingFont}
              cardFont={menuConfig.cardFont}
              pandaMode={false}
              priceLocation={menuConfig.isDualMode ? menuConfig.leftPanel.priceLocation : menuConfig.singlePanel.priceLocation}
              leftPriceLocation={menuConfig.leftPanel.priceLocation}
              rightPriceLocation={menuConfig.rightPanel.priceLocation}
              categoryColumnConfigs={categoryColumnConfigs}
              categoryBlueprintFields={categoryBlueprintFields}
              selectedSide={menuConfig.selectedQuadrant}
              onSideClick={(side: string) => {
                menuConfig.setSelectedQuadrant(side as 'left' | 'right' | 'leftBottom' | 'rightBottom' | '');
                console.log(`🖱️ Quadrant clicked: ${side}`);
              }}
              selectedMenuSection={null}
              isPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


