import { lazy, Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

// Full-screen loading component for major route components
const RouteLoadingFallback = ({ routeName = 'Page' }: { routeName?: string }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
    <div className="text-center">
      <Image
        src="/logo.png"
        alt="Loading"
        width={120}
        height={120}
        className="logo-fade-animation mx-auto mb-6"
        priority
      />
      <h2 className="flora-distro-text text-animated">Flora Distro</h2>
      <p className="text-text-secondary mt-2">Loading {routeName}...</p>
    </div>
  </div>
)

// Smaller loading component for sections
const SectionLoadingFallback = ({ sectionName = 'Section' }: { sectionName?: string }) => (
  <div className="flex items-center justify-center h-48 bg-black">
    <div className="flex items-center gap-2 text-text-secondary">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading {sectionName}...</span>
    </div>
  </div>
)

// Lazy load major components/routes
export const DynamicPaginatedProductGrid = lazy(() => import('./PaginatedProductGrid').then(module => ({ default: module.PaginatedProductGrid })))
export const DynamicPaginatedOrdersView = lazy(() => import('./PaginatedOrdersView').then(module => ({ default: module.PaginatedOrdersView })))
export const DynamicProductGrid = lazy(() => import('./ProductGrid').then(module => ({ default: module.ProductGrid })))
export const DynamicOrdersView = lazy(() => import('./OrdersView').then(module => ({ default: module.OrdersView })))

// Route-level dynamic imports
export const DynamicMainApp = lazy(() => import('../app/page'))

// Higher-order component for route-level code splitting
export function withRouteCodeSplitting<T extends ComponentType<any>>(
  Component: T,
  routeName?: string
) {
  const WrappedComponent = (props: any) => (
    <Suspense fallback={<RouteLoadingFallback routeName={routeName} />}>
      <Component {...props} />
    </Suspense>
  )
  
  WrappedComponent.displayName = `withRouteCodeSplitting(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Higher-order component for section-level code splitting
export function withSectionCodeSplitting<T extends ComponentType<any>>(
  Component: T,
  sectionName?: string
) {
  const WrappedComponent = (props: any) => (
    <Suspense fallback={<SectionLoadingFallback sectionName={sectionName} />}>
      <Component {...props} />
    </Suspense>
  )
  
  WrappedComponent.displayName = `withSectionCodeSplitting(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Pre-wrapped components ready to use
export const SuspensePaginatedProductGrid = withSectionCodeSplitting(DynamicPaginatedProductGrid, 'Products')
export const SuspensePaginatedOrdersView = withSectionCodeSplitting(DynamicPaginatedOrdersView, 'Orders')
export const SuspenseProductGrid = withSectionCodeSplitting(DynamicProductGrid, 'Products')
export const SuspenseOrdersView = withSectionCodeSplitting(DynamicOrdersView, 'Orders')

// Preload strategies
export const preloadCriticalComponents = () => {
  // Preload components that are very likely to be used immediately
  import('./PaginatedProductGrid')
  import('./ProductGrid')
}

export const preloadSecondaryComponents = () => {
  // Preload components that might be used soon
  import('./PaginatedOrdersView')
  import('./OrdersView')
  import('./SettingsPanel')
}

// Intersection Observer based preloading
export const useIntersectionPreload = (
  ref: React.RefObject<HTMLElement>,
  preloadFn: () => void,
  options?: IntersectionObserverInit
) => {
  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          preloadFn()
          observer.disconnect() // Only preload once
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, preloadFn])
}

// Import React for the hook
import React from 'react'