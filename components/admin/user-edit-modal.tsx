"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, X } from "lucide-react"

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  activo: boolean
}

interface ModulePermission {
  module_name: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
}

interface Fundo {
  id: string
  nombre: string
}

interface UserEditModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MODULES = [
  { name: "dashboard", label: "Dashboard" },
  { name: "admin", label: "Administración" },
  { name: "usuarios", label: "Usuarios" },
  { name: "fundos", label: "Fundos" },
  { name: "lotes", label: "Lotes" },
  { name: "camiones", label: "Camiones" },
  { name: "guias", label: "Guías" },
  { name: "campo", label: "Campo" },
  { name: "acopio", label: "Acopio" },
  { name: "packing", label: "Packing" },
]

export function UserEditModal({ user, open, onOpenChange }: UserEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [userActive, setUserActive] = useState(true)
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([])
  const [fundoPermissions, setFundoPermissions] = useState<string[]>([])
  const [availableFundos, setAvailableFundos] = useState<Fundo[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user && open) {
      loadUserData()
    }
  }, [user, open])

  const loadUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load user basic info
      setUserRole(user.rol)
      setUserActive(user.activo)

      // Load module permissions
      const { data: moduleData, error: moduleError } = await supabase
        .from('user_module_permissions')
        .select('module_name, can_read, can_write, can_delete')
        .eq('user_id', user.id)

      if (moduleError) {
        console.error('Error loading module permissions:', moduleError)
        setModulePermissions([])
      } else {
        setModulePermissions(moduleData || [])
      }

      // Load fundo permissions
      const { data: fundoData, error: fundoError } = await supabase
        .from('user_fundo_permissions')
        .select('fundo_id')
        .eq('user_id', user.id)

      if (fundoError) {
        console.error('Error loading fundo permissions:', fundoError)
        setFundoPermissions([])
      } else {
        setFundoPermissions((fundoData || []).map(fp => fp.fundo_id))
      }

      // Load available fundos
      const { data: fundosData, error: fundosError } = await supabase
        .from('fundos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')

      if (fundosError) {
        console.error('Error loading fundos:', fundosError)
        setAvailableFundos([])
      } else {
        setAvailableFundos(fundosData || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateModulePermission = (moduleName: string, permission: 'read' | 'write' | 'delete', value: boolean) => {
    setModulePermissions(prev => {
      const existing = prev.find(p => p.module_name === moduleName)
      if (existing) {
        return prev.map(p =>
          p.module_name === moduleName
            ? { ...p, [permission === 'read' ? 'can_read' : permission === 'write' ? 'can_write' : 'can_delete']: value }
            : p
        )
      } else {
        return [...prev, {
          module_name: moduleName,
          can_read: permission === 'read' ? value : false,
          can_write: permission === 'write' ? value : false,
          can_delete: permission === 'delete' ? value : false,
        }]
      }
    })
  }

  const toggleFundoPermission = (fundoId: string) => {
    setFundoPermissions(prev =>
      prev.includes(fundoId)
        ? prev.filter(id => id !== fundoId)
        : [...prev, fundoId]
    )
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update basic user info
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          rol: userRole,
          activo: userActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Update module permissions
      // First delete existing permissions
      await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', user.id)

      // Then insert new permissions
      if (modulePermissions.length > 0) {
        const { error: moduleError } = await supabase
          .from('user_module_permissions')
          .insert(
            modulePermissions.map(p => ({
              user_id: user.id,
              module_name: p.module_name,
              can_read: p.can_read,
              can_write: p.can_write,
              can_delete: p.can_delete,
            }))
          )

        if (moduleError) throw moduleError
      }

      // Update fundo permissions
      // First delete existing permissions
      await supabase
        .from('user_fundo_permissions')
        .delete()
        .eq('user_id', user.id)

      // Then insert new permissions
      if (fundoPermissions.length > 0) {
        const { error: fundoError } = await supabase
          .from('user_fundo_permissions')
          .insert(
            fundoPermissions.map(fundoId => ({
              user_id: user.id,
              fundo_id: fundoId,
            }))
          )

        if (fundoError) throw fundoError
      }

      toast({
        title: "Usuario actualizado",
        description: "Los permisos del usuario han sido actualizados correctamente",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving user:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getModulePermission = (moduleName: string, permission: 'read' | 'write' | 'delete') => {
    const modulePerm = modulePermissions.find(p => p.module_name === moduleName)
    if (!modulePerm) return false
    return permission === 'read' ? modulePerm.can_read : permission === 'write' ? modulePerm.can_write : modulePerm.can_delete
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario: {user.nombre} {user.apellido}</DialogTitle>
          <DialogDescription>
            Modifica los permisos y configuración del usuario
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="usuario">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={userActive ? "active" : "inactive"} onValueChange={(value) => setUserActive(value === "active")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Module Permissions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Permisos de Módulos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map((module) => (
                  <div key={module.name} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{module.label}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.name}-read`}
                          checked={getModulePermission(module.name, 'read')}
                          onCheckedChange={(checked) => updateModulePermission(module.name, 'read', checked as boolean)}
                        />
                        <Label htmlFor={`${module.name}-read`} className="text-sm">Leer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.name}-write`}
                          checked={getModulePermission(module.name, 'write')}
                          onCheckedChange={(checked) => updateModulePermission(module.name, 'write', checked as boolean)}
                        />
                        <Label htmlFor={`${module.name}-write`} className="text-sm">Escribir</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.name}-delete`}
                          checked={getModulePermission(module.name, 'delete')}
                          onCheckedChange={(checked) => updateModulePermission(module.name, 'delete', checked as boolean)}
                        />
                        <Label htmlFor={`${module.name}-delete`} className="text-sm">Eliminar</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Fundo Permissions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Permisos de Fundos</h3>
              {availableFundos.length === 0 ? (
                <p className="text-muted-foreground">No hay fundos disponibles</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableFundos.map((fundo) => (
                    <div key={fundo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fundo-${fundo.id}`}
                        checked={fundoPermissions.includes(fundo.id)}
                        onCheckedChange={() => toggleFundoPermission(fundo.id)}
                      />
                      <Label htmlFor={`fundo-${fundo.id}`} className="text-sm">{fundo.nombre}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
