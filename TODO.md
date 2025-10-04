# TODO - Clean Console Logs and Fix Build Error

## Tasks to Complete
- [x] Remove all console.log and console.error statements from lib/supabase/server.ts
- [x] Remove console.error from app/dashboard/acopio/recepcion/page.tsx
- [x] Add 'export const dynamic = 'force-dynamic'' to app/dashboard/acopio/recepcion/page.tsx to fix static rendering error

## Notes
- Console logs are causing clutter in the project output
- Build error occurs because the page uses cookies, preventing static rendering
- Dynamic rendering will allow the page to use cookies properly
