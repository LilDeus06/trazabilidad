"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Filter, Eye, Calendar, MapPin, Package, TrendingUp } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface AcopioData {
  recepciones: any[]
  pallets: any[]
  cargas: any[]
  loading: boolean
  searchTerm: string
  selectedFundo: string
  selectedEstado: string
  dateRange: DateRange | undefined
  currentView: 'recepciones' | 'pallets' | 'cargas'
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function AcopioDataTable() {
  const [data, setData] = useState<AcopioData>({
    recepciones: [],
    pallets: [],
    cargas: [],
    loading: true,
    searchTerm: "",
    selectedFundo: "all",
    selectedEstado: "all",
    dateRange: undefined,
    currentView: 'recepciones',
    sortBy: 'fecha_recepcion',
    sortOrder: 'desc'
  })

  const [fundos, setFundos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    fetchFundos()
    fetchData()
  }, [data.currentView, data.selectedFundo, data.selectedEstado, data.dateRange, data.sortBy, data.sortOrder])

  const fetchFundos = async () => {
    const supabase = createClient()
    const { data: fundosData } = await supabase
      .from("fundos")
      .select("id, nombre")
      .eq("activo", true)
    setFundos(fundosData || [])
  }

  const fetchData = async () => {
    const supabase = createClient()
    setData(prev => ({ ...prev, loading: true }))

    try {
      let query = supabase.from(data.currentView === 'recepciones' ? 'acopio_recepcion' :
                               data.currentView === 'pallets' ? 'acopio_pallets' : 'acopio_carga')
        .select(`
          *,
          ${data.currentView === 'recepciones' ? `
            lotes!inner (
              id,
              nombre,
              fundos!inner (
                nombre
              )
            ),
            profiles (
              nombre,
              apellido
            )
          ` : data.currentView === 'pallets' ? `
            lotes!inner (
              id,
              nombre,
              fundos!inner (
                nombre
              )
            )
          ` : `
            acopio_pallets (
              codigo_pallet,
              estado
            ),
            acopio_recepcion!inner (
              fecha_recepcion,
              lotes!inner (
                nombre,
                fundos!inner (
                  nombre
                )
              )
            ),
            profiles (
              nombre,
              apellido
            )
          `}
        `)

      // Filtros de fecha
      if (data.dateRange?.from && data.dateRange?.to) {
        const dateField = data.currentView === 'recepciones' ? 'fecha_recepcion' :
                         data.currentView === 'pallets' ? 'created_at' : 'fecha_carga'
        query = query
          .gte(dateField, data.dateRange.from.toISOString())
          .lte(dateField, data.dateRange.to.toISOString())
      }

      // Filtro por fundo
      if (data.selectedFundo !== "all") {
        if (data.currentView === 'recepciones') {
          query = query.eq('lotes.fundos.id', data.selectedFundo)
        } else if (data.currentView === 'pallets') {
          query = query.eq('lotes.fundos.id', data.selectedFundo)
        } else {
          // Para cargas, filtrar por fundo del pallet
          query = query.eq('acopio_pallets.fundo', data.selectedFundo)
        }
      }

      // Filtro por estado (solo para pallets)
      if (data.currentView === 'pallets' && data.selectedEstado !== "all") {
        query = query.eq('estado', data.selectedEstado)
      }

      // Ordenamiento
      const sortField = data.sortBy === 'fecha' ?
        (data.currentView === 'recepciones' ? 'fecha_recepcion' :
         data.currentView === 'pallets' ? 'created_at' : 'fecha_carga') :
        data.sortBy === 'cantidad' ?
        (data.currentView === 'recepciones' ? 'cantidad_recibida' :
         data.currentView === 'pallets' ? 'capacidad' : 'cantidad') :
        data.sortBy

      query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

      const { data: result, error } = await query

      if (error) throw error

      // Filtrar por término de búsqueda
      let filteredData = result || []
      if (data.searchTerm) {
        filteredData = filteredData.filter(item => {
          const searchLower = data.searchTerm.toLowerCase()
          // Filtro por fundo
          if (data.selectedFundo !== "all") {
            if (data.currentView === 'recepciones') {
              query = query.eq('lotes.fundos.id', data.selectedFundo)
            } else if (data.currentView === 'pallets') {
              query = query.eq('lotes.fundos.id', data.selectedFundo)
            } else {
              // Para cargas, filtrar por fundo del pallet a través de la recepción
              query = query.eq('acopio_recepcion.lotes.fundos.id', data.selectedFundo)
            }
          }

        })
      }

      setData(prev => ({
        ...prev,
        [data.currentView === 'recepciones' ? 'recepciones' :
         data.currentView === 'pallets' ? 'pallets' : 'cargas']: filteredData,
        loading: false
      }))

    } catch (error) {
      console.error("Error fetching data:", error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const exportData = () => {
    const currentData = data.currentView === 'recepciones' ? data.recepciones :
                       data.currentView === 'pallets' ? data.pallets : data.cargas

    const csvData = [
      // Headers
      data.currentView === 'recepciones' ?
        ['Fecha', 'Procedencia', 'Cantidad', 'Calidad', 'Fundo', 'Responsable'] :
      data.currentView === 'pallets' ?
        ['Código', 'Capacidad', 'Estado', 'Fundo', 'Lote', 'Fecha Creación'] :
        ['Fecha Carga', 'Pallet', 'Recepción', 'Cantidad', 'Fundo', 'Responsable'],
      // Data
      ...currentData.map(item => {
        if (data.currentView === 'recepciones') {
          return [
            formatDatePeru(new Date(item.fecha_recepcion)),
            item.procedencia,
            item.cantidad_recibida,
            item.calidad,
            item.lotes?.fundos?.nombre,
            `${item.profiles?.nombre} ${item.profiles?.apellido}`
          ]
        } else if (data.currentView === 'pallets') {
          return [
            item.codigo_pallet,
            item.capacidad,
            item.estado,
            item.lotes?.fundos?.nombre,
            item.lotes?.nombre,
            formatDatePeru(new Date(item.created_at))
          ]
        } else {
          return [
            formatDatePeru(new Date(item.fecha_carga)),
            item.acopio_pallets?.codigo_pallet,
            formatDatePeru(new Date(item.acopio_recepcion?.fecha_recepcion)),
            item.cantidad,
            item.acopio_recepcion?.lotes?.fundos?.nombre,
            `${item.profiles?.nombre} ${item.profiles?.apellido}`
          ]
        }
      })
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `acopio_${data.currentView}_${new Date().toISOString().split('T')[0]}.csv`
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

  const currentData = data.currentView === 'recepciones' ? data.recepciones :
                     data.currentView === 'pallets' ? data.pallets : data.cargas

  return (
    <div className="space-y-6">
      {/* Filtros y Controles */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Vista */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista de Datos</label>
              <Select value={data.currentView} onValueChange={(value: any) => setData(prev => ({ ...prev, currentView: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recepciones">📦 Recepciones</SelectItem>
                  <SelectItem value="pallets">📊 Pallets</SelectItem>
                  <SelectItem value="cargas">🚛 Cargas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fundo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fundo</label>
              <Select value={data.selectedFundo} onValueChange={(value) => setData(prev => ({ ...prev, selectedFundo: value }))}>
                <SelectTrigger>
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

            {/* Estado (solo para pallets) */}
            {data.currentView === 'pallets' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={data.selectedEstado} onValueChange={(value) => setData(prev => ({ ...prev, selectedEstado: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="vacio">Vacío</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="lleno">Lleno</SelectItem>
                    <SelectItem value="despachado">Despachado</SelectItem>
                    <SelectItem value="acopio">Acopio</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
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
                  placeholder={`Buscar en ${data.currentView}...`}
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

      {/* Tabla de Datos */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {data.currentView === 'recepciones' && <Package className="h-5 w-5" />}
              {data.currentView === 'pallets' && <MapPin className="h-5 w-5" />}
              {data.currentView === 'cargas' && <TrendingUp className="h-5 w-5" />}
              Datos de {data.currentView === 'recepciones' ? 'Recepciones' :
                       data.currentView === 'pallets' ? 'Pallets' : 'Cargas'}
            </span>
            <Badge variant="secondary">
              {currentData.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>
            {data.currentView === 'recepciones' && 'Historial completo de recepciones con detalles de calidad y procedencia'}
            {data.currentView === 'pallets' && 'Estado actual de todos los pallets con información de ubicación y capacidad'}
            {data.currentView === 'cargas' && 'Registro de todas las operaciones de carga realizadas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.currentView === 'recepciones' ? (
                      <>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                          <div className="flex items-center gap-2">
                            Fecha {data.sortBy === 'fecha' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Procedencia</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                          <div className="flex items-center gap-2">
                            Cantidad {data.sortBy === 'cantidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Calidad</TableHead>
                        <TableHead>Fundo</TableHead>
                        <TableHead>Responsable</TableHead>
                      </>
                    ) : data.currentView === 'pallets' ? (
                      <>
                        <TableHead>Código</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                          <div className="flex items-center gap-2">
                            Capacidad {data.sortBy === 'cantidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fundo</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                          <div className="flex items-center gap-2">
                            Creado {data.sortBy === 'fecha' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                          <div className="flex items-center gap-2">
                            Fecha Carga {data.sortBy === 'fecha' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Pallet</TableHead>
                        <TableHead>Recepción</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                          <div className="flex items-center gap-2">
                            Cantidad {data.sortBy === 'cantidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Fundo</TableHead>
                        <TableHead>Responsable</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.slice(0, 50).map((item, index) => (
                    <TableRow key={item.id || index}>
                      {data.currentView === 'recepciones' ? (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDatePeru(new Date(item.fecha_recepcion))}
                            </div>
                          </TableCell>
                          <TableCell>{item.procedencia}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.cantidad_recibida.toLocaleString()} jabas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              item.calidad === 'Excelente' ? 'default' :
                              item.calidad === 'Bueno' ? 'secondary' :
                              item.calidad === 'Regular' ? 'outline' : 'destructive'
                            }>
                              {item.calidad || 'Sin calificar'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.lotes?.fundos?.nombre}</TableCell>
                          <TableCell>
                            {item.profiles?.nombre} {item.profiles?.apellido}
                          </TableCell>
                        </>
                      ) : data.currentView === 'pallets' ? (
                        <>
                          <TableCell className="font-mono">{item.codigo_pallet}</TableCell>
                          <TableCell>{item.capacidad} jabas</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.estado === 'vacio' ? 'secondary' :
                              item.estado === 'parcial' ? 'outline' :
                              item.estado === 'lleno' ? 'default' :
                              item.estado === 'despachado' ? 'destructive' : 'secondary'
                            }>
                              {item.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.lotes?.fundos?.nombre}</TableCell>
                          <TableCell>{item.lotes?.nombre}</TableCell>
                          <TableCell>{formatDatePeru(new Date(item.created_at))}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDatePeru(new Date(item.fecha_carga))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {item.acopio_pallets?.codigo_pallet}
                          </TableCell>
                          <TableCell>
                            {formatDatePeru(new Date(item.acopio_recepcion?.fecha_recepcion))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.cantidad} jabas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.acopio_recepcion?.lotes?.fundos?.nombre}
                          </TableCell>
                          <TableCell>
                            {item.profiles?.nombre} {item.profiles?.apellido}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {currentData.length === 0 && !data.loading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay datos disponibles</h3>
              <p className="text-muted-foreground">
                No se encontraron registros para los filtros aplicados.
              </p>
            </div>
          )}

          {currentData.length > 50 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Mostrando los primeros 50 registros de {currentData.length} totales.
                Use los filtros para refinar los resultados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
