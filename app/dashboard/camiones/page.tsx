import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CamionesTable } from "@/components/camiones/camiones-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function CamionesPage() {
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

  const hasReadPermission = permissions?.can_read || (profile?.rol && ["admin", "operador"].includes(profile.rol))

  if (!hasReadPermission) {
    redirect("/dashboard")
  }

  // Obtener camiones con información de fundo y lote (sin límite para paginación del lado cliente)
  const { data: camiones, error } = await supabase
    .from("camiones")
    .select(`
      *,
      fundos (
        nombre
      ),
      lotes (
        nombre,
        fundos (
          nombre
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching camiones:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Camiones</h1>
          <p className="text-muted-foreground">Administra la flota de camiones del sistema</p>
        </div>
        {(permissions?.can_write || profile?.rol === "admin") && (
          <Button asChild>
            <Link href="/dashboard/camiones/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Camión
            </Link>
          </Button>
        )}
      </div>

      <CamionesTable camiones={camiones || []} permissions={permissions} userRole={profile?.rol || "usuario"} />
    </div>
  )
}
