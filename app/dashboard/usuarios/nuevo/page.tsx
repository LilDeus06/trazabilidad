import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsuarioForm } from "@/components/usuarios/usuario-form"

export default async function NuevoUsuarioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que sea admin
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  if (!profile || profile.rol !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Usuario</h1>
        <p className="text-muted-foreground">Completa la información para crear un nuevo usuario</p>
      </div>

      <UsuarioForm />
    </div>
  )
}
