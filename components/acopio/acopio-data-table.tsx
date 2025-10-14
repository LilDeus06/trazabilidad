"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Filter, Calendar, MapPin, Package, TrendingUp } from "lucide-react"
import { formatDateTimePeru, formatDatePeru } from "@/lib/utils/date"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface Recepcion {
  id: string
  created_at: string
  procedencia: string
  cantidad_recibida: number
  calidad?: string
  responsable_id?: string
  lotes?: {
    id: string
    nombre: string
    fundos?: {
      id: string
      nombre: string
    }
  }
  profiles?: {
    nombre: string
    apellido: string
  }
}

interface Pallet {
  id: string
  codigo_pallet: string
  capacidad: number
  estado: string
  created_at: string
  lotes?: {
    id: string
    nombre: string
    fundos?: {
      id: string
      nombre: string
    }
  }
  
}

interface Carga {
  id: string
  fecha_carga: string
  cantidad: number
  responsable_id?: string
  acopio_pallets?: {
    codigo_pallet: string
    estado: string
  }
  acopio_recepcion?: {
    fecha_recepcion: string
    lotes?: {
      nombre: string
      fundos?: {
        id: string
        nombre: string
      }
    }
  }
  profiles?: {
    nombre: string
    apellido: string
  }
}

interface AcopioData {
  recepciones: Recepcion[]
  pallets: Pallet[]
  cargas: Carga[]
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
  currentView: 'pallets',
    sortBy: 'fecha_recepcion',
    sortOrder: 'desc'
  })

  const [fundos, setFundos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    fetchFundos()
  }, [])

  useEffect(() => {
    fetchData()
  }, [data.currentView, data.selectedFundo, data.selectedEstado, data.dateRange, data.sortBy, data.sortOrder])

  const fetchFundos = async () => {
    const supabase = createClient()
    const { data: fundosData } = await supabase
      .from("fundos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
    setFundos(fundosData || [])
  }

  const fetchData = async () => {
    const supabase = createClient()
    setData(prev => ({ ...prev, loading: true }))

    try {
      if (data.currentView === 'recepciones') {
        await fetchRecepciones(supabase)
      } else if (data.currentView === 'pallets') {
        await fetchPallets(supabase)
      } else {
        await fetchCargas(supabase)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchRecepciones = async (supabase: any) => {
    let query = supabase
      .from('acopio_recepcion')
      .select(`
        *,
        lotes:id_lote (
          id,
          nombre,
          fundos:id_fundo (
            id,
            nombre
          )
        )
      `)

    // Filtro de fecha
    if (data.dateRange?.from && data.dateRange?.to) {
      query = query
        .gte('fecha_recepcion', data.dateRange.from.toISOString())
        .lte('fecha_recepcion', data.dateRange.to.toISOString())
    }

    // Ordenamiento
    const sortField = data.sortBy === 'fecha' ? 'fecha_recepcion' :
                     data.sortBy === 'cantidad' ? 'cantidad_recibida' : data.sortBy
    query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

    const { data: result, error } = await query

    if (error) throw error

    // Obtener los perfiles de los responsables
    const recepciones = (result || []) as Recepcion[]
    const responsableIds = recepciones
      .map(r => r.responsable_id)
      .filter(Boolean)
    
    let profilesMap: Record<string, any> = {}
    if (responsableIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', responsableIds)
      
      if (profiles) {
        profilesMap = profiles.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    // Agregar perfiles a las recepciones
    const recepcionesConPerfiles = recepciones.map(r => ({
      ...r,
      profiles: r.responsable_id ? profilesMap[r.responsable_id] : null
    }))

    // Filtrar por fundo y búsqueda en memoria
    let filteredData = recepcionesConPerfiles
    
    if (data.selectedFundo !== "all") {
      filteredData = filteredData.filter((item: Recepcion) => 
        item.lotes?.fundos?.id === data.selectedFundo
      )
    }

    if (data.searchTerm) {
      const searchLower = data.searchTerm.toLowerCase()
      filteredData = filteredData.filter((item: Recepcion) =>
        item.procedencia?.toLowerCase().includes(searchLower) ||
        item.calidad?.toLowerCase().includes(searchLower) ||
        item.lotes?.fundos?.nombre?.toLowerCase().includes(searchLower) ||
        item.lotes?.nombre?.toLowerCase().includes(searchLower) ||
        `${item.profiles?.nombre} ${item.profiles?.apellido}`.toLowerCase().includes(searchLower)
      )
    }

    setData(prev => ({
      ...prev,
      recepciones: filteredData,
      loading: false
    }))
  }

  const fetchPallets = async (supabase: any) => {
    let query = supabase
      .from('acopio_pallets')
      .select(`
        *,
          lotes:id_lote (
          id,
          nombre,
          tipo_cultivo,
          variedad,
          fundos:id_fundo (
            id,
            nombre
          )
        )

      `)

    // Filtro de fecha
    if (data.dateRange?.from && data.dateRange?.to) {
      query = query
        .gte('created_at', data.dateRange.from.toISOString())
        .lte('created_at', data.dateRange.to.toISOString())
    }

    // Filtro de estado
    if (data.selectedEstado !== "all") {
      query = query.eq('estado', data.selectedEstado)
    }

    // Ordenamiento
    const sortField = data.sortBy === 'fecha' ? 'created_at' :
                     data.sortBy === 'cantidad' ? 'capacidad' : data.sortBy
    query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

    const { data: result, error } = await query

    if (error) throw error

    // Filtrar por fundo y búsqueda en memoria
    let filteredData = (result || []) as Pallet[]
    
    if (data.selectedFundo !== "all") {
      filteredData = filteredData.filter((item: Pallet) => 
        item.lotes?.fundos?.id === data.selectedFundo
      )
    }

    if (data.searchTerm) {
      const searchLower = data.searchTerm.toLowerCase()
      filteredData = filteredData.filter((item: Pallet) =>
        item.codigo_pallet?.toLowerCase().includes(searchLower) ||
        item.estado?.toLowerCase().includes(searchLower) ||
        item.lotes?.fundos?.nombre?.toLowerCase().includes(searchLower) ||
        item.lotes?.nombre?.toLowerCase().includes(searchLower)
      )
    }

    setData(prev => ({
      ...prev,
      pallets: filteredData,
      loading: false
    }))
  }

  const fetchCargas = async (supabase: any) => {
    let query = supabase
      .from('acopio_carga')
      .select(`
        *,
        acopio_pallets:id_pallet (
          codigo_pallet,
          estado
        ),
        acopio_recepcion:id_recepcion (
          fecha_recepcion,
          lotes:id_lote (
            nombre,
            fundos:id_fundo (
              id,
              nombre
            )
          )
        )
      `)

    // Filtro de fecha
    if (data.dateRange?.from && data.dateRange?.to) {
      query = query
        .gte('fecha_carga', data.dateRange.from.toISOString())
        .lte('fecha_carga', data.dateRange.to.toISOString())
    }

    // Ordenamiento
    const sortField = data.sortBy === 'fecha' ? 'fecha_carga' :
                     data.sortBy === 'cantidad' ? 'cantidad' : data.sortBy
    query = query.order(sortField, { ascending: data.sortOrder === 'asc' })

    const { data: result, error } = await query

    if (error) throw error

    // Obtener los perfiles de los responsables
    const cargas = (result || []) as Carga[]
    const responsableIds = cargas
      .map(c => c.responsable_id)
      .filter(Boolean)
    
    let profilesMap: Record<string, any> = {}
    if (responsableIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', responsableIds)
      
      if (profiles) {
        profilesMap = profiles.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    // Agregar perfiles a las cargas
    const cargasConPerfiles = cargas.map(c => ({
      ...c,
      profiles: c.responsable_id ? profilesMap[c.responsable_id] : null
    }))

    // Filtrar por fundo y búsqueda en memoria
    let filteredData = cargasConPerfiles
    
    if (data.selectedFundo !== "all") {
      filteredData = filteredData.filter((item: Carga) => 
        item.acopio_recepcion?.lotes?.fundos?.id === data.selectedFundo
      )
    }

    if (data.searchTerm) {
      const searchLower = data.searchTerm.toLowerCase()
      filteredData = filteredData.filter((item: Carga) =>
        item.acopio_pallets?.codigo_pallet?.toLowerCase().includes(searchLower) ||
        item.acopio_recepcion?.lotes?.fundos?.nombre?.toLowerCase().includes(searchLower) ||
        item.acopio_recepcion?.lotes?.nombre?.toLowerCase().includes(searchLower) ||
        `${item.profiles?.nombre} ${item.profiles?.apellido}`.toLowerCase().includes(searchLower)
      )
    }

    setData(prev => ({
      ...prev,
      cargas: filteredData,
      loading: false
    }))
  }

  const exportData = () => {
    const currentData = data.currentView === 'recepciones' ? data.recepciones :
                       data.currentView === 'pallets' ? data.pallets : data.cargas

    const csvData = [
      // Headers
      data.currentView === 'recepciones' ?
        ['Fecha', 'Procedencia', 'Cantidad', 'Calidad', 'Fundo', 'Lote', 'Responsable'] :
      data.currentView === 'pallets' ?
        ['Código', 'Capacidad', 'Estado', 'Fundo', 'Lote', 'Fecha Creación'] :
        ['Fecha Carga', 'Pallet', 'Cantidad', 'Fundo', 'Lote', 'Responsable'],
      // Data
      ...currentData.map((item) => {
        if (data.currentView === 'recepciones') {
          const recepcion = item as Recepcion
          return [
            formatDatePeru(new Date(recepcion.created_at)),
            recepcion.procedencia || '',
            recepcion.cantidad_recibida || 0,
            recepcion.calidad || '',
            recepcion.lotes?.fundos?.nombre || '',
            recepcion.lotes?.nombre || '',
            `${recepcion.profiles?.nombre || ''} ${recepcion.profiles?.apellido || ''}`
          ]
        } else if (data.currentView === 'pallets') {
          const pallet = item as Pallet
          return [
            pallet.codigo_pallet || '',
            pallet.capacidad || 0,
            pallet.estado || '',
            pallet.lotes?.fundos?.nombre || '',
            pallet.lotes?.nombre || '',
            formatDatePeru(new Date(pallet.created_at))
          ]
        } else {
          const carga = item as Carga
          return [
            formatDatePeru(new Date(carga.fecha_carga)),
            carga.acopio_pallets?.codigo_pallet || '',
            carga.cantidad || 0,
            carga.acopio_recepcion?.lotes?.fundos?.nombre || '',
            carga.acopio_recepcion?.lotes?.nombre || '',
            `${carga.profiles?.nombre || ''} ${carga.profiles?.apellido || ''}`
          ]
        }
      })
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
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
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo Cultivo</TableHead>
                        <TableHead>Variedad</TableHead>
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
                        <TableHead>Tipo Cultivo</TableHead>
                        <TableHead>Variedad</TableHead>
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                          <div className="flex items-center gap-2">
                            Cantidad {data.sortBy === 'cantidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                          </div>
                        </TableHead>
                        <TableHead>Fundo</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo Cultivo</TableHead>
                        <TableHead>Variedad</TableHead>
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
                              {formatDatePeru(new Date((item as Recepcion).created_at))}
                            </div>
                          </TableCell>
                          
                          <TableCell>{(item as Recepcion).procedencia}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(item as Recepcion).cantidad_recibida?.toLocaleString()} jabas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              (item as Recepcion).calidad === 'Excelente' ? 'default' :
                              (item as Recepcion).calidad === 'Bueno' ? 'secondary' :
                              (item as Recepcion).calidad === 'Regular' ? 'outline' : 'destructive'
                            }>
                              {(item as Recepcion).calidad || 'Sin calificar'}
                            </Badge>
                          </TableCell>
                          <TableCell>{(item as Recepcion).lotes?.fundos?.nombre || '-'}</TableCell>
                          <TableCell>{(item as Recepcion).lotes?.nombre || '-'}</TableCell>
                          <TableCell>
                            {(item as Recepcion).profiles?.nombre} {(item as Recepcion).profiles?.apellido}
                          </TableCell>
                          
                        </>
                      ) : data.currentView === 'pallets' ? (
                        <>
                          <TableCell className="font-mono">{(item as Pallet).codigo_pallet}</TableCell>
                          <TableCell>{(item as Pallet).capacidad} jabas</TableCell>
                          <TableCell>
                            <Badge variant={
                              (item as Pallet).estado === 'vacio' ? 'secondary' :
                              (item as Pallet).estado === 'parcial' ? 'outline' :
                              (item as Pallet).estado === 'lleno' ? 'default' :
                              (item as Pallet).estado === 'despachado' ? 'destructive' : 'secondary'
                            }>
                              {(item as Pallet).estado}
                            </Badge>
                          </TableCell>
                          <TableCell>{(item as Pallet).lotes?.fundos?.nombre || '-'}</TableCell>
                          <TableCell>{(item as Pallet).lotes?.nombre || '-'}</TableCell>
                          <TableCell>{formatDatePeru(new Date((item as Pallet).created_at))}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDatePeru(new Date((item as Carga).fecha_carga))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {(item as Carga).acopio_pallets?.codigo_pallet || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(item as Carga).cantidad} jabas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(item as Carga).acopio_recepcion?.lotes?.fundos?.nombre || '-'}
                          </TableCell>
                          <TableCell>
                            {(item as Carga).acopio_recepcion?.lotes?.nombre || '-'}
                          </TableCell>
                          <TableCell>
                            {(item as Carga).profiles?.nombre} {(item as Carga).profiles?.apellido}
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