"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Download, TrendingUp, BarChart3, PieChart, Calendar, Filter } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"

interface AnalyticsData {
  recepcionesTrend: { fecha: string; cantidad: number; calidad_promedio: number }[]
  eficienciaPorFundo: { fundo: string; recepciones: number; pallets: number; eficiencia: number }[]
  rendimientoPorDia: { dia: string; recepciones: number; cargas: number; pallets_procesados: number }[]
  calidadHistorica: { mes: string; excelente: number; bueno: number; regular: number; malo: number }[]
}

export function AcopioAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedFundo, setSelectedFundo] = useState<string>("all")
  const [fundos, setFundos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    fetchFundos()
    fetchAnalyticsData()
  }, [dateRange, selectedFundo])

  const fetchFundos = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("fundos").select("id, nombre").eq("activo", true)
    setFundos(data || [])
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

      // Tendencia de recepciones (últimos 30 días)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let recepcionesQuery = supabase
        .from("acopio_recepcion")
        .select("fecha_recepcion, cantidad_recibida, calidad")
        .gte("fecha_recepcion", thirtyDaysAgo.toISOString())
        .order("fecha_recepcion")

      if (selectedFundo !== "all") {
        recepcionesQuery = recepcionesQuery.eq("id_lote.fundo", selectedFundo)
      }

      const { data: recepcionesData } = await recepcionesQuery

      const recepcionesTrend = recepcionesData?.reduce((acc: any[], rec) => {
        const fecha = formatDatePeru(new Date(rec.fecha_recepcion))
        const existing = acc.find(item => item.fecha === fecha)
        if (existing) {
          existing.cantidad += rec.cantidad_recibida
          existing.total_calidad += rec.calidad === 'Excelente' ? 4 : rec.calidad === 'Bueno' ? 3 : rec.calidad === 'Regular' ? 2 : 1
          existing.calidad_count++
        } else {
          acc.push({
            fecha,
            cantidad: rec.cantidad_recibida,
            total_calidad: rec.calidad === 'Excelente' ? 4 : rec.calidad === 'Bueno' ? 3 : rec.calidad === 'Regular' ? 2 : 1,
            calidad_count: 1
          })
        }
        return acc
      }, []).map(item => ({
        ...item,
        calidad_promedio: item.calidad_count > 0 ? item.total_calidad / item.calidad_count : 0
      })) || []

      // Eficiencia por fundo
      const { data: fundosData } = await supabase
        .from("fundos")
        .select(`
          id,
          nombre,
          lotes (
            id,
            acopio_recepcion (
              id,
              cantidad_recibida
            ),
            acopio_pallets (
              id,
              estado
            )
          )
        `)
        .eq("activo", true)

      const eficienciaPorFundo = fundosData?.map((fundo: any) => {
        const recepciones = fundo.lotes?.flatMap((lote: any) => lote.acopio_recepcion || []) || []
        const pallets = fundo.lotes?.flatMap((lote: any) => lote.acopio_pallets || []) || []
        const palletsActivos = pallets.filter((p: any) => p.estado !== 'despachado').length
        const eficiencia = pallets.length > 0 ? Math.round((palletsActivos / pallets.length) * 100) : 0

        return {
          fundo: fundo.nombre,
          recepciones: recepciones.length,
          pallets: pallets.length,
          eficiencia
        }
      }).filter(item => item.recepciones > 0) || []

      // Rendimiento por día de la semana
      const { data: rendimientoData } = await supabase
        .from("acopio_recepcion")
        .select("fecha_recepcion")
        .gte("fecha_recepcion", thirtyDaysAgo.toISOString())

      const rendimientoPorDia = rendimientoData?.reduce((acc: any[], rec) => {
        const dia = new Date(rec.fecha_recepcion).toLocaleDateString('es-ES', { weekday: 'long' })
        const existing = acc.find(item => item.dia === dia)
        if (existing) {
          existing.recepciones++
        } else {
          acc.push({ dia, recepciones: 1, cargas: 0, pallets_procesados: 0 })
        }
        return acc
      }, []) || []

      // Calidad histórica por mes
      const { data: calidadData } = await supabase
        .from("acopio_recepcion")
        .select("fecha_recepcion, calidad")
        .gte("fecha_recepcion", thirtyDaysAgo.toISOString())

      const calidadHistorica = calidadData?.reduce((acc: any[], rec) => {
        const mes = new Date(rec.fecha_recepcion).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        const existing = acc.find(item => item.mes === mes)
        if (existing) {
          if (rec.calidad === 'Excelente') existing.excelente++
          else if (rec.calidad === 'Bueno') existing.bueno++
          else if (rec.calidad === 'Regular') existing.regular++
          else existing.malo++
        } else {
          acc.push({
            mes,
            excelente: rec.calidad === 'Excelente' ? 1 : 0,
            bueno: rec.calidad === 'Bueno' ? 1 : 0,
            regular: rec.calidad === 'Regular' ? 1 : 0,
            malo: rec.calidad === 'Malo' ? 1 : 0
          })
        }
        return acc
      }, []) || []

      setData({
        recepcionesTrend,
        eficienciaPorFundo,
        rendimientoPorDia,
        calidadHistorica
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    // Implementar exportación de datos analíticos
    const csvData = [
      ['Métrica', 'Valor', 'Fecha'],
      ...data!.recepcionesTrend.map(item => ['Recepciones', item.cantidad, item.fecha]),
      ...data!.eficienciaPorFundo.map(item => ['Eficiencia', item.eficiencia, item.fundo])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `acopio_analytics_${new Date().toISOString().split('T')[0]}.csv`
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
              <label className="text-sm font-medium">Fundo</label>
              <Select value={selectedFundo} onValueChange={setSelectedFundo}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos los fundos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los fundos</SelectItem>
                  {fundos.map(fundo => (
                    <SelectItem key={fundo.id} value={fundo.id}>
                      {fundo.nombre}
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
        {/* Tendencia de recepciones */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Recepciones
            </CardTitle>
            <CardDescription>Cantidad y calidad promedio por día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recepcionesTrend.slice(-10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border/50 rounded">
                  <div>
                    <span className="text-sm font-medium">{item.fecha}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.cantidad} recepciones
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Calidad: {item.calidad_promedio.toFixed(1)}/4
                      </Badge>
                    </div>
                  </div>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((item.cantidad / Math.max(...data.recepcionesTrend.map(d => d.cantidad))) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Eficiencia por fundo */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Eficiencia por Fundo
            </CardTitle>
            <CardDescription>Rendimiento de pallets por fundo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.eficienciaPorFundo.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{item.fundo}</span>
                    <div className="text-xs text-muted-foreground">
                      {item.recepciones} rec. / {item.pallets} pallets
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.eficiencia >= 80 ? 'bg-green-500' :
                          item.eficiencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.eficiencia}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.eficiencia}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por día y calidad histórica */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rendimiento por Día
            </CardTitle>
            <CardDescription>Actividad por día de la semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rendimientoPorDia.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.dia}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.recepciones / Math.max(...data.rendimientoPorDia.map(d => d.recepciones))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.recepciones}
                    </Badge>
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
              Calidad Histórica
            </CardTitle>
            <CardDescription>Distribución de calidad por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.calidadHistorica.slice(-3).map((item, index) => (
                <div key={index} className="space-y-2">
                  <span className="text-sm font-medium">{item.mes}</span>
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
