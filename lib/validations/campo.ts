import { z } from "zod"

export const recoleccionSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  id_lote: z.string().uuid("El lote es requerido"),
  cantidad_recolectada: z.number().min(1, "La cantidad debe ser mayor a 0"),
  calidad: z.string().optional(),
  responsable_id: z.string().uuid("ID de responsable inválido"),
})

export const carretaSchema = z.object({
  numero_carreta: z.string().min(1, "El número de carreta es requerido"),
  capacidad: z.number().min(1, "La capacidad debe ser mayor a 0"),
  estado: z.enum(["disponible", "en_uso", "mantenimiento"]),
  id_recoleccion: z.string().uuid().optional(),
})

export type RecoleccionFormData = z.infer<typeof recoleccionSchema>
export type CarretaFormData = z.infer<typeof carretaSchema>
