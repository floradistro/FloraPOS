import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'POS System',
  description: 'Point of Sale system - Real Cannabis Anywhere',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'POS',
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
  themeColor: '#000000',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, minimal-ui" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="POS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-orientations" content="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Inline critical CSS for status bar hiding */
            html, body { 
              padding-top: 0 !important; 
              margin-top: 0 !important; 
              height: 100vh !important;
              height: 100dvh !important;
              overflow: hidden !important;
            }
            /* Hide iOS status bar immediately */
            @media (display-mode: standalone) {
              html { padding-top: 0 !important; }
              body { padding-top: 0 !important; margin-top: 0 !important; }
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