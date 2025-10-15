import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Lo Que Falta - Lista de Compras",
  description: "Una aplicación móvil para gestionar tu lista de compras con múltiples categorías. Nunca olvides lo que necesitas comprar.",
  keywords: ["shopping", "listas", "compras", "organizador", "productos", "lo que falta", "carrito"],
  authors: [{ name: "Lo Que Falta Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#3B82F6",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}