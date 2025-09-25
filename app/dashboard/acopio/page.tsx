import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Plus, Inbox, Layers, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function AcopioPage() {
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
  const [{ count: totalRecepciones }, { count: totalPallets }, { count: totalCargas }] = await Promise.all([
    supabase.from("acopio_recepcion").select("*", { count: "exact", head: true }),
    supabase.from("acopio_pallets").select("*", { count: "exact", head: true }),
    supabase.from("acopio_carga").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Acopio</h1>
          <p className="text-muted-foreground">Control de recepción, pallets y carga</p>
        </div>
        {profile.rol === "admin" && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/acopio/pallets">
                <Plus className="mr-2 h-4 w-4" />
                Gestionar Pallets
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/acopio/recepcion/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Recepción
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recepciones</CardTitle>
            <Inbox className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecepciones || 0}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pallets</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPallets || 0}</div>
            <p className="text-xs text-muted-foreground">En sistema</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cargas</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCargas || 0}</div>
            <p className="text-xs text-muted-foreground">Realizadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Utilización pallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos de Acopio */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-green-500" />
              Recepción
            </CardTitle>
            <CardDescription>Gestiona la recepción de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Registro de Recepción</h4>
                  <p className="text-xs text-muted-foreground">Registra nuevas recepciones</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/acopio/recepcion">Ver</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Control de Calidad</h4>
                  <p className="text-xs text-muted-foreground">Evalúa productos recibidos</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/acopio/calidad">Gestionar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              Pallets
            </CardTitle>
            <CardDescription>Administra el inventario de pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Gestión de Pallets</h4>
                  <p className="text-xs text-muted-foreground">Administra pallets</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/acopio/pallets">Ver</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Estado de Pallets</h4>
                  <p className="text-xs text-muted-foreground">Monitorea estados</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/acopio/pallets/estado">Estado</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Carga
            </CardTitle>
            <CardDescription>Controla las operaciones de carga</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Registro de Carga</h4>
                  <p className="text-xs text-muted-foreground">Registra operaciones</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/acopio/carga">Ver</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Planificación</h4>
                  <p className="text-xs text-muted-foreground">Planifica cargas</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/acopio/planificacion">Planificar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Módulo de Acopio</CardTitle>
          <CardDescription>Sistema integral de gestión de acopio y almacenamiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Recepción</h3>
              <p className="text-sm text-muted-foreground">
                Controla la recepción de productos desde campo con registro de calidad y procedencia
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Pallets</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona el inventario de pallets con control de estados y ubicaciones
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-semibold mb-2">Carga</h3>
              <p className="text-sm text-muted-foreground">
                Administra las operaciones de carga de pallets con trazabilidad completa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
