import './globals.css'
import { Providers } from './providers'
import { initializeEnvironment } from '@/lib/env-validation'

// Initialize and validate environment variables at startup
if (typeof window === 'undefined') {
  try {
    initializeEnvironment()
  } catch (error) {
    console.error('Failed to initialize environment:', error)
    // In production, this will exit the process
  }
}

export const metadata = {
  title: 'Flora POS',
  description: 'Point of Sale System - Optimized for iPad Pro',
  // Force cache refresh
  version: '1.0.1',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
  viewportFit: 'cover', // Essential for PWA safe areas
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, viewport-fit=cover, user-scalable=no, shrink-to-fit=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        {/* Force cache refresh */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Enable full screen PWA mode with black status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Flora POS" />
      </head>
      <body className="font-sf-pro antialiased" style={{background: '#000000'}}>
        <div className="min-h-screen text-text-primary" style={{background: '#000000', minHeight: '100dvh'}}>
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
} 