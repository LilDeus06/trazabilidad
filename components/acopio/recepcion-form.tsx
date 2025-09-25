"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { recepcionSchema, type RecepcionFormData } from "@/lib/validations/acopio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Lote {
  id: string
  nombre: string
  fundos: {
    nombre: string
  }[]
}

interface RecepcionFormProps {
  userId: string
  onSuccess?: () => void
}

export function RecepcionForm({ userId, onSuccess }: RecepcionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingLotes, setLoadingLotes] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const { data, error } = await supabase
          .from("lotes")
          .select(`
            id,
            nombre,
            fundos (
              nombre
            )
          `)
          .eq("estado", "activo")
          .order("nombre")

        if (error) throw error
        setLotes(data || [])
      } catch (error) {
        console.error("Error fetching lotes:", error)
      } finally {
        setLoadingLotes(false)
      }
    }

    fetchLotes()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<RecepcionFormData>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: {
      responsable_id: userId,
    },
  })

  const onSubmit = async (data: RecepcionFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("acopio_recepcion").insert([data])

      if (error) throw error

      reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error creating recepcion:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Recepción</CardTitle>
        <CardDescription>Registra una nueva recepción de productos en acopio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_lote">Lote</Label>
            <Select onValueChange={(value) => setValue("id_lote", value)} disabled={loadingLotes}>
              <SelectTrigger className={errors.id_lote ? "border-red-500" : ""}>
                <SelectValue placeholder={loadingLotes ? "Cargando lotes..." : "Selecciona un lote"} />
              </SelectTrigger>
              <SelectContent>
                {lotes.map((lote) => (
                  <SelectItem key={lote.id} value={lote.id}>
                    {lote.nombre} - {lote.fundos?.[0]?.nombre || "Sin fundo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_lote && <p className="text-sm text-red-500">{errors.id_lote.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad_recibida">Cantidad Recibida (kg)</Label>
            <Input
              id="cantidad_recibida"
              type="number"
              min="1"
              placeholder="Ej: 2000"
              {...register("cantidad_recibida", { valueAsNumber: true })}
              className={errors.cantidad_recibida ? "border-red-500" : ""}
            />
            {errors.cantidad_recibida && <p className="text-sm text-red-500">{errors.cantidad_recibida.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="calidad">Evaluación de Calidad</Label>
            <Textarea
              id="calidad"
              placeholder="Observaciones sobre la calidad del producto recibido..."
              {...register("calidad")}
              className={errors.calidad ? "border-red-500" : ""}
            />
            {errors.calidad && <p className="text-sm text-red-500">{errors.calidad.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Recepción
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
