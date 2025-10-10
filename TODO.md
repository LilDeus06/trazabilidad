# TODO: Fix GUIAS Export and Date Handling

## Tasks
- [x] Update guia-form.tsx to save fecha_hora treating input as UTC (stores as Peru time)
- [x] Update date formatting functions in lib/utils/date.ts to display stored UTC as local time
- [x] Fix date filtering in app/api/guias/export/route.ts for new date storage
- [x] Make date filter in guias table affect the displayed data
- [x] Test export functionality for today's data
- [x] Verify date display shows correctly without conversions

# TODO: Add Turno Column to Guias

## Tasks
- [x] Create SQL script to add turno column to guias table
- [x] Update Guia interface in guia-form.tsx to include turno
- [x] Update formData in guia-form.tsx to include turno
- [x] Add turno select field to guia-form.tsx
- [x] Update guiaData in guia-form.tsx to include turno
- [x] Update Guia interface in guias-table.tsx to include turno
- [x] Add turno column to guias-table.tsx
- [x] Update app/dashboard/guias/page.tsx to fetch turno
- [x] Update app/dashboard/guias/[id]/editar/page.tsx to fetch turno
- [x] Update app/api/guias/export/route.ts to include turno in export
- [ ] Test creation and editing of guias with turno
