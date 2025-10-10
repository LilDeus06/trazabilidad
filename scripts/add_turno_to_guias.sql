-- Add turno column to guias table
ALTER TABLE public.guias
ADD COLUMN turno text DEFAULT 'Diurno'
CHECK (turno IN ('Diurno', 'Nocturno'));
