import { useState, useMemo } from 'react'

interface UsePaginationProps {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}

export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return {
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      totalPages,
      currentPage,
      itemsPerPage
    }
  }, [currentPage, totalItems, itemsPerPage, totalPages])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (paginatedData.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const reset = () => {
    setCurrentPage(1)
  }

  return {
    ...paginatedData,
    goToPage,
    nextPage,
    prevPage,
    reset,
    setCurrentPage
  }
}
