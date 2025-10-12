"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PackageCheck, Box, Target, TrendingUp, Calendar, Users, MapPin, Activity, Clock } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"

interface PackingStats {
  totalPacking: number
  packingHoy: number
  palletsProcesados: number
  eficienciaPromedio: number
  packingPorDia: { fecha: string; cantidad: number }[]
  packingPorDestino: { destino: string; cantidad: number }[]
  packingPorTipo: { tipo: string; cantidad: number }[]
  rendimientoPorHora: { hora: string; cantidad: number }[]
}

export function PackingDashboard() {
  const [stats, setStats] = useState<PackingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackingStats()
  }, [])

  const fetchPackingStats = async () => {
    const supabase = createClient()

    try {
      // Estadísticas básicas
      const [
        { count: totalPacking },
        { count: palletsProcesados }
      ] = await Promise.all([
        supabase.from("packing").select("*", { count: "exact", head: true }),
        supabase.from("acopio_pallets").select("*", { count: "exact", head: true }).eq("estado", "packing")
      ])

      // Packing de hoy
      const today = new Date().toISOString().split('T')[0]
      const { count: packingHoy } = await supabase
        .from("packing")
        .select("*", { count: "exact", head: true })
        .gte("fecha_packing", `${today}T00:00:00.000Z`)
        .lt("fecha_packing", `${today}T23:59:59.999Z`)

      // Packing por día (últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: packingData } = await supabase
        .from("packing")
        .select("fecha_packing, cantidad_procesada")
        .gte("fecha_packing", sevenDaysAgo.toISOString())
        .order("fecha_packing")

      const packingPorDia = packingData?.reduce((acc: any[], pack) => {
        const fecha = formatDatePeru(new Date(pack.fecha_packing))
        const existing = acc.find(item => item.fecha === fecha)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
        } else {
          acc.push({ fecha, cantidad: pack.cantidad_procesada })
        }
        return acc
      }, []) || []

      // Packing por destino
      const { data: packingDestino } = await supabase
        .from("packing")
        .select("destino, cantidad_procesada")

      const packingPorDestino = packingDestino?.reduce((acc: any[], pack) => {
        const destino = pack.destino || 'Sin destino'
        const existing = acc.find(item => item.destino === destino)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
        } else {
          acc.push({ destino, cantidad: pack.cantidad_procesada })
        }
        return acc
      }, []) || []

      // Packing por tipo (desde guías)
      const { data: packingTipo } = await supabase
        .from("packing")
        .select(`
          cantidad_procesada,
          guias (
            packing
          )
        `)

      const packingPorTipo = packingTipo?.reduce((acc: any[], pack: any) => {
        const tipo = pack.guias?.packing || 'Sin tipo'
        const existing = acc.find(item => item.tipo === tipo)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
        } else {
          acc.push({ tipo, cantidad: pack.cantidad_procesada })
        }
        return acc
      }, []) || []

      // Rendimiento por hora
      const { data: rendimientoHora } = await supabase
        .from("packing")
        .select("fecha_packing, cantidad_procesada")
        .gte("fecha_packing", sevenDaysAgo.toISOString())

      const rendimientoPorHora = rendimientoHora?.reduce((acc: any[], pack) => {
        const hora = new Date(pack.fecha_packing).getHours().toString().padStart(2, '0') + ':00'
        const existing = acc.find(item => item.hora === hora)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
        } else {
          acc.push({ hora, cantidad: pack.cantidad_procesada })
        }
        return acc
      }, []) || []

      // Calcular eficiencia promedio
      const eficienciaPromedio = (totalPacking || 0) > 0 ? Math.round(((packingHoy || 0) / (totalPacking || 0)) * 100) : 0

      setStats({
        totalPacking: totalPacking || 0,
        packingHoy: packingHoy || 0,
        palletsProcesados: palletsProcesados || 0,
        eficienciaPromedio,
        packingPorDia,
        packingPorDestino,
        packingPorTipo,
        rendimientoPorHora
      })
    } catch (error) {
      console.error("Error fetching packing stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesos</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPacking.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.packingHoy} hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pallets Procesados</CardTitle>
            <Box className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.palletsProcesados.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">en proceso</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesos Hoy</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.packingHoy.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">completados</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eficienciaPromedio}%</div>
            <p className="text-xs text-muted-foreground">promedio diario</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Packing por día */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Packing por Día
            </CardTitle>
            <CardDescription>Cantidad procesada en los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.packingPorDia.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.fecha}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.packingPorDia.map(d => d.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.cantidad.toLocaleString()} jabas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Packing por destino */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Packing por Destino
            </CardTitle>
            <CardDescription>Distribución por destino final</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.packingPorDestino.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.destino}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.packingPorDestino.map(d => d.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.cantidad.toLocaleString()} jabas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de packing y rendimiento por hora */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tipos de Packing
            </CardTitle>
            <CardDescription>Distribución por tipo de empaque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.packingPorTipo.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.tipo === 'PKG LA GRANJA' ? 'bg-blue-400' :
                      item.tipo === 'PKG SAFCO' ? 'bg-green-400' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{item.tipo}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.cantidad.toLocaleString()} jabas
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rendimiento por Hora
            </CardTitle>
            <CardDescription>Actividad por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.rendimientoPorHora.sort((a, b) => a.hora.localeCompare(b.hora)).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.hora}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.rendimientoPorHora.map(h => h.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.cantidad}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
