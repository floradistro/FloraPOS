import { lazy, Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Loading fallback component
const LoadingFallback = ({ componentName = 'Component' }: { componentName?: string }) => (
  <div className="flex items-center justify-center h-32 bg-black">
    <div className="flex items-center gap-2 text-text-secondary">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Loading {componentName}...</span>
    </div>
  </div>
)

// Lazy load components that are heavy or not immediately needed
export const LazySettingsPanel = lazy(() => import('./SettingsPanel'))
export const LazyChartRenderer = lazy(() => import('./ChartRenderer'))
export const LazyChartWrapper = lazy(() => import('./ChartWrapper'))
export const LazyACFFieldsDisplay = lazy(() => import('./ACFFieldsDisplay'))
export const LazyCustomerPreferences = lazy(() => import('./CustomerPreferences'))
export const LazyCustomerPreferenceQuickView = lazy(() => import('./CustomerPreferenceQuickView'))
export const LazyEnhancedVirtualPrerollSection = lazy(() => import('./EnhancedVirtualPrerollSection'))
export const LazyVirtualPrerollSection = lazy(() => import('./VirtualPrerollSection'))
export const LazyMatrixRain = lazy(() => import('./MatrixRain'))
export const LazyIDScanner = lazy(() => import('./IDScanner'))

// Higher-order component to wrap lazy components with Suspense
export function withSuspense<T extends ComponentType<any>>(
  Component: T,
  fallbackProps?: { componentName?: string }
) {
  const WrappedComponent = (props: any) => (
    <Suspense fallback={<LoadingFallback {...fallbackProps} />}>
      <Component {...props} />
    </Suspense>
  )
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Pre-wrapped components ready to use
export const SuspenseSettingsPanel = withSuspense(LazySettingsPanel, { componentName: 'Settings' })
export const SuspenseChartRenderer = withSuspense(LazyChartRenderer, { componentName: 'Chart' })
export const SuspenseChartWrapper = withSuspense(LazyChartWrapper, { componentName: 'Chart' })
export const SuspenseACFFieldsDisplay = withSuspense(LazyACFFieldsDisplay, { componentName: 'Product Details' })
export const SuspenseCustomerPreferences = withSuspense(LazyCustomerPreferences, { componentName: 'Customer Preferences' })
export const SuspenseCustomerPreferenceQuickView = withSuspense(LazyCustomerPreferenceQuickView, { componentName: 'Customer Quick View' })
export const SuspenseEnhancedVirtualPrerollSection = withSuspense(LazyEnhancedVirtualPrerollSection, { componentName: 'Preroll Section' })
export const SuspenseVirtualPrerollSection = withSuspense(LazyVirtualPrerollSection, { componentName: 'Preroll Section' })
export const SuspenseMatrixRain = withSuspense(LazyMatrixRain, { componentName: 'Animation' })
export const SuspenseIDScanner = withSuspense(LazyIDScanner, { componentName: 'ID Scanner' })

// Preload functions for components that might be needed soon
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Start loading the component but don't wait for it
  componentLoader().catch(() => {
    // Silently ignore preload errors
  })
}

export const preloadAllComponents = () => {
  // Preload components that are likely to be used
  preloadComponent(() => import('./SettingsPanel'))
  preloadComponent(() => import('./ChartRenderer'))
  preloadComponent(() => import('./ACFFieldsDisplay'))
  preloadComponent(() => import('./CustomerPreferences'))
}