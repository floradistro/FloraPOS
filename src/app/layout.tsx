import './globals.css'
import { Providers } from './providers'

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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        {/* Force cache refresh */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* PWA mode disabled to show iOS system UI */}
        {/* <meta name="apple-mobile-web-app-capable" content="yes" /> */}
        {/* <meta name="apple-mobile-web-app-status-bar-style" content="default" /> */}
        {/* <meta name="mobile-web-app-capable" content="yes" /> */}
      </head>
      <body className="font-sf-pro antialiased">
        <div className="min-h-screen bg-background text-text-primary">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
} 