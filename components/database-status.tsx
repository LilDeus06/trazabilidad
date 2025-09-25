"use client"

import { useSupabaseStatus } from "@/hooks/use-supabase-status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react"

export function DatabaseStatus() {
  const { isConnected, isChecking, lastError } = useSupabaseStatus()

  // Solo mostrar cuando hay problemas o está verificando
  if (isConnected && !isChecking) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Alert
        className={`border ${
          isChecking
            ? "border-blue-500/50 bg-blue-500/10"
            : isConnected
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
        }`}
      >
        <div className="flex items-center gap-2">
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          <div className="flex-1">
            <AlertDescription
              className={isChecking ? "text-blue-700" : isConnected ? "text-green-700" : "text-red-700"}
            >
              {isChecking
                ? "Verificando base de datos..."
                : isConnected
                  ? "Conexión restaurada"
                  : "Error de conexión con la base de datos"}
            </AlertDescription>
            {lastError && !isConnected && (
              <AlertDescription className="text-xs text-red-600 mt-1">{lastError}</AlertDescription>
            )}
          </div>
        </div>
      </Alert>
    </div>
  )
}
