import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wheat, Plus, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function CampoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar rol del usuario
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  if (!profile || !["admin", "operador"].includes(profile.rol)) {
    redirect("/dashboard")
  }

  // Obtener estadísticas básicas
  const [{ count: totalRecolecciones }, { count: totalCarretas }] = await Promise.all([
    supabase.from("campo_recoleccion").select("*", { count: "exact", head: true }),
    supabase.from("campo_carreta").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Campo</h1>
          <p className="text-muted-foreground">Control de recolección y carretas en campo</p>
        </div>
        {profile.rol === "admin" && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/campo/carretas">
                <Plus className="mr-2 h-4 w-4" />
                Gestionar Carretas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/campo/recoleccion/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Recolección
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recolecciones</CardTitle>
            <Wheat className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecolecciones || 0}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carretas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCarretas || 0}</div>
            <p className="text-xs text-muted-foreground">En sistema</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Recolecciones hoy</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">Promedio semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos de Campo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-green-500" />
              Recolección
            </CardTitle>
            <CardDescription>Gestiona las actividades de recolección en campo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Registro de Recolección</h4>
                  <p className="text-sm text-muted-foreground">Registra nuevas recolecciones por lote</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/campo/recoleccion">Ver Todas</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Control de Calidad</h4>
                  <p className="text-sm text-muted-foreground">Evalúa la calidad de la recolección</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/campo/calidad">Gestionar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Carretas
            </CardTitle>
            <CardDescription>Administra las carretas utilizadas en campo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Gestión de Carretas</h4>
                  <p className="text-sm text-muted-foreground">Administra el inventario de carretas</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/campo/carretas">Ver Todas</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Estado de Carretas</h4>
                  <p className="text-sm text-muted-foreground">Monitorea el estado y mantenimiento</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/campo/carretas/estado">Estado</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Módulo de Campo</CardTitle>
          <CardDescription>Sistema completo de gestión de actividades de campo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Recolección</h3>
              <p className="text-sm text-muted-foreground">
                Registra y controla todas las actividades de recolección por lotes y fechas
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Carretas</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona el inventario y estado de las carretas utilizadas en campo
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Reportes</h3>
              <p className="text-sm text-muted-foreground">Genera reportes de productividad y eficiencia de campo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
