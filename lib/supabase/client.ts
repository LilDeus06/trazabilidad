import { createBrowserClient as _createBrowserClient } from "@supabase/ssr"

function createClientInternal() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    const errorMessage = `Variables de entorno de Supabase no encontradas.

Para desarrollo local, crea un archivo .env.local con:
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

Variables actuales:
- URL: ${supabaseUrl ? "✓ Configurada" : "✗ Faltante"}
- Key: ${supabaseKey ? "✓ Configurada" : "✗ Faltante"}`

    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  try {
    const client = _createBrowserClient(supabaseUrl, supabaseKey)
    return client
  } catch (error) {
    throw error
  }
}

export function createClient() {
  return createClientInternal()
}

export function createBrowserClient() {
  return createClientInternal()
}
