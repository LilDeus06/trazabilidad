import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
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

  // Obtener estadísticas del sistema
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalCamiones },
    { count: totalGuias },
    { data: recentUsers },
    { data: systemActivity },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("activo", true),
    supabase.from("camiones").select("*", { count: "exact", head: true }),
    supabase.from("guias").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("guias").select("*, camiones(placa, chofer)").order("created_at", { ascending: false }).limit(10),
  ])

  return (
    <AdminDashboard
      stats={{
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalCamiones: totalCamiones || 0,
        totalGuias: totalGuias || 0,
      }}
      recentUsers={recentUsers || []}
      systemActivity={systemActivity || []}
    />
  )
}
