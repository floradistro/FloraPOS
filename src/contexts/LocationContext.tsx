'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface LocationInfo {
  id: string
  name: string
  address: string
  terminalId: string
}

interface LocationContextType {
  currentLocation: LocationInfo | null
  setCurrentLocation: (location: LocationInfo) => void
  availableLocations: LocationInfo[]
  syncWithStore: (storeId: string) => void
  loadLocations: () => Promise<void>
  isLoading: boolean
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null)
  const [availableLocations, setAvailableLocations] = useState<LocationInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load locations from API
  const loadLocations = async () => {
    try {
      setIsLoading(true)
      console.log('🏪 Loading locations from Flora API...')
      
      const response = await fetch('/api/stores/public')
      if (response.ok) {
        const stores = await response.json()
        console.log('✅ Raw stores data:', stores)
        
        if (Array.isArray(stores) && stores.length > 0) {
          // Convert API stores to LocationInfo format
          const locations: LocationInfo[] = stores.map((store, index) => ({
            id: store.id?.toString() || store.location_id?.toString() || `store-${index}`,
            name: store.name || store.location_name || `Store ${index + 1}`,
            address: store.address || store.location_address || 'Address not available',
            terminalId: `${(store.name || store.location_name || 'STORE').toUpperCase().replace(/\s+/g, '-')}-001`
          }))
          
          console.log('✅ Converted locations:', locations)
          setAvailableLocations(locations)
          
          // Set first location as default if no current location
          if (!currentLocation && locations.length > 0) {
            setCurrentLocation(locations[0])
            localStorage.setItem('pos_current_location', JSON.stringify(locations[0]))
            console.log('📍 Set default location:', locations[0].name)
          }
        } else {
          console.error('❌ No stores found in API response')
          setAvailableLocations([])
        }
      } else {
        console.error('❌ Failed to load stores:', response.status, response.statusText)
        setAvailableLocations([])
      }
    } catch (error) {
      console.error('❌ Error loading locations:', error)
      setAvailableLocations([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load locations on mount
  useEffect(() => {
    loadLocations()
  }, [])

  // Load saved location from localStorage after locations are loaded
  useEffect(() => {
    if (availableLocations.length > 0) {
      const savedLocation = localStorage.getItem('pos_current_location')
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation)
          const foundLocation = availableLocations.find(loc => loc.id === parsedLocation.id)
          if (foundLocation) {
            setCurrentLocation(foundLocation)
            console.log('📍 Restored saved location:', foundLocation.name)
          } else {
            // Saved location no longer exists, use first available
            setCurrentLocation(availableLocations[0])
            localStorage.setItem('pos_current_location', JSON.stringify(availableLocations[0]))
            console.log('📍 Saved location not found, using:', availableLocations[0].name)
          }
        } catch (error) {
          console.warn('Failed to parse saved location:', error)
          setCurrentLocation(availableLocations[0])
        }
      }
    }
  }, [availableLocations])

  // Function to sync location with store ID - now uses dynamic data
  const syncWithStore = (storeId: string) => {
    const matchingLocation = availableLocations.find(loc => loc.id === storeId)
    if (matchingLocation) {
      console.log(`🔄 Syncing location with store: ${matchingLocation.name}`)
      setCurrentLocation(matchingLocation)
      localStorage.setItem('pos_current_location', JSON.stringify(matchingLocation))
    } else {
      console.warn(`⚠️ No location found for store ID: ${storeId}`)
      // Reload locations in case they've changed
      loadLocations()
    }
  }

  // Save location to localStorage when it changes
  const handleSetCurrentLocation = (location: LocationInfo) => {
    setCurrentLocation(location)
    localStorage.setItem('pos_current_location', JSON.stringify(location))
    console.log(`📍 Location changed to: ${location.name} (${location.terminalId})`)
  }

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCurrentLocation: handleSetCurrentLocation,
        availableLocations,
        syncWithStore,
        loadLocations,
        isLoading
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}