"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Download, TrendingUp, BarChart3, PieChart, Calendar, Filter, Clock, Target } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"

interface AnalyticsData {
  packingTrend: { fecha: string; cantidad: number; eficiencia: number }[]
  rendimientoPorResponsable: { responsable: string; procesos: number; promedio_diario: number }[]
  packingPorSemana: { semana: string; cantidad: number; crecimiento: number }[]
  calidadPacking: { tipo: string; excelente: number; bueno: number; regular: number; malo: number }[]
}

export function PackingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedDestino, setSelectedDestino] = useState<string>("all")
  const [destinos, setDestinos] = useState<string[]>([])

  useEffect(() => {
    fetchDestinos()
    fetchAnalyticsData()
  }, [dateRange, selectedDestino])

  const fetchDestinos = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("packing")
      .select("destino")
      .not("destino", "is", null)

    const uniqueDestinos = [...new Set(data?.map(item => item.destino) || [])]
    setDestinos(uniqueDestinos)
  }

  const fetchAnalyticsData = async () => {
    const supabase = createClient()

    try {
      // Filtros de fecha
      let dateFilter = {}
      if (dateRange?.from && dateRange?.to) {
        dateFilter = {
          gte: dateRange.from.toISOString(),
          lte: dateRange.to.toISOString()
        }
      }

      // Tendencia de packing (últimos 30 días)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let packingQuery = supabase
        .from("packing")
        .select("fecha_packing, cantidad_procesada, destino")
        .gte("fecha_packing", thirtyDaysAgo.toISOString())
        .order("fecha_packing")

      if (selectedDestino !== "all") {
        packingQuery = packingQuery.eq("destino", selectedDestino)
      }

      const { data: packingData } = await packingQuery

      const packingTrend = packingData?.reduce((acc: any[], pack) => {
        const fecha = formatDatePeru(new Date(pack.fecha_packing))
        const existing = acc.find(item => item.fecha === fecha)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
          existing.total_procesos++
        } else {
          acc.push({
            fecha,
            cantidad: pack.cantidad_procesada,
            total_procesos: 1
          })
        }
        return acc
      }, []).map(item => ({
        ...item,
        eficiencia: item.total_procesos > 0 ? Math.round(item.cantidad / item.total_procesos) : 0
      })) || []

      // Rendimiento por responsable
      const { data: responsableData } = await supabase
        .from("packing")
        .select(`
          cantidad_procesada,
          fecha_packing,
          profiles (
            nombre,
            apellido
          )
        `)
        .gte("fecha_packing", thirtyDaysAgo.toISOString())

      const rendimientoPorResponsable = responsableData?.reduce((acc: any[], pack: any) => {
        const responsable = `${pack.profiles?.nombre || ''} ${pack.profiles?.apellido || ''}`.trim() || 'Sin asignar'
        const existing = acc.find(item => item.responsable === responsable)
        if (existing) {
          existing.total_cantidad += pack.cantidad_procesada
          existing.procesos++
          existing.fechas.add(formatDatePeru(new Date(pack.fecha_packing)))
        } else {
          acc.push({
            responsable,
            total_cantidad: pack.cantidad_procesada,
            procesos: 1,
            fechas: new Set([formatDatePeru(new Date(pack.fecha_packing))])
          })
        }
        return acc
      }, []).map(item => ({
        responsable: item.responsable,
        procesos: item.procesos,
        promedio_diario: Math.round(item.total_cantidad / item.fechas.size)
      })) || []

      // Packing por semana
      const packingPorSemana = packingData?.reduce((acc: any[], pack) => {
        const fecha = new Date(pack.fecha_packing)
        const semana = `Sem ${Math.ceil((fecha.getDate() - fecha.getDay() + 1) / 7)} - ${fecha.getFullYear()}`
        const existing = acc.find(item => item.semana === semana)
        if (existing) {
          existing.cantidad += pack.cantidad_procesada
        } else {
          acc.push({ semana, cantidad: pack.cantidad_procesada, crecimiento: 0 })
        }
        return acc
      }, []).sort((a, b) => a.semana.localeCompare(b.semana)).map((item, index, arr) => ({
        ...item,
        crecimiento: index > 0 ? Math.round(((item.cantidad - arr[index - 1].cantidad) / arr[index - 1].cantidad) * 100) : 0
      })) || []

      // Calidad por tipo de packing
      const { data: calidadData } = await supabase
        .from("packing")
        .select(`
          cantidad_procesada,
          guias (
            packing
          )
        `)
        .gte("fecha_packing", thirtyDaysAgo.toISOString())

      const calidadPacking = calidadData?.reduce((acc: any[], pack: any) => {
        const tipo = pack.guias?.packing || 'Sin tipo'
        const existing = acc.find(item => item.tipo === tipo)
        if (existing) {
          // Simular calidad basada en cantidad procesada (lógica simplificada)
          const calidad = pack.cantidad_procesada > 1000 ? 'excelente' :
                         pack.cantidad_procesada > 500 ? 'bueno' :
                         pack.cantidad_procesada > 200 ? 'regular' : 'malo'
          existing[calidad]++
        } else {
          const calidad = pack.cantidad_procesada > 1000 ? 'excelente' :
                         pack.cantidad_procesada > 500 ? 'bueno' :
                         pack.cantidad_procesada > 200 ? 'regular' : 'malo'
          acc.push({
            tipo,
            excelente: calidad === 'excelente' ? 1 : 0,
            bueno: calidad === 'bueno' ? 1 : 0,
            regular: calidad === 'regular' ? 1 : 0,
            malo: calidad === 'malo' ? 1 : 0
          })
        }
        return acc
      }, []) || []

      setData({
        packingTrend,
        rendimientoPorResponsable,
        packingPorSemana,
        calidadPacking
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    const csvData = [
      ['Métrica', 'Valor', 'Fecha/Dato'],
      ...data!.packingTrend.map(item => ['Packing', item.cantidad, item.fecha]),
      ...data!.rendimientoPorResponsable.map(item => ['Rendimiento', item.promedio_diario, item.responsable])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `packing_analytics_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rango de Fechas</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Seleccionar período"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destino</label>
              <Select value={selectedDestino} onValueChange={setSelectedDestino}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos los destinos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los destinos</SelectItem>
                  {destinos.map(destino => (
                    <SelectItem key={destino} value={destino}>
                      {destino}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportAnalytics} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos analíticos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tendencia de packing */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Packing
            </CardTitle>
            <CardDescription>Cantidad procesada y eficiencia por día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.packingTrend.slice(-10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border/50 rounded">
                  <div>
                    <span className="text-sm font-medium">{item.fecha}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.cantidad.toLocaleString()} jabas
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Ef: {item.eficiencia}/proc
                      </Badge>
                    </div>
                  </div>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((item.cantidad / Math.max(...data.packingTrend.map(d => d.cantidad))) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rendimiento por responsable */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Rendimiento por Responsable
            </CardTitle>
            <CardDescription>Procesos y promedio diario por persona</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rendimientoPorResponsable.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{item.responsable}</span>
                    <div className="text-xs text-muted-foreground">
                      {item.procesos} procesos
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.promedio_diario > 500 ? 'bg-green-500' :
                          item.promedio_diario > 200 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min((item.promedio_diario / Math.max(...data.rendimientoPorResponsable.map(r => r.promedio_diario))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.promedio_diario}/día
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packing por semana y calidad */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Packing por Semana
            </CardTitle>
            <CardDescription>Crecimiento semanal y tendencias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.packingPorSemana.slice(-4).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.semana}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.cantidad / Math.max(...data.packingPorSemana.map(s => s.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {item.cantidad.toLocaleString()}
                      </Badge>
                      <div className={`text-xs ${item.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.crecimiento > 0 ? '+' : ''}{item.crecimiento}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Calidad por Tipo
            </CardTitle>
            <CardDescription>Distribución de calidad por tipo de packing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.calidadPacking.map((item, index) => (
                <div key={index} className="space-y-2">
                  <span className="text-sm font-medium">{item.tipo}</span>
                  <div className="flex gap-1">
                    <div className="flex-1 bg-green-500 h-3 rounded" style={{ width: `${(item.excelente / (item.excelente + item.bueno + item.regular + item.malo)) * 100}%` }} />
                    <div className="flex-1 bg-blue-500 h-3 rounded" style={{ width: `${(item.bueno / (item.excelente + item.bueno + item.regular + item.malo)) * 100}%` }} />
                    <div className="flex-1 bg-yellow-500 h-3 rounded" style={{ width: `${(item.regular / (item.excelente + item.bueno + item.regular + item.malo)) * 100}%` }} />
                    <div className="flex-1 bg-red-500 h-3 rounded" style={{ width: `${(item.malo / (item.excelente + item.bueno + item.regular + item.malo)) * 100}%` }} />
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded" />
                      Exc: {item.excelente}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded" />
                      Bue: {item.bueno}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded" />
                      Reg: {item.regular}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded" />
                      Mal: {item.malo}
                    </span>
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
