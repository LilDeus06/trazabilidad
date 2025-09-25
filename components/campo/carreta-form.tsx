"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { carretaSchema, type CarretaFormData } from "@/lib/validations/campo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface CarretaFormProps {
  onSuccess?: () => void
  initialData?: Partial<CarretaFormData>
  isEditing?: boolean
}

export function CarretaForm({ onSuccess, initialData, isEditing = false }: CarretaFormProps) {
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
  } = useForm<CarretaFormData>({
    resolver: zodResolver(carretaSchema),
    defaultValues: {
      estado: "disponible",
      ...initialData,
    },
  })

  const estado = watch("estado")

  const onSubmit = async (data: CarretaFormData) => {
    setIsLoading(true)
    try {
      if (isEditing && initialData?.numero_carreta) {
        const { error } = await supabase
          .from("campo_carreta")
          .update(data)
          .eq("numero_carreta", initialData.numero_carreta)
        if (error) throw error
      } else {
        const { error } = await supabase.from("campo_carreta").insert([data])
        if (error) throw error
      }

      reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error saving carreta:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Carreta" : "Nueva Carreta"}</CardTitle>
        <CardDescription>
          {isEditing ? "Modifica los datos de la carreta" : "Registra una nueva carreta en el sistema"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_carreta">Número de Carreta</Label>
              <Input
                id="numero_carreta"
                placeholder="Ej: C-001"
                {...register("numero_carreta")}
                className={errors.numero_carreta ? "border-red-500" : ""}
                disabled={isEditing}
              />
              {errors.numero_carreta && <p className="text-sm text-red-500">{errors.numero_carreta.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad (kg)</Label>
              <Input
                id="capacidad"
                type="number"
                min="1"
                placeholder="Ej: 500"
                {...register("capacidad", { valueAsNumber: true })}
                className={errors.capacidad ? "border-red-500" : ""}
              />
              {errors.capacidad && <p className="text-sm text-red-500">{errors.capacidad.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(value) => setValue("estado", value as any)}>
              <SelectTrigger className={errors.estado ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="en_uso">En Uso</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && <p className="text-sm text-red-500">{errors.estado.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar Carreta" : "Registrar Carreta"}
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
