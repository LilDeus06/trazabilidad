import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LotesTable } from "@/components/lotes/lotes-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function LotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write")
    .eq("user_id", user.id)
    .eq("module_name", "lotes")
    .single()

  if (!permissions?.can_read) {
    redirect("/dashboard")
  }

  // Obtener lotes con información del fundo
  const { data: lotes, error } = await supabase
    .from("lotes")
    .select(`
      *,
      fundos (
        nombre,
        ubicacion
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching lotes:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Lotes</h1>
          <p className="text-muted-foreground">Administra los lotes agrícolas del sistema</p>
        </div>
        {permissions.can_write && (
          <Button asChild>
            <Link href="/dashboard/lotes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Lote
            </Link>
          </Button>
        )}
      </div>

      <LotesTable lotes={lotes || []} canWrite={permissions.can_write} />
    </div>
  )
}
