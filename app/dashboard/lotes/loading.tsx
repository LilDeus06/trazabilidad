import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function Loading() {
  return <TableSkeleton rows={6} columns={5} />
}
