"use client"

import React, { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react"
import { useSorting, SortDirection } from "@/hooks/use-sorting"
import { usePagination } from "@/hooks/use-pagination"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

interface SmartTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  emptyMessage?: string
  loadingMessage?: string
  className?: string
  useInfiniteScroll?: boolean
  itemsPerPage?: number
  showSkeletonRows?: number
}

function SortableHeader<T>({
  column,
  onSort,
  sortDirection
}: {
  column: Column<T>
  onSort: (key: string) => void
  sortDirection: SortDirection
}) {
  if (!column.sortable) {
    return <span className="font-medium">{column.label}</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => onSort(column.key as string)}
    >
      <span>{column.label}</span>
      <span className="ml-1">
        {sortDirection === 'asc' && <ChevronUp className="h-4 w-4" />}
        {sortDirection === 'desc' && <ChevronDown className="h-4 w-4" />}
        {sortDirection === null && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
      </span>
    </Button>
  )
}

function SkeletonRow({ columns }: { columns: Column<any>[] }) {
  return (
    <TableRow>
      {columns.map((column, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-sm text-muted-foreground">Cargando más elementos...</span>
    </div>
  )
}

export function SmartTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = "No hay datos disponibles",
  loadingMessage = "Cargando...",
  className = "",
  useInfiniteScroll: forceInfiniteScroll,
  itemsPerPage = 10,
  showSkeletonRows = 5
}: SmartTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")

  // Determine if we should use infinite scroll (for large datasets)
  const shouldUseInfiniteScroll = forceInfiniteScroll || data.length > 50

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key as keyof T]
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, columns])

  // Sorting
  const { sortedData, handleSort, getSortDirection } = useSorting(filteredData)

  // Pagination or Infinite Scroll
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex
  } = usePagination({
    totalItems: sortedData.length,
    itemsPerPage: shouldUseInfiniteScroll ? sortedData.length : itemsPerPage
  })

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasMore && shouldUseInfiniteScroll,
    isLoading,
    onLoadMore: onLoadMore || (() => {}),
    threshold: 200
  })

  // Get display data
  const displayData = shouldUseInfiniteScroll
    ? sortedData
    : sortedData.slice(startIndex, endIndex)

  const showEmptyState = !isLoading && displayData.length === 0
  const showLoadingRows = isLoading && displayData.length === 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {columns.some(col => col.sortable) && (
        <div className="flex items-center justify-between">
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-input rounded-md bg-background text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  <SortableHeader
                    column={column}
                    onSort={handleSort}
                    sortDirection={getSortDirection(column.key as string)}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading skeleton rows */}
            {showLoadingRows && (
              <>
                {Array.from({ length: showSkeletonRows }).map((_, index) => (
                  <SkeletonRow key={`skeleton-${index}`} columns={columns} />
                ))}
              </>
            )}

            {/* Data rows */}
            {!showLoadingRows && displayData.map((item, index) => (
              <TableRow
                key={String(item.id || index)}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                {columns.map((column) => (
                  <TableCell key={String(column.key)} className={column.className}>
                    {column.render
                      ? column.render(item[column.key as keyof T], item)
                      : String(item[column.key as keyof T] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Empty state */}
            {showEmptyState && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite scroll sentinel */}
      {shouldUseInfiniteScroll && hasMore && (
        <div ref={sentinelRef} className="py-4">
          <LoadingIndicator />
        </div>
      )}

      {/* Pagination controls for non-infinite scroll */}
      {!shouldUseInfiniteScroll && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, sortedData.length)} de {sortedData.length} elementos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={!hasPrevPage}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!hasNextPage}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
