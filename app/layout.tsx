import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { AuthProvider } from "@/components/auth/auth-provider"
import { isSupabaseConfigured } from "@/lib/supabase/mock"
import { ErrorLogViewer } from "@/components/error-log-viewer"
import { ErrorLoggerInit } from "@/components/error-logger-init"
import { AuthErrorHandler } from "@/components/auth-error-handler"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Lo Que Falta - Lista de Compras",
  description: "Una aplicación móvil para gestionar tu lista de compras con múltiples categorías. Nunca olvides lo que necesitas comprar.",
  keywords: ["shopping", "listas", "compras", "organizador", "productos", "lo que falta", "carrito"],
  authors: [{ name: "Lo Que Falta Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lo Que Falta",
  },
  openGraph: {
    title: "Lo Que Falta - Lista de Compras",
    description: "Una aplicación móvil para gestionar tu lista de compras con múltiples categorías. Nunca olvides lo que necesitas comprar.",
    url: "https://loquefalta.app",
    siteName: "Lo Que Falta",
    images: [
      {
        url: "/apple-splash-2048-1536.jpg",
        width: 2048,
        height: 1536,
        alt: "Lo Que Falta - Lista de Compras",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lo Que Falta - Lista de Compras",
    description: "Una aplicación móvil para gestionar tu lista de compras con múltiples categorías. Nunca olvides lo que necesitas comprar.",
    images: ["/apple-splash-2048-1536.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

// Next.js 15: mover viewport y themeColor a este export dedicado
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3B82F6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        {/* oauth-handler eliminado para evitar 404 y recargas */}
        {/* Script para desregistrar service workers antes de que React se cargue */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
                // También limpiar caches
                if ('caches' in window) {
                  caches.keys().then(function(cacheNames) {
                    return Promise.all(
                      cacheNames.map(function(cacheName) {
                        return caches.delete(cacheName);
                      })
                    );
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <PWAInstallPrompt />
            <ErrorLoggerInit />
            <AuthErrorHandler />
            {process.env.NODE_ENV === 'development' && <ErrorLogViewer />}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}