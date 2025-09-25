"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    message?: string
  } | null>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvStatus({
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      message:
        !supabaseUrl || !supabaseKey
          ? "Variables de entorno faltantes. Revisa tu archivo .env.local"
          : "Variables de entorno configuradas correctamente",
    })
  }, [])

  if (!envStatus) return null

  const isConfigured = envStatus.supabaseUrl && envStatus.supabaseKey

  return (
    <Alert className={isConfigured ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
      {isConfigured ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      )}
      <AlertDescription className={isConfigured ? "text-green-800" : "text-yellow-800"}>
        {envStatus.message}
        {!isConfigured && (
          <div className="mt-2 text-sm">
            <p>
              Para desarrollo local, crea un archivo <code>.env.local</code> con:
            </p>
            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
              {`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima`}
            </pre>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
