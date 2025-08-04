import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Flora POS',
  description: 'Point of Sale System - Optimized for iPad Pro',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Flora POS',
    startupImage: '/logo.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-touch-fullscreen': 'yes',
    'format-detection': 'telephone=no',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flora POS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-orientations" content="any" />
        {/* iPad Pro specific viewport tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        {/* Disable pull-to-refresh */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            overscroll-behavior-y: none;
            -webkit-overflow-scrolling: touch;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
        `}} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* PWA Full Screen Setup for iOS */
            html, body { 
              margin: 0 !important;
              padding: 0 !important;
              height: 100vh !important;
              height: 100dvh !important;
              width: 100vw !important;
              overflow: hidden !important;
              background: #000000 !important;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            #__next {
              height: 100vh !important;
              height: 100dvh !important;
              width: 100vw !important;
              overflow: hidden !important;
            }
            
            /* iOS PWA Status Bar - Force Black */
            @media (display-mode: standalone) {
              html { 
                background: #000000 !important;
              }
              body { 
                margin-top: 0 !important; 
                background: #000000 !important;
              }
            }
            
            /* iPad specific optimizations */
            @media (min-width: 768px) and (max-width: 1024px) {
              html, body {
                height: 100vh !important;
                height: 100dvh !important;
              }
            }
            
            /* App content positioned within safe areas */
            .app-content-container {
              /* Positioning handled inline in component */
            }
          `
        }} />
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