import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuiaForm } from "@/components/guias/guia-form"

export default async function NuevaGuiaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Obtener camiones activos
  const { data: camiones, error } = await supabase.from("camiones").select("*").eq("activo", true).order("chofer")

  if (error) {
    console.error("Error fetching camiones:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Guía</h1>
        <p className="text-muted-foreground">Registra una nueva salida de camión</p>
      </div>

      <GuiaForm camiones={camiones || []} />
    </div>
  )
}
