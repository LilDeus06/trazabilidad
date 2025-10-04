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
import { MoreHorizontal, Edit, Trash2, Grid3X3, MapPin, Wheat } from "lucide-react"
import Link from "next/link"
import { SmartTable } from "@/components/ui/smart-table"

interface Fundo {
  nombre: string
  ubicacion: string | null
}

interface Lote {
  id: string
  id_fundo: string
  nombre: string
  area_hectareas: number | null
  tipo_cultivo: string | null
  variedad: string | null
  fecha_siembra: string | null
  estado: string
  responsable_id: string | null
  created_at: string
  updated_at: string
  fundos: Fundo
}

interface LotesTableProps {
  lotes: Lote[]
  canWrite: boolean
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function LotesTable({ lotes, canWrite, isLoading, hasMore, onLoadMore }: LotesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("lotes").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting lote:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const supabase = createClient()
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo'

    try {
      const { error } = await supabase.from("lotes").update({ estado: newStatus }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating lote status:", error)
    }
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
      key: 'fundos.nombre',
      label: 'Fundo',
      sortable: true,
      render: (_: any, item: Lote) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{item.fundos.nombre}</span>
        </div>
      )
    },
    {
      key: 'area_hectareas',
      label: 'Área (ha)',
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
      label: 'Cultivo',
      sortable: true,
      render: (_: any, item: Lote) => (
        item.tipo_cultivo ? (
          <div className="flex items-center gap-2">
            <Wheat className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.tipo_cultivo}</div>
              {item.variedad && (
                <div className="text-sm text-muted-foreground">{item.variedad}</div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Sin especificar</span>
        )
      )
    },
    {
      key: 'fecha_siembra',
      label: 'Fecha Siembra',
      sortable: true,
      render: (value: string | null) => (
        value ? (
          <span className="text-sm">
            {new Date(value).toLocaleDateString("es-ES")}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (value: string) => {
        const getStatusBadgeVariant = (estado: string) => {
          switch (estado) {
            case 'activo':
              return 'default'
            case 'inactivo':
              return 'secondary'
            case 'cosechado':
              return 'outline'
            default:
              return 'secondary'
          }
        }

        const getStatusBadgeClass = (estado: string) => {
          switch (estado) {
            case 'activo':
              return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'inactivo':
              return ''
            case 'cosechado':
              return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default:
              return ''
          }
        }

        return (
          <Badge
            variant={getStatusBadgeVariant(value)}
            className={getStatusBadgeClass(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        )
      }
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
      render: (_: any, item: Lote) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/lotes/${item.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus(item.id, item.estado)}>
              {item.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    })
  }

  const activeLotes = lotes.filter(l => l.estado === 'activo')
  const totalArea = lotes.reduce((sum, l) => sum + (l.area_hectareas || 0), 0)
  const activeArea = activeLotes.reduce((sum, l) => sum + (l.area_hectareas || 0), 0)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLotes.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Total</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">hectáreas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Activa</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeArea.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">hectáreas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Lotes Registrados
          </CardTitle>
          <CardDescription>Gestión de lotes con scroll infinito y ordenamiento avanzado</CardDescription>
        </CardHeader>
        <CardContent>
          <SmartTable
            data={lotes}
            columns={columns}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            emptyMessage="No hay lotes disponibles"
            useInfiniteScroll={true}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El lote será eliminado permanentemente del sistema.
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
