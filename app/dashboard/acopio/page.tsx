import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AcopioDataTable } from "@/components/acopio/acopio-data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Inbox, Layers, TrendingUp, Download, BarChart3, PieChart, Calendar, Users, MapPin } from "lucide-react"
import Link from "next/link"
import { AcopioDashboard } from "@/components/acopio/acopio-dashboard"
import { AcopioAnalytics } from "@/components/acopio/acopio-analytics"

export default async function AcopioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verificar permisos del usuario para el módulo acopio
  const { data: permissions } = await supabase
    .from("user_module_permissions")
    .select("can_read, can_write, can_delete")
    .eq("user_id", user.id)
    .eq("module_name", "acopio")
    .single()

  // Si no tiene permisos específicos, verificar rol por defecto
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()

  const hasReadPermission = permissions?.can_read || (profile?.rol && ["admin", "operador"].includes(profile.rol))

  if (!hasReadPermission) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Acopio</h1>
          <p className="text-muted-foreground">Análisis y visualización de datos de recepción y almacenamiento</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/api/acopio/export">
              <Download className="mr-2 h-4 w-4" />
              Exportar Datos
            </Link>
          </Button>
          {profile?.rol === "admin" && (
            <Button asChild>
              <Link href="/dashboard/acopio/recepcion/nueva">
                <Package className="mr-2 h-4 w-4" />
                Nueva Recepción
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AcopioDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AcopioAnalytics />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Datos de Acopio
                  </CardTitle>
                  <CardDescription>Visualización detallada de todas las operaciones de acopio</CardDescription>
                </CardHeader>
                <CardContent>
                  <AcopioDataTable />
                </CardContent>
              </Card>
            </TabsContent>

      </Tabs>
    </div>
  )
}
