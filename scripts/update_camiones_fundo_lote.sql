-- Agregar columnas de fundo y lote a la tabla camiones
ALTER TABLE public.camiones
ADD COLUMN IF NOT EXISTS id_fundo UUID REFERENCES public.fundos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS id_lote UUID REFERENCES public.lotes(id) ON DELETE SET NULL;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_camiones_id_fundo ON public.camiones(id_fundo);
CREATE INDEX IF NOT EXISTS idx_camiones_id_lote ON public.camiones(id_lote);

-- Actualizar políticas RLS para incluir permisos de fundo
-- Nota: Las políticas existentes se mantienen, pero se pueden extender si es necesario
-- para restringir acceso basado en fundos asignados al usuario

-- Comentarios sobre el uso:
-- - id_fundo: Referencia al fundo donde opera el camión
-- - id_lote: Referencia al lote específico donde opera el camión (opcional)
-- - Si id_lote está presente, id_fundo debe coincidir con el fundo del lote
