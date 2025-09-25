import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { GuiaForm } from "@/components/guias/guia-form"

interface EditGuiaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditGuiaPage({ params }: EditGuiaPageProps) {
  const { id } = await params
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
    redirect("/dashboard/guias")
  }

  // Obtener datos de la guía
  const { data: guia, error: guiaError } = await supabase.from("guias").select("*").eq("id", id).single()

  if (guiaError || !guia) {
    notFound()
  }

  // Obtener camiones activos
  const { data: camiones, error: camionesError } = await supabase
    .from("camiones")
    .select("*")
    .eq("activo", true)
    .order("chofer")

  if (camionesError) {
    console.error("Error fetching camiones:", camionesError)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Guía</h1>
        <p className="text-muted-foreground">Modifica la información de la guía</p>
      </div>

      <GuiaForm camiones={camiones || []} guia={guia} />
    </div>
  )
}
