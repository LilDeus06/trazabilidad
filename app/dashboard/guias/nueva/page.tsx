import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuiaForm } from "@/components/guias/guia-form"

export default async function NuevaGuiaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Obtener perfil del usuario para verificar rol
const { data: profile } = await supabase
  .from("profiles")
  .select("rol")
  .eq("id", user.id)
  .single()

let camionesQuery = supabase.from("camiones").select("*").eq("activo", true)
let fundoIds: string[] | null = null

// Si no es admin ni operador, filtrar por permisos de fundo
if (profile?.rol !== 'admin' && profile?.rol !== 'operador') {
  // Obtener permisos de fundo del usuario
  const { data: fundoPermissions } = await supabase
    .from("user_fundo_permissions")
    .select("fundo_id")
    .eq("user_id", user.id)

  if (fundoPermissions && fundoPermissions.length > 0) {
    fundoIds = fundoPermissions.map(fp => fp.fundo_id)
    // Filtrar camiones que estén asignados a los fundos permitidos
    camionesQuery = camionesQuery.in("id_fundo", fundoIds)
  } else {
    // Si no tiene permisos específicos, no mostrar ningún camión
    camionesQuery = camionesQuery.eq("id", "00000000-0000-0000-0000-000000000000")
  }
}

const { data: camiones, error: camionesError } = await camionesQuery.order("chofer")

if (camionesError) {
  console.error("Error fetching camiones:", camionesError)
}

// Cargar lotes accesibles
let lotesQuery = supabase
  .from("lotes")
  .select("id, id_fundo, nombre, estado")
  .eq("estado", "activo")

if (profile?.rol !== 'admin' && profile?.rol !== 'operador') {
  if (fundoIds && fundoIds.length > 0) {
    lotesQuery = lotesQuery.in("id_fundo", fundoIds)
  } else {
    lotesQuery = lotesQuery.eq("id", "00000000-0000-0000-0000-000000000000")
  }
}

const { data: lotes, error: lotesError } = await lotesQuery.order("nombre")

if (lotesError) {
  console.error("Error fetching lotes:", lotesError)
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Guía</h1>
        <p className="text-muted-foreground">Registra una nueva salida de camión</p>
      </div>

      <GuiaForm camiones={camiones || []} lotes={lotes || []} />
    </div>
  )
}
