"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Filter, Eye, Calendar, MapPin, Package, TrendingUp, Clock } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface PackingData {
  packing: any[]
  loading: boolean
  searchTerm: string
  selectedDestino: string
  selectedTipo: string
  dateRange: DateRange | undefined
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function PackingDataTable() {
  const [data, setData] = useState<PackingData>({
    packing: [],
    loading: true,
    searchTerm: "",
    selectedDestino: "all",
    selectedTipo: "all",
    dateRange: undefined,
    sortBy: 'fecha_packing',
    sortOrder: 'desc'
  })

  const [destinos, setDestinos] = useState<string[]>([])
  const [tipos, setTipos] = useState<string[]>([])

  useEffect(() => {
    fetchFilters()
    fetchData()
  }, [data.selectedDestino, data.selectedTipo, data.dateRange, data.sortBy, data.sortOrder])

  const fetchFilters = async () => {
    const supabase = createClient()

    // Obtener destinos únicos
    const { data: destinosData } = await supabase
      .from("packing")
      .select("destino")
      .not("destino", "is", null)

    const uniqueDestinos = [...new Set(destinosData?.map(item => item.destino) || [])]
    setDestinos(uniqueDestinos)

    // Obtener tipos únicos desde guías
    const { data: tiposData } = await supabase
      .from("packing")
      .select(`
        guias (
          packing
        )
      `)
      .not("guias.packing", "is", null)

    const uniqueTipos = [...new Set(tiposData?.map((item: any) => item.guias?.packing).filter(Boolean) || [])]
    setTipos(uniqueTipos)

  }

  const fetchData = async () => {
    const supabase = createClient()
    setData(prev => ({ ...prev, loading: true }))

    try {
      let query = supabase
        .from("packing")
        .select(`
          *,
          guias (
            packing,
            viaje
          ),
          acopio_pallets (
            codigo_pallet,
            estado,
            capacidad
          ),
          profiles (
            nombre,
            apellido
          )
            
        `)

      // Filtros de fecha
      if (data.dateRange?.from && data.dateRange?.to) {
        query = query
          .gte("fecha_packing", data.dateRange.from.toISOString())
          .lte("fecha_packing", data.dateRange.to.toISOString())
      }

      // Filtro por destino
      if (data.selectedDestino !== "all") {
        query = query.eq("destino", data.selectedDestino)
      }

      // Filtro por tipo
      if (data.selectedTipo !== "all") {
        query = query.eq('guias.packing', data.selectedTipo)
      }

      // Ordenamiento
      const sortField = data.sortBy === 'fecha' ? 'fecha_packing' :
                       data.sortBy === 'cantidad' ? 'cantidad_procesada' :
                       data.sortBy

      query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

      const { data: result, error } = await query

      
      if (error) throw error

      // Filtrar por término de búsqueda
      let filteredData = result || []
      if (data.searchTerm) {
        filteredData = filteredData.filter(item => {
          const searchLower = data.searchTerm.toLowerCase()
          return item.destino?.toLowerCase().includes(searchLower) ||
                 item.acopio_pallets?.codigo_pallet?.toLowerCase().includes(searchLower) ||
                 item.guias?.packing?.toLowerCase().includes(searchLower) ||
                 `${item.profiles?.nombre} ${item.profiles?.apellido}`.toLowerCase().includes(searchLower)
        })
      }

      setData(prev => ({
        ...prev,
        packing: filteredData,
        loading: false
      }))

    } catch (error) {
      console.error("Error fetching packing data:", error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const exportData = () => {
    const csvData = [
      ['Fecha', 'Pallet', 'Tipo', 'Destino', 'Cantidad', 'Viaje', 'Responsable'],
      ...data.packing.map(item => [
        formatDatePeru(new Date(item.fecha_packing)),
        item.acopio_pallets?.codigo_pallet,
        item.guias?.packing,
        item.destino,
        item.cantidad_procesada,
        item.guias?.viaje,
        `${item.profiles?.nombre} ${item.profiles?.apellido}`
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = `packing_datos_${new Date().toISOString().split('T')[0]}.csv`
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
            {/* Destino */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Destino</label>
              <Select value={data.selectedDestino} onValueChange={(value) => setData(prev => ({ ...prev, selectedDestino: value }))}>
                <SelectTrigger>
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

            {/* Rango de Fechas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rango de Fechas</label>
              <DateRangePicker
                date={data.dateRange}
                onDateChange={(dateRange) => setData(prev => ({ ...prev, dateRange }))}
                placeholder="Seleccionar período"
              />
            </div>

            {/* Espacio vacío para alineación */}
            <div></div>
          </div>

          {/* Búsqueda y Exportar */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en packing..."
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
              <Package className="h-5 w-5" />
              Datos de Packing
            </span>
            <Badge variant="secondary">
              {data.packing.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>
            Historial completo de procesos de empaque con detalles de pallets y destinos
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                      <div className="flex items-center gap-2">
                        Fecha {data.sortBy === 'fecha' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Pallet</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                      <div className="flex items-center gap-2">
                        Cantidad {data.sortBy === 'cantidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Viaje</TableHead>
                    <TableHead>Responsable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.packing.slice(0, 50).map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDatePeru(new Date(item.fecha_packing))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.acopio_pallets?.codigo_pallet}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.guias?.packing === 'PKG LA GRANJA' ? 'default' :
                          item.guias?.packing === 'PKG SAFCO' ? 'secondary' : 'outline'
                        }>
                          {item.guias?.packing || 'Sin tipo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.destino}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.cantidad_procesada.toLocaleString()} jabas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Viaje #{item.guias?.viaje || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.profiles?.nombre} {item.profiles?.apellido}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data.packing.length === 0 && !data.loading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay datos disponibles</h3>
              <p className="text-muted-foreground">
                No se encontraron registros para los filtros aplicados.
              </p>
            </div>
          )}

          {data.packing.length > 50 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Mostrando los primeros 50 registros de {data.packing.length} totales.
                Use los filtros para refinar los resultados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
