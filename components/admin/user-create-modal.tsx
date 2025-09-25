"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2 } from "lucide-react"

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  rol: z.enum(["admin", "operador", "usuario"]),
  activo: z.boolean(),
  fundo_ids: z.array(z.string()).optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserCreateModalProps {
  onUserCreated?: () => void
}

export function UserCreateModal({ onUserCreated }: UserCreateModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fundos, setFundos] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      activo: true,
      fundo_ids: [],
    },
  })

  const selectedFundos = watch("fundo_ids") || []

  // Cargar fundos disponibles
  const loadFundos = async () => {
    try {
      const { data, error } = await supabase
        .from("fundos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")

      if (error) throw error
      setFundos(data || [])
    } catch (error) {
      console.error("Error loading fundos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los fundos",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario")
      }

      // Crear perfil
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        activo: data.activo,
      })

      if (profileError) throw profileError

      // Crear permisos de módulos por defecto según rol
      const modulePermissions: Array<{
        user_id: string
        module_name: string
        can_read: boolean
        can_write: boolean
        can_delete: boolean
      }> = []

      if (data.rol === "admin") {
        // Admin tiene acceso a todos los módulos
        const modules = ["dashboard", "campo", "acopio", "packing", "camiones", "guias", "usuarios", "fundos", "lotes", "admin"]
        modules.forEach(module => {
          modulePermissions.push({
            user_id: authData.user!.id,
            module_name: module,
            can_read: true,
            can_write: true,
            can_delete: true,
          })
        })
      } else if (data.rol === "operador") {
        // Operador tiene acceso a todos menos admin
        const modules = ["dashboard", "campo", "acopio", "packing", "camiones", "guias", "usuarios", "fundos", "lotes"]
        modules.forEach(module => {
          modulePermissions.push({
            user_id: authData.user!.id,
            module_name: module,
            can_read: true,
            can_write: true,
            can_delete: true,
          })
        })
      } else {
        // Usuario tiene acceso limitado
        const modules = ["dashboard", "guias"]
        modules.forEach(module => {
          modulePermissions.push({
            user_id: authData.user!.id,
            module_name: module,
            can_read: true,
            can_write: false,
            can_delete: false,
          })
        })
      }

      if (modulePermissions.length > 0) {
        const { error: permissionsError } = await supabase
          .from("user_module_permissions")
          .insert(modulePermissions)

        if (permissionsError) throw permissionsError
      }

      // Asignar fundos si se seleccionaron
      if (data.fundo_ids && data.fundo_ids.length > 0) {
        const fundoPermissions = data.fundo_ids.map(fundoId => ({
          user_id: authData.user!.id,
          fundo_id: fundoId,
        }))

        const { error: fundoError } = await supabase
          .from("user_fundo_permissions")
          .insert(fundoPermissions)

        if (fundoError) throw fundoError
      }

      toast({
        title: "Usuario creado",
        description: `El usuario ${data.nombre} ${data.apellido} ha sido creado exitosamente`,
      })

      reset()
      setOpen(false)
      onUserCreated?.()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadFundos()
    }
  }

  const handleFundoToggle = (fundoId: string, checked: boolean) => {
    const current = selectedFundos || []
    if (checked) {
      setValue("fundo_ids", [...current, fundoId])
    } else {
      setValue("fundo_ids", current.filter(id => id !== fundoId))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo usuario en el sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                {...register("nombre")}
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                {...register("apellido")}
                className={errors.apellido ? "border-red-500" : ""}
              />
              {errors.apellido && <p className="text-sm text-red-500">{errors.apellido.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select onValueChange={(value) => setValue("rol", value as any)}>
              <SelectTrigger className={errors.rol ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuario</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && <p className="text-sm text-red-500">{errors.rol.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Acceso a Fundos</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
              {fundos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay fundos disponibles</p>
              ) : (
                <div className="space-y-2">
                  {fundos.map((fundo) => (
                    <div key={fundo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fundo-${fundo.id}`}
                        checked={selectedFundos.includes(fundo.id)}
                        onCheckedChange={(checked) => handleFundoToggle(fundo.id, checked as boolean)}
                      />
                      <Label htmlFor={`fundo-${fundo.id}`} className="text-sm">
                        {fundo.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Si no selecciona ningún fundo, el usuario tendrá acceso a todos los fundos
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={watch("activo")}
              onCheckedChange={(checked) => setValue("activo", checked as boolean)}
            />
            <Label htmlFor="activo">Usuario activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
