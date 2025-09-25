"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { SupabaseDebugger } from "@/lib/supabase/debug"

export function useSupabaseStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    const supabaseDebugger = SupabaseDebugger.getInstance()

    const checkConnection = async () => {
      console.log("[v0] Verificando estado de conexión con Supabase...")
      setIsChecking(true)
      setLastError(null)

      try {
        const supabase = createClient()

        // Intentar una consulta simple
        const { data, error } = await supabase.from("profiles").select("id").limit(1)

        if (error) {
          console.error("[v0] Error en verificación de conexión:", error)
          supabaseDebugger.log("error", "Error en verificación de conexión", error)
          setLastError(error.message)
          setIsConnected(false)
        } else {
          console.log("[v0] Conexión con Supabase verificada exitosamente")
          supabaseDebugger.log("info", "Conexión con Supabase verificada exitosamente")
          setIsConnected(true)
        }
      } catch (error) {
        console.error("[v0] Error crítico en verificación de conexión:", error)
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        supabaseDebugger.log("error", "Error crítico en verificación de conexión", { error: errorMessage })
        setLastError(errorMessage)
        setIsConnected(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Check connection on mount
    checkConnection()

    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { isConnected, isChecking, lastError }
}
