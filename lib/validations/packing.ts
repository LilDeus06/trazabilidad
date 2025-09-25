import { z } from "zod"

export const packingSchema = z.object({
  id_pallet: z.string().uuid("ID de pallet inválido"),
  cantidad_procesada: z.number().min(1, "La cantidad debe ser mayor a 0"),
  tipo_empaque: z.string().min(1, "El tipo de empaque es requerido"),
  destino: z.string().optional(),
  responsable_id: z.string().uuid("ID de responsable inválido"),
})

export type PackingFormData = z.infer<typeof packingSchema>
