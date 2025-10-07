import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { QueryProvider } from '../providers/QueryProvider'
import { StandardErrorBoundary } from '../components/error/UnifiedErrorBoundary'
import { DevModeWrapper } from '../components/DevModeWrapper'

export const metadata: Metadata = {
  title: 'Flora POS',
  description: 'Professional Point of Sale system for Flora Distribution',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#171717',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Flora POS',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Flora POS',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="text-neutral-300 min-h-screen">
        <DevModeWrapper />
        <div className="wave-layer"></div>
        <StandardErrorBoundary componentName="RootLayout">
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </StandardErrorBoundary>
      </body>
    </html>
  )
}
