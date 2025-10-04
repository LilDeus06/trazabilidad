import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PackageCheck, Plus, Box, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function PackingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario para el módulo packing
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write, can_delete")
    .eq("user_id", user.id)
    .eq("module_name", "packing")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  const hasReadPermission = permissions?.can_read || (profile?.rol && ["admin", "operador"].includes(profile.rol))

  if (!hasReadPermission) {
    redirect("/dashboard")
  }

  // Obtener estadísticas básicas
  const [{ count: totalPacking }] = await Promise.all([
    supabase.from("packing").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Packing</h1>
          <p className="text-muted-foreground">Control de empaque y procesamiento final</p>
        </div>
        {profile?.rol === "admin" && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/packing/reportes">
                <Target className="mr-2 h-4 w-4" />
                Ver Reportes
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/packing/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Packing
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPacking || 0}</div>
            <p className="text-xs text-muted-foreground">Total procesados</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Box className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Procesos hoy</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Por procesar</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97%</div>
            <p className="text-xs text-muted-foreground">Promedio semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos de Packing */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-500" />
              Procesamiento
            </CardTitle>
            <CardDescription>Gestiona las operaciones de empaque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Registro de Packing</h4>
                  <p className="text-sm text-muted-foreground">Registra nuevos procesos de empaque</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/packing/procesos">Ver Todos</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Control de Calidad</h4>
                  <p className="text-sm text-muted-foreground">Supervisa la calidad del empaque</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/packing/calidad">Gestionar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-500" />
              Tipos de Empaque
            </CardTitle>
            <CardDescription>Administra los diferentes tipos de empaque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Configuración</h4>
                  <p className="text-sm text-muted-foreground">Configura tipos de empaque</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/packing/tipos">Configurar</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Destinos</h4>
                  <p className="text-sm text-muted-foreground">Gestiona destinos de envío</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/packing/destinos">Gestionar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Módulo de Packing</CardTitle>
          <CardDescription>Sistema completo de gestión de empaque y procesamiento final</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Procesamiento</h3>
              <p className="text-sm text-muted-foreground">
                Controla todo el proceso de empaque desde la recepción hasta el despacho final
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Tipos de Empaque</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona diferentes tipos de empaque según destino y especificaciones
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Trazabilidad</h3>
              <p className="text-sm text-muted-foreground">
                Mantiene trazabilidad completa desde campo hasta destino final
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
