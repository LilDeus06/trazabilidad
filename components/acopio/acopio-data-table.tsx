"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Filter, Calendar, MapPin, Package } from "lucide-react"
import { formatDatePeru } from "@/lib/utils/date"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import * as XLSX from 'xlsx'


interface Pallet {
  id: string
  codigo_pallet: string
  capacidad: number
  estado: string
  created_at: string
  fundo_nombre?: string
  lote_nombre?: string
  fecha?: string
  hora?: string
  lotes?: {
    id: string
    nombre: string
    tipo_cultivo?: string
    variedad?: string
    fundos?: {
      id: string
      nombre: string
    }
  }
  fundos?: {
    id: string
    nombre: string
  }
}

interface AcopioData {
  pallets: Pallet[]
  loading: boolean
  searchTerm: string
  selectedFundo: string
  selectedEstado: string
  dateRange: DateRange | undefined
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function AcopioDataTable() {
  const [data, setData] = useState<AcopioData>({
    pallets: [],
    loading: true,
    searchTerm: "",
    selectedFundo: "all",
    selectedEstado: "all",
    dateRange: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [fundos, setFundos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    fetchFundos()
  }, [])

  useEffect(() => {
    fetchPallets()
  }, [data.selectedFundo, data.selectedEstado, data.dateRange, data.sortBy, data.sortOrder])

  const fetchFundos = async () => {
    const supabase = createClient()
    const { data: fundosData } = await supabase
      .from("fundos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
    setFundos(fundosData || [])
  }

  const fetchPallets = async () => {
    const supabase = createClient()
    setData(prev => ({ ...prev, loading: true }))

    try {
      let query = supabase
        .from('acopio_pallets')
        .select(`
          id,
          codigo_pallet,
          capacidad,
          estado,
          created_at,
          fundo_nombre,
          lote_nombre,
          fecha,
          hora,
          lotes:id_lote (
            id,
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
      let filteredData = (result || []) as unknown as Pallet[]
      
      if (data.selectedFundo !== "all") {
        filteredData = filteredData.filter((item: Pallet) => 
          item.lotes?.fundos?.id === data.selectedFundo || 
          item.fundos?.id === data.selectedFundo
        )
      }

      if (data.searchTerm) {
        const searchLower = data.searchTerm.toLowerCase()
        filteredData = filteredData.filter((item: Pallet) =>
          item.codigo_pallet?.toLowerCase().includes(searchLower) ||
          item.estado?.toLowerCase().includes(searchLower) ||
          item.fundo_nombre?.toLowerCase().includes(searchLower) ||
          item.lote_nombre?.toLowerCase().includes(searchLower) ||
          item.lotes?.fundos?.nombre?.toLowerCase().includes(searchLower) ||
          item.lotes?.nombre?.toLowerCase().includes(searchLower) ||
          item.lotes?.tipo_cultivo?.toLowerCase().includes(searchLower) ||
          item.lotes?.variedad?.toLowerCase().includes(searchLower) ||
          item.fundos?.nombre?.toLowerCase().includes(searchLower)
        )
      }

      setData(prev => ({
        ...prev,
        pallets: filteredData,
        loading: false
      }))
    } catch (error) {
      console.error("Error fetching pallets:", error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const exportAcopioPalletsToExcel = (pallets: Pallet[]) => {
  const wb = XLSX.utils.book_new()

  // Hoja principal con todos los pallets
  const palletsData = [
    ['DATOS DE PALLETS DE ACOPIO'],
    [''],
    ['Código', 'Capacidad', 'Estado', 'Fundo', 'Lote', 'Tipo Cultivo', 'Variedad', 'Fecha Creación', 'Hora', 'Fecha Formato'],
    ...pallets.map(pallet => [
      pallet.codigo_pallet || '',
      pallet.capacidad || 0,
      pallet.estado || '',
      pallet.fundo_nombre || pallet.fundos?.nombre || pallet.lotes?.fundos?.nombre || '',
      pallet.lote_nombre || pallet.lotes?.nombre || '',
      pallet.lotes?.tipo_cultivo || '',
      pallet.lotes?.variedad || '',
      formatDatePeru(new Date(pallet.created_at)),
      pallet.hora || '',
      pallet.fecha || ''
    ])
  ]
  const wsPallets = XLSX.utils.aoa_to_sheet(palletsData)
  XLSX.utils.book_append_sheet(wb, wsPallets, 'Pallets')

  // Hoja de resumen por estado
  const estadosMap = new Map<string, number>()
  pallets.forEach(p => {
    const estado = p.estado || 'Sin estado'
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)
  })
  
  const resumenEstados = [
    ['RESUMEN POR ESTADO'],
    [''],
    ['Estado', 'Cantidad', 'Porcentaje'],
    ...Array.from(estadosMap.entries()).map(([estado, cantidad]) => [
      estado,
      cantidad,
      `${pallets.length > 0 ? Math.round((cantidad / pallets.length) * 100) : 0}%`
    ])
  ]
  const wsEstados = XLSX.utils.aoa_to_sheet(resumenEstados)
  XLSX.utils.book_append_sheet(wb, wsEstados, 'Resumen Estados')

  // Hoja de resumen por fundo
  const fundosMap = new Map<string, { cantidad: number; capacidad: number }>()
  pallets.forEach(p => {
    const fundo = p.fundo_nombre || p.fundos?.nombre || p.lotes?.fundos?.nombre || 'Sin fundo'
    const existing = fundosMap.get(fundo)
    if (existing) {
      existing.cantidad++
      existing.capacidad += p.capacidad || 0
    } else {
      fundosMap.set(fundo, { cantidad: 1, capacidad: p.capacidad || 0 })
    }
  })

  const resumenFundos = [
    ['RESUMEN POR FUNDO'],
    [''],
    ['Fundo', 'Cantidad Pallets', 'Capacidad Total'],
    ...Array.from(fundosMap.entries()).map(([fundo, data]) => [
      fundo,
      data.cantidad,
      data.capacidad
    ])
  ]
  const wsFundos = XLSX.utils.aoa_to_sheet(resumenFundos)
  XLSX.utils.book_append_sheet(wb, wsFundos, 'Resumen Fundos')

  const fileName = `acopio_pallets_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

  const handleSort = (field: string) => {
    setData(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'acopio': return 'secondary'
      case 'packing': return 'default'
      default: return 'secondary'
    }
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            {/* Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={data.selectedEstado} onValueChange={(value) => setData(prev => ({ ...prev, selectedEstado: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acopio">Acopio</SelectItem>
                  <SelectItem value="packing">Packing</SelectItem>
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
          </div>

          {/* Búsqueda y Exportar */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, estado, fundo, lote, cultivo..."
                  value={data.searchTerm}
                  onChange={(e) => setData(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={() => exportAcopioPalletsToExcel(data.pallets)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pallets */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pallets de Acopio
            </span>
            <Badge variant="secondary">
              {data.pallets.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>
            Estado actual de todos los pallets con información detallada de ubicación, capacidad y trazabilidad
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('codigo_pallet')}>
                      <div className="flex items-center gap-2">
                        Código {data.sortBy === 'codigo_pallet' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('capacidad')}>
                      <div className="flex items-center gap-2">
                        Capacidad {data.sortBy === 'capacidad' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fundo</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Tipo Cultivo</TableHead>
                    <TableHead>Variedad</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center gap-2">
                        Fecha {data.sortBy === 'created_at' && (data.sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pallets.map((pallet) => (
                    <TableRow key={pallet.id}>
                      <TableCell className="font-mono font-semibold">
                        {pallet.codigo_pallet}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pallet.capacidad} jabas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(pallet.estado)}>
                          {pallet.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {pallet.fundo_nombre || pallet.fundos?.nombre || pallet.lotes?.fundos?.nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pallet.lote_nombre || pallet.lotes?.nombre || '-'}
                      </TableCell>
                      <TableCell>
                        {pallet.lotes?.tipo_cultivo || '-'}
                      </TableCell>
                      <TableCell>
                        {pallet.lotes?.variedad || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {pallet.fecha || formatDatePeru(new Date(pallet.created_at))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pallet.hora || new Date(pallet.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data.pallets.length === 0 && !data.loading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay pallets disponibles</h3>
              <p className="text-muted-foreground">
                No se encontraron pallets para los filtros aplicados.
              </p>
            </div>
          )}

          {data.pallets.length > 100 && (
            <div className="text-center py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {data.pallets.length} pallets. Use los filtros para refinar los resultados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}