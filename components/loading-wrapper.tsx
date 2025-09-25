"use client"

import type React from "react"

import { Suspense } from "react"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import { FormSkeleton } from "@/components/skeletons/form-skeleton"

interface LoadingWrapperProps {
  children: React.ReactNode
  type?: "table" | "dashboard" | "form"
  rows?: number
  columns?: number
}

export function LoadingWrapper({ children, type = "table", rows, columns }: LoadingWrapperProps) {
  const getSkeleton = () => {
    switch (type) {
      case "dashboard":
        return <DashboardSkeleton />
      case "form":
        return <FormSkeleton />
      case "table":
      default:
        return <TableSkeleton rows={rows} columns={columns} />
    }
  }

  return <Suspense fallback={getSkeleton()}>{children}</Suspense>
}
