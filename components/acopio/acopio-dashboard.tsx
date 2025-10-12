"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Inbox, Layers, TrendingUp, Calendar, Users, MapPin, Activity } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"

interface AcopioStats {
  totalRecepciones: number
  totalPallets: number
  totalCargas: number
  recepcionesHoy: number
  palletsActivos: number
  eficienciaPromedio: number
  recepcionesPorDia: { fecha: string; cantidad: number }[]
  recepcionesPorFundo: { fundo: string; cantidad: number }[]
  palletsPorEstado: { estado: string; cantidad: number }[]
  recepcionesPorCalidad: { calidad: string; cantidad: number }[]
}

export function AcopioDashboard() {
  const [stats, setStats] = useState<AcopioStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAcopioStats()
  }, [])

  const fetchAcopioStats = async () => {
    const supabase = createClient()

    try {
      // Estadísticas básicas
      const [
        { count: totalRecepciones },
        { count: totalPallets },
        { count: totalCargas }
      ] = await Promise.all([
        supabase.from("acopio_recepcion").select("*", { count: "exact", head: true }),
        supabase.from("acopio_pallets").select("*", { count: "exact", head: true }),
        supabase.from("acopio_carga").select("*", { count: "exact", head: true }),
      ])

      // Recepciones de hoy
      const today = new Date().toISOString().split('T')[0]
      const { count: recepcionesHoy } = await supabase
        .from("acopio_recepcion")
        .select("*", { count: "exact", head: true })
        .gte("fecha_recepcion", `${today}T00:00:00.000Z`)
        .lt("fecha_recepcion", `${today}T23:59:59.999Z`)

      // Pallets activos
      const { count: palletsActivos } = await supabase
        .from("acopio_pallets")
        .select("*", { count: "exact", head: true })
        .neq("estado", "despachado")

      // Recepciones por día (últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recepcionesData } = await supabase
        .from("acopio_recepcion")
        .select("fecha_recepcion")
        .gte("fecha_recepcion", sevenDaysAgo.toISOString())
        .order("fecha_recepcion")

      const recepcionesPorDia = recepcionesData?.reduce((acc: any[], rec) => {
        const fecha = formatDatePeru(new Date(rec.fecha_recepcion))
        const existing = acc.find(item => item.fecha === fecha)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ fecha, cantidad: 1 })
        }
        return acc
      }, []) || []

      // Recepciones por fundo
      const { data: recepcionesFundo } = await supabase
        .from("acopio_recepcion")
        .select(`
          cantidad_recibida,
          lotes (
            fundos (
              nombre
            )
          )
        `)

      const recepcionesPorFundo = recepcionesFundo?.reduce((acc: any[], rec: any) => {
        const fundo = rec.lotes?.fundos?.nombre || 'Sin fundo'
        const existing = acc.find(item => item.fundo === fundo)
        if (existing) {
          existing.cantidad += rec.cantidad_recibida
        } else {
          acc.push({ fundo, cantidad: rec.cantidad_recibida })
        }
        return acc
      }, []) || []

      // Pallets por estado
      const { data: palletsEstado } = await supabase
        .from("acopio_pallets")
        .select("estado")

      const palletsPorEstado = palletsEstado?.reduce((acc: any[], pallet) => {
        const existing = acc.find(item => item.estado === pallet.estado)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ estado: pallet.estado, cantidad: 1 })
        }
        return acc
      }, []) || []

      // Recepciones por calidad
      const { data: recepcionesCalidad } = await supabase
        .from("acopio_recepcion")
        .select("calidad")

      const recepcionesPorCalidad = recepcionesCalidad?.reduce((acc: any[], rec) => {
        const calidad = rec.calidad || 'Sin calificar'
        const existing = acc.find(item => item.calidad === calidad)
        if (existing) {
          existing.cantidad++
        } else {
          acc.push({ calidad, cantidad: 1 })
        }
        return acc
      }, []) || []

      // Calcular eficiencia promedio
      const eficienciaPromedio = totalPallets > 0 ? Math.round((palletsActivos / totalPallets) * 100) : 0

      setStats({
        totalRecepciones: totalRecepciones || 0,
        totalPallets: totalPallets || 0,
        totalCargas: totalCargas || 0,
        recepcionesHoy: recepcionesHoy || 0,
        palletsActivos: palletsActivos || 0,
        eficienciaPromedio,
        recepcionesPorDia,
        recepcionesPorFundo,
        palletsPorEstado,
        recepcionesPorCalidad
      })
    } catch (error) {
      console.error("Error fetching acopio stats:", error)
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
            <CardTitle className="text-sm font-medium">Total Recepciones</CardTitle>
            <Inbox className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecepciones.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recepcionesHoy} hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pallets Activos</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.palletsActivos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalPallets} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones de Carga</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCargas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">realizadas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eficienciaPromedio}%</div>
            <p className="text-xs text-muted-foreground">utilización pallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recepciones por día */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recepciones por Día
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recepcionesPorDia.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.fecha}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.recepcionesPorDia.map(d => d.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.cantidad}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recepciones por fundo */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Recepciones por Fundo
            </CardTitle>
            <CardDescription>Cantidad total por fundo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recepcionesPorFundo.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.fundo}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.recepcionesPorFundo.map(f => f.cantidad))) * 100, 100)}%`
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

      {/* Estados de pallets y calidad */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado de Pallets
            </CardTitle>
            <CardDescription>Distribución por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.palletsPorEstado.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.estado === 'vacio' ? 'bg-gray-400' :
                      item.estado === 'parcial' ? 'bg-yellow-400' :
                      item.estado === 'lleno' ? 'bg-green-400' :
                      item.estado === 'despachado' ? 'bg-blue-400' :
                      'bg-purple-400'
                    }`} />
                    <span className="text-sm font-medium capitalize">{item.estado}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.cantidad}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Calidad de Recepciones
            </CardTitle>
            <CardDescription>Evaluación de calidad por recepción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recepcionesPorCalidad.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.calidad}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...stats.recepcionesPorCalidad.map(c => c.cantidad))) * 100, 100)}%`
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
