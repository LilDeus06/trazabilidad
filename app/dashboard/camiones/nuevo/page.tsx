import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CamionForm } from "@/components/camiones/camion-form"

export default async function NuevoCamionPage() {
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
    redirect("/dashboard/camiones")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Camión</h1>
        <p className="text-muted-foreground">Registra un nuevo camión en el sistema</p>
      </div>

      <CamionForm />
    </div>
  )
}
