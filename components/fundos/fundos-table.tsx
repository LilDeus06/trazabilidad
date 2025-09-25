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
import { MoreHorizontal, Edit, Trash2, Search, MapPin } from "lucide-react"
import Link from "next/link"

interface Fundo {
  id: string
  nombre: string
  ubicacion: string | null
  area_hectareas: number | null
  responsable_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

interface FundosTableProps {
  fundos: Fundo[]
  canWrite: boolean
}

export function FundosTable({ fundos, canWrite }: FundosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredFundos = fundos.filter(
    (fundo) =>
      fundo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fundo.ubicacion && fundo.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("fundos").update({ activo: !currentStatus }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating fundo status:", error)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Fundos Registrados
              </CardTitle>
              <CardDescription>{fundos.length} fundos en total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFundos.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay fundos</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron fundos con ese criterio" : "Comienza agregando un nuevo fundo"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    {canWrite && <TableHead className="w-[70px]">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFundos.map((fundo) => (
                    <TableRow key={fundo.id}>
                      <TableCell className="font-medium">{fundo.nombre}</TableCell>
                      <TableCell>{fundo.ubicacion || "Sin especificar"}</TableCell>
                      <TableCell>{fundo.area_hectareas ? `${fundo.area_hectareas} ha` : "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={fundo.activo ? "default" : "secondary"}
                          className={fundo.activo ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                        >
                          {fundo.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(fundo.created_at).toLocaleDateString("es-ES")}</TableCell>
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
                                <Link href={`/dashboard/fundos/${fundo.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(fundo.id, fundo.activo)}>
                                {fundo.activo ? "Desactivar" : "Activar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(fundo.id)}>
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
