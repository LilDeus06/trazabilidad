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
import { MoreHorizontal, Edit, Trash2, Truck, MapPin, Grid3X3, Download, Calendar } from "lucide-react"
import Link from "next/link"
import { SmartTable } from "@/components/ui/smart-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface Fundo {
  nombre: string
  ubicacion: string | null
}

interface Lote {
  nombre: string
  fundos: {
    nombre: string
  }
}

interface Camion {
  id: string
  chofer: string
  placa: string
  capacidad: number
  activo: boolean
  created_at: string
  updated_at: string
  id_fundo: string | null
  id_lote: string | null
  fundos: Fundo | null
  lotes: Lote | null
}

interface CamionesTableProps {
  camiones: Camion[]
  permissions?: {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
  } | null
  userRole: string
}

export function CamionesTable({ camiones, permissions, userRole }: CamionesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("camiones").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting camion:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const newStatus = !currentStatus

    try {
      const { error } = await supabase.from("camiones").update({ activo: newStatus }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating camion status:", error)
    }
  }

  const handleExport = () => {
    let url = '/api/camiones/export'
    if (dateRange?.from && dateRange?.to) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd')
      const toDate = format(dateRange.to, 'yyyy-MM-dd')
      url += `?start_date=${fromDate}&end_date=${toDate}`
    }
    window.open(url, '_blank')
  }

  const handleExportAll = () => {
    window.open('/api/camiones/export?full=true', '_blank')
  }

  const columns = [
    {
      key: 'placa',
      label: 'Placa',
      sortable: true,
      render: (value: string) => (
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
          {value}
        </code>
      )
    },
    {
      key: 'chofer',
      label: 'Chofer',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'capacidad',
      label: 'Capacidad',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value}</span>
          <span className="text-sm text-muted-foreground">jabas</span>
        </div>
      )
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      render: (value: boolean) => (
        <Badge
          variant={value ? "default" : "secondary"}
          className={value ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
        >
          {value ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
    {
      key: 'fundos.nombre',
      label: 'Fundo',
      sortable: true,
      render: (_: any, item: Camion) => (
        item.fundos ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{item.fundos.nombre}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sin asignar</span>
        )
      )
    },
    {
      key: 'lotes.nombre',
      label: 'Lote',
      sortable: true,
      render: (_: any, item: Camion) => (
        item.lotes ? (
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <span>{item.lotes.nombre}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sin asignar</span>
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

  // Add actions column if user has permissions
  if (permissions?.can_write || permissions?.can_delete || userRole === "admin") {
    columns.push({
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      className: 'w-[70px]',
      render: (_: any, item: Camion) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(permissions?.can_write || userRole === "admin") && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/camiones/${item.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
            )}
            {(permissions?.can_write || userRole === "admin") && (
              <DropdownMenuItem onClick={() => toggleStatus(item.id, item.activo)}>
                {item.activo ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
            )}
            {(permissions?.can_delete || userRole === "admin") && (
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    } as any)
  }

  const activeCamiones = camiones.filter(c => c.activo)
  const totalCapacity = camiones.reduce((sum, c) => sum + c.capacidad, 0)
  const activeCapacity = activeCamiones.reduce((sum, c) => sum + c.capacidad, 0)

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

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Camiones</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{camiones.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Camiones Activos</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCamiones.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">jabas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Activa</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCapacity}</div>
            <p className="text-xs text-muted-foreground">jabas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Gestión de Camiones
          </CardTitle>
          <CardDescription>Flota de camiones con ordenamiento y paginación inteligente</CardDescription>
        </CardHeader>
        <CardContent>
          <SmartTable
            data={camiones}
            columns={columns}
            emptyMessage="No hay camiones disponibles"
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El camión será eliminado permanentemente del sistema.
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
