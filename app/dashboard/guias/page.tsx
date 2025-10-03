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

  // Verificar permisos del usuario para el módulo guias
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write, can_delete")
    .eq("user_id", user.id)
    .eq("module_name", "guias")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  const hasPermission = permissions?.can_read || (profile?.rol && ["admin", "usuario", "operador"].includes(profile.rol))

  if (!hasPermission) {
    redirect("/dashboard")
  }

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

  // Obtener lotes y cantidades para cada guía
  const guiasWithLotes = await Promise.all(
    (guias || []).map(async (guia) => {
      if (guia.id_lotes && guia.id_lotes.length > 0) {
        // Get lotes info
        const { data: lotes } = await supabase
          .from("lotes")
          .select("id, nombre, variedad")
          .in("id", guia.id_lotes)

        // Get quantities from guia_lotes
        const { data: guiaLotes } = await supabase
          .from("guia_lotes")
          .select("lote_id, cantidad")
          .eq("guia_id", guia.id)

        // Combine lotes with quantities
        const lotesWithQuantities = (lotes || []).map(lote => {
          const guiaLote = guiaLotes?.find(gl => gl.lote_id === lote.id)
          return {
            ...lote,
            cantidad: guiaLote?.cantidad || (guia.id_lotes.length === 1 ? guia.enviadas : 0)
          }
        })

        return { ...guia, lotes: lotesWithQuantities }
      }
      return { ...guia, lotes: [] }
    })
  )

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
        {(permissions?.can_write || profile?.rol === "admin" || profile?.rol === "usuario" || profile?.rol === "operador") && (
          <Button asChild>
            <Link href="/dashboard/guias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Guía
            </Link>
          </Button>
        )}
      </div>

      <GuiasTable guias={guiasWithLotes} userRole={profile?.rol || "usuario"} userMap={userMap} permissions={permissions} />
    </div>
  )
}
