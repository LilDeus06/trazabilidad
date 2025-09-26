-- Add id_fundo column to guias table
ALTER TABLE public.guias
ADD COLUMN id_fundo uuid;

-- Add foreign key constraint
ALTER TABLE public.guias
ADD CONSTRAINT guias_id_fundo_fkey FOREIGN KEY (id_fundo) REFERENCES public.fundos(id);

-- Update existing records to set id_fundo from camiones
UPDATE public.guias
SET id_fundo = camiones.id_fundo
FROM public.camiones
WHERE guias.id_camion = camiones.id;

-- Make the column NOT NULL after populating
ALTER TABLE public.guias
ALTER COLUMN id_fundo SET NOT NULL;
