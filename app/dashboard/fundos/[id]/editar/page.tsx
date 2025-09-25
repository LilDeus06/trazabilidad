import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { FundoForm } from "@/components/fundos/fundo-form"

interface EditFundoPageProps {
  params: {
    id: string
  }
}

export default async function EditFundoPage({ params }: EditFundoPageProps) {
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

  // Obtener el fundo
  const { data: fundo, error } = await supabase
    .from("fundos")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !fundo) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Fundo</h1>
        <p className="text-muted-foreground">Modificar la información del fundo: {fundo.nombre}</p>
      </div>

      <FundoForm fundo={fundo} />
    </div>
  )
}
