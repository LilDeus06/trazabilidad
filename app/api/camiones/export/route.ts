import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { formatDateTimePeru, formatDatePeru } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('start_date')
    const endDateParam = searchParams.get('end_date')
    const full = searchParams.get('full') === 'true'

    // Build query for camiones
    let query = supabase
      .from('camiones')
      .select(`
        *,
        fundos (
          nombre,
          ubicacion
        ),
        lotes (
          nombre,
          fundos (
            nombre
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply date filter if provided and not full export
    if (!full && startDateParam && endDateParam) {
      const startDate = new Date(`${startDateParam}T00:00:00.000Z`)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1) // Include the end date fully

      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
    }

    const { data: camiones, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Prepare data for Excel
    const excelData: any[] = (camiones || []).map(camion => ({
      'ID': camion.id,
      'Chofer': camion.chofer,
      'Placa': camion.placa,
      'Capacidad (Jabas)': camion.capacidad,
      'Estado': camion.activo ? 'Activo' : 'Inactivo',
      'Fundo Asignado': camion.fundos?.nombre || 'Sin asignar',
      'Ubicación Fundo': camion.fundos?.ubicacion || 'N/A',
      'Lote Asignado': camion.lotes?.nombre || 'Sin asignar',
      'Fundo del Lote': camion.lotes?.fundos?.nombre || 'N/A',
      'Fecha Creación': formatDateTimePeru(camion.created_at),
      'Última Actualización': formatDateTimePeru(camion.updated_at)
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 36 }, // ID
      { wch: 25 }, // Chofer
      { wch: 15 }, // Placa
      { wch: 18 }, // Capacidad
      { wch: 12 }, // Estado
      { wch: 20 }, // Fundo Asignado
      { wch: 25 }, // Ubicación Fundo
      { wch: 20 }, // Lote Asignado
      { wch: 20 }, // Fundo del Lote
      { wch: 20 }, // Fecha Creación
      { wch: 20 }  // Última Actualización
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Camiones')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    const filename = full ?
      `camiones_completo_${new Date().toISOString().split('T')[0]}.xlsx` :
      startDateParam && endDateParam ?
        `camiones_${startDateParam}_a_${endDateParam}.xlsx` :
        `camiones_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
