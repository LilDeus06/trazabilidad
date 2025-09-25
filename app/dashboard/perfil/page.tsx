"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/contexts/user-context"
import { Loader2, Save, User, Mail, Calendar, Shield } from "lucide-react"
import { LoadingWrapper } from "@/components/loading-wrapper"

interface Profile {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  avatar_url?: string
  activo: boolean
  created_at: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
  })
  const { toast } = useToast()
  const { refreshProfile } = useUser()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      console.log("[v0] Cargando perfil de usuario")
      setLoading(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log("[v0] Error de autenticación:", authError)
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.log("[v0] Error cargando perfil:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Perfil cargado exitosamente")
      setProfile({ ...data, email: user.email || "" })
      setFormData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
      })
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      console.log("[v0] Guardando cambios del perfil")
      setSaving(true)

      const { error } = await supabase
        .from("profiles")
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
        })
        .eq("id", profile.id)

      if (error) {
        console.log("[v0] Error guardando perfil:", error)
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Perfil actualizado exitosamente")
      setProfile((prev) => (prev ? { ...prev, nombre: formData.nombre, apellido: formData.apellido } : null))

      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error guardando perfil:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpdate = async (url: string) => {
    console.log("[v0] Avatar actualizado:", url)
    setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null))

    // Refresh the user context cache to update sidebar and other components
    try {
      await refreshProfile()
      console.log("[v0] User context cache refreshed after avatar update")
    } catch (error) {
      console.warn("[v0] Error refreshing user context after avatar update:", error)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "operador":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "operador":
        return "Operador"
      default:
        return "Usuario"
    }
  }

  if (loading) {
    return <LoadingWrapper type="form"><div>Cargando perfil...</div></LoadingWrapper>
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar y información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Personaliza tu avatar con una imagen o GIF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvatarUpload
              currentAvatar={profile.avatar_url}
              userName={`${profile.nombre || ""} ${profile.apellido || ""}`.trim() || profile.email}
              onAvatarUpdate={handleAvatarUpdate}
            />

            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4" />
                <Badge variant={getRoleBadgeVariant(profile.rol)}>{getRoleLabel(profile.rol)}</Badge>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del perfil */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={profile.email} disabled className="bg-muted" />
                </div>
                <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
