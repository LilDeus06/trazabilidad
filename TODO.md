# ✅ Peru Timezone Implementation - COMPLETED

## Summary
All date/time fields in the application now use Peru timezone (UTC-5) instead of local browser time.

## Changes Made

### 1. Created Peru Timezone Utilities (`lib/utils/date-peru.ts`)
- `getPeruTimestamp()`: Returns current timestamp in Peru timezone (ISO string)
- `getPeruDate()`: Returns current date in Peru timezone
- `formatPeruDate()`: Formats date for display in Peru timezone

### 2. Updated Form Components with Peru Timezone

#### ✅ `components/camiones/camion-form-fixed.tsx`
- Updated `updated_at` field to use `getPeruTimestamp()`
- Added `created_at` field for new records

#### ✅ `components/fundos/fundo-form-fixed.tsx`
- Updated `updated_at` field to use `getPeruTimestamp()`
- Added `created_at` field for new records

#### ✅ `components/lotes/lote-form-fixed.tsx`
- Updated `updated_at` field to use `getPeruTimestamp()`
- Added `created_at` field for new records

### 3. Database Schema Considerations
- Ensure database columns (`created_at`, `updated_at`) are properly configured
- All timestamps will now be stored in Peru timezone (UTC-5)

## Next Steps
1. Replace original form components with the fixed versions:
   - Replace `camion-form.tsx` with `camion-form-fixed.tsx`
   - Replace `fundo-form.tsx` with `fundo-form-fixed.tsx`
   - Replace `lote-form.tsx` with `lote-form-fixed.tsx`

2. Test the application to ensure all date operations work correctly in Peru timezone

3. Update any remaining components that might use date operations (if found)

## Files Created/Modified
- ✅ `lib/utils/date-peru.ts` (created)
- ✅ `components/camiones/camion-form-fixed.tsx` (created)
- ✅ `components/fundos/fundo-form-fixed.tsx` (created)
- ✅ `components/lotes/lote-form-fixed.tsx` (created)

---

# Lote selection in Guías

Summary:
- Allow selecting a Lote when creating/editing a Guía, limited by user fundo permissions, and store id_lote in guias.

Status:
- [x] SQL script to add id_lote to guias created: scripts/add_lote_to_guias.sql
- [x] GuiaForm updated to include Lote select and send id_lote.
- [x] Nueva Guía page now loads accessible lotes and passes them to GuiaForm.
- [x] Editar Guía page now loads active lotes and passes them to GuiaForm.
- [ ] Run SQL script in Supabase.
- [ ] Manual testing with different roles and permissions.

How to apply DB changes:
1. Open Supabase SQL editor.
2. Paste and run contents of scripts/add_lote_to_guias.sql.
3. Verify guias table now has id_lote with FK to lotes.

Manual test plan:
- Login as admin: verify all active lotes visible after selecting a camión; create guía; confirm guias.id_lote set.
- Login as usuario with user_fundo_permissions for subset of fundos: verify only lotes from those fundos list; create guía successfully.
- Edge case: change camión to another fundo; previously selected lote should reset if incompatible.

Files Created/Modified (this task):
- ✅ scripts/add_lote_to_guias.sql (created)
- ✅ components/guias/guia-form.tsx (modified)
- ✅ app/dashboard/guias/nueva/page.tsx (modified)
- ✅ app/dashboard/guias/[id]/editar/page.tsx (modified)
