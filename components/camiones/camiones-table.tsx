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
import { MoreHorizontal, Edit, Trash2, Search, Truck } from "lucide-react"
import Link from "next/link"

interface Camion {
  id: string
  chofer: string
  placa: string
  capacidad: number
  activo: boolean
  created_at: string
  updated_at: string
  id_fundo?: string
  id_lote?: string
  fundos?: {
    nombre: string
  }
  lotes?: {
    nombre: string
    fundos?: {
      nombre: string
    }
  }
}

interface CamionesTableProps {
  camiones: Camion[]
  userRole: string
}

export function CamionesTable({ camiones, userRole }: CamionesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredCamiones = camiones.filter(
    (camion) =>
      camion.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.placa.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

    try {
      const { error } = await supabase.from("camiones").update({ activo: !currentStatus }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating camion status:", error)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Camiones Registrados
              </CardTitle>
              <CardDescription>{camiones.length} camiones en total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por chofer o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCamiones.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay camiones</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron camiones con ese criterio" : "Comienza agregando un nuevo camión"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chofer</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Fundo</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    {userRole === "admin" && <TableHead className="w-[70px]">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCamiones.map((camion) => (
                    <TableRow key={camion.id}>
                      <TableCell className="font-medium">{camion.chofer}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{camion.placa}</code>
                      </TableCell>
                      <TableCell>
                        {camion.fundos?.nombre || camion.lotes?.fundos?.nombre || "Sin asignar"}
                      </TableCell>
                      <TableCell>
                        {camion.lotes?.nombre || "Sin asignar"}
                      </TableCell>
                      <TableCell>{camion.capacidad} jabas</TableCell>
                      <TableCell>
                        <Badge
                          variant={camion.activo ? "default" : "secondary"}
                          className={camion.activo ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                        >
                          {camion.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(camion.created_at).toLocaleDateString("es-ES")}</TableCell>
                      {userRole === "admin" && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/camiones/${camion.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(camion.id, camion.activo)}>
                                {camion.activo ? "Desactivar" : "Activar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(camion.id)}>
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
