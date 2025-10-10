-- Add packing column to guias table
ALTER TABLE public.guias
ADD COLUMN packing text
CHECK (packing IN ('PKG LA GRANJA', 'PKG SAFCO'));
