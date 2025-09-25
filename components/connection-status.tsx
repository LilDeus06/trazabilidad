"use client"

import { useConnectionStatus } from "@/hooks/use-connection-status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff, Loader2 } from "lucide-react"

export function ConnectionStatus() {
  const { isOnline, isConnecting } = useConnectionStatus()

  if (isOnline && !isConnecting) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Alert
        className={`border ${isConnecting ? "border-yellow-500/50 bg-yellow-500/10" : "border-red-500/50 bg-red-500/10"}`}
      >
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className={isConnecting ? "text-yellow-700" : "text-red-700"}>
            {isConnecting ? "Reconectando..." : "Sin conexión a internet"}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
