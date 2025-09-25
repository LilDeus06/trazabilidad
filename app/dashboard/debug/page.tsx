"use client"

import { useState, useEffect } from "react"
import { SupabaseDebugger } from "@/lib/supabase/debug"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, Trash2 } from "lucide-react"
import { EnvDebug } from "@/components/env-debug"

export default function DebugPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshLogs = () => {
    setIsRefreshing(true)
    const supabaseDebugger = SupabaseDebugger.getInstance()
    setLogs(supabaseDebugger.getLogs())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const clearLogs = () => {
    const supabaseDebugger = SupabaseDebugger.getInstance()
    supabaseDebugger.clearLogs()
    setLogs([])
  }

  const downloadLogs = () => {
    const supabaseDebugger = SupabaseDebugger.getInstance()
    const logsData = JSON.stringify(supabaseDebugger.getLogs(), null, 2)
    const blob = new Blob([logsData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `supabase-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    refreshLogs()
  }, [])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "secondary"
      case "info":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Debug de Supabase</h1>
          <p className="text-muted-foreground">Monitoreo y logs de conexión con la base de datos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshLogs} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={downloadLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      <EnvDebug />

      <Card>
        <CardHeader>
          <CardTitle>Logs de Conexión ({logs.length})</CardTitle>
          <CardDescription>Registro detallado de todas las operaciones con Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay logs disponibles</p>
            ) : (
              logs.reverse().map((log, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{log.message}</p>
                  {log.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Ver datos</summary>
                      <pre className="mt-2 bg-muted p-2 rounded overflow-auto">{JSON.stringify(log.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
