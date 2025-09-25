import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function UsuariosPage() {
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

  // Obtener usuarios
  const { data: usuarios, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching usuarios:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios y roles del sistema</p>
        </div>
        <Button asChild>
          <Link href="/auth/register">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <UsuariosTable usuarios={usuarios || []} />
    </div>
  )
}
