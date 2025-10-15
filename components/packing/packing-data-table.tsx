"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Search, Filter, Calendar, Package, MapPin, Truck, CheckCircle2 } from "lucide-react"
import { formatDatePeru } from "@/lib/utils/date"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import * as XLSX from 'xlsx'


interface PackingItem {
  id: string
  fecha_packing: string
  codigo_pallet: string
  cantidad_procesada: number
  variedad?: string
  lote?: string
  fundo?: string
  nombre_chofer?: string
  turno_guia?: string
  packing_guia?: string
  fecha_guia?: string
  hora_guia?: string
  nombre_lote?: string
  nombre_fundo?: string
  viaje_guia?: number
  jabas_enviadas_total?: number
  usuario?: string
  zona_actual?: string
  guias?: {
    packing: string
    viaje: number
    turno: string
  }
  acopio_pallets?: {
    codigo_pallet: string
    capacidad: number
  }
}

interface PackingData {
  packingEnvios: PackingItem[]
  packingTracking: PackingItem[]
  loading: boolean
  searchTerm: string
  selectedTipo: string
  selectedZona: string
  dateRange: DateRange | undefined
  currentView: 'envios' | 'tracking'
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const ZONAS = [
  { value: 'acopio', label: 'Acopio', color: 'bg-blue-500', icon: '📦' },
  { value: 'garita', label: 'Garita', color: 'bg-yellow-500', icon: '🚧' },
  { value: 'packing', label: 'Packing', color: 'bg-orange-500', icon: '📋' },
  { value: 'inicio', label: 'Inicio', color: 'bg-green-500', icon: '🚀' },
  { value: 'descarga', label: 'Descarga', color: 'bg-purple-500', icon: '📥' },
  { value: 'final', label: 'Final', color: 'bg-emerald-600', icon: '✅' },
]

export function PackingDataTable() {
  const [data, setData] = useState<PackingData>({
    packingEnvios: [],
    packingTracking: [],
    loading: true,
    searchTerm: "",
    selectedTipo: "all",
    selectedZona: "all",
    dateRange: undefined,
    currentView: 'envios',
    sortBy: 'fecha_packing',
    sortOrder: 'desc'
  })

  const [tipos, setTipos] = useState<string[]>([])

  useEffect(() => {
    fetchTipos()
  }, [])

  useEffect(() => {
    fetchData()
  }, [data.currentView, data.selectedTipo, data.selectedZona, data.dateRange, data.sortBy, data.sortOrder])

  const fetchTipos = async () => {
    const supabase = createClient()
    const { data: tiposData } = await supabase
      .from("guias")
      .select("packing")
      .not("packing", "is", null)

    const uniqueTipos = [...new Set(tiposData?.map(item => item.packing).filter(Boolean) || [])]
    setTipos(uniqueTipos)
  }

  const fetchData = async () => {
    const supabase = createClient()
    setData(prev => ({ ...prev, loading: true }))

    try {
      const tableName = data.currentView === 'envios' ? 'packing' : 'packing_final'
      
      let query = supabase
        .from(tableName)
        .select(`
          *,
          guias:guia_id (
            packing,
            viaje,
            turno
          ),
          acopio_pallets:id_pallet (
            codigo_pallet,
            capacidad
          )
        `)

      // Filtros de fecha
      if (data.dateRange?.from && data.dateRange?.to) {
        query = query
          .gte("fecha_packing", data.dateRange.from.toISOString())
          .lte("fecha_packing", data.dateRange.to.toISOString())
      }

      // Filtro por zona (solo para tracking)
      if (data.currentView === 'tracking' && data.selectedZona !== "all") {
        query = query.eq("zona_actual", data.selectedZona)
      }

      // Ordenamiento
      const sortField = data.sortBy === 'fecha' ? 'fecha_packing' :
                       data.sortBy === 'cantidad' ? 'cantidad_procesada' :
                       data.sortBy

      query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

      const { data: result, error } = await query

      if (error) throw error

      // Filtrar por tipo y búsqueda
      let filteredData = (result || []) as PackingItem[]

      if (data.selectedTipo !== "all") {
        filteredData = filteredData.filter(item => 
          item.guias?.packing === data.selectedTipo || item.packing_guia === data.selectedTipo
        )
      }

      if (data.searchTerm) {
        const searchLower = data.searchTerm.toLowerCase()
        filteredData = filteredData.filter(item =>
          item.codigo_pallet?.toLowerCase().includes(searchLower) ||
          item.acopio_pallets?.codigo_pallet?.toLowerCase().includes(searchLower) ||
          item.nombre_chofer?.toLowerCase().includes(searchLower) ||
          item.nombre_fundo?.toLowerCase().includes(searchLower) ||
          item.nombre_lote?.toLowerCase().includes(searchLower) ||
          item.variedad?.toLowerCase().includes(searchLower) ||
          item.usuario?.toLowerCase().includes(searchLower)
        )
      }

      if (data.currentView === 'envios') {
        setData(prev => ({ ...prev, packingEnvios: filteredData, loading: false }))
      } else {
        setData(prev => ({ ...prev, packingTracking: filteredData, loading: false }))
      }

    } catch (error) {
      console.error("Error fetching packing data:", error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const exportData = () => {
    const currentData = data.currentView === 'envios' ? data.packingEnvios : data.packingTracking
    
    const headers = data.currentView === 'envios' 
      ? ['Fecha', 'Pallet', 'Tipo', 'Cantidad', 'Viaje', 'Turno', 'Chofer', 'Fundo', 'Lote', 'Variedad', 'Usuario']
      : ['Fecha', 'Pallet', 'Tipo', 'Cantidad', 'Zona Actual', 'Viaje', 'Turno', 'Chofer', 'Fundo', 'Lote', 'Usuario']

    const csvData = [
      headers,
      ...currentData.map(item => 
        data.currentView === 'envios' ? [
          formatDatePeru(new Date(item.fecha_packing)),
          item.codigo_pallet || item.acopio_pallets?.codigo_pallet || '',
          item.packing_guia || item.guias?.packing || '',
          item.cantidad_procesada || 0,
          item.viaje_guia || item.guias?.viaje || '',
          item.turno_guia || item.guias?.turno || '',
          item.nombre_chofer || '',
          item.nombre_fundo || '',
          item.nombre_lote || '',
          item.variedad || '',
          item.usuario || ''
        ] : [
          formatDatePeru(new Date(item.fecha_packing)),
          item.codigo_pallet || item.acopio_pallets?.codigo_pallet || '',
          item.packing_guia || item.guias?.packing || '',
          item.cantidad_procesada || 0,
          item.zona_actual || '',
          item.viaje_guia || item.guias?.viaje || '',
          item.turno_guia || item.guias?.turno || '',
          item.nombre_chofer || '',
          item.nombre_fundo || '',
          item.nombre_lote || '',
          item.usuario || ''
        ]
      )
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `packing_${data.currentView}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSort = (field: string) => {
    setData(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getZonaInfo = (zona?: string) => {
    return ZONAS.find(z => z.value === zona?.toLowerCase()) || ZONAS[0]
  }

  const getTipoBadgeVariant = (tipo?: string) => {
    if (tipo?.includes('LA GRANJA')) return 'default'
    if (tipo?.includes('SAFCO')) return 'secondary'
    return 'outline'
  }

  const currentData = data.currentView === 'envios' ? data.packingEnvios : data.packingTracking

  return (
    <div className="space-y-6">
      {/* Tabs para cambiar de vista */}
      <Tabs value={data.currentView} onValueChange={(value: any) => setData(prev => ({ ...prev, currentView: value }))}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="envios" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Envíos
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Tracking
          </TabsTrigger>
        </TabsList>

        {/* Filtros y Controles */}
        <Card className="border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Tipo de Packing */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Packing</label>
                <Select value={data.selectedTipo} onValueChange={(value) => setData(prev => ({ ...prev, selectedTipo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {tipos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zona (solo para tracking) */}
              {data.currentView === 'tracking' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zona Actual</label>
                  <Select value={data.selectedZona} onValueChange={(value) => setData(prev => ({ ...prev, selectedZona: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las zonas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las zonas</SelectItem>
                      {ZONAS.map(zona => (
                        <SelectItem key={zona.value} value={zona.value}>
                          <span className="flex items-center gap-2">
                            {zona.icon} {zona.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rango de Fechas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Fechas</label>
                <DateRangePicker
                  date={data.dateRange}
                  onDateChange={(dateRange) => setData(prev => ({ ...prev, dateRange }))}
                  placeholder="Seleccionar período"
                />
              </div>
            </div>

            {/* Búsqueda y Exportar */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por pallet, chofer, fundo, lote..."
                    value={data.searchTerm}
                    onChange={(e) => setData(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={exportData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Envíos */}
        <TabsContent value="envios" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Envíos de Packing
                </span>
                <Badge variant="secondary">
                  {data.packingEnvios.length} registros
                </Badge>
              </CardTitle>
              <CardDescription>
                Historial completo de envíos realizados con detalles de pallets y viajes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('fecha_packing')}>
                          Fecha {data.sortBy === 'fecha_packing' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Pallet</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad_procesada')}>
                          Cantidad {data.sortBy === 'cantidad_procesada' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Viaje</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Chofer</TableHead>
                        <TableHead>Fundo</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Variedad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.packingEnvios.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDatePeru(new Date(item.fecha_packing))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {item.codigo_pallet || item.acopio_pallets?.codigo_pallet}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTipoBadgeVariant(item.packing_guia || item.guias?.packing)}>
                              {item.packing_guia || item.guias?.packing || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.cantidad_procesada?.toLocaleString() || 0} jabas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              #{item.viaje_guia || item.guias?.viaje || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.turno_guia === 'Diurno' || item.guias?.turno === 'Diurno' ? 'default' : 'secondary'}>
                              {item.turno_guia || item.guias?.turno || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.nombre_chofer || '-'}</TableCell>
                          <TableCell>{item.nombre_fundo || '-'}</TableCell>
                          <TableCell>{item.nombre_lote || '-'}</TableCell>
                          <TableCell>{item.variedad || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {data.packingEnvios.length === 0 && !data.loading && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No hay envíos disponibles</h3>
                  <p className="text-muted-foreground">
                    No se encontraron envíos para los filtros aplicados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabla de Tracking */}
        <TabsContent value="tracking" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Tracking de Envíos
                </span>
                <Badge variant="secondary">
                  {data.packingTracking.length} registros
                </Badge>
              </CardTitle>
              <CardDescription>
                Seguimiento en tiempo real de la ubicación de los envíos por zonas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('fecha_packing')}>
                          Fecha {data.sortBy === 'fecha_packing' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Pallet</TableHead>
                        <TableHead>Zona Actual</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Viaje</TableHead>
                        <TableHead>Chofer</TableHead>
                        <TableHead>Fundo / Lote</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.packingTracking.map((item) => {
                        const zonaInfo = getZonaInfo(item.zona_actual)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDatePeru(new Date(item.fecha_packing))}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              {item.codigo_pallet || item.acopio_pallets?.codigo_pallet}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${zonaInfo.color} text-white border-0`}>
                                <span className="flex items-center gap-1">
                                  {zonaInfo.icon} {zonaInfo.label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTipoBadgeVariant(item.packing_guia || item.guias?.packing)}>
                                {item.packing_guia || item.guias?.packing || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.cantidad_procesada?.toLocaleString() || 0} jabas
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                #{item.viaje_guia || item.guias?.viaje || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.nombre_chofer || '-'}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{item.nombre_fundo || '-'}</div>
                                <div className="text-xs text-muted-foreground">{item.nombre_lote || '-'}</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {data.packingTracking.length === 0 && !data.loading && (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No hay envíos en tracking</h3>
                  <p className="text-muted-foreground">
                    No se encontraron envíos para los filtros aplicados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}