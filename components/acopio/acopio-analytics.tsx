"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Download, TrendingUp, BarChart3, Package, MapPin, Activity, Clock, Boxes } from "lucide-react"
import { formatDatePeru } from "@/lib/utils/date"
import * as XLSX from 'xlsx'

interface AnalyticsData {
  // KPIs principales
  totalPallets: number
  capacidadTotal: number
  palletsActivos: number
  palletsDespachados: number
  
  // Tendencias
  palletsPorDia: { fecha: string; cantidad: number; capacidad: number }[]
  estadosDistribucion: { estado: string; cantidad: number; porcentaje: number }[]
  
  // Por fundo
  rendimientoPorFundo: { 
    fundo: string
    total_pallets: number
    capacidad_total: number
    pallets_llenos: number
    pallets_vacios: number
    eficiencia: number
  }[]
  
  // Por lote
  rendimientoPorLote: {
    lote: string
    fundo: string
    tipo_cultivo?: string
    variedad?: string
    total_pallets: number
    capacidad_promedio: number
  }[]
  
  // Actividad por hora
  actividadPorHora: { hora: string; cantidad: number }[]
}

export function AcopioAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedFundo, setSelectedFundo] = useState<string>("all")
  const [fundos, setFundos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    fetchFundos()
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, selectedFundo])

  const fetchFundos = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("fundos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
    setFundos(data || [])
  }

  const fetchAnalyticsData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Query base para pallets
      let palletsQuery = supabase
        .from("acopio_pallets")
        .select(`
          *,
          lotes:id_lote (
            nombre,
            tipo_cultivo,
            variedad,
            fundos:id_fundo (
              id,
              nombre
            )
          ),
          fundos:fundo (
            id,
            nombre
          )
        `)

      // Filtros de fecha
      if (dateRange?.from && dateRange?.to) {
        palletsQuery = palletsQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
      }

      const { data: palletsData, error } = await palletsQuery

      if (error) throw error

      // Filtrar por fundo seleccionado
      let filteredPallets = palletsData || []
      if (selectedFundo !== "all") {
        filteredPallets = filteredPallets.filter(p => 
          p.lotes?.fundos?.id === selectedFundo || p.fundos?.id === selectedFundo
        )
      }

      // KPIs principales
      const totalPallets = filteredPallets.length
      const capacidadTotal = filteredPallets.reduce((sum, p) => sum + (p.capacidad || 0), 0)
      const palletsActivos = filteredPallets.filter(p => 
        p.estado !== 'despachado'
      ).length
      const palletsDespachados = filteredPallets.filter(p => 
        p.estado === 'despachado'
      ).length

      // Pallets por día
      const palletsPorDiaMap = new Map<string, { cantidad: number; capacidad: number }>()
      filteredPallets.forEach(p => {
        const fecha = p.fecha || formatDatePeru(new Date(p.created_at))
        const existing = palletsPorDiaMap.get(fecha)
        if (existing) {
          existing.cantidad++
          existing.capacidad += p.capacidad || 0
        } else {
          palletsPorDiaMap.set(fecha, { cantidad: 1, capacidad: p.capacidad || 0 })
        }
      })
      const palletsPorDia = Array.from(palletsPorDiaMap.entries())
        .map(([fecha, data]) => ({ fecha, ...data }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-30)

      // Distribución de estados
      const estadosMap = new Map<string, number>()
      filteredPallets.forEach(p => {
        const estado = p.estado || 'sin_estado'
        estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)
      })
      const estadosDistribucion = Array.from(estadosMap.entries())
        .map(([estado, cantidad]) => ({
          estado,
          cantidad,
          porcentaje: totalPallets > 0 ? Math.round((cantidad / totalPallets) * 100) : 0
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      // Rendimiento por fundo
      const fundosMap = new Map<string, any>()
      filteredPallets.forEach(p => {
        const fundoNombre = p.fundo_nombre || p.fundos?.nombre || p.lotes?.fundos?.nombre || 'Sin fundo'
        const existing = fundosMap.get(fundoNombre)
        if (existing) {
          existing.total_pallets++
          existing.capacidad_total += p.capacidad || 0
          if (p.estado === 'lleno') existing.pallets_llenos++
          if (p.estado === 'vacio') existing.pallets_vacios++
        } else {
          fundosMap.set(fundoNombre, {
            fundo: fundoNombre,
            total_pallets: 1,
            capacidad_total: p.capacidad || 0,
            pallets_llenos: p.estado === 'lleno' ? 1 : 0,
            pallets_vacios: p.estado === 'vacio' ? 1 : 0,
            eficiencia: 0
          })
        }
      })
      const rendimientoPorFundo = Array.from(fundosMap.values())
        .map(f => ({
          ...f,
          eficiencia: f.total_pallets > 0 
            ? Math.round((f.pallets_llenos / f.total_pallets) * 100) 
            : 0
        }))
        .sort((a, b) => b.total_pallets - a.total_pallets)
        .slice(0, 10)

      // Rendimiento por lote
      const lotesMap = new Map<string, any>()
      filteredPallets.forEach(p => {
        const loteNombre = p.lote_nombre || p.lotes?.nombre || 'Sin lote'
        const existing = lotesMap.get(loteNombre)
        if (existing) {
          existing.total_pallets++
          existing.capacidad_sum += p.capacidad || 0
        } else {
          lotesMap.set(loteNombre, {
            lote: loteNombre,
            fundo: p.fundo_nombre || p.fundos?.nombre || p.lotes?.fundos?.nombre || '-',
            tipo_cultivo: p.lotes?.tipo_cultivo,
            variedad: p.lotes?.variedad,
            total_pallets: 1,
            capacidad_sum: p.capacidad || 0,
            capacidad_promedio: 0
          })
        }
      })
      const rendimientoPorLote = Array.from(lotesMap.values())
        .map(l => ({
          ...l,
          capacidad_promedio: l.total_pallets > 0 
            ? Math.round(l.capacidad_sum / l.total_pallets) 
            : 0
        }))
        .sort((a, b) => b.total_pallets - a.total_pallets)
        .slice(0, 10)

      // Actividad por hora
      const horasMap = new Map<string, number>()
      filteredPallets.forEach(p => {
        if (p.hora) {
          const hora = p.hora.split(':')[0] + ':00'
          horasMap.set(hora, (horasMap.get(hora) || 0) + 1)
        }
      })
      const actividadPorHora = Array.from(horasMap.entries())
        .map(([hora, cantidad]) => ({ hora, cantidad }))
        .sort((a, b) => a.hora.localeCompare(b.hora))

      setData({
        totalPallets,
        capacidadTotal,
        palletsActivos,
        palletsDespachados,
        palletsPorDia,
        estadosDistribucion,
        rendimientoPorFundo,
        rendimientoPorLote,
        actividadPorHora
      })

    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  // Primero instala la librería: npm install xlsx



const exportAnalytics = () => {
  if (!data) return

  // Crear un nuevo workbook
  const wb = XLSX.utils.book_new()

  // Hoja 1: RESUMEN GENERAL
  const resumenData = [
    ['RESUMEN GENERAL DE ACOPIO'],
    [''],
    ['Métrica', 'Valor'],
    ['Total Pallets', data.totalPallets],
    ['Capacidad Total (jabas)', data.capacidadTotal],
    ['Pallets Activos', data.palletsActivos],
    ['Pallets Despachados', data.palletsDespachados],
    ['% Pallets Activos', `${data.totalPallets > 0 ? Math.round((data.palletsActivos / data.totalPallets) * 100) : 0}%`],
    ['% Pallets Despachados', `${data.totalPallets > 0 ? Math.round((data.palletsDespachados / data.totalPallets) * 100) : 0}%`]
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // Hoja 2: DISTRIBUCIÓN DE ESTADOS
  const estadosData = [
    ['DISTRIBUCIÓN DE ESTADOS'],
    [''],
    ['Estado', 'Cantidad', 'Porcentaje'],
    ...data.estadosDistribucion.map(e => [
      e.estado,
      e.cantidad,
      `${e.porcentaje}%`
    ])
  ]
  const wsEstados = XLSX.utils.aoa_to_sheet(estadosData)
  XLSX.utils.book_append_sheet(wb, wsEstados, 'Estados')

  // Hoja 3: RENDIMIENTO POR FUNDO
  const fundosData = [
    ['RENDIMIENTO POR FUNDO'],
    [''],
    ['Fundo', 'Total Pallets', 'Capacidad Total', 'Pallets Llenos', 'Pallets Vacíos', 'Eficiencia (%)'],
    ...data.rendimientoPorFundo.map(f => [
      f.fundo,
      f.total_pallets,
      f.capacidad_total,
      f.pallets_llenos,
      f.pallets_vacios,
      f.eficiencia
    ])
  ]
  const wsFundos = XLSX.utils.aoa_to_sheet(fundosData)
  XLSX.utils.book_append_sheet(wb, wsFundos, 'Por Fundo')

  // Hoja 4: RENDIMIENTO POR LOTE
  const lotesData = [
    ['RENDIMIENTO POR LOTE'],
    [''],
    ['Lote', 'Fundo', 'Tipo Cultivo', 'Variedad', 'Total Pallets', 'Capacidad Promedio'],
    ...data.rendimientoPorLote.map(l => [
      l.lote,
      l.fundo,
      l.tipo_cultivo || '-',
      l.variedad || '-',
      l.total_pallets,
      l.capacidad_promedio
    ])
  ]
  const wsLotes = XLSX.utils.aoa_to_sheet(lotesData)
  XLSX.utils.book_append_sheet(wb, wsLotes, 'Por Lote')

  // Hoja 5: PALLETS POR DÍA
  const diasData = [
    ['PALLETS POR DÍA'],
    [''],
    ['Fecha', 'Cantidad Pallets', 'Capacidad Total'],
    ...data.palletsPorDia.map(d => [
      d.fecha,
      d.cantidad,
      d.capacidad
    ])
  ]
  const wsDias = XLSX.utils.aoa_to_sheet(diasData)
  XLSX.utils.book_append_sheet(wb, wsDias, 'Por Día')

  // Hoja 6: ACTIVIDAD POR HORA (si existe)
  if (data.actividadPorHora.length > 0) {
    const horasData = [
      ['ACTIVIDAD POR HORA'],
      [''],
      ['Hora', 'Cantidad'],
      ...data.actividadPorHora.map(h => [
        h.hora,
        h.cantidad
      ])
    ]
    const wsHoras = XLSX.utils.aoa_to_sheet(horasData)
    XLSX.utils.book_append_sheet(wb, wsHoras, 'Por Hora')
  }

  // Generar el archivo Excel
  const fileName = `acopio_analytics_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'vacio': 'bg-gray-500',
      'parcial': 'bg-yellow-500',
      'lleno': 'bg-green-500',
      'despachado': 'bg-blue-500',
      'acopio': 'bg-purple-500',
      'packing': 'bg-orange-500'
    }
    return colors[estado] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
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
            <Activity className="h-5 w-5" />
            Análisis de Pallets de Acopio
          </CardTitle>
          <CardDescription>
            Métricas y estadísticas en tiempo real de la gestión de pallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
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
              Exportar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Total Pallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalPallets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pallets registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              Capacidad Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.capacidadTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jabas de capacidad
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Pallets Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.palletsActivos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalPallets > 0 ? Math.round((data.palletsActivos / data.totalPallets) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Despachados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.palletsDespachados.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalPallets > 0 ? Math.round((data.palletsDespachados / data.totalPallets) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tendencia por día */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pallets por Día
            </CardTitle>
            <CardDescription>Últimos 30 días de actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.palletsPorDia.slice(-15).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border/50 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.fecha}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.cantidad} pallets
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.capacidad.toLocaleString()} jabas
                      </Badge>
                    </div>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((item.cantidad / Math.max(...data.palletsPorDia.map(d => d.cantidad))) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución de estados */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución de Estados
            </CardTitle>
            <CardDescription>Estado actual de los pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.estadosDistribucion.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.estado}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.cantidad}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.porcentaje}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`${getEstadoColor(item.estado)} h-3 rounded-full transition-all`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por fundo y lote */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Rendimiento por Fundo
            </CardTitle>
            <CardDescription>Top 10 fundos por cantidad de pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.rendimientoPorFundo.map((item, index) => (
                <div key={index} className="p-3 border border-border/50 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{item.fundo}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.total_pallets} pallets • {item.capacidad_total.toLocaleString()} jabas
                      </div>
                    </div>
                    <Badge variant={item.eficiencia >= 70 ? 'default' : item.eficiencia >= 40 ? 'secondary' : 'destructive'}>
                      {item.eficiencia}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Llenos: {item.pallets_llenos}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>Vacíos: {item.pallets_vacios}</span>
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
              <Package className="h-5 w-5" />
              Rendimiento por Lote
            </CardTitle>
            <CardDescription>Top 10 lotes por cantidad de pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.rendimientoPorLote.map((item, index) => (
                <div key={index} className="p-3 border border-border/50 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.lote}</div>
                      <div className="text-xs text-muted-foreground">{item.fundo}</div>
                    </div>
                    <Badge variant="outline">
                      {item.total_pallets} pallets
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {item.tipo_cultivo && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Cultivo:</span>
                        <span>{item.tipo_cultivo}</span>
                      </div>
                    )}
                    {item.variedad && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Variedad:</span>
                        <span>{item.variedad}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Capacidad promedio:</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.capacidad_promedio} jabas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad por hora */}
      {data.actividadPorHora.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad por Hora
            </CardTitle>
            <CardDescription>Distribución de registros por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {data.actividadPorHora.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{item.hora}</div>
                  <div className="h-20 bg-muted rounded relative flex items-end justify-center">
                    <div
                      className="bg-primary rounded-t w-full transition-all"
                      style={{
                        height: `${Math.min((item.cantidad / Math.max(...data.actividadPorHora.map(d => d.cantidad))) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-xs font-medium mt-1">{item.cantidad}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}