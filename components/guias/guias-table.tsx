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
import { MoreHorizontal, Edit, Trash2, Search, FileText, Calendar, Truck } from "lucide-react"
import Link from "next/link"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"

interface Guia {
  id: string
  fecha_hora: string
  id_camion: string
  enviadas: number
  guias: string
  usuario_id: string
  created_at: string
  camiones: {
    chofer: string
    placa: string
    capacidad: number
  }
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
}

export function GuiasTable({ guias, userRole, userMap }: GuiasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredGuias = guias.filter((guia) => {
    const matchesSearch =
      guia.camiones.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.camiones.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.guias.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDate = !dateFilter || guia.fecha_hora.startsWith(dateFilter)

    return matchesSearch && matchesDate
  })

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

  const getTotalJabas = () => {
    return filteredGuias.reduce((total, guia) => total + guia.enviadas, 0)
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guías</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredGuias.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jabas Enviadas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalJabas()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Guía</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredGuias.length > 0 ? Math.round(getTotalJabas() / filteredGuias.length) : 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {guias.filter((g) => g.fecha_hora.startsWith(new Date().toISOString().split("T")[0])).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registro de Guías
              </CardTitle>
              <CardDescription>Historial de salidas de camiones</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-40" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por chofer, placa o guía..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGuias.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay guías</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateFilter
                  ? "No se encontraron guías con ese criterio"
                  : "Comienza registrando una nueva guía"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Camión</TableHead>
                    <TableHead>Chofer</TableHead>
                    <TableHead>Guía</TableHead>
                    <TableHead>Jabas Enviadas</TableHead>
                    <TableHead>Usuario</TableHead>
                    {userRole === "admin" && <TableHead className="w-[70px]">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuias.map((guia) => (
                    <TableRow key={guia.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDatePeru(new Date(guia.fecha_hora))}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTimePeru(new Date(guia.fecha_hora), {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{guia.camiones.placa}</code>
                          <span className="text-xs text-muted-foreground">Cap: {guia.camiones.capacidad} jabas</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{guia.camiones.chofer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {guia.guias}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{guia.enviadas}</span>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.min((guia.enviadas / guia.camiones.capacidad) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((guia.enviadas / guia.camiones.capacidad) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {userMap.get(guia.usuario_id) ? `${userMap.get(guia.usuario_id)?.nombre} ${userMap.get(guia.usuario_id)?.apellido}` : guia.usuario_id}
                      </TableCell>
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
                                <Link href={`/dashboard/guias/${guia.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(guia.id)}>
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
