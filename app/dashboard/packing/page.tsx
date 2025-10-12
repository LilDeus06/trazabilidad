import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PackageCheck, Plus, Box, Target, TrendingUp, Download, BarChart3, PieChart, Calendar, Users, MapPin } from "lucide-react"
import Link from "next/link"
import { PackingDashboard } from "@/components/packing/packing-dashboard"
import { PackingAnalytics } from "@/components/packing/packing-analytics"
import { PackingDataTable } from "@/components/packing/packing-data-table"


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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Packing</h1>
          <p className="text-muted-foreground">Análisis y visualización de datos de empaque y procesamiento</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/api/packing/export">
              <Download className="mr-2 h-4 w-4" />
              Exportar Datos
            </Link>
          </Button>
          {profile?.rol === "admin" && (
            <Button asChild>
              <Link href="/dashboard/packing/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Packing
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
            <Box className="h-4 w-4" />
            Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <PackingDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PackingAnalytics />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Datos de Packing
              </CardTitle>
              <CardDescription>Visualización detallada de todas las operaciones de packing</CardDescription>
            </CardHeader>
            <CardContent>
              <PackingDataTable />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
