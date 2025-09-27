"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { DatabaseStatus } from "@/components/database-status"
import { UserProvider, useUser } from "@/lib/contexts/user-context"
import { LoadingWrapper } from "@/components/loading-wrapper"

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingWrapper type="dashboard"><div /></LoadingWrapper>
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar key={profile?._updated} userRole={profile?.rol || "usuario"} />
      <main className="flex-1 md:ml-64 overflow-auto">
        <DatabaseStatus />
        <div className="p-6 pt-16 md:pt-6 gsap-stagger">{children}</div>
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <DashboardContent>{children}</DashboardContent>
    </UserProvider>
  )
}
