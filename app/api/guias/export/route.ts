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

    // Build query
    let query = supabase
      .from('guias')
      .select(`
        *,
        camiones (
          chofer,
          placa,
          capacidad,
          fundos (
            nombre
          )
        ),
        fundos (
          nombre
        )
      `)
      .order('fecha_hora', { ascending: false })

    // Apply date filter if provided
    if (startDateParam && endDateParam) {
      const startDate = new Date(`${startDateParam}T00:00:00.000Z`)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1) // Include the end date fully

      query = query
        .gte('fecha_hora', startDate.toISOString())
        .lt('fecha_hora', endDate.toISOString())
    }

    const { data: guias, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Get lotes and quantities for each guia
    const guiasWithLotes = await Promise.all(
      (guias || []).map(async (guia) => {
        if (guia.id_lotes && guia.id_lotes.length > 0) {
          // Get lotes info
          const { data: lotes } = await supabase
            .from('lotes')
            .select('id, nombre, variedad')
            .in('id', guia.id_lotes)

          // Get quantities from guia_lotes
          const { data: guiaLotes } = await supabase
            .from('guia_lotes')
            .select('lote_id, cantidad')
            .eq('guia_id', guia.id)

          // Check if guia_lotes has individual quantities that sum to guia.enviadas
          const totalFromGuiaLotes = guiaLotes?.reduce((sum, gl) => sum + gl.cantidad, 0) || 0
          const hasIndividualQuantities = totalFromGuiaLotes === guia.enviadas

          // Combine lotes with quantities
          const lotesWithQuantities = (lotes || []).map(lote => {
            const guiaLote = guiaLotes?.find(gl => gl.lote_id === lote.id)
            let cantidad = guiaLote?.cantidad || 0

            // If no individual quantities or they don't sum correctly, distribute the total
            if (!hasIndividualQuantities || !guiaLote) {
              cantidad = guia.id_lotes.length === 1 ? guia.enviadas : Math.floor(guia.enviadas / guia.id_lotes.length)
            }

            return {
              ...lote,
              cantidad
            }
          })

          return { ...guia, lotes: lotesWithQuantities }
        }
        return { ...guia, lotes: [] }
      })
    )

    // Get user profiles
    const userIds = guiasWithLotes.map(g => g.usuario_id).filter((id, index, arr) => arr.indexOf(id) === index)
    const { data: users } = userIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, nombre, apellido')
      .in('id', userIds) : { data: [] }

    const userMap = new Map(users?.map(u => [u.id, { nombre: u.nombre, apellido: u.apellido }]) || [])

    // Prepare data for Excel - one row per lote
    const excelData: any[] = []
    guiasWithLotes.forEach(guia => {
      if (guia.lotes && guia.lotes.length > 0) {
        guia.lotes.forEach((lote: { nombre: string; cantidad: number; variedad: string }) => {
          excelData.push({
            'Fecha y Hora': formatDateTimePeru(guia.fecha_hora),
            'Camión': guia.camiones.placa,
            'Chofer': guia.camiones.chofer,
            'Fundo': guia.camiones.fundos?.nombre || guia.fundos?.nombre || 'N/A',
            'Lote': lote.nombre,
            'Variedad': lote.variedad || 'N/A',
            'Cantidad (Jabas)': lote.cantidad,
            'Guía': guia.guias,
            'Turno': guia.turno || 'Diurno',
            'Jabas Enviadas Total': guia.enviadas,
            'Usuario': userMap.get(guia.usuario_id) ?
              `${userMap.get(guia.usuario_id)?.nombre} ${userMap.get(guia.usuario_id)?.apellido}` :
              guia.usuario_id
          })
        })
      } else {
        // If no lotes, still add a row with empty lote info
        excelData.push({
          'Fecha y Hora': formatDateTimePeru(guia.fecha_hora),
          'Camión': guia.camiones.placa,
          'Chofer': guia.camiones.chofer,
          'Fundo': guia.camiones.fundos?.nombre || guia.fundos?.nombre || 'N/A',
          'Lote': 'Sin lotes',
          'Variedad': 'N/A',
          'Cantidad (Jabas)': 0,
          'Guía': guia.guias,
          'Turno': guia.turno || 'Diurno',
          'Jabas Enviadas Total': guia.enviadas,
          'Usuario': userMap.get(guia.usuario_id) ?
            `${userMap.get(guia.usuario_id)?.nombre} ${userMap.get(guia.usuario_id)?.apellido}` :
            guia.usuario_id
        })
      }
    })

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Fecha y Hora
      { wch: 15 }, // Camión
      { wch: 20 }, // Chofer
      { wch: 15 }, // Fundo
      { wch: 25 }, // Lote
      { wch: 20 }, // Variedad
      { wch: 18 }, // Cantidad (Jabas)
      { wch: 15 }, // Guía
      { wch: 12 }, // Turno
      { wch: 20 }, // Jabas Enviadas Total
      { wch: 25 }  // Usuario
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Guías')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    const filename = startDateParam && endDateParam ?
      `guias_${startDateParam}_a_${endDateParam}.xlsx` :
      `guias_${new Date().toISOString().split('T')[0]}.xlsx`

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
