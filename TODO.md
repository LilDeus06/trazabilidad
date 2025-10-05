# TODO: Fix GUIAS Export and Date Handling

## Tasks
- [x] Update guia-form.tsx to save fecha_hora treating input as UTC (stores as Peru time)
- [x] Update date formatting functions in lib/utils/date.ts to display stored UTC as local time
- [x] Fix date filtering in app/api/guias/export/route.ts for new date storage
- [x] Make date filter in guias table affect the displayed data
- [x] Test export functionality for today's data
- [x] Verify date display shows correctly without conversions
