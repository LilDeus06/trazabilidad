"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { palletSchema, type PalletFormData } from "@/lib/validations/acopio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface PalletFormProps {
  onSuccess?: () => void
  initialData?: Partial<PalletFormData>
  isEditing?: boolean
}

export function PalletForm({ onSuccess, initialData, isEditing = false }: PalletFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PalletFormData>({
    resolver: zodResolver(palletSchema),
    defaultValues: {
      estado: "vacio",
      ...initialData,
    },
  })

  const estado = watch("estado")

  const onSubmit = async (data: PalletFormData) => {
    setIsLoading(true)
    try {
      if (isEditing && initialData?.codigo_pallet) {
        const { error } = await supabase
          .from("acopio_pallets")
          .update(data)
          .eq("codigo_pallet", initialData.codigo_pallet)
        if (error) throw error
      } else {
        const { error } = await supabase.from("acopio_pallets").insert([data])
        if (error) throw error
      }

      reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error saving pallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Pallet" : "Nuevo Pallet"}</CardTitle>
        <CardDescription>
          {isEditing ? "Modifica los datos del pallet" : "Registra un nuevo pallet en el sistema"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_pallet">Código de Pallet</Label>
              <Input
                id="codigo_pallet"
                placeholder="Ej: P-001"
                {...register("codigo_pallet")}
                className={errors.codigo_pallet ? "border-red-500" : ""}
                disabled={isEditing}
              />
              {errors.codigo_pallet && <p className="text-sm text-red-500">{errors.codigo_pallet.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad (kg)</Label>
              <Input
                id="capacidad"
                type="number"
                min="1"
                placeholder="Ej: 1000"
                {...register("capacidad", { valueAsNumber: true })}
                className={errors.capacidad ? "border-red-500" : ""}
              />
              {errors.capacidad && <p className="text-sm text-red-500">{errors.capacidad.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={(value) => setValue("estado", value as any)}>
                <SelectTrigger className={errors.estado ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacio">Vacío</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="lleno">Lleno</SelectItem>
                  <SelectItem value="despachado">Despachado</SelectItem>
                </SelectContent>
              </Select>
              {errors.estado && <p className="text-sm text-red-500">{errors.estado.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                placeholder="Ej: Sector A, Fila 1"
                {...register("ubicacion")}
                className={errors.ubicacion ? "border-red-500" : ""}
              />
              {errors.ubicacion && <p className="text-sm text-red-500">{errors.ubicacion.message}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar Pallet" : "Registrar Pallet"}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
