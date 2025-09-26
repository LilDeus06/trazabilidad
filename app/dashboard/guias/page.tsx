 import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuiasTable } from "@/components/guias/guias-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function GuiasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  // Obtener guías con información del camión y fundo
  const { data: guias, error } = await supabase
    .from("guias")
    .select(`
      *,
      camiones (
        chofer,
        placa,
        capacidad,
        fundos (
          nombre
        )
      ),
      fundos (
        nombre
      )
    `)
    .order("fecha_hora", { ascending: false })

  if (error) {
    console.error("Error fetching guias:", error)
  }

  // Obtener nombres de usuarios para las guías
  const userIds = guias?.map(g => g.usuario_id).filter((id, index, arr) => arr.indexOf(id) === index) || []
  const { data: users } = userIds.length > 0 ? await supabase
    .from("profiles")
    .select("id, nombre, apellido")
    .in("id", userIds) : { data: [] }

  const userMap = new Map(users?.map(u => [u.id, u]) || [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Guías</h1>
          <p className="text-muted-foreground">Control de salidas y despachos de camiones</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/guias/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Guía
          </Link>
        </Button>
      </div>

      <GuiasTable guias={guias || []} userRole={profile?.rol || "usuario"} userMap={userMap} />
    </div>
  )
}
