"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Users, Edit } from "lucide-react"
import { UserEditModal } from "@/components/admin/user-edit-modal"

interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  activo: boolean
  created_at: string
  updated_at: string
}

interface UsuariosTableProps {
  usuarios: Usuario[]
}

export function UsuariosTable({ usuarios }: UsuariosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("todos")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const router = useRouter()

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "todos" || usuario.rol === roleFilter

    return matchesSearch && matchesRole
  })

  const updateUserRole = async (userId: string, newRole: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ rol: newRole }).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ activo: !currentStatus }).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "operador":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios del Sistema
            </CardTitle>
            <CardDescription>{usuarios.length} usuarios registrados</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="usuario">Usuario</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsuarios.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay usuarios</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== "todos"
                ? "No se encontraron usuarios con ese criterio"
                : "No hay usuarios registrados"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.nombre} {usuario.apellido}
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(usuario.rol)}>
                        {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.activo ? "default" : "secondary"}
                        className={usuario.activo ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(usuario.created_at).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(usuario)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Permisos
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateUserRole(usuario.id, "admin")}
                            disabled={usuario.rol === "admin"}
                          >
                            Hacer Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateUserRole(usuario.id, "operador")}
                            disabled={usuario.rol === "operador"}
                          >
                            Hacer Operador
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateUserRole(usuario.id, "usuario")}
                            disabled={usuario.rol === "usuario"}
                          >
                            Hacer Usuario
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(usuario.id, usuario.activo)}>
                            {usuario.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <UserEditModal
        user={selectedUser}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </Card>
  )
}
