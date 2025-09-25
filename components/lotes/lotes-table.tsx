"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, Search, Grid3X3 } from "lucide-react"
import Link from "next/link"

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
}

export function LotesTable({ lotes, canWrite }: LotesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredLotes = lotes.filter(
    (lote) =>
      lote.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.fundos.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lote.tipo_cultivo && lote.tipo_cultivo.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Lotes Registrados
              </CardTitle>
              <CardDescription>{lotes.length} lotes en total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, fundo o cultivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLotes.length === 0 ? (
            <div className="text-center py-8">
              <Grid3X3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay lotes</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron lotes con ese criterio" : "Comienza agregando un nuevo lote"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fundo</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Cultivo</TableHead>
                    <TableHead>Fecha Siembra</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    {canWrite && <TableHead className="w-[70px]">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLotes.map((lote) => (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">{lote.nombre}</TableCell>
                      <TableCell>{lote.fundos.nombre}</TableCell>
                      <TableCell>{lote.area_hectareas ? `${lote.area_hectareas} ha` : "N/A"}</TableCell>
                      <TableCell>
                        {lote.tipo_cultivo ? (
                          <div>
                            <div className="font-medium">{lote.tipo_cultivo}</div>
                            {lote.variedad && <div className="text-sm text-muted-foreground">{lote.variedad}</div>}
                          </div>
                        ) : (
                          "Sin especificar"
                        )}
                      </TableCell>
                      <TableCell>
                        {lote.fecha_siembra ? new Date(lote.fecha_siembra).toLocaleDateString("es-ES") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(lote.estado)}
                          className={getStatusBadgeClass(lote.estado)}
                        >
                          {lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(lote.created_at).toLocaleDateString("es-ES")}</TableCell>
                      {canWrite && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/lotes/${lote.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(lote.id, lote.estado)}>
                                {lote.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(lote.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
