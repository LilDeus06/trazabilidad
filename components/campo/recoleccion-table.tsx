"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Recoleccion {
  id: string
  fecha: string
  id_lote: string
  cantidad_recolectada: number
  calidad: string | null
  created_at: string
  profiles: {
    nombre: string
    apellido: string
  } | null
  lotes: {
    nombre: string
    fundos: {
      nombre: string
    }[]
  } | null
}

interface RecoleccionTableProps {
  recolecciones: Recoleccion[]
  userRole: string
  permissions?: {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
  } | null
  onEdit?: (recoleccion: Recoleccion) => void
  onView?: (recoleccion: Recoleccion) => void
}

export function RecoleccionTable({ recolecciones, userRole, permissions, onEdit, onView }: RecoleccionTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { error } = await supabase.from("campo_recoleccion").delete().eq("id", id)
      if (error) throw error
      window.location.reload()
    } catch (error) {
      console.error("Error deleting recoleccion:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  const getCalidadBadge = (calidad: string | null) => {
    if (!calidad) return <Badge variant="secondary">Sin evaluar</Badge>
    if (calidad.toLowerCase().includes("excelente")) return <Badge variant="default">Excelente</Badge>
    if (calidad.toLowerCase().includes("buena")) return <Badge variant="secondary">Buena</Badge>
    if (calidad.toLowerCase().includes("regular")) return <Badge variant="outline">Regular</Badge>
    return <Badge variant="secondary">Evaluada</Badge>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Cantidad (kg)</TableHead>
            <TableHead>Calidad</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recolecciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No hay recolecciones registradas
              </TableCell>
            </TableRow>
          ) : (
            recolecciones.map((recoleccion) => (
              <TableRow key={recoleccion.id}>
                <TableCell className="font-medium">
                  {format(new Date(recoleccion.fecha), "dd/MM/yyyy", { locale: es })}
                </TableCell>
                <TableCell>
                  {recoleccion.lotes
                    ? `${recoleccion.lotes.nombre} - ${recoleccion.lotes.fundos?.[0]?.nombre || "Sin fundo"}`
                    : "Lote no encontrado"}
                </TableCell>
                <TableCell>{recoleccion.cantidad_recolectada.toLocaleString()}</TableCell>
                <TableCell>{getCalidadBadge(recoleccion.calidad)}</TableCell>
                <TableCell>
                  {recoleccion.profiles
                    ? `${recoleccion.profiles.nombre} ${recoleccion.profiles.apellido}`
                    : "No asignado"}
                </TableCell>
                <TableCell>{format(new Date(recoleccion.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onView?.(recoleccion)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(permissions?.can_write || userRole === "admin" || userRole === "operador") && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(recoleccion)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {(permissions?.can_delete || userRole === "admin") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar recolección?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la recolección del lote{" "}
                              {recoleccion.lotes?.nombre || "desconocido"}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(recoleccion.id)}
                              disabled={isDeleting === recoleccion.id}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
