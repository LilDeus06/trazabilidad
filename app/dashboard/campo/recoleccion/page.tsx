import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecoleccionForm } from "@/components/campo/recoleccion-form"
import { RecoleccionTable } from "@/components/campo/recoleccion-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function RecoleccionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario para el módulo campo
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write, can_delete")
    .eq("user_id", user.id)
    .eq("module_name", "campo")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  const hasPermission = permissions?.can_read || (profile && ["admin", "operador"].includes(profile.rol))

  if (profileError || !hasPermission) {
    redirect("/dashboard")
  }

  // Obtener recolecciones con información del responsable y lote
  const { data: recolecciones, error: recoleccionesError } = await supabase
    .from("campo_recoleccion")
    .select(`
      *,
      profiles (
        nombre,
        apellido
      ),
      lotes (
        nombre,
        fundos (
          nombre
        )
      )
    `)
    .order("fecha", { ascending: false })

  if (recoleccionesError) {
    console.error("Error fetching recolecciones:", recoleccionesError)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/campo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Campo
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Recolección</h1>
        <p className="text-muted-foreground">Administra las actividades de recolección en campo</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecoleccionForm userId={user.id} />
        <div className="lg:col-span-2">
          <RecoleccionTable recolecciones={recolecciones || []} userRole={profile.rol} permissions={permissions} />
        </div>
      </div>
    </div>
  )
}
