import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { LoteForm } from "@/components/lotes/lote-form"

interface EditLotePageProps {
  params: {
    id: string
  }
}

export default async function EditLotePage({ params }: EditLotePageProps) {
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

  // Obtener el lote
  const { data: lote, error } = await supabase
    .from("lotes")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !lote) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Lote</h1>
        <p className="text-muted-foreground">Modificar la información del lote: {lote.nombre}</p>
      </div>

      <LoteForm lote={lote} />
    </div>
  )
}
