import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FundoForm } from "@/components/fundos/fundo-form"

export default async function NuevoFundoPage() {
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
    .eq("module_name", "fundos")
    .single()

  if (!permissions?.can_write) {
    redirect("/dashboard/fundos")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Fundo</h1>
        <p className="text-muted-foreground">Crear un nuevo fundo agrícola</p>
      </div>

      <FundoForm />
    </div>
  )
}
