import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function Loading() {
  return <TableSkeleton rows={4} columns={5} />
}
