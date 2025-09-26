-- Add id_lote to guias and reference lotes
-- Run this once in your Supabase database

-- 1) Add the new column (nullable initially)
ALTER TABLE public.guias
ADD COLUMN id_lote uuid;

-- 2) Add foreign key constraint to lotes(id)
ALTER TABLE public.guias
ADD CONSTRAINT guias_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id);

-- 3) Optional: Index for faster lookups by lote
CREATE INDEX idx_guias_id_lote ON public.guias(id_lote);

-- Note:
-- - Column left as NULLABLE to avoid backfilling issues.
-- - After rolling out UI and populating id_lote for all rows,
--   you may decide to enforce NOT NULL if your business rules require it:
--   ALTER TABLE public.guias ALTER COLUMN id_lote SET NOT NULL;
