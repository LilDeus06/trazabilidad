import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LoteForm } from "@/components/lotes/lote-form"

export default async function NuevoLotePage() {
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
    .select("can_write")
    .eq("user_id", user.id)
    .eq("module_name", "lotes")
    .single()

  if (!permissions?.can_write) {
    redirect("/dashboard/lotes")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Lote</h1>
        <p className="text-muted-foreground">Crear un nuevo lote agrícola</p>
      </div>

      <LoteForm />
    </div>
  )
}
