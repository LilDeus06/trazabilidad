-- Alter guias table to support multiple lots
-- Run this once in your Supabase database

-- 1) Add new column for multiple lots (array of uuid)
ALTER TABLE public.guias
ADD COLUMN id_lotes uuid[];

-- 2) Migrate existing data from id_lote to id_lotes
UPDATE public.guias
SET id_lotes = ARRAY[id_lote]
WHERE id_lote IS NOT NULL;

-- 3) Drop the old column
ALTER TABLE public.guias
DROP COLUMN id_lote;

-- 4) Add index for better performance on array operations
CREATE INDEX idx_guias_id_lotes ON public.guias USING GIN (id_lotes);

-- Note:
-- - This changes the schema to support multiple lots per guia
-- - Existing data is migrated to the new array format
-- - The form and queries need to be updated to handle arrays
