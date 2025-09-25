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

  // Verificar rol del usuario
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  if (!profile || !["admin", "operador"].includes(profile.rol)) {
    redirect("/dashboard")
  }

  // Obtener camiones con información de fundo y lote
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
        {profile.rol === "admin" && (
          <Button asChild>
            <Link href="/dashboard/camiones/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Camión
            </Link>
          </Button>
        )}
      </div>

      <CamionesTable camiones={camiones || []} userRole={profile.rol} />
    </div>
  )
}
