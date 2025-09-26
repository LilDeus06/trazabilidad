"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Truck, Loader2, AlertTriangle, Grape } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setDebugInfo("")

    console.log("[v0] Iniciando proceso de login...")

    try {
      console.log("[v0] Creando cliente Supabase...")
      const supabase = createClient()

      console.log("[v0] Probando conexión básica...")
      const { data: healthCheck, error: healthError } = await supabase.from("profiles").select("count").limit(1)

      if (healthError) {
        console.error("[v0] Error de conexión:", healthError)
        setDebugInfo(`Error de conexión: ${healthError.message}`)
        throw new Error(`No se puede conectar a la base de datos: ${healthError.message}`)
      }

      console.log("[v0] Conexión exitosa, intentando autenticación...")

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (authError) {
        console.error("[v0] Error de autenticación:", authError)

        let userMessage = "Error de autenticación"
        if (authError.message.includes("Invalid login credentials")) {
          userMessage = "Credenciales incorrectas. Verifica tu email y contraseña."
        } else if (authError.message.includes("Email not confirmed")) {
          userMessage = "Email no confirmado. Revisa tu bandeja de entrada."
        } else {
          userMessage = `Error: ${authError.message}`
        }

        setDebugInfo(`Código de error: ${authError.message}`)
        throw new Error(userMessage)
      }

      if (!data.user) {
        throw new Error("No se recibieron datos del usuario")
      }

      console.log("[v0] Autenticación exitosa, verificando perfil...")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Error al obtener perfil:", profileError)
        setDebugInfo(`Error de perfil: ${profileError.message}`)
        throw new Error(`Error al obtener perfil: ${profileError.message}`)
      }

      if (!profile) {
        console.log("[v0] Perfil no encontrado, creando perfil básico...")
        const { error: createError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          nombre_completo: data.user.email?.split("@")[0] || "Usuario",
          rol: "operador",
        })

        if (createError) {
          console.error("[v0] Error al crear perfil:", createError)
          throw new Error(`Error al crear perfil: ${createError.message}`)
        }
      }

      console.log("[v0] Login completado exitosamente, redirigiendo...")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error("[v0] Error en login:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)

      if (process.env.NODE_ENV === "development") {
        setDebugInfo((prev) => prev + `\nError completo: ${JSON.stringify(error, null, 2)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative bg-black bg-gradient-to-br">
      {/* Northern Aurora */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
          radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
          radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
          radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
          radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
          #000000
          `,
        }}
      />
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Grape className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">UvaTracer</h1>
            </div>
            <p className="text-sm text-muted-foreground text-center">Sistema de Gestión Logística GLOBAL</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  {error && (
                    <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p>{error}</p>
                      {debugInfo && process.env.NODE_ENV === "development" && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs">Información técnica</summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">{debugInfo}</pre>
                        </details>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:text-primary/80 underline underline-offset-4"
                  >
                    Contacta al administrador
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  )
}
