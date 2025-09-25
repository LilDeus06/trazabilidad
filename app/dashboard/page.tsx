import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Truck,
  FileText,
  TrendingUp,
  Package,
  Wheat,
  PackageCheck,
  Calendar,
  Activity,
  AlertTriangle,
} from "lucide-react"
import { formatDateTimePeru } from "@/lib/utils/date"

interface DashboardStats {
  totalUsuarios: number
  usuariosActivos: number
  totalCamiones: number
  camionesActivos: number
  totalGuias: number
  guiasHoy: number
  totalRecoleccion: number
  recoleccionHoy: number
  totalPallets: number
  palletsDisponibles: number
  totalPacking: number
  packingHoy: number
  eficienciaOperacional: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerClient()
  console.log("[v0] Obteniendo estadísticas del dashboard")

  try {
    // Obtener estadísticas en paralelo
    const [
      { count: totalUsuarios },
      { data: usuariosActivos },
      { count: totalCamiones },
      { data: camionesActivos },
      { count: totalGuias },
      { data: guiasHoy },
      { count: totalRecoleccion },
      { data: recoleccionHoy },
      { count: totalPallets },
      { data: palletsDisponibles },
      { count: totalPacking },
      { data: packingHoy },
    ] = await Promise.all([
      // Usuarios
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("activo", { count: "exact" }).eq("activo", true),

      // Camiones
      supabase
        .from("camiones")
        .select("*", { count: "exact", head: true }),
      supabase.from("camiones").select("activo", { count: "exact" }).eq("activo", true),

      // Guías
      supabase
        .from("guias")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("guias")
        .select("created_at", { count: "exact" })
        .gte("created_at", new Date().toISOString().split("T")[0]),

      // Recolección
      supabase
        .from("campo_recoleccion")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("campo_recoleccion")
        .select("fecha", { count: "exact" })
        .eq("fecha", new Date().toISOString().split("T")[0]),

      // Pallets
      supabase
        .from("acopio_pallets")
        .select("*", { count: "exact", head: true }),
      supabase.from("acopio_pallets").select("estado", { count: "exact" }).eq("estado", "disponible"),

      // Packing
      supabase
        .from("packing")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("packing")
        .select("fecha_packing", { count: "exact" })
        .gte("fecha_packing", new Date().toISOString().split("T")[0]),
    ])

    // Calcular eficiencia operacional basada en datos reales
    const totalOperaciones = (totalGuias || 0) + (totalRecoleccion || 0) + (totalPacking || 0)
    const operacionesHoy = (guiasHoy?.length || 0) + (recoleccionHoy?.length || 0) + (packingHoy?.length || 0)
    const eficienciaOperacional =
      totalOperaciones > 0 ? Math.round((operacionesHoy / Math.max(totalOperaciones * 0.1, 1)) * 100) : 0

    console.log("[v0] Estadísticas calculadas exitosamente")

    return {
      totalUsuarios: totalUsuarios || 0,
      usuariosActivos: usuariosActivos?.length || 0,
      totalCamiones: totalCamiones || 0,
      camionesActivos: camionesActivos?.length || 0,
      totalGuias: totalGuias || 0,
      guiasHoy: guiasHoy?.length || 0,
      totalRecoleccion: totalRecoleccion || 0,
      recoleccionHoy: recoleccionHoy?.length || 0,
      totalPallets: totalPallets || 0,
      palletsDisponibles: palletsDisponibles?.length || 0,
      totalPacking: totalPacking || 0,
      packingHoy: packingHoy?.length || 0,
      eficienciaOperacional: Math.min(eficienciaOperacional, 100),
    }
  } catch (error) {
    console.error("[v0] Error obteniendo estadísticas:", error)
    // Retornar valores por defecto en caso de error
    return {
      totalUsuarios: 0,
      usuariosActivos: 0,
      totalCamiones: 0,
      camionesActivos: 0,
      totalGuias: 0,
      guiasHoy: 0,
      totalRecoleccion: 0,
      recoleccionHoy: 0,
      totalPallets: 0,
      palletsDisponibles: 0,
      totalPacking: 0,
      packingHoy: 0,
      eficienciaOperacional: 0,
    }
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const mainStats = [
    {
      title: "Usuarios del Sistema",
      value: stats.totalUsuarios,
      subtitle: `${stats.usuariosActivos} activos`,
      description: "Usuarios registrados y activos",
      icon: Users,
      color: "text-blue-500",
      progress: stats.totalUsuarios > 0 ? (stats.usuariosActivos / stats.totalUsuarios) * 100 : 0,
    },
    {
      title: "Flota de Camiones",
      value: stats.totalCamiones,
      subtitle: `${stats.camionesActivos} operativos`,
      description: "Camiones registrados y operativos",
      icon: Truck,
      color: "text-green-500",
      progress: stats.totalCamiones > 0 ? (stats.camionesActivos / stats.totalCamiones) * 100 : 0,
    },
    {
      title: "Guías de Despacho",
      value: stats.totalGuias,
      subtitle: `${stats.guiasHoy} hoy`,
      description: "Total de guías y actividad diaria",
      icon: FileText,
      color: "text-orange-500",
      progress: stats.totalGuias > 0 ? (stats.guiasHoy / Math.max(stats.totalGuias * 0.1, 1)) * 100 : 0,
    },
    {
      title: "Eficiencia Operacional",
      value: `${stats.eficienciaOperacional}%`,
      subtitle: "Basada en actividad diaria",
      description: "Rendimiento del sistema",
      icon: TrendingUp,
      color: "text-purple-500",
      progress: stats.eficienciaOperacional,
    },
  ]

  const operationalStats = [
    {
      title: "Recolección de Campo",
      total: stats.totalRecoleccion,
      today: stats.recoleccionHoy,
      icon: Wheat,
      color: "text-amber-500",
    },
    {
      title: "Pallets en Acopio",
      total: stats.totalPallets,
      today: stats.palletsDisponibles,
      todayLabel: "disponibles",
      icon: Package,
      color: "text-cyan-500",
    },
    {
      title: "Procesamiento Packing",
      total: stats.totalPacking,
      today: stats.packingHoy,
      icon: PackageCheck,
      color: "text-emerald-500",
    },
  ]

  const getStatusBadge = (current: number, total: number, type: "percentage" | "count" = "percentage") => {
    if (type === "percentage") {
      if (current >= 80) return { variant: "default" as const, label: "Excelente" }
      if (current >= 60) return { variant: "secondary" as const, label: "Bueno" }
      if (current >= 40) return { variant: "outline" as const, label: "Regular" }
      return { variant: "destructive" as const, label: "Bajo" }
    } else {
      if (current === 0 && total === 0) return { variant: "outline" as const, label: "Sin datos" }
      if (current > 0) return { variant: "default" as const, label: "Activo" }
      return { variant: "secondary" as const, label: "Inactivo" }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen en tiempo real del sistema de gestión logística</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDateTimePeru(new Date(), {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon
          const badge = getStatusBadge(stat.progress, 100)

          return (
            <Card key={stat.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <Badge variant={badge.variant} className="text-xs">
                    {badge.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{stat.subtitle}</span>
                    <span className="text-muted-foreground">{Math.round(stat.progress)}%</span>
                  </div>
                  <Progress value={stat.progress} className="h-1" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Estadísticas operacionales */}
      <div className="grid gap-4 md:grid-cols-3">
        {operationalStats.map((stat) => {
          const Icon = stat.icon
          const badge = getStatusBadge(stat.today, stat.total, "count")

          return (
            <Card key={stat.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">{stat.total}</div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>
                    {stat.today} {stat.todayLabel || "hoy"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resumen del sistema */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Resumen del Sistema</span>
          </CardTitle>
          <CardDescription>Estado actual de las operaciones logísticas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border border-border/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Gestión de Campo</h3>
                <Wheat className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Control de recolección y carretas</p>
              <div className="flex items-center space-x-2">
                {stats.recoleccionHoy > 0 ? (
                  <Badge variant="default" className="text-xs">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Sin actividad
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{stats.totalRecoleccion} registros totales</span>
              </div>
            </div>

            <div className="p-4 border border-border/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Centro de Acopio</h3>
                <Package className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Gestión de pallets y recepción</p>
              <div className="flex items-center space-x-2">
                {stats.palletsDisponibles > 0 ? (
                  <Badge variant="default" className="text-xs">
                    {stats.palletsDisponibles} disponibles
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Sin pallets
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 border border-border/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Área de Packing</h3>
                <PackageCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Procesamiento y empaque</p>
              <div className="flex items-center space-x-2">
                {stats.packingHoy > 0 ? (
                  <Badge variant="default" className="text-xs">
                    {stats.packingHoy} procesados hoy
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Sin procesamiento
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
