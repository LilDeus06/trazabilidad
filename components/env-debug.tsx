"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"

export function EnvDebug() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    })
  }, [])

  const getStatus = (value: string | undefined) => {
    return value ? { status: "success", icon: CheckCircle, color: "text-green-600" } : { status: "error", icon: AlertTriangle, color: "text-red-600" }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Debug de Variables de Entorno</CardTitle>
        <CardDescription>Estado actual de las variables de Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => {
            const { status, icon: Icon, color } = getStatus(value)
            return (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className="font-medium">{key}</p>
                    <p className="text-sm text-muted-foreground">
                      {value ? `${value.substring(0, 20)}...` : "No configurada"}
                    </p>
                  </div>
                </div>
                <Badge variant={status === "success" ? "default" : "destructive"}>
                  {status === "success" ? "OK" : "FALTANTE"}
                </Badge>
              </div>
            )
          })}
        </div>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Para configurar:</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Crea un archivo <code>.env.local</code> en la raíz del proyecto con:
          </p>
          <pre className="text-xs bg-background p-2 rounded border">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
