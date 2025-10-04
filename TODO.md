# TODO - Guías Module Date Range Filter Implementation

## Completed Tasks ✅
- [x] Created `components/ui/date-range-picker.tsx` component using Calendar and Popover
- [x] Modified `components/guias/guias-table.tsx`:
  - Added date range state management
  - Added date range picker above cards
  - Added "Total Guías Hoy" card
  - Changed export card to have two buttons: "Rango/Hoy" and "Todo"
  - Updated export logic to use date range or default to today
- [x] Updated `app/api/guias/export/route.ts`:
  - Added support for `start_date` and `end_date` query parameters
  - Added support for `full=true` parameter to export all data
  - Changed default behavior to export today's data when no filters
  - Updated filename generation for different export types

## Testing Required 🔍
- [ ] Test date range picker functionality
- [ ] Test export with date range selected
- [ ] Test export with no filter (should export today)
- [ ] Test export all data button
- [ ] Verify "Total Guías Hoy" calculation is correct
- [ ] Check that exported Excel files have correct data and filenames

## Notes 📝
- Used existing `react-day-picker` and `date-fns` dependencies
- Date filtering uses UTC timestamps for database queries
- Default export behavior changed from all data to today's data
- Added Spanish locale support for date formatting
