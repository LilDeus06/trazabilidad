import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ConnectionStatus } from "@/components/connection-status"
import { GlobalGsap } from "@/components/animations/global-gsap"
import "./globals.css"
import "@/styles/scrollbar.css"


export const metadata: Metadata = {
  title: "Sistema de Gestión Logística",
  description: "Sistema completo de gestión logística agrícola",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="font-sans min-h-screen overflow-y-auto">
        <GlobalGsap />
        <ConnectionStatus />
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
