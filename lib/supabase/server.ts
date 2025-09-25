import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, type NextResponse } from "next/server"

async function createClientInternal() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Creando cliente Supabase del servidor...")
  console.log("[v0] Variables disponibles:", {
    url: !!supabaseUrl,
    key: !!supabaseKey,
  })

  if (!supabaseUrl || !supabaseKey) {
    const errorMessage = `Variables de entorno de Supabase no configuradas en el servidor.
    
Asegúrate de tener en tu .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima`

    console.error("[v0] Error de configuración del servidor:", errorMessage)
    throw new Error("Variables de entorno de Supabase no configuradas")
  }

  try {
    const cookieStore = await cookies()

    const client = _createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log("[v0] Obteniendo cookies del servidor:", allCookies.length)
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
            console.log("[v0] Cookies establecidas:", cookiesToSet.length)
          } catch (error) {
            console.log("[v0] Advertencia: No se pudieron establecer cookies (normal en Server Components)")
          }
        },
      },
    })

    console.log("[v0] Cliente Supabase del servidor creado exitosamente")
    return client
  } catch (error) {
    console.error("[v0] Error al crear cliente Supabase del servidor:", error)
    throw error
  }
}

export async function createClient() {
  return await createClientInternal()
}

export async function createServerClient() {
  return await createClientInternal()
}

export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return _createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
    },
  })
}
