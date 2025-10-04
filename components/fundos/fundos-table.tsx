"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, MapPin, Download, Calendar } from "lucide-react"
import Link from "next/link"
import { SmartTable } from "@/components/ui/smart-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface Fundo {
  id: string
  nombre: string
  ubicacion: string | null
  area_hectareas: number | null
  tipo_cultivo: string | null
  created_at: string
  updated_at: string
}

interface FundosTableProps {
  fundos: Fundo[]
  canWrite: boolean
}

export function FundosTable({ fundos, canWrite }: FundosTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("fundos").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting fundo:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    let url = '/api/fundos/export'
    if (dateRange?.from && dateRange?.to) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd')
      const toDate = format(dateRange.to, 'yyyy-MM-dd')
      url += `?start_date=${fromDate}&end_date=${toDate}`
    }
    window.open(url, '_blank')
  }

  const handleExportAll = () => {
    window.open('/api/fundos/export?full=true', '_blank')
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      sortable: true,
      render: (value: string | null) => (
        value ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sin especificar</span>
        )
      )
    },
    {
      key: 'area_hectareas',
      label: 'Área Total',
      sortable: true,
      render: (value: number | null) => (
        value ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{value}</span>
            <span className="text-sm text-muted-foreground">ha</span>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      )
    },
    {
      key: 'tipo_cultivo',
      label: 'Cultivo Principal',
      sortable: true,
      render: (value: string | null) => (
        value ? (
          <Badge variant="outline">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">Sin especificar</span>
        )
      )
    },
    {
      key: 'created_at',
      label: 'Fecha Registro',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString("es-ES")}
        </span>
      )
    }
  ]

  // Add actions column if user has write permissions
  if (canWrite) {
    columns.push({
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      className: 'w-[70px]',
      render: (_: any, item: Fundo) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/fundos/${item.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    } as any)
  }

  const totalArea = fundos.reduce((sum, f) => {
    const area = f.area_hectareas
    return sum + (typeof area === 'number' && area > 0 ? area : 0)
  }, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Filtrar por rango de fechas"
          />
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {dateRange?.from ? 'Exportar Rango' : 'Exportar Hoy'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportAll}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Todo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fundos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fundos.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">hectáreas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Promedio</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fundos.length > 0 ? (totalArea / fundos.length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">hectáreas por fundo</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fundos Registrados
          </CardTitle>
          <CardDescription>Gestión de fundos con ordenamiento y paginación</CardDescription>
        </CardHeader>
        <CardContent>
          <SmartTable
            data={fundos}
            columns={columns}
            emptyMessage="No hay fundos disponibles"
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El fundo será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
