import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { CamionForm } from "@/components/camiones/camion-form"

interface EditCamionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCamionPage({ params }: EditCamionPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario para el módulo camiones
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write, can_delete")
    .eq("user_id", user.id)
    .eq("module_name", "camiones")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  const hasWritePermission = permissions?.can_write || (profile?.rol && ["admin", "operador"].includes(profile.rol))

  if (!hasWritePermission) {
    redirect("/dashboard/camiones")
  }

  // Obtener datos del camión
  const { data: camion, error } = await supabase.from("camiones").select("*").eq("id", id).single()

  if (error || !camion) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Camión</h1>
        <p className="text-muted-foreground">Modifica la información del camión</p>
      </div>

      <CamionForm camion={camion} />
    </div>
  )
}
