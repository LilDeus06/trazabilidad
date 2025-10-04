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
import { MoreHorizontal, Edit, Trash2, FileText, Download, Calendar } from "lucide-react"
import Link from "next/link"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"
import { SmartTable } from "@/components/ui/smart-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface Guia {
  id: string
  fecha_hora: string
  id_camion: string
  id_fundo: string
  id_lotes: string[] | null
  enviadas: number
  guias: string
  usuario_id: string
  created_at: string
  camiones: {
    chofer: string
    placa: string
    capacidad: number
    fundos: {
      nombre: string
    }
  }
  fundos: {
    nombre: string
  } | null
  lotes?: {
    id: string
    nombre: string
    cantidad: number
    variedad: string
  }[]
}

interface UserProfile {
  id: string
  nombre: string
  apellido: string
}

interface GuiasTableProps {
  guias: Guia[]
  userRole: string
  userMap: Map<string, UserProfile>
  permissions?: {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
  } | null
}

export function GuiasTable({ guias, userRole, userMap, permissions }: GuiasTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("guias").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting guia:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    let url = '/api/guias/export'
    let fromDate, toDate

    if (dateRange?.from && dateRange?.to) {
      fromDate = format(dateRange.from, 'yyyy-MM-dd')
      toDate = format(dateRange.to, 'yyyy-MM-dd')
    } else {
      // For "Exportar Hoy", use today's date
      const today = new Date()
      fromDate = format(today, 'yyyy-MM-dd')
      toDate = format(today, 'yyyy-MM-dd')
    }

    url += `?start_date=${fromDate}&end_date=${toDate}`
    window.open(url, '_blank')
  }

  const handleExportAll = () => {
    window.open('/api/guias/export?full=true', '_blank')
  }

  // Calculate today's guides
  const today = new Date()
  const todayString = format(today, 'yyyy-MM-dd')
  const guiasHoy = guias.filter(guia => {
    const guiaDate = new Date(guia.fecha_hora)
    const guiaDateString = format(guiaDate, 'yyyy-MM-dd')
    return guiaDateString === todayString
  }).length

  const columns = [
    {
      key: 'fecha_hora',
      label: 'Fecha y Hora',
      sortable: true,
      render: (value: string) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatDatePeru(new Date(value))}</span>
          <span className="text-sm text-muted-foreground">
            {formatDateTimePeru(new Date(value), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )
    },
    {
      key: 'camiones.placa',
      label: 'Camión',
      sortable: true,
      render: (_: any, item: Guia) => (
        <div className="flex flex-col">
          <code className="bg-muted px-2 py-1 rounded text-sm">{item.camiones.placa}</code>
          <span className="text-xs text-muted-foreground">Cap: {item.camiones.capacidad} jabas</span>
        </div>
      )
    },
    {
      key: 'camiones.chofer',
      label: 'Chofer',
      sortable: true,
      render: (_: any, item: Guia) => item.camiones.chofer
    },
    {
      key: 'camiones.fundos.nombre',
      label: 'Fundo',
      sortable: true,
      render: (_: any, item: Guia) => item.camiones.fundos?.nombre || 'N/A'
    },
    {
      key: 'lotes',
      label: 'Lotes',
      sortable: false,
      render: (_: any, item: Guia) => (
        item.lotes && item.lotes.length > 0 ? (
          <div className="space-y-1">
            {item.lotes.map((lote) => (
              <div key={lote.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {lote.nombre}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {lote.cantidad} jabas
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {lote.variedad || 'Sin variedad'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Sin lotes</span>
        )
      )
    },
    {
      key: 'guias',
      label: 'Guía',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'enviadas',
      label: 'Jabas Enviadas',
      sortable: true,
      render: (value: number, item: Guia) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value}</span>
          <div className="w-16 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{
                width: `${Math.min((value / item.camiones.capacidad) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round((value / item.camiones.capacidad) * 100)}%
          </span>
        </div>
      )
    },
    {
      key: 'usuario_id',
      label: 'Usuario',
      sortable: false,
      render: (value: string) => {
        const user = userMap.get(value)
        return (
          <span className="text-sm">
            {user
              ? `${user.nombre} ${user.apellido}`
              : value.length > 35
                ? "Sistema"
                : value
            }
          </span>
        )
      }
    }
  ]

  // Add actions column if user has permissions
  if (permissions?.can_write || permissions?.can_delete || userRole === "admin") {
    columns.push({
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (_: any, item: Guia) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(permissions?.can_write || userRole === "admin") && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/guias/${item.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
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
    })
  }

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
            <CardTitle className="text-sm font-medium">Total Guías</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guias.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guías Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guiasHoy}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jabas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guias.reduce((total, guia) => total + guia.enviadas, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Guía</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guias.length > 0 ? Math.round(guias.reduce((total, guia) => total + guia.enviadas, 0) / guias.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registro de Guías
          </CardTitle>
          <CardDescription>Historial de salidas de camiones con ordenamiento y paginación</CardDescription>
        </CardHeader>
        <CardContent>
          <SmartTable
            data={guias}
            columns={columns}
            emptyMessage="No hay guías disponibles"
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La guía será eliminada permanentemente del sistema.
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
