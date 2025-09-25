import { z } from "zod"

export const recepcionSchema = z.object({
  id_lote: z.string().uuid("El lote es requerido"),
  cantidad_recibida: z.number().min(1, "La cantidad debe ser mayor a 0"),
  calidad: z.string().optional(),
  responsable_id: z.string().uuid("ID de responsable inválido"),
})

export const palletSchema = z.object({
  codigo_pallet: z.string().min(1, "El código de pallet es requerido"),
  capacidad: z.number().min(1, "La capacidad debe ser mayor a 0"),
  estado: z.enum(["vacio", "parcial", "lleno", "despachado"]),
  ubicacion: z.string().optional(),
})

export const cargaSchema = z.object({
  id_pallet: z.string().uuid("ID de pallet inválido"),
  id_recepcion: z.string().uuid("ID de recepción inválido"),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  responsable_id: z.string().uuid("ID de responsable inválido"),
})

export type RecepcionFormData = z.infer<typeof recepcionSchema>
export type PalletFormData = z.infer<typeof palletSchema>
export type CargaFormData = z.infer<typeof cargaSchema>
